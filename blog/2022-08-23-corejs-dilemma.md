---
draft: true
tags: [性能优化]
---

corejs 还是太不起眼了。





## 存在感低的 corejs

### 1.

- 和 webpack babel 等基建项目相比，下载量高，但关注度低
  - 原因 1：和 webpack babel 比起来，配置远不如后者复杂
  - 原因 2: babel 等工具链已经做了较好的封装，屏蔽了很多细节
  - 原因 3: 实现原理较为简单，实际上全是脏活儿累活儿，可玩性不高，corejs 做的很完善了
- 项目维护者高度集权
  - 99.99% 的代码由一个人维护
  - 入狱后基本上没有人维护了，貌似现在还在找工作



### 2.和 webpack 等前端基建相比，关注度低







## 体积大

### 1.base ES3 而不是 ES5

体积大膨胀，和前一篇博文相结合看，现在基本上都是 ES5 base 了，但是 corejs 适配到 ES3，多了很多不必要的代码



### 2.corejs@4 不知何时才能出来

Corejs4 做优化，但是没有精力没有钱



### 3.准确度 > 性能

很多 API 早早就实现了，但是可能有 BUG，这些都做了 polyfill



## 一些处理不好的地方，和 corejs 无关

### 1.JS 语言的动态性，无法准确识别 API

比如 include，并不知道是用了 array 的还是 string 的



### 2.global 模式与 pure 模式，大部分人分不清

部分第三方 lib，会在源码中使用 corejs，但是使用的是 global 模式而不是 pure 模式，导致污染全局属性，可能会引起 bug



### 3.pure 模式早期不识别 target

pure 模式不识别 target，导致体积增长