---
slug: HTTP_CORS_Vary
title: 🌐 Vary + CORS，两大云厂商都在上面栽了跟头
authors: skychx

description: Vary + CORS，两大云厂商都在上面栽了跟头
draft: true
tags: [HTTP, network, '网络安全']
---


今天继续给大家分享一个 HTTP 冷知识，讲讲 Vary 和跨域的那些事儿。

{/* truncate */}

前文也对日常开发中遇到的一些场景做了分析，比如说风控用的 `X-Forwarded-For` 和 `URI` 空格编码：

- [X-Forwarded-For 拿到的就是真实 IP 吗？](https://juejin.im/post/6844904174132396045)
- [HTTP 请求中，空格应该被编码为 %20 还是 + ？](https://juejin.im/post/6844904178267979783)
- [HTTP 的这几个坑你都踩过吗？](https://juejin.im/post/6844904170550460423)

觉得文章不错的话，要记得给我**点赞哦**，谢谢你，这对我真的很重要 🌟。





## 一、 `Vary` 是什么





## 二、浅谈 CORS

[CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS) 这个概念很多网站都介绍过了，国外有个小姐姐 [Lydia Hallie](https://dev.to/lydiahallie) 写了一篇 [CS Visualized: CORS](https://dev.to/lydiahallie/cs-visualized-cors-5b8h?utm_campaign=React%2BNative%2BNow&utm_medium=web&utm_source=React_Native_Now_69#cs-cors) 来介绍这个概念，图文并茂写的非常好，推荐大家阅读一下，这里我就不展开讲了。

![0qe4yzasvrm7r0a76kui](https://image-1255652541.file.myqcloud.com/uPic/0qe4yzasvrm7r0a76kui.gif)



CORS 





## 三、Chrome 浏览器的缓存格式





## 四.跨域中的 `Vary`

这一小节介绍的内容是一个很隐蔽的暗坑，腾讯 COS 和阿里 OSS 对象存储云服务都踩到了，我们就来看一下这个坑是什么。



### 1.案例

介绍前我们先写个小 demo，复现一下案发现场，案例使用的是 **Chrome** 浏览器。

首先写一段很简单的 HTML 代码，用 `img` 标签加载一张阿里 OSS 的图片：

```html
<body>
  	<h2>normal image ⬇️</h2>
    <img id="normal" />
</body>
<script>
    let imgURL = 'https://cjxq.oss.aliyuncs.com/cjxq/1517814465101-220562.jpg?' + Date.now();
    let normalImg = document.getElementById('normal');
    normalImg.src = imgURL;
</script>
```

示意图如下：

![image-20200527210341349](https://image-1255652541.file.myqcloud.com/uPic/image-20200527210341349.png)



然后我们改造一下代码，加一个按钮，点击按钮后用 Fetch 函数再次加载这张图片：

```html
<body>
    <h2>normal image ⬇️</h2>
    <img id="normal" />
    <h2>fetch image ⬇️</h2>
    <button type="button" onclick="fetchImage()">fetch image</button>
</body>
<script>
    let imgURL = 'https://cjxq.oss.aliyuncs.com/cjxq/1517814465101-220562.jpg?' + Date.now();
    let normalImg = document.getElementById('normal');
    normalImg.src = imgURL;

    async function fetchImage() {
        let response = await fetch(imgURL);
        let blob = await response.blob();

        // 创建一个 <img>
        let img = document.createElement('img');
        document.body.append(img);

        // 显示它
        img.src = URL.createObjectURL(blob);
    }
</script>
</html>
```

这时候你就会发现，图片加载失败，还报了一个 **CORS 跨域错误**：

![normal](https://image-1255652541.file.myqcloud.com/uPic/normal.gif)

![corsError](https://image-1255652541.file.myqcloud.com/uPic/corsError.png)



如果把第一步写的那个 img 标签去掉，只留下 fetch 请求，这个跨域错误是不会报的：

![singlefetch](https://image-1255652541.file.myqcloud.com/uPic/singlefetch.gif)

是不是有些诡异？下面我们就来分析一下怎么回事。



### 2.原理

我首先揭晓答案，之所以报跨域错误，是因为**跨域请求的图片命中了非跨域请求的缓存**。感觉有些绕？下面我们一点一点分析。

拿我们最常见的 Chrome 浏览器为例，Chrome 缓存静态资源时，是以静态资源的 URL 为 key 进行资源缓存的。缓存是一个二进制文件，大致的结构是 `header` + `URL` + `response body` + `response header` + `footer`。header 和 footer 是浏览器自己加的信息，具体规则我也没细研究，总之这个缓存里不只有 HTTP 包体，还有 **HTTP 的头部**。



拿上面的那个 demo 来说，第一张图片是**非跨域**情况下加载的，结合各种缓存控制的 HTTP Header，浏览器把这个图片缓存了下来。

第二张图片用 Fetch 函数请求，默认是**跨域**的，发出网络请求前先找找浏览器有没有缓存图片，一比对 URL，咦，发现一个缓存，那就读一下吧，结果发现缓存的