---
id: extra3-WebGL
title: 番外：用 WebGPU 重写一遍
sidebar_label: 番外：用 WebGPU 重写一遍
description: 用 WebGPU 和 WGSL 重写 day8 的人头，对照软渲染器理解显卡的渲染管线
keywords:
  - OpenGL
  - WebGPU
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - WGSL
  - 着色器
---

前言里说过，这个系列的目标是实现一个简易版本的 OpenGL，搞清楚这类图形 API 在底层是怎么工作的。十天下来，光栅化、zbuffer、透视投影、着色器，全都是我们一行一行手写出来的。

那把这些活交给真正的显卡，会是什么样呢？这篇番外我们换成 WebGPU，把 day8 的人头（切线空间的法线贴图 + Phong 光照）重新画一遍。模型解析和矩阵运算还是用我们自己写的 `model.ts` 和 `math.ts`，光栅化、插值、深度测试这些活，全部交给显卡。

demo 里有两块画布：左边是 CPU 跑的软渲染器，右边是 WebGPU，两边画的都是头部和独立的双眼，分辨率都是 800×800。按住任意一边拖动鼠标，两边的相机一起转，方便我们对照着看。

> 本文源码 👉：[toy-renderer-ts/days/extra-webgpu](https://github.com/skychx/toy-renderer-ts/tree/main/days/extra-webgpu)

在项目根目录运行 `bun dev`，打开 [http://localhost:8080/extra-webgpu](http://localhost:8080/extra-webgpu) 就能看到效果。需要使用支持 WebGPU 的浏览器，通过 localhost 或 HTTPS 打开；如果显卡这一边不可用，页面会显示原因，左边的软渲染器仍然可以继续跑。

## 1.WebGPU 是什么

WebGPU 是浏览器提供的一套调用显卡的 API。前面经常提到的 WebGL，是把 OpenGL ES 搬到浏览器里；WebGPU 则是按现代 GPU API 的思路重新设计的，着色器用 **WGSL（WebGPU Shading Language）** 来写。

名字换了，画三角形的基本流程还是我们熟悉的那一套：

| 软渲染器 | WebGPU |
| --- | --- |
| `IShader` 的 `vertex()` | `@vertex` 顶点着色器 |
| `IShader` 的 `fragment()` | `@fragment` 片元着色器 |
| varying 数组和 `interpolate()` | 着色器之间的 `@location` 变量，显卡自动插值 |
| `triangle()` 里的包围盒、重心坐标 | 显卡自动光栅化 |
| 透视除法和 `Viewport` 矩阵 | 显卡自动做透视除法和视口变换 |
| zbuffer | 深度贴图和管线里的 `depthStencil` |
| `Texture` 的 `get()` | WGSL 里的 `textureSample()` |
| `Frame` 和 `putImageData()` | render pass 把结果画到 canvas 对应的贴图上 |

着色器还是要我们自己写，只是从 TS 换成了 WGSL；表格里剩下的那些，显卡全包了。

先和显卡打个招呼：

```ts
if (!navigator.gpu) throw new Error('当前浏览器无法使用 WebGPU');
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error('没有找到可用的 WebGPU 设备');
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu')!;
const format = navigator.gpu.getPreferredCanvasFormat();
context.configure({ device, format, alphaMode: 'opaque' });
```

`adapter` 代表浏览器找到的 GPU，`device` 用来创建缓冲、贴图、管线，以及提交绘图命令。canvas 的上下文也从前面的 `'2d'` 换成了 `'webgpu'`，`format` 则是浏览器适合拿来显示的颜色格式。

下面还是按「着色器 → 矩阵 → 把数据交给显卡 → 画出来」的顺序，一块一块地看。

## 2.着色器

### 2.1 输入和输出

WGSL 的语法和 TS 有一点像：变量名在前，类型在后，函数用 `fn` 声明。不过它是跑在显卡上的，访问不到 JS 里的对象，所有数据都得事先交给显卡。

先声明两个着色器要用的数据：

```wgsl
struct Uniforms {
  ModelView: mat4x4<f32>,
  ModelViewIT: mat4x4<f32>, // ModelView 的逆转置矩阵，用来变换法线
  Projection: mat4x4<f32>,
  light: vec4<f32>, // 用一个 16 字节的 vec4 存光照方向，w 补 0
}

// binding 是资源的编号，和下面 createBindGroup() 里的编号一一对应
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var diffuseMap: texture_2d<f32>;
@group(0) @binding(3) var normalMap: texture_2d<f32>;
@group(0) @binding(4) var specularMap: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) clipPosition: vec4<f32>,
  // location 对应 varying：显卡会做透视校正插值，再把结果交给片元着色器
  @location(0) uv: vec2<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) position: vec3<f32>, // 相机坐标系下的位置
}
```

看上去有点多，其实可以拆成三块：

- `Uniforms`：和 day8 一样，装着矩阵和光照方向，所有顶点、所有像素共用。`mat4x4<f32>` 是 4×4 的浮点数矩阵，`vec4<f32>` 是四维向量，向量和矩阵运算都是语言自带的
- `@group(0) @binding(...)`：显卡资源的编号。第 0 号是 uniform，后面依次是采样器、漫反射贴图、法线贴图和高光贴图。JS 里按相同的编号把资源交过去，着色器就能读到了，第 5 节会讲
- `VertexOutput`：顶点着色器的输出。`@builtin(position)` 是顶点的裁剪坐标，剩下三个 `@location` 就是 varying，显卡会把它们插值好，再交给片元着色器，而且默认就带透视校正

这里有两套编号，别弄混了：`@binding` 编的是缓冲、贴图这些资源；`@location` 编的是顶点属性，以及顶点、片元着色器之间传递的值。

### 2.2 顶点着色器

先看顶点着色器：

```wgsl
@vertex
fn vertexMain(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
) -> VertexOutput {
  var out: VertexOutput;
  let p = u.ModelView * vec4<f32>(position, 1.0);
  let clip = u.Projection * p;
  // 共用的投影矩阵沿用 OpenGL 的深度范围 [-w, w]，WebGPU 要求 [0, w]
  // z' = (z + w) / 2，两边的相机和投影效果仍然一致
  out.clipPosition = vec4<f32>(clip.xy, (clip.z + clip.w) * 0.5, clip.w);
  out.uv = uv;
  out.normal = (u.ModelViewIT * vec4<f32>(normal, 0.0)).xyz;
  out.position = p.xyz;
  return out;
}
```

这基本就是 day8 的 `vertex()`：拿到位置、法线和 uv，把位置变换到相机坐标系，再投影；法线用 ModelView 的逆转置矩阵变换。

区别在于，原来的 `vertex(iface, nthvert)` 要自己去 `Model` 里取数据，这里显卡会把当前顶点的数据填进三个参数里。输出的 `uv`、`normal`、`position` 也不用再存成三个顶点的数组了，给当前顶点赋个值就行。

代码里的 `.xyz`、`.xy` 和 `.rgb` 都是在取向量的分量，`let` 声明的值不能重新赋值，要修改的变量用 `var`。`clip.z` 换算的那一行先记下来，第 3 节再讲。

### 2.3 片元着色器

再来看片元着色器：

```wgsl
@fragment
fn fragmentMain(in: VertexOutput) -> @location(0) vec4<f32> {
  // 图片像素从上往下存，模型的 uv 原点在左下角，所以把 v 翻转一下
  let uv = vec2<f32>(in.uv.x, 1.0 - in.uv.y);
  let n = normalize(in.normal);

  // textureSample 需要用相邻片元的导数选择 mip 层级，必须放在分支外统一执行
  let color = textureSample(diffuseMap, textureSampler, uv).rgb;
  let nm = normalize(textureSample(normalMap, textureSampler, uv).rgb * 2.0 - 1.0);
  let strength = textureSample(specularMap, textureSampler, uv).r;

  // 用相邻像素的位置差和 uv 差解出切线 T、副切线 B
  let dx = dpdx(in.position);
  let dy = dpdy(in.position);
  let uvDx = dpdx(in.uv);
  let uvDy = dpdy(in.uv);
  let det = uvDx.x * uvDy.y - uvDy.x * uvDx.y;
  var perturbed = n;
  if (abs(det) > 1e-12) {
    // WGSL 没有通用的 inverse()，这里把 2×2 逆矩阵的公式直接展开
    let T = normalize((dx * uvDy.y - dy * uvDx.y) / det);
    let B = normalize((dy * uvDx.x - dx * uvDy.x) / det);
    perturbed = normalize(T * nm.x + B * nm.y + n * nm.z);
  }

  // 和软渲染器一样的 Phong 光照：环境光 + 漫反射 + 高光
  let l = normalize(u.light.xyz);
  let r = normalize(2.0 * perturbed * dot(perturbed, l) - l);
  let v = normalize(-in.position);
  let ambient = 0.3;
  let diffuse = max(0.0, dot(perturbed, l));
  let specular = strength * pow(max(0.0, dot(r, v)), 20.0);
  return vec4<f32>(color * (ambient + diffuse) + specular, 1.0);
}
```

光照部分基本上是把 day8 的 `phong()` 翻译了一遍，有几个地方要注意：

- `textureSample(贴图, 采样器, uv)` 读出颜色，每个分量的范围是 $[0, 1]$，而不是 $[0, 255]$；法线贴图还是照常乘 2 再减 1
- 模型的 uv 原点在左下角，上传的图片从上往下存，所以读贴图时还是要翻转 v，和 day4 是同一个问题
- 返回值上的 `@location(0)` 表示写到第 0 个颜色输出。我们只画到一张颜色贴图上，所以这里只有一个输出；当前颜色格式会把超过 1 的分量截断
- 相机现在放在原点，从物体指向相机的方向就是 `-in.position`，所以高光不用再把视线近似成 $(0, 0, 1)$ 了。左边的软渲染器也做了同样的修改

剩下的就是中间求切线的那一段了，这也是这篇番外最有意思的地方。

### 2.4 看不到三角形的片元着色器

回忆一下 day8 是怎么求切线 $\vec{t}$ 和副切线 $\vec{b}$ 的：顶点着色器把三个顶点在相机坐标系里的位置存进 `varyingTri`，片元着色器拿到这三个顶点，算出三角形的两条边 $E$ 和对应的 uv 差 $U$，最后 $[\vec{t}\ \vec{b}] = EU^{-1}$。

可到了显卡上，这招就行不通了：片元着色器拿到的 `in.position`、`in.uv`，都是已经插值好的、当前像素自己的值。它不知道三角形的三个顶点在哪。

好在 WGSL 提供了 `dpdx` 和 `dpdy` 这两个函数。显卡跑片元着色器的时候，会按 **2×2 个片元一组**来计算导数，我们可以把它理解成看看邻居的变量是多少：

- `dpdx(v)`：往右走，v 变了多少，可以理解成右边的值减去左边的值
- `dpdy(v)`：往下走，v 变了多少，可以理解成下面的值减去上面的值。注意 WebGPU 的窗口坐标 y 轴朝下

![dpdx 和 dpdy：屏幕上的相邻片元，对应到三角形上的两个短向量](/img/toy-renderer/extra3/derivatives.svg)

把它用在位置上：屏幕上往右走一个像素，对应到三角形上，点在相机坐标系里也会挪一小段，`dpdx(in.position)` 就是这一小段，它是一个贴在三角形上的很短的向量；`dpdy(in.position)` 也一样。同时，`dpdx(in.uv)` 和 `dpdy(in.uv)` 告诉了我们，沿着这两个短向量走，uv 分别变了多少。

再回头看 day8 的推导，我们其实只用到了「三角形上的两个向量，以及沿着它们走 uv 变了多少」，至于这两个向量是不是三角形的边，根本无所谓。所以把 $E$ 和 $U$ 换成：

$$
E = \begin{bmatrix}\text{dpdx}(P) & \text{dpdy}(P)\end{bmatrix}, \quad U = \begin{bmatrix}\text{dpdx}(uv) & \text{dpdy}(uv)\end{bmatrix}
$$

公式 $[\vec{t}\ \vec{b}] = EU^{-1}$ 一个字都不用改。WGSL 没有通用的 `inverse()`，所以代码里直接展开了 2×2 逆矩阵的公式：

```wgsl
let det = uvDx.x * uvDy.y - uvDy.x * uvDx.y;
let T = normalize((dx * uvDy.y - dy * uvDx.y) / det);
let B = normalize((dy * uvDx.x - dx * uvDy.x) / det);
```

如果 uv 的差退化成了一条线，行列式接近 0，就没法求逆了，这时直接用插值出来的顶点法线。

还有两个细节：算切线用的是没有翻转过的 `in.uv`，翻转 v 只是为了读贴图；另外，`dpdx`、`dpdy` 和三次 `textureSample` 都放在了 `if` 外面。因为采样器也要用相邻片元的导数来选 mip 层级，如果同一组片元各走各的分支，导数就没法可靠地算了，WGSL 默认会检查这种写法。

> 注：三角形边缘的 2×2 小组里，有的片元其实在三角形外面。显卡也会安排辅助片元参与计算，只是不把它们的颜色写出来，为的就是让导数能算出来

> 注：这种在片元着色器里现算切线的思路，可以参考 Christian Schüler 的文章 [Normal Mapping Without Precomputed Tangents](http://www.thetenthplanet.de/archives/1180)。实际项目里也经常在加载模型时就把每个顶点的切线算好，和位置、法线一起传给显卡

## 3.矩阵

### 3.1 相机放在原点

day6 写 `lookAt` 的时候，我们把 center 移到了原点，相机在 z 轴上离原点 c 远的地方，day5 的投影矩阵也是按照这个位置来做透视的。

这次我们沿用 OpenGL 常见的相机约定：**相机放在原点，朝着 -z 方向看**。这不是 WebGPU 强制要求的，只是这样比较方便。`lookAt` 只需要改一个地方，平移的时候把 eye 移到原点：

```ts
const translation: Mat = [
  [1, 0, 0, -eye[0]],
  [0, 1, 0, -eye[1]],
  [0, 0, 1, -eye[2]],
  [0, 0, 0, 1],
];
```

旋转的部分和 day6 一模一样，就不贴了。

### 3.2 透视投影和深度范围

投影矩阵也换成带近平面、远平面的版本。为了让两边共用一份矩阵，CPU 端先沿用 OpenGL 的写法：

```ts
function perspective(fovy: number, aspect: number, near: number, far: number): Mat {
  const f = 1 / Math.tan(fovy / 2);
  return [
    [f / aspect, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, (far + near) / (near - far), (2 * far * near) / (near - far)],
    [0, 0, -1, 0],
  ];
}
```

看上去比 day5 的投影矩阵复杂不少，我们一行一行地看。

最后一行 $[0, 0, -1, 0]$ 让 $w = -z$。相机前面的物体 z 都是负数，$-z$ 就是沿相机前方量出来的深度，x、y 除以它，就有了近大远小。

前两行管的是视角和宽高比。在深度为 $d$ 的地方，上下视角为 fovy 时，能看到的 y 的范围是 $[-d\tan(fovy/2),\ d\tan(fovy/2)]$。y 乘上 $f = 1/\tan(fovy/2)$，再除以 $w$（也就是 $d$），正好落在 $[-1, 1]$ 里；x 还要再除以宽高比 aspect，画面才不会被拉伸。

我们的软渲染器里，人头画多大原来是由 `Viewport` 决定的（只用了画布中间 3/4 的区域）；这里则是由 fovy 决定的：fovy 越大，看到的范围越大，人头就越小。demo 取的是 45°。

第三行管的是 z。这个矩阵做完透视除法以后，近平面上的 z 是 -1，远平面上的 z 是 1。不过 **WebGPU 要求的深度范围是 $[0, 1]$**，所以顶点着色器最后多了一步：

```wgsl
out.clipPosition = vec4<f32>(clip.xy, (clip.z + clip.w) * 0.5, clip.w);
```

为什么要加 `clip.w` 呢？因为这时还没做透视除法，我们希望除完以后的结果是：

$$
\frac{z'}{w} = \frac{1}{2}\left(\frac{z}{w} + 1\right)
$$

两边乘上 w，就是 $z' = (z + w)/2$。x、y 和 w 都不动，画面大小也不变，只是把深度从 $[-1, 1]$ 搬到了 $[0, 1]$。

左边的软渲染器仍然用 $[-1, 1]$ 的深度，但两边都是 z 越小离相机越近，所以遮挡顺序一致。注意这和 day4 正好反过来：左边的 zbuffer 要填 `Infinity`，右边的深度贴图清成 1，深度比较用 `'less'`。

显卡还会把超出裁剪范围的部分裁掉，我们的软渲染器没有补上完整的裁剪流程，所以把模型转到极端位置时，两边不一定处处一样。

### 3.3 把 uniform 装进缓冲

前面的 uniform 在 TS 里是一组对象，交给显卡时要排成一段连续的数据：

```ts
// 三个 mat4 各 16 个 float，再加一个 vec4，共 52 个 float
const uniformData = new Float32Array(52);
const uniformBuffer = device.createBuffer({
  size: uniformData.byteLength, // 52 × 4 = 208 字节
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// 每帧更新相机和光照时，把数据写进去
uniformData.set(transpose(uniforms.ModelView).flat(), 0);
uniformData.set(transpose(uniforms.ModelViewIT).flat(), 16);
uniformData.set(transpose(uniforms.Projection).flat(), 32);
uniformData.set([...uniforms.light, 0], 48);
device.queue.writeBuffer(uniformBuffer, 0, uniformData);
```

有两个容易踩的坑。

第一个是矩阵的存储顺序。我们的 `Mat` 是按行存的二维数组，`m[0]` 是第一行；WGSL 的矩阵按列存，传过去的前 4 个数会被当成第一列，所以要先 `transpose()`，再 `flat()`。

注意这里的转置只是为了排对数据，和法线变换用的「逆转置矩阵」不是一回事。`ModelViewIT` 在数学上已经求过逆、转置了，上传时仍然要按列排好。

第二个是内存对齐。WGSL 的结构体不能随便拼几个 float 就往里塞，要按各个类型的对齐规则来。这里三个 `mat4x4<f32>` 各占 64 字节，光照方向干脆用一个占 16 字节的 `vec4<f32>`，最后一个分量补 0：

| 数据 | 起始字节 | 占用字节 |
| --- | --- | --- |
| ModelView | 0 | 64 |
| ModelViewIT | 64 | 64 |
| Projection | 128 | 64 |
| light | 192 | 16 |

这样 TS 写进去的布局，才和 WGSL 里的 `Uniforms` 对得上。

## 4.把数据交给显卡

### 4.1 顶点数据

显卡没法调用 `model.vert()`，所以先把顶点的数据排成一个大数组，一次性传进显存。

obj 文件里，一个顶点的位置、uv、法线是分开编号的（就是 `f 24/1/24` 里的三个数），而我们现在要给显卡的是一整套顶点属性。最省事的办法还是按三角形展开，每个三角形 3 个顶点，共用的顶点就重复存几遍：

```ts
const vertices: number[] = [];
for (let i = 0; i < model.nfaces(); i++) {
  for (let j = 0; j < 3; j++) {
    vertices.push(...model.vert(i, j), ...model.normal(i, j), ...model.uv(i, j));
  }
}
const vertexData = new Float32Array(vertices);
const vertexBuffer = device.createBuffer({
  size: vertexData.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertexData);
```

每个顶点连续存 8 个 float：位置 3 个，法线 3 个，uv 2 个，一共 32 字节。`VERTEX` 表示这是顶点缓冲，`COPY_DST` 表示允许把数据拷进来。

人头和双眼是两个网格，代码里会遍历 `['african_head', 'african_head_eye_inner']`，分别创建顶点缓冲。双眼本来就在头部的坐标系里，不用额外平移，但它们的 uv 和贴图是独立的。

### 4.2 贴图和采样器

贴图也要先上传。先看加载一张贴图的代码：

```ts
async function loadTexture(url: string) {
  const blob = await (await fetch(url)).blob();
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
  const mipLevelCount = Math.floor(Math.log2(Math.max(bitmap.width, bitmap.height))) + 1;
  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height],
    mipLevelCount,
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  for (let level = 0; level < mipLevelCount; level++) {
    const width = Math.max(1, bitmap.width >> level);
    const height = Math.max(1, bitmap.height >> level);
    const image = level === 0 ? bitmap : await createImageBitmap(bitmap, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: 'high',
      colorSpaceConversion: 'none',
    });
    device.queue.copyExternalImageToTexture({ source: image }, { texture, mipLevel: level }, [
      width, height,
    ]);
    if (image !== bitmap) image.close();
  }
  bitmap.close();
  return texture.createView();
}
```

和 `texture.ts` 一样，读取图片时关掉颜色校正；贴图格式用普通的 `'rgba8unorm'`，也不自动做 sRGB 解码，因为法线、高光贴图里存的是数据。

这里还多了一套小尺寸的贴图，叫做 **mipmap**：第 0 层是原图，第 1 层宽高各缩一半，第 2 层再缩一半，一直缩到 1×1。模型离得远时，一个屏幕像素可能覆盖贴图上的一大片区域，直接取原图里的一个像素容易出摩尔纹，换成小尺寸贴图就稳定多了。

WebGPU 没有 WebGL 那样的 `generateMipmap()`，这里借助浏览器的 `createImageBitmap` 缩图，再逐层上传。这个工作只在加载时做一遍。

贴图存什么，和怎么读贴图，是两件事。后者交给**采样器（sampler）**：

```ts
const sampler = device.createSampler({
  magFilter: 'linear',
  minFilter: 'linear',
  mipmapFilter: 'linear',
  addressModeU: 'repeat',
  addressModeV: 'repeat',
});
```

`linear` 表示在邻近像素之间做插值，mip 层级之间也插值；`repeat` 表示 uv 超出 $[0, 1]$ 时重复贴图。我们的 `Texture.get()` 则是直接取一个像素，越界时限制在边缘，没有做这些过滤，所以两边的纹理细节会有一些区别。

## 5.画出来

### 5.1 渲染管线

顶点缓冲有了，着色器也写好了，还要告诉显卡：顶点数据怎么拆，哪个函数是顶点着色器，哪个是片元着色器，要不要做深度测试。这些设置放在同一个对象里，叫做**渲染管线（pipeline）**：

```ts
const module = device.createShaderModule({ code: shaderSource });
const pipeline = await device.createRenderPipelineAsync({
  layout: 'auto',
  vertex: {
    module,
    entryPoint: 'vertexMain',
    buffers: [{
      arrayStride: 8 * 4,
      attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },
        { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },
        { shaderLocation: 2, offset: 6 * 4, format: 'float32x2' },
      ],
    }],
  },
  fragment: { module, entryPoint: 'fragmentMain', targets: [{ format }] },
  primitive: { topology: 'triangle-list', cullMode: 'none' },
  depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
});
```

`shaderSource` 就是第 2 节那几段 WGSL 拼在一起的字符串，同一个模块里放了顶点、片元两个入口。`createShaderModule` 把代码交给 WebGPU，`entryPoint` 指定用哪个函数；代码或配置有问题，创建管线时就可能失败，记得看看控制台的错误信息。

`arrayStride` 表示相邻两个顶点隔了多少字节；`offset` 表示从一个顶点的第几个字节开始读。比如法线从第 12 字节开始，读 3 个 float，送到顶点着色器的 `@location(1)`。

`'triangle-list'` 表示每 3 个顶点画一个三角形；`'none'` 表示不剔除背面；`depthStencil` 则对应我们的 zbuffer，深度更小的片元留下来，并更新深度。

### 5.2 绑定资源

还记得着色器开头的 `@group(0) @binding(...)` 吗？现在按编号把资源装进一个 **bind group**：

```ts
const bindGroup = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: { buffer: uniformBuffer } },
    { binding: 1, resource: sampler },
    { binding: 2, resource: diffuse },
    { binding: 3, resource: normal },
    { binding: 4, resource: specular },
  ],
});
```

这里的 `diffuse`、`normal`、`specular` 就是 `loadTexture()` 返回的三张贴图的 view。view 可以理解成告诉显卡「从这张贴图的哪些层、哪些部分读」，我们用默认值，直接读整张。

头部和双眼各有一个 bind group，分别绑定自己的三张贴图；uniform 缓冲、采样器和渲染管线共用。

### 5.3 记录命令，交给显卡

深度缓冲也要明确创建出来：

```ts
const depthTexture = device.createTexture({
  size: [canvas.width, canvas.height],
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
const depthView = depthTexture.createView();
```

终于可以画图了。每帧先按 3.3 节更新 uniform，再执行：

```ts
const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    clearValue: [0, 0, 0, 1],
    loadOp: 'clear',
    storeOp: 'store',
  }],
  depthStencilAttachment: {
    view: depthView,
    depthClearValue: 1,
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
  },
});
pass.setPipeline(pipeline);
for (const mesh of meshes) {
  pass.setBindGroup(0, mesh.bindGroup);
  pass.setVertexBuffer(0, mesh.vertexBuffer);
  pass.draw(mesh.vertexCount);
}
pass.end();
device.queue.submit([encoder.finish()]);
```

`meshes` 存着前面给头部、双眼分别创建的顶点缓冲、顶点数和 bind group。`beginRenderPass` 指定这一轮画到哪里：颜色写进 canvas 当前的贴图，深度写进我们创建的深度贴图。开始时把颜色清成黑色、深度清成最远的 1，最后保留绘制结果。

`setPipeline` 选好管线，然后对每个网格选好材质、顶点缓冲，`draw()` 就会调用顶点着色器、光栅化、插值、调用片元着色器。**头部和双眼在同一个 pass 里画，中间不清深度**，眼睑才能正确挡住眼球，和 day8 共用 zbuffer 是一个道理。

还有一点和我们之前不太一样：这些调用是在**记录命令**，最后 `encoder.finish()` 得到一份命令缓冲，再用 `queue.submit()` 一次性交给显卡执行。

## 6.两边一起转

相机的位置还是用球坐标：在半径为 `distance` 的球面上，`theta` 是绕 y 轴转的角度，`phi` 是抬头的角度：

```ts
const light: Vec3 = [1, 1, 1];
const distance = Math.sqrt(11);
let theta = Math.atan2(1, 3);
let phi = Math.asin(1 / distance);

function createUniforms(canvas: HTMLCanvasElement): Uniforms {
  const eye: Vec3 = [
    distance * Math.cos(phi) * Math.sin(theta),
    distance * Math.sin(phi),
    distance * Math.cos(phi) * Math.cos(theta),
  ];
  const ModelView = lookAt(eye, [0, 0, 0], [0, 1, 0]);
  return {
    ModelView,
    ModelViewIT: transpose(inverse(ModelView)),
    Projection: perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100),
    light: transformDirection(ModelView, light),
  };
}
```

初始值算出来正好是 day8 的相机位置 $(1, 1, 3)$。按住任意一边拖动，就更新 `theta`、`phi`，重新生成一份 uniform，两边用同一份数据。

不过，如果直接在主线程里跑软渲染器，一帧要算很久，鼠标交互和右边的 WebGPU 也会跟着卡。所以左边单独放进 **Web Worker**，用 `OffscreenCanvas` 显示结果：

```ts
function startSoftware(canvas: HTMLCanvasElement, context: DemoContext) {
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker('/extra-webgpu/software.js', { type: 'module' });
  worker.postMessage({
    canvas: offscreen,
    uniforms: createUniforms(canvas),
    active: context.isActive(),
  }, [offscreen]);
  // ...接收帧率、同步相机，以及暂停和清理的代码
}
```

这里的 `context` 是页面传进来的运行状态，`isActive()` 表示画布是否在前台可见。Worker 的源码是 `software.ts`，开发服务器打包成 `software.js` 后再加载。

后面相机每变一次，再发一次 `{ uniforms }` 就行。Worker 里还是老办法：遍历三角形、光栅化、算光照，最后 `putImageData()`；WebGPU 在主线程里用 `requestAnimationFrame` 绘制，两边各跑各的。完整代码还会在画布移出屏幕、页面切到后台时暂停，离开页面时清理 Worker 和显卡资源。

左边是软渲染器，右边是 WebGPU：

![左：未优化的软渲染器，右：WebGPU，两边使用相同的模型和相机](/img/toy-renderer/extra3/webgpu-compare.jpg)

是不是很熟悉！右边的皮肤会细腻一些，主要是双线性插值和 mipmap 的功劳。两边的光栅化、纹理采样也不完全一样，不用指望逐像素对上。

## 7.快了多少

两块画布下面都会显示 FPS。左边的 Worker 在画布可见时，画完一帧就接着画下一帧，累计至少 250 毫秒后更新一次读数；如果单帧已经超过 250 毫秒，就在这一帧画完以后更新。暂停的时间不计入 FPS。

右边统计的是 `requestAnimationFrame` 实际调度了多少次绘制，也大约每 250 毫秒更新一次。它通常会被屏幕刷新率限制住，比如 120Hz 的屏幕上看到 120 FPS，并不意味着显卡最多只能画 120 帧。

还要注意，`queue.submit()` 是把任务交给显卡排队，并不会等显卡全部画完才返回。所以只拿 `performance.now()` 在 `draw()` 两边计时，量到的主要是 CPU 准备、提交命令的时间，不能直接当成 GPU 画完一帧的时间。

这两个读数能直观地告诉我们交互有多流畅，不过要测 GPU 的极限吞吐量，还得另外设计测量方法。这里就不拿它们硬算「显卡快了几百倍」了。

差距为什么这么大？我们的软渲染器是在 CPU 上用一个线程，一个像素一个像素地算；显卡可以并行处理一大批顶点和片元，光栅化、插值、深度测试、读贴图这些固定步骤，还有专门的硬件来做。

不过左边这份代码也有不少重复劳动，比如每个像素都在求同一个三角形的切线。下一篇[软渲染器性能优化](./extra4-Software-optimization.md)，我们继续用 CPU 算，看看把这些重复计算去掉，能快多少。对应的 demo 是 [http://localhost:8080/extra-webgpu-optimized](http://localhost:8080/extra-webgpu-optimized)。

## 写在最后

回头看一下，WebGPU 帮我们做掉的那些事：光栅化、插值、透视校正、深度测试，正好是前十天花力气最多的地方；留给我们自己写的，主要是着色器，以及把数据和绘图命令交给显卡。

刚看到 pipeline、bind group、render pass 这些名字，可能会觉得怎么这么麻烦。但和我们的 `IShader`、`Asset`、zbuffer 对照着看，每一块都有熟悉的影子。有了这十天打下的底子，再去看图形 API，应该也不会觉得那么神秘了。

## 参考链接

[WebGPU Fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)

[WebGPU 规范](https://www.w3.org/TR/webgpu/)

[WGSL 规范](https://www.w3.org/TR/WGSL/)

[Followup: Normal Mapping Without Precomputed Tangents](http://www.thetenthplanet.de/archives/1180)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
