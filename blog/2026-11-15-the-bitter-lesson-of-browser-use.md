---
slug: browser-use-bitter-lesson
title: 🧠 [Browser-Use] 2026 年关于 Browser-Use 的一些看法
authors: skychx
description: 一些有的没的
draft: true
tags: [CDP, AI Agent, Browser-Use]
---

本文无 AI 辅助，纯人工手搓，可放心观看。

前两天看见[潦草学者](https://www.liaocaoxuezhe.com/)的文章[《浏览器操控的苦涩教训》](https://www.liaocaoxuezhe.com/article/the-bitter-lesson-of-browser-use/)，想到去年这时候我还在死磕 Browser-Use，早期还和他针对这块儿内容做过一些交流（他目前在美团光年之外做 [Tabbit 浏览器](https://www.tabbit.com/)）。没想到一年过去，模型能干的事情越来越多，物是人非，一时感慨万千。

Browser-Use 的技术路线我就不多做介绍了，上面那篇文章已经写的非常完备了，我今天就随便写写，相当于这篇文章的一个注脚，谈谈我的一些个人感悟。

因为 Browser-Use 是 Computer-Use 的一个分支，所以我会先从 Computer-Use 展开分析，然后再细分到 Browser-Use。

## Computer-Use 能干啥

从 Computer-Use 的狭义定义上看，就是**让 Agent 模拟人类去操作电脑，完成一些特定的任务**。

其实从这个定义看，Claude 的目标很明显，就是替代大部分白领在电脑前的一些操作类工作。

其实我一直觉得当年 Claude 搞出来 Computer-Use 这套方案的时候，噱头其实是大于功能的。到现在差不多快 2 年了，其实这套方案一开始就暴露的问题，比如说慢，GUI 动作-反馈循环的时延问题，如果从狭义的 Computer-Use 定义上看（模拟人类操作电脑），其实一直没有得到很好的解决，很多思路都是靠其他路线补齐的。


## 组合 > 单点突破

其实从 2025 年开始，大家就发现，如果目标只是完成某个任务，没必要一直拘泥于 Computer-Use 的**纯净**路线，多个 Tool 组合才是硬道理。

比如说手头你有很多的账单你需要算算帐，如果是纯 Computer-Use，你就得唤起本地计算器，然后模拟点击计算。但是这个对于一个 Agent 来说，应该直接起一个 python 终端算，要比模拟手指点点点快多了。这个就是最典型的「组合 > 单点」的案例。

### GPT-6

今年年中发布的 GPT-6，Computer-Use/Browser-Use 是一个重点推出的功能，其实观察它的使用链路，是可以清晰的看出这种「组合」思路的。

我这里再举一个现实的例子，我之前让 Codex 去更新某个 Google Sheet 文档，主要是把另一个文档中部分数据更新到 Sheet 上。Codex 检测到我本地未安装 Google Doc MCP 的情况下，主动的使用了 Browser-Use 方案去更新文档。

更新文档时，Codex 先是看了一下 Sheet 的截图，有了个大概的映像，然后就用浏览器插件把 Sheet 文件下载到了本地。

这样本地就存在了一份 csv 文件和更新文档，这就进入现如今 agent 的 happy path 了，直接写 python 脚本处理，做了一份更新好的文件

接下来才进入传统的 Browser-Use 流程，定位到具体的 Sheet 单元格位置，然后执行 Click 定位，Paste 粘贴操作，这样文档就更新了

### Claude-5

无论是 Fable-5 系列还是 Ops-5.5，在 Coding 能力上又前进了一大步。

之前为了降低误差搞的 Harness，在最强的 Coding 模型面前，其实都是束缚。

直接把 Browser-Use 转为一个 Coding 问题。

CDP 有缺陷，有能力限制。但是这些对于最核心的目标其实都不是问题。


## 你真的需要 Browser-Use 吗？

整体大的原则，API 是要比 GUI 快不少的

- 有 MCP/CLI，优先使用
- 平台有 Public API，封装后直接使用
- 什么都没有，可以尝试逆向相关的平台 API
- 没有完善的技术能力，尝试 Browser-Use

并不是所有的中台/SaaS，都能加速，部分的生意就是建立在摩擦上的：

- 有些卡点根本不是操作上，比如说部分生意还保留着传统的邮件交流上，阻塞根本不是操作
- 风控问题


## 另一个生意逻辑

Browser-Use 这家公司，推出了指纹浏览器，静态 IP 集成等逻辑。他们做的不是「提效」，更像「爬虫生意」的升级版。





