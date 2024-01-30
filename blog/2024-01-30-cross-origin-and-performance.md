---
slug: cross-origin-and-performance
title: ⚡️ [性能优化] 浏览器跨域带来的一些性能问题
author: 卤代烃
author_title: 微信公众号@卤代烃实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 浏览器跨域带来的一些性能问题
tags: [性能优化]
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

由于 Web 的开放特性，同样是糊页面，Web 前端工程师往往要和 CORS（跨域请求）做一些斗争，例如我之前遇到的一个 [《SVG 图片字体失效问题》](http://localhost:3000/svg-img-use-font) 就是 CORS 引起的。


<!--truncate-->

:::info 提示
> 对 CORS 不太了解的同学，可以看我之前翻译的这篇文章[《15 张精美动图全面讲解 CORS》](https://supercodepower.com/HTTP_CORS_visualized)，图文并茂，基本上可以对 CORS 有个大致的理解
:::


CORS 除了会带来一些**资源加载失败**的问题，它其实还会对一些**性能场景**带来一些干扰，本篇文章就是记录一下工作中遇到的一些问题。因为水平有限，没覆盖到的地方欢迎大家评论补充。

<br/>

## 场景

### 1.预检请求带来的双倍网络通信

这个基本上算是最经典的跨域带来的性能问题了。简单来说就是在**非**[简单请求（simple request）](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)场景下，浏览器会先发一个[预检请求（preflight request）](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflighted_requests)，问问服务器支持什么 HTTP Header，然后基于这个白名单决定是否要发起真正的网络请求。

:::info 提示
这部分内容建议看[《15 张精美动图全面讲解 CORS》](https://supercodepower.com/HTTP_CORS_visualized)，结合动图演示会有更好的理解
:::

<img src="https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/Flowchart_showing_Simple_and_Preflight_XHR.svg" />

这就导致网络请求会多一次 HTTP OPTIONS 请求（即 preflight request），可能会带来几十到几百毫秒的延迟，如果接口比较重要，可能会影响到首屏的加载时间。

<br/>

### 2.ResourceTiming API 数据丢失

<img src="https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/timestamp-diagram.svg" />

一个网络请求会经历 DNS 寻址 + TLS 连接 + TCP 连接 + HTTP 请求响应等多个阶段，这些请求细节的时间点位一般可以用 [ResourceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing) 来获取：

```javascript
performance.getEntriesByName('example.com/api')
```

获取到的数据可以采集上报用来在后台大盘监控一些性能问题。但是在 CORS 场景下出于安全考虑，部分性能点位的数据会强制设置为 0，导致采集失效。

<br />

<img src="https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/cors-perfs-api.png" alt="cors-perfs-api" width="50%" />

如上图所示，如果资源的 HTTP Response Header 中的 [Timing-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin) 不存在或未包含该站点的域名，就只会显示 `startTime`/`fetchStart`/`responseEnd` 这个 3 个点位的真实数据（也就是只显示请求的 start 和 end，中间的细节全部不显示），其它点位全部显示 0。


<br/>


### 3.LCP 大于 FCP

先简单介绍一下这两个词的含义：

- **FCP**：First Contentful Paint，首次绘制时间，一般指浏览器绘制第一个像素的时间，这时候页面往往还是白屏或者刚加载了骨架屏
- **LCP**：Largest Contentful Paint，最大内容绘制时间，这时候页面往往已经加载完成显示出可见内容了

<br />

从概念上看，LCP 应该是**大于或等于** FCP 的，但是在部分跨域场景下会出现 LCP **小于** FCP 的情况。这里我们借助 [PerformanceElementTiming API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceElementTiming) 来理解这种场景。

对于一张图片，它存在一个 [loadTime](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceElementTiming/loadTime)，可以简单理解为图片资源下载完成的时间，这时候图片还没来得及显示；还有一个 [renderTime](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceElementTiming/renderTime)，这才是图片真正显示的时间。

<br />

如果存在这样一种场景：

```
imageLoadTime < FCP < imageRenderTime
```

而在采集 LCP 数据时，正好是这张图片触发了 LCP，肯定要以 imageRenderTime 这个图片显示时间为准。但是如果**这个图片跨域，且没有声明 `Timing-Allow-Origin`**，就会 fallback 到 imageLoadTime。这时候就会出现 LCP 小于 FCP 的情况。

这种情况一般还是比较少见的，但在实际业务中确实出现了这种情况，社区中也有类似的问题（eg: [issues/260](https://github.com/GoogleChrome/web-vitals/issues/260)），所以也算一个 CORS 影响性能的案例。

<br/>

### 4.字体 preload 失效

浏览器 提供了 `<link rel="preload" />` 标签用来预加载资源，那么字体资源也是可以预加载的。

<br />

首先说说字体预加载的必要性。对于一个自定义字体来说，并不是说我声明了字体资源链接，就会发起字体的网络请求：

```css
@font-face {
  font-family: 'Quasari';
  src: url('https://fonts.cdnfonts.com/s/29552/Quasari.woff'); /* 并不会请求 Quasari.woff 资源 */
}
h1 {
  font-family: 'Quasari';
}
```

只有浏览器实际排版时，发现 DOM 里有 `h1` 这个标签，才会发起字体资源网络请求，这就导致加载时机偏晚，可能会影响到 FCP/CLS 等性能指标，所以就有了 preload font 的必要性。

<br />

因为字体也有跨域问题，所以 preload 的时候，如果资源是跨域的，需要加上 `corssorigin` 属性做跨域标识，这样才能成功命中 preload 缓存，到这里，其实都是符合预期的：

```html
<link rel="preload" href="cors.com/font.woff" as="font" type="font/woff" crossorigin />
```

<br />

但是吊诡的是，如果字体资源不跨域，你也得加 `corssorigin` 属性，否则缓存还是命中不了 😅：

<img src="https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/cors-perfs-font-preload-fail.png" alt="cors-perfs-font-preload-fail" width="60%" />



<img src="https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/cors-perfs-font-preload-success.png" alt="cors-perfs-font-preload-success" width="60%" />

<br/>

这个现象在 Chrome 上存在了快 10 年了，相关的讨论可以看[这个 issue](https://github.com/w3c/preload/issues/32)，我也很难说这是个 bug 还是个 feature，总之到现在的 120 版本还是这样的。但从我的角度看确实挺坑的，从 API 上看还是不太符合直觉。

<br/>

## 总结

浏览器作为 Web 的入口，安全问题一直是重中之重，最近几年的一些新功能都会考虑到安全，例如：

- 新的 API 功能必须在在 HTTPS 环境下才能调用
- Cookie 的滥用问题一直在收口
- 各种资源加载问题上会有各种 CORS/CSP 限制
- ......

这些措施其实都是利于用户数据安全的，但是不可避免的会给开发者带来 debug 和性能上的困扰，这个也是需要我们去长期跟进和学习的地方。

<br/>

## 参考

- [LCP: load_time vs render_time](https://web.dev/articles/lcp#load_time_vs_render_time)
- [Web Font Downloaded Twice When Preloading](https://hyperborea.org/tech-tips/webfont-doubled/)
- [Preload: What Is It Good For? -- early loading of fonts](https://www.smashingmagazine.com/2016/02/preload-what-is-it-good-for/#early-loading-of-fonts)
- [w3c/preload: fonts and crossorigin](https://github.com/w3c/preload/issues/32)
- [CSS Fonts Module Level 4](https://drafts.csswg.org/css-fonts/#font-fetching-requirements)