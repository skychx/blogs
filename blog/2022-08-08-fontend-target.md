---
slug: fontend-target
title: 🗂 前端版本兼容问题的探索
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 对 web.dev 所有的 blog 进行了整理和归档，方便后续回顾与总结
draft: true
tags: [性能优化]
---



对于大部分开发者来说，版本兼容是一件存在感很低的事情，因为它在绝大部分情况下都是一行配置，在一些前端工具链（例如 Babel、CoreJS，Autoprefixer 等工具）的帮助下适配到目标浏览器，只会在一些大的 break change 事件（例如 Vue3 必须在支持 Proxy 的现代浏览器下才能运行）下才会关注这件不起眼的事情。

但当你稍微研究一下的时候，才会发现这块儿内容知识非常杂，因为版本兼容的相关知识没有那么多内在逻辑性，很多细碎的知识点散落在在各个商业公司的博弈和版本变更中。前段时间因工作需要对部分语言/浏览器特性重点关注了一下，以此文做一下记录。本文主要记录了移动端的版本适配问题，未对桌面端做更多的研究，后面有可能补充相关内容。



## 1.iOS & Safari

iOS 和 Safari 的对应关系，基本上是一一对应的（大版本号匹配）

虽然众多前端开发者对 iOS 的适配苦不堪言，但是大家也不得不承认同样的网页，

iOS 和 Android 虽然都是一年更新一个大版本，但受益于生态的封闭性，iOS 的更新率**极高**，基本上最近的两个版本就能覆盖 95% 以上的人群。

