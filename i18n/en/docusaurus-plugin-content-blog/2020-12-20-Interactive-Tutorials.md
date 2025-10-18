---
slug: Interactive-Tutorials
title: 📎 Discussing the Development of Interactive Tutorials from PaperClip's Interactive Videos
authors: skychx

description: Starting from PaperClip's interactive videos, discussing the development of interactive tutorials
draft: false
tags: [visualization, interaction]
---

> This article was originally a [Zhihu answer](https://www.zhihu.com/question/435245052/answer/1633004916), which received good response, so I refined some details and reorganized it for publication

On December 17, 2020, PaperClip Studio launched a new product - ["The Birth of an Artificial Intelligence" Interactive Teaching Video](https://www.bilibili.com/video/BV1XV411h7Ro). Because I've been exposed to MOOCs since high school and have always been very interested in online education, I immediately followed up and experienced their trial lesson - ["Recognizing Numbers"](https://jibencaozuo.com/product/1/episode/0).

{/* truncate */}



![Basic Operation - Recognizing Numbers](https://image-1255652541.file.myqcloud.com/uPic/jbcz.gif)

The general flow of the trial lesson is as follows:

- First play a video, which automatically stops at **key points**
- After stopping, you can interact with the video by operating some controls on the page
- After passing, you can jump to the next video segment
- Repeat the above three operations

As a software engineer, I'm naturally very interested in how this website is implemented. Web frontends basically have no secrets - after pressing `F12`, I can directly see how they do it.

- First, I captured packets and saw that the Network panel had many `mp3` and `mp4` requests, then I searched for `<video />` tags in the Elements panel, so the video is still played through `video`;
- The Console panel had output from [PixiJS 5.3.3](http://www.pixijs.com/), and I could find `<canvas />` tags in the Elements panel. During the interactive segments, it would switch to `canvas`, so the interactive parts are implemented based on `WebGL`

After figuring out the basic technology choices, **technically speaking**, PaperClip's interactive video has nothing innovative to speak of. There are many interactive ads domestically and internationally that use this combination: transition animations use video, interactive operations use WebGL; **commercially speaking**, as PaperClip said, this might indeed be the world's first interactive teaching video.

If we're just talking about technical implementation, the analysis could end here. But I've seen some evaluations saying that PaperClip's innovation is original, which is somewhat overpraising. Because in the era of graphics and text, there were actually quite a few such interactive tutorials. Let me briefly sort out the development history of **interactive tutorials**.

<br />

Most interactive tutorials rely on the Web, so their development history is highly tied to the development of the Web.

For example, more than a decade ago, Flash was the mainstream solution for implementing web interactions, and interactive tutorials were also implemented based on Flash. For example, [this webpage](http://graphics.stanford.edu/courses/cs178-10/applets/gaussian.html) from Stanford University allows learning the **lens formula** through real-time Flash interaction:

![gaussian](https://image-1255652541.file.myqcloud.com/uPic/gaussian.gif)

Later, Flash gradually declined (Adobe will completely stop supporting Flash on December 31, 2020). With the rise of HTML5 standards, everyone could use canvas/SVG/WebGL to implement frontend interactions. At this time, many interactive tutorials also came into everyone's view:

For example, the linear algebra tutorial [immersive linear algebra](http://immersivemath.com/ila/index.html) uses **canvas** technology to implement interactive operations:

![immersive linear algebra](https://image-1255652541.file.myqcloud.com/uPic/linear.gif)

There are also some **SVG** related interactive tutorials. For example, the [NN-SVG](http://alexlenail.me/NN-SVG/index.html) project uses SVG to implement FCNN visualization:

![FCNN](https://image-1255652541.file.myqcloud.com/uPic/FCNN.gif)

There are also some **WebGL** interactive teaching videos. For example, if you want to learn how to write shaders, you can completely rely on [the book of shaders](https://thebookofshaders.com/) interactive tutorial website, directly modifying case source code and getting real-time feedback on your learning results:

![shaders](https://image-1255652541.file.myqcloud.com/uPic/shaders.gif)

In 2018, I saw an interactive tutorial based on WebGL implementing handwritten digit recognition - [TensorSpace LeNet](https://tensorspace.org/html/playground/lenet_zh.html). I was very impressed at the time. I think PaperClip's trial lesson drew some inspiration from this tutorial:

![TensorSpace](https://image-1255652541.file.myqcloud.com/uPic/TensorSpace.gif)

As for interactive tutorials about frontend knowledge, there are even more. Many blogs use [CodePen](https://link.zhihu.com/?target=https%3A//codepen.io/) to share code, introducing it into their own websites with an **iframe**, so readers can modify code in real-time to verify their ideas. So the concept of interactive tutorials has existed for a long time. There's nothing new under the sun, it's not as epoch-making as some people think.

<br />

After sorting through the development of interactive tutorials, let me share my personal views.

I personally believe that regardless of whether the medium is video or graphics and text, the significance of interactive tutorials is very large because real-time feedback can greatly reduce beginners' learning costs.

The most typical example is the course **linear algebra**. As far as I know, most people's reaction after learning it is complete confusion, having no idea what this stuff is used for, and forgetting everything after the exam. The fact is that linear algebra is widely applied in computers. At this time, I recommend they watch 3Blue1Brown's ["Essence of Linear Algebra"](https://www.bilibili.com/video/BV1ys411472E) course,配合 with visual demonstrations, to thoroughly understand what linear algebra is all about.

Of course, interactive tutorials are not without disadvantages. The shortcomings (or weaknesses) are also quite obvious.

- First, **not all subjects are suitable for visualization**. PaperClip has two visualization tutorials about mathematics, but honestly, the effect is not as good as directly presenting formulas
- Second, **it's difficult to grasp the boundaries**. Interactive tutorials are still in the category of tutorials. Without this constraint, interactive tutorials could easily become show-off products, where students would be drowned in massive visual noise, and teaching effectiveness would be greatly reduced
- The final problem is **high cost**. I find it very time-consuming to write articles and draw diagrams, let alone proactively designing interactions. Without obvious benefits, it's difficult for individuals to have the motivation to create a set of interactive tutorials. So I understand PaperClip's pricing - this cost is much higher than writing a book

<br />

Finally, I hope this project can develop for a long time. In my opinion, this is what online education should look like.

<br />

<br />

-----

Welcome to follow my WeChat official account: **卤代烃实验室**, currently focusing on frontend technology, with some minor research in graphics.

You can also add my WeChat **egg_labs**, welcome to interact.

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

![](https://image-1255652541.file.myqcloud.com/uPic/OAFePh.jpg)