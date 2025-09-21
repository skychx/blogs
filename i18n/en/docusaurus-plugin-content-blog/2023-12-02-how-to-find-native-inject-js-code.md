---
slug: find-native-inject-js
title: 🛠️ [Hybrid App Dev] How to Locate the JS Code Injected into Hybrid Web Pages by Native
authors: skychx
description: How to Locate the JS Code Injected into Hybrid Web Pages by Native
tags: [debug, hybrid]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="find_inject_js_hero_image.jpg" w={1920} h={800} />

A webpage can not only run on public browsers, but also on the WebView component within the APP. Since these Hybrid Web pages run in a relatively closed environment, the APP itself can inject some JS code into WebView, making targeted enhancements to the Web page (the most typical application is JSBridge, which provides a bridge for `Web <--> Native` communication).

{/* truncate */}

<br />

In most cases, business development does not need to perceive these Native injected codes, but in some performance optimization situations, it is necessary to perceive the timing and running conditions of these Native injected codes, so as to better locate problems.

Since the debug debugging tools of Chrome/Safari are basically for pure Web services, and this demand is very niche, so the support for this capability is not very good. There are not many summary articles on this small demand on the internet, and the answers from ChatGPT are also barely satisfactory. I have done some related work recently, so I just noted it down to help someone who is destined.

<br />

## Directly View Native Code

If you are familiar with the encapsulation code of Native WebView, or have some Native experience, reading the source code directly is the fastest way. Here I will talk about a few of the most commonly used JS injection APIs:

### iOS

