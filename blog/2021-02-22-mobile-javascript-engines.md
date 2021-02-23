---
slug: how-to-hide-bundle
title: 📱 移动端 JS 引擎选型
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/WechatIMG17.jpeg
description: 如何隐藏热更新的 bundle 文件
draft: false
tags: [跨端开发, 虚拟机, React Native]
---









## JS 引擎

### 1.JavaScriptCore: Apple 的御用引擎

- iOS：因为 Apple 官方要求，iOS 上的虚拟机都不能开启 JIT（除了官方的 WKWebView），所以无论什么 JS 引擎都只能解释执行，所以性能其实都差不多，起码不会有数量级的差异
- iOS: 相比之下，JSC 属于 Apple 的系统库，不需要打包的应用里，在包体积上反而是 0 开销，这个对于 JSC 是个很大的优点
- iOS：因为是系统库，每次系统升级时都会带来 JSC 的升级，每次的升级都会带来性能的提升和新语法的支持，缺点是会高度绑定，不能根据应用版本进行迭代
- Android：在 Android 上使用 JSC 比较另类，但是 RN 在 Hermes 之前都是用的 JSC，而且在 Android 上可以开启 JIT，根据这个 [PR](https://github.com/react-native-community/jsc-android-buildscripts/pull/114) 来看，开启/关闭 JIT 性能能有 5 倍的差异

- Android：但是 Hermes 出现之后，jsc-android 就放弃维护了。当然你可以自己交叉编译最新版本的 JSC，就是耗时耗力一些。



### 2.V8: Google 出品，必属精品

- 优点：快！快！快！可以说是世界上速度最快的 JIT 引擎
- 优点：V8 可以开启[字节码缓存](https://v8.dev/blog/custom-startup-snapshots)，这个可以大大加速 JS 引擎的[启动速度](https://nativescript.org/blog/improving-app-startup-time-on-android-with-webpack-v8-heap-snapshot/)，反映在应用上就是开屏速度加快了（TTI）
- 缺点：杀伤力虽然极大，但是太重了，包体积会变大（综合考虑 V8 和 JSC 体积其实差不了多少）
- iOS：iOS 上使用不了 JIT，基本上 V8 就是废了，虽然 V8 支持[JIT-less](https://v8.dev/blog/jitless) 模式（也就是关闭了 JIT 的 V8 引擎）
- Android：Android 的所有 WebView 引擎都是用的 V8，但是 V8 不是系统库，想用就得应用内嵌，也是离谱



### 3.Hermes: 用力追赶的 FaceBook

FaceBook 自从 2019-07-12 宣布 [Hermes 开源](https://engineering.fb.com/2019/07/12/android/hermes/)后，[jsc-android](https://www.npmjs.com/package/jsc-android) 的维护信息就永远的停在了 [2019-06-25](https://github.com/react-native-community/jsc-android-buildscripts/commit/abdce96b7ce833d0d33078b4b8a772b6593d7a3f)，这个信号暗示得非常的明显：JavaScriptCore Android 我们不再维护啦，大家都去用我们做的 Hermes 啊。

- 直接生成字节码下发字节码运行
- 直接加载字节码，减少 Parse 的时间，间接提高启动速度



### 4.QuickJS: Bellard 大神的又一力作

- 难以望其项背的大神
- 体积小，在同类的 JS 解释器中性能强悍，语法支持度高



##  选型思路

### 单引擎

- 统一采用 JSC（RN 之前的方案）
- 统一使用 Hermes（RN 0.64 方案）
- 统一采用 QuickJS（体积最小，框架最轻量）



### 双引擎

- iOS 用 JSC，Android 用 V8（Weex，NativeScript 都是这样的，可以在包体积和性能上有较好的均衡）
- iOS 用 JSC，Android 用 Hermes（RN 现如今的推荐方案）



### 调试问题

- 首先看 Test 情况
- 可以采用类 RN 的方案，release 用本机自带的引擎，debug 用 Chrome 的 V8
- 支持真机调试还是比较重要的