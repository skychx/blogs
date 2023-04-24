---
slug: web-vitals
title: 📐 Web 前端性能测量库 web-vitals 源码解析
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: web-vitals 源码解析
draft: true
tags: [性能优化, 性能监控]
---


[`web-vitals`](https://github.com/GoogleChrome/web-vitals) 是 Google 官方推出的一款体积非常小的 library，对很多常见的性能数据做了封装处理（例如 FCP/LCP/CLS 等等），并对用户暴露了简单又统一的 API，大大简化了操作门槛。



- 需要对 Web 性能指标有一定的了解

- 内容相对较少，可以通过阅读源码掌握一些 performance API 的使用封装技巧
- 因为高度依赖兼容浏览器和 API 的历史设计问题，所以部分实现比较脏，这部分其实不是重点
- 学习较为高阶的封装技巧



