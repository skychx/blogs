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



在一般的移动端开发场景中，每次更新应用功能都是通过 APP 版本迭代来实现的。但是从 `APP 版本更新` 到 `应用市场审核发布` 再到 `用户下载更新`，总会存在一定的时间差，导致新的功能无法及时覆盖全量用户。

为了解决这个问题，开发者们一般会在项目里引入一门**脚本语言**，通过动态下发代码来修改应用的功能。在移动端应用比较广泛的脚本语言有 Lua 和 JavaScript，前者在游戏领域用的比较多，后者在应用领域用的比较多。本篇文章主要是想探讨一下移动双端（iOS & Android）的 JavaScript 引擎选型。由于个人水平有限，文章总会有遗漏和不足的地方，还请各位大佬多多指教。



## JS 引擎选型要点

JavaScript 作为世界上最热门的脚本语言，有着非常多的引擎实现：有 Apple 御用的 JavaScriptCore，有性能最强劲的 V8，还有最近热度很高的 QuickJS......如何从这些 JS 引擎里选出最适合的？我个人认为要有几个考量：

- **性能**：这个没话说，肯定是越快越好
- **体积**：JS 引擎会增加一定的包体积
- **内存占用**：内存占用越少越好
- **JavaScript 语法支持程度**：支持的新语法越多越好
- **调试的便捷性**：是否直接支持 debug？还是需要自己编译实现调试工具链
- **应用市场平台规范**：主要是 iOS 平台，平台禁止应用集成带 JIT 功能的虚拟机

比较麻烦的是，上面的几个点都不是互相独立的，比如说开启 JIT 的 V8 引擎，性能肯定是最好的，但是引擎体积就很大，内存占用也很高；在包体积上很占优势的 QuickJS，由于没有 JIT 加持，和有 JIT 的引擎比起来平均会有 5-10 倍的性能差距。

下面我会综合刚刚提到的几个点，并选择了 **JavaScriptCore**，**V8**，**Hermes** 和 **QuickJS** 这 4 个 JSVM，说说它们的优点和特点，再谈谈他们的不足。





## JS 引擎

### 1.JavaScriptCore: Apple 的御用引擎

JavaScriptCore 是 WebKit 默认的内嵌





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

正式介绍 QuickJS 前我们先说说它的作者：Fabrice Bellard。

