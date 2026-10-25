---
id: extra4-Software-optimization
title: 番外：软渲染器性能优化
sidebar_label: 番外：软渲染器性能优化
description: 从切线基预计算、重心坐标增量计算和纹理采样入手，优化 TypeScript 软渲染器
keywords:
  - 软渲染器
  - 性能优化
  - TypeScript
  - 重心坐标
  - 切线空间
  - WebGPU
---

import { RendererDemo, RendererDemos } from '../../src/components/rendererDemo';

上一篇我们把人头交给 WebGPU 来画，和左边的软渲染器一对比，速度差了不少。不过先别急着怪 CPU，我们之前为了把公式讲清楚，代码里藏了不少重复劳动。

比如说，切线和副切线只和当前三角形有关，为什么每个像素都要求一遍逆矩阵？判断像素在不在三角形里，又为什么每次都要重新算三角形的边和面积？这些计算，显卡再快也没必要做。

这篇番外我们回到 CPU，把这些地方收拾一下，看看同一个软渲染器能快多少。

> 本文源码 👉：[toy-renderer-ts/days/extra-webgpu-optimized](https://github.com/skychx/toy-renderer-ts/tree/main/days/extra-webgpu-optimized)

## 1.先把比较条件对齐

在项目根目录运行 `bun dev`，有两个页面可以来回对照：

| 页面 | 左边 | 右边 |
| --- | --- | --- |
| [未优化版](http://localhost:8080/extra-webgpu) | 前一篇的软渲染器 | WebGPU |
| [优化版](http://localhost:8080/extra-webgpu-optimized) | 这次优化后的软渲染器 | WebGPU |

两版用的都是同一组头部、双眼模型和贴图，相机、光照也一样，画布的内部分辨率都是 800×800。右边的 WebGPU 实现相同，这次动的只有左边 CPU 算像素的部分，最后仍然用 Canvas 2D 的 `putImageData()` 显示结果。

比较时，等模型加载好，先看默认视角的 FPS。两个软渲染器各自在一个 Worker 线程里跑，多核 CPU 上可以同时算，两个页面一起开着，读数也只差几个百分点。

优化版还是一份完整的代码，可以单独阅读、运行。想看具体改了什么，直接比较两个目录：

```bash
diff -ru days/extra-webgpu days/extra-webgpu-optimized
```

主要改了三块：

| 位置 | 原来 | 现在 |
| --- | --- | --- |
| `software.ts` | 每个像素重新求切线基 | 每个三角形算一次 |
| `gl.ts` | 每个候选像素重新构造向量、算叉乘 | 预计算边和面积，逐行增量计算 |
| `software.ts`、`texture.ts` | 创建很多临时数组，三张贴图分别算下标 | 热点展开成分量，同尺寸贴图共用下标 |

下面一块一块地看。

## 2.一个三角形，算一次切线就够了

### 2.1 哪些东西不会变

先看 day8 求切线的那段代码：

```ts
const [p0, p1, p2] = this.varyingTri;
const [uv0, uv1, uv2] = this.varyingUV;
const E: Mat = [sub(p1, p0), sub(p2, p0)];
const U: Mat = [
  [uv1[0] - uv0[0], uv1[1] - uv0[1]],
  [uv2[0] - uv0[0], uv2[1] - uv0[1]],
];
const [t, b] = matMul(inverse(U), E);
```

这里的三个位置、三个 uv，在处理完顶点以后就已经确定了，和当前像素的重心坐标 `bar` 没有半点关系。可我们把它放在 `fragment()` 里，一个三角形覆盖几千个像素，就会把同一个逆矩阵求几千遍。

最直接的改法，是给 `PhongShader` 加一个 `prepareTriangle()`，三个顶点处理完就调用它，把单位切线 T 和副切线 B 存下来：

```ts
tangentBasis: [Vec3, Vec3] | null = null;

prepareTriangle() {
  this.tangentBasis = null;
  const [p0, p1, p2] = this.varyingTri;
  const [uv0, uv1, uv2] = this.varyingUV;
  const E: Mat = [sub(p1, p0), sub(p2, p0)];
  const U: Mat = [
    [uv1[0] - uv0[0], uv1[1] - uv0[1]],
    [uv2[0] - uv0[0], uv2[1] - uv0[1]],
  ];
  if (Math.abs(U[0][0] * U[1][1] - U[0][1] * U[1][0]) > 1e-12) {
    const [t, b] = matMul(inverse(U), E);
    this.tangentBasis = [normalize(t as Vec3), normalize(b as Vec3)];
  }
}
```

注意开头先清成 `null`：如果这次的 uv 三角形退化了，不能拿上一个三角形的切线来凑数，要退回到插值出来的顶点法线。

画三角形的循环里，只多加一行：

```ts
for (let i = 0; i < model.nfaces(); i++) {
  const clip: Vec4[] = [shader.vertex(i, 0), shader.vertex(i, 1), shader.vertex(i, 2)];
  shader.prepareTriangle();
  triangle(clip, shader, Viewport, zbuffer, frame);
}
```

### 2.2 哪些东西还得每个像素算

不过不是所有计算都能搬出去。插值出来的法线 n、从法线贴图里读出的 nm，都会随着像素的位置变化。最后的：

$$
\vec{n}' = \operatorname{normalize}(\vec{T}n_{m,x} + \vec{B}n_{m,y} + \vec{n}n_{m,z})
$$

还是要每个像素算一遍。视线方向也一样，相机虽然没动，但不同像素在三维空间里的位置不一样，`normalize(-position)` 不能只算一次。

这一处优化没有改公式，只是把「每个三角形算一次」和「每个像素算一次」分清楚了。这也是最值得先找的一类优化：代码还很好懂，重复计算却能一下子少掉一大块。

## 3.重心坐标，一步一步加出来

### 3.1 先把固定的部分拿出去

day3 我们用叉乘求重心坐标，每个候选像素都构造两个三维向量，再做一次叉乘。可是对同一个三角形来说，AB、AC 和面积一直没变。

把公式展开就清楚了。记屏幕上的三个顶点为 A、B、C，当前像素为 P：

$$
\begin{aligned}
a_x &= B_x - A_x, & c_x &= C_x - A_x \\
a_y &= B_y - A_y, & c_y &= C_y - A_y \\
S &= a_xc_y - c_xa_y
\end{aligned}
$$

$S$ 是有向面积的两倍，只要三个顶点不变，它就不变。再定义两个随 P 变化的分子：

$$
u = c_x(A_y-P_y) - (A_x-P_x)c_y
$$

$$
v = (A_x-P_x)a_y - a_x(A_y-P_y)
$$

重心坐标就是：

$$
\left(\frac{S-u-v}{S},\ \frac{u}{S},\ \frac{v}{S}\right)
$$

这里的 u、v 只是两个分子的名字，和贴图的 uv 坐标没关系。

AB、AC、S 放到像素循环外面算一次。如果 $S=0$，整个三角形退化了，直接跳过，也不用进包围盒里挨个试了。

### 3.2 往右一步，只要加一下

再看看 u、v 的公式。如果沿着同一行往右走一个像素，$P_x$ 加 1，$P_y$ 不变：

$$
u_{\text{next}} = u + c_y, \qquad v_{\text{next}} = v - a_y
$$

也就是说，每行开头算一次 u、v，后面每往右走一步，只要做两次加减法：

```ts
const [A, B, C] = pts;
const abX = B[0] - A[0];
const acX = C[0] - A[0];
const abY = B[1] - A[1];
const acY = C[1] - A[1];
const area = abX * acY - acX * abY;
if (Math.abs(area) < 1) return;

const positiveArea = area > 0;
for (let y = minY; y <= maxY; y++) {
  const paY = A[1] - y;
  let u = acX * paY - (A[0] - minX) * acY;
  let v = (A[0] - minX) * abY - abX * paY;
  for (let x = minX; x <= maxX; x++, u += acY, v -= abY) {
    const sumUV = u + v;
    if (positiveArea ? u < 0 || v < 0 || sumUV > area : u > 0 || v > 0 || sumUV < area) {
      continue;
    }
    // 通过内外判断以后，再做除法、深度测试和透视校正
    const bc0 = 1 - sumUV / area;
    const bc1 = u / area;
    const bc2 = v / area;
    // ...后面的光照、写像素流程不变
  }
}
```

内外判断也提前了：不用先除以面积，直接比较 u、v、$S-u-v$ 的符号就行。面积是正数时，三个分子都得非负；面积是负数时，三个都得非正，所以代码里要分两种绕序处理。

我们之前把屏幕坐标取整了，这里的边分量、面积、分子也都是整数。在当前 800×800 的范围内，逐像素加减不会积累浮点误差。

剩下的流程照旧：先插值出深度，挡住的像素直接跳过；通过深度测试以后，才按三个顶点的 w 做透视校正、创建 `bar` 数组，再调用片元着色器。深度测试原本就有，这次是把更多工作挪到了它后面。

## 4.少创建一点数组，少算几次下标

### 4.1 公式没变，写法展开一点

我们的数学库用数组表示向量，写公式很舒服：

```ts
const uv = interpolate(this.varyingUV, bar);
const n = normalize(interpolate(this.varyingNormal, bar));
```

可每调用一次 `interpolate()`、`normalize()`，就会创建一个新数组。算一个像素不算什么，算几十万个像素，中间还有 `add()`、`scale()`、`sub()`，临时数组就很多了，算完还得等垃圾回收。

优化版在片元着色器的热点里，把这些计算展开成分量。比如 uv 插值变成：

```ts
const [uv0, uv1, uv2] = this.varyingUV;
const u = uv0[0] * bar[0] + uv1[0] * bar[1] + uv2[0] * bar[2];
const v = uv0[1] * bar[0] + uv1[1] * bar[1] + uv2[1] * bar[2];
```

法线的插值、归一化，切线空间变换和反射方向，也按同样的办法展开。代码会长一些，但公式、运算顺序都还是原来的。这些改动集中在最频繁执行的 `fragment()` 里，矩阵和模型加载那些地方继续用数学库，读起来方便。

当然，数组也没有全部消失：`bar`、插值后的位置、最终返回的 RGB，仍然保留。这里先把中间一层套一层的临时向量减下来就够了。

### 4.2 三张贴图，共用一个下标

每个像素要读漫反射、法线、高光三张贴图，原来每次 `get(u, v)` 都要把 uv 乘尺寸、取整、限幅，再创建一个 RGB 数组。

如果三张贴图尺寸一样，同一个 uv 对应的像素下标也一样，没必要算三次。所以把「计算下标」单独拆出来：

```ts
index(u: number, v: number): number {
  const x = Math.min(this.width - 1, Math.max(0, Math.floor(u * this.width)));
  const y = Math.min(this.height - 1, Math.max(0, Math.floor((1 - v) * this.height)));
  return (y * this.width + x) * 4;
}
```

片元着色器里先用漫反射贴图算一个下标，另外两张尺寸相同时直接复用；尺寸不同就按自己的尺寸重新算：

```ts
const index = diffuseMap.index(u, v);
const normalIndex = this.normalMatchesDiffuse ? index : normalMap.index(u, v);
const specularIndex = this.specularMatchesDiffuse ? index : specularMap.index(u, v);
const strength = specularMap.data[specularIndex] / 255;
```

`normalMatchesDiffuse`、`specularMatchesDiffuse` 在创建着色器时就检查好，每套材质分别检查，不能拿头部的尺寸去替双眼做决定。

再往下，直接从 `data[index]`、`data[index + 1]`、`data[index + 2]` 读需要的通道。高光只用红色通道，就不用专门创建一个三维数组了。v 翻转、越界限幅、法线解码和 Phong 光照都沿用原来的规则。

## 5.效果和帧率

下面把两版的软渲染器放在一起，左边是未优化的，右边是优化后的，帧率显示在右上角：

<RendererDemos title="左：未优化的软渲染器，右：优化后的软渲染器，均为 800×800">
  <RendererDemo src="extra-webgpu/software" title="软渲染器（未优化）" />
  <RendererDemo src="extra-webgpu-optimized/software" title="软渲染器（优化后）" />
</RendererDemos>

画面看起来一样，帧率却上去了。我们没有减少三角形，没有降低分辨率，也没有把法线贴图和高光关掉，只是少做了一些重复计算、少创建了一些临时数组。

FPS 只是当时的读数，不是固定跑分，换一台电脑、换一个浏览器都会变，等资源加载完成、帧率稳定以后再看。两块画布的相机是各自独立的，拖动过以后，要把两边转到同样的视角再比较：转到后脑勺和转到正脸，覆盖的像素、遮挡关系都变了，速度也会变。

两版软渲染器都在 Worker 里画完一帧就接着画下一帧，累计至少 250 毫秒后报告一次 FPS；它包含软渲染循环和显示的开销，不是单独某个函数的耗时。画布移出屏幕或页面切到后台时会暂停，这段时间不计入 FPS，所以比较时也要让画布保持可见。demo 页右边的 WebGPU 还是 `requestAnimationFrame` 调度的，通常受屏幕刷新率限制，也不能拿它来算 GPU 的极限速度。

这几处优化各自贡献了多少？只看两边的总帧率是分不出来的。真要拆开比较，得一次只开一项优化，在相同条件下多跑几轮，再看耗时。这里先不硬给每一项分配一个倍数。

## 写在最后

回头看，这次没用什么神奇的算法：同一个三角形的切线少求几遍，同一行里的重心坐标用加法推出来，同一个像素的贴图下标也少算几遍。

前十天为了把图形学公式讲清楚，很多地方都是怎么直观怎么写。现在知道每一步在干什么了，再回头找重复劳动，反而很好下手：哪些量一帧不变，哪些量一个三角形不变，哪些量真的要每个像素都算，把它们分清楚就能省下不少工作。

当然，CPU 还是在一个线程里逐像素计算，和显卡的并行能力还差得很远。不过能亲眼看到自己写的软渲染器更流畅一点，也挺有成就感的，不是吗？

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
