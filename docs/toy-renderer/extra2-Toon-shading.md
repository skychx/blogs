---
id: extra2-Toon-shading
title: 番外：卡通渲染
sidebar_label: 番外：卡通渲染
description: 卡通渲染
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - 卡通渲染
  - Toon Shading
  - Sobel 边缘检测
---

import { RendererDemo, RendererDemos } from '../../src/components/rendererDemo';

前十天我们一直在追求「真实」：法线贴图、高光、阴影、环境光遮蔽，都是为了让画面更像真实世界。不过渲染并不总是要追求真实，有时候我们想要的是另一种风格，比如动画片、漫画那样的效果。这类渲染方法叫做**非真实感渲染（Non-Photorealistic Rendering，NPR）**，**卡通渲染（Toon Shading，也叫 Cel Shading）**就是其中最有代表性的一种。

day7 我们其实已经尝过一点卡通渲染的甜头了：把光照强度分成 6 档，人头一下子就有了卡通画的味道。不过真正的卡通渲染还有一个特点：**物体的轮廓会描上黑线**，就像手绘的线稿一样。这篇番外参考原教程第二版的 Bonus 一章，把这两样东西做完整。

> 本文源码 👉：[toy-renderer-ts/days/extra-toon](https://github.com/skychx/toy-renderer-ts/tree/main/days/extra-toon)

## 1.色阶

卡通渲染的第一步，是把平滑过渡的光照变成几个**色阶**。做法和 day7 一样，把光照强度「四舍五入」到几个固定的档位上，这次只分 3 档：

```ts
// 把光照强度分成 3 档
function quantize(intensity: number) {
  if (intensity > 0.66) return 1;
  if (intensity > 0.33) return 0.66;
  return 0.33;
}
```

卡通画一般都是大块的纯色，所以这次我们不用暗黑破坏神那张细节满满的贴图，直接给模型涂一个橙色。着色器还是熟悉的漫反射，法线用顶点法线插值，只是在最后把光照强度分了个档：

```ts
fragment(bar: Vec3): Color | null {
  const n = normalize(interpolate(this.varyingNormal, bar));
  // 模型没有做变换，法线和光照方向都在世界坐标系里，直接点乘就行
  const diffuse = Math.max(0, dot(n, light));
  const intensity = this.toon ? quantize(diffuse) : 0.3 + 0.7 * diffuse;
  const [r, g, b] = this.color;
  return [r * intensity, g * intensity, b * intensity];
}
```

左边是平滑的光照，右边是分成 3 档以后的效果，明暗之间不再有过渡，而是一块一块的色块：

<RendererDemos title="左：平滑的光照，右：光照分成 3 档">
  <RendererDemo src="extra-toon/smooth" title="平滑的光照" />
  <RendererDemo src="extra-toon/bands" title="光照分成 3 档" />
</RendererDemos>

## 2.描边

### 2.1 轮廓在哪里

第二步是描边。轮廓线画在哪里呢？我们想一想手绘的线稿：物体的外轮廓要画，胳膊挡在身体前面，胳膊的边缘也要画。这些地方有一个共同点：**深度会突然变化**。比如外轮廓那里，一边是物体，另一边是很远的背景；胳膊的边缘，一边是离相机近的胳膊，另一边是离相机远的身体。

zbuffer 里正好存着每个像素的深度，所以只要在 zbuffer 里找出深度突变的地方，就找到了轮廓。

### 2.2 Sobel 边缘检测

怎么判断深度是不是「突变」了呢？先看一维的情况。在一行像素里，每个像素都拿右边邻居的深度减去左边邻居的深度：如果是一段平缓的坡，这个差值很小；如果在这里跳了一下，差值就会突然变大：

![一维的边缘检测](/img/toy-renderer/extra2/sobel-1d.svg)

「右边减左边」这件事，可以看成用 $[-1, 0, 1]$ 这三个数，和当前像素左、中、右三个像素的深度分别相乘再相加，这种操作叫做**卷积**，$[-1, 0, 1]$ 叫做**卷积核**。

图片是二维的，横着和竖着都可能有轮廓，所以要用两个卷积核，分别检测横向和纵向的变化。[Sobel 算子](https://www.wikiwand.com/en/Sobel_operator)用的是下面这两个 3x3 的卷积核：

$$
K_x = \begin{bmatrix}-1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1\end{bmatrix}, \quad
K_y = \begin{bmatrix}-1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1\end{bmatrix}
$$

$K_x$ 其实就是三行 $[-1, 0, 1]$ 叠在一起，中间那一行权重大一点；$K_y$ 是它转过来的样子。分别卷积得到 $G_x$ 和 $G_y$ 以后，边缘的强度就是：

$$
G = \sqrt{G_x^2 + G_y^2}
$$

写成代码就是这样：

```ts
// Sobel 边缘检测：算出每个像素的深度变化有多剧烈
function sobel(zbuffer: Float32Array): Float32Array {
  const kx = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const ky = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];
  // 背景的深度是 -Infinity，没法参与计算，换成一个比所有物体都远的深度
  const depthAt = (x: number, y: number) => {
    const z = zbuffer[x + y * width];
    return (z === -Infinity ? -3 : z) * depthScale;
  };

  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // 用两个 3x3 的卷积核，分别算出横向和纵向的变化
      let gx = 0;
      let gy = 0;
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const d = depthAt(x + i, y + j);
          gx += kx[j + 1][i + 1] * d;
          gy += ky[j + 1][i + 1] * d;
        }
      }
      edges[x + y * width] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return edges;
}
```

和 day10 的 SSAO 一样，深度要乘上 `depthScale` 换算成像素，这样边缘强度的阈值才好定。最后把边缘强度大于 20 的像素画成黑色：

```ts
// 把边缘画成黑色的线
function drawEdges(frame: Frame, edges: Float32Array) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[x + y * width] > 20) {
        frame.set(x, y, [0, 0, 0]);
      }
    }
  }
}
```

只看边缘检测的结果，已经很像一张线稿了：

<RendererDemo src="extra-toon/edges" title="Sobel 边缘检测的结果" />

> 注：阈值 20 是试出来的。一个斜着 45° 的平面，深度每个像素变化 1，Sobel 算出来的强度大概是 8；轮廓那里深度动辄跳几十上百，所以取 20 正好能把两者分开。阈值越小，画出来的线越多

## 3.合起来

把轮廓画到色阶的结果上，卡通渲染就完成了：

<RendererDemo src="extra-toon/toon" title="卡通渲染：色阶 + 描边" />

是不是很有漫画的感觉？要知道，渲染器的代码一行都没改，只换了一个片元着色器，再加了一步后处理。

我们再换成人头试试，像不像一张简单上了色的速写：

<RendererDemo src="extra-toon/head" title="换成人头试试" />

人头后脑勺那一圈的描边特别粗，这是因为那里的表面几乎和视线平行，深度变化非常快，也被当成了轮廓。描边的方法其实还有很多，比如用法线的变化来找轮廓，或者把模型的背面放大一点、涂成黑色再画一遍，各有各的优缺点，感兴趣的同学可以自己动手试一试。

## 参考链接

[tinyrenderer（第二版）：Bonus: toon shading](https://haqr.eu/tinyrenderer/toon/)

[Sobel operator](https://www.wikiwand.com/en/Sobel_operator)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
