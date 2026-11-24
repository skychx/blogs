---
id: day3-draw-triangle
title: day3：画一个三角形
sidebar_label: day3：画一个三角形
description: 画一个三角形
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day3：画一个三角形
  - 向量点乘
  - 向量叉乘
  - 重心坐标
---

import { RendererDemo } from '../../src/components/rendererDemo';

前面两天画了点和线，今天我们来画一个最简单也是最强大的面——**三角形**。

本文主要讲解三角形绘制算法的推导和思路（只涉及到一点点的向量知识），最后会给出代码实现，大家放心的看下去就好。

<br />

> 本文源码 👉：[toy-renderer-ts/days/day03](https://github.com/skychx/toy-renderer-ts/tree/main/days/day03)



## 1.如何画一个三角形？

在正式开始这一小节前，我们先想一下如何利用上一节的画线算法绘制一个**实心的**三角形。

假设现在平面内有三个不共线的点组成一个三角形，我们可以利用上一节的直线算法轻易的连接三角形的三条边，这时候我们会生成一个**空心的**、**封闭的**三角形。

那么这时候问题就转换为，如何把这个空心的三角形变为一个**实心**的三角形？

我想大家这时候已经有思路了，就是**一行一行地扫描像素**，把两个边界点之间的像素全部涂满上色就可以了。

![day03_scanLineDrawTriangle](https://image-1255652541.file.myqcloud.com/uPic/day03_scanLineDrawTriangle.jpg)

这个方法肯定是可以的，但是实现不是很优雅，也不是业内的主流实现方式。因为基于行扫描的算法不是本文的重点，所以详细的推导和代码实现就不提供了，感兴趣的同学可以自己尝试实现一下。





## 2.利用向量叉乘画三角形

开始本节前先简单复习一下向量叉乘的几何意义。


### 2.1 数学推导

在三维空间中，两个三维向量 $\mathbf {a}$  和 $\mathbf {b}$ 做叉乘，会得到一个和已知两个向量**垂直**的新向量 $\mathbf {a} \times \mathbf {b}$。

既然叉乘产生的是一个新向量，那么它肯定有个方向，我们一般用右手定则来判断：将右手食指指向 $\mathbf {a}$ 的方向、中指指向 $\mathbf {b}$ 的方向，则此时拇指的方向即为 $\mathbf {a} \times \mathbf {b}$ 的方向。

![Right_hand_rule_cross_product.svg](https://image-1255652541.file.myqcloud.com/uPic/Right_hand_rule_cross_product.svg.png)



综上所述，我们可以对向量叉乘做一个严谨的定义：

$$
{\displaystyle \mathbf {a} \times \mathbf {b} =\|\mathbf {a} \|\|\mathbf {b} \|\sin(\theta )\ \mathbf {n} }
$$

其中 $\theta$ 表示 $\mathbf {a}$  和 $\mathbf {b}$  在它们所定义的平面上的夹角（$0^{\circ }\leq \theta \leq 180^{\circ}$）。${\displaystyle \|\mathbf {a} \|}$ 和 $\displaystyle \|\mathbf {b} \|$ 是向量 $\mathbf {a}$ 和 $\mathbf {b}$ 的模长，而 $\mathbf{n}$ 则是一个与 $\mathbf {a}$ 、$\mathbf {b}$ 所构成的平面垂直的单位向量，方向由右手定则决定。

<br />

有上面的理论，我们就可以判断两个向量的相对位置：

- $\mathbf {a}$  向量叉乘 $\mathbf {b}$ 向量，如果值为**正**，则表示 $\mathbf {b}$ 向量在 $\mathbf {a}$ 向量**左**侧
- $\mathbf {a}$  向量叉乘 $\mathbf {b}$ 向量，如果值为**负**，则表示 $\mathbf {b}$ 向量在 $\mathbf {a}$ 向量**右**侧
- $\mathbf {a}$  向量叉乘 $\mathbf {b}$ 向量，如果值为**零**，则表示 $\mathbf {b}$ 向量与 $\mathbf {a}$ 向量**共线**

<br />

会判断两条线的相对位置了，我们可以做个理论迁移，**利用向量叉乘判断点和三角形的位置关系**。

例如下面这里例子，对于三角形 $\Delta ABC$ 来说，把三条边看作 $\overrightarrow{A B}$、 $\overrightarrow{B C}$、 $\overrightarrow{C A}$ 三条首尾相连的向量，平面内有一个点 $P$，我们通过向量叉乘来判断相对位置：

![day03_cross_product](https://image-1255652541.file.myqcloud.com/uPic/day03_cross_product.jpg)

- $\overrightarrow{A B} \times \overrightarrow{A P}$，值为**正**，故 $P$ 在 $AB$ **左侧**
- $\overrightarrow{B C} \times \overrightarrow{B P}$，值为**正**，故 $P$ 在 $BC$ **左侧**
- $\overrightarrow{C A} \times \overrightarrow{C P}$，值为**正**，故 $P$ 在 $AC$ **左侧**

<br />

综合以上三个限制条件，我们可以判断 $P$ 在 $\Delta ABC$ 内。

如果上面三个计算中有值为负的情况，说明 $P$ 在三角形外；如果有值为 0 的情况，说明 $P$ 在三角形的边或顶点上。

> 注：上面的结论有个前提，三角形的三个顶点 $A \rightarrow B \rightarrow C$ 是按**逆时针**顺序排列的。如果是顺时针排列，三角形内部的点算出来三个值会**同时为负**，判断条件反过来就行



### 2.2 代码实现

理论基础复习完了，我们就可以写代码了。代码实现相当简单，我们构建一个函数 `crossProduct`，传入三角形的三个顶点和平面上的任意一点 $P$，然后根据四个顶点构建出向量计算叉乘就可以了。

二维向量的叉乘结果是一个数（相当于三维叉乘结果的 z 分量），我们先写一个小工具函数 `cross2D`：

```ts
// 二维向量的叉乘，结果是一个数（相当于三维叉乘结果的 z 分量）
function cross2D(a: Vec2, b: Vec2) {
  return a[0] * b[1] - a[1] * b[0];
}

// 利用叉乘判断点是否在三角形内部
function crossProduct(pts: Vec2[], P: Vec2): Vec3 {
  const [A, B, C] = pts;

  // 构建出三角形 ABC 三条边的向量
  const AB: Vec2 = [B[0] - A[0], B[1] - A[1]];
  const BC: Vec2 = [C[0] - B[0], C[1] - B[1]];
  const CA: Vec2 = [A[0] - C[0], A[1] - C[1]];

  // 三角形三个顶点和 P 连接形成的向量
  const AP: Vec2 = [P[0] - A[0], P[1] - A[1]];
  const BP: Vec2 = [P[0] - B[0], P[1] - B[1]];
  const CP: Vec2 = [P[0] - C[0], P[1] - C[1]];

  return [cross2D(AB, AP), cross2D(BC, BP), cross2D(CA, CP)];
}
```

<br />

代码非常的简单，我们跑一个简单的例子验证一下：

```ts
function drawCrossProductTriangle(canvas: HTMLCanvasElement) {
  const frame = new Frame(200, 200);
  const pts: Vec2[] = [
    [10, 10],
    [150, 30],
    [70, 160],
  ];

  // 遍历图片中的所有像素
  for (let x = 0; x < frame.width; x++) {
    for (let y = 0; y < frame.height; y++) {
      const bc = crossProduct(pts, [x, y]);

      // 某个分量小于 0 则表示此点在三角形外（认为边也是三角形的一部分）
      if (bc[0] < 0 || bc[1] < 0 || bc[2] < 0) {
        continue;
      }
      frame.set(x, y, red);
    }
  }

  frame.render(canvas);
}
```

<br />

看输出图像，我们已经成功绘制了一个三角形：

<RendererDemo src="day03/cross-product" title="用叉乘画的三角形" size={400} />

<br />

> 触不及防的安利：大家可以看我头像关注🛰️号「卤代烃实验室」，后台回复「图形学」获取经典教材《虎书4》和《Real Time Rendering 4》

![后台回复「图形学」领取经典教材](https://image-1255652541.file.myqcloud.com/uPic/rendering_book.jpg)


## 3.利用三角形重心坐标画三角形

本小节介绍一个更通用的定理——**重心坐标（Barycentric Coordinate）**。其实[重心坐标](https://www.wikiwand.com/en/Barycentric_coordinate_system)用来画三角形还是有些大材小用了，他最重要的运用其实是用来做**插值**，不过插值的具体运用我们后续章节再探讨，今天我们看看重心坐标的推导和代码实现。



### 3.1 数学推导

我们暂时只考虑二维平面的三角形。对于一个三角形 $\Delta ABC$ 来说，假设平面内有一个点 $P$，很显然，$\overrightarrow{A P}$，$\overrightarrow{A B}$，$\overrightarrow{A C}$ 向量都是线性相关的，也就是说，可以用下式表示 $\overrightarrow{A P}$：

$$
\overrightarrow{A P}=u \overrightarrow{A B}+v \overrightarrow{A C}
$$

我们把这个三角形放在一个笛卡尔坐标系下，我们就可以这样表示：

$$
A-P=u(A-B)+v(A-C)
$$

把位置挪一下，合并同类项后，$P$ 点的位置可以表示为下式：

$$
P=(1-u-v) A+u B+v C
$$

<br />

结合几何意义，我们很容易推出：

- 当 $(1 - u - v)$、$u$ 和 $v$ 均**大于 0 小于 1** 时，P 位于三角形**内部**
- 有**一个**分量等于 0 时，P 在三角形**边**上
- 有**两个**变量等于 0 时，P 在某个**顶点**上

<br />

再对第一个式子做一下变形，可以得到下式：

$$
u \overrightarrow{A B}+v \overrightarrow{A C}+\overrightarrow{P A}=0
$$

<br />

因为三角形位于笛卡尔坐标系内，我们可以把上面的式子沿 $x$ 和 $y$ 轴拆分为两个式子，他们和上式是等价的：

$$
\left\{\begin{array}{l}u \overrightarrow{A B}_{x}+v \overrightarrow{A C}_{x}+\overrightarrow{P A}_{x}=0 \\ u \overrightarrow{A B}_{y}+v \overrightarrow{A C}_{y}+\overrightarrow{P A}_{y}=0\end{array}\right.
$$

<br />

观察这个式子，我们可以转换为矩阵乘法的形式：

$$
\left[\begin{array}{lll}u & v & 1\end{array}\right]\left[\begin{array}{l}\overrightarrow{A B}_{x} \\ \overrightarrow{A C}_{x} \\ \overrightarrow{P A}_{x}\end{array}\right]=0
$$

$$
\left[\begin{array}{lll}u & v & 1\end{array}\right]\left[\begin{array}{l}\overrightarrow{A B}_{y} \\ \overrightarrow{A C}_{y} \\ \overrightarrow{P A}_{y}\end{array}\right]=0
$$

<br />

观察上面的式子，我们要寻找一个向量 $[\begin{array}{lll}u & v & 1\end{array}]$，它要与向量 $[\begin{array}{l}\overrightarrow{A B}_{x} \ \overrightarrow{A C}_{x} \ \overrightarrow{P A}_{x}\end{array}]$ 和 $[\begin{array}{l}\overrightarrow{A B}_{y} \ \overrightarrow{A C}_{y} \ \overrightarrow{P A}_{y}\end{array}]$ **同时点乘为 0**。

稍微思考一下，这不就意味着向量 $[\begin{array}{lll}u & v & 1\end{array}]$ **同时垂直**于向量 $[\begin{array}{l}\overrightarrow{A B}_{x} \ \overrightarrow{A C}_{x} \ \overrightarrow{P A}_{x}\end{array}]$ 和 $[\begin{array}{l}\overrightarrow{A B}_{y} \ \overrightarrow{A C}_{y} \ \overrightarrow{P A}_{y}\end{array}]$ 吗！

所以我们直接求**后两个向量的叉乘**就可以求出向量 $[\begin{array}{lll}u & v & 1\end{array}]$ 了。

<br />

后两个向量做叉乘的时候有个小细节需要注意一下，向量叉乘的**直接结果**（先假设结果为 $[\begin{array}{lll}e & f & g\end{array}]$ ）一般只是和 $[\begin{array}{lll}u & v & 1\end{array}]$ 平行，想要正确求出 $u$ 和 $v$ 的值，我们需要对向量 $[\begin{array}{lll}e & f & g\end{array}]$ 除以 $g$，也就是说 $u = e/g$，$v = f/g$，$1 = g/g$。

这个时候问题就来了，上面的除法成立，必须要建立在 $g$ 不为 0 的基础上，那么我们就要研究一下 $g$ 为 0 的数学含义了。

根据向量的叉乘公式：

$$
\mathbf{u} \times \mathbf{v}=\left|\begin{array}{cc}u_{2} & u_{3} \\ v_{2} & v_{3}\end{array}\right| \mathbf{i}-\left|\begin{array}{cc}u_{1} & u_{3} \\ v_{1} & v_{3}\end{array}\right| \mathbf{j}+\left|\begin{array}{cc}u_{1} & u_{2} \\ v_{1} & v_{2}\end{array}\right| \mathbf{k}
$$

$g$ 向量可以表示为这样的行列式：

$$
\left|\begin{array}{ll}\overrightarrow{A B}_{x} & \overrightarrow{A C}_{x} \\ \overrightarrow{A B}_{y} & \overrightarrow{A C}_{y}\end{array}\right|
$$

如果这时候的叉乘结果为 0，把这个行列式**从列向量的视角看**，就相当于 $\overrightarrow{A B}$  和 $\overrightarrow{A C}$ 向量叉乘结果为 0，也就是说 $\overrightarrow{A B}$ 和 $\overrightarrow{A C}$ 向量共线。这时候三角形 $\Delta ABC$ 就**退化为一条线段**。

对于我们现在应用场景来说，只要检测到 $g$ 为 0，就意味着这个三角形退化为一条线段了，我们直接舍弃掉它就好了，对最后的结果也没有影响。



### 3.2 代码实现

根据上面的公式推导，我们可以直接写出基于三角形重心坐标的绘制算法。先给数学库 `math.ts` 加上几个向量运算，今天会用到叉乘、点乘、相减和归一化：

```ts
// 向量相减 a - b
export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

// 向量点乘
export function dot(a: Vec3, b: Vec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// 向量叉乘
export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// 向量的长度（模长）
export function length(v: Vec3) {
  return Math.sqrt(dot(v, v));
}

// 归一化：方向不变，长度变成 1
export function normalize(v: Vec3): Vec3 {
  const len = length(v);
  return [v[0] / len, v[1] / len, v[2] / len];
}
```

思路理清了，重心坐标的代码实现就非常的简单：

```ts
// 利用重心坐标判断点是否在三角形内部
function barycentric(pts: Vec2[], P: Vec2): Vec3 {
  const [A, B, C] = pts;
  const x: Vec3 = [B[0] - A[0], C[0] - A[0], A[0] - P[0]]; // AB、AC、PA 在 x 轴上的分量
  const y: Vec3 = [B[1] - A[1], C[1] - A[1], A[1] - P[1]]; // AB、AC、PA 在 y 轴上的分量

  // [u, v, 1] 和 x、y 两个向量的点乘都为 0，所以 x、y 叉乘得到的向量和 [u, v, 1] 平行
  const u = cross(x, y);

  // A、B、C、P 的坐标都是整数，所以 u[2] 也一定是整数，取值为 ..., -2, -1, 0, 1, 2, ...
  // 所以 u[2] 的绝对值小于 1 意味着它就是 0，三角形退化成了一条线段，直接舍弃
  if (Math.abs(u[2]) < 1) {
    return [-1, 1, 1];
  }
  return [1 - (u[0] + u[1]) / u[2], u[0] / u[2], u[1] / u[2]];
}
```

<br />

用上面的算法画个三角形验证一下，很完美：

<RendererDemo src="day03/barycentric" title="用重心坐标画的三角形" size={400} />





## 4.绘制模型

算法写好了，我们就要投入到实际应用中了，昨天里我们画了个三维模型的线框图，今天我们就给这个模型上色。



### 4.1 随机着色

为了区分每个三角形，我们随机给三角形上不同的色：

```ts
const randomColor: Color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
triangle(screenCoords, frame, randomColor);
```

<br />

这里还有个关于性能的小细节。这次我们绘制的图像大小为 `800*800`，如果按照之前的算法，每次画三角形，都要把所有像素遍历一遍，这个模型有 2492 个三角形，那就是要循环 `2492*800*800`，差不多 `16 亿` 次！

这个量级是很恐怖的，其中很多的运算都是不必要的，比如说下图，我们其实只要循环由三个顶点计算出的**红色包围盒里的像素**就可以了，不需要计算图片内的所有像素：

![day03_bounding_box](https://image-1255652541.file.myqcloud.com/uPic/day03_bounding_box.jpg)

<br />

所以我们要在遍历像素前先求一遍三角形包围盒的边界，正式画三角形时只要遍历包围盒内的像素就可以了：

```ts
// 自己实现的三角形光栅化函数
// 主要思路是遍历包围盒里的每一个像素，用重心坐标判断它在不在三角形内
function triangle(pts: Vec2[], frame: Frame, color: Color) {
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

      // 重心坐标有一个分量小于 0，说明这个点在三角形外面（边上的点也算三角形的一部分）
      if (bc[0] < 0 || bc[1] < 0 || bc[2] < 0) {
        continue;
      }
      frame.set(x, y, color);
    }
  }
}
```

<br />

最后我们绘制出的结果就是这样的，看着还是有些酷炫的：

<RendererDemo src="day03/random-colors" title="随机着色" />



### 4.2 简单的光照着色

随机着色的好处是可以很清楚的表现出模型各个三角形的轮廓，但是也失去了模型的辨识度，很多细节都丢失了。

我们在这里引入一个非常简单的光照模型，认为**单位面积上接收到的光，和平面法线与光照方向的余弦值成正比**：

![day03_diffuse_reflection](https://image-1255652541.file.myqcloud.com/uPic/day03_diffuse_reflection.jpg)

<br />

所以着色的思路就很清晰了：

- 我们要先定义一个三维空间里的**光照方向（向量）**，然后计算三维空间里各个三角形的**法线（向量）**
- 两个向量**归一化**后，然后计算这两个向量的点乘，会得到一个值
- 这个值小于 0，说明光在三角形的另一侧，从物理上看是照射不到三角形表面的，所以直接舍弃此三角形
- 这个值大于 0，值**越大**，说明单位面积上接收到的光**越多**，三角形**越亮**

<br />

把上面的思路翻译成代码就是这样的：

```ts
// 这个是用一个模拟光照对三角形进行着色
const lightDir: Vec3 = [0, 0, -1]; // 假设光是垂直屏幕照进去的

for (let i = 0; i < model.nfaces(); i++) {
  const face = model.face(i);
  const screenCoords: Vec2[] = [];
  const worldCoords: Vec3[] = [];

  // 计算世界坐标和屏幕坐标
  for (let j = 0; j < 3; j++) {
    const v = model.vert(face[j]);
    // 投影为正交投影，而且只做了个简单的视口变换
    // 屏幕 y 轴朝下，所以模型里 y = 1 的「上方」对应屏幕的第 0 行
    screenCoords.push([
      Math.floor(((v[0] + 1) * width) / 2),
      Math.floor(((1 - v[1]) * height) / 2),
    ]);
    worldCoords.push(v);
  }

  // 计算世界坐标中某个三角形的法线（法线 = 三角形任意两条边做叉乘），然后做归一化
  const n = normalize(
    cross(sub(worldCoords[2], worldCoords[0]), sub(worldCoords[1], worldCoords[0])),
  );

  // 三角形法线和光照方向做点乘，点乘值大于 0，说明法线方向和光照方向在同一侧
  // 值越大，说明越多的光照射到三角形上，颜色越白
  const intensity = dot(n, lightDir);
  if (intensity > 0) {
    triangle(screenCoords, frame, [intensity * 255, intensity * 255, intensity * 255]);
  }
}
```

<br />

最后生成的图片就是这样的：

<RendererDemo src="day03/light" title="简单的光照着色" />

<br />

到这里渲染出的图像就有些人样了，但是大家应该也发现了，上图的嘴巴和眼睛处看上去怪怪的。这里的确是有问题，因为它把背后的三角形渲染出来了，要想解决这个问题，就要引入一个新的概念——[z-buffer](https://www.wikiwand.com/en/Z-buffering)。

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
