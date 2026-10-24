---
id: day5-Perspective-projection
title: day5：透视投影
sidebar_label: day5：透视投影
description: 透视投影
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day5：透视投影
  - 线性变换
  - 齐次坐标
  - 透视投影矩阵
---

前面四天，我们从一个点开始，画出了线、画出了三角形，又用 Z-buffering 解决了遮挡问题，最后还给模型贴上了纹理，人头模型总算是有模有样了。但不知道大家有没有发现，这个脑袋看着总有点「平」，不太像我们平时看到的样子。

原因是我们一直在用**正交投影（Orthographic Projection）**：把模型的 z 坐标直接扔掉，x 和 y 原封不动地画到屏幕上，所以不管离得近还是离得远，东西在画面上都一样大。可现实中我们看东西不是这样的，离眼睛越近的东西越大，越远的越小，也就是常说的「近大远小」。今天我们就来实现**透视投影（Perspective Projection）**。

本文会涉及一点线性代数（矩阵乘法和齐次坐标），莫担心，我们先从中学的相似三角形讲起，最后再把它写成矩阵的形式。这部分内容对应 GAMES101 的第 3、4 讲，可以配合着看。

> 本文源码 👉：[toy-renderer-ts/days/day05](https://github.com/skychx/toy-renderer-ts/tree/main/days/day05)

## 1.近大远小

### 1.1 相似三角形

我们先把问题简化一下：假设相机（也就是我们的眼睛）放在 z 轴上的 $C(0, 0, c)$ 点，朝着原点看，屏幕就是 $z = 0$ 这个平面。空间里有一个点 $P(x, y, z)$，我们要找的是：**从相机看过去，P 会落在屏幕上的哪个位置？**

答案其实很直接：把相机 $C$ 和点 $P$ 连成一条直线，这条直线和屏幕的交点 $P'$ 就是我们要找的位置。

三维的图不太好画，我们换个角度，从 y 轴的正上方往下看，这样就只用看 x 和 z 两个方向了：

![从 y 轴正上方往下看](/img/toy-renderer/day5/persp-xz.svg)

图里黄色的大三角形和红色的小三角形是**相似三角形**（两个三角形共用相机 $C$ 处的那个角，另外各有一个直角）。大三角形的两条直角边是 $c$ 和 $x'$，小三角形的两条直角边是 $c - z$ 和 $x$，根据相似三角形的对应边成比例，有：

$$
\frac{x'}{c} = \frac{x}{c - z}
$$

稍微整理一下，就可以得到：

$$
x' = \frac{x}{1 - z / c}
$$

同样的道理，换成从 x 轴的方向看过去，可以推出 y 的公式：

$$
y' = \frac{y}{1 - z / c}
$$

两个公式长得一模一样，翻译成人话就是：**把点的 x 和 y 都除以 $(1 - z/c)$**。点离相机越近，$z$ 越大，分母就越小，算出来的 $x'$ 和 $y'$ 就越大，这不就是「近大远小」嘛！

### 1.2 代码实现

公式有了，代码就很简单了。我们写一个 `persp` 函数，按上面的公式处理一下顶点：

```ts
const camera: Vec3 = [0, 0, 3]; // 相机放在 z 轴上，离原点的距离是 3

// 最直接的透视投影：根据相似三角形，把 x、y、z 都除以 (1 - z / c)
function persp(v: Vec3): Vec3 {
  const c = camera[2];
  const k = 1 / (1 - v[2] / c);
  return [v[0] * k, v[1] * k, v[2] * k];
}
```

细心的同学可能发现了，代码里 z 也除了 $(1 - z/c)$。这是因为 z 坐标还要留给 zbuffer 用：z 越大，除完以后也越大，前后顺序没有变，所以深度测试照样能用。

然后在做视口变换之前，先让每个顶点过一遍 `persp`：

```ts
for (let j = 0; j < 3; j++) {
  const v = model.vert(face[j]);
  worldCoords.push(v);
  screenCoords.push(world2screen(persp(v))); // 先投影，再做视口变换
  uvs.push(model.uv(i, j));
}
```

下图左边是 day4 的正交投影，右边是透视投影。可以看到鼻子和嘴巴离我们最近，被放大了；耳朵和脖子在后面，被缩小了，整个脸一下子就立体了起来：

![正交投影 vs 透视投影](/img/toy-renderer/day5/ortho-vs-persp.jpg)

<br />

到这里，透视投影其实就已经做完了。那为什么原教程还要花一整课的篇幅来讲矩阵呢？

因为在真正的渲染器里，一个顶点要经过的变换远远不止这一种：模型要先摆到场景里（平移、旋转、缩放），然后切换到相机的视角，再做投影，最后变换到屏幕上……每多一种变换，就要多写一个函数，代码越来越乱不说，几十万个顶点每个都要把这些函数挨个调一遍，性能也吃不消。

下面我们就来看看，怎么用**矩阵**把这些变换统一起来。

## 2.线性变换

### 2.1 用矩阵表示变换

在二维平面里，用一个 2x2 的矩阵乘一个点，就是对这个点做了一次**线性变换（Linear Transformation）**：

$$
\begin{bmatrix}x' \\ y'\end{bmatrix} =
\begin{bmatrix}a & b \\ c & d\end{bmatrix}
\begin{bmatrix}x \\ y\end{bmatrix} =
\begin{bmatrix}ax + by \\ cx + dy\end{bmatrix}
$$

矩阵里的四个数取不同的值，就能得到不同的变换。为了看得清楚一点，我们拿一个字母 F 来做实验（F 上下左右都不对称，变换以后转没转、歪没歪，一眼就能看出来）：

![几种常见的线性变换](/img/toy-renderer/day5/linear-transforms.svg)

- **单位矩阵** $\begin{bmatrix}1 & 0 \\ 0 & 1\end{bmatrix}$：什么也不做，$x' = x$，$y' = y$
- **缩放** $\begin{bmatrix}2 & 0 \\ 0 & 0.5\end{bmatrix}$：对角线上的两个数分别控制 x 和 y 方向的缩放，这里 x 方向拉长了 2 倍，y 方向压扁了一半
- **错切** $\begin{bmatrix}1 & 1 \\ 0 & 1\end{bmatrix}$：$x' = x + y$，越往上的点往右偏得越多，F 就被「推歪」了
- **旋转** $\begin{bmatrix}\cos\theta & -\sin\theta \\ \sin\theta & \cos\theta\end{bmatrix}$：绕原点逆时针旋转 $\theta$ 角，图里转了 45°

图里还有两个箭头值得注意一下：红色箭头是 x 轴上的单位向量 $(1, 0)$ 变换以后的位置，绿色箭头是 y 轴上的单位向量 $(0, 1)$ 变换以后的位置。对照一下各个矩阵就会发现，**矩阵的第一列就是红色箭头，第二列就是绿色箭头**。

如果你看过 3Blue1Brown 的《线性代数的本质》，对这个结论应该不会陌生：知道了两个坐标轴变换到了哪里，整个平面怎么变也就确定了。

### 2.2 为什么要用矩阵

用矩阵表示变换最大的好处是可以**组合**。假设我们要对一个顶点 $v$ 依次做三次变换 $A_1$、$A_2$、$A_3$，写出来就是：

$$
v' = A_3(A_2(A_1 v))
$$

矩阵乘法满足结合律，括号可以随便挪：

$$
v' = (A_3 A_2 A_1)v
$$

也就是说，我们可以先把三个矩阵乘起来，得到一个新矩阵 $M = A_3 A_2 A_1$，然后每个顶点只要乘一次 $M$ 就行了。一个模型动不动就有几万、几十万个顶点，这个优化是非常可观的。

不过要注意，矩阵乘法**不满足交换律**，顺序不能乱换。比如先错切再旋转，和先旋转再错切，得到的结果完全不一样：

![变换的顺序很重要](/img/toy-renderer/day5/transform-order.svg)

还有一个容易绕晕的地方：$A_3 A_2 A_1 v$ 是**从右往左**生效的，离 $v$ 最近的 $A_1$ 最先作用。所以「先错切再旋转」写成矩阵是 $R \times S$，而不是 $S \times R$。

## 3.齐次坐标

### 3.1 平移怎么办？

线性变换虽然好用，但它有个致命的缺陷：**原点永远不动**。不管矩阵是什么，矩阵乘以 $(0, 0)$ 的结果永远是 $(0, 0)$，也就是说，线性变换没法做**平移**。

平移明明是最常用的变换，这可怎么办？最直接的办法是在线性变换后面再加一个向量：

$$
\begin{bmatrix}x' \\ y'\end{bmatrix} =
\begin{bmatrix}a & b \\ c & d\end{bmatrix}
\begin{bmatrix}x \\ y\end{bmatrix} +
\begin{bmatrix}e \\ f\end{bmatrix}
$$

这种「线性变换 + 平移」叫做**仿射变换（Affine Transformation）**，旋转、缩放、错切、平移它都能做。但问题又来了：两个仿射变换组合起来，式子就开始变丑了：

$$
A_2(A_1 v + b_1) + b_2 = (A_2 A_1)v + (A_2 b_1 + b_2)
$$

这还只是两个，要是组合十几个，那画面简直不敢想。我们失去了「一个矩阵搞定一切」的优雅。

### 3.2 加一个维度

下面就是见证奇迹的时刻了。我们给矩阵加一行一列，变成 3x3，再给点加一个**永远等于 1** 的坐标：

$$
\begin{bmatrix}a & b & e \\ c & d & f \\ 0 & 0 & 1\end{bmatrix}
\begin{bmatrix}x \\ y \\ 1\end{bmatrix} =
\begin{bmatrix}ax + by + e \\ cx + dy + f \\ 1\end{bmatrix}
$$

算出来的结果，最后一个分量还是 1，前两个分量正好就是仿射变换的结果！平移被「藏」进了矩阵的最后一列，**又变回了一次矩阵乘法**，组合变换的问题也就迎刃而解了。

这种在原有坐标后面再加一维的表示方法，就叫做**齐次坐标（Homogeneous Coordinates）**。二维的点用 3 维向量表示，三维的点用 4 维向量表示，所以图形学里到处都是 4x4 的矩阵。

那怎么从齐次坐标变回普通坐标呢？很简单，**用前面的分量除以最后一个分量**就行：

$$
\begin{bmatrix}x \\ y \\ w\end{bmatrix} \Rightarrow \begin{bmatrix}x / w \\ y / w\end{bmatrix}
$$

现在 $w$ 一直都是 1，除不除都一样，但到了第 4 节，这个除法就要派上大用场了。

### 3.3 w 等于 0 的时候

看到这里，可能有同学会问：要是 $w$ 等于 0，这个除法不就没法做了吗？

$w = 0$ 的情况其实正好用来表示**向量**。我们想一想，一个点 $(x, y, w)$ 除以 $w$ 之后是 $(x/w, y/w)$，当 $w$ 越来越接近 0 时，这个点会沿着 $(x, y)$ 的方向跑到无穷远处，「无穷远处的点」不就是一个方向嘛。所以在齐次坐标里：

- $w = 1$ 表示一个**点**
- $w = 0$ 表示一个**向量**（方向）

这样规定以后，很多运算都变得特别自然：

- 点 - 点 = 向量（$1 - 1 = 0$）
- 点 + 向量 = 点（$1 + 0 = 1$）
- 向量 + 向量 = 向量（$0 + 0 = 0$）
- 向量做平移以后还是它自己：$w = 0$ 乘上矩阵最后一列的平移量，结果是 0，平移对它完全不起作用。这也很好理解，一个方向挪到哪里都还是那个方向

这个性质在后面变换法线（法线是一个向量）的时候会用到，大家先留个印象。

### 3.4 组合变换的例子

有了齐次坐标，复杂的变换都可以拆成几个简单变换的组合。比如**绕点 $(x_0, y_0)$ 旋转**，我们可以拆成三步：先把 $(x_0, y_0)$ 平移到原点，然后绕原点旋转，最后再平移回去：

$$
M =
\begin{bmatrix}1 & 0 & x_0 \\ 0 & 1 & y_0 \\ 0 & 0 & 1\end{bmatrix}
\begin{bmatrix}\cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1\end{bmatrix}
\begin{bmatrix}1 & 0 & -x_0 \\ 0 & 1 & -y_0 \\ 0 & 0 & 1\end{bmatrix}
$$

还是那句话，矩阵是从右往左生效的，所以第一步的平移要写在最右边。

## 4.用矩阵表示透视投影

### 4.1 动一动最后一行

前面的矩阵，最后一行一直都是 $(0, 0, 1)$，所以算出来的 $w$ 永远是 1。那如果我们动一动最后一行，会发生什么呢？

我们拿一个二维的例子试一下，把最后一行的第一个数改成 $-1/5$：

$$
\begin{bmatrix}1 & 0 & 0 \\ 0 & 1 & 0 \\ -1/5 & 0 & 1\end{bmatrix}
\begin{bmatrix}x \\ y \\ 1\end{bmatrix} =
\begin{bmatrix}x \\ y \\ 1 - x/5\end{bmatrix}
\Rightarrow
\begin{bmatrix}\dfrac{x}{1 - x/5} \\[2ex] \dfrac{y}{1 - x/5}\end{bmatrix}
$$

这时候 $w$ 不再是 1 了，变回普通坐标时要除以 $1 - x/5$。看着是不是很眼熟？这和第 1 节推出来的透视公式一模一样，只不过这里「深度」的方向是 x 轴，相机放在了 $(5, 0)$ 这个位置，屏幕是 $x = 0$ 这条直线。

我们画张图对比一下：

![二维的透视投影](/img/toy-renderer/day5/central-projection.svg)

左图是透视投影本来的样子：从相机 $C$ 出发，往物体的每个顶点连线，连线和屏幕的交点（蓝色的点）就是投影的结果。

右图是用上面那个矩阵把物体变形以后的样子：离相机近的部分被拉大了，离相机远的部分被缩小了。这时候我们**不再需要连线**，直接把每个顶点的 x 坐标扔掉，水平地拍到屏幕上（也就是正交投影），得到的蓝色点和左图**完全一样**！

这就是透视投影的本质：**先用矩阵把物体按「近大远小」变形，再做一次正交投影**。

### 4.2 三维的透视投影矩阵

把上面的思路推广到三维，就得到了我们要的投影矩阵。相机在 z 轴上的 $(0, 0, c)$ 处，那就把 4x4 单位矩阵**第 4 行第 3 列**的数改成 $-1/c$：

$$
\begin{bmatrix}1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & -1/c & 1\end{bmatrix}
\begin{bmatrix}x \\ y \\ z \\ 1\end{bmatrix} =
\begin{bmatrix}x \\ y \\ z \\ 1 - z/c\end{bmatrix}
\Rightarrow
\begin{bmatrix}\dfrac{x}{1 - z/c} \\[2ex] \dfrac{y}{1 - z/c} \\[2ex] \dfrac{z}{1 - z/c}\end{bmatrix}
$$

最后的结果和第 1 节 `persp` 函数算出来的完全一样。

这里有个点值得多说一句：投影矩阵本身还是一个线性变换，真正实现「近大远小」的，是最后**除以 $w$** 的那一步。这一步有个专门的名字，叫**透视除法（Perspective Division）**。

原作者在这一节的结尾说了句狠话：「If you simply copy-paste this formula without understanding the above material, I hate you.」（如果你没看懂上面的内容，就直接把这个公式抄走，我会恨你的）。所以大家一定要把前面的推导过程看明白，别光记住一个 $-1/c$。

> 注：GAMES101 里的透视投影矩阵要复杂一些：它会设置近平面和远平面，先把视锥体「挤」成一个长方体，再做正交投影，最后把 x、y、z 都映射到 $[-1, 1]$ 之间。tinyrenderer 用的是一个简化版本，只关心「近大远小」这个效果。两者的核心思想是一样的：都是把深度信息放进 w 里，再靠除以 w 实现近大远小。

### 4.3 代码实现

先给数学库 `math.ts` 加上矩阵相关的运算。矩阵直接用二维数组表示，`m[i][j]` 是第 i 行、第 j 列的元素，和我们在纸上写的顺序一样：

```ts
export type Vec4 = [number, number, number, number];

// 矩阵用二维数组表示，m[i][j] 是第 i 行、第 j 列的元素，和我们在纸上写的顺序一样
export type Mat = number[][];

// n × n 的单位矩阵：对角线上是 1，其他位置都是 0
export function identity(n: number): Mat {
  const m: Mat = [];
  for (let i = 0; i < n; i++) {
    m.push(new Array(n).fill(0));
    m[i][i] = 1;
  }
  return m;
}

// 矩阵乘法 a × b
export function matMul(a: Mat, b: Mat): Mat {
  const result: Mat = [];
  for (let i = 0; i < a.length; i++) {
    result.push([]);
    for (let j = 0; j < b[0].length; j++) {
      // 结果的第 i 行第 j 列 = a 的第 i 行和 b 的第 j 列逐个相乘再相加
      let sum = 0;
      for (let k = 0; k < b.length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i].push(sum);
    }
  }
  return result;
}

// 矩阵乘向量 m × v（向量看作一个列向量），传进来几维的向量，就返回几维的向量
export function matVec<T extends number[]>(m: Mat, v: T): T {
  const result: number[] = [];
  for (let i = 0; i < m.length; i++) {
    let sum = 0;
    for (let j = 0; j < v.length; j++) {
      sum += m[i][j] * v[j];
    }
    result.push(sum);
  }
  return result as T;
}
```

`matVec` 的签名里有个 `<T extends number[]>`，这是 TS 的泛型，意思是传进来的是 `Vec4`，返回的也是 `Vec4`，不用太在意。今天还用不到 `matMul`，明天移动相机的时候，就要靠它把好几个矩阵乘到一起了。

然后就可以写投影矩阵了：

```ts
// 投影矩阵：在单位矩阵的基础上，把第 4 行第 3 列的元素改成 -1/c
const Projection = identity(4);
Projection[3][2] = -1 / camera[2];

// 用矩阵做透视投影：先把三维坐标变成齐次坐标 (x, y, z, 1)，乘上投影矩阵，再除以 w 变回三维坐标
function perspMatrix(v: Vec3): Vec3 {
  const [x, y, z, w] = matVec(Projection, [v[0], v[1], v[2], 1] as Vec4);
  return [x / w, y / w, z / w];
}
```

注意数组的下标是从 0 开始的，所以「第 4 行第 3 列」写成代码是 `Projection[3][2]`。

最后把 `persp` 换成 `perspMatrix`，渲染出来的结果和第 1 节一模一样（我把两张图逐个像素对比了一下，一个像素都不差），这里就不重复贴图了。

<br />

<br />

今天我们实现了透视投影，但相机一直固定在 z 轴上，只能从正前方看模型。明天我们学习如何移动相机，从任意角度观察模型。

## 参考链接

[tinyrenderer Lesson 4: Perspective projection](https://github.com/ssloy/tinyrenderer/wiki/Lesson-4:-Perspective-projection)

[tinyrenderer（第二版）：A crude (but simple) approach to camera handling](https://haqr.eu/tinyrenderer/camera-naive/)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

[3Blue1Brown：线性代数的本质](https://www.bilibili.com/video/BV1ys411472E)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
