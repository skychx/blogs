---
id: react_native_jump_setting_page
title: React Native 跳转到 APP 推送页面并获取推送状态
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/WechatIMG17.jpeg
description: React Native 跳转到 APP 推送页面并获取推送状态
draft: false
tags: [react native]
---

产品为了提高推送送达率，提了一个需求：**在 APP 推送关闭的情况下显示一个小 TIP，点击 TIP 跳转到 APP 消息设置界面**。


我们的 APP 是基于 React Native 开发的，这些功能 Facebook 官方没有提供，需要我们开发对应的原生模块。

<!--truncate-->

因为开发原生模块属于比较深入的内容了，写这篇文章时我就**默认**阅读者已经具有一定的 `Objective-C` 和 `Java` 开发能力，下面就直接贴代码说思路了。

<br />

开发一个原生模块的基础知识可以直接看**官方文档**，写的很详细，我这里就不多重复了。

[React Native 开发 Android 原生模块](<https://reactnative.cn/docs/0.58/native-modules-android/>)

[React Native 开发 iOS 原生模块](<https://reactnative.cn/docs/0.58/native-modules-ios/>)

<br />

下面开始分析实现。

<br />

## 第一步：获取 APP 推送状态



这里我主要参考**极光推送**。因为公司内部有统一的推送 `SDK`（主要整合了市面上多家推送服务公司和手机厂商的推送服务），一些极光推送很方便的功能暂时用不了，只能自己参考实现。


<br />
在我的实现里，获取 APP 推送状态主要做了两件事：

1. 兼容多个系统版本（这部分都是极光推送开发者的功劳）；
2. 以 `Promise` 的形式进行封装（极光推送是基于 `callback` 的）

<br />

`getSystemNoticeStatus()` 这个函数，在 APP 推送开启的情况下返回 `true`，未开启情况返回 `false`。

<br />

**iOS** 代码如下：

参考链接：[极光推送 iOS 代码](https://github.com/jpush/jpush-react-native/blob/d35f59af4ffe523619c4a375103222a890b87392/ios/RCTJPushModule/RCTJPushModule.m#L152)


```objectivec
RCT_EXPORT_METHOD( getSystemNoticeStatus: (RCTPromiseResolveBlock) resolve
rejecter: (RCTPromiseRejectBlock) reject )
{
	dispatch_async( dispatch_get_main_queue(), ^{
				float systemVersion = [[UIDevice currentDevice].systemVersion floatValue];


				if ( systemVersion >= 8.0 )
				{
					UIUserNotificationSettings *settings = [[UIApplication sharedApplication] currentUserNotificationSettings];
					UIUserNotificationType type = settings.types;
					if ( type == UIUserNotificationTypeNone )
					{
						return(resolve (@NO) );
					}else  {
						return(resolve (@YES) );
					}
				}else if ( systemVersion >= 10.0 )
				{
					[[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler: ^ (UNNotificationSettings * _Nonnull settings) {
						 switch ( settings.authorizationStatus )
						 {
						 case UNAuthorizationStatusDenied:
						 case UNAuthorizationStatusNotDetermined:
							 return(resolve (@NO) );
							 break;
						 case UNAuthorizationStatusAuthorized:
							 return(resolve (@YES) );
							 break;
						 }
					 }];
				}
			} );
}
```


<br /><br />
**Android** 代码如下：

参考链接：[极光推送 Android 代码](https://github.com/jpush/jpush-react-native/blob/cdf76224643c9342771195d619132a90e06f6bed/android/src/main/java/cn/jpush/reactnativejpush/JPushModule.java#L143)

```java
/**
 *  获取 APP 系统通知状态
 *
 *
 */
@ReactMethod
public void getSystemNoticeStatus(Promise promise) {
    promise.resolve(hasPermission("OP_POST_NOTIFICATION"));
}

private boolean hasPermission(String appOpsServiceId) {

    Context context = getReactApplicationContext();
    if (Build.VERSION.SDK_INT >= 24) {
        NotificationManager mNotificationManager = (NotificationManager) context.getSystemService(
                Context.NOTIFICATION_SERVICE);
        return mNotificationManager.areNotificationsEnabled();
    }else if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT){
        AppOpsManager mAppOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        ApplicationInfo appInfo = context.getApplicationInfo();

        String pkg = context.getPackageName();
        int uid = appInfo.uid;
        Class appOpsClazz;

        try {
            appOpsClazz = Class.forName(AppOpsManager.class.getName());
            Method checkOpNoThrowMethod = appOpsClazz.getMethod("checkOpNoThrow", Integer.TYPE, Integer.TYPE,
                    String.class);
            Field opValue = appOpsClazz.getDeclaredField(appOpsServiceId);
            int value = opValue.getInt(Integer.class);
            Object result = checkOpNoThrowMethod.invoke(mAppOps, value, uid, pkg);
            return Integer.parseInt(result.toString()) == AppOpsManager.MODE_ALLOWED;
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    return false;
}
```

<br />

然后我们在 **JavaScript**侧直接引用就可

```javascript
import {
    Platform,
    NativeModules,
} from 'react-native';

function getSystemNoticeStatus() {
    NativeModules.appName.getSystemNoticeStatus().then((isOpen) => {
        console.log('getSystemNotice', isOpen) // 
    }).catch((e) => {
        console.log('getSystemNoticeStatus error', e)
    });
}
```

<br /><br />



## 第二步：跳转到 APP 设置界面



跳转到 APP 设置界面也要考虑不同系统版本的兼容。比如说 iOS11+ 现在只允许跳转到系统设置首页/该应用的设置界面，Android 还要考虑不同厂商对 APP 设置页面的魔改，很是头疼。


![左图是 iOS APP 设置主页面，右图是 iOS 推送设置子页面](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/vORoiK.jpg)

首先 **iOS** 适配，我们直接跳转到该应用的设置首页，就是下图：

<img src="https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/eLjepK.jpg" width="50%" height="50%" />

这个开发比较简单，直接在 React Native 中引用 `Linking.openURL('app-settings:')` 就行；

<br />

**Android** 就要多些一些代码了，具体的适配可以看注释：

```java
/**
 *
 *  跳转到系统通知设置界面
 *  this.appContext 表示文件/应用的上下文环境
 *
 */
@ReactMethod
public void openSystemNoticeView(){
    try {
        // 跳转到通知设置界面
        Intent intent = new Intent();
        intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);

        //这种方案适用于 API 26, 即8.0（含8.0）以上可以用
        intent.putExtra(EXTRA_APP_PACKAGE, this.appContext.getPackageName());
        intent.putExtra(EXTRA_CHANNEL_ID, this.appContext.getApplicationInfo().uid);

        //这种方案适用于 API21——25，即 5.0——7.1 之间的版本可以使用
        intent.putExtra("app_package", this.appContext.getPackageName());
        intent.putExtra("app_uid", this.appContext.getApplicationInfo().uid);

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        this.appContext.startActivity(intent);
    } catch (Exception e) {
        e.printStackTrace();
        // 出现异常则跳转到应用设置界面：锤子
        Intent intent = new Intent();

        //下面这种方案是直接跳转到当前应用的设置界面。
        //https://blog.csdn.net/ysy950803/article/details/71910806
        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", this.appContext.getPackageName(), null);
        intent.setData(uri);

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        this.appContext.startActivity(intent);
    }
}
```

<br />

然后我们在 **JavaScript** 侧做一些兼容处理：

```javascript
import {
    Linking,
    Platform,
} from 'react-native';

/**
 *  跳转到 APP 消息设置页面
 *
 */
export function openSystemNoticeSetting() {
    if (Platform.OS === "android") {
        NativeModules.appName.openSystemNoticeView();
    } else {
        Linking.openURL('app-settings:')
            .catch(err => console.log('openSystemSetting error', err));
    }
}
```


<br />
需要跳转时，我们直接用`openSystemNoticeSetting()` 这个函数就行了。


<br />


上面就是开发中遇到的两个难点，如果此篇文章你认为对你有用，可以点个赞表示对我的鼓励，谢谢。