---
slug: cross-origin-and-performance
title: ⚡️ [Performance] Performance issues brought by browser cross-domain
author: skychx
author_title: skychx blogs
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: Some performance issues brought by browser cross-domain
tags: [Web Performance]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="cross-origin-and-performance-hero-image.jpg" w={640} h={279} />


## Preface


Due to the open nature of the Web, web front-end engineers often have to struggle with CORS (Cross-Origin Resource Sharing), such as a [“SVG Image Font Failure Issue”](https://supercodepower.com/en/svg-img-use-font) I encountered before, which was caused by CORS.


<!--truncate-->

:::info Tip
For those who are not very familiar with CORS, you can read this article I translated before [✋🏼🔥 CS Visualized: CORS](https://dev.to/lydiahallie/cs-visualized-cors-5b8h). It is rich in pictures and texts, and you can basically have a general understanding of CORS.
:::


In addition to causing some **resource loading failures**, CORS can also interfere with some **performance scenarios**. This article records some problems encountered at work. Because of limited knowledge, welcome everyone to comment and supplement.

<br/>

## Scenarios

### 1. Double Network Communication Caused by Pre-Flight Requests

This is basically the most classic performance problem caused by cross-domain. Simply put, in **non**-[simple request](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests) scenarios, the browser will first send a [pre-flight request](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflighted_requests), asking the server what HTTP Header it supports, and then decide whether to initiate the real network request based on this whitelist.

:::info Tip
For this part of the content, it is recommended to read [✋🏼🔥 CS Visualized: CORS](https://dev.to/lydiahallie/cs-visualized-cors-5b8h). Understanding will be better with the demonstration of animated images.
:::

<img src="https://image-1255652541.file.myqcloud.com/uPic/Flowchart_showing_Simple_and_Preflight_XHR.svg" alt="Simple and Preflight Fetch" />

This results in an additional HTTP OPTIONS request (i.e., preflight request), which may cause a delay of tens to hundreds of milliseconds. If the interface is important, it may affect the loading time of the first screen.

<br/>

### 2. Loss of ResourceTiming API Data

<img src="https://image-1255652541.file.myqcloud.com/uPic/timestamp-diagram.svg" alt="ResourceTiming" />

A network request will go through multiple stages such as DNS addressing + TLS connection + TCP connection + HTTP request response. The timing details of these requests can generally be obtained using the [ResourceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing):

```javascript
performance.getEntriesByName('example.com/api')
```

The obtained data can be collected and reported for monitoring some performance issues on the backend dashboard. However, in the CORS scenario, for security reasons, the data of some performance points will be forcibly set to 0, causing the collection to fail.

<br />

<img src="https://image-1255652541.file.myqcloud.com/uPic/cors-perfs-api.png" alt="cross_origin vs same_origin" width="50%" /> 

As shown in the figure above, if the [Timing-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Timing-Allow-Origin) in the HTTP Response Header of the resource does not exist or does not include the domain name of this site, only the actual data of these three points `startTime`/`fetchStart`/`responseEnd` will be displayed (that is, only the start and end of the request are displayed, and all the details in the middle are not displayed), all other points will display 0.


### 3. LCP < FCP

Let's first briefly introduce the meanings of these two terms:

- **FCP**: First Contentful Paint, the time of the first drawing, generally refers to the time when the browser draws the first pixel, at this time the page is often still white or just loaded the skeleton screen.
- **LCP**: Largest Contentful Paint, the time of the largest content drawing, at this time the page has often been loaded and displayed visible content.

<br />

Conceptually, LCP should be **greater than or equal to** FCP, but in some cross-domain scenarios, LCP **less than** FCP will occur. Here we use the [PerformanceElementTiming API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceElementTiming) to understand this scenario.

For a picture, it has a [loadTime](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceElementTiming/loadTime), which can be simply understood as the time when the picture resource is downloaded, and the picture has not yet been displayed; there is also a [renderTime](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceElementTiming/renderTime), which is the real display time of the picture.

If there is such a scenario:

```
imageLoadTime < FCP < imageRenderTime
```

And when collecting LCP data, it happens to be this picture that triggered LCP, it must be based on the imageRenderTime. But if **this picture is cross-domain and does not declare `Timing-Allow-Origin`**, it will fallback to imageLoadTime. At this time, LCP less than FCP will occur.

This situation is generally rare, but it has indeed occurred in actual business, and there are similar problems in the community (eg: [issues/260](https://github.com/GoogleChrome/web-vitals/issues/260)), so it is also a case of CORS affecting performance.

### 4. Font preload failure

The browser provides the `<link rel="preload" />` tag to preload resources, so font resources can also be preloaded.

First, let's talk about the necessity of font preloading. For a custom font, it is not to say that I declare the font resource link, it will initiate the font network request:

```css
@font-face {
  font-family: 'Quasari';
  src: url('https://fonts.cdnfonts.com/s/29552/Quasari.woff'); /* Will not request Quasari.woff resource */
}
h1 {
  font-family: 'Quasari';
}
```

Only when the browser actually typesets, it finds that there is an `h1` tag in the DOM, it will initiate a font resource network request, which leads to a late loading time, which may affect performance indicators such as FCP/CLS, so there is a need for preload font.

<br />

Because fonts also have cross-domain issues, when preloading, if the resource is cross-domain, you need to add the `crossorigin` attribute to do cross-domain identification, so that you can successfully hit the preload cache, up to here, it is actually as expected:

```html
<link rel="preload" href="cors.com/font.woff" as="font" type="font/woff" crossorigin />
```

<br />

But what's strange is that if the font resource is not cross-domain, you also need to add the `crossorigin` attribute, otherwise the cache still cannot be hit 😅:

<img src="https://image-1255652541.file.myqcloud.com/uPic/cors-perfs-font-preload-fail.png" alt="same-origin-font-preload-fail" width="60%" />



<img src="https://image-1255652541.file.myqcloud.com/uPic/cors-perfs-font-preload-success.png" alt="same-origin-font-preload-success" width="60%" />

This phenomenon has been present on Chrome for nearly 10 years, and related discussions can be seen in [this issue](https://github.com/w3c/preload/issues/32). It's hard for me to say whether this is a bug or a feature, but it's still the same in the current version 120. From my perspective, it's indeed quite tricky, and it doesn't quite match intuition from the API perspective.

<br/>

## Summary

As the gateway to the Web, security issues have always been of paramount importance in browsers. Some new features in recent years have taken security into account, such as:

- New API features must be called in an HTTPS environment
- The misuse of Cookies has been continuously curbed
- There are various CORS/CSP restrictions on resource loading issues
- ......

These measures are actually beneficial to user data security, but inevitably they cause troubles in debugging and performance for developers. This is also something we need to follow up and learn about in the long term.

<br/>

## References

- [LCP: load_time vs render_time](https://web.dev/articles/lcp#load_time_vs_render_time)
- [Web Font Downloaded Twice When Preloading](https://hyperborea.org/tech-tips/webfont-doubled/)
- [Preload: What Is It Good For? -- early loading of fonts](https://www.smashingmagazine.com/2016/02/preload-what-is-it-good-for/#early-loading-of-fonts)
- [w3c/preload: fonts and crossorigin](https://github.com/w3c/preload/issues/32)
- [CSS Fonts Module Level 4](https://drafts.csswg.org/css-fonts/#font-fetching-requirements)