---
slug: find-native-inject-js
title: 🛠️ [跨端开发] 如何定位 Hybrid Web 页面中 Native 注入的 JS 代码
author: 卤代烃
author_title: 微信公众号@卤代烃实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 运行在 iOS APP 和 Android APP 内的 Hybrid Web 页面，如何利用调试技巧定位 Native 注入的 JS 代码
draft: true
tags: [调试技巧, 跨端开发]
---

一个网页除了可以运行在公共的浏览器上，也可以运行在 APP 端内的 WebView 组件上。由于这些 Hybrid Web 网页运行在一个相对封闭的环境里，所以 APP 本身可以向 WebView 中注入一些 JS 代码，对 Web 页面做定向增强（最典型的运用就是 JSBridge，提供了一道 Web <--> Native 通信的桥梁）。

<!--truncate-->

<br />

在绝大多数情况下，业务开发并不需要感知这些 Native 注入的代码，但是在一些 性能优化/链路排查 的情况下，就需要感知这些 Native 注入代码的时机和运行情况了，从而更好的定位问题。

由于 Chrome/Safari 的 debug 调试工具基本上是为 纯 Web 服务的，而且这个需求很小众，所以这个能力支持的并不是很好。这个小需求网络上没什么总结性的文章，ChatGPT 回答的也差强人意，正好这段时间也做了一些相关的工作，所以顺势就记下来，帮助某个有缘人。

<br />

## 直接查看 Native 代码

如果你对 Native WebView 的封装代码很熟悉，或者有一定的 Native 经验，直接阅读源码是最快的方式。这里我说几个最常用的 JS 注入 API：

### iOS

iOS 主要关注这 3 个 API：

#### [addScriptMessageHandler](https://developer.apple.com/documentation/webkit/wkusercontentcontroller/1537172-addscriptmessagehandler?language=objc)

```objectivec
- (void)addScriptMessageHandler:(id<WKScriptMessageHandler>)scriptMessageHandler 
                           name:(NSString *)name;
```

通过这个方法可以给WKWebView环境中添加一个指定 name 的 JS 对象，前端可以调用该对象的 postMessage 方法，向客户端发送消息。前端类似于这样调用：

```javascript
window.webkit.messageHandlers.<name>.postMessage(<messageBody>)
```

<br />

#### [addUserScript](https://developer.apple.com/documentation/webkit/wkusercontentcontroller/1537448-adduserscript?language=objc)

```objectivec
// WKUserContentController
- (void)addUserScript:(WKUserScript *)userScript;
```

可以用这个函数注入 JS 脚本字符串到 WKWebView 中。

<br />

#### [evaluateJavaScript](https://developer.apple.com/documentation/webkit/wkwebview/1415017-evaluatejavascript?language=objc)

```objectivec
// WKWebView
- (void)evaluateJavaScript:(NSString *)javaScriptString 
         completionHandler:(void (^)(id, NSError *error))completionHandler;
```

这个函数也可以在 WKWebView 上下文中运行一段 JS 代码。


其实还有很多注入函数，但常用的就这 3 个，其它的函数就是和他们有些细微的差别，感兴趣的可以直接看官方文档。

<br />

