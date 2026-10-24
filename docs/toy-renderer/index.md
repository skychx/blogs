---
id: index
title: 前言
sidebar_label: 前言
description: 前言
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
---

「**十天自制软渲染器**」这个标题我承认标题党了。在对图形学一无所知的情况下想十天自制一个软渲染器，就好似一节课没上过却试图一个晚上看完《30 天精通 C++》然后第二天早上八点考试得满分一样，我承认世界上有这种天才，但很可惜我不是。

就像[前文](../toys/home)所说，本系列造的轮子都是站在巨人的肩膀上完成的，需要对相关知识有一定的了解和学习，如果你是一个图形学大牛，这种软渲染器肯定是不屑于做的；如果你刚刚进入图形学的大门，造一个软渲染器的轮子，非常利于你巩固自己的底层知识。

<br />

本文主要（90%）参考 [ssloy](https://github.com/ssloy) 大神的 [tinyrenderer](https://github.com/ssloy/tinyrenderer) 教程，零依赖实现一个软渲染器，通过这个教程可以实现一个简易版本的 `OpenGL2.0`（rendering pipeline 只支持 `Vertex Shader` 和 `Fragment Shader` 两种自定义 Shader 类型），了解 `OpenGL` 这类图形学 API 在底层是如何工作的。

我自己造的轮子是 [**toy-renderer-ts**](https://github.com/skychx/toy-renderer-ts)。最早我是跟着原教程用 C++ 写的（[toyRenderer](https://github.com/skychx/toyRenderer)），后来整个换成了 TypeScript + canvas，每一天的代码都能直接在浏览器里跑起来，还加入了大量的注释。如果大家对 tinyrenderer 感兴趣，可以参考一下我的实现和我现在写的这个教程，**点个 star** 🌟 就更好不过了～

本专栏的目录结构和 [tinyrenderer](https://github.com/ssloy/tinyrenderer) 保持一致，方便大家对比阅读。另外 tinyrenderer 现在已经出了[第二版](https://haqr.eu/tinyrenderer/)，章节划分和第一版不太一样。本专栏还是按第一版的结构来，不过第二版有些地方讲得更清楚，我也会把它的讲法融进来。


<br />

## 前置知识

要想看懂 [tinyrenderer](https://github.com/ssloy/tinyrenderer) 的代码，需要有一定的知识储备，下面是我在造轮子时的一些总结，大家学习前可以参考一下。


### 1.数学

对于图形学来说，数学是一道绕不过的坎儿；对于这个软渲染器器轮子来说，并没有涉及太多的数学内容，我个人总结如下：

#### 1.1 高中数学

造一个软渲染器需要你还记得一些高中几何的内容，难度都不大，比如说直线的坐标公式，重心坐标等。

#### 1.2 微积分

微积分其实只有少量的涉及，[原教程](https://github.com/ssloy/tinyrenderer/wiki/Lesson-6bis-tangent-space-normal-mapping)里有一点点梯度的内容，个人感觉对整体学习进度影响不大。

#### 1.3 线性代数

线性代数涉及的内容比较多，从最简单的向量，再到各种坐标系变换，都需要对线性代数有比较扎实的理解。

如果你线性代数都忘的差不多了，这里我推荐 [3Blue1Brown](https://space.bilibili.com/88461692?spm_id_from=333.788.b_765f7570696e666f.2) 的教程——[**《线性代数的本质》**](https://www.bilibili.com/video/BV1ys411472E)，这是我见过**最好的线性代数入门教程了**。而且图形学里涉及的矩阵变换绝大部分都是三维空间的，基本上看完这门课就可以上手图形学的学习了。

![3Blue1Brown——线性代数的本质](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-01-13_22-27-04.png)

<br />

### 2.图形学

图形学入门课程我只推荐一个，[**闫令琪**](http://www.cs.ucsb.edu/~lingqi/)大神的[**《GAMES101-现代计算机图形学入门》**](https://www.bilibili.com/video/BV1X7411F744?from=search&seid=13888633704437789145)。

![GAMES101-现代计算机图形学入门](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-01-13_22-29-02.png)

闫令琪大神有多厉害我就不多介绍了，最关键的是 **GAMES101** 优点太多了：

- **全中文讲解**，大大降低国内小伙伴的学习门槛
- **课程非常新**，2020 年初才开课，不会存在课程/教案过时的情况
- **知识点全面**，正如课程名「现代图形学入门」，本课程不但讲了经典的光栅化成像，还讲了光线追踪等相对较新较前沿的内容

学完这门课可以收获什么呢？比如说 ~~2077 的图形设置面板你都知道是啥意思了~~

![2077 图形设置面板](https://image-1255652541.file.myqcloud.com/uPic/IMG_7903(20210112-204751).jpeg)

如果跟着这门课学下来，其实课下作业就会完成一个小的软渲染器，但由于我是后期才加入学习的，所以作业也没有跟着做，经过搜索发现 [tinyrenderer](https://github.com/ssloy/tinyrenderer) 这个教程推荐的人最多，所以最后参照这个教程实现了自己的软渲染器。

闫老师的是视频教程，大家可以配合他的 PPT 学习。如果习惯看书，我这里推荐两本，一本是大名鼎鼎的虎书《Fundamentals of Computer Graphics 4th Edition》，另一本是《Real Time Rendering 4th》，都是非常经典非常有名的书籍。

![Graphics Books](https://image-1255652541.file.myqcloud.com/uPic/rendering_book.jpg)

这两本书国内都没有引进，我这里有英文版的 PDF，大家可以关注我的公众号「**卤代烃实验室**」后回复「**图形学**」获取下载链接。

<br />

### 3.TypeScript

原教程是用 C++ 写的，本专栏的代码换成了 TypeScript，用到的都是基础语法，稍微高级点儿的也就是 class 和一点点泛型。只要有一些 JavaScript 基础就可以直接上手；如果你更熟悉 C++，也可以对照着原教程的代码一起看。

<br />

如果上面的三个知识点都掌握的差不多了，我打保票十天内肯定能写出一个软渲染器；如果没有掌握好（尤其是图形学基础知识），十天内实现是有些够呛。废话不多说，我们先去搭环境吧！


<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