例如 [Apple 官方统计](https://developer.apple.com/support/app-store/)，到目前（2022-8-8）为止，四年内推出的新机型中，`iOS 15` 已经有 89% 的装机率，`iOS 14` 也有 10% 的装机率；而在所有历史机型里，`iOS 15` 和 `iOS 14` 加起来也有 96% 的装机率，隔壁 Android 都羡慕哭了：



为什么如此关注 iOS 的版本号？因为 iOS 版本基本上和 Safari 版本一一对应的，例如 `iOS 15.6` 上安装着 `Safari 15.6`，`iOS 14.5` 上安装着 `Safari 14.1`，具体的映射关系可见 [MDN 的映射表](https://github.com/mdn/browser-compat-data/blob/main/browsers/safari_ios.json)，或者可以看 [core-js 的精简版](https://github.com/zloirock/core-js/blob/master/packages/core-js-compat/src/mapping.mjs)。



另外一个问题是，有一定 C 端开发经验的开发者可能还会关注 iOS 上运行的是 UIWebView 还是 WKWebView，在 2022 年这个时间点其实已经不需要关注了，因为 Apple Store 已经发过[公告](https://developer.apple.com/cn/news/?id=edwud51q)，2020 12 月之后已经禁止含 UIWebView 的 APP 上架了，所以 iOS 平台只有 WKWebView 这一个 WebView 了，而且它[兼容性也不错](https://developer.apple.com/documentation/webkit/wkwebview)，最低支持到 `iOS 8`。





## 2.Android & Chrome

说完 iOS 我们再谈谈 Android。因为两个操作系统的发展策略不同，再加上国内各大厂商的魔改，Android 从一开始就深陷碎片化的深渊，有 Android 开发经历的同学一定都深有感触。

Android 系统本身碎片化，Android 系统自带的浏览器**更碎片化**。在 Android 早期，Android 版本和 Chrome 浏览器版本是有绑定关系的，那这个早期是有多早？那就是 `Android 4`，2014 年发布，绑定了 `Chrome 30`，因为数据不多，我这里就直接列出来：

```javascript
// https://github.com/zloirock/core-js/blob/master/packages/core-js-compat/src/mapping.mjs
ChromeToAndroid: [
  [9, '3.0'],
  [12, '4.0'],
  [30, '4.4'],
  [33, '4.4.3'],
]
```

事情的转机出现在 `Android 5`，[这个版本](https://developer.chrome.com/docs/multidevice/webview/)里 WebView 被移植为一个独立的 APK，可以独立更新，不再和 Android 系统深度绑定。

Google 的想法初衷是好的，借助于 Google 商店，解耦更利于浏览器的版本迭代。但是在国内多厂商魔改和一些网络问题上，极有可能发生这样的事情：对于一台 `Android 5` 手机，理论上用户可以安装 `Chrome 36` - `Chrome 95` **任意一个版本**！

所以和 iOS 对比起来，Android 因为他的开放性带来严重的碎片化问题：Android 版本多样，Chrome 版本多样，还有各种魔改内核，对于开发者来说真的苦不堪言。



Android：是时候掌握WebView与Js的交互技术了

https://juejin.cn/post/6844903564737789965#heading-8



## 3.Web Browser

除了底层的操作系统的间接影响，浏览器本身会直接影响到项目的适配。其中不乏一些很重要的能力。



### modern & legacy

经典浏览器和现代浏览器的分界点是什么？

 iOS10，Chrome 61: 浏览器开始支持 module type script，由此为分界线区分为 morden 和 legacy

​	* https://caniuse.com/?search=type%3Dmodule

​	* https://github.com/zloirock/core-js/blob/master/packages/core-js-compat/src/external.mjs



### modern feature

一些看起来非常酷炫的 web/javascript 能力，大家往往说支持度不好，事实真的如此吗？

- Proxy
- Web Worker
- Service Worker
- Wasm
- WebGPU

- Web Component



## 4.Open Source Project

会涉及到兼容性的一些开源项目

- canisue
- Browserslist
- 





## 5.Adaptation Suggestions

说了这么多，那么有什么配置建议呢？我个人认为主要有 3 点建议提供参考。

**第一个是参考国民级 APP 的最低支持度配置**。

在国内，在日活上能称为国民级 APP 的就是微信抖音了，这两个 APP 因为日活巨大，基本上已经覆盖到全部中国人，所以他们的配置一定有所考量，可以反应出国内的整体手机版本水平。

从 App Store/Android 应用商店/浏览器 UA 上看，我们可以得处以下结论（截止到 2022-8-8）：

- **微信**：最低支持到 `iOS 12`、`Android 5`、内置浏览器版本为 `Chrome 86`
- **抖音**：最低支持到 `iOS 10`、`Android 5`、内置浏览器版本为 `Chrome 75`

当然你也可以参考其他 APP，由于经历优先我就不做过多展开了。



**第二个建议是直接看当前业务的版本数据**。

不同的公司不同的项目都有不同的用户场景，比如说面向三四线 C 端用户的场景，一般低端机就会多一些；面向门店的场景，说不定还得适配 IE 浏览器；面向企业内的开发者项目，直接适配到最新几个浏览器即可。

场景如此之多就要依赖于用户版本数据统计了。一般中大厂都有比较完善的数据监控中台，直接拉一份数据就能获取大致情况，基建不完善的小公司也可以单独开个接口记录数据，收集一个月做个去重统计也能得到相关数据。拿到数据后再结合业务场景做些取舍，基本上就可以拿到最低适配了。



**第三个建议结合前端框架和 Chrome 版本做兼容。**

结合前端框架其实很好理解，比如说你用了 Vue3，底层依赖于 Proxy，那么最低依赖已经锁死到 `iOS 10` 和 `Chrome 49` 了，那你的最低配置只能比相关版本高，假如你无脑设置为 `iOS 9` 或 `Android 4`，除了在最低版本上跑不起来，还要平白无故的多了许多语法转换和 polyfill，在 **构建速度/运行时性能/产物体积** 上都会产生不必要的劣化。

结合 Chrome 版本做兼容其实就是本文第二大节的内容。因为 Android 5 之后不再和 Chrome 做深度绑定，版本兼容设置 Android 版本其实是无意义的行为，应该根据统计结果直接设置 Chrome 版本，做更细粒度的配置。





## 6.Version History

- iOS 版本历史：https://en.wikipedia.org/wiki/IOS_version_history
- Android 版本历史：https://en.wikipedia.org/wiki/Android_version_history
- Chrome 版本历史：https://en.wikipedia.org/wiki/Google_Chrome_version_history
- WKWebView API 兼容度：https://developer.apple.com/documentation/webkit/wkwebview
- Android Verison 和 APILevel 的对应关系：https://developer.android.com/guide/topics/manifest/uses-sdk-element#ApiLevels







