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



前面两天画了点和线，今天我们来画一个最简单也是最强大的面——**三角形**。

本文主要讲解三角形绘制算法的推导和思路（只涉及到一点点的向量知识），最后会给出代码实现，大家放心的看下去就好。

<br />

> 本文源码 👉：[toyRenderer-day3-draw-triangle](https://github.com/skychx/toyRenderer/tree/day03-triangle-drawing-algorithm)



## 1.如何画一个三角形？

在正式开始这一小节前，我们先想一下如何利用上一节的画线算法绘制一个**实心的**三角形。

假设现在平面内有三个不共线的点组成一个三角形，我们可以利用上一节的直线算法轻易的连接三角形的三条边，这时候我们会生成一个**空心的**、**封闭的**三角形。

那么这时候问题就转换为，如何把这个空心的三角形变为一个**实心**的三角形？

我想大家这时候已经有思路了，就是**一行一行地扫描像素**，把两个边界点之间的像素全部涂满上色就可以了。

![day03_scanLineDrawTriangle](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_scanLineDrawTriangle.jpg)

这个方法肯定是可以的，但是实现不是很优雅，也不是业内的主流实现方式。因为基于行扫描的算法不是本文的重点，所以详细的推导和代码实现就不提供了，感兴趣的同学可以自己尝试实现一下。





## 2.利用向量叉乘画三角形

开始本节前先简单复习一下向量叉乘的几何意义。


### 2.1 数学推导

在三维空间中，两个三维向量 $\mathbf {a}$  和 $\mathbf {b}$ 做叉乘，会得到一个和已知两个向量**垂直**的新向量 $\mathbf {a} \times \mathbf {b}$。

既然叉乘产生的是一个新向量，那么它肯定有个方向，我们一般用右手定则来判断：将右手食指指向 $\mathbf {a}$ 的方向、中指指向 $\mathbf {b}$ 的方向，则此时拇指的方向即为 $\mathbf {a} \times \mathbf {b}$ 的方向。

![Right_hand_rule_cross_product.svg](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/Right_hand_rule_cross_product.svg.png)



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

![day03_cross_product](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_cross_product.jpg)

- $\overrightarrow{A B} \times \overrightarrow{A P}$，值为**正**，故 $P$ 在 $AB$ **左侧**
- $\overrightarrow{B C} \times \overrightarrow{B P}$，值为**正**，故 $P$ 在 $BC$ **左侧**
- $\overrightarrow{C A} \times \overrightarrow{C P}$，值为**正**，故 $P$ 在 $AC$ **左侧**

<br />

综合以上三个限制条件，我们可以判断 $P$ 在 $\Delta ABC$ 内。

如果上面三个计算中有值为负的情况，说明 $P$ 在三角形外；如果有值为 0 的情况，说明 $P$ 在三角形的边或顶点上。



### 2.2 代码实现

理论基础复习完了，我们就可以写代码了。代码实现相当简单，我们构建一个函数 `crossProduct`，传入三角形的三个顶点和平面上的任意一点 $P$，然后根据四个顶点构建出向量计算叉乘就可以了：

```cpp
// 利用叉乘判断是否在三角形内部
Vec3i crossProduct(Vec2i *pts, Vec2i P) {
    // 构建出三角形 ABC 三条边的向量
    Vec2i AB(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    Vec2i BC(pts[2].x - pts[1].x, pts[2].y - pts[1].y);
    Vec2i CA(pts[0].x - pts[2].x, pts[0].y - pts[2].y);
    
    // 三角形三个顶点和 P 链接形成的向量
    Vec2i AP(P.x - pts[0].x, P.y - pts[0].y);
    Vec2i BP(P.x - pts[1].x, P.y - pts[1].y);
    Vec2i CP(P.x - pts[2].x, P.y - pts[2].y);
    
    return Vec3i(AB^AP, BC^BP, CA^CP);
}
```

<br />

代码非常的简单，我们跑一个简单的例子验证一下：

```cpp
void drawSingleTriangle() {
    // 图片的宽高
    int width  = 200;
    int height = 200;

    TGAImage frame(width, height, TGAImage::RGB);
    Vec2i pts[3] = {Vec2i(10, 10), Vec2i(150, 30), Vec2i(70, 160)};

    Vec2i P;
    // 遍历图片中的所有像素
    for (P.x = 0; P.x <= width - 1; P.x++) {
        for (P.y = 0; P.y <= height - 1; P.y++) {
            Vec3i bc_screen  = crossProduct(pts, P);

            // bc_screen 某个分量小于 0 则表示此点在三角形外（认为边也是三角形的一部分）
            if (bc_screen.x<0 || bc_screen.y<0 || bc_screen.z<0) {
                continue;
            }
            
            image.set(P.x, P.y, color);
        }
    }
    
    frame.flip_vertically();
    frame.write_tga_file("output/day03_cross_product_triangle.tga");
}
```

<br />

看输出图像，我们已经成功绘制了一个三角形：

![day03_cross_product_triangle](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_cross_product_triangle.jpg)

<br />

> 触不及防的安利：大家可以看我头像关注🛰️号「卤蛋实验室」，后台回复「图形学」获取经典教材《虎书4》和《Real Time Rendering 4》

![后台回复「图形学」领取经典教材](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/rendering_book.jpg)


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

根据上面的公式推导，我们可以直接写出基于三角形重心坐标的绘制算法，思路理清了，代码实现就非常的简单：

```cpp
// 利用重心坐标判断点是否在三角形内部
Vec3f barycentric(Vec2i *pts, Vec2i P) {
    Vec3i x(pts[1].x - pts[0].x, pts[2].x - pts[0].x, pts[0].x - P.x);
    Vec3i y(pts[1].y - pts[0].y, pts[2].y - pts[0].y, pts[0].y - P.y);
    
    // u 向量和 x y 向量的点积为 0，所以 x y 向量叉乘可以得到 u 向量
    Vec3i u = x^y;
    
    // 由于 A, B, C, P 的坐标都是 int 类型，所以 u.z 必定是 int 类型，取值范围为 ..., -2, -1, 0, 1, 2, ...
    // 所以 u.z 绝对值小于 1 意味着三角形退化了，直接舍弃
    if(std::abs(u.z) < 1) {
        return Vec3f(-1, 1, 1);
    }
    return Vec3f(1.f- (u.x+u.y) / (float)u.z, u.x / (float)u.z, u.y / (float)u.z);
}
```

<br />

用上面的算法画个三角形验证一下，很完美：

![day03_barycentric_triangle](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_barycentric_triangle.jpg)





## 4.绘制模型

算法写好了，我们就要投入到实际应用中了，昨天里我们画了个三维模型的线框图，今天我们就个这个模型上色。



### 4.1 随机着色

为了区分每个三角形，我们随机给三角形上不同的色：

```cpp
triangle(screen_coords, frame, TGAColor(rand() % 255, rand() % 255, rand() % 255, 255));
```

<br />

这里还有个关于性能的小细节。这次我们绘制的图像大小为 `800*800`，如果按照之前的算法，每次画三角形，都要把所有像素遍历一遍，这个模型大概有 2000 个三角形，那就是要循环 `2000*800*800` 即 `12.8 亿` 次！

这个量级是很恐怖的，其中很多的运算都是不必要的，比如说下图，我们其实只要循环由三个顶点计算出的**红色包围盒里的像素**就可以了，不需要计算图片内的所有像素：

![day03_bounding_box](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_bounding_box.jpg)

<br />

所以我们要在遍历像素前加先求一遍三角形包围盒的边界，正式画三角形时只要遍历包围盒内的像素就可以了：

```cpp
// 定义包围盒
Vec2i boxmin(image.get_width() - 1, image.get_height() - 1);
Vec2i boxmax(0, 0);
// 图片的边界
Vec2i clamp(image.get_width() - 1, image.get_height() - 1);

// 查找包围盒边界
for (int i = 0; i < 3; i++) {
    // 第一层循环，遍历三角形的三个顶点
    for (int j = 0; j < 2; j++) {
        // 第二层循环，根据顶点数值缩小包围盒的范围
        boxmin.x = std::max(0,        std::min(boxmin.x, pts[i].x));
        boxmin.y = std::max(0,        std::min(boxmin.y, pts[i].y));

        boxmax.x = std::min(clamp.x, std::max(boxmax.x, pts[i].x));
        boxmax.y = std::min(clamp.y, std::max(boxmax.y, pts[i].y));
    }
}
```

<br />

最后我们绘制出的结果就是这样的，看着还是有些酷炫的：

![day03_rand_colors_model](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_rand_colors_model.jpg)



### 4.2 简单的光照着色

随机着色的好处是可以很清楚的表现出模型各个三角形的轮廓，但是也失去了模型的辨识度，很多细节都丢失了。

我们在这里引入一个非常简单的光照模型，认为**单位面积上接收到的光，和平面法线与光照方向的余弦值成正比**：

![day03_diffuse_reflection](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_diffuse_reflection.jpg)

<br />

所以着色的思路就很清晰了：

- 我们要先定义一个三维空间里的**光照方向（向量）**，然后计算三维空间里各个三角形的**法线（向量）**
- 两个向量**归一化**后，然后计算这两个向量的点乘，会得到一个值
- 这个值小于 0，说明光在三角形的另一侧，从物理上看是照射不到三角形表面的，所以直接舍弃此三角形
- 这个值大于 0，值**越大**，说明单位面积上接收到的光**越多**，三角形**越亮**

<br />

把上面的思路翻译成代码就是这样的：

```cpp
// 这个是用一个模拟光照对三角形进行着色

Vec3f light_dir(0, 0, -1); // 假设光是垂直屏幕的

for (int i = 0; i < model->nfaces(); i++) {
    std::vector<int> face = model->face(i);
    Vec2i screen_coords[3];
    Vec3f world_coords[3];

    // 计算世界坐标和屏幕坐标
    for (int j = 0; j < 3; j++) {
        Vec3f v = model->vert(face[j]);
        // 投影为正交投影，而且只做了个简单的视口变换
        screen_coords[j] = Vec2i((v.x + 1.) * width / 2., (v.y + 1.) * height / 2.);
        world_coords[j]  = v;
    }

    // 计算世界坐标中某个三角形的法线（法线 = 三角形任意两条边做叉乘）
    Vec3f n = (world_coords[2] - world_coords[0]) ^ (world_coords[1] - world_coords[0]);
    n.normalize(); // 对 n 做归一化处理

    // 三角形法线和光照方向做点乘，点乘值大于 0，说明法线方向和光照方向在同一侧
    // 值越大，说明越多的光照射到三角形上，颜色越白
    float intensity = n * light_dir;
    if (intensity > 0) {
        triangle(screen_coords, frame, TGAColor(intensity * 255, intensity * 255, intensity * 255, 255));
    }
}
```

<br />

最后生成的图片就是这样的：

![day03_light_model](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/day03_light_model.jpg)

<br />

到这里渲染出的图像就有些人样了，但是大家应该也发现了，上图的嘴巴和眼睛处看上去怪怪的。这里的确是有问题，因为它把背后的三角形渲染出来了，要想解决这个问题，就要引入一个新的概念——[z-buffer](https://www.wikiwand.com/en/Z-buffering)。

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::