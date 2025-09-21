---
slug: html-preload-scanner
title: ⚡️ [Performance] How the browser optimizes resource downloads with HTML Preload Scanner
authors: skychx
description: How the browser optimizes resource downloads with HTML Preload Scanner
tags: [Web Performance, network]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="html-preload-scanner-hero-image.jpg" w={1920} h={773} />

Hello everyone, I am skychx, specializing in performance optimization.

When doing web-related performance optimization, it is necessary to have a certain understanding of the underlying principles of the browser, so that the page can better walk on the happy path. Today, let's understand a browser default performance optimization scheme that is rarely known by people - `HTML Preload Scanner`, and see how it optimizes the loading speed of network resources.

{/* truncate */}

## How browsers parse CSS/JS resources


Let's briefly review how browsers "parse" main resources such as HTML/CSS/JS/Image.

HTML, as the entrance to the webpage, is definitely the first to be downloaded. After downloading, it will enter the stage of parsing line by line. When parsing to sub-resources, there are several classic situations:



**1.** If it is a CSS resource, you have to stop the parsing and rendering of HTML, and wait until the CSS is parsed & executed before parsing and rendering HTML.

Why do this? Suppose we load a line of CSS and render the page once. If we have such a CSS file:

```css
/* first rule */
p {
  font-size: 12px;
}

/* ... */

/* last rule */
p {
  font-size: 20px;
}
```

Parse and execute the first CSS rule, render immediately, and all fonts are changed to 12px; after 100ms, parse and execute the last rule, render immediately, and all fonts become 20px.

Not to mention the efficiency and performance issues of rendering immediately after parsing, this **flickering** issue of fonts getting bigger and smaller within 100ms will bring a very bad user experience (this official term is called [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content)).


the browser solves this problem by stopping the parsing and rendering of the content behind HTML when parsing CSS resources, and waiting for all CSS resources to be parsed before rendering together.

<br />

**2.** If it is a JS resource without async/defer, you also have to wait until JS is parsed & executed before parsing and rendering HTML.

This idea is similar to CSS, because this kind of JS resource may operate DOM, so you have to wait for JS to be parsed and executed. This is why there is a performance optimization rule that "put JS files at the end of the Body to prevent blocking rendering".

<br />

From the above, we can see that when it comes to rendering, you can only wait when you encounter CSS and JS, **but there is one thing that actually does not need to wait, that is the "download" of sub-resources**. If you have noticed, the content I discussed above is all about "parsing + rendering", and "download" is not mentioned.

Browser engineers discovered this phenomenon early on. Although some "parsing + rendering" behaviors are serial, "download" is not! The browser can download the downloadable content in HTML in advance, and then use it directly when it needs to be "parsed", which can greatly improve the performance indicators of the first screen.

