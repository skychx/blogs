---
slug: cross-platform-tech
title: 🎯 [Deep Analysis] What Are the Core Technologies of Cross-Platform Frameworks?
authors: skychx

description: Before formally discussing the concept of "cross-platform development," we can first think about a question: what do front-end developers mainly do? I personally believe that regardless of how the environment changes, front-end basically does three things: fetch data, manage state, and render page
draft: false
tags: [react native, cross-platform development]
---

> This article contains some of my insights after studying multiple platform UI frameworks. Due to limitations in energy and technical expertise, there are inevitably shortcomings in this article. Please feel free to provide guidance.

{/* truncate */}


## 1. Frontend's Three Core Skills

Before formally discussing the concept of "cross-platform development," we can first think about a question: what do front-end developers mainly do?

I personally believe that regardless of how the environment changes, front-end basically does three things:

![Fetch Data, Manage State, Render Page](https://image-1255652541.file.myqcloud.com/uPic/FMR.jpg)

- fetch data
- manage state
- render page

That's it.

Perhaps some people think I'm being too one-sided. Actually, we can sort this out. In recent years, the knowledge payment industry is booming, with frequent "XXX Source Code Analysis" content. If you analyze the themes and directories of these courses, you'll find they basically revolve around these three directions. Looking further back, we can analyze the development history of web front-end:

- Around 1995: Used HTTP/1.0 to fetch data, used first-generation JavaScript to manage a few front-end states, used plain HTML tags to display pages

- Around 2005: Used HTTP/1.1 and AJAX to fetch data, used JavaScript to create forms and special effects, used CSS to beautify pages

- Around 2010: Used HTTP/1.1 and AJAX to fetch data, used jQuery to manipulate DOM for front-end logic, used CSS to beautify pages

- Around 2015: With the promotion of HTML5 standards and improved browser performance, front-end entered the "can't keep up with learning" era:
  - At the fetch data level, in addition to HTTP/1.1 and AJAX, HTTPS arrived, HTTP/2 arrived, and WebSocket also arrived
  - At the manage state level, Angular, React, and Vue appeared one after another. From today's perspective, React's state-driven view philosophy directly influenced the design of Flutter and SwiftUI
  - At the render page level, in addition to traditional HTML + CSS, concepts like CSS3 and Canvas were added, and audio/video functionality was enhanced

- In recent years, network protocols have tended to stabilize, with no major changes expected in the next few years. The positions of React and Vue are basically stable in China, with a group of front-end developers staring at GitHub progress bars waiting for version updates. Various issues have emerged in the render layer. After finally getting rid of IE6, various mini-programs appeared. It's neither economical nor realistic to write the same business logic multiple times, so various cross-platform solutions emerged.

After this analysis, this "three core skills" theory seems to make some sense. Let's think further along this direction to the bottom layer: how are these three major functions implemented?

- In the fetch data direction, ultimately we need to rely on the network protocol stack to send data out, but it's very unrealistic for a front-end developer to directly do socket programming, so we need to encapsulate network operations into libraries for application layer calls

- In the render page direction, ultimately we send related graphics information to GPU for rendering through various graphics APIs (OpenGL/Metal/Vulkan/DirectX). Many front-end developers' graphics journeys end at drawing a triangle. Using this technology stack to draw UI is extremely unrealistic, not to mention the huge engineering work of layout systems, so these tasks are handled by related **rendering engines**

- In the manage state direction, you can use global variables to manage state, but the end result will definitely be beaten up by your colleagues. Current mainstream solutions all use various frameworks and runtime for state management, and the host environment of this runtime is often the **virtual machine** of some language. Meanwhile, the starting point of fetch data is also the same virtual machine


![Virtual Machine and Rendering Engine](https://image-1255652541.file.myqcloud.com/uPic/XX.jpg)

From the above analysis, we can see that the main technical core of front-end consists of two things: **virtual machine** and **rendering engine**. This also means that **if we want to achieve cross-platform development, we must unify the virtual machine and rendering engine**.



## 2. Virtual Machines and Rendering Engines

### 1. Web Pages: JS Engine + WebKit

![Frontend Trinity](https://image-1255652541.file.myqcloud.com/uPic/HJC.png)

> Because Google's Blink engine is forked from Apple's WebKit, for convenience in later descriptions, I'll use WebKit to represent browser rendering engines

Web pages are the lowest-cost and fastest-to-start cross-platform solution. Thanks to the internet's open philosophy, web pages are naturally cross-platform. Regardless of the rendering framework, WebView is an indispensable core component.

The developer's access cost is also extremely low. The main technology is the web development stack. Front-end developers mainly worry about **compatibility issues** and **performance issues** with various rendering engines.

Currently mainstream JS Engines are Apple's JavaScriptCore and Google's V8, while mainstream rendering engines are Apple's WebKit and Google's Blink. Although W3C specifications are there, and various browser vendors implement browsers according to these specifications, which is also the foundation of web cross-platform. The problem is that browser kernel implementations always have subtle differences, some implementations don't follow specifications, and some implementations themselves have bugs. This is the essential reason why front-end can't escape compatibility needs.

Another issue is performance. Actually, WebKit's rendering speed is quite fast, but it's limited by some browser characteristics, such as extremely complex and dynamic CSS properties, merging of DOM tree and CSSOM, and the main thread must hang waiting for JS execution. These all greatly reduce performance. When front-end developers do performance optimization, they generally need to do pruning based on these browser characteristics. But no matter how optimized, there's still a big gap compared to Native in terms of page performance and interaction experience.

### 2. Web Pages PLUS: JS Engine + WebKit + Native Capabilities

Directly throwing a URL into WebView is the simplest approach, and this can actually solve most problems. After all, 90% of front-end work is drawing UI and writing business logic, but there's still 10% of functionality that can't be achieved, such as synchronizing state with Native or calling some system functions.

To achieve two-way communication between client and web pages, it's generally done through **JSBridge** communication. The article ["The Principle of JSBridge"](https://juejin.cn/post/6844903585268891662) summarizes this well, and interested students can take a look.

JSBridge only solves the problem of mutual calling between Native and Web. What if I want to use Native to enhance Web? At this point, some explorations have emerged:

- **Preheating**: Create and initialize WebView in advance, and even implement WebView container pools to reduce WebView startup time

- **Caching**: Pre-store commonly used Web resources locally in Native, then intercept browser network requests and redirect to local, which can speed up Web resource loading (also called "offline package" solution)

- **Hijacking**: For example, Web's control over network loading is relatively weak. Some capable manufacturers will hijack all network requests and hand them over to Native to handle. This allows more flexible management of Web requests

- **Replacement**: Replacement generally refers to replacing Web's `Img` and `Video` tags. The most common place for this is major news clients. Because news is dynamic and real-time, news is delivered by various editors/self-media through backend editing. At this point, we need to leverage **Web's powerful layout capabilities** to display text content; but for loading speed and viewing experience, images and videos are replaced with Native components

After the above steps, web page speed can basically reach second-level opening. The most typical examples are major news clients. Everyone can experience them.

### 3. Mini Programs: JS Engine + WebKit

![Various Mini Program Platforms](https://image-1255652541.file.myqcloud.com/uPic/ZWB.jpg)

Mini programs, a unique architecture in China, are essentially a result of WeChat becoming a traffic black hole and wanting to become a traffic distribution market to manage and distribute its own traffic. So this is a framework with heavy commercial overtones.

There are no particularly innovative technical points in mini programs. **Essentially, they are castrated versions of web pages**. So after WeChat mini programs appeared, various traffic oligarchs launched their own mini programs. As someone complained, [there are 9 ways to implement mini programs](https://www.zhihu.com/question/418571461/answer/1445614841). The underlying implementations are diverse, and various manufacturers' implementations have no unified standards. In the end, it just feeds developers crap, so I don't have much to introduce, that's it.

### 4. React Native: JS Engine + Native RenderPipeline

![React Native and Hermes](https://image-1255652541.file.myqcloud.com/uPic/RH.jpg)

React was released in 2013, and React Native was released two years later. The previous cross-platform solutions were basically based on browser technology. The innovation of RN's cross-platform solution is that it retains the JS Engine. On the rendering engine path, it didn't reinvent the wheel but reused existing Native rendering pipelines.

The benefit of this approach is that retaining the JS Engine allows maximum reuse of the Web ecosystem. After all, JavaScript is the language with the most wheels on GitHub. Reusing Native RenderPipeline means getting rid of WebKit's historical baggage, resulting in a relatively shorter rendering pipeline and naturally better performance.

So the question arises, how does RN achieve cross-platform? This entirely depends on React's vdom.

**vdom**

Some articles in the front-end community discuss vdom, always starting from the perspective of performance and development convenience. From a pure web front-end perspective, these are indeed characteristics of vdom, but this is not the real reason why vdom became popular. The greater value of vdom lies in **people seeing the hope of cross-platform development from vdom**. So after React appeared, it was very natural for React Native to follow closely. Why do I say this? We need to trace back to the paradigm of UI development.

UI development mainly has two paradigms: **[Immediate Mode GUI](https://www.wikiwand.com/en/Immediate_mode_(computer_graphics))** and **[Retained Mode GUI](https://www.wikiwand.com/en/Retained_mode)**.

Simply put, IMGUI refreshes completely every frame, mainly used in fields with high real-time requirements (games, CAD, etc.). RMGUI is the most widespread UI paradigm, where each component is encapsulated in an object, facilitating state management and complex nested layouts. Whether it's web pages, iOS, Android, or desktop development fields like Qt, they are all based on RMGUI. For specific differences between these two, you can read this [Zhihu answer](https://www.zhihu.com/question/39093254/answer/1351958747) and this [YouTube video](https://www.youtube.com/watch?v=Z1qyvQsjK5Y&t=4s).

Returning to React Native, since both iOS and Android's native rendering pipelines are RMGUI paradigms, there must be similarities. For example, UI is tree-structured nested layout, has event callbacks, etc. At this point, the role of vdom emerges:

As a pure object, vdom can clearly extract the nested structure of layouts, and **this abstract description is platform-independent**. So we can use JS to generate vdom, then map vdom to Native's layout structure, and finally let Native render views to achieve the purpose of cross-platform development.

At this point, if you have some knowledge of compilation principles, you'll find that vdom is somewhat similar to **IR**. Both are platform-independent intermediate states. vdom connects React above and Native RenderPipeline below, while IR connects the compiler frontend above and the compiler backend below. We only need to focus on the logic processing of the first half, and let the second half do the dirty work.

**Hermes**

In 2019, to optimize React Native's performance, Facebook directly launched a new JS Engine—**Hermes**. [FB's official blog post](https://engineering.fb.com/2019/07/12/android/hermes/) introduces many advantages. I personally think the biggest highlight is adding AOT. The traditional JS processing and loading flow is like this:

`Babel syntax conversion` → `Minify code compression` → `install download code` → `Parse convert to AST` → `Compile` → `Execute`

After Hermes added AOT, the processes of `Babel`, `Minify`, `Parse`, and `Compile` are all completed on the developer's computer, directly distributing bytecode for Hermes to run.

![Bytecode precompilation with Hermes](https://image-1255652541.file.myqcloud.com/uPic/Hermes.gif)

The benefit of this approach is that it can greatly shorten JS compilation time. If you don't believe it, you can use Chrome to analyze several large websites. JS parsing and loading time basically accounts for over 50% of the time, and some heavy websites might take up to 90%. This is okay for desktop applications, but for mobile platforms where battery and CPU are weaker, these are definite performance killers. Hermes's addition can greatly improve this situation.

Currently React Native 0.64 also supports using Hermes on iOS. If you have RN business, you can try it out and see how much performance improvement there is on iOS.

### 5. Flutter: Dart VM + Flutter RenderPipeline

![Flutter and Dart](https://image-1255652541.file.myqcloud.com/uPic/FD.jpg)

Flutter is a relatively hot cross-platform solution recently, and many people think this is the ultimate cross-platform solution. After all, in the desktop software era, the ultimate winning cross-platform solution was Qt. Their common characteristic is that they come with their own rendering engine that can smooth out terminal differences.

The creation of Flutter is quite interesting. [Here](https://zhuanlan.zhihu.com/p/52666477) there's an interview with Eric. In the video, Eric says he has about ten years of work experience in the web rendering field. Once inside Chrome, they did an experiment where they removed some messy web specifications, and some benchmarks could even be **20 times faster**. Therefore, Google internally started a project, and Flutter emerged. As for why Flutter chose Dart, there's always been a rumor that **the Flutter development team was next to the Dart development team**. Being close makes for easy collaboration. Anyway, Dart wasn't used by anyone, had no historical baggage, and could respond well to Flutter's needs.

Flutter's architecture is also quite clear:

- The virtual machine uses Dart VM. Dart supports both JIT and AOT, which can ensure both development efficiency and runtime efficiency
- The rendering engine first passes the view data built by Dart to Skia, then Skia processes the data and hands it to the two graphics APIs OpenGL/Metal, and finally to GPU for rendering. Overall, it's much clearer than WebKit's rendering pipeline

From a purity perspective, Flutter is the most thorough implementation. Neither the virtual machine nor rendering engine uses mature industry solutions, but instead creates its own set. The benefit is no adaptation pressure, but the drawback is that it's too new. During business development, you often encounter the embarrassing situation of having no wheels available. If Google promotes it strongly and major domestic manufacturers continue to follow up, the prospects are still bright.

### 6. Other Directions: JS Engine + Flutter RenderPipeline?

There's a voice in the community that thinks Flutter's biggest mistake is not being able to develop with JavaScript. At this point, some people will think, if we combine Web technology and Flutter technology, use JS Engine to connect with the world's largest and most active JS community, and use Flutter rendering engine to connect with high-performance rendering experience, wouldn't that be beautiful?

![Beautiful?](https://image-1255652541.file.myqcloud.com/uPic/1CJjZG.jpg)

Currently, some major manufacturers have made some explorations. I've seen some analyses and project architectures that feel like they made a low-spec version of React Native. React Native's existing architecture has a performance bottleneck: the cost of cross-language calls is relatively high. These manufacturers' call chains involve up to 4 steps: `JS` -> `C++` -> `Dart` -> `C++`, which is even more insane. Currently, whether in terms of getting started or promotion, it's not as convenient as directly using RN or Flutter.

## 3. Disadvantages of Various Cross-Platform Solutions

Cross-platform solutions can't have only advantages. The disadvantages of each solution are also obvious. I'll briefly list them below:

- **Web Pages**: Performance is an insurmountable hurdle, and Apple has clearly stated they don't welcome WebView-wrapped APPs, with a risk of rejection
- **Web Pages PLUS**: High technical investment, basically only major manufacturers can handle it
- **Mini Programs**: Unfriendly to developers, extremely short technical half-life
- **React Native**: Basically can only draw UI. Once you go deep, only JS can't solve problems. You have to learn Java and OC, which places high demands on developers
- **Flutter**: Android support is good, but the interaction fragmentation on iOS platform is still strong. And like RN's problem, once you go deep, you must learn client-side development knowledge, which places high demands on developers

Overall, under the premise of sacrificing some user experience, cross-platform solutions can improve developers' development efficiency and company's operational efficiency. I personally believe that as long as the ROI of a certain solution is relatively high, it can actually be put into production.

## 4. Summary

This article ends here. I've distilled various cross-platform technologies into virtual machine and rendering engine technologies, and then deconstructed various cross-platform solutions from the perspective of these two core technologies. Once the concepts are clear, when facing technical scenarios like performance optimization, you can grasp the main contradictions, discover and solve problems faster and better.

----

Personal WeChat: egg_labs

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note A little tail
Welcome to follow our official account: **卤代烃实验室**: Focusing on frontend technology, hybrid development, and computer graphics, only writing in-depth technical articles
:::