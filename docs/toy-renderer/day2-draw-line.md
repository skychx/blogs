---
id: day2-draw-line
title: day2：画一条线
sidebar_label: day2：画一条线
description: 环境搭建
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day2：DDA 直线算法 & Bresenham’s 直线算法
---

第一天我们搭建了 `C++` 的运行环境并画了一个点，根据 `点 → 线 → 面` 的顺序，今天我们讲讲如何画一条直线。

本文主要讲解直线绘制算法的推导和思路（莫担心，只涉及到一点点的中学数学知识），最后会给出代码实现，大家放心的看下去就好。

> 本文源码 👉：[toyRenderer-day02-line-drawing-algorithm](https://github.com/skychx/toyRenderer/tree/day02-line-drawing-algorithm)


## 1.DDA 直线算法

### 1.1 简单实现

我们先来回顾一下中学的几何知识，如何在二维平面内表示一条直线？最常见的就是**斜截式**了：

$$
y = kx + b
$$

其中斜率是 $k$，直线在 $y$ 轴上的截距是 $b$。

<br />

**斜截式**在数学上是没啥问题的，但是在实际的工程项目中，因为硬件资源是有限的，我们**不可能也没必要**表示一条无限长度的直线，现实往往是已知一条线段的**起点** $(x_1, y_1)$ 和**终点** $(x_2, y_2$)，然后把它画出来。

这时候用**两点式**表示一根直线是最方便的：

$$
\frac{x-x_{1}}{x_{2}-x_{1}}=\frac{y-y_{1}}{y_{2}-y_{1}}
$$

把上面的式子稍作变形，可以把 $x$ 和 $y$ 用参数 $\lambda$ 表示：

$$
\left.\begin{array}{l}x=\lambda\left(x_{2}-x_{1}\right)+x_{1} \\ y=\lambda\left(y_{2}-y_{1}\right)+y_{1}\end{array}\right\} 0 \leq \lambda \leq 1
$$

这时候我们只要取不同的 $\lambda$，就可以得出对应的 x 和 y。

<br />

按照以上的思路，我们可以用代码实现一下。`C++` 的实现也很简单，如下所示（dl 表示 $d \lambda$）：

```cpp
void line(
  int x1, int y1, 
  int x2, int y2, 
  TGAImage &image, TGAColor color) { 
    const float dl = 0.01;
    int dx = x2 - x1;
    int dy = y2 - y1;
    for (float t=0.0; t<1.0; t+=dl) { 
        int x = x1 + dx * t;
        int y = y1 + dy * t;
        image.set(x, y, color);
    } 
}
```

这个是直线算法的初步实现，只能说「能用」，地位和排序算法里的「冒泡排序」一样，目的达到了，但是性能不太好：

- 每画一个点，都要运行两次乘法
- 大量使用浮点运算（众所周知，$v_{float}<v_{fixed}<v_{int}$）

- 如果 `dl` 取的比较小，会导致一个像素点会被绘制多次，重复计算
- 如果 `dl` 取的比较大，会导致直线断掉



### 1.2 优化

下面我们就一步一步优化上面的算法。

首先我们注意到，对于屏幕绘制直线这个场景，**理论上是连续的，但实际是离散的**。

比如说 $x$ 从 $x_1$ 变化到 $x_2$ 时，每次绘制时，$x$ 都是按步长 1 增长的，也就是 $x_{new} = x_{old} + 1$。这时候 $y_{new} = y_{old} + \frac{y_2 - y_1}{x_{2}-x_{1}} = y_{old} + k$。

我们把上面的公式写成代码，就是下面这个样子：

```cpp
void line(
  int x1, int y1, 
  int x2, int y2, 
  TGAImage &image, TGAColor color) { 
  float x = x1;
  float y = y1;
  float step = std::abs(x2 - x1);
  float dlx = (x2 - x1) / step;
  float dly = (y2 - y1) / step;
  
  for (int i=1; i<step; i++) { 
    image.set(x, y, color);
    x = x + dlx;
    y = y + dlx;
  } 
}
```