This performance optimization scheme is called HTML Preload Scanner. Webkit introduced this technology in [2008](https://webkit.org/blog/166/optimizing-page-loading-in-web-browser/), which can be considered a standard feature of modern browsers.


## HTML Preload Scanner

 Let's talk in detail about how this feature works.

When the browser parses HTML, there are two parsers:

- One is formal, called `Primary HTML Parser`, which parses and runs line by line, and stops parsing HTML when it encounters blocking resources, until the blocking resources are loaded and run.
- The other is called `HTML Preload Scanner`, which directly collects all the sub-resources worth downloading in the current HTML, and then **downloads them in parallel**.

![Primary HTML Parser and HTML Preload Scanner](https://image-1255652541.file.myqcloud.com/uPic/a-diagram-both-primary-6691f9f670812.svg)

The two HTML Parsers work together to optimize the first screen performance of the webpage from the bottom up, bringing a better user experience.

How to observe whether the `HTML Preload Scanner` is working properly? At present, major browsers have not exposed this identifier, but as a Web developer, you can judge based on the Perfs flame graph.

If a webpage hits Pre-Scan, then a typical feature is that **JS/CSS/Img and other first-screen sub-resources will initiate requests simultaneously after the HTML request ends**:

![html-preload-scanner-pic](https://image-1255652541.file.myqcloud.com/uPic/html-preload-scanner.pic.jpg)

If the flame graph has similar features as above, it is generally hit.

## Improve Performance with Preload Scanner

Because the `HTML Preload Scanner` is a default feature of the browser, there is no need to consider compatibility issues. But because it is too basic and too low-level, many people don't know this feature, so it is difficult to optimize awareness, this section provides some optimization suggestions to assist everyone in using.

### Use Less JS to Dynamically Load Scripts

`HTML Preload Scanner`, as the name suggests, is an HTML Parser, **not responsible for parsing JS**. So, if there are some similar inline JS scripts in HTML:

```html
<script>
const scriptEl = document.createElement('script');
scriptEl.src = 'test.js';
document.body.appendChild(scriptEl);
</script>
```

This kind of inline JS script will be directly skipped by the `HTML Preload Scanner` and not parsed, which will cause test.js to not be discovered and downloaded in advance, and can only wait for the `Primary HTML Parser` to execute to the corresponding position to trigger the download/parse/run combo.

From the above idea, we can also think that if a webpage is a pure SPA page, all subsequent resources depend on the loading of main.js, it will actually have disadvantages in resource loading and rendering, and transforming into an SSR page will have better performance (it consumes server resources).

### Use Less CSS to Load Resources

Similarly, the `HTML Preload Scanner` will also skip the parsing of inline CSS content in HTML.

```html
<style>
.lcp_img {
  background-image: url("demo.png");
}
</style>
```

For the above CSS, the `HTML Preload Scanner` directly skips the parsing, and can only wait for the `Primary HTML Parser` to execute to this CSS position, and the parsing will trigger the download of demo.png, and the delay in timing will bring some degradation.

### Use Preload Flexibly

The business code is varied, and some resource files may need to be written in JS & CSS. If these resources are not important, you don't need to care, if these resources are more important, we can use a roundabout way, using the `<link rel="preload" />` tag to preload resources:

```html
<link rel="preload" href="demo.png" as="image" type="image/png" />
<style>
.lcp_img {
  background-image: url("demo.png");
}
</style>
```

For the above case, although the `HTML Preload Scanner` will skip the resources of inline CSS, it will download the preloaded resources marked by preload.

Of course, the problem with this solution is that preload will **increase** the priority of related resources. Under the constraint of the upper limit of network speed, it may squeeze the bandwidth of other resources, so this solution needs to do some quantitative performance analysis to prevent degradation.


### Don't Use HTML CSP Meta Tags

Some web pages, for security reasons, will add a [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) meta tag in HTML to prevent some XSS attacks.

```html
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self';">
</head>
```

This security policy has no problem from a business perspective, but it will **completely destroy** the optimization of the `HTML Preload Scanner`.

In the source code of chromium, there is such a logic:

```c++
// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/html/parser/html_preload_scanner.cc;l=1275;bpv=0;bpt=1

// Don't preload anything if a CSP meta tag is found. We should rarely find
// them here because the HTMLPreloadScanner is only used for the synchronous
// parsing path.
if (seen_csp_meta_tag) {
  // Reset the tokenizer, to avoid re-scanning tokens that we are about to
  // start parsing.
  source_.Clear();
  tokenizer_->Reset();
  return pending_data;
}
```

In other words, once the CSP-related meta tags are parsed, all Preload content will be cleared, and the Preload Scanner will be completely ineffective.

So, if we have CSP requirements and don't want to damage the HTML Preload Scanner optimization, what should we do? The solution is to **use the HTTP CSP Header**.

<br />

I did a few tests locally, the first one is a webpage without any CSP content, we can see that the Preload Scanner is working normally:

![normal](https://image-1255652541.file.myqcloud.com/uPic/html-preload-scanner-normal.jpg)

<br />

Adding the HTML CSP meta Tag, all parallel downloads have become serial loading, and the first screen performance has greatly deteriorated:

```html
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self';">
</head>
```

![html-csp-meta-tag](https://image-1255652541.file.myqcloud.com/uPic/html-preload-scanner-html-csp.jpg)

<br />

Switching to the HTTP CSP Header, the Preload Scanner is still working normally:

```http
Content-Security-Policy: default-src 'self'
```

![http-csp-header](https://image-1255652541.file.myqcloud.com/uPic/html-preload-scanner-http-csp.jpg)

<br />

So, we can replace the HTML CSP Meta Tag with the HTTP CSP Header solution to prevent Pre-Scan from failing.

## Conclusion

Writing HTML Preload Scanner-friendly front-end code can make the browser's resource loading go on the happy path, optimizing the overall resource loading performance of the Web.

## References

- [[web.dev]: Don't fight the browser preload scanner](https://web.dev/articles/preload-scanner)
- [[stackoverflow]: Content-Security-Policy meta tag preventing preload scanner to work properly in Chrome](https://stackoverflow.com/questions/78114535/content-security-policy-meta-tag-preventing-preload-scanner-to-work-properly-in)
- [[MDN]: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [[chromium]: html_preload_scanner.cc](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/html/parser/html_preload_scanner.cc)