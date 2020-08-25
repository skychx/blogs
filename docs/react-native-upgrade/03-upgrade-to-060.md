---
id: to-060
title: 0.60 升级
sidebar_label: 0.60 升级
description: React Native 升级、React Native 0.60 升级、React Native 0.61 升级、React Native 0.62 升级
keywords:
  - React Native 升级
  - React Native 0.60 升级
  - React Native 0.61 升级
  - React Native 0.62 升级
---

2019 年 7 月 3 日 Facebook 官方发布了 React Native 0.60，这是一次非常大的版本更新，虽然没有添加新的功能，但是在底层上做了很多优化，向主流配置靠齐：

- 移除 WebView 等组件交给 [react-native-community](https://github.com/react-native-community/) 社区维护
- 利用 CocoaPods 管理 iOS 的第三方依赖，向 iOS 主流配置靠齐
- Android 迁移到 AndroidX，方便后续的升级与更新
- React Native 的一些第三方包会自动链接，不再需要手动使用 `react-native link *` 了

<br />

0.60 升级时一定要有耐心，不可能一次性成功的，建议参考  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)  和 [Upgrade to React Native 0.60](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.60/) 这篇博文，我会对文中没有说明的地方进行补充。



升级前先确保相关第三方包已经是最新版本。

<br />

## 1.React Native

JavaScript 这里相对来说好升级一些，毕竟是前端程序员的主场。根据 Diff 差异升级版本号后，还需要注意以下几点：

### 1⃣️ 部分 RN 内置组件交给社区维护

