---
slug: Interactive-Tutorials
title: 📎 从回形针的互动视频谈谈交互教程的发展
authors: skychx

description: 从回形针互动视频展开，谈谈交互教程的发展
draft: false
tags: [可视化, 交互]
---

> 本文原来是知乎上的一个[回答](https://www.zhihu.com/question/435245052/answer/1633004916)，反响还不错，所以完善了一些细节重新整理发布一下



2020 年 12 月 17 日，回形针工作室上新了一款新产品——[「一个人工智能的诞生」互动教学视频](https://www.bilibili.com/video/BV1XV411h7Ro)，因为从高中开始就接触了 MOOC，对在线教育这块儿一直很感兴趣，所以第一时间就跟进体验了了一下他们的体验课——[「识别数字」](https://jibencaozuo.com/product/1/episode/0)。

<!-- truncate -->



![基本操作——识别数字](https://image-1255652541.file.myqcloud.com/uPic/jbcz.gif)



体验课的大致流程是这样的：

- 先播放一段视频，在**关键节点**会自动停下来
- 停下来后你可以自己操作页面上的一些控件实现和视频的交互
- 通关后你可以跳到下一段视频
- 重复上面三个操作



作为一个软件工程师，自然对于这个网站的实现非常非常感兴趣，Web 前端基本没有秘密可言，`F12` 后直接看看他们是怎么做的。

- 先抓包看了一下，Network 面板有很多的 `mp3` 和 `mp4` 请求，然后在 Elements 面板里搜到了 `<video />` 标签，所以说视频还是通过 `video` 播放的；
- Console 面板有一个 [PixiJS 5.3.3](http://www.pixijs.com/) 的输出，Elements 面板里可以搜到  `<canvas />` 标签，并且在互动环节时会切到 `canvas`，所以说互动环节是基于 `WebGL` 实现的



基本的技术选型搞清楚后，**从技术上看**，回形针的这个互动视频并没有什么创新可言，国内外有很多的互动广告，都是用这套组合拳实现的：过场动画用视频，交互操作用 WebGL；**从商业上看**，可能确如回形针所说，这个可能是世界上第一款互动教学视频。



如果只是说技术实现，可以说到这里就分析完毕了，但是我看到一些评价，说回形针的这个创新是独创性的，这个评价就有些过高了，因为在图文时代，这种图文交互教程还是不少的，下面我简单捋一捋**交互教程**的发展历史。

<br />

大部分的交互教程都是依托于 Web，所以他们的发展历史和 Web 的发展是高度绑定的。

比如说十几年前 Flash 是网页实现交互的主流方案，互动教程也是基于 Flash 实现的。比如说斯坦福大学的[这个网页](http://graphics.stanford.edu/courses/cs178-10/applets/gaussian.html)，可以通过 Flash 的实时交互学习**透镜公式**：

![gaussian](https://image-1255652541.file.myqcloud.com/uPic/gaussian.gif)



后面 Flash 逐渐没落（Adobe 将在 2020 年 12 月 31 日彻底停止支持 flash），随着 HTML5 标准的兴起，大家可以用 canvas/SVG/WebGL 去实现前端交互，这时候很多互动教程也走入大家的视野：



比如说线性代数教程 [immersive linear algebra](http://immersivemath.com/ila/index.html) 就用了 **canvas** 技术实现交互操作：

![immersive linear algebra](https://image-1255652541.file.myqcloud.com/uPic/linear.gif)



**SVG** 相关的互动教程也有一些，比如 [NN-SVG](http://alexlenail.me/NN-SVG/index.html) 这个项目就利用 SVG 实现了 FCNN 的可视化：

![FCNN](https://image-1255652541.file.myqcloud.com/uPic/FCNN.gif)



**WebGL** 的交互教学视频也有一些，比如你想学 shaders 怎么写，完全可以借助 [the book of shaders](https://thebookofshaders.com/) 这个互动教程网站，直接修改案例源码，实时反馈自己的学习成果：

![shaders](https://image-1255652541.file.myqcloud.com/uPic/shaders.gif)



我在 2018 年看过一个基于 WebGL 实现手写数字识别的交互教程——[TensorSpace LeNet](https://tensorspace.org/html/playground/lenet_zh.html)，当时的感觉就非常惊艳，我想回形针的这个体验课对这个教程也有一些借鉴：

![TensorSpace](https://image-1255652541.file.myqcloud.com/uPic/TensorSpace.gif)



至于前端方面知识的互动教程就更多了，很多博客都借助 [CodePen](https://link.zhihu.com/?target=https%3A//codepen.io/) 分享代码，用一个 **iframe** 引入到自己的网站，这样读者就可以实时改动代码验证自己的想法。所以说，互动教程这个概念很早就有了，太阳底下没有新鲜事，并没有一些人想的那么划时代。

<br />

梳理完互动教程的发展，我再谈谈我个人的看法。

我个人认为无论媒介是视频还是图文，互动教程的意义是非常大的，因为实时反馈可以大大降低初学者的学习成本。

最典型的就是**线性代数**这门课，据我所知大部分人的反应都是学完一脸懵逼，完全不知道这玩意儿有啥用，考完试就全忘了。而事实是线性代数在计算机里应用极广，这时候我就推荐他们去看 [3Blue1Brown](https://space.bilibili.com/88461692/) 的「[线性代数的本质](https://www.bilibili.com/video/BV1ys411472E)」这门课，配合可视化演示，彻彻底底的搞懂线性代数是个啥。

当然互动教程也不全是优点，缺点（或者说短板）也很明显。

- 首先**并不是所有学科都适合做可视化**。回形针有两期关于数学的可视化教程，但是说实话效果还不如直接摆公式
- 其次是**很难掌握边界**。交互类教程还是教程的这个大类，如果没有这个约束，交互教程很有可能变为炫技产物，学生会被海量的视觉噪音所淹没，最后教学质量反而会大打折扣
- 最后一个问题就是**成本很高**。我平时写文章画个图都非常的耗时，更不要说主动设计交互了。如果没有明显的收益，个人很难有动力去做一套交互教程，所以我对回形针的这个定价表示理解，这个成本比写书高多了

<br />



最后还是希望这个项目能长久发展下去，在我看来，这才是在线教育应该有的样子。


<br />

<br />


-----



欢迎大家关注我的微信公众号：**卤代烃实验室**，目前专注前端技术，对图形学也有一些微小研究。

也可以加我的微信 **egg_labs**，欢迎大家来撩。

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>


![](https://image-1255652541.file.myqcloud.com/uPic/OAFePh.jpg)























