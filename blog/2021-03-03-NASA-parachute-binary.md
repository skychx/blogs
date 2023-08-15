---
slug: NASA-parachute-binary
title: 🪂 理科生的浪漫：NASA 毅力号降落伞上的二进制信息
author: 卤代烃
author_title: 微信公众号@卤代烃实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 2021 年 2 月 18 号，NASA 「毅力号」火星车顺利着陆火星，随后 NASA 发布了「毅力号」降落过程中的高清视频
draft: false
tags: []
---

上周写了篇长文[《移动端 JS 引擎哪家强？美国硅谷找......》](https://mp.weixin.qq.com/s/2cxe1L9_vyB8oNg2jr2rkg)，太耗精力了，这周写篇轻松的文章过渡一下。



<!--truncate-->



上个月 2 月 18 号，NASA 「毅力号」火星车顺利着陆火星，随后 NASA 发布了「毅力号」降落过程中的高清视频。

在视频的第 15 秒，「毅力号」展开了降落伞，仔细观察的话，大家就可以发现这个降落伞的涂装还是不太一样的，既不是纯色的背景，也没有印什么 LOGO，反而遍布着不规则的**橙白色条纹**：

![](https://image-1255652541.file.myqcloud.com/uPic/ee38-kkmphpt0194074.png)



这个视频放出来 6 个小时后，NASA 工程师 [Adam Steltzner](https://twitter.com/steltzner) 就发推表示，就有人破译了降落伞上的隐藏的信息。

![1871614777337_.pic_hd](https://image-1255652541.file.myqcloud.com/uPic/1871614777337_.pic_hd.jpg)



我们也不卖关子了，直接说结论。其实降落伞上编码的形式很简单：**白色表示 0，橙色表示 1，每 7 个条纹表示一组数据**：

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-03-03_21-19-45.jpg)

比如说上图最外侧的条纹，用二进制数据表示就是 `0 0 1 0 1 1 1`。

看到这种表示方法，计算机行业的小伙伴 DNA 肯定动了：这玩意儿不就是 `ASCII` 码吗！但是设计师不讲武德，并没有按常理出牌，这套编码其实是直接映射到字母表的。

比如说 `0 0 0 0 0 0 1` 表示的是字母 `A`，`0 0 0 0 0 1 0` 表示的是字母 `B`，以此类推表 26 个字母就都可以表示出来了。

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-03-03_21-29-47.jpg)



编码格式找出来后，破译就很简单了，我们从内到外顺时针解码，就可以得出一句话——「**Dare Mighty Things**」。

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-03-03_21-20-44.jpg)



这句话一直是**喷气推进实验室（ JPL）**的座右铭，其来自于美国第 26 任总统老罗斯福的就职演讲，原文如下：

> Far better is it to **dare mighty things**， to win glorious triumphs， even though checkered by failure， than to rank with those poor spirits who neither enjoy nor suffer much， because they live in a gray twilight that knows not victory nor defeat。
>
> 
>
> “去挑战伟大的事业，去赢得光荣的胜利，即使不幸失败，也远胜于那些既没有享受多大快乐也没有遭受多大痛苦的平庸之辈，因为他们生活在一个既没有胜利也没有失败的灰色世界里。”

<br />

除了隐藏的文字，其实还最外圈还隐藏了一圈数字。如果我们不把二进制翻译为字母，直接翻译为十进制数字，降落伞的最外圈可以翻译为这样的的数据：`34 11 58 N`、`118-10-31-W`，这就是 JPL 所在地的 GPS 坐标：34°11′58″N，118°10′31″W。



把破译图和视频原图重合一下，就是下面这张 MASA MARS 官网的图片：

![](https://image-1255652541.file.myqcloud.com/uPic/25646_PIA24431-decoder-ring-1200.jpg)



看完后我不经感叹，利用二进制藏彩蛋的做法，真不愧是一群 geek 工程师想出来的。





## 参考链接

[Mars Decoder Ring](https://mars.nasa.gov/resources/25646/mars-decoder-ring/)

[The Parachute Message](https://github.com/tanyafish/parachute/blob/main/The%20Parachute%20Message.pdf)

----

个人微信：**egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::


