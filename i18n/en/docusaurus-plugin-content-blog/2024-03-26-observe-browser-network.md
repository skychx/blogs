---
slug: observe-browser-network
title: ⚡️ [Performance] Three ways to observe network performance data in the browser.
author: skychx
author_title: skychx blog
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 「Chrome Devtools Network Timing Panel」VS「Chrome Devtools Performance Panel Network」VS「performance.getEntriesByType('resource')」
tags: [Web Performance, network]
---

import { HeroImage } from '../src/components/heroImage';

<HeroImage name="observe-browser-network-hero-image.jpg" w={1280} h={854} />


## Introduction

There are various ways to observe network performance data with the browser's Devtools tool, but these data are presented in different ways. This article is to interpret these performance data presentation methods and make a longitudinal comparison to help more people optimize the performance problems brought by the network.

<!--truncate-->

<br />

## Common Observation Methods

### ResourceTiming API

If you want to get the current page's network performance data at the runtime stage, [ResourceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing) is actually the only choice:

```javascript
performance.getEntriesByType('resource');
```

About the performance points obtained by this API, there is a very classic diagram:

![](https://image-1255652541.file.myqcloud.com/uPic/timestamp-diagram.svg)

I won't explain this diagram too much. From my personal point of view, this API is excellent, basically covering all links of network requests. This API can be roughly divided into two categories:

- Browser-related points: Service Worker and HTTP Cache
- Network-related points: DNS/TCP/TLS/HTTP, etc.

However, this API will return 0 for some data in cross-domain scenarios ([ResourceTiming API data loss](https://supercodepower.com/cross-origin-and-performance#2resourcetiming-api-%E6%95%B0%E6%8D%AE%E4%B8%A2%E5%A4%B1)), which needs to be noted.

<br />

### Network Panel: Timing

To observe network requests, the Network Panel is definitely the most commonly used debugging tool. In terms of performance data details, it is mainly observed through the Timing panel:

![devtools-network-panel-timing](https://image-1255652541.file.myqcloud.com/uPic/devtools-network-panel-timing.jpg)

<br />

Let me briefly introduce the meaning of each field in the Timing panel (actually, this part of the content is detailed in the documentation: [Timing Preview](https://developer.chrome.com/docs/devtools/network/reference#timing-preview))

- **Queueing**: Network requests are not sent as many as there are, there is a concept of a queue. Different priorities have different dequeue times, HTTP/1.1 also has a limit of 6 connections, which causes some later requests to queue in the queue, this is the time required for queuing
- **Stalled**: The request may have established a connection, but it may stop for various reasons
- **DNS Lookup**: The time spent on DNS addressing
- **Initial connection**: Can be simply understood as the time consumed by TCP connection + TLS connection; HTTP/3 is the time consumed by QUIC connection
- **SSL**: Time consumed by TLS connection
- **Request sent**: The time consumed by the browser to initiate the request, generally short and can be ignored
- **Waiting (TTFB)**: Time consumed by HTTP Request
- **Content Download**: Time consumed by HTTP Response

From the above content, it can be seen that the link behind DNS is in line with everyone's understanding of the "network protocol", and there is generally less controversy. Combined with the [MDN document](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing#typical_resource_timing_metrics), the following related equations can also be derived:

```javascript
// The points on the right are provided by the ResourceTiming API
DNS = domainLookupEnd - domainLookupStart
TCP = connectEnd - connectStart
TLS = requestStart - secureConnectionStart
HTTP_Request = responseStart - requestStart
HTTP_Response = responseEnd - responseStart
```

<br />

The previous **Queueing** and **Stalled** stages are highly related to the browser, and there is a lot to it.

First of all, for ordinary developers, you cannot directly obtain the related time consumption through the `ResourceTiming API`, you can only simulate Queueing + Stalled through the following code:

```javascript
Queueing + Stalled = Math.min(domainLookupStart, connectStart, secureConnectionStart, requestStart) - startTime
```

So what is the dividing point between Queueing and Stalled? This point is not provided by the `ResourceTiming API`. In the source code of Devtools, this point is issueTime, and Queueing will appear when issueTime exists and is less than startTime.

```javascript
// devtools-frontend/front_end/panels/network/RequestTimingView.ts

// Queueing scenario, issueTime is less than startTime
if (issueTime < startTime) {
  addRange(RequestTimeRangeNames.Queueing, issueTime, startTime);
}

// Blocking is Stalled
const blockingEnd = firstPositive([timing.dnsStart, timing.connectStart, timing.sendStart, responseReceived]) || 0;
addOffsetRange(RequestTimeRangeNames.Blocking, 0, blockingEnd);
```

This point is provided by the kernel, but it is not exposed to the upper layer API, only Devtools consumes it. Therefore, when optimizing resource performance, you can look at **Queueing** and **Stalled** together. If this part of the time consumption is long, the possible reasons and solutions may be as follows:

- If it is the "HTTP/1.1 six connections" limit, you can try to upgrade to HTTP/2, or adopt some common resource means
- If it is caused by "low resource request priority", you can try to increase the request priority
- If it is "main thread busy" causing asynchronous requests to be delayed, you can try to optimize the main thread longtask
- If it is "browser internal resource allocation scheduling time consumption", it is generally for allocating disk space, reading disks and other internal operations, it is difficult to participate in optimization

As for the optimization of pure network request related stages, there are many articles on the market, so I won't elaborate, everyone can check it out for themselves.

<br />



### ### Performance Panel: Network

Another place to observe Network details is the Network Channel of the Performance Panel, where you can see all the network request information of the current page.

![devtools-perfs-panel-network-channel](https://image-1255652541.file.myqcloud.com/uPic/devtools-perfs-panel-network-channel.jpg)

The network waterfall in the picture is a variant of the box plot, which is different from the original concept of the box plot in statistics. Here, it **just borrows the shape**, so it needs to be re-understood.

First, let's take a simple look at the colors, which are mainly divided into 5 categories:

- Blue: Represents HTML
- Purple: Represents CSS
- Yellow: Represents JS
- Green: Represents Media resources, such as images/videos/fonts
- Gray: Other requests, such as fetch, xhr

<br />

Next, let's analyze the shape:

- The thin line on the left: All the time from startTime to requestStart
- Light-colored box: Represents Request time
- Dark-colored box: Represents Response time
- The thin line on the right: The resource has been downloaded, but the main thread is too busy to consume it, waiting time

This should be represented in code as follows:

```javascript
// 右侧的点位为 ResourceTiming API 提供
Left_Line = requestStart - startTime // Queueing + Stalled + DNS + TCP + TLS
Dark_Bar = responseStart - requestStart // Request
Dark_Bar = responseEnd - responseStart // Response
Right_Line // waiting to be used
```

From the above, it can be seen that the "thin line on the left" contains a lot of information and swallows a lot of details; the "thin line on the right" currently belongs to the running details of the browser, and there is no API exposed for the front end to use.

The specific optimization methods are similar to those mentioned above, but it is worth noting the thin line on the right, which is mostly due to the main thread having longtask blocking the consumption of resources, and the focus needs to be placed on longtask.

<br />

## Similarities and Differences of Various Methods

From the above, it can be seen that there are many commonalities and differences in the three methods of observing network performance data. I made a picture, and you can see the similarities and differences at a glance:

![chrome_devtool_network](https://image-1255652541.file.myqcloud.com/uPic/chrome_devtool_network.png)


:::caution Note
- This figure does not consider Redirect/Service Worker/HTTP Cache scenarios
- This figure does not consider HTTP/3 and TCP Fast Open scenarios
:::

<br />

## Conclusion

When optimizing network-induced performance on a daily basis, only by fully understanding and mastering related debugging tools can problems be quickly and accurately located and solved.

<br />

## References

- [ResourceTiming API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing#typical_resource_timing_metrics)
- [Chrome Network Panel: timing](https://developer.chrome.com/docs/devtools/network/reference#timing-preview)
- [Chrome Performance Panel: network](https://developer.chrome.com/docs/devtools/performance/reference#network)