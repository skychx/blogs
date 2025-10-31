---
slug: svg-img-use-font
title: 🖼️ How to solve the problem of missing fonts in SVG images
authors: skychx
description: How to solve the problem of missing fonts in SVG images
tags: [Web, SVG]
---

The solution to fixing "**Font missing in SVG image**" is simple. If you just want to see the answer, you can skip to the end. If you want to see my troubleshooting process and specific reasons, you can read from the beginning.

{/* truncate */}

## Cause or reason

Recently, while working on a project, I used SVG to display some images in order to balance the size and clarity of the images. However, I encountered a strange phenomenon where **the fonts inside the SVG became invalid during actual usage**.

| Actual display | Expected display |
| ------- | ------ |
| ![svg_lose_font](https://image-1255652541.file.myqcloud.com/uPic/svg_lose_font.png) |![svg_with_font](https://image-1255652541.file.myqcloud.com/uPic/svg_with_font.png) | 


When problems arise, I need to solve them. First, let's check the code to see if I can identify the issue.

The way the code references the SVG is straightforward. The HTML directly uses the img tag to reference the SVG content (the SVG file and the HTML are in the **same domain**, so there is no cross-domain issue):

```html
<p>...</p>
  <img src="/static/skychx.svg">
<p>...</p>
```

```html
<!-- As you can see, the SVG uses the Inter font, which is not a Web-safe font -->
<svg>
  <text x="0" y="15" fill="#F2F2F2">skychx Inter Font</text>
</svg>
```

Since I am using a non [Web-safe font](https://www.cssfontstack.com/), I suspect that the font may not have been downloaded. Therefore, I added a preload tag in the HTML (note that the font and the HTML SVG are in the **same domain**, so there is no cross-domain issue):

```html
<head>
  <link rel="preload" href="/static/Inter.woff2" as="font" type="font/woff2" crossorigin>
</head>
```

After doing these preparations, the font still did not work.


## Troubleshooting:

At this point, I realized that it might be hitting some strange browser security restrictions. For example, SVGs referenced by external links cannot share the fonts downloaded in the HTML (in fact, this guess is very close to the truth). So, I tried a different approach and declared the font in the SVG file (note that the SVG and font at this point still belong to the **same domain**, so there is no cross-domain issue):

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

After declaring the font internally, a strange phenomenon occurred:

- The font did not work when the SVG was referenced by the img tag in the HTML as an image file.
- The font worked when the SVG was opened separately in the browser.

To rule out any path interference, I even changed the font URL to an absolute path, such as Google Fonts, but the behavior was still the same.

## Ask ChatGPT

If you encounter a problem, why not ask the magical ChatGPT? In my opinion, this is a relatively common problem, and it should be able to provide a good answer (although it turned out that this problem led me on a two-hour detour, but that's another story).

ChatGPT gave many possible answers, including:

- Is the font format correct?
- Is the reference path correct?
- Is there an error in the code?
- Is there a cross-domain issue?

After multiple rounds of questioning and attempts, the answer always returned to browser security. After ruling out the first few possibilities, ChatGPT was very certain that it was a cross-domain issue and repeatedly suggested that I check for cross-domain issues.

At this point, I stopped and thought for a moment. According to common sense, if there is a cross-domain issue, Chrome will generally request the source, but will block the response on the browser side, and will also log the cross-domain error in the Chrome Devtool Console panel. However, none of these phenomena were present, and I also confirmed multiple times that these resources belong to the same domain, so there should not be a cross-domain issue.

## Finding the cause:

Since ChatGPT couldn't provide an answer, I turned to Google. After entering the keywords, the first StackOverflow post answered my question:

https://stackoverflow.com/questions/30466610/svg-doesnt-use-font-when-inside-html

It provided the reason and solution: for browser security, browsers do not allow SVGs referenced by img tags to initiate network requests. Embedding the font in the SVG in base64 format can solve this problem. According to the replies in the post, this solution is indeed effective.

<br />

This answer only provides a solution, but does not give a first-hand source of information to explain "why". After some further searching, I found the relevant explanation from W3C: [SVG Security - W3C Wiki](https://www.w3.org/wiki/SVG_Security), which clearly states:


> Markup languages like HTML (and SVG itself) can reference SVG as an image with the `<img>` tag (HTML namespace) or `<image>` tag (HTML or SVG namespace).
>
> If an SVG file is fetched as image, then certain requirements apply to this document:
>
> **Fonts shouldn't be loaded as well**.


## Solving the problem

After finding the cause, I need to solve the problem. Currently, there are two mainstream solutions:

- **font rasterization**: Export text as a path format, which can preserve the outline of the font. The disadvantage is that as the text increases, the size of the SVG file will also increase linearly, and the path will look messy, making it difficult to maintain and modify.
- **font embedding**: Embed the font file in base64 format into the SVG. The disadvantage is that the size will increase significantly (the font file itself is relatively large, and converting it to base64 format will increase the size).


:::tip
When exporting a file as an SVG in **Figma**, checking the "Outline Text" option will export the text as paths, while unchecking it will export the text as text.
:::

<br />

Fortunately, I did some related searches and found a good free SVG compression tool: [nano](https://vecta.io/nano), which perfectly solved my problem.

In their [blog post: Making SVG Easier to Use and the Reason We Built Nano](https://vecta.io/blog/making-svg-easier-to-use), they provided a more detailed comparison of the two solutions mentioned earlier. Here are some interesting points:

With font rasterization, in addition to the issue I mentioned earlier, there is another problem where the font cannot be optimized by the operating system/browser specifically for the font, especially on low-resolution screens. This can lead to font clarity issues, and the most obvious feeling is that the font appears fuzzy:

![broken-fonts](https://image-1255652541.file.myqcloud.com/uPic/broken-fonts.png)

<br />

The issue of increased file size due to **font embedding** can be solved by font clipping.

Nano first analyzes the text/font/weight used in the SVG file, and then clips the font accordingly. Finally, the clipped font is converted to base64 and embedded in the SVG.

For example, if you only use the "skychx" 6 characters of the Inter font, it will clip the Inter font and only take out the font used for the 6 characters. Other letters and font weights will be clipped, and finally the clipped font will be converted to base64. This significantly reduces the font size.

Here is a demo provided by them:

![teams-nano](https://image-1255652541.file.myqcloud.com/uPic/teams-nano.svg)

The table below provides a detailed comparison of the file size for the same resource image using different solutions:

|          | Original | Font rasterization | Unoptimized font embedding | Nano font embedding |
| -------- | -------- | ------------------ | -------------------------- | ------------------- |
| **size** | [18.1KB](https://vecta.io/blog/making-svg-easier-to-use/teams-original.cd836e5441.svg)   | [106KB](https://vecta.io/blog/making-svg-easier-to-use/teams-outline.29d77b3e3f.svg)              | [71.3KB](https://vecta.io/blog/making-svg-easier-to-use/teams-embed.7bf5434b27.svg)                     | [20.1KB](https://vecta.io/blog/making-svg-easier-to-use/teams-nano.370efe45b3.svg)              |
| **gzip** | [4.03KB](https://vecta.io/blog/teams-original.gz)   | [13.3KB](https://vecta.io/blog/teams-outline.svgz)             | [44.3KB](https://vecta.io/blog/teams-embed.gz)                     | [12.2KB](https://vecta.io/blog/teams-nano.svgz)              |

<br />

The file size of the same image exported in PNG format at different resolutions is as follows:

|          | PNG @1X  | PNG @2X            | PNG @3X                    |
| -------- | -------- | ------------------ | -------------------------- |
| **size** | 38.9KB   | 95.7KB             | 171KB                      |
| **gzip** | 38.2KB   | 88.6KB             | 153KB                      |

:::tip
In practical projects, image formats such as JPG/PNG are already compressed, so compressing them again with gzip has very limited effect. Moreover, it actually has a negative impact due to the consumption of CPU computing power.
:::

<br />

The above demo shows that SVG images have a significant advantage in terms of file size.

In practical use, an SVG file of around 18kb, if using font rasterization, would expand to about 100kb, which is similar to PNG; if using nano optimization, the overall size would be around 20kb, with only a small increase in size.

As seen above, after solving the issue of embedding fonts, SVG still has great advantages as an image format.

## Conclusion

The reason for the issue of "**font invalidation in SVG images**" is that, for [security reasons](https://www.w3.org/wiki/SVG_Security) in web browsers, when an SVG is referenced by the HTML `<img>` tag, external fonts referenced within the SVG are not downloaded and not used (except for fonts built into the browser itself), resulting in the issue of personalized fonts not working.

Currently, the best solution is to use a tool like [nano](https://vecta.io/nano) to handle font embedding, ensuring normal display of the image while also maintaining a small file size.