---
slug: the-cost-of-javascript
title: ⚡️ The Cost Of JavaScript (2017 - 2023)
authors: skychx
description: The Cost Of JavaScript (2017 - 2023) | JavaScript Performance Optimization Journey
tags: [Web Performance]
---


import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="ybsbny.png" w={1800} h={766} />


## Rant Time

I don't know when it started, but frontend development began to compete on "high-end knowledge," constantly bringing up **browser underlying principles** and **how V8 works**. It's not that these topics are useless, but the trend suggests that if you don't understand these things, you can't even build a simple webpage.

In my work, I've collaborated with kernel teams and VM teams and consulted them about these related issues. Their attitude is very clear: when facing large-scale engineering projects with tens of millions of lines of code, even as professionals, they don't understand everything. If you happen to meet someone who truly understands everything, they definitely wouldn't be doing frontend work. This makes the "eight-part essay" battles between interviewers and candidates seem ridiculous.

So if you really encounter scenarios that require learning related knowledge, or you're simply personally interested in understanding the principles and details, what's the best approach? It's simple: directly read **the blogs or talks from relevant teams or core developers**. This is first-hand information, aside from the source code itself, and the quality is much higher than those second-hand dealers.


{/* truncate */}

<br />

## The Cost Of JavaScript

![the-cost-of-js](https://image-1255652541.file.myqcloud.com/uPic/the-cost-of-js.webp)

Today's title is **The Cost Of JavaScript**, which is the main title of a blog series by author [Addy Osmani](https://addyosmani.com/). As of this year, he has written 4 articles in total, exploring how to optimize JavaScript execution costs from the perspectives of developers, kernel, and frameworks.



Who is Addy Osmani? He has worked at Google for 11 years and is the engineering lead for Google Chrome's Developer Experience organization (Chrome DX department). This title is quite substantial.

> I am the engineering lead for Google Chrome's Developer Experience organization. Our projects include Chrome DevTools, Lighthouse, PageSpeed Insights and Chrome User Experience Report, Aurora and WordPress Performance. We recently shipped User Flows for DevTools and Lighthouse!
>
> — https://addyosmani.com/



Without further ado, let me directly introduce what this blog series is about.


<br />



### 2017

Blog link: https://medium.com/dev-channel/the-cost-of-javascript-84009f51e99e

This article is the first in the **The Cost Of JavaScript** series, mainly introducing a concept and revealing that the parse + compile + execution costs of JavaScript in browsers are still quite high (for frontend developers, this is most intuitively reflected as `long tasks`). Developers need to pay attention to and optimize this time consumption.



This blog has a very interesting case that compares the parsing time of JS scripts and images of the same size. Because the volumes are the same, the network time consumption is the same. However, the parsing and rasterization time of a JPG image is less than 0.1s, which is basically imperceptible to the human eye; but the Parse + Compile + execution time of JS code adds up to 3.5s, a difference of dozens of times, making the contrast very obvious.

![img](https://image-1255652541.file.myqcloud.com/uPic/1*PRVzNizF9jQ_QADF5lQHpA.png)




The ways to reduce JS parsing and execution costs are also quite simple: `preload`/`tree shaking`/`minify`/`code split`. Looking from the 2023 perspective, these solutions now have relatively mature implementations, and both emerging and established frameworks have made related explorations in these capabilities, so I won't elaborate further.


<br />

### 2018

Blog link: https://medium.com/@addyosmani/the-cost-of-javascript-in-2018-7d8950fbb5d4



This article can be said to be a **JS optimization guide completely focused on frontend developers**. The first half lists various data showing how much JavaScript affects user experience, while the second half introduces some JS optimization techniques. In my opinion, these are optimizations that have been overused in domestic articles:

- minify/compression/cache
- tree shaking/code split/lazy load/code coverage
- preload/web worker/serive worker
- ......

For specific details, please refer to the original article; I won't elaborate further.


<br />



### 2019

Blog link: https://v8.dev/blog/cost-of-javascript-2019



This article is relatively more in-depth. As you can tell from the blog publishing website, this is optimization from the **kernel/V8** perspective. For frontend engineers, the operational aspects will be smaller, but it's still helpful for understanding the principles (such as understanding various performance flame graphs). Below, let's take a quick look at their work.

<br />

#### 1.Script Streaming

The first optimization is `Script Streaming`, which functionally translated (not literally) should be called "streaming loading and compilation".

First, some prerequisite knowledge. Due to the characteristics of UI systems, UI update logic must be executed on the main thread (UI thread), which means script execution, but the preceding parse + compile can be executed in parallel across multiple threads. So browsers have long had an optimization: for script files marked with `defer` or `async`, browsers can enable multi-threaded compilation capabilities to optimize the time the UI thread is blocked.

<br />

Based on this optimization background, Chrome made some further optimizations, which is streaming compilation. The final effect is that network streaming directly connects to streaming parsers, greatly increasing efficiency.

How to understand this? It's like getting water from inside the house to the yard:

- Initially, you fill a bucket with water inside the house, then carry it to the yard, and you only have one bucket to carry water (JS code's parse + compile + execution all execute on the UI thread)
- Later, you bought several more buckets and can carry water in parallel (using multi-threading capabilities for parse + compile, finally consumed by the UI thread uniformly)
- Filling buckets one by one and moving them around is too troublesome, so you directly bought several long water pipes, connected them, and directly transmit water to the yard (Chrome's optimization, network streaming directly connects to streaming parsers, fully utilizing CPU time)



The final actual effect is shown in the figure below, greatly reducing the waiting time of background compilation threads and enhancing performance:

![script-streaming](https://image-1255652541.file.myqcloud.com/uPic/script-streaming.png)

<br />

#### 2.JSON Parse

JSON parsing is faster than object parsing (this is obvious, JSON syntax is much simpler than object syntax, so parsing costs are much lower). Google suggests that JSON larger than 10KB can try this optimization:

```javascript
const data = { foo: 42, bar: 1337 }; // 🐌

const data = JSON.parse('{"foo":42,"bar":1337}'); // 🚀
```



Actually, from Google's suggestions, it can be seen that in most cases, there's no need to be overly concerned about this part of performance. Node backend scenarios might encounter this, and frontend large data management libraries might encounter it (such as a very large Redux state object), but in other scenarios, there's no need to reduce code maintainability for this bit of performance.

<br />

#### 3.Code Caching

This part is about Chrome's Code Caching. It's essentially a type of cache. For example, the caches we most commonly encounter are network resource caches based on HTTP Cache Headers, namely memory cache and disk cache. These two mainly cache HTTP responses, and when hit, they can save network request time.

Code caching is actually a type of disk caching in the broad category, but what it caches is not the HTTP response, **but the bytecode after JavaScript files are parsed + compiled**. So if code caching is hit, the time for network + parse + compile is all saved, and you can directly execute.

However, the hit conditions for code caching are relatively strict. The same resource needs to be hit twice within the first 72 hours, and then only on the **third request** will code caching be hit. For more detailed knowledge on this, I recommend directly reading V8's series of blogs on code caching.

![](https://image-1255652541.file.myqcloud.com/uPic/code-caching@2x.png)



<br />

### 2023

YouTube link: https://www.youtube.com/watch?v=ZKH3DLT4BKw&t=0s



Perhaps due to the pandemic, this series of talks was interrupted for 3 years, but it resumed this year.

The first part of the talk is still some statistical data, the middle part is about general optimizations, similar to the 2018 content. The latter part introduces some frameworks and new technologies that have been popular in the past two years. Let me list them for you:

- Astro/Qwik
- Route & Component Based Code Spliting/Import On Visibility
- Islands Architecture
- Partial Hydration/Progressive Hydration/Resumabilty Hydration/Selective Hydration
- React Server Components
- Streaming Server Rendering



I'll ask you, aren't you scared? (doge). These technical contents are all about breaking things into smaller parts to reduce `long tasks` of JS on the browser side. For example, the most primitive Hydration is full execution, leading to consistently high TTI, so frameworks have been working on a bunch of Hydration solutions to optimize in the past two years.



These contents were only introduced for about 10 minutes in the original video, but to understand the meaning of each thing, you need to read more than a dozen related blogs. If you're interested, you still need to collect materials and understand them yourself.



<br />

## Summary

Looking at these 4 blogs overall, the content is quite substantial. Using this series as a starting point and expanding, you can actually collect a lot of good things, which are very helpful for practical development and broadening horizons.

The Web raised the ceiling because of JavaScript, but developers need to improve UX by reducing JavaScript execution. This back and forth creates work, so thank you JavaScript for providing our livelihood 🙏.


<br />

## Blog Recommendations

This article mainly recommends Addy Osmani's personal website [addyosmani.com](https://addyosmani.com), which has a lot of interesting content that everyone can explore; another interesting content is V8's blog: [v8.dev/blog](https://v8.dev/blog), don't read those domestic performance optimization articles that have been chewed over several times, it's much better to read first-hand information directly.




