## 内容分类：

- Chrome 新特性的介绍
- 一些性能优化策略
- 各个商业团队的性能优化带来的数据提升
- 对一些开发者的采访



## Web Vitals

- 2022-5-16: [How do modern frameworks perform on the new INP metric](https://web.dev/inp-in-frameworks/#how-are-aurora-and-frameworks-addressing-inp-issues)
- 2022-5-11: [How SPA architectures affect Core Web Vitals](https://web.dev/vitals-spa-faq/)
- 2021-8-17: [Why lab and field data can be different (and what to do about it)](https://web.dev/lab-and-field-data-differences/)
  - 介绍了 实验室数据和用户统计数据 两者的不同，以及产生这些不同的可能原因
- 2022-1-18: [Core Web Vitals workflows with Google tools](https://web.dev/i18n/en/vitals-tools/)
  - 介绍了可以测量 Core Web Vitals 的一些通用工具
- 2021-6-21: [Towards a better responsiveness metric](https://web.dev/better-responsiveness-metric/)，对 FID 指标的探索
- 2021-6-2: [CSS for Web Vitals](https://web.dev/i18n/en/css-web-vitals/)，利用 CSS 优化 Web Vitals
- 2021-6-2: [Evolving Cumulative Layout Shift in web tooling](https://web.dev/cls-web-tooling/)，CLS 在 web 性能工具里的发展
- 2021-5-11: [Optimizing Web Vitals using Lighthouse](https://web.dev/optimize-vitals-lighthouse/)，Lighthouse 对 Web Vitals 指标的检测和优化建议
- 2021-4-7: [Evolving the CLS metric](https://web.dev/evolving-cls/)，CLS 指标的测量细节
- 2021-4-1: [Debug Web Vitals in the field](https://web.dev/debug-web-vitals-in-the-field/)，讲如何测量 Web Vitals 指标
- 2021-5-11: [Debug layout shifts](https://web.dev/debug-layout-shifts/)，layout shifts 引起的原因以及如何识别、测量和修复
- 2021-5-9: [How CLS optimizations increased Yahoo! JAPAN News's page views per session by 15%](https://web.dev/yahoo-japan-news/)
  - 2021-5-9: [Aspect Ratio Boxes](https://css-tricks.com/aspect-ratio-boxes/)，一个保持长宽比的盒子
- 2021-1-25: [Feedback wanted: The road to a better layout shift metric for long-lived pages](https://web.dev/better-layout-shift-metric/)，对 CLS 指标的探索




## 网络资源加载

- 2020-4-29: [Improved Next.js and Gatsby page load performance with granular chunking](https://web.dev/granular-chunking-nextjs/)
  - 2018-12-6: [HTTP/2 Prioritization](https://calendar.perfplanet.com/2018/http2-prioritization/)
- 2022-2-24: [Optimizing third-party script loading in Next.js](https://web.dev/script-component/)
- 2022-2-7: [Improve security and privacy by updating HTTP Cache](https://web.dev/http-cache-security/)
- 2022-3-8: [Optimizing resource loading with Priority Hints](https://web.dev/priority-hints/)
  - `fetchpriority` 属性的运用，用来修改资源加载优先级，Chrome101 可用
  - 这里面有资源加载优先级的表格和说明：https://docs.google.com/document/d/1bCDuq9H1ih9iNjgzyAL0gpwNFiEP4TZS-YLRp_RuMlc/edit#heading=h.ua1godj1atee
  - [Preload](https://web.dev/uses-rel-preload/)，Chrome 50，iOS 11.3
  - [Preconnect](https://web.dev/uses-rel-preconnect/)，Chrome 46，iOS 11.3
  - dns-prefetch：Chrome 4
  - https://wicg.github.io/priority-hints/
  - https://addyosmani.com/blog/script-priorities/
- 2021-10-8: [Assessing loading performance in the field with Navigation Timing and Resource Timing](https://web.dev/navigation-and-resource-timing/)，统计资源请求的流程和时间
- 2021-10-5: [Best practices for using third-party embeds](https://web.dev/embed-best-practices/)
  - 第三方嵌入的内容（地图/视频/图片等）优化方案：延迟加载/图片占位图/交互时再加载
  - https://web.dev/third-party-facades/
- 2021-6-15: [The performance effects of too much lazy-loading](https://web.dev/lcp-lazy-loading/)
  - 对懒加载的调研，发现 wordpress 一个不合理的优化：他们的懒加载会把首屏的图片也懒加载了，这样会劣化 LCP
- 2022-6-14: [Security headers quick reference](https://web.dev/security-headers/)，跨域安全相关的 HTTP Header
- 2021-4-22: [Keeping third-party scripts under control](https://web.dev/controlling-third-party-scripts/)，对第三方网站的治理流程
- 2021-2-1: [Requesting performance isolation with the Origin-Agent-Cluster header](https://web.dev/origin-agent-cluster/)，新的 HTTP 头
- 2021-1-25: [When to use HTTPS for local development](https://web.dev/when-to-use-local-https/)，什么时候要用到本地 HTTPS 开发调试
- 2021-1-25: [How to use HTTPS for local development](https://web.dev/i18n/en/how-to-use-local-https/)
- 




## 渲染性能

- 2019-8-27: [Rendering on the Web](https://web.dev/rendering-on-the-web/)
  - 介绍了 CSR/NSR/Rehydration/Prerendering 等方案，里面有个非常经典的图
- 2022-4-11: [Bringing instant page-loads to the browser through speculative prerendering](https://web.dev/speculative-prerendering/)
  - 只有 Chrome 支持
- 2011-10-21: [Avoiding Unnecessary Paints - Animated GIF Edition](https://web.dev/speed-animated-gifs/)
- 2011-8-16: [Improving HTML5 Canvas performance](https://web.dev/canvas-performance/)，canvas 性能优化
- 2011-6-3: [HTML5 techniques for optimizing mobile performance](https://web.dev/mobile-optimization-and-performance/)，文章比较老了



## 图片

- https://images.tooling.report/，查询各个 SaaS 服务对图片的优化
- [Building an adaptive favicon](https://web.dev/building-an-adaptive-favicon/)，用 svg 代替 ico 图标
- [Building an effective Image Component](https://web.dev/image-component/)，利用一个 image 组件优化图片大小/宽高/优先级
- 2021-6-7: [Using AVIF to compress images on your site](https://web.dev/compress-images-avif/)，介绍了 AVIF 图片格式
 - 2020-2-14: [AVIF for Next-Generation Image Coding](https://netflixtechblog.com/avif-for-next-generation-image-coding-b1d75675fe4)，Netflix 使用 AVIF 带来的图片优化
- 




## CSS/UI

- 2022-5-11: Grid [Bridging the gap](https://web.dev/bridging-the-gap/)
- 2021-12-18: [How Terra improved user engagement thanks to Dark Mode](https://web.dev/terra-dark-mode/)
- 2021-8-17: [Using CSS Module Scripts to import stylesheets](https://web.dev/css-module-scripts/)，Chrome 93 可用
- 2021-6-9: [Building a color scheme](https://web.dev/building-a-color-scheme/)，通过 hsl() 和 calc() 构建可动态计算的颜色主题
- 2021-5-27: [New CSS functional pseudo-class selectors :is() and :where()](https://web.dev/css-is-and-where/)
- 2021-5-26: [The new responsive: Web design in a component-driven world](https://web.dev/new-responsive)
- 2021-4-20: [Building split text animations](https://web.dev/building-split-text-animations/)，文字动效
- 2021-5-22: Compat 2021: [Eliminating five top compatibility pain points on the web](https://web.dev/compat2021/)，CSS flex/grid/sticky/aspect-ratio/transform 兼容性
- 2021-5-17: [Building a Settings component](https://web.dev/building-a-settings-component)，偏向设计的 CSS 运用指南
- 2021-2-17: [Building a Tabs component](https://web.dev/building-a-tabs-component/)，Tab 组件的构建，用了很多 CSS 技巧
- 2021-1-28: [New aspect-ratio CSS property supported in Chromium, Safari Technology Preview, and Firefox Nightly](https://web.dev/aspect-ratio/)，新的 css 属性 aspect-ratio，用来替换 padding-top hack，只有 Chrome88 以上和 iOS15 支持
- 2021-1-26: [Best practices for carousels](https://web.dev/i18n/en/carousel-best-practices/)，轮播图的最佳实践
- 2021-1-21: [Building a sidenav component](https://web.dev/building-a-sidenav-component)，对 sidenav 组件的探索
- 2020-12-16: [Centering in CSS](https://web.dev/centering-in-css/)，介绍了几种 CSS 居中对齐的方案


## JS/框架

- 2021-6-28: [Resource inlining in JavaScript frameworks](https://web.dev/aurora-resource-inlining/)
  - 内联首屏/关键 css，减少一次网络请求
  - 内联字体声明
- 2021-6-7: [Observing compute pressure](https://web.dev/compute-pressure/)，测量 CPU 数据的 API
- 2021-5-13: [ES modules in service workers](https://web.dev/es-modules-in-sw/)
- 2021-5-8: [JavaScript: What is the meaning of this?](https://web.dev/i18n/en/javascript-this/)，对 JS 中 this 的介绍
- 2021-2-25: [Streams—The definitive guide](https://web.dev/streams/)，对浏览器中的 Streams API 的介绍



## 字体

- 2022-1-19: [Introduction to variable fonts on the web](https://web.dev/variable-fonts/)，可变字体，一个字体文件可用动态切换多个字重（旧的字体需要多个字体文件）
- 2021-6-9: [CSS size-adjust for @font-face](https://web.dev/css-size-adjust/)，新的 css 属性，防止字体切换的时候带来布局变动从而劣化 CLS 指标
- 2021-6-3: [Best practices for fonts](https://web.dev/font-best-practices/)
  - 内联字体声明（而不是内联字体本身）
  - preconnect + preload
  - 字体裁剪 + 可变字体
  - [font-display](https://caniuse.com/?search=font-display) 的使用
- 2020-7-3: [Optimize WebFont loading and rendering](https://web.dev/optimize-webfont-loading)
  - 介绍了浏览器加载字体的默认行为，并说明了一些字体属性的运用




## 浏览器

- 2021-8-5: [How browsers work](https://web.dev/howbrowserswork/)：浏览器如何运行的，文章比较老了
- 2021-5-19: [Migrate to User-Agent Client Hints](https://web.dev/migrate-to-ua-ch/)，新的 UA 属性，用 userAgentData 替代 userAgent，有个相关的 [polyfill 库](https://github.com/GoogleChromeLabs/uach-retrofill)
- 2021-2-12: [Improving user privacy and developer experience with User-Agent Client Hints](https://web.dev/user-agent-client-hints/)
- 2022-4-5: [Breaking down barriers using the DataTransfer API](https://web.dev/datatransfer/)，对 DataTransfer API 的介绍
- 2021-5-21: [Why should you deploy a strict Content Security Policy (CSP)?](https://web.dev/strict-csp/)，Web CSP 安全的相关内容
- 2021-1-7: [Deprecating Excalidraw Electron in favor of the web version](https://web.dev/deprecating-excalidraw-electron/)
  - https://youmightnotneedelectron.com/，也许不需要 electron 的原因：Web 提供了很多 API


## 交互

- [2021 Scroll Survey Report](https://web.dev/2021-scroll-survey-report/)，一篇介绍滚动交互的报告
- 2021-5-29: [Read files in JavaScript](https://web.dev/i18n/en/read-files/)
- 2021-9-10: [JavaScript eventing deep dive](https://web.dev/eventing-deepdive/)
  - 对 `preventDefault` 和 `stopPropagation` 的深入研究
- 2021-5-30: [Best practices for cookie notices](https://web.dev/cookie-notice-best-practices/)，Cookie 通知的最佳实践


## WebAssembly

- 2021-4-26: [Using asynchronous web APIs from WebAssembly](https://web.dev/asyncify/)


## 案例

- 2022-4-15: [How RebelMouse grew loyalty and engagement by optimizing Core Web Vitals](https://web.dev/rebelmouse/)
- 2021-12-10: [How QuintoAndar increased conversion rates and pages per session by improving page performance](https://web.dev/quintoandar/)
- 2021-11-15: [Improving Core Web Vitals on the Mail.ru home page resulted in an average 10% increase in conversion rates](https://web.dev/mailru-cwv/)
  - 使用了 SSR、polyfill 拆分做了优化
- 2021-10-8: [How Renault improved its bounce and conversion rates by measuring and optimizing Largest Contentful Paint](https://web.dev/renault/)
- 2021-9-15: [How Swappie increased mobile revenue by 42% by focusing on Core Web Vitals](https://web.dev/swappie/)
- 2021-7-19: [How committing to Core Web Vitals increased Netzwelt's advertising revenues by 18%](https://web.dev/netzwelt/)
- 2021-6-14: [Improving Cumulative Layout Shift at Telegraph Media Group](https://web.dev/telegraph/)


## 团队

- [Aurora](https://web.dev/introducing-aurora/): Chrome 官方和 React/Nextjs 等框架前端合作，共同优化 Web 性能