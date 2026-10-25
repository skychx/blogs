---
id: day6-Moving-the-camera
title: day6：移动相机
sidebar_label: day6：移动相机
description: 移动相机
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day6：移动相机
  - lookAt
  - 视口变换
  - MVP 变换
  - 法线变换
  - Gouraud 着色
---

import { RendererDemo, RendererDemos } from '../../src/components/rendererDemo';

昨天我们实现了透视投影，人头终于有了「近大远小」的立体感。不过相机一直待在 z 轴上，只能从正前方看模型，有点单调。今天我们就让相机动起来，从任意位置、任意角度观察模型。

原作者说过，这一课是他很喜欢、但很多读者觉得枯燥的一部分，因为讲的基本都是坐标系之间的变换。好在推导都不难，最后我们还会用一个更好看的着色方法——Gouraud 着色，犒劳一下自己。这部分内容对应 GAMES101 的第 4 讲和第 8 讲。

> 本文源码 👉：[toy-renderer-ts/days/day06](https://github.com/skychx/toy-renderer-ts/tree/main/days/day06)

## 1.相机不动，世界动

我们先想一个问题：怎么从另一个角度看模型？

最直观的想法是把相机挪过去。但昨天推导的投影矩阵有个前提：**相机必须在 z 轴上，并且朝着原点看**。相机要是离开了 z 轴，昨天推出来的公式就都不能用了。

那就换个思路：**相机不动，让整个世界动**。想从模型的右上方看过去，就把模型往左下方转一转，效果是一模一样的。这和坐火车的感觉很像，看着窗外的时候，很难分清到底是自己在动，还是窗外的东西在往后跑。

所以今天的问题就变成了：给定相机的位置和朝向，**怎么把整个世界的坐标，变换到「以相机为参照」的坐标系里**？

## 2.坐标系变换

### 2.1 同一个点，不同的坐标

在说相机之前，我们先研究一个更基础的问题：同一个点，在两个不同坐标系里的坐标有什么关系？

一个坐标系由一个**原点**和一组**基向量**确定。点 $P$ 在坐标系 $(O, \vec{i}, \vec{j}, \vec{k})$ 里的坐标是 $(x, y, z)$，意思是：

$$
\overrightarrow{OP} = x\vec{i} + y\vec{j} + z\vec{k} =
\begin{bmatrix}\vec{i} & \vec{j} & \vec{k}\end{bmatrix}
\begin{bmatrix}x \\ y \\ z\end{bmatrix}
$$

现在有另一个坐标系 $(O', \vec{i'}, \vec{j'}, \vec{k'})$，同一个点 $P$ 在它里面的坐标是 $(x', y', z')$。下面是一个二维的例子，P 在第一个坐标系里的坐标大概是 $(4.2, 2.9)$，在第二个坐标系里则正好是 $(2, 1)$：

![同一个点 P，在两个坐标系里的坐标](/img/toy-renderer/day6/change-of-basis.svg)

两组基向量之间，一定可以用一个 3x3 的矩阵 $M$ 联系起来：

$$
\begin{bmatrix}\vec{i'} & \vec{j'} & \vec{k'}\end{bmatrix} =
\begin{bmatrix}\vec{i} & \vec{j} & \vec{k}\end{bmatrix} M
$$

### 2.2 推导

从图里可以看出，$\overrightarrow{OP} = \overrightarrow{OO'} + \overrightarrow{O'P}$，把等式两边都用坐标表示出来：

$$
\begin{bmatrix}\vec{i} & \vec{j} & \vec{k}\end{bmatrix}
\begin{bmatrix}x \\ y \\ z\end{bmatrix} =
\begin{bmatrix}\vec{i} & \vec{j} & \vec{k}\end{bmatrix}
\begin{bmatrix}O'_x \\ O'_y \\ O'_z\end{bmatrix} +
\begin{bmatrix}\vec{i'} & \vec{j'} & \vec{k'}\end{bmatrix}
\begin{bmatrix}x' \\ y' \\ z'\end{bmatrix}
$$

其中 $(O'_x, O'_y, O'_z)$ 是 $O'$ 在原来坐标系里的坐标。再把 $[\vec{i'}\ \vec{j'}\ \vec{k'}]$ 换成 $[\vec{i}\ \vec{j}\ \vec{k}] M$，等式两边就都只剩下 $[\vec{i}\ \vec{j}\ \vec{k}]$ 了，把它约掉（它是可逆的）：

$$
\begin{bmatrix}x \\ y \\ z\end{bmatrix} =
\begin{bmatrix}O'_x \\ O'_y \\ O'_z\end{bmatrix} +
M\begin{bmatrix}x' \\ y' \\ z'\end{bmatrix}
$$

我们要求的是 $(x', y', z')$，移项以后两边再同时左乘一个 $M^{-1}$ 就行：

$$
\begin{bmatrix}x' \\ y' \\ z'\end{bmatrix} =
M^{-1}\left(
\begin{bmatrix}x \\ y \\ z\end{bmatrix} -
\begin{bmatrix}O'_x \\ O'_y \\ O'_z\end{bmatrix}
\right)
$$

翻译成人话就是：**先把原点平移过去，再乘一个 $M^{-1}$**。

那 $M^{-1}$ 好不好求呢？我们的原坐标系就是世界坐标系，$[\vec{i}\ \vec{j}\ \vec{k}]$ 是单位矩阵，所以 $M$ 就是把 $\vec{i'}$、$\vec{j'}$、$\vec{k'}$ 三个向量**按列**摆在一起。如果这三个向量是两两垂直的单位向量，$M$ 就是一个正交矩阵，它的逆矩阵就是它的转置，也就是把三个向量**按行**摆在一起，连求逆都省了。

## 3.手写 lookAt

### 3.1 相机的坐标系

OpenGL 有个很有名的工具函数 `gluLookAt`，它用三个参数来描述一个相机：

- `eye`：相机的位置
- `center`：相机看向的点
- `up`：相机的「上方」，大致朝上就行，不要求和视线垂直

![lookAt：用 eye、center、up 确定相机的坐标系](/img/toy-renderer/day6/lookat.svg)

有了这三个参数，就可以算出相机坐标系的三个轴（在世界坐标系里的方向）：

- **z 轴**：从 center 指向 eye。注意它是视线的**反方向**，相机是朝着 -z 方向看的，这和昨天推导投影矩阵时的设定一致
- **x 轴**：$\vec{up} \times \vec{z}$，同时垂直于 up 和 z 轴
- **y 轴**：$\vec{z} \times \vec{x}$，同时垂直于 z 轴和 x 轴

up 只是一个大概的方向，比如图里竖直朝上的 up，它和视线不一定垂直，所以 y 轴要重新算一遍，不能直接拿 up 来当 y 轴。三个轴都要做归一化，这样它们就是一组两两垂直的单位向量，第 2 节说的「转置就是逆矩阵」也就成立了。

### 3.2 原点放在哪？

第 2 节的公式里还有一个原点 $O'$。直觉上，相机坐标系的原点应该放在相机所在的位置 eye，但这里有个坑：昨天推导投影矩阵时，相机在 z 轴上离原点距离为 $c$ 的地方，屏幕是穿过原点的 $z = 0$ 平面。

所以原点应该放在 **center**。这样变换以后，center 在原点，eye 正好在 z 轴上、离原点 $|eye - center|$ 的位置，投影矩阵里的 $c$ 取 $|eye - center|$ 就行了。

> 注：原教程第一版的正文里，平移用的是 eye，但代码里用的又是 center，很多人在这里被绕晕过。第二版统一成了 center，我们也用 center

### 3.3 代码实现

把上面两步合起来，就是我们要的矩阵：

$$
ModelView =
\begin{bmatrix}x_1 & x_2 & x_3 & 0 \\ y_1 & y_2 & y_3 & 0 \\ z_1 & z_2 & z_3 & 0 \\ 0 & 0 & 0 & 1\end{bmatrix}
\begin{bmatrix}1 & 0 & 0 & -center_x \\ 0 & 1 & 0 & -center_y \\ 0 & 0 & 1 & -center_z \\ 0 & 0 & 0 & 1\end{bmatrix}
$$

其中 $(x_1, x_2, x_3)$ 是相机 x 轴在世界坐标系里的方向，y 轴、z 轴同理。右边的矩阵负责平移，把 center 挪到原点；左边的矩阵就是第 2 节里的 $M^{-1}$，三个轴按行摆放。还是那句话，矩阵是从右往左生效的：先平移，再旋转。

写成代码就是这样：

```ts
// 视图矩阵：把世界坐标变换到相机的坐标系下
function lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat {
  // 相机坐标系的三个轴在世界坐标系里的方向
  const zAxis = normalize(sub(eye, center)); // z 轴：从 center 指向 eye
  const xAxis = normalize(cross(up, zAxis)); // x 轴：同时垂直于 up 和 z 轴
  const yAxis = normalize(cross(zAxis, xAxis)); // y 轴：同时垂直于 z 轴和 x 轴

  // 旋转：把三个轴按行放进矩阵
  const rotation: Mat = [
    [xAxis[0], xAxis[1], xAxis[2], 0],
    [yAxis[0], yAxis[1], yAxis[2], 0],
    [zAxis[0], zAxis[1], zAxis[2], 0],
    [0, 0, 0, 1],
  ];
  // 平移：把 center 移到原点
  const translation: Mat = [
    [1, 0, 0, -center[0]],
    [0, 1, 0, -center[1]],
    [0, 0, 1, -center[2]],
    [0, 0, 0, 1],
  ];
  // 先平移，再旋转
  return matMul(rotation, translation);
}
```

这个矩阵为什么叫 ModelView 呢？这是 OpenGL 里的叫法：把模型摆到场景里的 Model 矩阵，和相机的 View 矩阵乘在一起，就是 ModelView。我们的场景里只有一个模型，而且就放在原点，Model 矩阵是单位矩阵，所以 ModelView 就等于 lookAt 算出来的 View 矩阵。

投影矩阵也顺手封装成一个函数，参数就是相机到原点的距离：

```ts
// 投影矩阵：相机在 z 轴上，离原点的距离是 c
function projection(c: number): Mat {
  const m = identity(4);
  m[3][2] = -1 / c;
  return m;
}
```

## 4.视口变换

还记得第二天画线框时写的这行代码吗：

```ts
const x0 = Math.floor(((v0[0] + 1) * width) / 2);
```

它做的事情，是把 $[-1, 1]$ 范围内的坐标，映射到 $[0, width]$ 的屏幕上。这其实就是一次缩放（乘上 $\frac{width}{2}$）加一次平移（加上 $\frac{width}{2}$），有了齐次坐标，它也可以写成一个矩阵：

$$
Viewport =
\begin{bmatrix}\frac{w}{2} & 0 & 0 & x + \frac{w}{2} \\ 0 & \frac{h}{2} & 0 & y + \frac{h}{2} \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1\end{bmatrix}
$$

它把 $[-1, 1] \times [-1, 1]$ 映射到屏幕上左下角为 $(x, y)$、宽 $w$ 高 $h$ 的矩形里，z 坐标保持不变，留给 zbuffer 用。这个矩阵在 OpenGL 里叫做视口（Viewport）矩阵：

```ts
// 视口矩阵：把 [-1, 1] 范围内的 x、y 变换到屏幕上左下角为 (x, y)、宽 w 高 h 的区域里
function viewport(x: number, y: number, w: number, h: number): Mat {
  return [
    [w / 2, 0, 0, x + w / 2],
    [0, h / 2, 0, y + h / 2],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}
```

我们一般不会让模型撑满整个画布，四周会留一点边。代码里用的是 `viewport(width / 8, height / 8, (width * 3) / 4, (height * 3) / 4)`，也就是上下左右各留出 1/8 的边。

## 5.坐标变换链

到这里，一个顶点从模型文件里读出来，到最后画到屏幕上，要经过的变换就都齐了：

![坐标变换链](/img/toy-renderer/day6/transform-chain.svg)

1. **模型坐标**：模型文件里的原始坐标，每个模型都有自己的坐标系
2. **世界坐标**：用 Model 矩阵把模型摆到场景里
3. **观察坐标**：用 View 矩阵（也就是 lookAt）切换到相机的视角
4. **裁剪坐标**：用 Projection 矩阵做透视投影，这时候 w 已经不是 1 了
5. **标准化设备坐标（NDC）**：做透视除法，除以 w
6. **屏幕坐标**：用 Viewport 矩阵做视口变换

GAMES101 里把 Model、View、Projection 这三个变换合称 **MVP 变换**，说的就是这条链的前半段。写成公式就是：

$$
v_{screen} = Viewport \times Projection \times View \times Model \times v
$$

严格来说，透视除法发生在 Projection 和 Viewport 之间。不过 Viewport 矩阵的最后一行是 $(0, 0, 0, 1)$，不会改变 w，所以先把矩阵全部乘完、最后再除以 w，结果是一样的。这样我们就可以先把三个矩阵乘好，每个顶点只需要乘一次：

```ts
const ModelView = lookAt(eye, center, up);
const Projection = projection(length(sub(eye, center)));
const Viewport = viewport(width / 8, height / 8, (width * 3) / 4, (height * 3) / 4);

// 坐标变换链：Viewport × Projection × ModelView，先把三个矩阵乘好，每个顶点只用乘一次
const M = matMul(Viewport, matMul(Projection, ModelView));
```

```ts
const v = model.vert(face[j]);
const [x, y, z, w] = matVec(M, [v[0], v[1], v[2], 1] as Vec4);
// 透视除法：除以 w 变回三维坐标；x、y 四舍五入成整数，z 留给 zbuffer 用
screenCoords.push([Math.round(x / w), Math.round(y / w), z / w]);
```

相机的参数我们沿用原教程的设置：相机放在 $(1, 1, 3)$，看向原点，y 轴朝上：

```ts
const eye: Vec3 = [1, 1, 3]; // 相机的位置
const center: Vec3 = [0, 0, 0]; // 相机看向的点
const up: Vec3 = [0, 1, 0]; // 相机的「上方」
```

## 6.法线的变换

### 6.1 一个反例

上面的坐标变换链处理的都是顶点，那法线呢？模型变换的时候，法线是不是也直接乘同一个矩阵就行了？

答案是不行。举个二维的例子：线段 AB 从 $(0, 1)$ 到 $(1, 0)$，它的方向是 $\vec{t} = (1, -1)$，法线是 $\vec{n} = (1, 1)$，两者点乘为 0，确实是垂直的。

现在把整个图形沿 y 方向拉长 2 倍，变换矩阵是：

$$
M = \begin{bmatrix}1 & 0 \\ 0 & 2\end{bmatrix}
$$

线段的方向变成了 $M\vec{t} = (1, -2)$。如果法线也乘上 $M$，得到 $M\vec{n} = (1, 2)$，和线段方向的点乘是 $1 \times 1 + (-2) \times 2 = -3$，**不再垂直**了：

![法线不能直接乘变换矩阵](/img/toy-renderer/day6/normal-transform.svg)

### 6.2 逆转置矩阵

问题出在哪呢？其实我们需要的并不是「把法线变换一下」，而是**变换以后的图形的法线**。

设变换以后的法线是 $\vec{n'}$，它要和变换以后的线段方向 $M\vec{t}$ 垂直。我们试一下 $\vec{n'} = (M^{-1})^T\vec{n}$：

$$
\vec{n'} \cdot (M\vec{t}) = ((M^{-1})^T\vec{n}) \cdot (M\vec{t}) = \vec{n} \cdot (M^{-1}M\vec{t}) = \vec{n} \cdot \vec{t} = 0
$$

中间用到了点乘的一个性质 $(A^T\vec{a})\cdot\vec{b} = \vec{a}\cdot(A\vec{b})$。结论就是：**模型用矩阵 $M$ 变换时，法线要用 $M$ 的逆矩阵的转置（简称逆转置矩阵）来变换**。

用上面的例子验证一下：

$$
(M^{-1})^T = \begin{bmatrix}1 & 0 \\ 0 & \frac{1}{2}\end{bmatrix}, \quad
\vec{n'} = (1, 0.5), \quad
\vec{n'} \cdot (1, -2) = 1 - 1 = 0
$$

垂直了，就是上图里绿色的那根箭头。再补充两点：

- 如果 $M$ 只包含旋转和等比例的缩放，那它的逆转置矩阵和它本身只差一个倍数，归一化以后没有区别，直接乘 $M$ 也没问题。所以很多人平时根本没注意到这个问题，直到哪天模型做了不等比例的缩放
- 法线是一个向量，在齐次坐标里 $w = 0$，平移对它不起作用（还记得昨天 3.3 节说的吗）

今天的代码里还用不到逆转置矩阵：我们只是挪了相机，模型本身没有变形，光照也是直接在世界坐标系里算的。等到第八天做法线贴图的时候，它就派上用场了。

## 7.Gouraud 着色

### 7.1 用顶点的法线

把相机挪到 $(1, 1, 3)$ 以后，用前几天的方法画出来是下面左图的样子：一个个三角形的棱角非常明显。这种每个三角形只算一次光照的方法，叫做 **flat 着色**。

模型文件里其实早就给我们准备好了更细的数据：以 `vn` 开头的行，存的就是每个顶点的法线，而 `f` 那一行每组数字的第三个数，就是这个顶点对应的法线序号：

```bash
vn  0.001 0.482 -0.876
f 24/1/24 25/2/25 26/3/26
```

[Gouraud 着色](https://www.wikiwand.com/en/Gouraud_shading)的思路很简单：先用顶点的法线算出**每个顶点**的光照强度，再用重心坐标把强度插值到三角形里的每个像素上。是不是很眼熟？这和我们插值 z、插值 uv 的做法一模一样。

先在 `model.ts` 里把法线也解析出来：

```ts
} else if (type === 'vn') {
  // 文件里的法线不一定是单位向量，这里统一做一下归一化
  this.normals.push(normalize([Number(values[0]), Number(values[1]), Number(values[2])]));
}
```

```ts
// 第 iface 个三角形的第 nthvert 个顶点的法线
normal(iface: number, nthvert: number) {
  return this.normals[this.faceNormals[iface][nthvert]];
}
```

### 7.2 光照方向的约定

这里有一个容易踩坑的地方，需要单独说一下。

前几天我们的光照方向是 `[0, 0, -1]`，表示光线**射过去**的方向；三角形的法线用 `(v2 - v0) × (v1 - v0)` 算出来，方向其实是朝向模型**里面**的。两个方向都反了，「负负得正」，点乘出来的结果刚好是对的。

但模型文件里的法线都是**朝外**的，所以从今天开始，我们把光照方向统一改成**指向光源的方向**：

```ts
const light: Vec3 = normalize([1, 1, 1]); // 指向光源的方向
```

这样光照强度就是 $\max(0, \vec{n} \cdot \vec{l})$：法线和指向光源的方向越接近，点乘越大，就越亮；点乘小于 0 说明这一面背对着光源，直接当成 0。flat 着色时三角形的法线也改成了 `(v1 - v0) × (v2 - v0)`，让它朝外。

### 7.3 代码实现

有了每个顶点的光照强度，光栅化的时候插值一下就行。顺便把贴图也加进来，有贴图的时候，光照强度乘上贴图的颜色：

```ts
// 三角形光栅化：用重心坐标插值出每个像素的光照强度，有贴图的话再乘上贴图的颜色
function triangle(
  pts: Vec3[],
  intensities: number[],
  uvs: Vec2[],
  texture: Texture | null,
  zbuffer: Float32Array,
  frame: Frame,
) {
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
      const bc = barycentric(pts, [x, y]);
      if (bc[0] < 0 || bc[1] < 0 || bc[2] < 0) {
        continue;
      }

      // 用重心坐标插值出当前像素的深度，离我们更近才绘制
      const z = pts[0][2] * bc[0] + pts[1][2] * bc[1] + pts[2][2] * bc[2];
      const index = x + y * frame.width;
      if (zbuffer[index] >= z) {
        continue;
      }
      zbuffer[index] = z;

      // 和深度一样，光照强度也用重心坐标插值
      const intensity = intensities[0] * bc[0] + intensities[1] * bc[1] + intensities[2] * bc[2];

      // 有贴图就从贴图里取颜色，没有就当成白色
      let color: Color = [255, 255, 255];
      if (texture) {
        const u = uvs[0][0] * bc[0] + uvs[1][0] * bc[1] + uvs[2][0] * bc[2];
        const v = uvs[0][1] * bc[0] + uvs[1][1] * bc[1] + uvs[2][1] * bc[2];
        color = texture.get(u, v);
      }

      frame.set(x, y, [color[0] * intensity, color[1] * intensity, color[2] * intensity]);
    }
  }
}
```

遍历三角形的时候，用每个顶点自己的法线算出三个光照强度。flat 着色其实可以看成 Gouraud 着色的一个特例：**三个顶点的光照强度都一样**，插值出来自然整个三角形都是一个颜色。所以两种着色方法可以共用同一个 `triangle` 函数：

```ts
// Gouraud 着色：用模型文件里每个顶点的法线，算出每个顶点的光照强度
intensities.push(Math.max(0, dot(model.normal(i, j), light)));
```

```ts
if (shading === 'flat') {
  // flat 着色：整个三角形只用一个法线，三个顶点的光照强度都一样
  const n = normalize(
    cross(sub(worldCoords[1], worldCoords[0]), sub(worldCoords[2], worldCoords[0])),
  );
  intensities.fill(Math.max(0, dot(n, light)));
}
```

左边是 flat 着色，右边是 Gouraud 着色。几何形状完全一样，三角形的数量也一样，但 Gouraud 着色看上去光滑多了：

<RendererDemos title="flat 着色 vs Gouraud 着色">
  <RendererDemo src="day06/flat" title="flat 着色" />
  <RendererDemo src="day06/gouraud" title="Gouraud 着色" />
</RendererDemos>

再贴上纹理：

<RendererDemo src="day06/texture" title="Gouraud 着色 + 纹理" />

<br />

<br />

到这里，`main.ts` 已经将近 200 行了：矩阵、光栅化、着色全都挤在一起，再加功能就要乱套了。明天我们把它拆开，抽出一个「我们自己的 OpenGL」，并引入渲染管线里最重要的一个概念——着色器（Shader）。

## 参考链接

[tinyrenderer Lesson 5: Moving the camera](https://github.com/ssloy/tinyrenderer/wiki/Lesson-5:-Moving-the-camera)

[tinyrenderer（第二版）：Better camera handling](https://haqr.eu/tinyrenderer/camera/)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
