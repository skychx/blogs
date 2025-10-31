---
slug: chrome-devtools-mcp
title: 🕹️ Chrome DevTools MCP - A Technical Deep Dive
authors: skychx
description: Technical analysis of Chrome DevTools MCP implementation and capabilities
tags: [AI, MCP, AI Agent, Chrome DevTools]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="cdm-hero.jpg" w={1919} h={744} />

On September 23, 2025, Google released [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp), currently at version 0.9.0. Google positions it as an assistant for AI coding agents to handle debugging and performance testing, improving web development debug capabilities. See the official blog for use cases: [Chrome DevTools (MCP) for your AI agent](https://developer.chrome.com/blog/chrome-devtools-mcp).

This post analyzes Chrome DevTools MCP's implementation by examining the source code and MCP output, exploring its capabilities and limitations.

{/* truncate */}


## Tool Categories

Based on its [MCP Tools](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md), the tools can be categorized as follows:

- **Core Browser Operations**: These provide basic web page automation capabilities, forming the foundation for all browser MCPs. Users can perform web automation without using debugging features.
  - **Navigation**: createPage, closePage, etc.
  - **Input**: click, hover, and other page interactions

- **Debugging Capabilities**: This is the primary focus of chrome-devtools-mcp, providing basic debugging information exposure.
  - **Emulation**: Currently limited, mainly network throttling, CPU slowdown simulation, and viewport sizing. These correspond to:
![cdm-perfs](https://image-1255652541.file.myqcloud.com/uPic/cdm-perfs.png)
  - **Performance**: Collects performance trace data, equivalent to:
![cdm-cpu-network](https://image-1255652541.file.myqcloud.com/uPic/cdm-cpu-network.png)
  - **Network**: Retrieves all network information for the current page
  - **Debugging**: Retrieves console information, captures screenshots, and can inject JavaScript code


## Technical Implementation

Chrome DevTools MCP is built on **Puppeteer** underneath, so many features map directly to Puppeteer operations. Let's analyze the technical details of the tools.

### Navigation

Navigation has minimal wrapper functionality.

**Tab Management:**
Uses `browser.pages()` API with basic numbering and activates tabs using `bringToFront()`. Active tabs are marked with `[selected]`:

```javascript
const parts = [`## Pages`];
let idx = 0;
for (const page of context.getPages()) {
  parts.push(
    `${idx}: ${page.url()}${idx === context.getSelectedPageIdx() ? ' [selected]' : ''}`,
  );
  idx++;
}
```

Response format:
```javascript
## Pages
0: https://developer.chrome.com/?hl=zh-cn
1: https://www.baidu.com/ [selected]
```

The wrapper is quite basic, lacking error handling and timeout management.

**Page Navigation:**
Simple operations like `new_page`, `navigate_page`, `close_page`:

```javascript
// new_page
const page = await context.newPage();
await page.goto(request.params.url, {
  timeout: request.params.timeout,
});

// navigate_page
const page = context.getSelectedPage();
await page.goto(request.params.url, {
  timeout: request.params.timeout,
});

// close_page
await context.closePage(request.params.pageIdx);
```

Minimal wrapper with limited robustness features.

### Input

Chrome DevTools MCP uses DOM snapshots for click/drag/hover operations. Let's analyze the workflow with a simple click on Baidu's homepage.

1. **Get DOM JSON tree** using Puppeteer's accessibility API:

```javascript
const rootNode = await page.accessibility.snapshot({
 includeIframes: true,
});
```

2. **Assign IDs to each node** for easy reference:

```typescript
let idCounter = 0;
const idToNode = new Map<string, TextSnapshotNode>();
const assignIds = (node: SerializedAXNode): TextSnapshotNode => {
 const nodeWithId: TextSnapshotNode = {
   ...node,
   id: `${snapshotId}_${idCounter++}`, // Assign ID
   children: node.children
     ? node.children.map(child => assignIds(child)) // Recursive DOM tree processing
     : [],
 };
 idToNode.set(nodeWithId.id, nodeWithId);
 return nodeWithId;
};
```

| Before snapshot processing | After snapshot processing |
| ------------------------- | ------------------------ |
| ![](https://image-1255652541.file.myqcloud.com/uPic/cdm-before-snapshot.png) | ![](https://image-1255652541.file.myqcloud.com/uPic/cdm-after-snapshot.png) |

3. **Execute action operations**: To click the "新闻" (News) button, locate `uid=1_1 link "新闻"` and execute:

```javascript
const node = this.#textSnapshot?.idToNode.get(uid); // uid="1_1"
// Get DOM handle via node.elementHandle
const handle = await node.elementHandle();

await handle.asLocator().click({ count: 1 });
```

Other actions follow the same pattern: **get snapshot** -> **analyze intent to get uid** -> **get DOM via uid and execute action**.

This approach's advantage is using Puppeteer's accessibility API directly (instead of browser-use injecting JS for custom formatting), making it more universal. The disadvantage is potentially large snapshots that consume significant context.

### Emulation

Simple functionality using Puppeteer APIs to simulate slow networks, slow CPU, and adjust viewport size. Basic MCP wrapper without complex logic or context handling.

### Performance

This is a key MCP feature for performance measurement and testing. The implementation is straightforward: start/stop performance tracing via Puppeteer APIs:

![](https://image-1255652541.file.myqcloud.com/uPic/cdm-icons.png)

Instead of sending complete trace data to the model (10-100MB JSON files), it outputs a **performance report template**:

```markdown
## Summary of Performance trace findings:
URL: https://developer.chrome.com/?hl=zh-cn
Bounds: {min: 771625656677, max: 771629299667}
CPU throttling: none
Network throttling: none
Metrics (lab / observed):
  - LCP: 907 ms, event: (eventKey: r-6881, ts: 771626610159), nodeId: 170
  - LCP breakdown:
    - TTFB: 808 ms, bounds: {min: 771625702955, max: 771626510489}
    - Render delay: 100 ms, bounds: {min: 771626510489, max: 771626610159}
  - CLS: 0.03, event: (eventKey: s--1, ts: 771626595695)
Metrics (field / real users): n/a – no data for this page in CrUX
Available insights:
  - insight name: DocumentLatency
    description: Your first network request is the most important.  Reduce its latency by avoiding redirects, ensuring a fast server response, and enabling text compression.
    relevant trace bounds: {min: 294, max: 771626579945}
    estimated metric savings: FCP 706 ms, LCP 706 ms
    example question: How do I decrease the initial loading time of my page?
    example question: Did anything slow down the request for this document?
  - insight name: RenderBlocking
    description: Requests are blocking the page's initial render, which may delay LCP. [Deferring or inlining](https://web.dev/learn/performance/understanding-the-critical-path#render-blocking_resources) can move these network requests out of the critical path.
    relevant trace bounds: {min: 771626513396, max: 771626531288}
    estimated metric savings: FCP 90 ms, LCP 90 ms
    example question: Show me the most impactful render blocking requests that I should focus on
    example question: How can I reduce the number of render blocking requests?
  - insight name: LCPBreakdown
    description: Each [subpart has specific improvement strategies](https://web.dev/articles/optimize-lcp#lcp-breakdown). Ideally, most of the LCP time should be spent on loading the resources, not within delays.
    relevant trace bounds: {min: 771625702955, max: 771626610159}
    example question: Help me optimize my LCP score
    example question: Which LCP phase was most problematic?
    example question: What can I do to reduce the LCP time for this page load?
  - insight name: CLSCulprits
    description: Layout shifts occur when elements move absent any user interaction. [Investigate the causes of layout shifts](https://web.dev/articles/optimize-cls), such as elements being added, removed, or their fonts changing as the page loads.
    relevant trace bounds: {min: 771626595695, max: 771628821131}
    example question: Help me optimize my CLS score
    example question: How can I prevent layout shifts on this page?
  - insight name: NetworkDependencyTree
    description: [Avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains) by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load.
    relevant trace bounds: {min: 771625703654, max: 771626579945}
    example question: How do I optimize my network dependency tree?
  - insight name: ThirdParties
    description: 3rd party code can significantly impact load performance. [Reduce and defer loading of 3rd party code](https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript/) to prioritize your page's content.
    relevant trace bounds: {min: 771626513396, max: 771628820176}
    example question: Which third parties are having the largest impact on your page performance?

## Details on call tree & network request formats:
Information on performance traces may contain main thread activity represented as call frames and network requests.

Each call frame is presented in the following format:

'id;eventKey;name;duration;selfTime;urlIndex;childRange;[S]'

Key definitions:

* id: A unique numerical identifier for the call frame. Never mention this id in the output to the user.
* eventKey: String that uniquely identifies this event in the flame chart.
* name: A concise string describing the call frame (e.g., 'Evaluate Script', 'render', 'fetchData').
* duration: The total execution time of the call frame, including its children.
* selfTime: The time spent directly within the call frame, excluding its children's execution.
* urlIndex: Index referencing the \"All URLs\" list. Empty if no specific script URL is associated.
* childRange: Specifies the direct children of this node using their IDs. If empty ('' or 'S' at the end), the node has no children. If a single number (e.g., '4'), the node has one child with that ID. If in the format 'firstId-lastId' (e.g., '4-5'), it indicates a consecutive range of child IDs from 'firstId' to 'lastId', inclusive.
* S: _Optional_. The letter 'S' terminates the line if that call frame was selected by the user.

Example Call Tree:

1;r-123;main;500;100;;
2;r-124;update;200;50;;3
3;p-49575-15428179-2834-374;animate;150;20;0;4-5;S
4;p-49575-15428179-3505-1162;calculatePosition;80;80;;
5;p-49575-15428179-5391-2767;applyStyles;50;50;;

Network requests are formatted like this:
`urlIndex;eventKey;queuedTime;requestSentTime;downloadCompleteTime;processingCompleteTime;totalDuration;downloadDuration;mainThreadProcessingDuration;statusCode;mimeType;priority;initialPriority;finalPriority;renderBlocking;protocol;fromServiceWorker;initiators;redirects:[[redirectUrlIndex|startTime|duration]];responseHeaders:[header1Value|header2Value|...]`

- `urlIndex`: Numerical index for the request's URL, referencing the \"All URLs\" list.
- `eventKey`: String that uniquely identifies this request's trace event.
Timings (all in milliseconds, relative to navigation start):
- `queuedTime`: When the request was queued.
- `requestSentTime`: When the request was sent.
- `downloadCompleteTime`: When the download completed.
- `processingCompleteTime`: When main thread processing finished.
Durations (all in milliseconds):
- `totalDuration`: Total time from the request being queued until its main thread processing completed.
- `downloadDuration`: Time spent actively downloading the resource.
- `mainThreadProcessingDuration`: Time spent on the main thread after the download completed.
- `statusCode`: The HTTP status code of the response (e.g., 200, 404).
- `mimeType`: The MIME type of the resource (e.g., \"text/html\", \"application/javascript\").
- `priority`: The final network request priority (e.g., \"VeryHigh\", \"Low\").
- `initialPriority`: The initial network request priority.
- `finalPriority`: The final network request priority (redundant if `priority` is always final, but kept for clarity if `initialPriority` and `priority` differ).
- `renderBlocking`: 't' if the request was render-blocking, 'f' otherwise.
- `protocol`: The network protocol used (e.g., \"h2\", \"http/1.1\").
- `fromServiceWorker`: 't' if the request was served from a service worker, 'f' otherwise.
- `initiators`: A list (separated by ,) of URL indices for the initiator chain of this request. Listed in order starting from the root request to the request that directly loaded this one. This represents the network dependencies necessary to load this request. If there is no initiator, this is empty.
- `redirects`: A comma-separated list of redirects, enclosed in square brackets. Each redirect is formatted as
`[redirectUrlIndex|startTime|duration]`, where: `redirectUrlIndex`: Numerical index for the redirect's URL. `startTime`: The start time of the redirect in milliseconds, relative to navigation start. `duration`: The duration of the redirect in milliseconds.
- `responseHeaders`: A list (separated by '|') of values for specific, pre-defined response headers, enclosed in square brackets.
The order of headers corresponds to an internal fixed list. If a header is not present, its value will be empty.
```

Another use case is getting specific metrics via `performance_analyze_insight`, like LCP data from trace files. These are also **pre-defined templates**:

```markdown
# performance_analyze_insight response

## Insight Title: LCP breakdown

## Insight Summary:
This insight is used to analyze the time spent that contributed to the final LCP time and identify which of the 4 phases (or 2 if there was no LCP resource) are contributing most to the delay in rendering the LCP element.

## Detailed analysis:
The Largest Contentful Paint (LCP) time for this navigation was 4,412 ms.
The LCP element (IMG, nodeId: 6815) is an image fetched from https://contentcms-bj.cdn.bcebos.com/cmspic/dc39f2b27f6e7b4ce3d76a5019276cde.jpeg?x-bce-process=image/crop,x_0,y_0,w_665,h_362 (eventKey: s-4377, ts: 779075655743).
## LCP resource network request: https://contentcms-bj.cdn.bcebos.com/cmspic/dc39f2b27f6e7b4ce3d76a5019276cde.jpeg?x-bce-process=image/crop,x_0,y_0,w_665,h_362
eventKey: s-4377
Timings:
- Queued at: 457 ms
- Request sent at: 457 ms
- Download complete at: 457 ms
- Main thread processing completed at: 457 ms
Durations:
- Download time: 0.2 ms
- Main thread processing time: 0 μs
- Total duration: 0.2 ms
Initiator: https://mbdp02.bdstatic.com/pcnews/static/fisp_static/common/module_static_include/module_static_include_5d6af88.js
Redirects: no redirects
Status code: 200
MIME Type: image/jpeg
Protocol: h2
Priority: Low
Render blocking: No
From a service worker: No
Initiators (root request to the request that directly loaded this one): https://news.baidu.com/, https://mbdp02.bdstatic.com/pcnews/static/fisp_static/common/module_static_include/module_static_include_5d6af88.js
Response headers
- content-md5: <redacted>
- x-bce-flow-control-type: <redacted>
- x-bce-image-info: <redacted>
- age: 10675
- ohc-cache-hit: <redacted>
- expires: Fri, 17 Oct 2025 04:17:05 GMT
- date: Tue, 14 Oct 2025 07:16:54 GMT
- content-type: image/jpeg
- last-modified: Tue, 14 Oct 2025 04:17:04 GMT
- ohc-file-size: <redacted>
- x-cache-status: <redacted>
- x-bce-debug-id: <redacted>
- x-bce-request-id: <redacted>
- accept-ranges: bytes
- ohc-global-saved-time: <redacted>
- content-length: <redacted>
- x-bce-is-transition: <redacted>
- server: nginx
- x-bce-storage-class: <redacted>

We can break this time down into the 4 phases that combine to make the LCP time:

- Time to first byte: 207 ms (4.7% of total LCP time)
- Resource load delay: 250 ms (5.7% of total LCP time)
- Resource load duration: 0.2 ms (0.0% of total LCP time)
- Element render delay: 3,955 ms (89.6% of total LCP time)

## Estimated savings: none

## External resources:
- https://web.dev/articles/lcp
- https://web.dev/articles/optimize-lcp
```

Notably, these templates aren't in the MCP code but reuse DevTools code directly:

![](https://image-1255652541.file.myqcloud.com/uPic/cdm-import.png)

The performance testing workflow:
- Collect complete trace data
- Generate summary from trace data
- Get specific metric templates (LCP/FCP, etc.) on demand

From my perspective, Chrome DevTools MCP's performance testing is essentially **pre-packaged analysis**. Its current capability ceiling is Lighthouse.

Having done extensive performance optimization work, I'm familiar with DevTools' performance tools. MCP provides performance optimization suggestions from [web.dev](https://web.dev) (a benefit of Google's official support). If integrated into development workflows, it might solve some basic performance optimization issues.

For complex performance problems, MCP's current capabilities are insufficient. A 100MB trace file provides only a few facets (Summary/LCP/FCP), which is inadequate for comprehensive understanding.

### Network

Two APIs: `list_network_requests` (lists all network requests) and `get_network_request` (details of specific requests).

Core functionality is one line of code: collect all network data via Puppeteer:

```javascript
page.on('request', request => collect(request));
```

With complete network data, full/filtering/details can be provided with proper formatting.

Example network response summary from Baidu homepage:

```markdown
# list_network_requests response
## Network requests
Showing 1-63 of 63 (Page 1 of 1).
https://news.baidu.com/ GET [success - 200]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/common/resource/js/usermonitor_88a158c.js?v=1.2 GET [failed - 304]
https://gss0.bdstatic.com/5foIcy0a2gI2n2jgoY3K/static/fisp_static/wza/aria.js?appid=c890648bf4dd00d05eb9751dd0548c30 GET [success - 200]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/news/js/jquery-1.8.3.min_a6ffa58.js GET [failed - 304]
https://efe-h2.cdn.bcebos.com/cliresource/ubc-report-sdk/2.0.8/ubc-web-sdk.umd.min.js GET [success - 200]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/common/module_static_include/module_static_include_326f211.css GET [success - 200]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/news/focustop/focustop_2701266.css GET [success - 200]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/common/img/sidebar/newErweima_9fa03e0.png GET [failed - 304]
https://news-bos.cdn.bcebos.com/mvideo/log-news.png GET [success - 200]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/common/img/footer/newErweima_9fa03e0.png GET [failed - 304]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/common/lib/mod_b818356.js GET [failed - 304]
https://mbdp02.bdstatic.com/pcnews/static/fisp_static/news/focustop/focustop_b924ecb.js GET [success - 200]
```

Example HTTP request details:

```markdown
# get_network_request response
## Request https://mbdp02.bdstatic.com/pcnews/static/fisp_static/news/js/jquery-1.8.3.min_a6ffa58.js
Status:  [failed - 304]
### Request Headers
- sec-ch-ua-platform:\"macOS\"
- if-none-match:\"a6ffa586a4bd1dc6ac369de9a08c18ef\"
- referer:https://news.baidu.com/
- user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36
- sec-ch-ua:\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"
- if-modified-since:Wed, 12 Mar 2025 06:44:26 GMT
- sec-ch-ua-mobile:?0
### Response Headers
- accept-ranges:bytes
- access-control-allow-origin:*
- age:165476
- connection:keep-alive
- content-md5:pv+lhqS9HcasNp3poIwY7w==
- content-type:text/javascript; charset=utf-8
- date:Tue, 14 Oct 2025 07:52:52 GMT
- etag:\"a6ffa586a4bd1dc6ac369de9a08c18ef\"
- expires:Wed, 15 Oct 2025 09:54:56 GMT
- last-modified:Wed, 12 Mar 2025 06:44:26 GMT
- ohc-cache-hit:wzix57 [2]
- ohc-file-size:93010
- ohc-global-saved-time:Sun, 12 Oct 2025 09:54:56 GMT
- server:JSP3/2.0.14
- x-cache-status:HIT
- x-bce-content-crc32:2237621194
- x-bce-debug-id:Rm9nn/ehbuTaGCz6KrvSy6cqmggWUatfykgluv61oqpFxkZl6/I9a7WaPOkKP9v5zCrujYrhMbyf9b2K0sYiUA==
- x-bce-flow-control-type:-1
- x-bce-is-transition:false
- x-bce-request-id:bf31960c-378d-46b8-a13d-95dbbb3741fa
- x-bce-storage-class:STANDARD
### Response Body
!function(e,t){function n(e){var t...
```

This data is straightforward without pre-processing: lists all network requests and prints HTTP headers/bodies.

### Debugging

Debugging features are diverse. Let's categorize them.

#### evaluate_script

Injects JavaScript into pages for execution and returns results.

#### list_console_messages

Monitors console and error events via two lines of code:

```javascript
page.on('console', event => collect(event));
page.on('pageerror', event => collect(event));
```

Baidu homepage console data comparison between DevTools and MCP shows consistency:

![](https://image-1255652541.file.myqcloud.com/uPic/cdm-error-log.png)

```markdown
# list_console_messages response
## Console messages
A parser-blocking, cross site (i.e. different eTLD+1) script, https://news-bos.cdn.bcebos.com/mvideo/pcconf_2019.js?1760428369873, is invoked via document.write. The network request for this script MAY be blocked by the browser in this or a future page load due to poor network connectivity. If blocked in this page load, it will be confirmed in a subsequent console message. See https://www.chromestatus.com/feature/5718547946799104 for more details.
A parser-blocking, cross site (i.e. different eTLD+1) script, https://news-bos.cdn.bcebos.com/mvideo/pcconf_2019.js?1760428369873, is invoked via document.write. The network request for this script MAY be blocked by the browser in this or a future page load due to poor network connectivity. If blocked in this page load, it will be confirmed in a subsequent console message. See https://www.chromestatus.com/feature/5718547946799104 for more details.
Error> Failed to load resource: the server responded with a status of 500 (Internal Server Error)
b.jpg?cmd=1&class=technnews&cy=0&0.4963333576628812:undefined:undefined
Error> Failed to load resource: the server responded with a status of 500 (Internal Server Error)
&refer_hostname=news.baidu.com&byInputUrl=1&ra=3078942552352606:undefined:undefined
```

#### take_screenshot

Basic screenshot functionality for current page or DOM elements using Puppeteer APIs.


## Conclusion

From a **core browser automation** perspective, Chrome DevTools MCP is quite basic. Many features are entry-level - functional but not advantageous compared to other browser MCPs (though Google's official backing might be an advantage). These capabilities might suffice for basic web debugging needs.

From a **debugging capabilities** perspective, Chrome DevTools MCP can reuse ChromeDevTools team's work, ensuring long-term maintenance stability. However, current debugging capabilities are **limited**:

- Can detect console warning/error logs for code optimization
- Can analyze network information for network problem diagnosis
- Can handle basic performance optimization, but the analysis ceiling is Lighthouse. Performance optimization is complex, and the current implementation may not be very helpful

Other basic debugging capabilities are missing, like Element debugging for analyzing complex CSS. Even with screenshots, getting true details is difficult.

![](https://image-1255652541.file.myqcloud.com/uPic/cdm-elements.png)

Advanced debugging features (Animations, Rendering, etc.) are unlikely to be added soon, as the core functionality needs significant refinement and optimization.