**NetInfo**、**WebView** 和 **Geolocation** 从 React Native 中移除，交给 [react-native-community](https://github.com/react-native-community/) 社区维护。所以我们需要修改 `import` 时的路径。

**Slider**、**AsyncStorage**、**CameraRoll**、**Clipboard** 等组件也有移除计划，这次升级也可以顺便迁移一下。

值得注意的是，**[react-native-webview](https://github.com/react-native-community/react-native-webview)** 在一次更新中为了响应 App Store 政策，已经移除了 UIWebView，只支持 WKWebView。如果你做过移动端的适配，你肯定明白 WKWebview 对 cookie 支持不太友好，这里需要重点回归测试一下；另外一点是如果 RN 和 H5 网页是通过 `postMessage` 的方式交互，相关 API 也有一些不兼容更新，这里需要重点适配一下，具体细节可以看[文档](https://github.com/react-native-community/react-native-webview/blob/master/docs/Reference.md)。



### 2⃣️ SwipeableFlatList 移除

SwipeableFlatList 是 React Native 在 0.5X 某个版本提供的**侧滑删除列表组件**，虽然一直没有官方文档中放出来，但是社区上已经有很多人在使用了。可能对这个组件的实现不太满意，官方在 0.60 里删除了这个组件。为了不让项目报错，我们可能需要把 SwipeableFlatList 相关的源码拿出来自己手动维护一下，有人把相关代码提出来维护了一个 npm 包——[react-native-swipeable-lists](https://github.com/nicastelo/react-native-swipeable-lists)，大家可以引入暂时过度一下。

<br />


## 2.iOS

0.60 版本的 React Native 支持 CocoaPods，2020 年了，RN 终于支持 CocoaPods 了，没有 CocoaPods 的时代，为了使用一些 iOS 第三方库，我们必须手动把库文件拖到主工程里，升级和维护非常不方便。因为 0.61 版本 CocoaPods 是唯一可选包管理方案，所以强烈建议直接升级使用。

### 1⃣️ 迁移到 CocoaPods & Autolinking 支持

迁移 CocoaPods 前，先在 CLI 里输入一下命令 unlink Native Modules：

```bash
react-native unlink
```

unlink 后就要迁移到 CocoaPods 了。迁移前确保 Ruby 和 CocoaPods 已经安装成功，具体的安装过程不是本文重点就不展开了，没有安装的同学自行 Google 搜索。

我们在 ios 目录里新建一个文件 `Podfile`，在里面输入以下代码：

```java
platform :ios, '9.0'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target '项目名称' do
  pod 'React', :path => '../node_modules/react-native/'
  pod 'React-Core', :path => '../node_modules/react-native/React'
  pod 'React-DevSupport', :path => '../node_modules/react-native/React'
  pod 'React-RCTActionSheet', :path => '../node_modules/react-native/Libraries/ActionSheetIOS'
  pod 'React-RCTAnimation', :path => '../node_modules/react-native/Libraries/NativeAnimation'
  pod 'React-RCTBlob', :path => '../node_modules/react-native/Libraries/Blob'
  pod 'React-RCTImage', :path => '../node_modules/react-native/Libraries/Image'
  pod 'React-RCTLinking', :path => '../node_modules/react-native/Libraries/LinkingIOS'
  pod 'React-RCTNetwork', :path => '../node_modules/react-native/Libraries/Network'
  pod 'React-RCTSettings', :path => '../node_modules/react-native/Libraries/Settings'
  pod 'React-RCTText', :path => '../node_modules/react-native/Libraries/Text'
  pod 'React-RCTVibration', :path => '../node_modules/react-native/Libraries/Vibration'
  pod 'React-RCTWebSocket', :path => '../node_modules/react-native/Libraries/WebSocket'

  pod 'React-cxxreact', :path => '../node_modules/react-native/ReactCommon/cxxreact'
  pod 'React-jsi', :path => '../node_modules/react-native/ReactCommon/jsi'
  pod 'React-jsiexecutor', :path => '../node_modules/react-native/ReactCommon/jsiexecutor'
  pod 'React-jsinspector', :path => '../node_modules/react-native/ReactCommon/jsinspector'
  pod 'yoga', :path => '../node_modules/react-native/ReactCommon/yoga'

  pod 'DoubleConversion', :podspec => '../node_modules/react-native/third-party-podspecs/DoubleConversion.podspec'
  pod 'glog', :podspec => '../node_modules/react-native/third-party-podspecs/glog.podspec'
  pod 'Folly', :podspec => '../node_modules/react-native/third-party-podspecs/Folly.podspec'

  target '项目名称Tests' do
    inherit! :search_paths
    # Pods for testing
  end

  use_native_modules!
end
```

上面这段代码，`pod` 开头的都是从 `node_modules` 目录导入 `react-native` 相关的官方代码。下面两行代码是实现 autolink 的功能：

```java
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target '项目名称' do
  ...
  use_native_modules!
end
```

`Podfile` 配置好后，就在 ios 文件夹下运行 `pod install`，安装相关依赖。

安装成功后会生成一个  xcworkspace 空间，这时候你需要退出当前的 xcodeproj 项目，打开 xcworkspace。



在 xcworkspace 里，首先有两个顶层文件夹，一个是你的 xcodeproj 项目，一个是 Pods 文件夹（左图）：前者包含着你的业务代码，后者管理者安装的第三方库文件。这时候需要手动把 `你的项目/Libraries` 目录下的 `*.xcodeproj` 文件手动删除（右图红框 ➊），因为他们已经存在于 Pods 文件夹里了（右图红框 ➋）。

![iOS目录变化](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/iOS%E7%9B%AE%E5%BD%95%E5%8F%98%E5%8C%96.png)



### 2⃣️ 修改 Header Search Path

上一步修改了 React Native 项目的引用方式，但还有一个问题，那就是寻址的头文件路径并没有修改过来，我们可以观察下面两张图：

- 原来的 Header Search Path 指向的是 `$(SRCROOT)/../node_modules/*`

- 使用 CocoaPods 后路径发生了变化，变成了 `$(PODS_CONFIGURATION_BUILD_DIR)/*`

  

当时这个变化卡了我一天，而且这个变化是在 `project.pbxproj` 中的，非常难以阅读就忽略掉了。后来通过新建一个 RN 新项目发现了问题。解决方法是删除原来的 Header Search Path 内容，手动把新的路径添加进去。

![Xnip2020-08-23_14-50-59](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/Xnip2020-08-23_14-50-59.png)

![迁移后](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/RNDemo位置.png)

上面两步做完后可以尝试 build 一下项目，大概率你会发现还是 build 不起来。因为错误原因千奇百怪我也无法一一覆盖，这里还是问 Google 比较方便。



### 3⃣️ 新增 Start Packager 脚本

到这一步假设你已经 Build 起来 iOS 项目了，这时候你会发现一个问题，之前 iOS build 成功后，会自动启动一个 node 服务器编译 javascript 文件，更新后并没有自动启动 node 服务器，需要我们手动 `npm run start` 启动 node 服务器，非常的不方便。

问题出在哪里呢？原因是在原来的构建方式里，Libraries 下的 `React.xcodeproj` 有个 Start Packager 脚本，这个脚本会在项目 build 成功后自动启动一个 node 服务器：

![原_StartPackager_位置](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/原_StartPackager_位置.png)



迁移到 Pods 后，这个脚本就没有了，需要我们在主工程里手动添加一下。添加方式也很简单，我在下图也标注好了，点击项目文件夹，在 `TARGETS` 的 `Build Phases` 里点击 ➕，再点击 `New Run Script Phase` 新增一个脚本区域，然后把下面的代码填写进去：

![新建StartPackager](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/新建StartPackager.png)

```bash
export RCT_METRO_PORT="${RCT_METRO_PORT:=8081}"
echo "export RCT_METRO_PORT=${RCT_METRO_PORT}" > "${SRCROOT}/../node_modules/react-native/scripts/.packager.env"
if [ -z "${RCT_NO_LAUNCH_PACKAGER+xxx}" ] ; then
  if nc -w 5 -z localhost ${RCT_METRO_PORT} ; then
    if ! curl -s "http://localhost:${RCT_METRO_PORT}/status" | grep -q "packager-status:running" ; then
      echo "Port ${RCT_METRO_PORT} already in use, packager is either not running or not running correctly"
      exit 2
    fi
  else
    open "$SRCROOT/../node_modules/react-native/scripts/launchPackager.command" || echo "Can't start packager automatically"
  fi
fi
```

这个 Start Packager 脚本的位置也有些讲究，最好放在 `Check Pods Manifest.lock` 和 `Compile Sources` 之间，要不然启动 node 服务器时会导致报错。



### 4⃣️ 新增 LaunchScreen.storyboard

随着 iPhone 产品线的增多，iPhone手机的尺寸也多了起来，原来一个尺寸配一个 `LaunchImage` 的方式逐渐变的不再适用，这时候  官方建议用 `LaunchScreen.storyboard` 来制作启动屏，并且要求 2021 年所有 APP 都得改为此方案。

具体的配置网上有很多教程了，大家搜索参考配置就好。我个人参考了以下教程：

- [iOS 开发时如何使用 Launch Screen Storyboard](https://www.jianshu.com/p/77054dccafdb)
- [通过 LaunchScreen.storyboard 来为 RN 应用添加启动屏](https://github.com/crazycodeboy/react-native-splash-screen/blob/master/add-LaunchScreen-tutorial-for-ios.md)
- [iOS 13 使用 LaunchScreen.storyboard 适配各尺寸启动图](https://juejin.im/post/6844904040132771847)



### 5⃣️ 修改 xcodebuild 脚本

如果项目之前有配置过自动打包脚本，因为这次升级迁移到 workspace，所以也得对原来的打包脚本做一些修改：

```bash
xcodebuild archive -project 项目名称.xcodeproj
```

⬇️

```bash
xcodebuild archive -workspace 项目名称.xcworkspace
```

关于 xcodebuild 可以参考这两篇文章：

- [使用 xcodebuild 命令进行自动化打包](https://www.jianshu.com/p/f50053d50436)
- [Xcodebuild 从入门到精通](https://www.hualong.me/2018/03/14/Xcodebuild/)

<br />

## 3.Android

0.60 的 Android 更新主要是 3 点：

- React Native 项目升级到 AndroidX
- React Native 第三方依赖支持 autolink
- 支持 Hermes，一个 Facebook 开源的 Javascript 引擎

升级前先需要升级 Gradle 和 Groovy 的版本。具体细节参考 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)。



### 1⃣️ 升级到 AndroidX

AndroidX 的推进主要是 Google 官方受够了 Android 目前混乱不堪的 `android.support` ，用一个统一的 `androidx` 来代替。升级跟着 Android 官方文档走就行，我主要参考了以下文档：

- [总是听到有人说 AndroidX，到底什么是 AndroidX？](https://blog.csdn.net/sinyu890807/article/details/97142065)

- [AndroidX 概览](https://developer.android.com/jetpack/androidx?hl=zh-cn)
- [迁移到 AndroidX](https://developer.android.com/jetpack/androidx/migrate?hl=zh-cn)
- [Android AndroidX 的迁移](https://www.jianshu.com/p/7dc111353328)

迁移工作主要是修改 `import` 路径，工作量可能有些大，但心理负担较小，本质上就是改了个名字，问题不大。



### 2⃣️ Autolinking 支持

Autolinking 功能集成前先试试运行 `react-native unlink`，看看能不能自动取消链接。如果取消失败，就要自己手动删除旧的 link 代码，加入新的 Autolinking 代码。下面我以 react-native-svg 这个第三方库为例进行说明：



1.检查 `android/settings.gradle`，删除旧的 `include` 配置，加入下面新的代码：

```java {3,4,6}
rootProject.name = '你的项目'

- include ':react-native-svg'
- project(':react-native-svg').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-svg/android')

+ apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
```



2.检查 `android/app/build.gradle`，删除旧的配置，文件的最后一行加入一行配置：

```java {2,5}
dependencies {
-   implementation project(':react-native-svg')
}

+ apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
```



3.检查 `MainApplication.java`，删除旧的引用：

```java {1-6,8-11}
- @Override
- protected List<ReactPackage> getPackages() {
-   return Arrays.<ReactPackage>asList(
-     new MainReactPackage(),
-     new SvgPackage()
-   );

+   @SuppressWarnings("UnnecessaryLocalVariable")
+   List<ReactPackage> packages = new PackageList(this).getPackages();
+   return packages;
- }
```



值得注意的是，我们业务中很有可能会自己封装一些 Native Module，经过上面的修改后，导入 Native Module 的方式也要做相应的修改，这里可以参考官方文档 [Android Register the Module](https://reactnative.dev/docs/native-modules-android#register-the-module)：

```java {1,6}
+ import com.your-app-name.CustomToastPackage; // <-- Add this line with your package name.

protected List<ReactPackage> getPackages() {
  @SuppressWarnings("UnnecessaryLocalVariable")
  List<ReactPackage> packages = new PackageList(this).getPackages();
+   packages.add(new CustomToastPackage()); // <-- Add this line with your package name.
  return packages;
}
```



### 3⃣️ Hermes 支持

![N4e9rx](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/N4e9rx.png)

[Hermes](https://hermesengine.dev/) 是一个 Facebook 开源的 Javascript 引擎，和现在的 JSC 相比，在包体积和启动速度上有所优化。社区上已经有很多介绍 Hermes 的文章了，我找了几篇比较好的，如果对 Hermes 感兴趣可以移步查看。

- [携程对 RN 新一代 JS 引擎 Hermes 的调研](https://cloud.tencent.com/developer/article/1492194)
- [React Native发布新一代JS引擎Hermes](https://juejin.im/post/6844903945467330567)
- [Hermes Engine 初探](https://juejin.im/post/6844903905306869767)

Hermes 的相关特性不是本文重点，所以就不多介绍了。

Android 想要使用 Hermes 的话，必须得使用版本号大于 0.60.4 的 React Native，并且要对 `android/app/build.gradle` 做一些修改：

```java {2-4,7-8,11-15,17-23}
project.ext.react = [
-  entryFile: "index.js"
+  entryFile: "index.js",
+  enableHermes: false,  // clean and rebuild if changing
]

- def useIntlJsc = false
+ def jscFlavor = 'org.webkit:android-jsc:+'

dependencies {
-  if (useIntlJsc) {
-    implementation 'org.webkit:android-jsc-intl:+'
-  } else {
-    implementation 'org.webkit:android-jsc:+'
-  }
  
+  if (enableHermes) {
+    def hermesPath = "../../node_modules/hermesvm/android/";
+    debugImplementation files(hermesPath + "hermes-debug.aar")
+    releaseImplementation files(hermesPath + "hermes-release.aar")
+  } else {
+    implementation jscFlavor
+  }
}
```

上面只列出了主要变更，如果不想用 Hermes，可以完全不做更改；如果想要尝试一下，最好还是根据 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) 列出的详细变更进行修改，然后阅读 React Native 官网的 [Using Hermes](https://reactnative.dev/docs/hermes/) 进行配置与调试。

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::