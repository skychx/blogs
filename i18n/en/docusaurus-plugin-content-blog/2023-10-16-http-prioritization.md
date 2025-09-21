---
slug: http-prioritization
title: 🪢 [网络协议] 浅谈 HTTP 优先级算法的演进
authors: skychx
description: 浅谈 HTTP 优先级算法的演变：HTTP/1.1 没有，HTTP/2 过于复杂，HTTP/3 返璞归真
draft: false
tags: [Web Performance, network]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="http_%20prioritization_hero_img.jpg" w={1280} h={853} />



前两天在「即刻」上一时兴起写了一段 HTTP 优先级的发展历程，这两天觉得当时写的还是太仓促了，所以准备写个 Blog 扩写一下，就「优先级」这个概念纵向分析，看看这些基础协议的发展和进化。

<br />

{/* truncate */}

正式讲之前先列个时间线，这样的话对以下内容的理解会有个更直观的认识：

- 1997 年，经过前几年几个版本的迭代，HTTP/1.1 最终定稿。伴随着浏览器的发展，互联网时代拉开帷幕
- 2015 年，HTTP/2 发布，主打解决性能问题，新增了一堆特性。到现在为止，全球 [35.5%](https://w3techs.com/technologies/details/ce-http2) 的网站使用了 HTTP/2
- 2022 年，HTTP/3 发布，最大的特点是传输层替换成 UDP，到现在为止，全球 [27%](https://w3techs.com/technologies/details/ce-http3) 的网站使用了 HTTP/3

:::info 提示
HTTP 历史发展推荐阅读 MDN 的文章：[《Evolution of HTTP》](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Evolution_of_HTTP)
:::

<br />

虽然 HTTP 已经发展了 30 多年，从一个简单的**文本协议**已经进化到**加密二进制流**，但是得益于良好的协议设计和各种调试工具的发展，对于大部分应用程序开发者来说，底层到底是 1.1 还是 3，在使用上基本都是无感的。但是对于一些特殊需求（例如性能优化），就必须拨开这些封装，窥探一下这些字节中的细节了。



下面我们就来谈谈 HTTP 中 「优先级（prioritization）」是如何设计的。

<br />

## HTTP/1.1: 啥也没有

对于 HTTP/1.1老伙计来说，**根本就没有优先级的概念**。



如果没有开启 `keep-alive`，那就是一个 TCP 上传输一个来回的 HTTP，都是一对一的关系，何来多请求场景下的优先级概念呢？



如果开启了  `keep-alive`，策略也非常简单，那就是 **FIFO（First In First Out）**，一个非常典型的队列场景，所以也不存在优先级问题，谁来得早就发送谁，主打一个**公平**。



当然，这种绝对的公平引起了一个问题，那就是**队头阻塞（Head-of-Line blocking）**，简单说就是如果前面的请求卡住了，后面的请求就只能干瞪眼等着空耗，HTTP/2 和 HTTP/3 都试着解决这个问题（但完美的解决方案是不存在的）。由于这部分内容太多了，我拆到另一篇 Blog 再细讲。


:::info  提示
其实 HTTP/1.1 还有个 [pipelining](https://developer.mozilla.org/en-US/docs/Web/HTTP/Connection_management_in_HTTP_1.x#http_pipelining) 方案，没有解决 HOL 问题的同时还有严重的性能问题，所以主流浏览器和服务器都没支持，就是个废案，但可以当个扩展阅读考考古
:::

<br />


## HTTP/2: 过度设计

HTTP/2 的一个宣传点是多路复用（Multiplexing），也就是说一个 TCP 链接上**并发**跑多个 HTTP 请求。这种一对多场景，就有了**调度策略**和**优先级**的需求。


我们先不说 HTTP/2 是如何设计多请求下的优先级方案的，我们先做个思想实验，尝试自己从 0 设计这个优先级方案。

<br />

假设 A，B，C 三个大小一样的图片，我们要用 HTTP/2 传输，那么拍脑门用最快的思路想一下，可以怎么做？



第一种思路，就是先传输 A，再传输 B，最后传输 C。但这和 HTTP/1.1 也太像了，**没有新意**，用户不会买单的。

![FIFO_HTTP](https://image-1255652541.file.myqcloud.com/uPic/FIFO_HTTP.png)

<br />

第二种思路，突出并发流式概念，我先传输 A 一些，再传输 B 一些，再传输 C 一些，主打一个风水轮流转（Round Robin 策略）。再加上**终端流式加载渲染**，用户体感渲染速度直接快了一半。

![Fair_Round_Robin](https://image-1255652541.file.myqcloud.com/uPic/Fair_Round_Robin.png)



<br />

这时候我们再上上难度，比如说这个 A 是文章首图，B 和 C 是文章内的例图，那么对于性能指标和用户体验来说，A 快些加载肯定是更合适的，那么就要提高 A 的加载优先级，HTTP/2 这一个连接里，应该分配给 A 更多的带宽。

![Unfair_Round_Robin](https://image-1255652541.file.myqcloud.com/uPic/Unfair_Round_Robin.png)

<br />

在现实场景里，一个页面有几十个资源请求，大小，类型，调用时机都是不一样的，非常的复杂。所以 HTTP/2 为了适配这种复杂度，就设计了一个**更复杂**的优先级调度策略 😅。

<br />

由于存在调用顺序等问题，HTTP/2 先搞了个优先级**依赖树（dependency tree）**，根据资源之间的调度关系和构建一颗依赖树。例如一个 html 页面，里面加载了 css 和 js，还有一张 jpg。css 里面还加载了一张 png。那么根据这个依赖关系可以构建出这样一颗树：

![Dependency_Tree](https://image-1255652541.file.myqcloud.com/uPic/Dependency_Tree.png)



这颗树展示了资源的依赖关系，一般来说，终端应该先加载**根节点**资源，加载完后再加载**子节点**资源。

<br />

但对于树这种结构来说，还存在一个问题，那就是**同级的子节点**之间按道理来说也应该有优先级顺序。

比如说一个 html（根节点）发起了 3 个图片（子节点）请求，其中 1 是首图，2 是首屏图片，3 是屏幕外的图片。这 3 张图虽然都是图片请求，互相也没有从属关系，但是从用户体验来说，优先级应该这样最合理：

```bash
1.ipg > 2.jpg >> 3.jpg
```



所以为了应对这种场景，HTTP/2 大手一挥，又给每个节点划分了 **256** 个权重分级（weight），足够你慢慢分了。

![HTTP_2_Weight](https://image-1255652541.file.myqcloud.com/uPic/HTTP_2_Weight.png)

<br />

当然，除了这些可以初步分析就能确定的优先级，HTTP/2 还支持**动态修改优先级**，后来者可以向原先构建的优先级树上随时挂节点，已经处在队列里的可以随时插队。

<br />

最后，为了紧急情况，还提供了**独占式标志位（exclusive flag）**，设为 1 就可以不顾规则，全占带宽，突出一个霸道。

![HTTP_2_Exclusive_Flag](https://image-1255652541.file.myqcloud.com/uPic/HTTP_2_Exclusive_Flag.png)

<br />

到此，你已经可以看出 HTTP/2 的优先级有多复杂了：**依赖树 x 256 个优先级 x 独占位 x 动态调整，互相乘起来复杂度飙升**。



站在现在这个时间点看，毫无疑问，HTTP/2 的优先级策略，就是**过度设计**了。没有几个开发者可以 cover 这个爆表的复杂度。三大主流浏览器的调度策略，只用了 HTTP/2 很小的一部分内容（这个内容也够单独写一篇文章了）；服务端上，完全支持 HTTP/2 复杂度调度策略的服务器[也没几个](https://github.com/andydavies/http2-prioritization-issues)。



虽然优先级调度策略支持不太行，各端只支持了一小部分能力，但是 HTTP/2 还有很多其它的优化，综合来看，在统计数据上 HTTP/2 的性能还是强于 HTTP/1.1 的，还是非常值得升级的。

<br />

## HTTP/3: 先跑几年

HTTP/2 已经落入规范并实施多年了，木已成舟，想改也改不动了，隔壁 HTTP/3 也开始写 RFC 准备动工了。



先不说 HTTP/3 的那些特性，HTTP/2  优先级设计成这个德行，设计委员会在座的各位都有有责任的。如果把上个领导班子的策略继续贯彻下去，那浏览器和服务器肯定都是没办法落实的，最后受苦的还是广大群众，这样子会出问题的。所以 HTTP/3 吸取了教训，对优先级进行了大刀阔斧的改革，删繁就简，写成了 [RFC 9218](https://www.rfc-editor.org/rfc/rfc9218.html)，八十老翁都能看懂。

- 首先 HTTP/3 删掉了依赖树的概念，优先级也从原来的 256 个减到 8 个，名为 urgency
- 请求独占的特性也去了，又减少了一个复杂度
- 动态修改优先级的能力还是得以保留，这个算新版 HTTP 的特性，而且出于灵活度也是必须保留的
- 新增了一个开关，表示是否需要增量传输，也就是说是否可以和其它资源交错（interleaved）传输

<br />

那么对于一个请求来说，啥都不做，开局他新手属性是 3，不流式传输。对于 HTTP/3 的整体传输来说，流程是这样的：

![HTTP_3_Prioritization](https://image-1255652541.file.myqcloud.com/uPic/HTTP_3_Prioritization.png)

- 先传输标志了 P0 级的资源，全传输完了再传输 P1 级的，直到全部传完
- 同一级的资源，如果都是非增量传输的，那就按先来后到的规则，谁先来的谁先走（FIFO）
  - 如果存在增量传播的资源，那就交错传输
  - 如果同级资源同时存在增量和非增量的资源，RFC 从理论上没有做出指导，实际上浏览器也不会这样创建（不要没事找事）

<br />

这样看的话，HTTP/3 的优先级策略还是很**清晰易懂**的，没 HTTP/2 那么可怕，又没有 HTTP/1.1 那么简陋。那它的调度策略可以完美的均衡设计复杂度和现实复杂度吗？



答案是，**大家也不知道**。毕竟 HTTP/3 是 2022 年年底才正式发布的协议，线上也就跑了一年多，谁心里也没谱。到底是不是解决了历史问题，还是又引入新的难题，到底是「遥遥领先」，还是「又不是不能用」，都需要时间去验证。

<br />

## 结语

到此 HTTP 三个大版本的「优先级」发展历程我就梳理完了，大家也可以看出，实际上对于这些协议的顶层设计者来说，基本上从项目运行的一开始就偏离了自己的设计路线的，我想类似的事情只要大家工作几年都会有所感触。

这篇文章我主要是从协议的角度去讲解优先级的，那么下一篇我们就来唠唠，浏览器是如何配合 HTTP 协议中的优先级的。


<br />


## 参考链接

- [RFC 9113 HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html)
- [RFC 9114 HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)
- [RFC 9218 Extensible Prioritization Scheme for HTTP](https://www.rfc-editor.org/rfc/rfc9218.html)
- [HTTP/2 Prioritization](https://calendar.perfplanet.com/2018/http2-prioritization/)
- [Better HTTP/2 Prioritization for a Faster Web](https://blog.cloudflare.com/better-http-2-prioritization-for-a-faster-web/)
- [HTTP/3 Prioritization Demystified](https://calendar.perfplanet.com/2022/http-3-prioritization-demystified/)
- [Introducing HTTP/3 Prioritization](https://blog.cloudflare.com/better-http-3-prioritization-for-a-faster-web/)
- [HTTP/2 IN ACTION](https://dl.ebooksworld.ir/motoman/Manning.HTTP2.in.Action.www.EBooksWorld.ir.pdf)



