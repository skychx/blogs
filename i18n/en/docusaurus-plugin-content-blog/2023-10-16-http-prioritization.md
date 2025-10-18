---
slug: http-prioritization
title: 🪢 [Network Protocol] A Brief Discussion on the Evolution of HTTP Priority Algorithms
authors: skychx
description: A brief discussion on the evolution of HTTP priority algorithms: HTTP/1.1 had none, HTTP/2 was too complex, HTTP/3 returned to simplicity
draft: false
tags: [Web Performance, network]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="http_%20prioritization_hero_img.jpg" w={1280} h={853} />



A couple of days ago on "Jike," I spontaneously wrote a brief history of HTTP priority development. I felt it was too rushed at the time, so I decided to write a blog to expand on it, analyzing the concept of "priority" longitudinally to see the development and evolution of these fundamental protocols.

<br />

{/* truncate */}

Before we dive in, let's list a timeline first, which will give you a more intuitive understanding of the following content:

- 1997: After several years of iterations, HTTP/1.1 was finalized. With the development of browsers, the internet era began
- 2015: HTTP/2 was released, focusing on solving performance problems and adding a bunch of features. To date, [35.5%](https://w3techs.com/technologies/details/ce-http2) of websites worldwide use HTTP/2
- 2022: HTTP/3 was released, with the biggest feature being the replacement of the transport layer with UDP. To date, [27%](https://w3techs.com/technologies/details/ce-http3) of websites worldwide use HTTP/3

:::info Tip
For HTTP historical development, I recommend reading MDN's article: ["Evolution of HTTP"](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Evolution_of_HTTP)
:::

<br />

Although HTTP has been developing for over 30 years, evolving from a simple **text protocol** to **encrypted binary streams**, thanks to good protocol design and the development of various debugging tools, for most application developers, whether the underlying layer is 1.1 or 3 is basically imperceptible in usage. However, for some special requirements (such as performance optimization), we must peel back these abstractions and peek into the details of these bytes.



Below, let's talk about how "prioritization" is designed in HTTP.

<br />

## HTTP/1.1: Nothing at All

For our old friend HTTP/1.1, **there's simply no concept of priority**.



If `keep-alive` is not enabled, it's one HTTP request per TCP connection for a round trip, all one-to-one relationships. Where does the concept of priority in multi-request scenarios come from?



If `keep-alive` is enabled, the strategy is also very simple: **FIFO (First In First Out)**, a very typical queue scenario, so there's no priority issue either. Whoever comes first gets sent first, emphasizing **fairness**.



Of course, this absolute fairness caused a problem: **Head-of-Line blocking**. Simply put, if the front request gets stuck, the following requests can only wait idly and waste time. Both HTTP/2 and HTTP/3 tried to solve this problem (but there's no perfect solution). Since there's too much content on this, I'll split it into another blog for detailed discussion.


:::info Tip
Actually, HTTP/1.1 also had a [pipelining](https://developer.mozilla.org/en-US/docs/Web/HTTP/Connection_management_in_HTTP_1.x#http_pipelining) solution, which not only failed to solve the HOL problem but also had serious performance issues. Mainstream browsers and servers didn't support it, making it essentially a dead proposal, but it can serve as extended reading for historical exploration
:::

<br />


## HTTP/2: Over-Engineered

One selling point of HTTP/2 is multiplexing, meaning multiple HTTP requests run **concurrently** on a single TCP connection. This one-to-many scenario creates the need for **scheduling strategies** and **priority**.


Before discussing how HTTP/2 designed priority schemes for multiple requests, let's do a thought experiment and try to design this priority scheme from scratch ourselves.

<br />

Suppose we have three images A, B, and C of the same size that we want to transfer using HTTP/2. What's the fastest approach we can think of?



The first approach is to transfer A first, then B, and finally C. But this is too similar to HTTP/1.1, **lacks innovation**, and users won't buy it.

![FIFO_HTTP](https://image-1255652541.file.myqcloud.com/uPic/FIFO_HTTP.png)

<br />

The second approach emphasizes concurrent streaming concepts: first transfer some of A, then some of B, then some of C, focusing on轮流 (Round Robin strategy). Combined with **terminal streaming loading and rendering**, the user's perceived rendering speed directly increases by half.

![Fair_Round_Robin](https://image-1255652541.file.myqcloud.com/uPic/Fair_Round_Robin.png)



<br />

Now let's increase the difficulty. For example, A is the article's hero image, B and C are example images within the article. For performance metrics and user experience, it would be more appropriate for A to load faster, so we need to increase A's loading priority. In this HTTP/2 connection, more bandwidth should be allocated to A.

![Unfair_Round_Robin](https://image-1255652541.file.myqcloud.com/uPic/Unfair_Round_Robin.png)

<br />

In real-world scenarios, a page has dozens of resource requests, with different sizes, types, and timing, making it very complex. To accommodate this complexity, HTTP/2 designed an **even more complex** priority scheduling strategy 😅.

<br />

Due to issues like call order, HTTP/2 first introduced a priority **dependency tree**, building a dependency tree based on the scheduling relationships between resources. For example, an HTML page loads CSS and JS, plus a JPG. The CSS also loads a PNG. Based on this dependency relationship, we can build such a tree:

![Dependency_Tree](https://image-1255652541.file.myqcloud.com/uPic/Dependency_Tree.png)



This tree shows the dependency relationships between resources. Generally, the terminal should load **root node** resources first, then load **child node** resources after completion.

<br />

But for tree structures, there's still a problem: theoretically, **sibling child nodes** should also have priority order.

For example, an HTML (root node) initiates 3 image (child node) requests, where 1 is the hero image, 2 is an above-the-fold image, and 3 is a below-the-fold image. Although these 3 images are all image requests and have no hierarchical relationship, from a user experience perspective, the priority should be most reasonable like this:

```bash
1.jpg > 2.jpg >> 3.jpg
```



To handle this scenario, HTTP/2 waved its hand and divided **256** weight levels for each node, giving you plenty to work with.

![HTTP_2_Weight](https://image-1255652541.file.myqcloud.com/uPic/HTTP_2_Weight.png)

<br />

Of course, beyond the priorities that can be initially determined through analysis, HTTP/2 also supports **dynamic priority modification**. Later arrivals can hang nodes on the previously built priority tree at any time, and those already in the queue can jump the line at any time.

<br />

Finally, for emergencies, an **exclusive flag** is provided. Setting it to 1 allows ignoring rules and occupying all bandwidth, emphasizing dominance.

![HTTP_2_Exclusive_Flag](https://image-1255652541.file.myqcloud.com/uPic/HTTP_2_Exclusive_Flag.png)

<br />

At this point, you can see how complex HTTP/2's priority is: **dependency tree × 256 priority levels × exclusive flag × dynamic adjustment, multiplying together results in skyrocketing complexity**.



Looking from today's perspective, there's no doubt that HTTP/2's priority strategy was **over-engineered**. Very few developers can cover this overwhelming complexity. The scheduling strategies of the three major browsers only use a small part of HTTP/2 (this content alone is enough for a separate article); on the server side, [very few servers](https://github.com/andydavies/http2-prioritization-issues) fully support HTTP/2's complex scheduling strategies.



Although priority scheduling support is not great and each end only supports a small subset of capabilities, HTTP/2 has many other optimizations. Overall, HTTP/2's performance is still stronger than HTTP/1.1 in statistical data, making it very worthwhile to upgrade.

<br />

## HTTP/3: Let it Run for a Few Years

HTTP/2 has already been standardized and implemented for many years. The ship has sailed, and it can't be changed. Meanwhile, HTTP/3 started writing RFCs and preparing to get to work.



Regardless of HTTP/3's features, HTTP/2's priority design ended up this way, and everyone on the design committee shares responsibility. If we continue to implement the previous leadership's strategy, browsers and servers definitely won't be able to implement it, and the general public will suffer in the end, which will cause problems. So HTTP/3 learned the lesson and made major reforms to priority, simplifying complexity and writing [RFC 9218](https://www.rfc-editor.org/rfc/rfc9218.html), which even an 80-year-old can understand.
- First, HTTP/3 removed the concept of dependency trees, reduced priority levels from the original 256 to 8, named urgency
- The exclusive request feature was also removed, reducing another complexity
- The ability to dynamically modify priorities was retained, which is a feature of the new HTTP and necessary for flexibility
- Added a switch indicating whether incremental transmission is needed, meaning whether it can be interleaved with other resources

<br />

So for a request, by default, its initial urgency is 3 and it's not streamed. For HTTP/3's overall transmission, the process looks like this:

![HTTP_3_Prioritization](https://image-1255652541.file.myqcloud.com/uPic/HTTP_3_Prioritization.png)

- First transfer resources marked as P0 level, then transfer P1 level after all are complete, until all are transferred
- For resources at the same level, if all are non-incremental transmission, follow first-come-first-served rules, whoever comes first goes first (FIFO)
  - If there are incrementally transmitted resources, then transfer interleaved
  - If both incremental and non-incremental resources exist at the same level, the RFC doesn't provide theoretical guidance, and browsers won't create such scenarios in practice (don't create trouble for yourself)

<br />

Looking at it this way, HTTP/3's priority strategy is quite **clear and easy to understand**, not as scary as HTTP/2, and not as rudimentary as HTTP/1.1. Can its scheduling strategy perfectly balance design complexity and real-world complexity?



The answer is, **nobody knows yet**. After all, HTTP/3 was only officially released at the end of 2022 and has been running online for just over a year. Nobody is really sure. Whether it has solved historical problems or introduced new difficulties, whether it's "far ahead" or "at least it works," all need time to verify.

<br />

## Conclusion

At this point, I've finished organizing the development history of "priority" across the three major HTTP versions. As you can see, for these protocol top-level designers, they basically deviated from their design path from the beginning of the project. I think anyone who has worked for a few years will have similar feelings.

This article mainly explains priority from a protocol perspective. In the next article, we'll discuss how browsers cooperate with HTTP protocol priorities.



<br />



## Reference Links

- [RFC 9113 HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html)
- [RFC 9114 HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)
- [RFC 9218 Extensible Prioritization Scheme for HTTP](https://www.rfc-editor.org/rfc/rfc9218.html)
- [HTTP/2 Prioritization](https://calendar.perfplanet.com/2018/http2-prioritization/)
- [Better HTTP/2 Prioritization for a Faster Web](https://blog.cloudflare.com/better-http-2-prioritization-for-a-faster-web/)
- [HTTP/3 Prioritization Demystified](https://calendar.perfplanet.com/2022/http-3-prioritization-demystified/)
- [Introducing HTTP/3 Prioritization](https://blog.cloudflare.com/better-http-3-prioritization-for-a-faster-web/)
- [HTTP/2 IN ACTION](https://dl.ebooksworld.ir/motoman/Manning.HTTP2.in.Action.www.EBooksWorld.ir.pdf)




