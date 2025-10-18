---
slug: no-measure-no-optimization
title: ⚡️ [Performance Optimization] No Measure, No Optimization
authors: skychx

description: How to solve font failure issues in SVG images
draft: true
tags: [Web Performance]
---


Today's title sounds very translated. When I had the idea for this blog post, the title that subconsciously came to mind was **"No Measure, No Optimization"**. The direct translation doesn't sound good, and ChatGPT's suggestions were also mediocre. Anyway, just get the gist of it.

{/* truncate */}

Two days ago, I discussed some performance optimization issues with several experts. We shared many cases of "furious optimization like a tiger, only 0.05% performance gain." After comprehensive consideration, this blog post was born.



When I look at performance-related articles in the community, I always see these two major schools of thought:

- One is **"virtual enemy seeking"** - either researching which of the 4 ways to write a for loop performs better, or researching whether variables are on the heap or stack. Even microcontroller developers aren't so nitpicky.
- The other is **"list collection"** - listing a bunch of performance optimization todo items, each of which seems reasonable, getting lots of likes and bookmarks. But when you actually try to practice them, you find that few are useful.



These two schools actually make the same mistake. The former tries to guide performance through **theoretical analysis**, while the latter tries to guide performance through **experience summary**. But everyone knows that "drawing a sword to mark a boat" and "drawing a tiger like a cat" can't solve all problems. In the direction of performance optimization, the most important thing is still ***MEASURE, MEASURE, MEASURE***.



Let me give a few counter-intuitive examples to talk about the importance of measurement and data monitoring in performance optimization.






### Are Offline Packages Always Faster?

In the best practices of mobile H5 performance optimization, offline packages are always a VIP guest.

The principle of offline packages is also very simple: when a webpage initiates a network request, the mobile client intercepts the WebView's request and redirects it to the already downloaded local resources. This can convert the average 100-200ms Network IO to 10-20ms File IO, greatly optimizing resource request time and improving first-screen performance.

In 95% of cases, offline packages can indeed greatly improve overall performance levels. But with more traffic and more business, you'll always encounter some unusual things.



#### Thread Pool Queuing

When helping a certain business troubleshoot issues, after enabling offline packages, the performance on Android was not satisfactory, and network time didn't improve much. Looking at request data in Chrome DevTools Performance Panel, I found a stable Queue time for various network requests. Then I tried to locate and fix the problem purely on the frontend, but after a busy day, there was no progress.

Later, I had a flash of inspiration and felt the problem might not be related to frontend issues, so I pulled the client's performance data. When comparing the two sets of data, I discovered that because this business entered early and all network requests were completely handed over to Native, Native was busy at this time, and the thread pool was completely full. So the webpage's network requests were all queuing up, and finally, the queuing time was greater than the network request time, so the benefit wasn't very significant.





#### Process Communication

After talking about Android, let's talk about iOS.

Now iOS only uses one type of WebView: WKWebView. Its characteristic is that it occupies an independent process, unlike UIWebView which competes for resources with the APP's main thread. There are many benefits, such as lower overall memory usage and greatly reduced crash probability, but with offline packages, it might actually cause performance degradation.

The main reason for degradation is the cost of cross-process communication. If you don't use offline packages, all network requests are scheduled in the network thread of the WKWebView process, and context switching will be relatively lightweight. If you use offline packages, it becomes the following process:

```
WKWebView initiates network request -> Main process intercepts request and reinitiates -> Passes resource back to WKWebView process
```

Here there are two cross-process communications. If the main process is busy, one of the manifestations is again Queue time process, which will finally cause offline packages to degrade performance.






#### Code Caching

The first two were Native-related. This time, let's talk about one related to the WebView kernel.

This case was introduced to me by @777. After implementing offline packages, through data monitoring, one of their projects directly degraded. The final reason was quite bizarre - it was caused by the failure of the browser's built-in code caching cache.



First, let me introduce the project background. The project only has two JS bundles, but the JS bundles are particularly large. Normally, the larger the bundle, the more network time is saved by offline optimization, so why did performance degrade instead?

Actually, in the entire lifecycle of a script, network requests are just the most preliminary step. After the browser downloads JS, the JS engine still has three processes: parse, compile, and evaluate. Generally, the larger the JS bundle, the longer these three processes take.

Browser developers also realized this problem, so they internally cache the parse & compile results of JS scripts (i.e., code caching). The general process is as follows:

- First visit: Get resources from the network, store the resource source files on disk (disk cache), then execute the parse/compile/evaluate 3 processes
- Second visit: Get source files from disk cache, and cache the bytecode files obtained from parse/compile
- Third visit: Directly get bytecode to use, saving the time of network/parse/compile 3 processes (has an AOT flavor)



The reason offline packages degrade performance is that enabling offline interception will break steps 1 and 2 above, which prevents code caching from being generated. In this trade-off (especially in scenarios where network speed is good and JS bundles are relatively large), enabling offline packages actually degrades overall performance.



The three examples above are real counterexamples of "experience first." Now let's talk about an example from the theoretical school.



### The Legendary 14KB HTML

https://www.tunetheweb.com/blog/critical-resources-and-the-first-14kb/

I forgot this one




- Do some size optimization techniques really bring significant performance benefits to final performance?
  - The myth of 14KB HTML, theoretical values aren't practical values, mostly not worth mentioning
  - Hard-earned reductions aren't as good as managing node_modules (focus on the big picture, let go of the small)
  - Why not trust gzip?
- Does lazy loading images always bring benefits?
  - Lazy loading hero images can actually cause LCP degradation






### Blog Introduction