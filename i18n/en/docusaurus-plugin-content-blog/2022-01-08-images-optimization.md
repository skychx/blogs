---
slug: images-optimization
title: ⚡️ How I Reduced My Personal Website's Image Service Costs by 90%
authors: skychx
description: ⚡️ How I reduced my personal website's file storage costs by 90% (the optimization effect is so obvious because I never optimized before)
draft: false
tags: [Web Performance]
---

I didn't write much in 2021, so I wanted to start 2022 on a good note by writing some simple content first, recording how I reduced my personal site's file storage costs by **90%**.

{/* truncate */


## Service Selection

I started writing articles about three years ago, and at that time there was a very practical problem: **I didn't know where to upload images**.

Previously, most people would host images on Sina's image hosting service, but Sina had enabled authentication operations (restricted by referer), so images wouldn't display on non-Sina sites. Although this could be bypassed through empty referer, it wasn't a long-term solution. Additionally, some people hosted images on GitHub or Gitee, but due to network speed and capacity limitations, this wasn't the optimal choice either.

After some research, I discovered that I could actually use the file storage services from major cloud providers, and the costs weren't expensive. Since I couldn't understand Alibaba Cloud's file storage documentation, I chose Tencent Cloud's COS file storage service.

After settling on the storage service, it was time to pick a suitable client. There are many image hosting clients on the market:

| Name | Is Free | Cross-Platform | App Size |
| ---- | ---- | ---- | ---- |
| [iPic](https://toolinbox.net/iPic/) | No | Mac only | Small |
| [uPic](https://blog.svend.cc/upic/) | Yes | Mac only | Small |
| [PicGo](https://molunerfinn.com/PicGo/) | Yes | Electron-based, cross-platform | Very large |

I chose the free and lightweight **uPic**, which perfectly meets my image upload needs.

<br />

## Problem Emergence

After configuring my personal image hosting service, it was seamless for about two years. Last month, I noticed that this year's traffic costs had doubled, so I thought about optimizing the images to reduce some costs.

First, I analyzed my articles and tutorials. The main traffic contributor was my "[Web Scraper Tutorial](https://www.cnblogs.com/web-scraper/)", with an estimated 800,000 reads across the entire network. 80% of image requests would hit my COS origin server, causing traffic costs.

After investigation, the main consumption channels for COS traffic were three places:

- **CNBlogs**: CNBlogs doesn't support directly converting images in md files to CNBlogs public links. At that time, for convenience, I directly used COS links
- **少数派 (sspai)**: The editor capabilities are weak and don't support automatic conversion to public links, so COS links were also used
- **Personal Blog**: Traffic is small and can be ignored

After finding the problem, we can optimize step by step.

<br />

## Optimization 1: Referrer Authentication

This optimization was done relatively early, about a few months after using COS. Because after publishing articles for a while, I found that many original articles were being "scraped" by site groups for SEO optimization.

This kind of thing cannot be completely stopped, but for me, these sites all create bandwidth and cost pressure on my image COS service. After weighing the pros and cons, I decided to learn from Sina Weibo's image hosting approach and restrict access permissions:

- Only allow domains on the **whitelist** to request images
- Further, **restrict empty referrer requests**, because many SEO scraping sites configure `<meta name="referrer" content="noreferrer">` in HTML to bypass authentication through empty referer

After enabling referrer authentication, I observed that traffic decreased to some extent, and there were many more 403 error codes, indicating that the interception was effective. However, since this was handled a long time ago, I forgot the specific benefits.

<br />

## Optimization 2: Compress Images

After the referrer optimization, I didn't handle images for a long time (about a year and a half). At the end of 2021, I found that the fixed traffic package I bought would be used up by the middle of each month. The fastest way to reduce traffic usage is to **compress images**, so I did the following work:

### 1. Tinify Compression

Here I used the [tinify.cn](https://tinify.cn/) website. Personally, I think its quality is the highest, and it supports applying for a [developer API](https://tinify.cn/developers) with 500 free images per month. I calculated that there are 450 images on COS in total, which is within the quota, so I started compressing without hesitation.

The final compression results are as follows:

| Before Compression | After Compression |
| ----- | ----  |
| 111MB | 75MB  |

Overall, it only reduced the size by **33%**, but the actual compression ratio is higher, about **60%** savings, because tinify doesn't support GIF compression, and among the 450 images, there are quite a few GIF images, which pulled down the data.

To control variables, after compressing the images, I observed for 1 week. The data effect was still very obvious. With the daily request count (around 7000) unchanged, traffic consumption decreased by about **40%**:

![2021-12-26_13-18-47_tinify_compress](https://image-1255652541.file.myqcloud.com/uPic/2021-12-26_13-18-47_tinify_compress.jpg)


After seeing the relevant data, I wanted to further reduce image size, so I made the following attempts.

### 2. Gzip Compression

After enabling HTTP Gzip compression for images, I found the effect was not very good, with almost **0** size benefit.

Later, I thought this was normal. PNG and JPG are actually compressed files, and compressing already compressed files generally doesn't show obvious benefits. Since compression also consumes server resources, I disabled Gzip compression for images.

### 3. Transfer GIF Image Sources

PNG and JPG images can reduce traffic consumption through compression, but since GIF images cannot be compressed, let's "transfer the payment"!

I replaced all GIF images in my CNBlogs articles with CNBlogs' CDN, and the effect was very obvious. Requests decreased by **15%**, and traffic consumption decreased by **50%**:

![2022-01-08_20-50-39_remove_gif](https://image-1255652541.file.myqcloud.com/uPic/2022-01-08_20-50-39_remove_gif.jpg)

For the 少数派 website, since it's in text editor mode, the operation is more cumbersome, so I didn't replace them for now.


### 4. WebP Online Conversion

Some images I later migrated to CDN, and Tencent's supporting CDN service supports intelligent conversion to `webp`. After enabling the service, I tested several images, and it could reduce size by another **30%** or so, but because the CDN deployment volume is small, the overall benefit is not very obvious yet.

<br />

## Optimization 3: CDN Acceleration

COS actually has a supporting CDN service, but I never enabled it before. This optimization顺便 enabled it, and then I fell into endless regret—**why didn't I enable it earlier 😭**.

After enabling CDN service, the biggest benefit was that loading speed directly **decreased by an order of magnitude**. Previously, images were all requested from the COS origin server, with each image response speed around **200ms-300ms**. After enabling CDN, it directly dropped to **20ms-30ms**, and even in degraded cases, it could stay within **100ms**:

![2022-01-09_12-57-21_CDN](https://image-1255652541.file.myqcloud.com/uPic/2022-01-09_12-57-21_CDN.jpg)

<br />

After enabling CDN acceleration, another unexpected benefit was that my blog's Lighthouse scores all **approached perfect scores**. I have to say that the docusaurus documentation framework is really well-optimized, CDN is really great.

![2022-01-08_19-54-47_lighthouse](https://image-1255652541.file.myqcloud.com/uPic/2022-01-08_19-54-47_lighthouse.jpg)

<br />

## Summary

At this point, my image optimization is complete. Overall, traffic costs have decreased by **90%**. Looking at it overall, the optimization ideas are not difficult—they're all obvious knowledge. The benefit is so large mainly because I never optimized before 🌚.

Actually, I could continue iterating later, such as replacing all image links in old articles with CDN links, enabling site-wide HTTP2, etc. But since the benefits are already very obvious at this point, the marginal effect of further optimization is too small. It's not too late to optimize when we encounter the next bottleneck.

<br />

----

Personal WeChat: **egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note A Little Postscript
Welcome to follow the official account: **卤代烃实验室 (Halogenated Hydrocarbon Lab)**: Focusing on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::