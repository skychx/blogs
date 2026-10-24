---
id: day9-Shadow-mapping
title: day9：阴影（Shadow Mapping）
sidebar_label: day9：阴影
description: 阴影（Shadow Mapping）
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day9：阴影
  - Shadow Mapping
  - 阴影贴图
  - shadow acne
---

昨天结尾留了一个问题：我们目前的光照都是「局部」的，每个像素只管自己的法线和光照方向，完全不知道光有没有被别的东西挡住，所以场景里一点阴影都没有。今天我们就用 **Shadow Mapping** 来给场景加上阴影。

需要先说明一下，今天实现的是**硬阴影**：一个点要么在阴影里，要么不在，阴影的边缘是锐利的。现实中阴影的边缘一般是模糊的（软阴影），那就是另外一个故事了。这部分内容对应 GAMES101 第 12 讲的最后一部分。

> 本文源码 👉：[toy-renderer-ts/days/day09](https://github.com/skychx/toy-renderer-ts/tree/main/days/day09)

## 1.思路

怎么判断一个点在不在阴影里？其实很简单：**站在光源的位置看过去，看得见的地方就是亮的，看不见的地方就在阴影里**。

「看不看得见」这件事，我们早就会算了，day4 的 zbuffer 干的就是这个活：它记录了每个像素上离我们最近的那个点的深度。所以 Shadow Mapping 的思路就是渲染两遍：

1. **第一遍**：把相机放到光源的位置渲染一遍场景，颜色不重要，只要 zbuffer。它记录了光源「看」过去，每个方向上离光源最近的那个点的深度，这张深度图就叫做 **shadow map**
2. **第二遍**：把相机放回原来的位置正常渲染。对于每个像素，算出它在光源的视角里是哪个点，再和 shadow map 里记录的深度比一比：如果 shadow map 里有一个离光源更近的点，说明光被挡住了，这个像素就在阴影里

![shadow map 的原理](/img/toy-renderer/day9/shadow-map.svg)

比如上图里，光沿着虚线照过来，先碰到的是遮挡物的那个角，shadow map 在这个方向上记录的就是它的深度。P 点在同一条光线上，但离光源更远，所以 P 在阴影里；Q 点前面什么都没有，shadow map 记录的就是 Q 自己，所以 Q 是亮的。

今天的场景换成了暗黑破坏神站在一块地板上，这样阴影投在地板上会更明显。光源是**平行光**（类似太阳光，所有光线方向都一样），所以第一遍渲染的时候不需要透视，用正交投影就行。

## 2.第一遍：生成 shadow map

### 2.1 正交投影

`createUniforms` 加了一个参数，用来选择透视投影还是正交投影。正交投影就是什么都不做，投影矩阵直接用单位矩阵：

```ts
// 根据相机的位置算出所有的 uniform；perspective 为 false 时用正交投影
function createUniforms(eye: Vec3, perspective = true): Uniforms {
  const center: Vec3 = [0, 0, 0];
  const up: Vec3 = [0, 1, 0];
  const ModelView = lookAt(eye, center, up);
  return {
    ModelView,
    Projection: perspective ? projection(length(sub(eye, center))) : identity(4),
    ModelViewIT: transpose(inverse(ModelView)),
    light: normalize(transformDirection(ModelView, light)),
  };
}
```

### 2.2 gl_FragCoord

第一遍渲染只需要深度，片元着色器算出来的颜色其实没人用。不过为了能直观地看一看 shadow map 长什么样，我们让片元着色器把深度画成灰度图。

问题来了：片元着色器怎么知道当前像素的深度？OpenGL 的片元着色器里有一个内置变量 `gl_FragCoord`，存的就是当前片元在屏幕上的坐标和深度。我们也给自己的「OpenGL」加上这个功能，在 `gl.ts` 里改两行就行：

```ts
// 片元着色器：根据当前像素的重心坐标，算出这个像素的颜色；返回 null 表示丢弃这个像素
// fragCoord 是当前像素在屏幕上的坐标和深度 [x, y, z]，相当于 OpenGL 里的 gl_FragCoord
fragment(bar: Vec3, fragCoord: Vec3): Color | null;
```

```ts
const color = shader.fragment(bc, [x, y, z]);
```

新参数放在了 `bar` 的后面，之前写的着色器只用 `bar`，不用做任何修改。

### 2.3 代码实现

第一遍的着色器非常简单，顶点着色器只做坐标变换，片元着色器把深度映射成灰度：

```ts
// 第一遍：从光源的位置看过去，只需要深度。片元着色器把深度画成灰度图，方便看看效果
class DepthShader implements IShader {
  model: Model;
  uniformM: Mat;

  constructor(model: Model, uniforms: Uniforms) {
    this.model = model;
    this.uniformM = matMul(uniforms.Projection, uniforms.ModelView);
  }

  vertex(iface: number, nthvert: number): Vec4 {
    const v = this.model.vert(iface, nthvert);
    return matVec(this.uniformM, [v[0], v[1], v[2], 1] as Vec4);
  }

  fragment(_bar: Vec3, fragCoord: Vec3): Color | null {
    // 深度的范围大致是 [-1.5, 1.5]，映射到 [0, 255]，离光源越近越亮
    const gray = Math.min(255, Math.max(0, ((fragCoord[2] + 1.5) / 3) * 255));
    return [gray, gray, gray];
  }
}
```

场景里有暗黑破坏神和地板两个模型，它们要画在同一个画布上、共用同一个 zbuffer，所以 `render` 改成了接收一组模型和着色器：

```ts
// 渲染一组模型，它们共用同一个帧缓冲和 zbuffer
function render(items: [Model, IShader][], frame: Frame, zbuffer: Float32Array) {
  for (const [model, shader] of items) {
    for (let i = 0; i < model.nfaces(); i++) {
      const clip: Vec4[] = [shader.vertex(i, 0), shader.vertex(i, 1), shader.vertex(i, 2)];
      triangle(clip, shader, Viewport, zbuffer, frame);
    }
  }
}
```

把相机放到光源的位置，渲染一遍，`shadowbuffer` 就是我们要的 shadow map：

```ts
// 第一遍：把相机放在光源的位置，用正交投影渲染一遍，得到 shadow map
const lightUniforms = createUniforms(light, false);
const depthFrame = new Frame(width, height);
const shadowbuffer = new Float32Array(width * height).fill(-Infinity);
render(
  [
    [diablo.model, new DepthShader(diablo.model, lightUniforms)],
    [floor.model, new DepthShader(floor.model, lightUniforms)],
  ],
  depthFrame,
  shadowbuffer,
);
```

画出来的灰度图是这样的，这就是从光源看过去的样子，离光源越近越亮：

![shadow map](/img/toy-renderer/day9/depth.jpg)

## 3.第二遍：判断阴影

### 3.1 找到 shadow map 里对应的点

第二遍渲染时，对于相机屏幕上的一个像素，我们要找到它在 shadow map 里对应的位置。这就又用到了矩阵的「组合」和「求逆」：

- 一个模型上的点，乘上 $M_{camera} = Viewport \times Projection \times ModelView$，就变换到了**相机**的屏幕上
- 同一个点，乘上 $M_{light}$（光源那一套矩阵），就变换到了**光源**的屏幕上

反过来，相机屏幕上的一个点，乘上 $M_{camera}^{-1}$ 就能变回模型坐标，再乘上 $M_{light}$ 就到了光源的屏幕上。所以：

$$
M_{shadow} = M_{light} \times M_{camera}^{-1}
$$

这个矩阵对所有像素都一样，提前算好，作为 uniform 传给着色器：

```ts
// 第二遍：从相机的位置正常渲染，每个像素都去 shadow map 里查一下自己有没有被挡住
const uniforms = createUniforms(eye);
// 相机的屏幕坐标 → 模型坐标 → 光源的屏幕坐标
const MCamera = matMul(Viewport, matMul(uniforms.Projection, uniforms.ModelView));
const MLight = matMul(Viewport, matMul(lightUniforms.Projection, lightUniforms.ModelView));
const MShadow = matMul(MLight, inverse(MCamera));
```

片元着色器里，拿当前像素的 `fragCoord` 乘上 $M_{shadow}$，就得到了它在光源屏幕上的坐标和深度，然后和 shadow map 比一比：

```ts
// 当前像素是不是被照亮：变换到光源的屏幕上，再和 shadow map 里记录的深度比一比
isLit(fragCoord: Vec3) {
  const [x, y, z, w] = matVec(this.uniformMShadow, [...fragCoord, 1] as Vec4);
  const sx = Math.round(x / w);
  const sy = Math.round(y / w);
  // 超出 shadow map 范围的地方，光源看不到，就当作是被照亮的
  if (sx < 0 || sy < 0 || sx >= width || sy >= height) {
    return true;
  }
  // shadow map 里存的是离光源最近的深度，比当前像素还近，说明有东西挡住了光
  return this.shadowbuffer[sx + sy * width] < z / w + this.bias;
}
```

注意最后要除以 w：$M_{camera}$ 里有透视投影，它的逆矩阵变换出来的齐次坐标 w 不一定是 1。至于 `bias` 是干什么用的，我们第 4 节再说。

### 3.2 着色

在阴影里的像素，光被挡住了，漫反射和高光都没有了，只剩下环境光。所以 Phong 光照模型加一个 `shadow` 参数，在阴影里时它是 0，把漫反射和高光都乘没：

```ts
// Phong 光照模型：shadow 是 0 表示这个像素在阴影里，只剩下环境光
function phong(asset: Asset, uniforms: Uniforms, uv: Vec2, n: Vec3, shadow: number): Color {
  const l = uniforms.light;
  const r = normalize(sub(scale(n, 2 * dot(n, l)), l));
  const ambient = 0.3;
  const diffuse = shadow * Math.max(0, dot(n, l));
  const strength = asset.spec.get(uv[0], uv[1])[0] / 255;
  const specular = shadow * strength * Math.pow(Math.max(0, r[2]), 20);
  const color = asset.diffuse.get(uv[0], uv[1]);
  return [
    Math.min(255, color[0] * (ambient + diffuse) + 255 * specular),
    Math.min(255, color[1] * (ambient + diffuse) + 255 * specular),
    Math.min(255, color[2] * (ambient + diffuse) + 255 * specular),
  ];
}
```

第二遍的着色器 `ShadowShader` 就是在 day8 切线空间法线贴图的基础上，多了一步判断阴影：

```ts
fragment(bar: Vec3, fragCoord: Vec3): Color | null {
  const uv = interpolate(this.varyingUV, bar);
  const n = normalize(interpolate(this.varyingNormal, bar));
  const shadow = this.isLit(fragCoord) ? 1 : 0;

  // 用切线空间的法线贴图扰动法线（和 day8 一样）
  const [p0, p1, p2] = this.varyingTri;
  const [uv0, uv1, uv2] = this.varyingUV;
  const E: Mat = [sub(p1, p0), sub(p2, p0)];
  const U: Mat = [
    [uv1[0] - uv0[0], uv1[1] - uv0[1]],
    [uv2[0] - uv0[0], uv2[1] - uv0[1]],
  ];
  if (Math.abs(U[0][0] * U[1][1] - U[0][1] * U[1][0]) < 1e-12) {
    return phong(this.asset, this.uniforms, uv, n, shadow);
  }
  const [t, b] = matMul(inverse(U), E);
  const nm = sampleNormal(this.asset.nmTangent, uv);
  const T = normalize(t as Vec3);
  const B = normalize(b as Vec3);
  const perturbed = normalize(add(add(scale(T, nm[0]), scale(B, nm[1])), scale(n, nm[2])));

  return phong(this.asset, this.uniforms, uv, perturbed, shadow);
}
```

## 4.Shadow acne

### 4.1 奇怪的条纹

先把 `bias` 设成 0 渲染一遍看看，结果是下面左图这个样子：地板和身体上全是奇怪的条纹，看起来像摩尔纹。这个问题非常经典，有个专门的名字叫 **shadow acne**（acne 是「粉刺」的意思，形容表面上长了一片麻点）：

![左：不加 bias，右：加上 bias](/img/toy-renderer/day9/acne.jpg)

这是怎么回事呢？按理说，没被挡住的点，它自己就是离光源最近的点，自己和自己比，深度应该刚好相等才对。

问题出在 **shadow map 是一格一格的**。shadow map 的每个像素只能存一个深度（像素中心那个点的深度），但一个像素覆盖的其实是一小片区域。如果表面相对于光源是斜着的，这一小片区域里的点深度各不相同，总会有一半的点比记录的深度离光源更远，于是它们就被误判成了在阴影里：

![shadow acne 的成因](/img/toy-renderer/day9/acne.svg)

再加上浮点数本身的精度误差，就出现了一圈一圈的条纹。

### 4.2 加一点余量

解决方法也很简单粗暴：比较深度的时候留一点余量（bias），**只有比 shadow map 里记录的深度远出一段距离，才算是被挡住了**：

```ts
return this.shadowbuffer[sx + sy * width] < z / w + this.bias;
```

我们的场景里 bias 取 0.02 就够了，上面右图就是加上 bias 以后的效果，条纹全都消失了。

bias 也不是越大越好：取得太大，本来应该在阴影里的点也会被判定成亮的，影子就和物体「脱离」了，看起来像飘在空中一样，这个问题叫做 Peter Panning（彼得·潘的影子会自己跑掉）。所以 bias 需要根据场景的尺度来调。

> 注：原教程里也用了这个方法，作者调出来的「魔法数字」是 43.34。看着很大，那是因为他的代码把深度映射到了 [0, 2000] 的范围；我们的深度没有做这个映射，所以 bias 取了一个小得多的值，换算下来比例差不多

### 4.3 最终效果

左边是没有阴影的版本，右边是加上阴影的版本。暗黑破坏神的身体和手爪在地板上投下了清晰的影子，身体上背光的地方也暗了下来，整个场景一下子就有了空间感：

![左：没有阴影，右：加上阴影](/img/toy-renderer/day9/shadow-compare.jpg)

<br />

<br />

Shadow Mapping 的代价是每一帧都要多渲染一遍，几乎多了一倍的计算量。不过这已经是实时渲染里最常用的阴影算法了，现在的游戏里随处可见它的身影，只不过会加上各种改进，比如让阴影边缘变得柔和的 PCF、PCSS 等等，感兴趣的同学可以看看 GAMES202。

到这里，场景的明暗关系已经比较真实了，不过环境光还是一个常数，这显然有点太简单了。明天是我们的最后一天，我们来实现**环境光遮蔽（Ambient Occlusion）**，看看怎么让环境光也「有明有暗」。

## 参考链接

[tinyrenderer Lesson 7: Shadow mapping](https://github.com/ssloy/tinyrenderer/wiki/Lesson-7:-Shadow-mapping)

[tinyrenderer（第二版）：Shadow mapping](https://haqr.eu/tinyrenderer/shadow/)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
