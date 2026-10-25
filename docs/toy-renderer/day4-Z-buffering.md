---
id: day4-Z-buffering
title: day4：Z-buffering（深度缓冲）
sidebar_label: day4：Z-buffering
description: Z-buffering（深度缓冲）
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day4：Z-buffering（深度缓冲）
  - 深度图
  - 深度缓冲
  - 纹理贴图
---

import { RendererDemo } from '../../src/components/rendererDemo';

在第三天的学习中，我们学会了如何利用**重心坐标**算法画三角形，并运用**三角形绘制算法**把人头模型画了出来。虽然最后的渲染结果能看出来这是个脑袋，但是嘴巴处有很明显的穿帮。这一天我们就学习一下，如何利用 Z-buffering（深度缓冲）来解决层叠问题，最后再给模型贴上纹理。

> 本文源码 👉：[toy-renderer-ts/days/day04](https://github.com/skychx/toy-renderer-ts/tree/main/days/day04)

## 1.画家算法

在正式讲解 Z-buffering 问题之前，我们先来了解一下[画家算法](https://www.wikiwand.com/en/Painter%27s_algorithm)。这个算法的思想极其简单，我们可以结合下图简单分析一下：

![day04_Painter's_algorithm](https://image-1255652541.file.myqcloud.com/uPic/day04_Painter's_algorithm.png)

如果要画一个有山有草有树林的风景画，一个初学者画家可以按以下绘制顺序画画：

- 首先画**最远**处的山
- 然后画**次远**处的草原
- 最后画**最近**的树木

或者我们用更程序员的方式描述一下：

- 首先画 `z-index=1` 处的山
- 然后画 `z-index=2` 处的草原
- 最后画 `z-index=3` 的树木

在现代主流的 UI 渲染引擎中，各个元素的先后层级顺序基本上都是用「画家算法」这种思路决定的：

- 网页通过 CSS 的 `z-index` 控制层级顺序
- iOS 通过 `layer.zPosition` 控制层级顺序
- Android 通过 `index` 控制层级顺序

平常画 UI 时，我们可以简单粗暴的把各个 View 理解为一个一个的二维盒子，每个盒子在 z 轴上都是互相独立的，这样我们就可以方便的用 `z-index` 动态控制盒子的层级；但是在渲染三维物体时，三维模型在 z 轴上是连续的，并且三维模型间还会互相组合交错，这种通过 `z-index` 控制层级的方案很难奏效。

举个最简单的例子，下图中三个互相交错的三角形，**只**使用 `z-index` 是无法区分层级的，更不要说绘制了：

![day04_three_triangles](https://image-1255652541.file.myqcloud.com/uPic/day04_three_triangles.png)

> 注：[Newell 算法](https://www.wikiwand.com/en/Newell%27s_algorithm)可以解决多边形重叠导致排序困难的问题，感兴趣的同学可以自行查阅学习

为了解决这个问题，2020 年获得「图灵奖」的计算机图形学大佬——[艾德文·卡特姆](https://www.wikiwand.com/en/Edwin_Catmull)，提出了一个著名的算法——Z-buffering。


## 2.Z-buffering

[Z-buffering](https://www.wikiwand.com/en/Z-buffering)，中文名又为「深度图」「深度缓冲」，它是通过记录比较**每个像素**的深度信息来解决层级问题。

Z-buffering 算法理解起来其实是非常直观的，我们这里借用《虎书 4》里的一张插图（可以关注🛰️号「卤代烃实验室」后台回复「图形学」领取本书）来讲解一下 Z-buffering 的工作原理。

![day04_Z-buffering](https://image-1255652541.file.myqcloud.com/uPic/day04_z-buffer.jpg)

首先我们假设要在一个 `8*8` 的屏幕上渲染两个互相遮挡的三角形，我们在正式渲染前先开辟一块儿 `8*8` 的二维内存空间，这个空间的默认值均为 `-∞`。

假设我们已知两个三角形的每个像素的深度信息，红三角形的深度均为 5，紫三角形的深度区间为 [3, 8]。

我们先遍历红色三角形的所有像素，和 `Z-buffering` 的默认值 `-∞` 比较，哪个值大，就保留哪个值。经过第一轮比较后，我们就记录了红色三角形的深度信息。

然后我们遍历紫色三角形的所有像素。和最新的 `Z-buffering` 逐像素比较，哪个值大，就保留哪个值。第二轮比较后我们就又记录了紫色三角形的深度信息。

最后我们就得到了一份**深度缓冲**，它记录了这张图片的层级顺序，最终渲染时我们按这个深度缓冲逐像素渲染三角形即可。

上面的思路写成伪代码就是这样的：

```txt
// 首先假设深度默认值都是负无穷 -∞（这里可以是无穷大，也可以是无穷小，依坐标系而定）
for (each triangle T)              // 遍历每个三角形
   for (each sample (x,y,z) in T)  // 遍历三角形里的每个像素
        if (z > zbuffer[x,y])        // 如果深度大于已有的值，
            framebuffer[x,y] = rgb;  // 则更新颜色，
            zbuffer[x,y] = z;        // 并更新 zbuffer
        else
            // do nothing            // 小于已有的值，就说明这个像素点被遮挡不需要绘制了
```


## 3.代码实现

理解了上面的伪代码，写成真正的代码就很容易了。

首先我们定义一下 `Z-buffering` 的数据结构。按道理来说，我们直接定义成一个二维数组是最符合渲染场景的，第一维表示`列`，第二维表示`行`：

```ts
// [[1, 2, 3],
//  [4, 5, 6],
//  [7, 8, 9]]
```

但是我们并不需要这样写，我们可以把二维数组拍平，然后通过`偏移量`进行访问（可以联想一下`循环队列`和`最大堆`这两种数据结构的底层实现）：

```ts
// [[1, 2, 3],       [1, 2, 3,
//  [4, 5, 6],   =>   4, 5, 6,
//  [7, 8, 9]]        7, 8, 9]
```

定义好结构后，我们给 Z-buffering 的每个子元素都赋上 `-∞` 的默认值：

```ts
const zbuffer = new Float32Array(width * height).fill(-Infinity);
```

这里用的是 `Float32Array` 而不是普通的数组，它是 JS 里的「类型化数组」，和 C++ 里的 `float` 数组一样，在内存里是一块连续的空间，每个元素固定占 4 个字节。存几十万个数字的时候，它比普通数组更省内存，读写也更快。

最后把上面的伪代码翻译为正常的 `ts` 代码就可以了，光栅化函数 `triangle` 多了一个 `zbuffer` 参数：

```ts
// 三角形光栅化，同时用 zbuffer 处理遮挡关系
function triangle(pts: Vec3[], zbuffer: Float32Array, frame: Frame, color: Color) {
  // 步骤 1：找出包围盒，包围盒不能超出画布的边界
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.max(0, Math.min(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxX = Math.min(frame.width - 1, Math.max(...xs));
  const maxY = Math.min(frame.height - 1, Math.max(...ys));

  // 步骤 2：遍历包围盒里的每一个像素
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const bc = barycentric(pts, [x, y]); // bc 是 Barycentric Coordinates 的缩写
      if (bc[0] < 0 || bc[1] < 0 || bc[2] < 0) {
        continue;
      }

      // 计算当前像素的深度：用重心坐标对三个顶点的 z 做插值
      const z = pts[0][2] * bc[0] + pts[1][2] * bc[1] + pts[2][2] * bc[2];

      // 比已有的深度大（离我们更近），才更新 zbuffer 并绘制
      const index = x + y * frame.width;
      if (zbuffer[index] < z) {
        zbuffer[index] = z;
        frame.set(x, y, color);
      }
    }
  }
}
```

这里还有一个小细节：三角形的顶点现在要保留 z 坐标了，所以屏幕坐标从二维的 `Vec2` 变成了三维的 `Vec3`，x、y 做视口变换，z 原样保留：

```ts
// 把模型坐标变换到屏幕坐标：x、y 做视口变换（四舍五入成整数），z 保持不变
function world2screen(v: Vec3): Vec3 {
  return [Math.round(((v[0] + 1) * width) / 2), Math.round(((v[1] + 1) * height) / 2), v[2]];
}
```

加入 Z-buffering 计算后，我们渲染的模型就完全正常了：

<RendererDemo src="day04/zbuffer-model" title="加入 Z-buffering 后的渲染结果" />


相应的，如果把 Z-buffering 渲染为一张图（离我们越近越白），则是下面这样的：

<RendererDemo src="day04/zbuffer-image" title="把 Z-buffering 画成一张灰度图" />

<br />

个人认为 Z-buffering 的概念还是很简单的，理论了解清楚后代码很容易写出来。在实际应用中，Z-buffering 其实还有很多的问题，例如因为精度问题引起的 [z-fighting](https://www.wikiwand.com/en/Z-fighting)，相应的也有一些解决方案。因为本系列教程目标只是构建一个**最小功能**的软渲染器，这些相对深入的问题就不探讨了，感兴趣的同学可以自行搜索学习。



## 4.纹理贴图

### 4.1 重心坐标的另一个用法

在第三天的文章里我说过，重心坐标最重要的运用其实是用来做**插值**。回头看一下上面的代码，计算当前像素的深度时，我们用的就是重心坐标插值：

$$
z_P = \alpha z_A + \beta z_B + \gamma z_C
$$

其中 $(\alpha, \beta, \gamma)$ 是像素 P 的重心坐标。三个顶点的 z 值已知，用重心坐标「加权平均」一下，就得到了三角形内部任意一个像素的 z 值。

那么问题来了，除了 z 值，顶点上还有没有别的数据可以这么插值呢？当然有，比如这一节要讲的**纹理坐标**。

### 4.2 uv 坐标

我们用文本编辑器打开模型文件，除了第二天用到的 `v` 和 `f`，还能看到很多以 `vt` 开头的行：

```bash
vt  0.532 0.923 0.000
```

`vt` 就是纹理坐标（texture coordinate），一般叫作 **uv 坐标**，前两个数分别是 u 和 v，取值范围都是 $[0, 1]$（第三个数用不到）。而 `f` 那一行里，每组数字中间的那个数，就是这个顶点对应的 uv 坐标的序号：

```bash
f 24/1/24 25/2/25 26/3/26
# 第一个顶点：顶点序号 24，uv 序号 1，法线序号 24
```

uv 坐标描述的是：**模型上的每个顶点，对应贴图上的哪个位置**。我们可以把模型想象成一个包装盒，把它沿着某些边剪开、压平，就得到了一张平面图，美术同学再照着这张平面图画上颜色，就是贴图了。

我们把每个三角形按 uv 坐标画到贴图上，就能看出来模型是怎么被「压平」的：

![把模型的 uv 三角形画在贴图上](/img/toy-renderer/day4/uv-layout.jpg)

可以看出，人脸在正中间，耳朵在两侧，后脑勺从中间剪开，分到了贴图的左右两边。

### 4.3 读取贴图

原教程的贴图是 tga 格式的，浏览器不认识，所以我提前把它们都转成了 png（转换脚本在仓库的 `scripts/tga2png.ts` 里，和渲染器本身没关系）。

浏览器本身就能解码 png，我们只需要把解码后的像素读出来就行。思路是先把图片画到一个离屏 canvas 上，再用 `getImageData` 把像素取出来：

```ts
// 读取 png 贴图
export async function loadTexture(url: string) {
  const blob = await (await fetch(url)).blob();
  // 贴图里存的不一定是颜色（后面我们还会用贴图存法线），所以不能让浏览器做颜色校正
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });

  // 先把图片画到一个离屏 canvas 上，再用 getImageData 把像素读出来
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  return new Texture(bitmap.width, bitmap.height, data);
}
```

`Texture` 类只有一个方法 `get`，根据 uv 坐标取颜色：

```ts
export class Texture {
  width: number;
  height: number;
  data: Uint8ClampedArray; // 每个像素 4 个字节：r、g、b、a

  constructor(width: number, height: number, data: Uint8ClampedArray) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  // 根据 uv 坐标取颜色，u、v 的取值范围都是 [0, 1]
  get(u: number, v: number): Color {
    // uv 坐标的原点在图片的左下角，而图片的像素是从上往下存的，所以 v 要翻转一下
    const x = Math.min(this.width - 1, Math.max(0, Math.floor(u * this.width)));
    const y = Math.min(this.height - 1, Math.max(0, Math.floor((1 - v) * this.height)));
    const i = (y * this.width + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2]];
  }
}
```

又看到了熟悉的 y 轴翻转：uv 坐标的原点在左下角，和我们的坐标系一样，但图片的像素是从上往下存的，所以 v 要换成 `1 - v`。

### 4.4 插值 uv

剩下的事情就很简单了：模型解析时把 `vt` 也读进来，然后在光栅化的时候，用重心坐标对三个顶点的 uv 做插值，再拿插值出来的 uv 去贴图里取颜色：

```ts
// 带纹理的三角形光栅化：和上面的 triangle 相比，多了插值 uv、从贴图里取颜色这两步
function triangleWithTexture(
  pts: Vec3[],
  uvs: Vec2[],
  zbuffer: Float32Array,
  frame: Frame,
  texture: Texture,
  intensity: number,
) {
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.max(0, Math.min(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxX = Math.min(frame.width - 1, Math.max(...xs));
  const maxY = Math.min(frame.height - 1, Math.max(...ys));

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const bc = barycentric(pts, [x, y]);
      if (bc[0] < 0 || bc[1] < 0 || bc[2] < 0) {
        continue;
      }

      const z = pts[0][2] * bc[0] + pts[1][2] * bc[1] + pts[2][2] * bc[2];
      const index = x + y * frame.width;
      if (zbuffer[index] < z) {
        zbuffer[index] = z;

        // 计算当前像素的 uv：和深度一样，也是用重心坐标对三个顶点的 uv 做插值
        const u = uvs[0][0] * bc[0] + uvs[1][0] * bc[1] + uvs[2][0] * bc[2];
        const v = uvs[0][1] * bc[0] + uvs[1][1] * bc[1] + uvs[2][1] * bc[2];

        // 从贴图里取出颜色，再乘上光照强度
        const color = texture.get(u, v);
        frame.set(x, y, [color[0] * intensity, color[1] * intensity, color[2] * intensity]);
      }
    }
  }
}
```

注意 uv 的插值放在了深度测试的后面：被挡住的像素反正也不画，就没必要去贴图里取颜色了。

调用的地方，把三个顶点的 uv 一起传进去就行：

```ts
for (let j = 0; j < 3; j++) {
  const v = model.vert(face[j]);
  worldCoords.push(v);
  screenCoords.push(world2screen(v));
  uvs.push(model.uv(i, j)); // 拿出三个顶点的 uv 坐标
}

const intensity = lightIntensity(worldCoords);
if (intensity > 0) {
  triangleWithTexture(screenCoords, uvs, zbuffer, frame, texture, intensity);
}
```

贴上纹理以后，人头模型一下子就有了皮肤和头发：

<RendererDemo src="day04/texture" title="贴上纹理以后的模型" />

<br />

<br />

到这里，我们的人头模型已经有模有样了。不过它看起来还是有点「平」，明天我们学习**透视投影**，让它变得更立体。

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
