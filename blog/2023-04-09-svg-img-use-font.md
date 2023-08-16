---
slug: svg-img-use-font
title: 🖼️ 如何解决 SVG 图片中字体失效的问题
author: 卤代烃
author_title: 微信公众号@卤代烃实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 如何解决 SVG image 中字体失效的问题
tags: [Web, SVG]
---

「**SVG 图片中字体失效**」的修复方案很简单，只想看答案翻到最后看结论就行。如果想看我的排查思路和具体原因可以从头开始阅读。

<!--truncate-->

## 起因

最近在做项目时，为了兼顾图片的体积和清晰度，部分图片使用 SVG 来展示。但是在实际使用中却发现一个奇怪的现象，**SVG 内部的字体失效了**。

| 实际显示 | 预期展示 |
| ------- | ------ |
| ![svg_lose_font](https://image-1255652541.file.myqcloud.com/uPic/svg_lose_font.png) |![svg_with_font](https://image-1255652541.file.myqcloud.com/uPic/svg_with_font.png) | 


出现问题就要解决问题，首先排查一下代码。

代码中的引用方式很简单，HTML 直接使用 img 标签引用 svg 内容（svg 文件和 HTML 在**同一个域**下，所以不存在跨域问题）：

```html
<p>...</p>
  <img src="/static/skychx.svg">
<p>...</p>
```

```html
<!-- 可以看到 SVG 使用了 Inter 字体，这个字体不是 Web 安全字体 -->
<svg>
  <text x="0" y="15" fill="#F2F2F2">skychx Inter Font</text>
</svg>
```

因为用到非 [Web 安全字体](https://www.cssfontstack.com/)，我猜测是字体没有下载，于是在 HTML 里加了个 `preload`（注意这个字体和 HTML SVG 都在**同一个域**，不存在跨域问题）：

```html
<head>
  <link rel="preload" href="/static/Inter.woff2" as="font" type="font/woff2" crossorigin>
</head>
```

这些准备工作都做好后，字体还是没有生效。


## 排查

这时候我意识到可能是命中一些奇怪的浏览器安全限制了，比如说外链引用的 svg 不能共用 HTML 里下载的字体（其实这个猜测已经距离真相很近了），于是换个思路，把字体声明在 svg 文件里不就行了（注意这时候的 svg 和 font 还是属于**同一个域**，所以也不存在跨域问题）：

```html
<svg>
  <defs>
    <style type="text/css">
      @font-face {
        font-family: Inter;
        src: local('Inter'), url('/static/Inter.woff2') format('truetype');
      }
    </style>
  </defs>
  <text x="0" y="15" fill="red">skychx</text>
</svg>
```

字体内部声明后，却引发了一个奇怪的现象：

- svg 作为图片文件被 HTML 里的 img 标签引用时，字体不生效
- svg 单独在浏览器中打开，字体是生效的

为了排除路径干扰，我还把 font url 改成了绝对路径，Google font 等路径，但还是一样的表现。

## ChatGPT 问路

既然遇到问题，那为什么不问问~~神奇海螺~~ ChatGPT 呢？在我看来这是一个比较常见的问题，它应该会回答的很好（但是没想到这个问题让我绕了两个小时的弯路，这是后话了）。

ChatGPT 给出了很多的答案，列出了以下可能：

- 字体格式是不是不对
- 引用路径是否有问题
- 代码会不会有错误
- 或者会不会有跨域问题

在多轮的问询和尝试下，答案都回归到浏览器安全上，我把前面那几个原因排除后，它就非常笃定是跨域问题，并且再三建议我做跨域检查。

这时候我停下来思考了一下，按道理来说如果出现跨域问题，一般来说 Chrome 还是会 request source，只不过是在浏览器端 block 了 response，而且还会在 Chrome Devtool Console 面板 log 出跨域错误的，但是这些现象都没有；而且前面我也再三确认了这些资源属于同一个域，不应该出现跨域问题。

## 找到原因

既然 ChatGPT 回答不出来，那还是回归 Google 吧.我把关键词输入后，第一条 stackoverflow 就回答了我的疑问：

https://stackoverflow.com/questions/30466610/svg-doesnt-use-font-when-inside-html

它给出了原因和解决方案：为了浏览器安全，浏览器是不允许 img 引用的 svg 发起网络请求的，把字体以 base64 格式内嵌到 SVG 里可以解决这个问题，看下文的回复，这个方案确实有效。

<br />

这个回答只是给出了怎么办，但是并没有给出一手信息来源去解释「为什么」，再经过一些搜索，我找到了 W3C 的相关说明：[SVG Security - W3C Wiki](https://www.w3.org/wiki/SVG_Security)，里面说的很清楚：

> Markup languages like HTML (and SVG itself) can reference SVG as an image with the <img\> tag (HTML namespace) or <image\> tag (HTML or SVG namespace).
>
> If an SVG file is fetched as image, then certain requirements apply to this document:
>
> **Fonts shouldn't be loaded as well**.

<br />

就是说出于浏览器安全考虑，SVG 被 HTML 以 `<img>` 标签引用时，SVG 内部引用的外链字体不应该被下载。


## 解决问题

找到原因后就要解决问题，目前主流的解决方案有两种：

- **font rasterization**: 把 text 以 path 的格式导出，这样可以保留 font 的轮廓，缺点是随着文字的增加，svg 文件的体积也会线性增长，而且 path 会看着很杂乱，难以维护难以更改
- **font embedding**: 把 font 文件以 base64 格式内嵌到 svg 中，缺点是体积会膨胀不少（font 文件本身就比较大，而且转为 base64 格式还会增加体积）


<!-- ![两者格式的体积对比/path 和 text 的维护性对比]() -->

:::tip 顺嘴说一句
在 figma 中导出文件为 svg 时，勾选 `Outline Text` 将会以 path 形式导出文字，不勾选将会以 text 形式导出文字
:::

<br />

好在我又进行了一些关联搜索，找到一个不错的免费 SVG 压缩工具：[nano](https://vecta.io/nano)，完美解决我的问题。


在他们的 [Blog: Making SVG Easier to Use and the Reason We Built Nano](https://vecta.io/blog/making-svg-easier-to-use) 里，对上面两个解决方案做了更详细的对比，我挑一些我觉得有意思的点说一下。

使用 font rasterization 方案后，除了我之前说的问题，还有一个问题是在低分辨率的屏幕上，无法使用操作系统/浏览器专门对字体做的优化，这会导致字体清晰度出问题，最直观的感受就是字体会发虚：

![broken-fonts](https://image-1255652541.file.myqcloud.com/uPic/broken-fonts.png)

<br />

字体文件内嵌到 svg 导致的体积膨胀问题，他们给出的方案是**字体裁剪**。

nano 会先分析 svg 文件中使用的 文字/字体/字重，然后会对字体做裁剪，最后把裁剪后的字体转为 base64 内嵌到 SVG 中。

比如说你只用了 Inter 字体的 “skychx” 6 个字符，那么它会对 Inter 字体做裁剪，只把使用的 6 个字符的字体拿出来，其它字母和字重的字体都会被拆剪掉，最后转为 base64，这样做字体体积会大大缩减。

下面是它们的一个测试 demo：

![teams-nano](https://image-1255652541.file.myqcloud.com/uPic/teams-nano.svg)

下面的表格详细对比了对于同一张资源图，各个方案的文件体积：

|          | Original | Font rasterization | Unoptimized font embedding | Nano font embedding |
| -------- | -------- | ------------------ | -------------------------- | ------------------- |
| **size** | [18.1KB](https://vecta.io/blog/making-svg-easier-to-use/teams-original.cd836e5441.svg)   | [106KB](https://vecta.io/blog/making-svg-easier-to-use/teams-outline.29d77b3e3f.svg)              | [71.3KB](https://vecta.io/blog/making-svg-easier-to-use/teams-embed.7bf5434b27.svg)                     | [20.1KB](https://vecta.io/blog/making-svg-easier-to-use/teams-nano.370efe45b3.svg)              |
| **gzip** | [4.03KB](https://vecta.io/blog/teams-original.gz)   | [13.3KB](https://vecta.io/blog/teams-outline.svgz)             | [44.3KB](https://vecta.io/blog/teams-embed.gz)                     | [12.2KB](https://vecta.io/blog/teams-nano.svgz)              |

<br />

同样的图片如果以 PNG 格式导出，各分辨率下的图片大小是这样的：

|          | PNG @1X  | PNG @2X            | PNG @3X                    |
| -------- | -------- | ------------------ | -------------------------- |
| **size** | 38.9KB   | 95.7KB             | 171KB                      |
| **gzip** | 38.2KB   | 88.6KB             | 153KB                      |

:::tip
实际项目中，jpg/png 等图片格式本身已是压缩格式了，再 gzip 压缩一次效果非常有限，再加上 CPU 算力的消耗，整体其实是负向收益
:::

<br />

从上面这个 demo 可以看出，svg 图片在体积上有非常大的优势。

实际使用上，一个 18kb 左右的 SVG 文件，如果使用字体光栅化方案，大概会膨胀到 100kb，这个体积已经和 png 差不多了；如果使用 nano 优化，总体积大概 20kb 左右，增量并不是很大。

从上面可以看出，解决字体内嵌问题后，SVG 作为图片格式还是非常有优势的。

## 结论

「**SVG 图片中字体失效**」的原因是，出于[浏览器安全](https://www.w3.org/wiki/SVG_Security)考虑，SVG 被 HTML 以 `<img>` 标签引用时，SVG 内部引用的外链字体不会被下载，也不会使用外部资源（除了浏览器本身内置的字体），所以会产生个性化字体失效的现象。

目前的最佳解决方案是通过 [nano](https://vecta.io/nano) 做一下字体内嵌的处理，保障图片正常显示的同时兼顾文件的小体积。