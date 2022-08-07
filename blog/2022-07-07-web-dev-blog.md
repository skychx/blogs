---
slug: web-dev-blog
title: 🗂 对 web.dev 所有 blog 的整理与归档
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 对 web.dev 所有的 blog 进行了整理和归档，方便后续回顾与总结
draft: false
date: 2022-08-06
tags: [性能优化]
---

![web_dev_hero_image](https://image-1255652541.file.myqcloud.com/uPic/web_dev_hero_image.jpg)

:::info 更新提示
文章已于 2022-08-06 更新
:::

最近在做 web 性能优化的工作，所以想集中学习了解一下相关的专题内容。这部分内容肯定要学习一手信息，所以找先找了 [https://web.dev/](https://web.dev/)，一个 Google 官方推出的一个面向 Web 开发者的网站，里面有非常多的教程和最佳实践，非常适合有性能优化诉求的开发者去浏览和学习。



网站的核心部分分为 4 类：

- [Learn](https://web.dev/learn/)：体系化的教程，例如性能优化和 PWA
- [Measure](https://web.dev/measure/)：就是一个在线版本的 Lighthouse，和 Chrome DevTools 的 Performance 功能一致
- [Case Study](https://web.dev/tags/case-study/)：优化案例（商业互吹），内容一般为采用 X 优化带来数据 Y 的提升最终带来 Z 的商业增长
- [Blog](https://web.dev/blog/)：内容较杂，优化教程/API 解读/优化案例等等都有涉及



从上面的结构可以看出，**Lean/Measure/CaseStudy** 这三个章节内容都是比较体系化的，但是 Blog 内容却没有一个很好的分类。以我的阅读经验，Blog 里有一些非常好的文章，所以我很好奇 Blog 章节里有多少好东西可供挖掘，于是上个月的时候花了一些时间，**把所有的 Blog 读了一遍**，并以自己的认知对内容做了分析和总结，以便自己后续回顾与搜索。



<!--truncate-->



## 内容分类：

截止到文章更新时间为止（2022-8-6），web.dev 一共发布了 639 篇 blog，从 blog 的内容和发布时间可以很明显的看出 google 官方的发力（营销）方向，比如说前几年在推 [PWA](https://web.dev/progressive-web-apps/)，这两年在推 [Web Vitals](https://web.dev/learn-web-vitals/)。纵观下来，Blog 的内容可以分为以下几类

- **性能指标**：例如 Web Vitals，FMP，TTI 这些概念和相对应的优化策略
- **优化策略**：例如对网络的优化，对图片/字体/CSS/JS 的优化
- **UI/UX**：这部分内容偏向于实战和设计，最终会产出一些 UI Component
- **Web 特性**：例如 Web Worker，WebXR，Wasm 等功能的介绍和教程
- **提案/API**：主要是对一些提案的实现和现代浏览器 API 的介绍，内容偏向于文档，对开发者来说距离较远
- **商业案例**：其实就是 [Case Study](https://web.dev/tags/case-study/) 章节的内容，只不过这部分内容也收录在 Blog 里



### 1.性能指标

| 种类               | 篇数 | 时间跨度           |
| ------------------ | ---- | ------------------ |
| 性能指标/优化/监控 | 34   | 主要为 2018 - 2022 |

性能指标绝对是 Google/Chrome 这两年首推的内容了，从 2018 年到 2022，4 年的时间里就推出了 34 篇文章，最近两年的商业案例也基本都是「优化 Web Vitals 指标带来商业收益的」的套路。文章整体的质量都不错，从原因到解决方案到具体用例都有涉及。



### 2.优化策略

| 种类       | 篇数 | 时间跨度                              |
| ---------- | ---- | ------------------------------------- |
| 网络优化   | 47   | 主要为 2018 - 2022                    |
| 渲染       | 28   | 主要为 2013 - 2015，2018 做了相关修订 |
| 图片优化   | 13   | 主要为 2019                           |
| JS/JS 框架 | 15   | 主要为 2020 - 2021                    |
| font       | 8    | 2020 - 2021                           |

从文章比例上就可以看出，Web 非常关注网络资源的优化，这是 Web 的优点也是 Web 的痛点，JS 运行的再快也扛不住一次网络异常，所以网络优化的内容非常多。

渲染优化的文章主要集中到 13-15 年，最近几年很少说了，这个和历史发展潮流也差不多，13-15 年属于移动互联网高速发展时期，Native 开发还是如日中天，Web 在渲染性能上确实不如 Native，现如今随着内核的发展以及终端机性能的提升，渲染基本上已经不是性能瓶颈了，而且浏览器渲染模块对于 Web 开发者来说也很难去介入，所以内容较少也在情理之中。

JS 优化内容也比较少，一是对于大部分场景来说开发者还没有到优化 JS 解决性能瓶颈，二是很多 JS 优化的内容都搬到 [https://v8.dev/blog](https://v8.dev/blog) 了，所以只有几篇早期的文章；JS 框架层的优化最近有一些，例如和 nextjs，react 的合作之类的。

图片视频字体的优化都属于资源优化，内容也不错，可以一起看看单项突破。





### 3.UI/UX

| 种类             | 篇数 | 时间跨度           |
| ---------------- | ---- | ------------------ |
| CSS新特性/新属性 | 28   | 主要为 2019 - 2020 |
| UI 组件/设计     | 13   | 主要为 2021        |
| 交互             | 15   | 2019 - 2021        |

CSS 主要介绍的是一些 CSS新特性新属性，还有一些关于 CSS 的使用/优化文章。

UI 是最近有些 blog 写了些 UI 组件，感觉内容也可以学习一下。UX 内容就比较杂了，涉及到交互效果，可访问性等内容，相对来说这个分类里跨学科内容多一些。





### 4.Web 特性

| 种类                      | 篇数 | 时间跨度           |
| ------------------------- | ---- | ------------------ |
| Web Worker/Service Worker | 22   | 主要为 2020        |
| PWA                       | 16   | 主要为 2019 - 2020 |
| 浏览器                    | 18   | 2018-2021          |
| 安全                      | 10   | 主要为 2020 - 2021 |
| WebGL/WebGPU              | 6    | 2012               |
| WebXR                     | 10   | 2017、2020         |
| Wasm                      | 8    | 2018 - 2021        |
| Web Component             | 13   | 2016、2017         |

PWA 在前几年 Google 一直在推，但在国内其实一直不温不火的，大公司都有自己的 Hybrid H5 方案，小公司基本都去做小程序开发了；国外看似好一些，但做的最好的 twitter PWA，但我深度体验一年后，发现和 Native 应用比差距还是很大，这已经算全世界做的最好的 PWA APP 了，由此可见 PWA 推广道路之艰辛。不过 PWA 还是有很多值得学习参考的知识点的，还是有必要学习一下的。

Web Worker/Service Worker 加起来也有 22 篇文章，Web Worker 主要用来分散主线程的计算任务，Service Worker 主要起 Web Network 拦截器的作用（从效果上其实也可以归类到网络性能优化里），内容也是值得学习的。

浏览器分类主要是一些我不知道怎么分类的浏览器特性，比如说 BFCache，Web 存储方案介绍等等，内容相对较杂。



剩下的内容其实都比较散：

- WebGL/WebGPU 的内容不多，而且成文时间也很早，而且 Web 3D 虽然依托于浏览器平台，但实际上和传统的 Web 开发完全是两回事，所以内容少也可以理解
- WebXR 内容也很少，主要还是功能介绍
- Wasm 内容也较少，主要是入门教程
- 安全领域主要是对一些安全特性/安全 API 做的介绍
- Web Component 有几篇很不错的系列教程可以当入门文章看

其实这些功能都属于叫好不叫座的状态，它们都大大提高了 Web 的上限，但是现实是没有几家公司需要突破传统 Web 的上限，大家其实都遵循一个原则——**能跑就行**。



### 5.提案/API

| 种类                   | 篇数 | 时间跨度         |
| ---------------------- | ---- | ---------------- |
| 提案/实验性功能/新 API | 42   | 主要为 2019-2022 |

这部分内容对于普通开发者来说其实不是很必要。一是提案/实验性功能/新 API都比较新，有兼容性问题，一般很难在项目中落地；二是在现实场景里，基本上很少有需求需要用到 Web 的 File API/Bluetooth API 等功能，一般这些场景都是遇到再看，所以这部分内容其实只要知道有就可以，要用到再看细节也不迟。





## Blog 链接

这部分内容是整理出的 Blog 内容，我对其标注了发布时间和文件标题，并对一些内容做了简评，方便后续搜索和查看。

### Web Vitals

- 2022-5-16: [How do modern frameworks perform on the new INP metric](https://web.dev/inp-in-frameworks/#how-are-aurora-and-frameworks-addressing-inp-issues)
- 2022-5-11: [How SPA architectures affect Core Web Vitals](https://web.dev/vitals-spa-faq/)
- 2022-1-18: [Core Web Vitals workflows with Google tools](https://web.dev/i18n/en/vitals-tools/) 介绍了可以测量 Core Web Vitals 的一些通用工具
- 2021-8-17: [Why lab and field data can be different (and what to do about it)](https://web.dev/lab-and-field-data-differences/)
  - 介绍了 实验室数据和用户统计数据 两者的不同，以及产生这些不同的可能原因
- 2021-6-21: [Towards a better responsiveness metric](https://web.dev/better-responsiveness-metric/)，对 FID 指标的探索
- 2021-6-2: [CSS for Web Vitals](https://web.dev/i18n/en/css-web-vitals/)，利用 CSS 优化 Web Vitals
- 2021-6-2: [Evolving Cumulative Layout Shift in web tooling](https://web.dev/cls-web-tooling/)，CLS 在 web 性能工具里的发展
- 2021-5-19: [Techniques to make a web app load fast, even on a feature phone](https://web.dev/load-faster-like-proxx/)，里面的性能优化流程挺不错的，每一步优化都有数据
- 2021-5-11: [Optimizing Web Vitals using Lighthouse](https://web.dev/optimize-vitals-lighthouse/)，Lighthouse 对 Web Vitals 指标的检测和优化建议
- 2021-5-11: [Debug layout shifts](https://web.dev/debug-layout-shifts/)，layout shifts 引起的原因以及如何识别、测量和修复
- 2021-5-9: [How CLS optimizations increased Yahoo! JAPAN News's page views per session by 15%](https://web.dev/yahoo-japan-news/)
  - 2021-5-9: [Aspect Ratio Boxes](https://css-tricks.com/aspect-ratio-boxes/)，一个保持长宽比的盒子
- 2021-4-7: [Evolving the CLS metric](https://web.dev/evolving-cls/)，CLS 指标的测量细节
- 2021-4-1: [Debug Web Vitals in the field](https://web.dev/debug-web-vitals-in-the-field/)，讲如何测量 Web Vitals 指标
- 2021-1-25: [Feedback wanted: The road to a better layout shift metric for long-lived pages](https://web.dev/better-layout-shift-metric/)，对 CLS 指标的探索
- 2020-8-20: [Optimize Largest Contentful Paint](https://web.dev/i18n/en/optimize-lcp/)
- 2020-8-17: [Optimize Cumulative Layout Shift](https://web.dev/i18n/en/optimize-cls/)
- 2020-7-17: [Relating site speed and business metrics](https://web.dev/site-speed-and-business-metrics/)，性能测试方法论
- 2020-5-28: [Tools to measure Core Web Vitals](https://web.dev/vitals-tools-2020/)
- 2020-5-27: [Getting started with measuring Web Vitals](https://web.dev/i18n/en/vitals-measurement-getting-started/)
- 2020-5-27: [Defining the Core Web Vitals metrics thresholds](https://web.dev/i18n/en/defining-core-web-vitals-thresholds/)
- 2020-5-20: [Optimize First Input Delay](https://web.dev/i18n/en/optimize-fid/)
- 2020-5-19: [What's New in Lighthouse 6.0](https://web.dev/lighthouse-whats-new-6.0/)
- 2020-5-11: [Best practices for measuring Web Vitals in the field](https://web.dev/i18n/en/vitals-field-measurement-best-practices/)
- 2020-1-8: [Advancing the web framework ecosystem](https://web.dev/advancing-framework-ecosystem-cds-2019/)，讲了一些框架在性能上的探索
- 2019-12-16: [Speed tooling evolutions: highlights from Chrome Developer Summit 2019](https://web.dev/speed-tooling-evolutions-cds-2019/)，新的 LCP/CLS 指标的提出
- 2019-12-16: [Lighthouse evolution: continuous integration, new performance score formula, and more](https://web.dev/lighthouse-evolution-cds-2019/)
- 2019-9-30: [Fixing layout instability](https://web.dev/fixing-layout-instability/)，修复布局偏移
  - https://www.npmjs.com/package/source-map-explorer
- 2019-5-31: [What should you measure to improve performance?](https://web.dev/what-should-you-measure-to-improve-performance/)
- 2019-5-29: [Are long JavaScript tasks delaying your Time to Interactive?](https://web.dev/i18n/en/long-tasks-devtools/)，TTI 的优化，要把大于 50ms 的长任务进行分块处理
  - [https://philipwalton.com/articles/idle-until-urgent/](https://philipwalton.com/articles/idle-until-urgent/)，对长任务的分解
- 2019-5-24: [Speed at scale: what's new in web performance?](https://web.dev/speed-at-scale/)
- 2019-5-5: [How to report metrics and build a performance culture](https://web.dev/how-to-report-metrics/)
- 2018-8-21: [Web Performance Made Easy - Google I/O 2018 edition](https://web.dev/web-performance-made-easy/)，网站优化指南
  - https://github.com/aFarkas/lazysizes#readme
- 2018-8-17: [How To Think About Speed Tools](https://web.dev/speed-tools/)，介绍了一些对性能的误解，还有一些性能统计工具
- 2014-1-21: [User timing API](https://web.dev/usertiming/)，Timing API 的使用



### 网络

- 2022-7-25: [How the BBC is rolling out HSTS for better security and performance.](https://web.dev/bbc-hsts/)，利用 HSLS 完成浏览器内的 HTTP to HTTPS 重定向跳转，性能更好安全更好
- 2022-3-8: [Optimizing resource loading with Priority Hints](https://web.dev/priority-hints/)
  - `fetchpriority` 属性的运用，用来修改资源加载优先级，Chrome101 可用
  - 这里面有资源加载优先级的表格和说明：https://docs.google.com/document/d/1bCDuq9H1ih9iNjgzyAL0gpwNFiEP4TZS-YLRp_RuMlc/edit#heading=h.ua1godj1atee
  - [Preload](https://web.dev/uses-rel-preload/)，Chrome 50，iOS 11.3
  - [Preconnect](https://web.dev/uses-rel-preconnect/)，Chrome 46，iOS 11.3
  - dns-prefetch：Chrome 4
  - https://wicg.github.io/priority-hints/
  - https://addyosmani.com/blog/script-priorities/
- 2022-2-24: [Optimizing third-party script loading in Next.js](https://web.dev/script-component/)
- 2022-2-7: [Improve security and privacy by updating HTTP Cache](https://web.dev/http-cache-security/)
- 2021-10-14: [Referrer](https://web.dev/i18n/en/referrer-best-practices/)，跨域安全内容，内含 strict-origin-when-cross-origin 介绍
- 2021-10-8: [Assessing loading performance in the field with Navigation Timing and Resource Timing](https://web.dev/navigation-and-resource-timing/)，统计资源请求的流程和时间
- 2021-10-5: [Best practices for using third-party embeds](https://web.dev/embed-best-practices/)
  - 第三方嵌入的内容（地图/视频/图片等）优化方案：延迟加载/图片占位图/交互时再加载
  - https://web.dev/third-party-facades/
- 2021-9-29: [Using WebTransport](https://web.dev/i18n/en/webtransport/)，一种新的网络传输方式
- 2021-9-22: [Streaming requests with the fetch API](https://web.dev/i18n/en/fetch-upload-streaming/)，可以在 fetch stream 的时候在结束前处理结果
- 2021-9-10: [Improving user privacy and developer experience with User-Agent Client Hints](https://web.dev/i18n/en/user-agent-client-hints/)，新的 HTTP User-Agent
- 2021-6-15: [The performance effects of too much lazy-loading](https://web.dev/lcp-lazy-loading/)
  - 对懒加载的调研，发现 wordpress 一个不合理的优化：他们的懒加载会把首屏的图片也懒加载了，这样会劣化 LCP
- 2022-6-14: [Security headers quick reference](https://web.dev/security-headers/)，跨域安全相关的 HTTP Header
- 2021-4-22: [Keeping third-party scripts under control](https://web.dev/controlling-third-party-scripts/)，对第三方网站的治理流程
- 2021-2-1: [Requesting performance isolation with the Origin-Agent-Cluster header](https://web.dev/origin-agent-cluster/)，新的 HTTP 头
- 2021-1-25: [When to use HTTPS for local development](https://web.dev/when-to-use-local-https/)，什么时候要用到本地 HTTPS 开发调试
- 2021-1-25: [How to use HTTPS for local development](https://web.dev/i18n/en/how-to-use-local-https/)
- 2020-12-16: [Publish, ship, and install modern JavaScript for faster applications](https://web.dev/publish-modern-javascript/)
  - https://estimator.dev/: 计算网站在采用现代 JavaScript 语法后可实现的尺寸和性能改进
  - 网站 JS 代码膨胀的原因：转换现代语法到传统语法，体积膨胀 20%；polyfill lib helpers 函数带来的体积膨胀
  - 介绍了 package.json/webpack/Rollup/babel 的配置参数
- 2020-12-11: [Love your cache ❤️](https://web.dev/love-your-cache/)，简单的介绍了 HTTP 缓存
- 2020-11-20: 对 Same-Site 的介绍
  - 1. [SameSite cookies explained](https://web.dev/i18n/en/samesite-cookies-explained/)
  - 2. [SameSite cookie recipes](https://web.dev/samesite-cookie-recipes/)
  - 3. [Schemeful Same-Site](https://web.dev/schemeful-samesite/)
- [Feedback wanted: CORS for private networks (RFC1918)](https://web.dev/cors-rfc1918-feedback/)
- 2020-10-28: [Measuring offline usage](https://web.dev/measuring-offline-usage/)
- 2020-9-22: [Content delivery networks (CDNs)](https://web.dev/content-delivery-networks/)，对 CDN 的介绍
- 2020-6-17: [Improving page dismissal in synchronous XMLHttpRequest()](https://web.dev/disallow-synchronous-xhr/)，网络保活方案
- 2022-6-9: [Signed Exchanges (SXGs)](https://web.dev/signed-exchanges/)，加速 HTTPS 连接改善 FCP
- 2020-5-31: [Fix an overloaded server](https://web.dev/overloaded-server/)，服务器网络优化策略
- 2020-5-11: [How to set up Signed HTTP Exchanges (SXG) using nginx](https://web.dev/how-to-set-up-signed-http-exchanges/)
- 2020-5-11: [How to distribute Signed HTTP Exchanges (SXG) using nginx](https://web.dev/how-to-distribute-signed-http-exchanges/)
- 2020-5-5: [How Google improved ads performance with stale-while-revalidate](https://web.dev/ads-case-study-stale-while-revalidate/)
- 2020-4-29: [Improved Next.js and Gatsby page load performance with granular chunking](https://web.dev/granular-chunking-nextjs/)
  - 2018-12-6: [HTTP/2 Prioritization](https://calendar.perfplanet.com/2018/http2-prioritization/)
- 2019-12-16: [Adaptive loading: improving web performance on slow devices](https://web.dev/adaptive-loading-cds-2019/)，根据网络情况自适应加载资源
- 2019-9-12: [Prefetch resources to speed up future navigations](https://web.dev/link-prefetch/)，Prefetch 的一些运用，用来优化导航性能
  - [A Netflix Web Performance Case Study](https://medium.com/dev-channel/a-netflix-web-performance-case-study-c0bcde26a9d9)
  - https://github.com/GoogleChromeLabs/quicklink
- 2019-7-30: [Establish network connections early to improve perceived page speed](https://web.dev/preconnect-and-dns-prefetch/)，preconnect 和 dns-prefetch 的运用
  - https://www.igvita.com/posa/high-performance-networking-in-google-chrome/
- 2019-7-18: [Keeping things fresh with stale-while-revalidate](https://web.dev/i18n/en/stale-while-revalidate/)，`stale-while-revalidate` 的介绍
- 2019-7-8: [Faster web navigation with predictive prefetching](https://web.dev/predictive-prefetching/)，一个用来集成到 webpack 等配置里的 prefetch 框架，但是需要集成 google 分析等数据用来分析高频页面的交互数据，里面还有机器学习模型进行预测
  - https://github.com/guess-js
  - https://guess-js.github.io/docs
  - http://instantclick.io/
- 2019-6-6: [Sending messages with web push libraries](https://web.dev/sending-messages-with-web-push-libraries/)，对 Web Push 的介绍
- 2018-8-17: [Decrease front-end size](https://web.dev/decrease-frontend-size/)，webpack 的一些优化项
- 2015-5-27: [Enabling HTTPS on Your Servers](https://web.dev/enabling-https-on-your-servers/)，如何在服务器上开启 HTTPS
- 2020-5-25: [WebSocketStream: integrating streams with the WebSocket API](https://web.dev/i18n/en/websocketstream/)
- 2020-2-19: [How to set up Signed Exchanges using Web Packager](https://web.dev/signed-exchanges-webpackager/)
- 2015-3-27: [Important Security Terminology](https://web.dev/intro-to-security-terminology/)，对 HTTPS 的介绍
- [https://www.susielu.com/data-viz/bundle-buddy](https://www.susielu.com/data-viz/bundle-buddy)，chunk 拆包的介绍
- 2013-6-5: [Deep dive into the murky waters of script loading](https://web.dev/speed-script-loading/)，浏览器如何加载资源
  - 标准：https://html.spec.whatwg.org/multipage/scripting.html#script
  - https://hacks.mozilla.org/2009/06/defer/
  - 动态创建并添加到 HTML 中的脚本默认是 async 的，所以时序无法保证
- 2012-10-20: [Introducing WebSockets - Bringing Sockets to the Web](https://web.dev/workers-basics/)


### 渲染

- 2022-4-11: [Bringing instant page-loads to the browser through speculative prerendering](https://web.dev/speculative-prerendering/)
  - 只有 Chrome 支持
- 2019-8-27: [Rendering on the Web](https://web.dev/rendering-on-the-web/)
  - 介绍了 CSR/NSR/Rehydration/Prerendering 等方案，里面有个非常经典的图
- 2011-10-21: [Avoiding Unnecessary Paints - Animated GIF Edition](https://web.dev/speed-animated-gifs/)
- 2011-8-16: [Improving HTML5 Canvas performance](https://web.dev/canvas-performance/)，canvas 性能优化
- 2011-6-3: [HTML5 techniques for optimizing mobile performance](https://web.dev/mobile-optimization-and-performance/)，文章比较老了

下面的文章其实都是 15 年写的，18 年修订的：https://web.dev/authors/paullewis/

- 2015-5-20: [Stick to Compositor-Only Properties and Manage Layer Count](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)，利用合成器属性、管理视图图层（layer）
- 2015-5-20: [Simplify paint complexity and reduce paint areas](https://web.dev/simplify-paint-complexity-and-reduce-paint-areas/)，减少 Paint 操作带来的影响
- 2015-5-20: [Rendering Performance](https://web.dev/rendering-performance/)，改进渲染性能
  - [udacity 浏览器渲染性能优化免费课程](https://www.udacity.com/course/browser-rendering-optimization--ud860)
- 2015-5-20: [Reduce the scope and complexity of style calculations](https://web.dev/reduce-the-scope-and-complexity-of-style-calculations/)，减少样式计算的范围和复杂性
- 2015-5-20: [Optimize JavaScript execution](https://web.dev/optimize-javascript-execution/)，优化 JS 执行性能
- 2015-5-20: [Debounce your input handlers](https://web.dev/debounce-your-input-handlers/)
- 2015-5-20: [Avoid large, complex layouts and layout thrashing](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)，避免布局抖动
- 2014-8-8: [The Basics of easing](https://web.dev/the-basics-of-easing/)，动画曲线
- 2014-8-8: [Custom easing](https://web.dev/custom-easing/)，动画曲线
- 2014-8-8: [Choosing the right easing](https://web.dev/choosing-the-right-easing/)，动画时间
- 2014-8-8: [Asymmetric animation timing](https://web.dev/asymmetric-animation-timing/)，动画时间的选择
- 2014-8-8: [Animations and performance](https://web.dev/animations-and-performance/)，动画性能，will-change属性
- 2014-8-8: [CSS versus JavaScript animations](https://web.dev/css-vs-javascript/)，CSS 动画与 JS 动画
- 2013-6-28: [Antialiasing 101](https://web.dev/antialiasing-101/)，抗锯齿
- 2013-5-8: [Avoiding unnecessary paints](https://web.dev/speed-unnecessary-paints/)，避免没必要的 paint
- 2013-4-12: [CSS paint times and page render weight](https://web.dev/css-paint-times/)，CSS 不同属性不同组合对渲染性能的影响
- 2013-5-11: [Accelerated Rendering in Chrome](https://web.dev/speed-layers/)，chrome 中的加速渲染
- 2012-11-2: [Jank busting for better rendering performance](https://web.dev/speed-rendering/)
- 2012-12-20: [Scrolling performance](https://web.dev/speed-scrolling/)，滚动性能
- 2012-11-2: [Jank busting for better rendering performance](https://web.dev/speed-rendering/)，更好的滚动性能
- 2011-10-21: [Avoiding Unnecessary Paints - Animated GIF Edition](https://web.dev/speed-animated-gifs/)
- 2011-8-5: [How browsers work](https://web.dev/howbrowserswork/)：浏览器如何运行的，文章比较老了


### 图片

- [https://images.tooling.report/](https://images.tooling.report/)，查询各个 SaaS 服务对图片的优化
- [Building an adaptive favicon](https://web.dev/building-an-adaptive-favicon/)，用 svg 代替 ico 图标
- [Building an effective Image Component](https://web.dev/image-component/)，利用一个 image 组件优化图片大小/宽高/优先级
- 2021-6-7: [Using AVIF to compress images on your site](https://web.dev/compress-images-avif/)，介绍了 AVIF 图片格式
 - 2020-2-14: [AVIF for Next-Generation Image Coding](https://netflixtechblog.com/avif-for-next-generation-image-coding-b1d75675fe4)，Netflix 使用 AVIF 带来的图片优化
- 2019-11-22: [Feedback from the summer 2019 image optimization survey](https://web.dev/image-optimization-survey-2019/)
  - LQIP：https://www.guypo.com/introducing-lqip-low-quality-image-placeholders
- 2019-9-30: [Preloading responsive images](https://web.dev/preload-responsive-images/)，响应式图片 + Preload
- 2019-9-23: [Optimize images with Thumbor](https://web.dev/use-thumbor/)，压缩图片的cdn，主要介绍了配置
- 2019-9-3: [Going beyond images with basic video for the web](https://web.dev/video-basics/)
- 2019-6-24: [Top tips for web performance](https://web.dev/use-srcset-to-automatically-choose-the-right-image/)，图片尺寸优化，主要是利用浏览器属性
- 2019-5-31: [Image policies for fast load times and more](https://web.dev/image-policies/)，浏览器对图片优化做的一些 API
- 2014-5-28: [Easy high DPI images](https://web.dev/easy-high-dpi-images/)
- 2014-8-29: [Responsive images](https://web.dev/responsive-images/)，早期的图片优化方案
- 2012-10-15: [Splash vector graphics on your responsive site](https://web.dev/svg-mobile-fundamentals/)



### 字体

- 2022-1-19: [Introduction to variable fonts on the web](https://web.dev/variable-fonts/)，可变字体，一个字体文件可用动态切换多个字重（旧的字体需要多个字体文件）
- 2021-7-30: [Use advanced typography with local fonts](https://web.dev/local-fonts/)，直接访问本地字体。因为用户安装的本地字体容易被黑客利用获取用户隐私，所以只允许访问白名单和操作系统内置的字体
  - Web 安全字体：https://developer.mozilla.org/zh-CN/docs/Learn/CSS/Styling_text/Fundamentals#Web_safe_fonts
  - 安全字体表（Win & Mac）：https://www.cssfontstack.com/
  - 浏览器指纹：http://www-sop.inria.fr/members/Nataliia.Bielova/papers/Lape-etal-20-TWEB.pdf
- 2021-6-9: [CSS size-adjust for @font-face](https://web.dev/css-size-adjust/)，新的 css 属性，防止字体切换的时候带来布局变动从而劣化 CLS 指标
- 2021-6-3: [Best practices for fonts](https://web.dev/font-best-practices/)
  - 内联字体声明（而不是内联字体本身）
  - preconnect + preload
  - 字体裁剪 + 可变字体
  - [font-display](https://caniuse.com/?search=font-display) 的使用
- 2020-7-3: [Optimize WebFont loading and rendering](https://web.dev/optimize-webfont-loading)
  - 介绍了浏览器加载字体的默认行为，并说明了一些字体属性的运用
- 2020-5-26: [More variable font options for the macOS system-ui font in Chromium 83](https://web.dev/more-variable-font-options-in-chromium-83/)，可变字体控制
- 2020-5-18: [Prevent layout shifting and flashes of invisible text (FOIT) by preloading optional fonts](https://web.dev/i18n/en/preload-optional-fonts/)，介绍了 font-display: optional 在 chrome83 的改动，由原来的布局抖动模式变成加载前 或 100ms 前白屏显示了
  - 2018-4-23: [通过预加载 web 字体提高加载速度](https://web.dev/codelab-preload-web-fonts/)
  - [https://font-display.glitch.me/](https://font-display.glitch.me/)：介绍了 font-display 的行为模式
  - https://css-tricks.com/font-display-masses/



### JS/框架

- 2022-5-18: [Perform efficient per-video-frame operations on video with requestVideoFrameCallback()](https://web.dev/requestvideoframecallback-rvfc/)
- 2021-6-28: [Resource inlining in JavaScript frameworks](https://web.dev/aurora-resource-inlining/)
  - 内联首屏/关键 css，减少一次网络请求
  - 内联字体声明
- 2021-6-7: [Observing compute pressure](https://web.dev/compute-pressure/)，测量 CPU 数据的 API
- 2021-5-8: [JavaScript: What is the meaning of this?](https://web.dev/i18n/en/javascript-this/)，对 JS 中 this 的介绍
- 2021-2-25: [Streams—The definitive guide](https://web.dev/streams/)，对浏览器中的 Streams API 的介绍
- 2020-9-29: [Detached window memory leaks](https://web.dev/detached-window-memory-leaks/)，内存泄漏检测
- 2020-8-20: [Choose the best build tool for your project with tooling.report](https://web.dev/introducing-tooling-report/)
  - [https://bundlers.tooling.report/](https://bundlers.tooling.report/)，用来对比不同构建工具的特点/优点/缺点
- 2020-5-26: [How CommonJS is making your bundles larger](https://web.dev/i18n/en/commonjs-larger-bundles/)。tree-shaking 的运用
  - [The Cost Of JavaScript In 2018](https://medium.com/@addyosmani/the-cost-of-javascript-in-2018-7d8950fbb5d4)
  - [The cost of JavaScript in 2019 · V8](https://v8.dev/blog/cost-of-javascript-2019)，有 JS bundle 大小的测量和考据
- 2020-4-29: [Improved Next.js and Gatsby page load performance with granular chunking](https://web.dev/granular-chunking-nextjs/)，通过分包提高性能
- 2019-4-29: [Virtualize large lists with react-window](https://web.dev/i18n/en/virtualize-long-lists-react-window/)，虚拟滚动列表
- 2019-8-13: [Third-party JavaScript performance](https://web.dev/third-party-javascript/)
- 2018-10-10: [Async functions - making promises friendly](https://web.dev/javascript-async-functions/)，介绍 async function
- 2013-6-21: [Static memory javascript with Object Pools](https://web.dev/speed-static-mem-pools/)，JS 对象池
- 2013-6-13: [Use forensics and detective work to solve JavaScript performance mysteries](https://web.dev/performance-mystery/)，JS 性能问题的排查，使用了 V8 做调试
- 2012-10-11: [Performance tips for JavaScript in V8](https://web.dev/speed-v8/)，文章较老，但内容也有参考价值



### CSS

- 2022-8-2: [Finer grained control over CSS transforms with individual transform properties](https://web.dev/css-individual-transform-properties/)，拆分设置 transform 属性
- 2022-5-11: [Bridging the gap](https://web.dev/bridging-the-gap/)，Grid 布局
- 2021-10-19: [Improved dark mode default styling with the color-scheme CSS property and the corresponding meta tag](https://web.dev/i18n/en/color-scheme/)
- 2021-8-17: [Using CSS Module Scripts to import stylesheets](https://web.dev/css-module-scripts/)，Chrome 93 可用
- 2021-6-9: [Building a color scheme](https://web.dev/building-a-color-scheme/)，通过 hsl() 和 calc() 构建可动态计算的颜色主题
- 2021-5-27: [New CSS functional pseudo-class selectors :is() and :where()](https://web.dev/css-is-and-where/)
- 2021-5-22: Compat 2021: [Eliminating five top compatibility pain points on the web](https://web.dev/compat2021/)，CSS flex/grid/sticky/aspect-ratio/transform 兼容性
- 2021-5-9: [content-visibility: the new CSS property that boosts your rendering performance](https://web.dev/content-visibility/)
- 2021-1-28: [New aspect-ratio CSS property supported in Chromium, Safari Technology Preview, and Firefox Nightly](https://web.dev/aspect-ratio/)，新的 css 属性 aspect-ratio，用来替换 padding-top hack，只有 Chrome88 以上和 iOS15 支持
- 2020-12-16: [Centering in CSS](https://web.dev/centering-in-css/)，介绍了几种 CSS 居中对齐的方案
- 2020-12-10: [Cross-browser paint worklets and Houdini.how](https://web.dev/houdini-how/)，介绍了 Houdini 这种新方案
- 2020-10-14: [min(), max(), and clamp(): three logical CSS functions to use today](https://web.dev/min-max-clamp/)
- 2020-9-14: [Apply effects to images with CSS's mask-image property](https://web.dev/css-masking/)
- 2020-9-14: [Create interesting image shapes with CSS's clip-path property](https://web.dev/css-clipping/)
- 2020-9-2: [Custom bullets with CSS ::marker](https://web.dev/css-marker-pseudo-element/)，修改 li 标签前面的小圆点样式
- 2020-7-21: [@property: giving superpowers to CSS variables](https://web.dev/at-property/)，CSS Houdini 相关的 API
- 2020-7-7: [Ten modern layouts in one line of CSS](https://web.dev/i18n/en/one-line-layouts/)
- 2020-7-7: [Pixel-perfect rendering with devicePixelContentBox](https://web.dev/device-pixel-content-box/)，像素相关的 API
- 2020-5-27: [Web Animations API improvements in Chromium 84](https://web.dev/web-animations/)
- 2020-9-24: [Next-generation web styling](https://web.dev/next-gen-css-2019/)
- 2020-8-2: [prefers-color-scheme: Hello darkness, my old friend](https://web.dev/prefers-color-scheme/)，如何在网页上开启暗黑模式以及相关要注意的点
- 2019-9-19: [Smarter custom properties with Houdini’s new API](https://web.dev/css-props-and-vals/)
- 2019-5-29: [Extract critical CSS](https://web.dev/i18n/en/extract-critical-css/)，提取首屏 CSS
- 2019-5-29: [Extract and inline critical CSS with Critical](https://web.dev/codelab-extract-and-inline-critical-css/)，使用 Critical 提取首屏关键 CSS
  - 14KB：
- 2019-8-29: [Create OS-style backgrounds with backdrop-filter](https://web.dev/backdrop-filter/)
- 2019-5-9: [What's the CSS :scope pseudo-class for?](https://web.dev/what-s-the-CSS-scope-pseudo-class-for/)
- 2014-9-17: [Getting Started with CSS Shapes](https://web.dev/shapes-getting-started/)
- 2012-5-25: [Understanding CSS filter effects](https://web.dev/understanding-css/)


### UI

- 2022-8-1: [CSS border animations](https://web.dev/css-border-animations/)，CSS 设置边框动画的小技巧
- 2021-12-18: [How Terra improved user engagement thanks to Dark Mode](https://web.dev/terra-dark-mode/)
- 2021-5-26: [The new responsive: Web design in a component-driven world](https://web.dev/new-responsive)
- 2021-4-20: [Building split text animations](https://web.dev/building-split-text-animations/)，文字动效
- 2021-5-17: [Building a Settings component](https://web.dev/building-a-settings-component)，偏向设计的 CSS 运用指南
- 2021-2-17: [Building a Tabs component](https://web.dev/building-a-tabs-component/)，Tab 组件的构建，用了很多 CSS 技巧
- 2021-1-26: [Best practices for carousels](https://web.dev/i18n/en/carousel-best-practices/)，轮播图的最佳实践
- 2021-1-21: [Building a sidenav component](https://web.dev/building-a-sidenav-component)，对 sidenav 组件的探索
- 2020-12-9: [Payment and address form best practices](https://web.dev/i18n/en/payment-and-address-form-best-practices/)，表单设计
- 2020-11-25: [Building a Stories component](https://web.dev/building-a-stories-component/)
- 2020-5-14: [Responsive web design basics](https://web.dev/i18n/en/responsive-web-design-basics/)，响应式设计基础知识
- 2019-8-31: [Icons and browser colors](https://web.dev/icons-and-browser-colors/)，定义浏览器的组件颜色
- 2013-12-18: [HTML's New Template Tag](https://web.dev/webcomponents-template/#the-road-to-a-standard)，HTML &lt;template&gt; 标签



### 交互

- 2022-2-16: [prefers-reduced-motion: Sometimes less movement is more](https://web.dev/prefers-reduced-motion/)，查询用户偏好，显示/关闭网页动画
- [2021 Scroll Survey Report](https://web.dev/2021-scroll-survey-report/)，一篇介绍滚动交互的报告
- 2021-5-29: [Read files in JavaScript](https://web.dev/i18n/en/read-files/)
- 2021-9-10: [JavaScript eventing deep dive](https://web.dev/eventing-deepdive/)
  - 对 `preventDefault` 和 `stopPropagation` 的深入研究
- 2021-5-30: [Best practices for cookie notices](https://web.dev/cookie-notice-best-practices/)，Cookie 通知的最佳实践
- 2021-5-22: [Control camera pan, tilt, and zoom](https://web.dev/camera-pan-tilt-zoom/)
- 2020-2-22: [Scroll snapping after layout changes](https://web.dev/snap-after-layout/)
- 2020-7-24: [Multi-device content](https://web.dev/multi-device-content/)
  - 这里面介绍了一个概念，The next billion users，下一个十亿用户，指收入少设备差但是又有上网需求的用户，但和中国的农村用户不重叠（国内的网络要比亚非拉等地的网络好很多）
- 2019-6-8: [Accessibility](https://web.dev/accessibility/)
- 2019-8-7: [Animating Modal Views](https://web.dev/animating-modal-views/)
- 2019-8-11: [Animating Between Views](https://web.dev/animating-between-views/)
- 2019-12-6: [Accessibility tips for web developers](https://web.dev/a11y-tips-for-web-dev/)
- 2018-9-20: [Basics of UX](https://web.dev/ux-basics/)
- 2018-9-20: [Add touch to your site](https://web.dev/add-touch-to-your-site/)，对触摸事件的说明
- 2013-5-13: [Touch and mouse](https://web.dev/mobile-touchandmouse/)




### Web Worker/Service Worker

- 2021-10-29: [Bringing service workers to Google Search](https://web.dev/google-search-sw/)
  - 2018-9-7: [Speed up service worker with navigation preloads - Chrome Developers](https://developer.chrome.com/blog/navigation-preload/)
- 2021-6-14: [Indexing your offline-capable pages with the Content Indexing API](https://web.dev/content-indexing-api/)，让 Service Worker 能够告诉浏览器哪些页面可以离线工作
- 2021-5-13: [ES modules in service workers](https://web.dev/es-modules-in-sw/)
- 2020-12-10: [Extending Workbox](https://web.dev/extending-workbox/)，Workbox 是一个用来处理 Service Worker 缓存的工具箱，这篇文章主要介绍了如何制定自定义的缓存方案
- 2020-12-8: [Workers overview](https://web.dev/workers-overview/)
  - 介绍了 Web Worker 和 Service Worker
    - Web Worker：主要是做复杂计算的，抽象库：[https://github.com/GoogleChromeLabs/comlink](https://github.com/GoogleChromeLabs/comlink)，介绍：[https://surma.dev/things/when-workers/](https://surma.dev/things/when-workers/)
    - Service Worker：主要是拦截网络请求的，抽象库：https://developer.chrome.com/docs/workbox/
  - [Imperative caching guide](https://web.dev/imperative-caching-guide/)：命令式单向缓存
  - [Broadcast updates to pages with service workers](https://web.dev/broadcast-updates-guide/)：广播式更新
  - [Two-way communication with service workers](https://web.dev/two-way-communication-guide/)：双向通讯
  - 2019-12-5: [Use web workers to run JavaScript off the browser's main thread](https://web.dev/off-main-thread/)
- 2020-10-6: [Handling range requests in a service worker](https://web.dev/sw-range-requests/)
- 2020-8-20: [Resilient search experiences](https://web.dev/resilient-search-experiences/)，Using a service worker to save a search query when a user goes offline and then automatically retry the query once a connection is re-established.
- 2020-8-20: [Adaptive loading with service workers](https://web.dev/adaptive-loading-with-service-workers/)，使用 service workers 加载自适应资源
- 2020-7-17: [Service worker caching and HTTP caching](https://web.dev/i18n/en/service-worker-caching-and-http-caching/)，缓存
- 2020-7-13: [Handling navigation requests](https://web.dev/handling-navigation-requests/)，Service Worker 处理导航请求
- 2020-4-27: [The Cache API: A quick guide](https://web.dev/cache-api-quick-guide/)，Cache API，用来控制网络缓存，尽管它被定义在 service worker 的标准中， 但是它不必一定要配合 service worker 使用
- 2019-12-17: [Threading the web with module workers](https://web.dev/module-workers/)
- 2019-6-4: [Service worker mindset](https://web.dev/service-worker-mindset/)
  - [https://serviceworkies.com/](https://serviceworkies.com/)：一个学习 Service worker 的游戏网站
- 2018-9-20: [Service worker registration](https://web.dev/service-workers-registration/)
- 2018-2-27: [Measuring the Real-world Performance Impact of Service Workers](https://web.dev/service-worker-perf/)
- 2015-10-1: [Service Workers in Production](https://web.dev/service-workers-iowa/)
- 2013-7-30: [The synchronous FileSystem API for workers](https://web.dev/filesystem-sync/)

### PWA

- 2022-6-8: [Get things done quickly with app shortcuts](https://web.dev/i18n/en/app-shortcuts/)
- 2022-5-30: [Integrate with the OS sharing UI with the Web Share API](https://web.dev/web-share/)
- 2022-5-28: [Badging for app icons](https://web.dev/badging-api/)，在桌面图标上显示角标
- 2021-9-16: [Is your app installed? getInstalledRelatedApps() will tell you!](https://web.dev/get-installed-related-apps/)
- 2021-6-7: [Receiving shared data with the Web Share Target API](https://web.dev/i18n/en/web-share-target/)
- 2021-5-19: [Adaptive icon support in PWAs with maskable icons](https://web.dev/i18n/en/maskable-icon/)，PWA 的启动图标
- 2020-10-14: [WebAPKs on Android](https://web.dev/webapks/)
- 2020-8-20: [Instant navigation experiences](https://web.dev/instant-navigation-experiences/)
- 2020-8-8: [Richer offline experiences with the Periodic Background Sync API](https://web.dev/i18n/en/periodic-background-sync/)
- 2020-7-10: [Progressively enhance your Progressive Web App](https://web.dev/progressively-enhance-your-pwa/)，渐进式增强 PWA，但是有很多可以学习的点
- 2019-12-19: [Integrate PWAs into built-in sharing UIs with Workbox](https://web.dev/workbox-share-targets/)
- 2019-11-8: [OYO Lite: a TWA with the best of web and Android apps](https://web.dev/oyo-lite-twa/)
- 2019-8-19: [Progressive Web Apps in multi-origin sites](https://web.dev/multi-origin-pwas/)
- 2019-6-12: [Address Bar Install for Progressive Web Apps on the Desktop](https://web.dev/pwa-install-addressbar/)
- 2019-6-4: [How do I notify users that my PWA is installable?](https://web.dev/pwa-install-patterns/)
- 2016-6-10: [Building the Google I/O 2016 Progressive Web App](https://web.dev/iowa2016/)

### 安全

- 2022-1-25: [Digging into the Privacy Sandbox](https://web.dev/digging-into-the-privacy-sandbox/)
- 2021-12-21: [Making your website &quot;cross-origin isolated&quot; using COOP and COEP](https://web.dev/i18n/en/coop-coep/)
- 2021-12-10: [Getting started with Trust Tokens](https://web.dev/i18n/en/trust-tokens/)
- 2020-7-16: [Empowering payment apps with Web Payments](https://web.dev/empowering-payment-apps-with-web-payments/)
- 2021-5-21: [Why should you deploy a strict Content Security Policy (CSP)?](https://web.dev/strict-csp/)，Web CSP 安全的相关内容
- 2020-6-10: [Protect your resources from web attacks with Fetch Metadata](https://web.dev/i18n/en/fetch-metadata/)
- 2020-6-19: [Content security policy](https://web.dev/csp/)
- 2020-5-25: [Android payment app developers guide](https://web.dev/i18n/en/android-payment-apps-developers-guide/)
- 2020-5-4: [Why you need &quot;cross-origin isolated&quot; for powerful features](https://web.dev/i18n/en/why-coop-coep/)
- 2016-5-17: [EME WTF?](https://web.dev/eme-basics/)



### 浏览器

- 2022-7-1: [The end of Internet Explorer](https://web.dev/the-end-of-ie/)
  - 2020-7-10: [CSS Grid in IE: CSS Grid and the New Autoprefixer | CSS-Tricks - CSS-Tricks](https://css-tricks.com/css-grid-in-ie-css-grid-and-the-new-autoprefixer/)
- 2021-11-15: [Back/forward cache](https://web.dev/bfcache/)，介绍了 BFCache
- 2021-8-23: [Preparing for AppCache removal](https://web.dev/i18n/en/appcache-removal/)，移除 AppCache 的支持
- 2021-7-29: [Browser-level lazy-loading for CMSs](https://web.dev/browser-level-lazy-loading-for-cmss/)
- 2021-1-25: [Human interface devices on the web: a few quick examples](https://web.dev/hid-examples/)
- 2021-1-8: [Automating audits with AutoWebPerf](https://web.dev/autowebperf/)，性能测试工具
- 2021-1-7: [Deprecating Excalidraw Electron in favor of the web version](https://web.dev/deprecating-excalidraw-electron/)
  - [https://youmightnotneedelectron.com/](https://youmightnotneedelectron.com/)，也许不需要 electron 的原因：Web 提供了很多 API
- 2020-9-3: [Introducing &lt;model-viewer&gt; 1.1](https://web.dev/introducing-model-viewer/)
- 2020-8-21: [The &lt;model-viewer&gt; web component](https://web.dev/model-viewer/)
- 2020-8-5: [Web on Android](https://web.dev/web-on-android/)，简单介绍了 Android 上的 WebView 架构
- 2020-5-26: [ResizeObserver: it’s like document.onresize for elements](https://web.dev/i18n/en/resize-observer/)
- 2020-4-27: [Storage for the web](https://web.dev/i18n/en/storage-for-the-web/)，介绍了几种 web storage 的不同
- 2019-6-5: [Making JavaScript and Google Search work together](https://web.dev/javascript-and-google-search-io-2019/)，这个意味着 Google SEO 机器人可以爬取 SPA 这种大量依赖 JS 生成网站的网页，属于一个非常大的进步了
  - https://developers.google.com/search/blog/2019/05/the-new-evergreen-googlebot
- 2019-3-16: [Introduction to fetch()](https://web.dev/introduction-to-fetch/)，对 fetch API 的介绍
- 2018-9-20: [Best Practices for Using IndexedDB](https://web.dev/indexeddb-best-practices/)
- 2018-9-20: [Web storage overview](https://web.dev/web-storage/)，介绍 Web 上的存储方案
- 2018-9-20: [Social discovery](https://web.dev/social-discovery/)




### WebGL/WebGPU

- 2022-5-1: [Get started with GPU Compute on the web](https://web.dev/gpu-compute/)，简单介绍了 WebGPU
- 2013-9-16: [Canvas inspection using Chrome DevTools](https://web.dev/canvas-inspection/)，对 canvas 的调试
- 2012-7-20: [Typed arrays - Binary data in the browser](https://web.dev/webgl-typed-arrays/)
- 2012-6-20: [WebGL orthographic 3D](https://web.dev/webgl-orthographic-3d/)
- 2012-8-18: [WebGL transforms](https://web.dev/webgl-transforms/)
- 2012-2-9: [WebGL Fundamentals](https://web.dev/webgl-fundamentals/)
- 2011-6-2: [An introduction to shaders](https://web.dev/webgl-shaders/)


### WebXR

- 2020-6-4: [Positioning virtual objects in real-world views](https://web.dev/ar-hit-test/)
- 2020-5-2: [Virtual reality comes to the web](https://web.dev/vr-comes-to-the-web/)
- 2020-2-13: [Virtual reality comes to the web, part II](https://web.dev/vr-comes-to-the-web-pt-ii/)
- 2020-2-13: [Augmented reality: You may already know it](https://web.dev/web-ar/)
- 2018-7-30: [Welcome to the immersive web](https://web.dev/welcome-to-immersive/)
- 2017-2-2: [Rendering Text in WebVR](https://web.dev/within/)
- 2017-2-2: [Core Interactions in the WebVR Lab](https://web.dev/playcanvas/)
- 2017-2-2: [Matterport VR for WebVR](https://web.dev/matterport/)
- 2017-11-6: [Bear 71 and WebVR](https://web.dev/bear71/)

### WebAssembly

- 2021-8-13: [Emscripten’s embind](https://web.dev/embind/)
- 2021-4-26: [Using asynchronous web APIs from WebAssembly](https://web.dev/asyncify/)
- 2020-8-13: [Debugging memory leaks in WebAssembly using Emscripten](https://web.dev/webassembly-memory-debugging/)
  - https://developer.chrome.com/docs/web-platform/webgpu/
- 2019-9-22: [Emscripten and npm](https://web.dev/emscripten-npm/)
- 2019-6-20: [How we're bringing Google Earth to the web](https://web.dev/earth-webassembly/)
- 2019-9-25: [WebAssembly Threads ready to try in Chrome 70](https://web.dev/wasm-threads/)
- 2018-8-22: [Extending the browser with WebAssembly](https://web.dev/wasm-av1/)
- 2018-10-23: [Loading WebAssembly modules efficiently](https://web.dev/loading-wasm/)

### Web Component

- 2022-2-23: [Constructable Stylesheets](https://web.dev/constructable-stylesheets/)
- 2019-6-18: [Web components: the secret ingredient helping power the web](https://web.dev/web-components-io-2019/)
- 2018-9-20: [Building components](https://web.dev/web-components/)
  - Custom Elements: 2019-9-5: [Custom Elements v1 - Reusable Web Components](https://web.dev/custom-elements-v1/)
  - Shadow DOM: 2020-6-27: [Shadow DOM v1 - Self-Contained Web Components](https://web.dev/shadowdom-v1/)
  - Best Practices: 2019-9-5: [Custom Element Best Practices](https://web.dev/custom-elements-best-practices/)
  - Examples
    - 2017-8-14: [HowTo Components – Overview](https://web.dev/components-examples-overview/)
    - 2017-10-11: [HowTo Components – howto-tooltip](https://web.dev/components-howto-tooltip/)
    - 2017-10-11: [HowTo Components – howto-tabs](https://web.dev/components-howto-tabs/)
- 2017-1-10: [Web Components v1 - the next generation](https://web.dev/webcomponents-org/)
- 2016-10-3: [Shadow DOM 101](https://web.dev/shadowdom/#you-pass-shadow-dom-101)
- 2016-10-3: [Shadow DOM 201](https://web.dev/shadowdom-201/)
- 2016-10-3: [Shadow DOM 301](https://web.dev/shadowdom-301/)



### 提案/实验性功能/新 API

- 2022-7-1: [TransformStream is now supported cross-browser](https://web.dev/transformstream/)
- 2022-6-15: [Let installed web applications be file handlers](https://web.dev/file-handling/)，file API
- 2022-6-2: [The File System Access API: simplifying access to local files](https://web.dev/file-system-access/)
- 2022-4-5: [Breaking down barriers using the DataTransfer API](https://web.dev/datatransfer/)，对 DataTransfer API 的介绍
- 2022-5-10: [Unblocking clipboard access](https://web.dev/i18n/en/async-clipboard/)，现代浏览器 clipboard API
- 2022-5-6: [Access USB Devices on the Web](https://web.dev/i18n/en/usb/)
- 2022-4-21: [Read from and write to a serial port](https://web.dev/serial/)
- 2022-4-4: [Capture Keys with the Keyboard Lock API](https://web.dev/keyboard-lock/)
- 2022-2-10: [Video processing with WebCodecs](https://web.dev/webcodecs/)，处理视频流的新提案
- 2022-1-27: [Interact with NFC devices on Chrome for Android](https://web.dev/nfc/#status)
- 2021-10-1: [Communicating with Bluetooth devices over JavaScript](https://web.dev/i18n/en/bluetooth/)，蓝牙 API
- 2021-12-3: [Notification Triggers](https://web.dev/notification-triggers/)
- 2021-11-2: [Customize media notifications and playback controls with the Media Session API](https://web.dev/media-session/)
- 2021-11-10: [Managing several displays with the Multi-Screen Window Placement API](https://web.dev/multi-screen-window-placement/)，多显示器管理 API，需要开 flag
- 2021-8-25: [Detect inactive users with the Idle Detection API](https://web.dev/idle-detection/#use-cases)，空闲检测 API
- 2021-5-19: [Migrate to User-Agent Client Hints](https://web.dev/migrate-to-ua-ch/)，新的 UA 属性，用 userAgentData 替代 userAgent，有个相关的 [polyfill 库](https://github.com/GoogleChromeLabs/uach-retrofill)
- 2021-4-14: [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/)
- 2021-2-26: [Trust is good, observation is better: Intersection Observer v2](https://web.dev/intersectionobserver-v2/)
- 2021-2-23: [Stay awake with the Screen Wake Lock API](https://web.dev/wake-lock/)
- 2021-2-23: [A contact picker for the web](https://web.dev/i18n/en/contact-picker/)
- 2021-2-23: [The Shape Detection API: a picture is worth a thousand words, faces, and barcodes](https://web.dev/shape-detection/)
- 2021-2-23: [WebSocketStream: integrating streams with the WebSocket API](https://web.dev/i18n/en/websocketstream/)
- 2021-2-17: [Sensors for the web](https://web.dev/generic-sensor/)，传感器 API（加速度/重力/陀螺仪/方向传感器）
- 2021-2-12: [Improving user privacy and developer experience with User-Agent Client Hints](https://web.dev/user-agent-client-hints/)
- 2021-1-26: [Capturing an image from the user](https://web.dev/capturing-images/)，相机相册 API
- 2021-1-25: [Reading and writing files and directories with the browser-fs-access library](https://web.dev/browser-fs-access/)，文件读取 API
- 2020-12-3: [Building a device for WebUSB](https://web.dev/build-for-webusb/)
- 2020-11-19: [Better JS scheduling with isInputPending()](https://web.dev/isinputpending/)，JS 调度新 API
- 2020-10-19: [Monitor your web page's total memory usage with measureUserAgentSpecificMemory()](https://web.dev/monitor-total-page-memory-usage/)，测量页面内存占用情况
- 2020-10-13: [Logical layout enhancements with flow-relative shorthands](https://web.dev/logical-property-shorthands/)，一个布局方向的提案
- 2020-7-24: [It's time to lazy-load offscreen iframes!](https://web.dev/iframe-lazy-loading/)，iframe 懒加载 API
- 2020-5-27: [Know your code health with the ReportingObserver API](https://web.dev/reporting-observer/)
- 2020-5-17: [Boldly link where no one has linked before: Text Fragments](https://web.dev/i18n/en/text-fragments/)，开放了一个新的 API，即使是非标题文字也能自动创建 hash fragments 了
- 2020-5-4: [Profiling Web Audio apps in Chrome](https://web.dev/profiling-web-audio-apps-in-chrome/)，音频调试工具
- 2019-11-11: [Get started with Web Bundles](https://web.dev/web-bundles/)
- 2019-8-8: [More capable form controls](https://web.dev/more-capable-form-controls/)
- 2019-6-13: [Updates to the Web Payments APIs](https://web.dev/web-payments-updates/)
- 2019-6-12: [How YouTube improved video performance with the Media Capabilities API](https://web.dev/youtube-media-capabilities/)
- 2019-2-15: [Hands-on with Portals: seamless navigation on the web](https://web.dev/hands-on-portals/)
- 2018-3-14: [Credential Management API Feature Detection Check-up](https://web.dev/webauthn-credential-management/)
- 2013-10-29: [Getting started with Web Audio API](https://web.dev/webaudio-intro/)
- 2013-10-29: [Getting started with Web Audio API](https://web.dev/customelements/)

<br />

----

个人微信：**egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::