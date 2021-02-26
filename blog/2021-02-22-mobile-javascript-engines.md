---
slug: mobile-javascript-engines
title: 🤔 移动端 JS 引擎哪家强？美国硅谷找......
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/WechatIMG17.jpeg
description: 🤔 移动端 JS 引擎哪家强？美国硅谷找......
draft: false
tags: [跨端开发, 虚拟机, React Native]
---

![mobile_JSVM_Header](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/mobile_JSVM_Header.jpg)



在一般的移动端开发场景中，每次更新应用功能都是通过 Native 语言开发并通过应用市场版本分发来实现的。但是市场瞬息万变，Native 语言在开发效率上存在一定不足，并且从 `APP 版本更新` 到 `应用市场审核发布` 再到 `用户下载更新`，总会存在一定的时间差，这样就导致新的功能无法及时覆盖全量用户。

为了解决这个问题，开发者们一般会在项目里引入一门**脚本语言**，提速 APP 的研发流程。在移动端应用比较广泛的脚本语言有 Lua 和 JavaScript，前者在游戏领域用的比较多，后者在应用领域用的比较多。本篇文章主要是想探讨一下移动双端（iOS & Android）的 JavaScript 引擎选型。由于个人水平有限，文章总会有遗漏和不足的地方，还请各位大佬多多指教。

<!--truncate-->

## JS 引擎选型要点

JavaScript 作为世界上最热门的脚本语言，有着非常多的引擎实现：有 Apple 御用的 JavaScriptCore，有性能最强劲的 V8，还有最近热度很高的 QuickJS......如何从这些 JS 引擎里选出最适合的？我个人认为要有几个考量：

- **性能**：这个没话说，肯定是越快越好
- **体积**：JS 引擎会增加一定的包体积
- **内存占用**：内存占用越少越好
- **JavaScript 语法支持程度**：支持的新语法越多越好
- **调试的便捷性**：是否直接支持 debug？还是需要自己编译实现调试工具链
- **应用市场平台规范**：主要是 iOS 平台，平台禁止应用集成带 JIT 功能的虚拟机

比较麻烦的是，上面的几个点都不是互相独立的，比如说开启 JIT 的 V8 引擎，性能肯定是最好的，但它引擎体积就很大，内存占用也很高；在包体积上很占优势的 QuickJS，由于没有 JIT 加持，和有 JIT 的引擎比起来平均会有 5-10 倍的性能差距。

下面我会综合刚刚提到的几个点，并选择了 **JavaScriptCore**，**V8**，**Hermes** 和 **QuickJS** 这 4 个 JSVM，说说它们的优点和特点，再谈谈他们的不足。





## JS 引擎功能大比拼

### 1.JavaScriptCore

![mobile_JSVM_JSC](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/mobile_JSVM_JSC.jpg)

<br />