另外还需注意的是 JS 代码注入的时机，页面加载前还是页面加载后注入代码，带来的影响可能是大不一样的。而且这个 API 也特别多，可参考文档：[WKNavigationDelegate](https://developer.apple.com/documentation/webkit/wknavigationdelegate?language=objc)，重点关注 [didStartProvisionalNavigation](https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455621-webview?language=objc) 和 [didFinishNavigation](https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455629-webview?language=objc)。

![https://bbs.huaweicloud.com/blogs/331397](https://image-1255652541.file.myqcloud.com/uPic/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0ZvcmV2ZXJfd2o=,size_16,color_FFFFFF,t_70.png)


<br />

### Android

Android 主要关注这 2 个 API：

#### [addJavascriptInterface](https://developer.android.com/reference/android/webkit/WebView#addJavascriptInterface(java.lang.Object,%20java.lang.String))

```kotlin
/** Instantiate the interface and set the context.  */
class WebAppInterface(private val mContext: Context) {
    // 通过 @JavascriptInterface 注解，向 WebView 暴露 showToast 方法
    @JavascriptInterface
    fun showToast(toast: String) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show()
    }
}

val webView: WebView = findViewById(R.id.webview)

// "Android" 将会暴露在 Webview 的 window 变量上
webView.addJavascriptInterface(WebAppInterface(this), "Android")
```

然后前端直接调用即可：

```html
<input type="button" value="Say hello" onClick="showAndroidToast('Hello Android!')" />

<script type="text/javascript">
  function showAndroidToast(toast) {
    window.Android.showToast(toast);
  }
</script>
```

<br />

#### [evaluateJavascript](https://developer.android.com/reference/android/webkit/WebView#addJavascriptInterface(java.lang.Object,%20java.lang.String))

```kotlin
public void evaluateJavascript (String script, ValueCallback<String> resultCallback)
```

类似于 iOS，也是在 WebView 上下文中运行一段 JS 脚本。

<br />

同样的，Android 也要注意 JS 代码注入的时机。API 太多了，参考这个链接：[WebViewClient#public-methods](https://developer.android.com/reference/android/webkit/WebViewClient#public-methods_1)，重点关注 [onPageStarted](https://developer.android.com/reference/android/webkit/WebViewClient#onPageStarted(android.webkit.WebView,%20java.lang.String,%20android.graphics.Bitmap)) 和 [onPageFinished](https://developer.android.com/reference/android/webkit/WebViewClient#onPageFinished(android.webkit.WebView,%20java.lang.String))。


<br />

<br />


有能力阅读 Native 源代码是最理想的情况，但是现实一般很残酷：

- 绝大部分前端同学不懂 Native 代码
- 现在还存留的高流量 APP，基本都迭代 5 年以上了，代码一层一层糊成 💩 山，老师傅都得在里面绕半天
- 降本增笑，老师傅都没了

所以其实还有第 2 种**基于观测**的方案：利用 WebView Devtool 工具定位。

<br />


## 用 Web 调试工具定位

前面也说了，查看注入的 JS 代码是一个很小众的需求，所以调试工具并没有提供独立的查看面板，所有的能力都是**拼拼凑凑**起来的，而且部分能力 iOS 和 Android 互为补集 😓，整体上还有有些凌乱的。

:::info TIPS
如何远程调试 Web 页面，可以参考这篇文章：[各种「真机远程调试」方法汇总](https://github.com/jieyou/remote_inspect_web_on_real_device/tree/master)
:::

:::info TIPS
想远程调试 APP WebView 网页，需要在 Native 层开启调试能力

- **iOS**：16.4 以上版本需要设置 [webView.isInspectable = true](https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/) 开启远程调试
- **Android**：设置 [setWebContentsDebuggingEnabled(true)](https://developer.android.com/reference/android/webkit/WebView#setWebContentsDebuggingEnabled(boolean)) 开启远程调试
:::


### Common

iOS 和 Android 都通用的方案有这么两种：



#### Debug

我们可以通过 debug 到关键代码，然后查看**调用栈**，找到注入代码：

iOS 利用 Safari Devtool 调试，查看方式如下：

![Xnip2023-12-01_20-39-35](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_20-39-35.jpg)

<br />

Android 利用 Chrome Devtool 调试，查看方法如下：

![Xnip2023-12-01_20-35-29](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_20-35-29.jpg)



<br />

#### Log

还有一种方法是在 Native 注入的 JS 代码中，加入 `console.log` 的调用，这样在注入代码运行的时候，可以从 Console 面板的**资源引用**找到注入脚本。



但是这个问题有个悖论：

- 一般注入的脚本为了不增加运行时性能负担，是不会加 log 调用的，所以一般没法用
- 如果开发者主动去注入的 JS 代码中加入 log，那说明他有一定的 native 经验，**那为什么不直接看 native 代码呢**？

所以这样方法更像一种辅助方案，用来配合其它方案一起排查问题。

<br />

### iOS

iOS 有两种方式看注入的代码。

第一种是在「来源」的「**附加脚本**」里，可以在这里看到 Native 通过 `addUserScript` 注入的脚本，整整齐齐的，还是比较方便查看的。但有个问题是这里并**不会**列出 `evaluateJavaScript` 注入的代码。

![Xnip2023-12-01_19-13-08](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_19-13-08.jpg)

<br />

这里就介绍第二种方法，那就是「**全局搜索**」。

Safari 的全局搜索功能，可以同时搜索 `addUserScript`/`evaluateJavaScript`/`正常加载的资源` 里的代码，所以如果你知道注入代码的一些关键信息，可以通过搜索的方式定位代码。

![Xnip2023-12-01_19-19-00](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_19-19-00.jpg)

<br />


### Android

Android 这里使用 Chrome Devtool 查看注入代码。用了这么久的 Chrome Devtool，我是第一次发现它做的不如 Safari 的地方，那就是上面 Safari Devtool 有的东西它都没有。

但是 Chrome Devtool Performance 可以曲线救国一下，我们可以通过性能录制得到一份性能分析火焰图，然后查看主线程的代码执行情况，一般是 `Evalutae Script` 阶段，然后再定位可能的执行时机，通过点击 Bar 展开的 Summary 面板，一般有个 `VM` 开头的文件，打开就可显示注入的 JS 代码：

![Xnip2023-12-01_19-47-10](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_19-47-10.jpg)



<br />


## 总结

从上面内容可以看出定位「注入 JS 代码」还是挺麻烦的，需要用各种手段曲线救国，而且很多情况下各个技巧需要交叉使用才能定位到。希望我这篇文章可以帮助到一些开发者，减少 debug 内耗的时间。