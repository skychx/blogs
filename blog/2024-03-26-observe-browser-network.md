---
slug: observe-browser-network
title: ⚡️ [性能优化] 浏览器中观测 network 性能数据的 3 种方式
author: 卤代烃
author_title: 微信公众号@卤代烃实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: Chrome Devtools Network Timing Panel, Chrome Devtools Performance Panel Network, performance.getEntriesByType('resource'), 三种不同的观测方式异同
tags: [性能优化, network]
---

import { HeroImage } from '../src/components/heroImage';

<HeroImage name="cross-origin-and-performance-hero-image.jpg" w={640} h={279} />


## 前言

:::caution 招聘信息
正式开始文章前先插播一条招聘信息。

**字节 Web Infra 团队最近开启新一轮招聘了**，如果你对 Web Framework/Runtime/Performance，或对编译构建/Rust/AI 感兴趣，可以来看看我们的岗位（具体岗位信息可以看这个招聘链接 👉 [字节跳动 Web Infra - Web Solutions 团队招人啦！](https://mp.weixin.qq.com/s/Zn6QDRI40vg1_mafAFE7mw)）

简历可以发到我的邮箱 **skychx@hotmail.com**，我可以帮你内推岗位并跟进进度 🥳
:::

<br/>

浏览器的 Devtools 工具有多种观测 network 性能数据的方式，但是这些数据的表现方式各有不同。本文就是解读一下这些性能数据的表现方式，并做纵向比较，帮助更多的人去优化网络带来的性能问题。

<!--truncate-->

## 常见观测手段

### ResourceTiming API

如果想在 runtime 阶段获取当前页面的 network 性能数据，[ResourceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing) 其实是唯一的选择了。

```javascript
performance.getEntriesByType('resource');
```

关于这个 API 拿到的性能点位，有一个非常经典的图：

![](https://image-1255652541.file.myqcloud.com/uPic/timestamp-diagram.svg)

这个图我就不做过多解释了，从我个人角度看，这个 API 是非常优秀的，基本上把网络请求的所有链路都包揽了。这个 API 其实可以大体分为两类：

- 浏览器相关的点位：Service Worker 和 HTTP Cache
- 网络相关的点位：DNS/TCP/TLS/HTTP 等

不过这个 API 在跨域场景下部分数据会归 0（[ResourceTiming API 数据丢失](https://supercodepower.com/cross-origin-and-performance#2resourcetiming-api-%E6%95%B0%E6%8D%AE%E4%B8%A2%E5%A4%B1)），这个还是需要注意一下。

<br />


### Network Panel: Timing

观察网络请求，Network Panel 肯定是最最常用的调试工具了。在性能数据细节这一块儿，主要是通过 Timing 面板来观察数据的：

![devtools-network-panel-timing](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/devtools-network-panel-timing.jpg)

<br />

我先简单的介绍一下 Timing 面板各个字段的含义（其实这部分内容文档都有详细的介绍：[Timing Preview](https://developer.chrome.com/docs/devtools/network/reference#timing-preview)）

- **Queueing**: 网络请求不是有多少发多少，有一个队列的概念。不同的优先级出队时间不一样，HTTP/1.1 还有 6 个连接的限制，这就导致一些比较晚的请求会在队列里排队，这个就是排队所需要的时间
- **Stalled**: 请求可能已经建立连接了，但是因为各种原因可能停下来了
- **DNS Lookup**: 就 DNS 寻址花费的时间
- **Initial connection**: 可以简单理解为 TCP 连接 + TLS 连接耗时；HTTP/3 就是 QUIC 连接耗时
- **SSL**: TLS 连接耗时
- **Request sent**: 浏览器内部发起请求耗时，一般较短可忽略
- **Waiting (TTFB)**: HTTP Request 耗时
- **Content Download**: HTTP Response 耗时

从上面的内容可以看出，DNS 后面的链路是符合大家对「网络协议」的认知的，一般异议较少。结合 [MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing#typical_resource_timing_metrics)，也能得出下面的相关等式：

```javascript
// 右侧的点位为 ResourceTiming API 提供
DNS = domainLookupEnd - domainLookupStart
TCP = connectEnd - connectStart
TLS = requestStart - secureConnectionStart
HTTP_Request = responseStart - requestStart
HTTP_Response = responseEnd - responseStart
```

<br />

前面的 **Queueing** 和 **Stalled** 阶段是和浏览器高度相关的，这里面门道就比较多了。

首先对于普通的开发者来说，你是无法通过 `ResourceTiming API` 直接得出相关耗时的，你只能通过下面的代码模拟出 Queueing + Stalled：

```javascript
Queueing + Stalled = Math.min(domainLookupStart, connectStart, secureConnectionStart, requestStart) - startTime
```

那么 Queueing 和 Stalled 的分界点呢？这个点位 `ResourceTiming API` 并没有提供，在 Devtools 的源码里，这个点位为 issueTime，既 issueTime 存在且小于 startTime 的情况下会出现 Queueing。

```javascript
// devtools-frontend/front_end/panels/network/RequestTimingView.ts

// Queueing 场景，issueTime 小于 startTime
if (issueTime < startTime) {
  addRange(RequestTimeRangeNames.Queueing, issueTime, startTime);
}

// Blocking 就是 Stalled
const blockingEnd = firstPositive([timing.dnsStart, timing.connectStart, timing.sendStart, responseReceived]) || 0;
addOffsetRange(RequestTimeRangeNames.Blocking, 0, blockingEnd);
```

这个点位是内核提供的，但是并没有暴露给上层 API，只有 Devtools 消费。所以资源性能调优时，可以把 **Queueing** 和 **Stalled** 放在一起看。如果这块儿耗时较长，可能的原因和解决方案可能如下：

- 如果是「HTTP/1.1 六个连接」限制，可以尝试升级到 HTTP/2，或者采用一些通用的资源手段
- 如果是「资源请求优先级较低」导致的，可以尝试提升请求优先级
- 如果是「主线程繁忙」导致异步请求被 delay，可以尝试优化主线程 longtask
- 如果是「浏览器内部资源分配调度耗时」，这个一般解决不了，也很少见，死磕下去 ROI 很低的

至于纯网络请求相关阶段的优化，市面上文章较多，就不展开说了，大家自行查阅即可。

<br />

### Performance Panel: Network

另一个可以观测 Network 细节的地方，就是 Performance Panel 的 Network Channel，可以看到当前页面的所有网络请求信息。

![devtools-perfs-panel-network-channel](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/devtools-perfs-panel-network-channel.jpg)

图片里的 netwrk waterfall 是一种变异的箱形图，和统计学里的箱型图（box plot）原始概念不一样，这里**只是借了形**，所以需要重新理解。

首先简单的看一下颜色，这里颜色主要分为 5 类：

- 蓝色：表示 HTML
- 紫色：表示 CSS
- 黄色：表示 JS
- 绿色：表示 Media 资源，例如 图片/视频/字体
- 灰色：其它请求，例如 fetch，xhr

<br />

我们接下来分析一下形状：

- 左边的细线：从 startTime 开始，到 requstStart 的所有时间
- 浅色的箱：既 Request 耗时
- 深色的箱：既 Response 耗时
- 右边的细线：资源已经下载好了，但是主线程较忙来不及消费的等待时间

这个用代码表示的化应该是这个：

```javascript
// 右侧的点位为 ResourceTiming API 提供
Left_Line = requestStart - startTime // Queueing + Stalled + DNS + TCP + TLS
Dark_Bar = responseStart - requestStart // Request
Dark_Bar = responseEnd - responseStart // Response
Right_Line // waiting to be used
```

从上面可以看出，「左边细线」包含的信息比较多，吞掉了很多细节；「右边细线」目前属于浏览器的运行细节，没有 API 暴露给前端去使用。

具体的优化手段和上面说的差不多，不过值得注意的是右侧的细线，这个一半都是主线程存在 longtask 阻塞了资源的消费，需要把重心放在 longtask 上。

<br />

## 各方法异同

从上面可以看出，观测 network 性能数据的 3 种手段，存在不少共性，但是也各有差异。我做了一张图，基本上一眼就能看出异同：


> 本图未考虑 Service Worker 场景



## 参考内容

- [ResourceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing#typical_resource_timing_metrics)
- [Chrome Network Panel -- timing](https://developer.chrome.com/docs/devtools/network/reference#timing-preview)
- [Chrome Performance Panel -- network](https://developer.chrome.com/docs/devtools/performance/reference#network)