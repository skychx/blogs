---
id: extra1-Perspective-correct-interpolation
title: 番外：透视校正插值
sidebar_label: 番外：透视校正插值
description: 透视校正插值
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - 透视校正插值
  - 重心坐标
---

day7 的结尾我留了一个小问题：片元着色器插值 varying 的时候，用的是**屏幕上**的重心坐标，加上透视投影以后，这样插值其实是不准确的。

当时我说人头模型上几乎看不出差别，所以先放一放。但到了 day9、day10，场景里多了一块地板，问题就藏不住了：仔细看地板上的棋盘格，在两个三角形交界的那条对角线上，格子是「弯」的。这篇番外我们就来解决它。

> 本文源码 👉：[toy-renderer-ts/days/extra-perspective](https://github.com/skychx/toy-renderer-ts/tree/main/days/extra-perspective)

## 1.问题出在哪

我们把相机放低一点，贴着地板看过去，问题就更明显了。下面左图是前十天的插值方式，右图是今天要实现的透视校正插值：

![左：屏幕空间插值，右：透视校正插值](/img/toy-renderer/extra1/floor.jpg)

左图的棋盘格完全不对：格子被拉成了歪歪扭扭的平行四边形，而且沿着两个三角形的对角线，格子突然拐了个弯。右图才是我们期望的样子：近处的格子大，远处的格子小，所有的线都是直的。

为什么会这样呢？根源在于**透视投影不是线性的**。day5 讲过，近大远小是靠「除以 w」实现的，而除法会破坏线性关系：三维空间里一条线段上等距的点，投影到屏幕上就不等距了，离相机越远的部分被压得越紧。

反过来也一样，屏幕上等距的点，对应到三维空间里，也是不等距的：

![屏幕上等距的点，对应到三维空间里的线段上，就不等距了](/img/toy-renderer/extra1/why.svg)

我们在光栅化的时候，是在**屏幕上**一个像素一个像素地求重心坐标，然后直接拿它去插值 uv。这相当于默认了「屏幕上走到三角形的一半，三维空间里也走到了三角形的一半」，可从上图就能看出，这是不对的：屏幕上正中间的那个点，对应到 AB 上其实离 A 近得多。

## 2.推导

### 2.1 两套重心坐标

我们要区分两套重心坐标：

- **三维空间里**（透视除法之前）的重心坐标 $(\alpha, \beta, \gamma)$：这是我们真正想要的，用它插值 uv 才是对的
- **屏幕上**（透视除法之后）的重心坐标 $(\alpha', \beta', \gamma')$：这是光栅化的时候实际算出来的

问题就变成了：知道 $(\alpha', \beta', \gamma')$，怎么求出 $(\alpha, \beta, \gamma)$？

### 2.2 找关系

设三角形的三个顶点在裁剪坐标系里是 $A$、$B$、$C$（还没有除以 w 的齐次坐标），三角形上的一个点：

$$
P = \alpha A + \beta B + \gamma C
$$

$P$ 的 w 分量也满足同样的关系（矩阵乘法是线性的，w 也是线性的）：

$$
w_P = \alpha w_A + \beta w_B + \gamma w_C
$$

透视除法以后，屏幕上的点是 $P' = \frac{P}{w_P}$，顶点是 $A' = \frac{A}{w_A}$ 等等。屏幕上的重心坐标满足：

$$
\frac{P}{w_P} = \alpha' \frac{A}{w_A} + \beta' \frac{B}{w_B} + \gamma' \frac{C}{w_C}
$$

两边同时乘上 $w_P$：

$$
P = \frac{w_P \alpha'}{w_A} A + \frac{w_P \beta'}{w_B} B + \frac{w_P \gamma'}{w_C} C
$$

和最开始的 $P = \alpha A + \beta B + \gamma C$ 对比一下，就得到了：

$$
\alpha = \frac{w_P \alpha'}{w_A}, \quad \beta = \frac{w_P \beta'}{w_B}, \quad \gamma = \frac{w_P \gamma'}{w_C}
$$

### 2.3 求出 w

式子里还有一个不知道的 $w_P$，不过这难不倒我们：重心坐标加起来等于 1，也就是 $\alpha + \beta + \gamma = 1$，代进去：

$$
w_P \left(\frac{\alpha'}{w_A} + \frac{\beta'}{w_B} + \frac{\gamma'}{w_C}\right) = 1
$$

所以 $w_P$ 就是括号里那一坨的倒数，再代回去，最终的结果是：

$$
\alpha = \frac{\alpha' / w_A}{\alpha' / w_A + \beta' / w_B + \gamma' / w_C}
$$

$\beta$ 和 $\gamma$ 同理。翻译成人话就是：**把屏幕上的重心坐标分别除以三个顶点的 w，再归一化一下（让它们加起来等于 1）**。

### 2.4 深度为什么不用改

细心的同学可能会问：zbuffer 里的深度也是用屏幕上的重心坐标插值的，它要不要校正？

答案是不用。zbuffer 里存的是透视除法**以后**的深度 $z/w$，而不是三维空间里的深度。可以证明，对一个平面三角形来说，$z/w$ 在屏幕上就是线性变化的，所以直接用屏幕上的重心坐标插值是对的。需要校正的，只是那些透视除法**之前**的数据，比如 uv、法线、三维坐标等等。

## 3.代码实现

推导了一大篇，代码却只有几行：在 `gl.ts` 的 `triangle` 里，调用片元着色器之前，把重心坐标校正一下：

```ts
// 透视校正：屏幕上的重心坐标分别除以三个顶点的 w，再归一化，就是三维空间里真正的重心坐标
let bar = bc;
if (perspectiveCorrect) {
  const a = bc[0] / clip[0][3];
  const b = bc[1] / clip[1][3];
  const c = bc[2] / clip[2][3];
  const sum = a + b + c;
  bar = [a / sum, b / sum, c / sum];
}

// 调用片元着色器，算出这个像素的颜色
const color = shader.fragment(bar, [x, y, z]);
```

我们在 day7 把透视除法挪进了 `triangle`，所以这里手上正好有三个顶点的裁剪坐标 `clip`，w 就是它们的第四个分量。深度 `z` 还是用原来的 `bc` 插值，前面已经解释过了。

这里加了一个 `perspectiveCorrect` 参数，只是为了方便对比两种插值方式，实际使用时一直开着就好。我们再用 day9、day10 的相机看一下，左边是原来的结果，右边是透视校正以后的结果，地板上的弯折没有了：

![左：屏幕空间插值，右：透视校正插值](/img/toy-renderer/extra1/scene.jpg)

<br />

<br />

真正的显卡会自动帮我们做透视校正：GLSL 里的 varying 默认就是透视校正插值的（对应 `smooth` 这个修饰符）。在桌面版的 OpenGL 里，如果确实不想要透视校正，还可以用 `noperspective` 修饰符把它关掉，不过一般用不到（WebGL 用的 GLSL ES 里没有这个修饰符）。

## 参考链接

[tinyrenderer Technical difficulties: linear interpolation with perspective deformations](https://github.com/ssloy/tinyrenderer/wiki/Technical-difficulties:-linear-interpolation-with-perspective-deformations)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
