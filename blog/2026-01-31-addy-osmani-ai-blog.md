---
slug: addy-osmani-ai-blog
title: 🤖 [人工智能] 形势比人强，Chrome 大佬也去搞 Gemini 了
authors: skychx
description: 分析 Addy Osmani 关于 AI 时代下的程序员
tags: [AI]
---

import { HeroImage } from '../src/components/heroImage';

<HeroImage name="addy-osmani-ai-blog-hero.jpeg" w={749 } h={302} />

今天随便写点儿感想，内容没以前那么严肃。

前段时间有朋友转发了一篇 Blog [《The Next Two Years of Software Engineering》](https://addyosmani.com/blog/next-two-years/)，写的蛮不错的，于是看了眼作者，发现居然是 [Addy Osmani](https://addyosmani.com/)，对我来说其实是个老熟人（当然是单向的）了。

{/* truncate */}

## Addy 职业经历

<p>
<img src="https://addyosmani.com/assets/images/addy_2022.jpg" width="200" alt='Addy 之前常用的头像' />
</p>

因为之前工作方向是专门做性能优化的，我需要时刻关注 Chrome 的更新和相关特性，Addy Osmani 是一个高频出现的名字。他写了很多质量高的文章，之前我汇总过一篇专讲 JS 性能优化的文章：[《The Cost Of JavaScript》](https://supercodepower.com/the-cost-of-javascript) ，主要参考内容其实都是他的分享和 Blog。而且这个人的[职场经历](https://addyosmani.com/bio/)非常的亮眼：

- 16 岁的时候作为独立开发者开发过一个 XWebs，相当于「用 C++ 手写了一个浏览器」
- 2011 年做了一个 TodoMVC 开源项目，这个项目最后成为了各前端框架的起手式教学项目
- 2012 年加入 Chrome 后一步步升职为 Senior Staff Engineering Manager，主要负责 Chrome 的 DX（Developer Experience，开发者体验）方向，主要的成果有：
  - Chrome DevTools：最好用的 Web 调试平台，没有之一
  - Lighthouse：性能统计工具
  - Puppeteer：浏览器自动化工具
  - PWA/Core Web Vitals/MV3/Chrome DevTools MCP 等 Chrome 特性和相关生态的建设
- 除了工作内容，他还写了很多的书，做了不少独立产品

<br />

从上面可以看出，他在过去的十几年里，基于 Chrome 在 Web 上做了很大的贡献（尤其是开发者生态上），但是在 2025 年年底，他转入了 Google Cloud AI 团队，工作重心其实还是 DX，社区运作影响力建设这些。只不过对象从 **Chrome** 转为了 **Gemini**。

当然你也可以认为，这不过是聪明人的又一次聪明的选择罢了，毕竟形势就摆在这里。但是我前面也说了，Addy Osmani 这个人非常喜欢写 Blog 对外分享，入职 Cloud AI 后，他在两个月内就写了 12 篇 Blog，基本都和 AI Agent，AI Coding 相关。而且根据他的过往经历，他是那种非常难得的既有丰富的团队管理经验，又每天写代码的人，所以他的文章会**兼顾开发者和管理者的视角**，我个人看后觉得还是有不少收获的。

## 观点杂谈

### Taste

比如说最近有个词 Taste 很火，大致的背景就是说现在 AI 生成的代码非常快，代替了工程师之前手工编程的工作，那么决定做什么，向哪个方向做，系统如何设计就更重要了。

有人建议把 Taste 翻译为 **品味**/**审美**，其实含义很相近了，但问题是这个词本身就太大了，很容易和其它场景混合在一起，比如说音乐品味/美术审美；二是这个词很宽泛，这个就和评论一幅画，泛泛而谈的一句「这幅画审美不行」，肯定不如说 「这幅画的笔触如何，构图有什么缺陷，色彩上有什么值得提升的地方」 更有建设性。

Addy 其实在[《Your AI coding agents need a manager》](https://addyosmani.com/blog/coding-agents-manager/)这篇 Blog 里就探讨过这个问题，他是以管理学的角度解释了这个词。他个人认为，**Taste 其实是一个伪装的管理学技能**：

> That is a manager skill in disguise: prioritization, saying no, defining success, running small experiments, and killing bad ideas quickly.
>
> 这其实是伪装的管理技能：优先级排序、学会拒绝、定义成功标准、进行小规模实验，以及快速淘汰糟糕的方案

这几个分类指标就比较清晰了，从 Taste 这个大词中确定了几个方向，每次指挥 Coding Agent 工作前，基于这几条规则做好前期的规划，会比蒙头上来直接干要好的多。

<br />

### Agentic Engineering

整体上看，可能和长期担任 Manager 有关，Addy 的很多 Blog 都有管理者的角度，即**如何稳健的协调多个 AI Agent 去完成严肃的开发工作**。

比如说最近的一篇文章[《Agentic Engineering》](https://addyosmani.com/blog/agentic-engineering/)，他就认为 「vibe coding」 这个词过于泛化了，在一些不重要的场景（比如说 MVP 原型设计，个人脚本和一次性工具等）用 vibe coding 这个词没啥问题，但是如果用在真实的线上项目上，很明显会给其它组员和管理者带来歧义。

那么破解的方法是什么呢？其实还是几十年来积累的软件工程开发经验：从开发规范，到合码流程，再到最后的测试和交付，都要有严格的工程定义和划分，中间的实施操作可以交给 AI 来做，但是**你得为最终的交付负责**。这一点其实和 1979 年也没什么不一样：

![IBM Slide](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/addy-osmani-ai-blog-ibm.png)

<br />

当然这套严肃的工程方案用轻佻的 [vibe coding](https://x.com/karpathy/status/1886192184808149383) 描述就不合适了，应该叫 [agentic engineering](https://x.com/karpathy/status/2019137879310836075)（智能体工程）。

![vibe - agentic](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/addy-osmani-ai-blog-agentic.jpg)

相信大家也或多或少遇到过类似的场景，如果把所有的工作都交给 AI，自己只在输入框里写需求，不做任何工程学上的约束，迭代多轮后熵增爆炸的代码其实 AI 也改不动了，更不用说其它接手维护的人，最后只会透支项目的生命力。只有在工程的约束下，才能持续的保证 AI 编程的速度稳定，而不是到某个节点迭代速度开始断崖式下跌。

<br />

### AI with DX

除了一些具体的细节，我个人感觉他画的一张研发体系图也很不错，描述了 AI 可以影响到传统开发流程中的哪些环节，会对 DX 有什么样的影响。这个图是他写的一本书[《Beyond Vibe Coding》](https://beyond.addy.ie/)里的（不过这本书 AI 辅助编写内容比较多，感兴趣的人过一遍即可，个人认为不需要细看）。

首先他画了一个「前 AI 时代」的研发流程图：

![addy-osmani-ai-blog-dx-before-ai](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/addy-osmani-ai-blog-dx-before-ai.svg)

如上图所示，在传统的软件开发流程里，其实是多个 Loop 嵌套完成的：

- 最左侧的 Design Loop，主要讲正式 Coding 前的一些准备工作，比如说方案调研，架构设计，流程拆解等
- 中间的 Inner Loop，就是指之前一个单词一个单词的编码环节，这个也是大部分程序做的事情
- Submit Loop 就是每次提交 MR 的流程，包含 Lint，Code Review 等环节
- Outer Loop 就是产品纬度的大功能迭代流程，之前的 CICD 主要优化的就是这个环节

<br />

上面的传统流程，在 Coding Agent 介入后，各个流程和节点上都有不同程度的加速，改变如下：

![addy-osmani-ai-blog-dx-after-ai](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/addy-osmani-ai-blog-dx-after-ai.svg)

- 首先在 Design Loop 里，Design 环节有一些 ChatBot 的介入，DeepResearch 等功能会加速很多调研的时间投入，Plan 一定程度上也被类似 Claude Code 的 Plan 功能做了替代
- Inner Loop，基本上已经被 Coding Agent **全方位替代**，市面上太多编程产品做这个了
- Submit Loop 中的 Code Review 环节其实也有各种 Agent 做审核，这个其实也有很成熟的产品了
- Outer Loop 里，每次发布后的资源利用率，性能防劣化等场景，其实也可以让 AI 做繁复工作的整合

从上面的变化可以很清楚的看出，只有「Thinking」这个步骤暂时未被替代，其它环节要不被规范的 CICD 流程加速，要不被 Coding Agent 加速。其实这个「Thinking」的环节，不就是 Manager（Agentic Engineering）做的吗？当然也可以极端点儿，现在我们还是需要有个真实的人类为最终结果负责（bei guo）。

## 总结

上面说的几个观点，只是我对 Addy 最近的几篇 Blog 感触比较深的地方。我个人还是推荐开发者亲自读读他最近的 Blog，相信不同的人可以获得不同的感悟。

总而言之，无论有没有 AI，在工程角度上构建一套稳健的可复用的系统，在可以在保证质量的同时提高整体的交付效率，这个在任何商业场景都是极具诱惑力的。就如本文标题所说，**形势比人强**，大家还是做好准备，一起经历这场 AI 革命吧。

