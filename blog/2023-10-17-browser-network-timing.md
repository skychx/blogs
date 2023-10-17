---
slug: browser-network-timing
title: ⚡️ [性能优化] 如何利用浏览器调试工具观测优化资源请求
author: 卤代烃
author_title: 微信公众号@卤代烃实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: PerformanceResourceTiming API，Network Panel Timing and Performance Panel Network
draft: true
tags: [性能优化, 计算机网络]
---

Web 应用和 Native 应用的一大区别就在于 Web 的关键资源（html/css/js）都是在线动态加载的，这样在一些性能优化场景上，网络的优化就显得更为重要了。而计算机网络又是一个尤为复杂的学科，优化手段和调试观测工具也尤其多。所以我准备从入手门槛最低，也是性价比最高的浏览器调试工具说起，如何观测优化资源请求。

<!--truncate-->


## 前置知识

### 资源加载优先级

### 资源加载全流程时序

## 可观测的工具

如果有一些网络资源方面的优化需求，一般开发者可以通过以下 3 种手段来调试 & 观测站点的 Network：

### Chrome Network Panel


这个应该是使用最频繁的调试工具，基本上是个开发就会使用。网络相关的数据非常的全面，可以说开发者关心的内容都涵盖了。**这里不说别的**

### PerformanceResourceTiming API

Performance API，业务开发者一般很少直接用到，这些数据一般由监控 SDK 采集和上报，然后交给下游的监控平台做数据汇总，一般很少有人直接看这种原始数据。


### Chrome Performance Panel

这个算是 Chrome Devtools 调试工具箱中功能最强大使用最复杂的功能了。你可以在一张图表上查看 Network/Render Thread/CPU/GPU 等多个信息源的调度堆栈信息，一般资深玩家才能玩转。

## 各工具间的联系


## 可行的优化手段

### 优先级的调整

defer，async，preload，手动调节顺序


### 连接的优化

dns-prefetch，preconect，http/2，加钱