软件界一直有个说法，一个高级程序员创造的价值可以超过 20 个平庸的程序员，但 Fabrice Bellard 不是高级程序员，他是天才，在我看来他的创造力可以超过 20 个高级程序员，我们可以顺着[时间轴](https://bellard.org/)理一下他创造过些什么：

> - 1997年，发布了最快速的计算圆周率的算法，此算法是 Bailey-Borwein-Plouffe 公式的变体，前者的时间复杂度是O(n^3)，他给优化成了O(n^2)，使得计算速度提高了43%，这是他在**数学**上的成就
> - 2000 年，发布了 FFmpeg，这是他在**音视频领域**的一个成就
> - 2000，2001，2018 三年三度获得国际混淆 C 代码大赛
> - 2002 年，发布了TinyGL，这是他在**图形学领域**的成就
> - 2005 年，发布了 QEMU，这是他在**虚拟化领域**的成就
> - 2011 年，他用 JavaScript 写了一个 PC 虚拟机 Jslinux，一个跑在浏览器上的 Linux **操作系统**
> - 2019 年，发布了 QuickJS，一个支持 ES2020 规范的 JS **虚拟机**

当人和人之间的差距差了几个数量级后，羡慕嫉妒之类的情绪就会转变为崇拜了，Bellard 就是一个这样的人。



收复一下心情，我们来看一下 QuickJS 这个项目。QuickJS 继承了 Fabrice Bellard 作品的一贯特色——**小巧而又强大**。

QuickJS `体积非常小`，只有几个 C 文件，没有乱七八糟的第三方依赖。但是他的功能又非常完善，`JS 语法支持`到 [ES2020](https://tc39.es/ecma262/)，[Test262](https://test262.report/browse/?date=2020-12-16) 的测试显示，QuickJS 的语法支持度比 V8 还要高。

![test262](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/test262.jpg)



那么 QuickJS 的性能如何呢？QuickJS 官上有个[基准测试](https://bellard.org/quickjs/bench.html)，综合比较了多款 JS 引擎对同一测试用例的跑分情况。下面是测试结果：

![JSVM_Benchmark](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/JSVM_%20Benchmark.jpg)

结合上面的表格和个人的一些测试，可以简单的得出一些结论：

- 开启 JIT 的 V8 综合评分差不多是 QuickJS 的 35 倍，但是在同等主打轻量的 JS 引擎中，QuickJS 的`性能`还是很耀眼的
- 在内存占用上，QuickJS 远低于 V8，毕竟 JIT 是是吃内存的大户，而且 QuickJS 的设计对嵌入式系统很友好（Bellard 成就奖杯 🏆 再 +1）
- QuickJS 和 Hermes 的跑分情况是差不多的，我私下做了一些性能测试，这两个引擎的表现也很相近



因为 QuickJS 的设计，我不经好奇他和 Lua 的性能对比如何。Lua 是一门非常小巧精悍的语言，在游戏领域和 C/C++ 开发中一直充当胶水语言的作用，我个人写了一些测试用例，发现 QuickJS 和 Lua 的执行效率也是差不多的，后来在网上找到一篇博文 [Lua vs QuickJS](https://sabotage-linux.neocities.org/blog/9/)，这个老哥也做了一些测试，结论也是它俩的性能差不多，在部分场景 Lua 会比 QuickJS 快一些。



官方文档里有提到，QuickJS 支持[生成字节码](https://bellard.org/quickjs/quickjs.html#Bytecode)，这样可以免去 JS 文件编译解析的过程。我一开始以为 QuickJS 和 Hermes 一样，可以直接生成字节码，然后交给 QuickJS 解释执行。后来自己编译了一下才发现，QuickJS 的作用机制和 Hermes 还不太一样：`qjsc` 生成字节码的 `-e` 和 `-c` 选项，都是先把 js 文件生成一份字节码，然后拼到一个 `.c` 文件里，大概长下面的这个样子：

```c
#include <quickjs/quickjs-libc.h>

const uint32_t qjsc_hello_size = 87;

const uint8_t qjsc_hello[87] = {
 0x02, 0x04, 0x0e, 0x63, 0x6f, 0x6e, 0x73, 0x6f,
 0x6c, 0x65, 0x06, 0x6c, 0x6f, 0x67, 0x16, 0x48,
 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72,
 0x6c, 0x64, 0x22, 0x65, 0x78, 0x61, 0x6d, 0x70,
 0x6c, 0x65, 0x73, 0x2f, 0x68, 0x65, 0x6c, 0x6c,
 0x6f, 0x2e, 0x6a, 0x73, 0x0e, 0x00, 0x06, 0x00,
 0x9e, 0x01, 0x00, 0x01, 0x00, 0x03, 0x00, 0x00,
 0x14, 0x01, 0xa0, 0x01, 0x00, 0x00, 0x00, 0x39,
 0xf1, 0x00, 0x00, 0x00, 0x43, 0xf2, 0x00, 0x00,
 0x00, 0x04, 0xf3, 0x00, 0x00, 0x00, 0x24, 0x01,
 0x00, 0xd1, 0x28, 0xe8, 0x03, 0x01, 0x00,
};

int main(int argc, char **argv)
{
  JSRuntime *rt;
  JSContext *ctx;
  rt = JS_NewRuntime();
  ctx = JS_NewContextRaw(rt);
  JS_AddIntrinsicBaseObjects(ctx);
  js_std_add_helpers(ctx, argc, argv);
  js_std_eval_binary(ctx, qjsc_hello, qjsc_hello_size, 0);
  js_std_loop(ctx);
  JS_FreeContext(ctx);
  JS_FreeRuntime(rt);
  return 0;
}
```

因为这是个 `.c` 文件，想跑起来还得编译一次生成二进制文件。



从字节码这个设计点来看，QuickJS 和 Hermes 的定位还是不太一样的。虽然直接生成字节码可以大大减少 JS 文本文件的解析时间，但是 QuickJS 还是更偏嵌入式一些，生成的字节码放在一个 C 文件中，还需要进行编译才能运行；Hermes 为 React Native 而生，生成的字节码一开始就考虑到分发功能（热更新就是一个应用场景），支持字节码的直接加载运行，不需要再编译一次。



上面主要还是对性能的考量，下面我们看看开发体验，也就是 QuickJS 的`调试功能`支持。到目前为止（2021-02-22），QuickJS 还没有官方的调试器，也就是说 `debugger` 语句会被忽略，社区有人实现了一套基于 VSCode 的调试器支持 [vscode-quickjs-debug](https://github.com/koush/vscode-quickjs-debug)，但是会对 QuickJS 做一些定制，个人还是蛮期待官方支持某个调试器协议的。



综合来看，QuickJS 是一款潜力非常大的 JS 引擎，在 JS 语法高度支持的前提下，还把性能和体积都优化到了极致。在移动端的 Hybrid UI 架构和游戏脚本系统都可以考虑接入。











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



## 参考链接

[QuickJS 引擎一年见闻录](https://zhuanlan.zhihu.com/p/161722203)