这个算法其实还有一点儿问题，就是绘制斜率大于 1 的直线时，绘制出的直线会**断掉**。比如说从 (0, 0) 点绘制到 (2, 4) 点，按照上面的算法只会绘制两个点，但是我们期望的是右图那样，起码各个像素要连接起来：

![不连续的线 vs 连续的线](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/toyrenderer_day1_line.jpg)

解决方法也很简单，绘制这种比较「陡峭」的直线时（斜率绝对值大于 1），以 y 的变化为基准，而不是以 x，这样就可以避免上面直线不连续情况。

最后的直线算法就是这样：

```cpp
void line(
  int x1, int y1, 
  int x2, int y2, 
  TGAImage &image, TGAColor color) { 
  float x = x1;
  float y = y1;
  int dx = x2 - x1;
  int dy = y2 - y1;
  float step;
  float dlx, dly;

  // 根据 dx 和 dy 的长度决定基准
  if (std::abs(dx) >= std::abs(dy)) {
    step = std::abs(dx);
  } else {
    step = std::abs(dy);
  }

  dlx = dx / step;
  dly = dy / step;

  for (int i=1; i<step; i++) {
    image.set(x, y, color);
    x = x + dlx;
    y = y + dly;
  }
}
```

然后我们用这个算法测试一下不同起点不同斜率的直线，看效果运行良好：

![](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/Xnip2021-01-18_21-48-36.png)