JavaScriptCore 是 WebKit 默认的内嵌 JS 引擎，wikipedia 上都没有独立的词条，只在 WebKit 词条的[三级目录](https://www.wikiwand.com/en/WebKit#/JavaScriptCore)里介绍了一下，个人感觉还是有些不像话，毕竟也是老牌 JS 引擎了。

由于 WebKit 是 Apple 率先开源的，所以 WebKit 引擎运用在 Apple 自家的 Safari 浏览器和 WebView 上，尤其是 iOS 系统上，因为 Apple 的限制，所有的网页只能用 WebKit 加载，所以 WebKit 在 iOS 上达到了事实垄断，作为 WebKit 模块一部分的 JSC，顺着政策春风，也「基本」垄断了 iOS 平台的 JS 引擎份额。

垄断归垄断，其实 JSC 的**性能还是可以的**，很多人不知道 JSC 的 JIT 功能其实比 V8 还要早，放在十几年前是最好的 JS 引擎，只不过后来被 V8 追了上来。而且 JSC 有个重大利好，在 iOS7 之后，JSC 作为一个系统级的 Framework 开放给开发者使用，也就是说，如果你的 APP 使用 JSC，只需要在项目里 `import` 一下，**包体积是 0 开销的**！这点在今天讨论的 JS 引擎中，JSC 是最能打的。

<br />

虽然开启 JIT 的 JSC 性能很好，但是只限于苹果御用的 Safari 浏览器和 WKWebView，只有这两个地方 JIT 功能才是默认开启的，如果在项目里直接引入 JSC，JIT 功能是关闭的。为什么这么做呢？[RednaxelaFX 大佬](https://www.zhihu.com/people/rednaxelafx) 给出过非常专业的[解释](https://www.zhihu.com/question/21320960/answer/18628710)：

> JIT 编译需要底层系统支持动态代码生成，对操作系统来说这意味着要支持动态分配带有“可写可执行”权限的内存页。当一个应用程序拥有请求分配可写可执行内存页的权限时，它会比较容易受到攻击从而允许任意代码动态生成并执行，这样就让恶意代码更容易有机可乘。

Apple 出于安全上的考虑，禁止了第三方 APP 使用 JSC 时开启 JIT，这些特点在 React Native 的 [JS Runtime 页面](https://reactnative.dev/docs/javascript-environment#javascript-runtime)也有过相关的解释。不过在实际应用中，不做重 CPU 的运算只当胶水语言使用，JSC 还是绰绰有余了。

<br />

上面的讨论都是针对 iOS 系统的，在 Android 系统上，JSC 的表现就不尽人意了。JSC 并没有对 Android 机型做很好的适配，虽然可以开启 JIT，但是性能表现并不好，这也是 Facebook 决心制作 Hermes 的一个原因，具体的性能对比分析可见本文的 Hermes 小节。

<br />

最后再说说 JSC 的**调试**支持情况。如果是 iOS 平台，我们可以直接用 Safari 的 `debbuger` 功能调试，如果是 Android 平台，目前我还没有找到一个很好的真机调试方法。

<br />

**综合来看，JavaScriptCore 在 iOS 平台上有非常明显的主场优势，各个指标都是很优秀的，但在 Android 上因为缺乏优化，表现并不是很好。**



### 2.V8

![mobile_JSVM_V8](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/mobile_JSVM_V8.jpg)

<br />

V8，我想我不用过多解释了，JavaScript 能有如今的地位，V8 功不可没。性能没得说，开启 JIT 后就是业内最强（不止是 JS），有很多介绍 V8 的文章，我这里就不多描述了，我们这里说说 V8 在移动端的表现。

<br />

同样作为 Google 家的产品，每一台 Android 手机上都安装了基于 Chromium 的 WebView，V8 也一并捆绑了。但是 V8 和 Chromium 捆绑的太紧密了，不像 iOS 上的 JavaScriptCore 封装为系统库可以被所有 App 调用。这就导致你想在 Android 上用 V8 还得自己封装，社区比较出名的项目是 [J2V8](https://github.com/eclipsesource/J2V8)，提供了 V8 的 Java bindings 案例。

V8 **性能没得说**，Android 上可以开启 JIT，但这些优势都是有代价的：开启 JIT 后**内存占用高**，并且 V8 的**包体积也不小**（大概 `7 MB` 左右），如果作为只是画 UI 的 Hybrid 系统，还是有些奢侈了。

我们再说说 V8 在 iOS 上的集成。V8 在 2019 年推出了 [JIT-less V8](https://v8.dev/blog/jitless)，也就是关闭 JIT 只使用 `Ignition interpreter` 解释执行 JS 文件，那么我们在 iOS 上集成 V8 就成了可能，因为 Apple 还是支持接入只有解释器功能的虚拟机引擎的。但是个人认为关闭了 JIT 的 V8 接入 iOS 价值不大，因为只开启解释器的话，这时候的 V8 和 JSC 的性能其实是差不多的，引入反而会增加一定的体积开销。

<br />

V8 还有一个有意思的特性很少人提及，那就是——**堆快照（Heap snapshots）**，这个是 V8 在 [2015](https://v8.dev/blog/custom-startup-snapshots) 年就支持的功能，但是社区里很少有人讨论它。

堆快照是什么原理呢？一般来说 JSVM 启动后，第一步往往是解析 JS 文件，这个还是比较耗时的，V8 支持预先生成 Heap snapshots，然后直接加载到堆内存中，快速的获得 JS 的初始化上下文。跨平台框架 [NativeScript](https://nativescript.org/) 就利用了这样的技术，可以让 JS 的加载速度提升 3 倍，技术细节可以看他们的[博文](https://nativescript.org/blog/improving-app-startup-time-on-android-with-webpack-v8-heap-snapshot/)。

![V8_heap_snapshots](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/V8_heap_snapshots.jpg)



V8 **真机调试**也需要引入第三方库，Android 端社区上有人对 J2V8 做了 Chrome 调试协议的扩展，即 [ J2V8-Debugger](https://github.com/AlexTrotsenko/j2v8-debugger) 项目，iOS 我没有找到相关的项目，可能需要自己实现一套扩展。

<br />

**综合来看 V8 的确是 JSVM 中的性能王者，Android 端使用时可以完全发挥它的威力，但是 iOS 平台因为主场劣势，并不是很推荐。**



### 3.Hermes

![mobile_JSVM_hermes](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/mobile_JSVM_hermes.jpg)

<br />

Hermes 是 FaceBook 2019 年中旬开源的一款 JS 引擎，从 [release](https://github.com/facebook/hermes/releases) 记录可以看出，这个是专为 React Native 打造的 JS 引擎，可以说从设计之初就是为 Hybrid UI 系统打造。

Hermes 一开始推出就是要替代原来 RN Android 端的 JS 引擎，即 JavaScriptCore（因为 JSC 在 Android 端表现太拉垮了）。我们可以理一下时间线，FaceBook 自从 2019-07-12 宣布 [Hermes 开源](https://engineering.fb.com/2019/07/12/android/hermes/)后，[jsc-android](https://www.npmjs.com/package/jsc-android) 的维护信息就永远的停在了 [2019-06-25](https://github.com/react-native-community/jsc-android-buildscripts/commit/abdce96b7ce833d0d33078b4b8a772b6593d7a3f)，这个信号暗示得非常的明显：**JavaScriptCore Android 我们不再维护啦，大家都去用我们做的 Hermes 啊**。

最近 Hermes 已经计划伴随 React Native 0.64 版本登录 iOS 平台了，但是 RN 版本更新 blog 还没有出，大家可以看看我之前对 Apple 开发者协议的解读：[Apple Agreement 3.3.2 规范解读](https://supercodepower.com/how-to-hide-bundle#%E4%BA%8C%E3%80%81%E8%A7%A3%E8%AF%BB%E8%A7%84%E8%8C%83)，在这里我就不多说了。

<br />

Hermes 的特点主要是两个，一个是**不支持 JIT**，一个是**支持直接生成/加载字节码**，我们在下面分开讲一下。

Hermes 不支持 JIT 的主要原因有两个：加入 JIT 后，JS 引擎启动的预热时间会变长，一定程度上会加长首屏 [TTI](https://web.dev/tti/)（页面首次加载可交互时间），现在的前端页面都讲究一个秒开，TTI 还是个挺重要的测量指标。另一个问题上 JIT 会增加包体积和内存占用，Chrome 内存占用高 V8 还是要承担一定责任的。

因为不支持 JIT，Hermes 在一些 CPU 密集计算的领域就不占优势了，所以在 Hybrid 系统里，最优的解决方案就是充分发挥 JavaScript 胶水语言的作用，CPU 密集的计算（例如矩阵变换，参数加密等）放在 Native 里做，算好了再传递给 JS 表现在 UI 上，这样可以兼顾性能和开发效率。

<br />

Hermes 最引人瞩目的就是支持生成字节码了，我在之前的博文[《🎯 跨端框架的核心技术到底是什么？》](https://supercodepower.com/cross-platform-tech#4react-native%EF%BC%9Ajs-engine--native-renderpipeline)也提到过，Hermes 加入 AOT 后，`Babel`、`Minify`、`Parse` 和 `Compile` 这些流程全部都在开发者电脑上完成，直接下发字节码让 Hermes 运行就行，我们直接用个 demo 演示一下。

![Hermes](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/Hermes.gif)

先写个 `test.js` 的文件，里面随便写点啥都行；然后编译一下 Hermes 的源码，编译过程直接按[文档](https://github.com/facebook/hermes/blob/master/doc/BuildingAndRunning.md)来就行，我这里就略过了。

首先 Hermes 支持直接解释运行 JS 代码，就是正常的 JS 加载编译运行流程。

```bash
hermes test.js
```

我们可以加入 `-emit-binary` 参数尝试一下生成 Bytecode 的功能：

```bash
hermes -emit-binary -out test.hbc test.js
```

然后就会生成一份 `test.hbc` 字节码文件：

![hermes_bytecode](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/hermes_bytecode.jpg)

最后我们可以让 Hermes 直接加载运行 `test.hbc` 文件：

```bash
hermes test.hbc
```

客观评价一下 Hermes 的字节码，首先省去了在 JS 引擎里解析编译的流程，JS 代码的加载速度将会大大加快，体现在 UI 上就是 TTI 时间会明显缩短；另一个优势 Hermes 的字节码在设计时就考虑了移动端的性能限制，支持增量加载而不是全量加载，对内存受限的中低端 Android 机更友好；不过字节码的体积会比原来的 JS 文件会大一些，但是考虑到 Hermes 引擎本身体积就不大，综合考虑下来这些体积增量还是可以接受的。

<br />

关于详细的 Hermes **性能测试**情况，网上有两篇文章写的比较好：一篇是 [React Native Memory profiling: JSC vs V8 vs Hermes](https://dev.to/anotherjsguy/react-native-memory-profiling-jsc-vs-v8-vs-hermes-1c76)，可以看到在 Android 设备上 Hermes 的表现还是很优异的，而 JSC 的表现非常拉垮：

![JSCvsV8vsHermes](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/JSCvsV8vsHermes.png)

另一篇是携程的文章：[携程对 RN 新一代 JS 引擎 Hermes 的调研](https://mp.weixin.qq.com/s/BOeuLoZjCdi61P_MhaJT0g)，可以看出 Hermes 综合成绩最高（JSC 还是一样的拉垮）：

![JSVM_CPU_Performance](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/JSVM_CPU_Performance.png)

<br />

说完性能我们再说说 Hermes 的 **JS 语法支持**情况。Hermes 主要支持的是 ES6 语法，刚开源时不支持 `Proxy`，不过 [v0.7.0](https://github.com/facebook/hermes/releases/tag/v0.7.0) 已经支持了。他们的团队也比较有想法，不支持 `with` `eval()` 等这种属于设计糟粕的 API，这种设计的权衡我个人还是比较认同的。

<br />

最后我们谈谈 Hermes 的**调试功能**。目前 Hermes 已经支持了 Chrome 的调试协议，我们可以直接用 Chrome 的 debugging 工具直接调试 Hermes 引擎，具体的操作可见文档：[Debugging JS on Hermes using Google Chrome's DevTools](https://reactnative.dev/docs/hermes#debugging-js-on-hermes-using-google-chromes-devtools)

<br />

**综合来看，Hermes 是一款专为移动端 Hybrid UI System 打造的 JS 引擎，如果要自建一套 Hybrid 系统，Hermes 是一个非常好的选择。**





### 4.QuickJS

![mobile_JSVM_quickjs](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/mobile_JSVM_quickjs.jpg)

<br />

正式介绍 QuickJS 前我们先说说它的作者：**Fabrice Bellard**。

软件界一直有个说法，一个高级程序员创造的价值可以超过 20 个平庸的程序员，但 Fabrice Bellard 不是高级程序员，他是天才，在我看来他的创造力可以超过 20 个高级程序员，我们可以顺着[时间轴](https://bellard.org/)理一下他创造过些什么：

> - 1997年，发布了最快速的计算圆周率的算法，此算法是 Bailey-Borwein-Plouffe 公式的变体，前者的时间复杂度是O(n^3)，他给优化成了O(n^2)，使得计算速度提高了43%，这是他在**数学**上的成就
> - 2000 年，发布了 FFmpeg，这是他在**音视频领域**的一个成就
> - 2000，2001，2018 三年三度获得国际混淆 C 代码大赛
> - 2002 年，发布了TinyGL，这是他在**图形学领域**的成就
> - 2005 年，发布了 QEMU，这是他在**虚拟化领域**的成就
> - 2011 年，他用 JavaScript 写了一个 PC 虚拟机 Jslinux，一个跑在浏览器上的 Linux **操作系统**
> - 2019 年，发布了 QuickJS，一个支持 ES2020 规范的 JS **虚拟机**

当人和人之间的差距差了**几个数量级**后，羡慕嫉妒之类的情绪就会转变为崇拜了，Bellard 就是一个这样的人。

<br />

收复一下心情，我们来看一下 QuickJS 这个项目。QuickJS 继承了 Fabrice Bellard 作品的一贯特色——**小巧而又强大**。

QuickJS **体积非常小**，只有几个 C 文件，没有乱七八糟的第三方依赖。但是他的功能又非常完善，**JS 语法支持**到 [ES2020](https://tc39.es/ecma262/)，[Test262](https://test262.report/browse/?date=2020-12-16) 的测试显示，QuickJS 的语法支持度比 V8 还要高。

![test262](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/test262.jpg)

<br />

那么 QuickJS 的**性能**如何呢？QuickJS 官上有个[基准测试](https://bellard.org/quickjs/bench.html)，综合比较了多款 JS 引擎对同一测试用例的跑分情况。下面是测试结果：

![JSVM_Benchmark](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/JSVM_%20Benchmark.jpg)

结合上面的表格和个人的一些测试，可以简单的得出一些结论：

- 开启 JIT 的 V8 综合评分差不多是 QuickJS 的 35 倍，但是在同等主打**轻量**的 JS 引擎中，QuickJS 的**性能**还是很耀眼的
- 在内存占用上，QuickJS 远低于 V8，毕竟 JIT 是是吃内存的大户，而且 QuickJS 的设计对嵌入式系统很友好（Bellard 成就奖杯 🏆 再 +1）
- QuickJS 和 Hermes 的跑分情况是差不多的，我私下做了一些性能测试，这两个引擎的表现也很相近

<br />

因为 QuickJS 的设计，我不经好奇他和 Lua 的性能对比如何。Lua 是一门非常小巧精悍的语言，在游戏领域和 C/C++ 开发中一直充当胶水语言的作用，我个人写了一些测试用例，发现 QuickJS 和 Lua 的执行效率也是差不多的，后来在网上找到一篇博文 [Lua vs QuickJS](https://sabotage-linux.neocities.org/blog/9/)，这个老哥也做了一些测试，结论也是它俩的性能差不多，在部分场景 Lua 会比 QuickJS 快一些。

<br />

官方文档里有提到，QuickJS 支持[生成字节码](https://bellard.org/quickjs/quickjs.html#Bytecode)，这样可以免去 JS 文件编译解析的过程。我一开始以为 QuickJS 和 Hermes 一样，可以直接生成字节码，然后交给 QuickJS 解释执行。后来自己编译了一下才发现，QuickJS 的作用机制和 Hermes 还不太一样：`qjsc` 生成字节码的 `-e` 和 `-c` 选项，都是先把 js 文件生成一份字节码，然后拼到一个 `.c` 文件里，大概长下面的这个样子：

```c
#include <quickjs/quickjs-libc.h>

const uint32_t qjsc_hello_size = 87;

// JS 文件编译生成的字节码都在这个数组里
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

因为这是个 `.c` 文件，想跑起来还得**再**编译一次生成二进制文件。

从字节码这个设计点来看，QuickJS 和 Hermes 的定位还是不太一样的。虽然直接生成字节码可以大大减少 JS 文本文件的解析时间，但是 QuickJS 还是更偏嵌入式一些，生成的字节码放在一个 C 文件中，还需要进行编译才能运行；Hermes 为 React Native 而生，生成的字节码一开始就考虑到分发功能（热更新就是一个应用场景），支持字节码的直接加载运行，不需要再编译一次。

<br />

上面主要还是对性能的考量，下面我们看看开发体验，首先是 QuickJS 的`调试功能`支持。到目前为止（2021-02-22），QuickJS 还没有官方的调试器，也就是说 `debugger` 语句会被忽略，社区有人实现了一套基于 VSCode 的调试器支持 [vscode-quickjs-debug](https://github.com/koush/vscode-quickjs-debug)，但是会对 QuickJS 做一些定制，个人还是蛮期待官方支持某个调试器协议的。

从 `集成` 的角度上看，社区上已经有了 [iOS](https://github.com/siuying/QuickJS-iOS) 和 [Android](https://github.com/seven332/quickjs-android) 的示例项目，可以拿来用来参考接入到自己的工程中。

<br />

**综合来看，QuickJS 是一款潜力非常大的 JS 引擎，在 JS 语法高度支持的前提下，还把性能和体积都优化到了极致。在移动端的 Hybrid UI 架构和游戏脚本系统都可以考虑接入。**





##  选型思路

### 1.单引擎

单引擎的意思就是 iOS 端和 Android 端统一采用一个引擎，这样做的话在 JS 层差异可以抹平，不容易出现同一份 JS 代码在 iOS 上运行是好的，Android 上就出错的奇异 BUG。结合市面上的跨端方案，大概有下面三种选型：

- **统一采用 JSC**：这个是 React Native 0.60 之前的方案
- **统一使用 Hermes**：这个是 React Native 0.64 之后的设计方案
- **统一采用 QuickJS**：QuickJS 体积很小，可以用来制作非常轻量的 Hybrid 系统

上面看出没有统一采用 V8，这个就是我前面说的，V8 在 iOS 平台没有主场优势，关闭 JIT 后性能和 JSC 差不多，还会增大包体积，并不是很划算。



### 2.双引擎

双引擎也很好理解，就是 iOS 端和 Android 端各用各的，优点是可以发挥各自的主场优势，缺点是可能会因为平台不一致导致双端运行结果不统一，现在的方案有这么几种：

- **iOS 用 JSC，Android 用 V8**：Weex，NativeScript 都是这样的，可以在包体积和性能上有较好的均衡
- **iOS 用 JSC，Android 用 Hermes**：React Natvie 现如今的方案
- **iOS 用 JSC，Android 用 QuickJS**：滴滴的跨端框架 [hummer](https://hummer.didi.cn/doc#/zh-CN/hummer_design) 就是这样的设计

从选型上看，iOS 上都选择了 JSC，Android 各有各的选择，倒是充分发挥了两个平台的特色 : )



### 3.调试

无论是单引擎还是双引擎，集成后的业务开发体验也很重要。对于自带 debugger 功能的引擎来说一切都不在话下，但是对于没有实现调试协议的引擎来说，缺少 debugger 还是会影响体验的。

但不是也没有办法，一般来说我们可以曲线救国，类似于 React Native 的 `Remote JS Debugging` 的思路，我们可以加个开关，把 JS 代码通过 websocket 传送到 Chrome 的 Web Worker，然后用 Chrome 的 V8 进行调试。这样做的优势是可以调整一些业务上的 BUG，劣势就是又会引入一个 JS 引擎，万一遇到一些引擎实现的 BUG，就很难 debug 了。不过好在这种情况非常非常少见，我们也不能因噎废食对吧。





## 总结

本文从**性能**、**体积**、**调试便捷性**等功能点出发，分析了 **JavaScriptCore**，**V8**，**Hermes** 和 **QuickJS** 这 4 款 JS 引擎，分别分析了它们的缺点和弱点，如果大家有移动端 JS 引擎选型的困惑，我认为从本文出发，还是可以给不少人以灵感的，希望我的这篇文章能帮助到大家。





## 参考链接

[跨端框架的核心技术到底是什么？](https://supercodepower.com/cross-platform-tech)

[如何隐藏你的热更新 bundle 文件？](https://supercodepower.com/how-to-hide-bundle)

[深入理解JSCore](https://tech.meituan.com/2018/08/23/deep-understanding-of-jscore.html)

[QuickJS 引擎一年见闻录](https://zhuanlan.zhihu.com/p/161722203)


----

个人微信：**egg_labs**

<p>
<img src="https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/Uh1E2O.png" width="40%" referrerpolicy="no-referrer" />
</p>

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::




