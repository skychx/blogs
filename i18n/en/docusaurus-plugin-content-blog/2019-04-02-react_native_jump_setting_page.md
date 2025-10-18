---
slug: react_native_jump_setting_page
title: 📣 React Native Jump to App Push Settings and Get Push Status
authors: skychx
description: React Native Jump to App Push Settings and Get Push Status
draft: false
tags: [react native, cross-platform development]
---

To improve push notification delivery rates, the product team proposed a requirement: **display a small tip when app push notifications are disabled, and clicking the tip should jump to the app's notification settings interface**.

Our app is built with React Native, and Facebook doesn't officially provide these features, so we need to develop corresponding native modules.

{/* truncate */}

Since developing native modules is quite advanced content, when writing this article I'll **assume** readers already have some `Objective-C` and `Java` development skills, so I'll directly show code and explain the approach.

<br />

For basic knowledge about developing native modules, you can directly check the **official documentation**, which is very detailed, so I won't repeat it here.

[React Native Android Native Modules](<https://reactnative.cn/docs/0.58/native-modules-android/>)

[React Native iOS Native Modules](<https://reactnative.cn/docs/0.58/native-modules-ios/>)

<br />

Let's start analyzing the implementation.

<br />

## Step 1: Get App Push Status

Here I mainly referenced **JPush**. Because our company has a unified push `SDK` (mainly integrating multiple push service companies and phone manufacturers' push services), some convenient features from JPush are temporarily unavailable, so I can only reference and implement them myself.

<br />

In my implementation, getting app push status mainly involves two things:

1. Compatibility with multiple system versions (credit goes to JPush developers for this part);
2. Wrapped in `Promise` form (JPush is callback-based)

<br />

The `getSystemNoticeStatus()` function returns `true` when app push is enabled, and `false` when disabled.

<br />

**iOS** code is as follows:

Reference link: [JPush iOS Code](https://github.com/jpush/jpush-react-native/blob/d35f59af4ffe523619c4a375103222a890b87392/ios/RCTJPushModule/RCTJPushModule.m#L152)

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
**Android** code is as follows:

Reference link: [JPush Android Code](https://github.com/jpush/jpush-react-native/blob/cdf76224643c9342771195d619132a90e06f6bed/android/src/main/java/cn/jpush/reactnativejpush/JPushModule.java#L143)

```java
/**
 *  Get app system notification status
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

Then we can directly reference it on the **JavaScript** side:

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

## Step 2: Jump to App Settings Interface

Jumping to the app settings interface also requires considering compatibility with different system versions. For example, iOS11+ now only allows jumping to the system settings home page / this app's settings page, and Android also needs to consider different manufacturers' modifications to app settings pages, which is quite a headache.

![Left: iOS app settings main page, Right: iOS push settings sub-page](https://image-1255652541.file.myqcloud.com/uPic/vORoiK.jpg)

First, let's handle **iOS** adaptation. We directly jump to this app's settings home page, which is the image below:

<img src="https://image-1255652541.file.myqcloud.com/uPic/eLjepK.jpg" width="50%" height="50%" />

<br />

This development is relatively simple, just directly use `Linking.openURL('app-settings:')` in React Native;

<br />

**Android** requires more code. Specific adaptations can be seen in the comments:

```java
/**
 *
 *  Jump to system notification settings interface
 *  this.appContext represents the file/app's context environment
 *
 */
@ReactMethod
public void openSystemNoticeView(){
    try {
        // Jump to notification settings interface
        Intent intent = new Intent();
        intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);

        //This solution applies to API 26, i.e., 8.0 (including 8.0) and above
        intent.putExtra(EXTRA_APP_PACKAGE, this.appContext.getPackageName());
        intent.putExtra(EXTRA_CHANNEL_ID, this.appContext.getApplicationInfo().uid);

        //This solution applies to API21-25, i.e., versions between 5.0-7.1
        intent.putExtra("app_package", this.appContext.getPackageName());
        intent.putExtra("app_uid", this.appContext.getApplicationInfo().uid);

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        this.appContext.startActivity(intent);
    } catch (Exception e) {
        e.printStackTrace();
        // If exception occurs, jump to app settings interface: Hammer
        Intent intent = new Intent();

        //The following solution directly jumps to the current app's settings interface.
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

Then we do some compatibility handling on the **JavaScript** side:

```javascript
import {
    Linking,
    Platform,
} from 'react-native';

/**
 *  Jump to app message settings page
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
When we need to jump, we can directly use the `openSystemNoticeSetting()` function.

<br />

The above are the two main difficulties encountered during development. If you find this article useful, you can give it a like to encourage me. Thank you.

<br />

<br />

<br />

<br />

:::note A small note
Welcome to follow the official account: **卤代烃实验室**: Focus on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::