这个算法就是经典的 [DDA (Digital differential analyzer) 算法](https://www.wikiwand.com/en/Digital_differential_analyzer_(graphics_algorithm))，他比我们一开始的代码要高效的多：

- 消除了循环内的乘法运算
- 避免了重复的绘制运算
- 保证线段连续不会断掉

但是它还有个很耗性能的问题：计算过程中涉及大量的**浮点运算**。

作为渲染器最底层的算法，我们肯定希望是越快越好。下面我们就来学习一下，消除浮点运算的 Bresenham’s 直线算法。



## 2.Bresenham’s 直线算法

### 2.1 初步实现

本节内容不会从一开始就讲完善版的 Bresenham’s 算法，我们先从一个小节开始推导，最后推导出完善的算法。



最一开始，我们先考虑所有直线里的一个子集，即斜率范围在 $[0, 1]$ 之间的直线：$0 \leq k \leq 1$，并且 $x_{start} < x_{end}$。

上一小节里我们说过，对于屏幕绘制直线这个场景，**理论上是连续的，但实际是离散的**。我们先假设已经绘制了一个点 $(x,\ y)$，那么在像素屏幕上，下一个新点的位置，只可能有两种情况：

- $(x + 1,\ y)$
- $(x + 1,\ y + 1)$

那么问题就转化为，下一个新点的位置该如何选择？

我想大家应该都想到方案了，大体思路如下

- 先把 $x_{new} = x + 1$ 这个值带入直线方程里，算出来 $y_{new}$ 的值
- 然后比较 $y_{new}$ 和 $y + 0.5$ 的大小
  -  $y_{new} \leq y + 0.5$，选点 $(x + 1,\ y)$
  -  $y_{new} > y + 0.5$，选点 $(x + 1,\ y + 1)$



我们再把思路完善一下，把每次取舍时的误差考虑进去：

![day2_Bresenham_line](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day2_Bresenham_line.jpg)

如上图所示，实际上绘制的点的位置是 $(x, y)$，理论上点位置是 $(x,\ y + \epsilon)$。

当点从 $x$ 移动到 $x + 1$ 时，**理论**上新点的位置应该是 $(x + 1,\ y + \epsilon + k)$，其中 k 是直线的斜率。

实际绘制时，要比较 $y + \epsilon + k$ 和 $y + 0.5$ 的大小：

-  $y + \epsilon + k \leq y + 0.5$，选点 $(x + 1,\ y)$
-  $y + \epsilon + k > y + 0.5$，选点 $(x + 1,\ y + 1)$



对于下一个新点 $x + 2$，我们可以按照下式更新误差 $\epsilon$：

- 若前一个点选择的是 $(x + 1,\ y)$，则 $\epsilon_{new} = (y + \epsilon + k) - y = \epsilon + k$
- 若前一个点选择的是 $(x + 1,\ y + 1)$，则 $\epsilon_{new} = (y + \epsilon + k) - (y + 1) = \epsilon + k - 1$



把上面的思考过程用伪代码表示一下：

$
\begin{aligned} 
& \epsilon \leftarrow 0, \quad y \leftarrow y_{1} \\
& \pmb{for} \ x \leftarrow x_{1} \ \pmb{to} \ x_{2} \ \pmb{do} \\
& \quad \pmb{draw} \ \pmb{point} \ \pmb{at} \ (x, \ y) \\
& \quad \pmb{if} \ ( \ (\epsilon + k) < 0.5) \\
& \quad \quad  \epsilon \leftarrow \epsilon + k \\
& \quad \pmb{else} \\
& \quad \quad y \leftarrow y + 1 \\
& \quad \quad \epsilon \leftarrow \epsilon + k - 1 \\
& \quad \pmb{end} \ \pmb{if} \\
& \pmb{end} \ \pmb{for}
\end{aligned}
$



### 2.2 消除浮点运算

观察上面的伪代码，我们可以发现这里面出现了 0.5，也就是说存在浮点运算。下面我们就通过一些等价的数学变换消除浮点数。

首先对于不等式 $\epsilon + k < 0.5$，我们给它不等号左右两边同时乘以 **2 倍的 $\Delta x$**，这样就可以同时消除斜率除法和常量 0.5 带来的浮点运算:

$$
\epsilon + \Delta y / \Delta x < 0.5
$$

$$
2 \epsilon \Delta x + 2 \Delta y <\Delta x
$$

然后用 $\epsilon^{\prime}$ 表示 $\epsilon\Delta x$，上式可以转换为 $2(\epsilon^{\prime} + \Delta y)< \Delta x$



同样的，我们在更新 $\epsilon$ 时，把它也替换为 $\epsilon^{\prime}$ ，也就是对于下面两式：

- $\epsilon = \epsilon + m$

- $\epsilon = \epsilon + m - 1$

等号两边同时乘以 $\Delta x$，有：

- $\epsilon \Delta x = \epsilon \Delta x+\Delta y$

- $\epsilon \Delta x = \epsilon \Delta x+\Delta y-\Delta x$

然后用 $\epsilon^{\prime}$ 表示 $\epsilon\Delta x$，可以得到：

- $\epsilon^{\prime} = \epsilon^{\prime}+\Delta y$

- $\epsilon^{\prime} = \epsilon^{\prime}+\Delta y-\Delta x$



这时候我们就可以得到一个去掉浮点数运算的伪代码：

$
\begin{aligned} 
& \epsilon^{\prime} \leftarrow 0, \quad y \leftarrow y_{1} \\
& \pmb{for} \ x \leftarrow x_{1} \ \pmb{to} \ x_{2} \ \pmb{do} \\
& \quad \pmb{draw} \ \pmb{point} \ \pmb{at} \ (x, \ y) \\
& \quad \pmb{if} \ ( \ 2 (\epsilon^{\prime} + \Delta y) < \Delta x) \\
& \quad \quad  \epsilon^{\prime} \leftarrow \epsilon^{\prime} + \Delta y \\
& \quad \pmb{else} \\
& \quad \quad y \leftarrow y + 1 \\
& \quad \quad \epsilon^{\prime} \leftarrow \epsilon^{\prime} + \Delta y - \Delta x \\
& \quad \pmb{end} \ \pmb{if} \\
& \pmb{end} \ \pmb{for}
\end{aligned}
$



`C++` 实现如下：

```cpp
void line(Screen &s,
  int x1, int y1,
  int x2, int y2,
  TGAImage &image, TGAColor color) {
  int y = y1;
  int eps = 0;
  int dx = x2 - x1;
  int dy = y2 - y1;

  for (int x = x1; x <= x2; x++) {
    image.set(x, y, color);
    eps += dy;
    // 这里用位运算 <<1 代替 *2
    if((eps << 1) >= dx)  {
      y++;
      eps -= dx;
    }
  }
}
```



这样我们就实现了斜率在 $[0, 1]$ 区间的高效算法。也就是说，现在我们可以绘制 1/8 个象限的直线了。剩下范围的直线，可以通过交换  xy 等方式实现绘制。具体的实现都是些脏活累活，就不摆出来了，感兴趣的可以去 GitHub 上看代码的[完整实现](https://github.com/skychx/toyRenderer/blob/d31afbe91a140b95cef735776d13bca2dd7a5567/tinyrenderer/main.cpp#L20)。

![](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/e2ZFEU.gif)



## 3.绘制模型

这一部分可以结合[原英文教程](https://github.com/ssloy/tinyrenderer/wiki/Lesson-1-Bresenham%E2%80%99s-Line-Drawing-Algorithm#wireframe-rendering)学习，我只做一些细节上的补充。

前面两个小节都是算法基础学习，本小节开始加载一个非洲人的 `.obj` 模型，然后把模型上每个三角形面的点连接起来。

> OBJ 文件是一种被广泛使用的 3D 模型文件格式（obj 为后缀名），用来描述一个三维模型。模型关键字较为繁琐，限于篇幅本文暂不展开，大家可以自行搜索学习。

这一节的流程也很清楚：从磁盘上加载 `.obj` 文件 → 按行分析 `.obj` 文件 → 构建 model → 循环 model 中的每个三角形 → 连接三角形的三条边 → 渲染出图

上诉流程的前三步已经被原作者封装好了，我们直接把[源码](https://github.com/skychx/toyRenderer/tree/day02-line-drawing-algorithm/tinyrenderer)里的 `model.h` 和  `model.cpp` 拖到主工程里就可以了，感兴趣的人可以看一下源码实现，非常简单，在一个 `while` 循环里一直 `readline` 就可以了，因为和图形学关系不大，我这里就略过了。

最后的画三角形的代码如下，关键步骤我已经用注释标注了：

```cpp
// 实例化模型
model = new Model("obj/african_head.obj");

// 循环模型里的所有三角形
for (int i = 0; i < model->nfaces(); i++) {
  std::vector<int> face = model->face(i);

  // 循环三角形三个顶点，每两个顶点连一条线
  for (int j = 0; j < 3; j++) {
    Vec3f v0 = model->vert(face[j]);
    Vec3f v1 = model->vert(face[(j + 1) % 3]);
    
    // 因为模型空间取值范围是 [-1, 1]^3，我们要把模型坐标平移到屏幕坐标中
    // 下面 (point + 1) * width(height) / 2 的操作学名为视口变换（Viewport Transformation）
    int x0 = (v0.x + 1.) * width / 2.;
    int y0 = (v0.y + 1.) * height / 2.;
    int x1 = (v1.x + 1.) * width / 2.;
    int y1 = (v1.y + 1.) * height / 2.;
    
    // 画线
    line(x0, y0, x1, y1, image, white);
  }
}
```



![toyrenderer_day02_obj](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/toyrenderer_day02_obj.jpg)



<br />



<br />



今天学习了如何画一条线，明天我们学习如何画一个三角形。





## 参考连接：

[Line Drawing on Raster Displays](https://www.cs.helsinki.fi/group/goa/mallinnus/lines/gsoft2.html)

[The Bresenham Line-Drawing Algorithm](https://www.cs.helsinki.fi/group/goa/mallinnus/lines/bresenh.html)

[DDA Line Drawing Algorithm - Computer Graphics](https://www.youtube.com/watch?v=W5P8GlaEOSI)

[Bresenham's Line Drawing Algorithm](https://www.youtube.com/watch?v=RGB-wlatStc&list=LL&index=2&t=1s)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::