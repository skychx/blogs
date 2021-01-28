---
id: day3-draw-triangle
title: day1：画一个三角形
sidebar_label: day2：画一个三角形
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



> 本文源码 👉：[toyRenderer-day3-draw-triangle](https://github.com/skychx/toyRenderer/tree/day02-line-drawing-algorithm)



## 1.如何画一个三角形？

在正式开始这一小节前，我们先想一下如何利用上一节的画线绘制一个**实心的**三角形。

假设现在平面内有三个不共线的点组成一个三角形，我们可以利用上一节的直线算法轻易的连接三角形的三条边，这时候我们会生成一个封闭的三角形。

那么这时候问题就转换为，如何把这个空心的三角形变为一个实心的三角形？

我想大家这时候已经有思路了，就是一行一行扫描像素，把两个边界点之间的像素全部涂满上色就可以了。

这个方法肯定是可以的，但是实现不是很优雅，也不是业内的主流实现方式。因为基于行扫描的算法不是本文的终点，所以详细的推导和代码实现就不提供了，感兴趣的同学可以自己尝试实现一下。





## 2.利用向量叉乘画三角形







































## 3.利用三角形重心坐标画三角形

本小节介绍一个更通用的定理——**重心坐标（Barycentric Coordinate）**。其实重心坐标用来画三角形还是有些大材小用了，他最重要的运用其实是用来插值，不过插值的具体运用我们后续章节再探讨，今天我们看看重心坐标的推导和代码实现。

我们暂时只考虑二维平面的三角形。对于一个三角形 ABC 来说，假设平面内有一个点 P，很显然，AP，AB，AC 向量都是线性相关的，也就是说，我们可以写成 AP = AB + AC。

我们把这个三角形放在一个笛卡尔坐标系下，



$$\overrightarrow{A P}=u \overrightarrow{A B}+v \overrightarrow{A C}$$



$$A-P=u(A-B)+v(A-C)$$



$$P=(1-u-v) A+u B+v C$$



$$u \overrightarrow{A B}+v \overrightarrow{A C}+\overrightarrow{P A}=0$$



$$\left\{\begin{array}{l}u \overrightarrow{A B}_{x}+v \overrightarrow{A C}_{x}+\overrightarrow{P A}_{x}=0 \\ u \overrightarrow{A B}_{y}+v \overrightarrow{A C}_{y}+\overrightarrow{P A}_{y}=0\end{array}\right.$$



$$\left[\begin{array}{lll}u & v & 1\end{array}\right]\left[\begin{array}{l}\overrightarrow{A B}_{x} \\ \overrightarrow{A C}_{x} \\ \overrightarrow{P A}_{x}\end{array}\right]=0$$

$$\left[\begin{array}{lll}u & v & 1\end{array}\right]\left[\begin{array}{l}\overrightarrow{A B}_{y} \\ \overrightarrow{A C}_{y} \\ \overrightarrow{P A}_{y}\end{array}\right]=0$$





- 在一个二维平面内，用三角形某两条边作为基向量，那么空间中的任意一点可以用这两个基向量表示，这个就是三角形的重心坐标
- 利用点的坐标求出任意一个点的表示
- 推导出叉乘表示
- 然后求出坐标



## 4.绘制模型