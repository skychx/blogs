---
slug: NASA-parachute-binary
title: 🪂 The Romance of Science Students: Binary Messages on NASA's Perseverance Parachute
authors: skychx

description: On February 18, 2021, NASA's "Perseverance" rover successfully landed on Mars, and NASA subsequently released high-definition video of the Perseverance landing process
draft: false
tags: []
---

Last week I wrote a long article ["Which Mobile JS Engine is the Strongest? Looking in Silicon Valley..."](https://mp.weixin.qq.com/s/2cxe1L9_vyB8oNg2jr2rkg), which was too energy-consuming. This week I'm writing a relaxed article to transition.

{/* truncate */



On February 18th last month, NASA's "Perseverance" rover successfully landed on Mars, and NASA subsequently released high-definition video of the Perseverance landing process.

At the 15-second mark of the video, Perseverance deployed its parachute. If you observe carefully, you'll notice that this parachute's paint scheme is quite unusual - it's not a solid color background, nor does it have any LOGO printed on it. Instead, it's covered with irregular **orange and white stripes**:

![](https://image-1255652541.file.myqcloud.com/uPic/ee38-kkmphpt0194074.png)

Six hours after this video was released, NASA engineer [Adam Steltzner](https://twitter.com/steltzner) tweeted that someone had already deciphered the hidden message on the parachute.

![1871614777337_.pic_hd](https://image-1255652541.file.myqcloud.com/uPic/1871614777337_.pic_hd.jpg)

Let's not keep you in suspense and get straight to the conclusion. The encoding format on the parachute is actually very simple: **white represents 0, orange represents 1, and every 7 stripes represent a group of data**:

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-03-03_21-19-45.jpg)

For example, the outermost stripes in the image above represent the binary data `0 0 1 0 1 1 1`.

Seeing this representation method, those in the computer industry will surely have their DNA activated: isn't this thing just `ASCII` code! But the designer didn't play by the rules and didn't follow conventional wisdom. This encoding system actually directly maps to the alphabet.

For example, `0 0 0 0 0 0 1` represents the letter `A`, `0 0 0 0 0 1 0` represents the letter `B`, and so on. All 26 letters of the alphabet can be represented.

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-03-03_21-29-47.jpg)

After finding the encoding format, deciphering becomes very simple. We can decode clockwise from inside to outside to get the phrase - "**Dare Mighty Things**".

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-03-03_21-20-44.jpg)

This phrase has always been the motto of the **Jet Propulsion Laboratory (JPL)**. It comes from the inauguration speech of America's 26th President Theodore Roosevelt. The original text is as follows:

> Far better is it to **dare mighty things**, to win glorious triumphs, even though checkered by failure, than to rank with those poor spirits who neither enjoy nor suffer much, because they live in a gray twilight that knows not victory nor defeat.
>
>
> "It is far better to dare mighty things, to win glorious triumphs, even though checkered by failure, than to rank with those poor spirits who neither enjoy nor suffer much, because they live in a gray twilight that knows not victory nor defeat."

<br />

Besides the hidden text, there's actually a ring of hidden numbers in the outermost circle. If we don't translate the binary to letters but directly translate it to decimal numbers, the outermost ring of the parachute can be translated to this data: `34 11 58 N`, `118-10-31-W`, which are the GPS coordinates of JPL's location: 34°11′58″N, 118°10′31″W.

Overlaying the deciphered diagram with the original video image gives us this picture from the NASA MARS official website:

![](https://image-1255652541.file.myqcloud.com/uPic/25646_PIA24431-decoder-ring-1200.jpg)

After seeing this, I couldn't help but marvel that using binary to hide Easter eggs is truly something only a group of geek engineers could come up with.

## Reference Links

[Mars Decoder Ring](https://mars.nasa.gov/resources/25646/mars-decoder-ring/)

[The Parachute Message](https://github.com/tanyafish/parachute/blob/main/The%20Parachute%20Message.pdf)

----

Personal WeChat: **egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note A small note
Welcome to follow the official account: **卤代烃实验室**: Focus on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::