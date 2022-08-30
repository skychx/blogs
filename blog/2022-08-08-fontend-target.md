---
slug: fontend-target
title: 🗂 前端版本兼容问题的探索
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 对 web.dev 所有的 blog 进行了整理和归档，方便后续回顾与总结
draft: false
tags: [性能优化]
---



![fontend-target-hero-image](https://image-1255652541.file.myqcloud.com/uPic/fontend-target-hero-image.jpg)


对于大部分开发者来说，版本兼容是一件存在感很低的事情，因为它在绝大部分情况下都是一行配置，在一些前端工具链（例如 Babel、CoreJS，Autoprefixer 等工具）的帮助下适配到目标浏览器，只会在一些大的 break change 事件（例如 Vue3 必须在支持 Proxy 的现代浏览器下才能运行）下才会关注这件不起眼的事情。

但当你稍微研究一下的时候，才会发现这块儿内容知识非常杂，因为版本兼容的相关知识没有那么多内在逻辑性，很多细碎的知识点散落在在各个商业公司的博弈和版本变更中。前段时间因工作需要对部分语言/浏览器特性重点关注了一下，以此文做一下记录。

本文主要记录了移动端的版本适配问题，未对桌面端做更多的研究，后面有可能补充相关内容。



<!--truncate-->



## 1.iOS & Safari

iOS 和 Android 虽然都是一年更新一个大版本，但受益于生态的封闭性，iOS 的更新率**极高**，基本上最近的两个版本就能覆盖 95% 以上的人群。

例如 [Apple 官方统计](https://developer.apple.com/support/app-store/)，截止到 2022-05-31，Apple 四年内推出的新机型中，`iOS 15` 已经有 89% 的装机率，`iOS 14` 也有 10% 的装机率；而在所有历史机型里，`iOS 15` 和 `iOS 14` 加起来也有 96% 的装机率，隔壁 Android 都羡慕哭了：


<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Xnip2022-08-10_13-16-17.png" width="40%" />
</p>



为什么如此关注 iOS 的版本号？**因为 iOS 版本基本上和 Safari 版本一一对应的**，例如 `iOS 15.6` 上安装着 `Safari 15.6`，`iOS 14.5` 上安装着 `Safari 14.1`，具体的映射关系可见 [MDN 的映射表](https://github.com/mdn/browser-compat-data/blob/main/browsers/safari_ios.json)，或者可以看 [core-js: SafariToIOS](https://github.com/zloirock/core-js/blob/master/packages/core-js-compat/src/mapping.mjs)，所以我们基本上只要比对 iOS 版本号即可。



另外一个问题是，有一定 C 端开发经验的开发者可能还会关注 iOS 上运行的是 UIWebView 还是 WKWebView，在 2022 年这个时间点其实已经不需要关注了，因为 Apple Store 已经发过[公告](https://developer.apple.com/cn/news/?id=edwud51q)，2020 12 月之后已经禁止含 UIWebView 的 APP 上架了，所以 iOS 平台只有 WKWebView 这一个 WebView 了，而且它[兼容性也不错](https://developer.apple.com/documentation/webkit/wkwebview)，最低支持到 `iOS 8`。





## 2.Android & Chrome

说完 iOS 我们再谈谈 Android。因为两个操作系统的发展策略不同，再加上国内各大厂商的魔改，Android 从一开始就深陷碎片化的深渊，有 Android 开发经历的同学一定都深有感触。

Android 系统本身碎片化，Android 系统自带的浏览器**更碎片化**。在 Android 早期，Android 版本和 Chrome 浏览器版本是有绑定关系的，那这个早期是有多早？那就是 `Android 4`，2014 年发布，绑定了 Chrome 早期几个版本，因为数据不多，我这里就直接列出来：

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

所以和 iOS 对比起来，Android 因为他的开放性带来严重的碎片化问题：Android 版本多样，Chrome 版本多样，还有各种魔改内核，对于开发者来说适配起来真的苦不堪言。





## 3.Web Browser

了解完操作系统的版本历史，我们再看看浏览器上最关键的 JavaScript 语法兼容度。



### JavaScript

最近十年内，JS 这门语言的的最大变革就是 ES6（ES2015）的发布了，带来了非常多的新特性。下面我搞了一个表格，列出几个大家常用的 JS 语法是从哪个版本开始支持的：

| 语法/API          | iOS  | Chrome |
| ----------------- | ---- | ------ |
| `Class`           | 9    | 49     |
| `=>`              | 10   | 45     |
| `const`           | 11   | 49     |
| `let`             | 11   | 49     |
| `Proxy`           | 10   | 49     |
| `generators`      | 10   | 39     |
| `Promise`         | 8    | 33     |
| `async await`     | 11   | 55     |
| `import` `export` | 10.3 | 61     |
| ...               | ...  | ...    |



我们可以看到，这些语法的最低支持版本集中在 `iOS 10`、`iOS 11`，`Chrome 49`，`Chrome 61` 这几个版本上，我们把它们的版本发布时间列出来：

| 事件                 | 发布时间 |
| -------------------- | -------- |
| `ES5` 标准发布时间   | 2009.12  |
| `ES6` 标准发布时间   | 2015.06  |
| `iOS 10` 发布时间    | 2016.06  |
| `iOS 11` 发布时间    | 2017.06  |
| `Chrome 49` 发布时间 | 2016.03  |
| `Chrome 61` 发布时间 | 2017.09  |



时间列出来后结论基本上是呼之欲出了：**ES6 标准发布后的未来一年时间内，各大浏览器语法就支持的差不多了，两年后基本上就全部支持了**，**这个时间点就是 2017 年，对应着** `iOS 11` **和** `Chrome 61`。



### legacy vs modern

看完 ES6 的支持情况，我们再来了解两个概念，「经典浏览器」和「现代浏览器」。

这两个词在英文里对应着「legacy browser」和「modern browser」。如果大家比较关注一些相对前沿的前端项目，比如说 Vue3，Solidjs，Vite，它们的官网里其实经常提到这两个词。

那么问题来了，既然有两个称呼，那在工程里必然存在一个分界线去区分 legacy 和 modern，**这个分界线就是 `iOS10.3` 和 `Chrome 61`，既浏览器支持 ES Modules 的版本**（支持 `<script type="module">` & `import` & `export`）。

这样一看是不是就和上面的内容对上了？Babel 官网也做了相关的[解释](https://babeljs.io/docs/en/options#targetsesmodules)，core-js 也专门做了[区分](https://github.com/zloirock/core-js/blob/master/packages/core-js-compat/src/external.mjs)，更详细的介绍可以看 MDN 的文章：[JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)，我就不做多余介绍了。



### modern feature

经过上面的探索，我们再回过来看看一些比较 modern 的 browser feature 的支持程度：

| browser fature  | iOS         | Chrome      |
| --------------- | ----------- | ----------- |
| Web Worker      | 5           | 4           |
| SubtleCrypto    | 7           | 37          |
| Service Worker  | 11.3        | 45          |
| WebAssembly     | 11          | 57          |
| CSS Grid Layout | 10.3        | 58          |
| WebGPU          | not support | not support |
| ...             | ...         | ...         |



看看各个 API 的兼容度，再结合上文的内容，就可以发现很多「兼容性不好」人云亦云的说法不攻自破，**其实大部分情况下不是兼容度不好从而不用，是项目还没有复杂到那个程度需要用这些高级功能**。





## 4.Open Source Project

日常开发中肯定不能写一行代码查一下兼容度，这些都是由社区工具做抹平的。

兼容度数据源头可以追述到 MDN 的 [browser-compat-data](https://github.com/mdn/browser-compat-data)，记录了各种 API 的兼容，MDN 网站的兼容度直接是从这个 repo 里读的。我们常用的 [caniuse](https://caniuse.com/) 网站，一部分数据也是依赖于它的。

接下来是工程上依赖最多的 [browserslist](https://github.com/browserslist/browserslist)，babel、eslint、autoprefixer、postcss，webpack 等构建工具都依赖于它，browserslist 的数据又依赖于 [caniuse-lite](https://github.com/browserslist/caniuse-lite)，其实也是依赖于 [caniuse](https://github.com/Fyrd/caniuse)，lite 只保留了核心数据，对一些说明文案做了裁剪处理。



综合以上分析，我们可以看出，在项目工程里依赖的 browserslist，数据准确性还是可以得到保证的，所以兼容性还是无需担心的。



## 5.Adaptation Suggestions

说了这么多，那么有什么配置建议呢？我个人认为主要有 3 点建议提供参考。



**第一个是参考国民级 APP 的最低支持度配置**。

在国内，在日活上能称为国民级 APP 的就是微信抖音了，这两个 APP 因为日活巨大，基本上已经覆盖到全部中国人，所以他们的配置一定有所考量，可以反应出国内的整体手机版本水平。

从 App Store/Android 应用商店/浏览器 UA 上看，我们可以得处以下结论（截止到 2022-8-8）：

- **微信**：最低支持到 `iOS 12`、`Android 5`、内置浏览器版本为 `Chrome 86`
- **抖音**：最低支持到 `iOS 10`、`Android 5`、内置浏览器版本为 `Chrome 75`

当然你也可以参考其他 APP，由于精力有限我就不做过多展开了。



根据项目的迭代速度来看，iOS 基本上可以做到一年一升级，比如说今年 `iOS 16` 出来后，明年最低适配版本基本上可以升到 `iOS 11` 了，Android 因为长尾效应和版本不绑定的问题，应该还会支持到 `Android 5`。



**第二个建议是直接看当前业务的版本数据**。

不同的公司不同的项目都有不同的用户场景，比如说面向三四线 C 端用户的场景，一般低端机就会多一些；面向门店的场景，说不定还得适配 IE 浏览器；面向企业内的开发者项目，直接适配到最新几个浏览器即可。

场景如此之多就要依赖于用户版本数据统计了。一般中大厂都有比较完善的数据监控中台，直接拉一份数据就能获取大致情况，基建不完善的小公司也可以单独开个接口记录数据，收集一个月做个去重统计也能得到相关数据。拿到数据后再结合业务场景做些**取舍**，基本上就可以拿到最低适配了。



**第三个建议结合前端框架和 Chrome 版本做兼容。**

结合前端框架其实很好理解，比如说你用了 Vue3，底层依赖于 Proxy，那么最低依赖已经锁死到 `iOS 10` 和 `Chrome 49` 了，那你的最低配置只能比以上版本高，假如你无脑设置为 `iOS 9` 或 `Android 4`，除了在最低版本上跑不起来，还要平白无故的多了许多语法转换和 polyfill，在 **构建速度/运行时性能/产物体积** 上都会产生不必要的劣化。

结合 Chrome 版本做兼容其实就是本文第二大节的内容。因为 `Android 5` 之后不再和 Chrome 做深度绑定，版本兼容设置 Android 版本其实是无意义的行为，应该根据统计结果直接设置 Chrome 版本，做更细粒度的配置。





## Refs: Version History

以上的版本历史和发布时间主要参考官方更新日志/文档 和 维基百科，相关链接如下所示：

- iOS 版本历史：[https://en.wikipedia.org/wiki/IOS_version_history](https://en.wikipedia.org/wiki/IOS_version_history)
- Android 版本历史：[https://en.wikipedia.org/wiki/Android_version_history](https://en.wikipedia.org/wiki/Android_version_history)
- Chrome 版本历史：[https://en.wikipedia.org/wiki/Google_Chrome_version_history](https://en.wikipedia.org/wiki/Google_Chrome_version_history)
- WKWebView API 兼容度：[https://developer.apple.com/documentation/webkit/wkwebview](https://developer.apple.com/documentation/webkit/wkwebview)
- Android Verison 和 APILevel 的对应关系：[https://developer.android.com/guide/topics/manifest/uses-sdk-element#ApiLevels](https://developer.android.com/guide/topics/manifest/uses-sdk-element#ApiLevels)

<br />
<br />

----



<br />

<br />

<br />

<br />

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" referrerpolicy="no-referrer" />
</p>


![](https://image-1255652541.file.myqcloud.com/uPic/OAFePh.jpg)

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::