iOS mainly focuses on these 3 APIs:

 [addScriptMessageHandler](https://developer.apple.com/documentation/webkit/wkusercontentcontroller/1537172-addscriptmessagehandler?language=objc)

```objectivec
- (void)addScriptMessageHandler:(id<WKScriptMessageHandler>)scriptMessageHandler 
                           name:(NSString *)name;
```

This method can add a JS object with a specified name to the WKWebView environment. The frontend can call the postMessage method of this object to send messages to the client. The frontend calls it like this:

```javascript
window.webkit.messageHandlers.<name>.postMessage(<messageBody>)
```

<br />

 [addUserScript](https://developer.apple.com/documentation/webkit/wkusercontentcontroller/1537448-adduserscript?language=objc)

```objectivec
// WKUserContentController
- (void)addUserScript:(WKUserScript *)userScript;
```

This function can inject JS script strings into WKWebView.

<br />

 [evaluateJavaScript](https://developer.apple.com/documentation/webkit/wkwebview/1415017-evaluatejavascript?language=objc)

```objectivec
// WKWebView
- (void)evaluateJavaScript:(NSString *)javaScriptString 
         completionHandler:(void (^)(id, NSError *error))completionHandler;
```

This function can also run a piece of JS code in the WKWebView context.

In fact, there are many injection functions, but these 3 are the most commonly used. The other functions have some subtle differences with them. If you are interested, you can directly look at the official documents.

<br />

Another thing to note is the timing of JS code injection, whether the code is injected before or after the page loads, the impact may be very different. And there are also many APIs for this, you can refer to the document: [WKNavigationDelegate](https://developer.apple.com/documentation/webkit/wknavigationdelegate?language=objc), pay special attention to [didStartProvisionalNavigation](https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455621-webview?language=objc) and [didFinishNavigation](https://developer.apple.com/documentation/webkit/wknavigationdelegate/1455629-webview?language=objc).

![https://bbs.huaweicloud.com/blogs/331397](https://image-1255652541.file.myqcloud.com/uPic/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0ZvcmV2ZXJfd2o=,size_16,color_FFFFFF,t_70.png)


<br />

### Android

Android mainly focuses on these 2 APIs: [addJavascriptInterface](https://developer.android.com/reference/android/webkit/WebView#addJavascriptInterface(java.lang.Object,%20java.lang.String))

```kotlin
/** Instantiate the interface and set the context.  */
class WebAppInterface(private val mContext: Context) {
    // Expose the showToast method to WebView through @JavascriptInterface annotation
    @JavascriptInterface
    fun showToast(toast: String) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show()
    }
}

val webView: WebView = findViewById(R.id.webview)

// "Android" will be exposed on the window variable of Webview
webView.addJavascriptInterface(WebAppInterface(this), "Android")
```

Then the front end can call it directly:

```html
<input type="button" value="Say hello" onClick="showAndroidToast('Hello Android!')" />

<script type="text/javascript">
  function showAndroidToast(toast) {
    window.Android.showToast(toast);
  }
</script>
```

<br />

 [evaluateJavascript](https://developer.android.com/reference/android/webkit/WebView#addJavascriptInterface(java.lang.Object,%20java.lang.String))

```kotlin
public void evaluateJavascript (String script, ValueCallback<String> resultCallback)
```

Similar to iOS, it also runs a piece of JS script in the WebView context.

<br />

Likewise, Android also needs to pay attention to the timing of JS code injection. There are too many APIs, refer to this link: [WebViewClient#public-methods](https://developer.android.com/reference/android/webkit/WebViewClient#public-methods_1), focus on [onPageStarted](https://developer.android.com/reference/android/webkit/WebViewClient#onPageStarted(android.webkit.WebView,%20java.lang.String,%20android.graphics.Bitmap)) and [onPageFinished](https://developer.android.com/reference/android/webkit/WebViewClient#onPageFinished(android.webkit.WebView,%20java.lang.String)).


## Locating with Web Debugging Tools

As mentioned earlier, viewing the injected JS code is a very niche requirement, so debugging tools do not provide a separate viewing panel. All capabilities are pieced together, and some capabilities are complementary between iOS and Android 😓, overall it's a bit messy.

:::info TIPS
For how to remotely debug Web pages, you can refer to this article: [Summary of various "real machine remote debugging" methods](https://github.com/jieyou/remote_inspect_web_on_real_device/tree/master)
:::

:::info TIPS
If you want to remotely debug APP WebView pages, you need to enable debugging capabilities at the Native layer

- **iOS**: Versions above 16.4 need to set [webView.isInspectable = true](https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/) to enable remote debugging
- **Android**: Set [setWebContentsDebuggingEnabled(true)](https://developer.android.com/reference/android/webkit/WebView#setWebContentsDebuggingEnabled(boolean)) to enable remote debugging
:::


### Common

There are two common solutions for both iOS and Android:



#### Debug

We can debug to the key code, then view the **call stack** to find the injected code:

iOS uses Safari Devtool for debugging, the viewing method is as follows:

![Xnip2023-12-01_20-39-35](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_20-39-35.jpg)

<br />

Android uses Chrome Devtool for debugging, the viewing method is as follows:

![Xnip2023-12-01_20-35-29](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_20-35-29.jpg)



<br />

#### Log

Another method is to add a `console.log` call in the JS code injected by Native, so that when the injected code runs, you can find the injected script from the **resource reference** of the Console panel.



But this problem has a paradox:

- Generally, the injected script will not add a log call in order not to increase the runtime performance burden, so it is generally not usable
- If the developer actively adds a log in the injected JS code, it means that he has some native experience, **so why not look at the native code directly**?

So this method is more like an auxiliary solution, used to assist other solutions to troubleshoot problems.

<br />

### iOS

iOS has two ways to view the injected code.

The first is in the "Source" "Additional Scripts", where you can see the scripts injected by Native through `addUserScript`, which are neat and relatively easy to view. But the problem is that it will **not** list the code injected by `evaluateJavaScript`.

![Xnip2023-12-01_19-13-08](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_19-13-08.jpg)

<br />

Here introduces the second method, that is, "Global Search".

Safari's global search function can simultaneously search for code in `addUserScript`/`evaluateJavaScript`/`normally loaded resources`, so if you know some key information about the injected code, you can locate the code through search.

![Xnip2023-12-01_19-19-00](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_19-19-00.jpg)

<br />


### Android

Here Android uses Chrome Devtool to view the injected code. After using Chrome Devtool for so long, this is the first time I found that it is not as good as Safari, that is, it does not have what Safari Devtool has. However, Chrome Devtool Performance can save the day in a roundabout way. We can obtain a performance analysis flame graph through performance recording, and then check the code execution situation of the main thread, which is generally the `Evaluate Script` stage. Then we can locate the possible execution timing. By clicking on the Bar to expand the Summary panel, there is generally a file starting with `VM`. Opening it will display the injected JS code:

![Xnip2023-12-01_19-47-10](https://image-1255652541.file.myqcloud.com/uPic/Xnip2023-12-01_19-47-10.jpg)



<br />


## Conclusion

From the above content, it can be seen that locating the "injected JS code" is quite troublesome, and various methods need to be used in a roundabout way. In many cases, various techniques need to be used in combination to locate. I hope this article can help some developers and reduce the time spent on debugging.

