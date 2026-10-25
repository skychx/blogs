---
id: day7-Shaders
title: day7：着色器（Shader）
sidebar_label: day7：着色器
description: 着色器（Shader）
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day7：着色器
  - 渲染管线
  - 顶点着色器
  - 片元着色器
  - Gouraud 着色
---

import { RendererDemo, RendererDemos } from '../../src/components/rendererDemo';

昨天写完移动相机，`main.ts` 已经将近 200 行了：矩阵、光栅化、光照全都挤在一个文件里。今天我们先来一次重构，把代码拆成两部分：一部分是「我们自己的 OpenGL」，另一部分是我们自己写的**着色器（Shader）**。

从今天开始，这个软渲染器就有了一点儿 OpenGL 的影子了。这部分内容对应 GAMES101 的第 8 讲。

> 本文源码 👉：[toy-renderer-ts/days/day07](https://github.com/skychx/toy-renderer-ts/tree/main/days/day07)

## 1.渲染管线

### 1.1 显卡是怎么画三角形的

在写代码之前，我们先看看显卡是怎么画一个三角形的。现代显卡的工作流程一般叫做**渲染管线（Rendering Pipeline）**，可以粗略地分成下面几步：

- **顶点处理**：对每一个顶点做变换，算出它在屏幕上的位置
- **图元装配**：把顶点连成三角形（也可能是点、线）
- **光栅化**：找出每个三角形覆盖了屏幕上的哪些像素
- **片元处理**：算出每个像素的颜色
- **测试与合并**：做深度测试等检查，通过以后写进帧缓冲

这里有一个概念要区分一下：光栅化产生的东西叫**片元（fragment）**，它不完全等于屏幕上的像素。片元除了 x、y 坐标，还带着深度、颜色等信息，可以理解为一个「候选像素」，要经过深度测试这些检查以后，才会真正写进帧缓冲，成为屏幕上的像素。

### 1.2 可编程的部分

上面这些步骤里，**顶点处理**和**片元处理**是可以编程的：我们可以写一小段程序交给显卡，告诉它每个顶点怎么变换、每个片元是什么颜色。这两段程序就叫**顶点着色器（Vertex Shader）**和**片元着色器（Fragment Shader）**，其他步骤都是显卡里固定好的，我们没法改。

> 注：OpenGL 2.0 只支持这两种着色器，新版本的 OpenGL 还加了几何着色器、曲面细分着色器等等。原教程也是参照 OpenGL 2.0 来实现的，所以我们只实现顶点着色器和片元着色器这两种

前几天写的代码，其实已经把这些步骤都实现了一遍，只是散落在各个地方。我们把它们一一对应起来：

![渲染管线和我们代码的对应关系](/img/toy-renderer/day7/pipeline.svg)

其中橙色的两步就是今天要抽出来的着色器，其他的部分我们放到一个单独的文件 `gl.ts` 里。

## 2.重构代码

### 2.1 gl.ts

重构以后，代码分成两部分：

- `gl.ts`：相当于 OpenGL 的库和显卡里固定的那部分逻辑，写好以后就不再改了
- `main.ts`：相当于我们用 OpenGL 写的应用程序，所有的着色器都写在这里

`gl.ts` 里放了这几样东西：昨天写的 `lookAt`、`projection`、`viewport` 三个函数，一个着色器接口 `IShader`，还有光栅化函数 `triangle`。

着色器接口只有两个方法：

```ts
// 着色器
export interface IShader {
  // 顶点着色器：处理第 iface 个三角形的第 nthvert 个顶点，返回这个顶点的裁剪坐标
  vertex(iface: number, nthvert: number): Vec4;
  // 片元着色器：根据当前像素的重心坐标，算出这个像素的颜色；返回 null 表示丢弃这个像素
  fragment(bar: Vec3): Color | null;
}
```

- **顶点着色器**的主要任务是**变换顶点的坐标**，返回它的裁剪坐标（也就是乘完投影矩阵、还没有做透视除法的坐标，OpenGL 里的 `gl_Position` 就是这个）。顺便它还可以给片元着色器准备一些数据
- **片元着色器**的主要任务是**决定像素的颜色**。它还可以返回 `null`，告诉光栅化函数「这个像素不要画了」，对应 GLSL 里的 `discard`

光栅化函数 `triangle` 和昨天的差别不大，主要是两点：一是透视除法和视口变换挪到了这里面，二是像素的颜色不再自己算，而是交给片元着色器：

```ts
// 光栅化：把顶点着色器输出的三个裁剪坐标变换到屏幕上，然后对三角形里的每个像素调用片元着色器
export function triangle(
  clip: Vec4[],
  shader: IShader,
  Viewport: Mat,
  zbuffer: Float32Array,
  frame: Frame,
) {
  // 透视除法 + 视口变换，得到屏幕坐标；x、y 四舍五入成整数，z 留给 zbuffer 用
  const pts: Vec3[] = clip.map(c => {
    const [x, y, z, w] = matVec(Viewport, c);
    return [Math.round(x / w), Math.round(y / w), z / w];
  });

  // 找出包围盒，包围盒不能超出画布的边界
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.max(0, Math.min(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxX = Math.min(frame.width - 1, Math.max(...xs));
  const maxY = Math.min(frame.height - 1, Math.max(...ys));

  // 遍历包围盒里的每一个像素
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const bc = barycentric(pts, [x, y]);
      if (bc[0] < 0 || bc[1] < 0 || bc[2] < 0) {
        continue;
      }

      // 深度测试：被挡住的像素直接跳过，连片元着色器都不用调
      const z = pts[0][2] * bc[0] + pts[1][2] * bc[1] + pts[2][2] * bc[2];
      const index = x + y * frame.width;
      if (zbuffer[index] >= z) {
        continue;
      }

      // 调用片元着色器，算出这个像素的颜色
      const color = shader.fragment(bc);
      if (color === null) {
        continue; // 片元着色器要求丢弃这个像素
      }

      zbuffer[index] = z;
      frame.set(x, y, color);
    }
  }
}
```

细心的同学会发现，这里的深度测试放在了片元着色器的**前面**，和上面管线图里的顺序不太一样。这是一个小优化：被挡住的像素反正也不会画，就没必要再去算它的颜色了。显卡其实也有类似的优化，叫做 Early-Z。

还有一个细节：zbuffer 要等片元着色器确定不丢弃这个像素以后，才会更新。不然一个被丢弃的像素，会把后面本来应该画出来的像素挡住。

### 2.2 main.ts

`main.ts` 里剩下的就是我们的「应用程序」了。先准备好相机、矩阵和模型：

```ts
const light: Vec3 = normalize([1, 1, 1]); // 指向光源的方向
const eye: Vec3 = [1, 1, 3]; // 相机的位置
const center: Vec3 = [0, 0, 0]; // 相机看向的点
const up: Vec3 = [0, 1, 0]; // 相机的「上方」

const ModelView = lookAt(eye, center, up);
const Projection = projection(length(sub(eye, center)));
const Viewport = viewport(width / 8, height / 8, (width * 3) / 4, (height * 3) / 4);

const model = await loadModel('/obj/african_head/african_head.obj');
const texture = await loadTexture('/obj/african_head/african_head_diffuse.png');
```

渲染的主循环非常简单，对着管线图看一下：每个三角形先对三个顶点调用顶点着色器（顶点处理），三个顶点凑成一个三角形（图元装配），然后交给 `triangle`（光栅化），`triangle` 会对每个像素调用片元着色器：

```ts
// 渲染：每个三角形先对三个顶点调用顶点着色器，再交给光栅化，光栅化会对每个像素调用片元着色器
function render(shader: IShader, canvas: HTMLCanvasElement) {
  const frame = new Frame(width, height);
  const zbuffer = new Float32Array(width * height).fill(-Infinity);

  for (let i = 0; i < model.nfaces(); i++) {
    // 图元装配：三个顶点组成一个三角形
    const clip: Vec4[] = [shader.vertex(i, 0), shader.vertex(i, 1), shader.vertex(i, 2)];
    triangle(clip, shader, Viewport, zbuffer, frame);
  }

  frame.render(canvas);
}
```

为了配合着色器的调用方式，`model.ts` 里的 `vert` 也改成了和 `uv`、`normal` 一样，按「第几个三角形的第几个顶点」来取：

```ts
// 第 iface 个三角形的第 nthvert 个顶点的坐标
vert(iface: number, nthvert: number) {
  return this.verts[this.faces[iface][nthvert]];
}
```

## 3.第一个着色器

### 3.1 uniform 和 varying

我们先把昨天的 Gouraud 着色改写成一个着色器。在看代码之前，先认识两个 GLSL（OpenGL 的着色器语言）里的关键字：

- **uniform**：对所有顶点、所有像素都一样的数据，比如变换矩阵、光照方向
- **varying**：顶点着色器的输出、片元着色器的输入。顶点着色器给三角形的每个顶点各写一个值，到了片元着色器，拿到的是在三角形内部**插值**以后的值

我们的着色器里沿用这两个名字，用来标记数据的用途：

```ts
// Gouraud 着色器
class GouraudShader implements IShader {
  // uniform：对所有顶点、所有像素都一样的数据
  uniformM = matMul(Projection, ModelView);
  // varying：顶点着色器写进去，片元着色器读出来（读之前要先插值）
  varyingIntensity: Vec3 = [0, 0, 0];

  vertex(iface: number, nthvert: number): Vec4 {
    // 算出这个顶点的光照强度，存到 varying 里
    this.varyingIntensity[nthvert] = Math.max(0, dot(model.normal(iface, nthvert), light));
    // 把顶点变换到裁剪坐标
    const v = model.vert(iface, nthvert);
    return matVec(this.uniformM, [v[0], v[1], v[2], 1] as Vec4);
  }

  fragment(bar: Vec3): Color | null {
    // 用重心坐标插值出当前像素的光照强度
    const intensity = dot(this.varyingIntensity, bar);
    return [255 * intensity, 255 * intensity, 255 * intensity];
  }
}
```

`varyingIntensity` 存着三个顶点的光照强度，片元着色器拿到当前像素的重心坐标 `bar` 以后，插值出当前像素的光照强度：

$$
I = I_0 \cdot \alpha + I_1 \cdot \beta + I_2 \cdot \gamma
$$

这正好就是向量 $(I_0, I_1, I_2)$ 和 $(\alpha, \beta, \gamma)$ 的点乘，所以代码里直接写成了 `dot(this.varyingIntensity, bar)`。

有两个地方和真正的 OpenGL 不太一样，提一下：

- 真正的 GLSL 里，片元着色器拿到的 varying 已经被显卡插值好了；我们的实现比较简单，是把重心坐标传给片元着色器，让它自己插值
- `varyingIntensity` 每处理一个三角形就会被覆盖一次。这没有问题，因为我们是一个三角形一个三角形地画的：三个顶点着色器写完，紧接着就是这个三角形的光栅化

### 3.2 结果

把着色器交给 `render` 就可以画了：

```ts
render(new GouraudShader(), document.querySelector<HTMLCanvasElement>('#gouraud')!);
```

画出来和昨天的 Gouraud 着色一模一样。重构最怕的就是改出 bug，我把两天的输出图片逐字节比较了一下，完全一致，说明这次重构没有改变任何结果。

## 4.改一改着色器

着色器真正好玩的地方在于：**渲染器的代码一行不用改，只改着色器，画面就能变成完全不同的样子**。

比如我们把光照强度「四舍五入」到 6 个档位上，再把颜色换成橙色：

```ts
// 卡通风格：顶点着色器和 Gouraud 一样，片元着色器把光照强度分成 6 档
class ToonShader extends GouraudShader {
  fragment(bar: Vec3): Color | null {
    let intensity = dot(this.varyingIntensity, bar);
    if (intensity > 0.85) intensity = 1;
    else if (intensity > 0.6) intensity = 0.8;
    else if (intensity > 0.45) intensity = 0.6;
    else if (intensity > 0.3) intensity = 0.45;
    else if (intensity > 0.15) intensity = 0.3;
    else intensity = 0;
    return [255 * intensity, 155 * intensity, 0];
  }
}
```

这个着色器继承了 `GouraudShader`，顶点着色器完全不变，只重写了片元着色器。效果是这样的，有点卡通画的味道了：

<RendererDemo src="day07/toon" title="把光照强度分成 6 档" />

> 注：真正的卡通渲染还会给模型描上黑色的轮廓线，番外篇里我们再来实现一个完整的版本

## 5.纹理

最后把纹理也写进着色器里。uv 坐标和光照强度一样，在顶点着色器里存到 varying 里，到片元着色器再插值：

```ts
// Gouraud 着色 + 纹理
class TextureShader implements IShader {
  uniformM = matMul(Projection, ModelView);
  varyingIntensity: Vec3 = [0, 0, 0];
  varyingUV: Vec2[] = [
    [0, 0],
    [0, 0],
    [0, 0],
  ];

  vertex(iface: number, nthvert: number): Vec4 {
    this.varyingUV[nthvert] = model.uv(iface, nthvert);
    this.varyingIntensity[nthvert] = Math.max(0, dot(model.normal(iface, nthvert), light));
    const v = model.vert(iface, nthvert);
    return matVec(this.uniformM, [v[0], v[1], v[2], 1] as Vec4);
  }

  fragment(bar: Vec3): Color | null {
    const intensity = dot(this.varyingIntensity, bar);
    // 和光照强度一样，uv 也用重心坐标插值
    const [uv0, uv1, uv2] = this.varyingUV;
    const u = uv0[0] * bar[0] + uv1[0] * bar[1] + uv2[0] * bar[2];
    const v = uv0[1] * bar[0] + uv1[1] * bar[1] + uv2[1] * bar[2];
    const color = texture.get(u, v);
    return [color[0] * intensity, color[1] * intensity, color[2] * intensity];
  }
}
```

三个着色器的效果放在一起对比一下，从左到右分别是 Gouraud 着色、6 档光照和带纹理的 Gouraud 着色：

<RendererDemos title="三个着色器的效果">
  <RendererDemo src="day07/gouraud" title="Gouraud 着色" />
  <RendererDemo src="day07/toon" title="6 档光照" />
  <RendererDemo src="day07/texture" title="带纹理的 Gouraud 着色" />
</RendererDemos>

<br />

<br />

到这里，我们就有了一个小小的、类似 OpenGL 2.0 的渲染管线：`gl.ts` 一百多行，剩下的就是自由发挥的着色器了。

最后还要交代一个小问题：我们在片元着色器里插值 varying 用的是**屏幕上**的重心坐标，加上透视投影以后，这样插值其实不完全准确。对人头模型来说几乎看不出差别，所以先放一放，番外篇里再专门讲。

明天我们继续在着色器上做文章：用一张贴图给模型的每个像素提供法线，再加上高光，让人头看起来更真实。

## 参考链接

[tinyrenderer Lesson 6: Shaders for the software renderer](https://github.com/ssloy/tinyrenderer/wiki/Lesson-6:-Shaders-for-the-software-renderer)

[tinyrenderer（第二版）：Shading](https://haqr.eu/tinyrenderer/shading/)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
