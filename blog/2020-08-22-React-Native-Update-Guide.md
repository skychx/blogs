---
id: React-Native-Update-Guide
title: Vary + CORS，两大云厂商都在上面栽了跟头
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/WechatIMG17.jpeg
description: Vary + CORS，两大云厂商都在上面栽了跟头
draft: true
tags: [HTTP, '计算机网络', '网络安全']
---

# React Native 版本升级指南



## 前言

React Native 作为一款跨端框架，有一个最让人头疼的问题，那就是**版本更新**。尤其是遇到大版本更新，JavaScript、iOS 和 Android 三端的配置构建文件都有非常大的变动，有时候三者的配置文件又互相耦合在一起，往往牵一发而动全身。



本文假定 React Native 升级的主导者是**前端**同学，比较熟悉 javaScript 为主的一套前端构建流程。如果有条件，升级时强烈建议拉上                iOS 和 Android 开发，对于一些琐碎的升级细节，**当面沟通远比搜索引擎高效**。



> 提示：因为每次修改和新增内容都会隐藏文章重新审核，建议阅读博客原文获得最佳阅读体验

👉 [阅读博客原文](https://supercodepower.com/docs/react-native-upgrade/index)

觉得文章对你有用的话一定要记得**点赞**哦 🌟，谢谢你，这对我来说真的很重要！

<!--truncate-->

<br />




## 一、磨刀不误砍柴工

这部分知识我认为是最重要的，毕竟**版本更新是永恒的，操作流程却是不变的**。



详细介绍各端构建工具前，我们抛开各种技术细节，从整个项目的生命周期出发，看看大部分产品是怎么做技术规划的：

- **产品早期**：架构都比较简单，整个项目拿个**配置文件**做配置就好了，配置文件越简单越好，xml、json 就被拿出来用了
- **产品发展期**：需要配置的地方变多了，这时候**多加几个配置项多加几个参数**，虽然有些繁琐，但静态的配置文件还够用
- **产品成熟期**：人员扩增代码膨胀，静态的配置文件完全不够用了，为了达到动态配置的目的，往往会引入一门**脚本语言**或自创一套 **DSL** 来管理相关配置
- ~~**产品晚期**：一把火烧了另起炉灶（记得删掉）~~



理清一个技术产品的生命周期后，你就会对日常开发中配置文件有了整体的认知：那些又臭又长的配置项，乱七八糟的兼容写法，毫无美感的 DSL，最神奇的是这些七拼八凑的东西还能把项目跑起来，Build 成功的那一刻你一定会对这种人类奇迹发出由衷的敬佩之情——**原来这就叫专业啊**！



收一收澎湃的情绪，牢记上面的指导经验，我们下面开始讨论技术细节。



<br />



### 1.【Web 前端】项目配置

前端工程化一直是前端里面的热点，虽然一直很热，但是具体实现还是一团糟。个人认为原因主要有两点，一个是前端构建从无到有，相对而言基础薄弱；一个是社区推动，百花齐放的同时又没有统一标准。就拿现在前端的主要配置文件来说：

- 用 `package.json` 管理 npm 包
- 用 npm script 实现流程管理，有时候还要把相关脚本塞到 `package.json` 里
- 用 eslint 进行编码规范，有时候还要写个 `.eslintrc.js`
- 用 babel 处理语法兼容，有时候还要写个 `babel.config.js`
- 用 webpack 进行项目构建和打包发布
- ......

上面只是列出了几个主流配置，不出意外的话，现在你的项目里已经有 5 个**配置文件**了，在 JavaScript 这个前端万能**脚本语言**的粘合下，这些配置文件还可以**互相引用互相耦合**，复杂度搞成这样，开发体验还没有 iOS Android 的一半好。

如果你认为我只是单纯的批评前端那你就理解错了，我想表达的是，这么复杂的配置都能搞定，iOS Android 的项目配置还不是**手到擒来**？



<br />



### 2.【iOS】项目配置

iOS 项目主要有两个点：**project.pbxproj** 和 **CocoaPods**。这两块儿的知识了解后，升级 RN 就完全不虚了。



#### 1⃣️ project.pbxproj 与 Xcode

`project.pbxproj` 就是一个 iOS 项目的**配置文件**，从数据结构特点上有些像 JSON，年龄可以追溯到 NeXT，可读性基本为 0，每次 git 合并都是纯黑的噩梦。不信你瞅瞅下图，这是给人看的吗。

![image-20200825202753481](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200825202753481.png)

可读性这么差的东西能传下来，其实全靠 **XCode** 这个 IDE 给它续命。我们每次在 XCode 里修改的配置，例如 `Build Settings` 等选项，最后都会反映到 `project.pbxproj` 这个配置文件上，也算是一种另类 DSL 了。

`project.pbxproj` 相关的知识我推荐下面几篇文章，阅读后会让你对 iOS 编译打包流程有个更深的了解：

- [iOS 开发 xcode 中的 project.pbxproj -- 深入剖析](https://blog.csdn.net/kuangdacaikuang/article/details/52987132)：介绍了 `project.pbxproj` 文件的一些特点

- [Xcode 工程文件 project.pbxproj 小结](Xcode工程文件project.pbxproj小结)：看完后会对 XCode 配置和 `project.pbxproj` 文件的对应关系有着更深刻的了解
- [Xcode - Target , PROJECT 区别](https://www.jianshu.com/p/e304247ede59)：介绍了 Xcode 中各个配置项是什么意思
- [XCode Build 过程](https://wiki.jikexueyuan.com/project/objc/Build-tool/6-1.html)



#### 2⃣️ CocoaPods

CocoaPods 是一个负责管理 iOS 项目中第三方开源库的工具，目前主流 iOS 工程都是用 CocoaPods 管理第三方库的。

React Native 在 0.60 里终于用上了 CocoaPods，和 iOS 社区步调一致了起来。这样做的好处就是后续维护和迭代的压力会小很多，鬼知道我以前升级各种 iOS SDK 的日子是怎么熬过来的。

相对 `project.pbxproj`，CocoaPods 无疑简单了不少，写配置脚本的 **Ruby** 语言也比较清爽，Podfile 的可读性要高很多。

```ruby
platform :ios, '9.0'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target '项目名称' do
  pod 'React', :path => '../node_modules/react-native/'
  pod 'React-Core', :path => '../node_modules/react-native/React'

  use_native_modules!
end
```

CocoaPods 的学习资料可以参考下文，不够的话自行搜索即可：

[CocoaPods 使用教程](https://www.jianshu.com/p/dfe970588f95)





<br />



### 3.【Android】项目配置

Android 的项目配置主要是由 **gradle** 文件控制的，gradle 文件又由 **Groovy** 这门 JVM 系的脚本语言书写。到这里思路就很明显了，我们只要了解一些 Groovy 的语法和 gradle 的写法，就能读懂和修改 Android 的配置文件了。在这里我推荐一些相关教程，读完后就会有个大致的了解：

- [Groovy 脚本基础全攻略](https://blog.csdn.net/yanbober/article/details/49047515)
- [Gradle 脚本基础全攻略](https://blog.csdn.net/yanbober/article/details/49314255)
- [Gradle 提示与诀窍](https://developer.android.google.cn/studio/build/gradle-tips?hl=zh_cn)



学习了基础的语法后，再回到 Android 工程上来。Android 的项目配置主要由 3 个文件控制，升级时冲突较多的也是这 3 个文件：

- `settings.gradle`：用来指示 Gradle 在构建应用时应将哪些模块包含在内
- `build.gradle`：定义适用于项目中所有模块的构建配置
- `app/build.gradle`：定义 App 的构建配置



个人认为 Android 的 Gradle 配置还是比较容易入门的，因为 gradle 文件有个好处，可以**随意的添加注释**。大家可以花点儿时间把每个配置项都加上注释，这样在升级改动过程中就不容易发怵。





<br />



### 4.RN 官方升级助手

React Native 官方在 2019 年 7 月 0.60 大版本更新时，推出了 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) 这个 Diff 小工具。通过这个工具我们可以方便的看出版本更新时各个配置脚本的改动，非常的方便。

![](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/ob8sym.jpg)



<br />



## 二、升级流程



RN 版本升级时，我的升级流程一般是这样的：

- 通畅的网络环境，可以自由访问 Google 那种
- 查看[官方博客](https://reactnative.dev/blog/)，获取版本更新的主要内容
- 阅读 RN GitHub 上的 [CHANGELOG](https://github.com/react-native-community/releases/blob/master/CHANGELOG.md)，获取版本更新的具体改动，适配 API 变更
- 阅读第三方依赖的 `README.md` 文件，是否需要同步升级
- 使用  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) 做版本 Diff，并阅读 [upgrading-react-native](https://reactnative.thenativebits.com/courses/upgrade-react-native/) 的相关博文，修改项目配置文件与配置脚本
- 删除 node_modules 与缓存，重新 Build 项目，如果 Build 失败，根据报错信息搜索 or 询问 Native 开发同学
- 回归测试

在更新过程中，个人建议 git commit 操作要尽量原子化，方便后续复盘和回滚，**小心驶得万年船**。

在我实际升级中，因为 React Native 0.59 到 0.60 有非常大的变动，并且业务较为复杂，升级 0.60 花了两个星期的时间：iOS 一周，Android 一周；0.61 和 0.62 的升级就比较简单了，大概一两个小时就可以升级好。



<br />





## 三、React Native 0.60 升级

2019 年 7 月 3 日 Facebook 官方发布了 React Native 0.60，这是一次非常大的版本更新，虽然没有添加新的功能，但是在底层上做了很多优化，向主流配置靠齐：

- 移除 WebView 等组件交给 [react-native-community](https://github.com/react-native-community/) 社区维护
- 利用 CocoaPods 管理 iOS 的第三方依赖，向 iOS 主流配置靠齐
- Android 迁移到 AndroidX，方便后续的升级与更新
- React Native 的一些第三方包会自动链接，不再需要手动使用 `react-native link *` 了



0.60 升级时一定要有耐心，不可能一次性成功的，建议参考  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)  和 [Upgrade to React Native 0.60](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.60/) 这篇博文，我会对文中没有说明的地方进行补充。



升级前先确保相关第三方包已经是最新版本。



<br />



### 1.React Native

JavaScript 这里相对来说好升级一些，毕竟是前端程序员的主场。根据 Diff 差异升级版本号后，还需要注意以下几点：

#### 1⃣️ 部分 RN 内置组件交给社区维护

**NetInfo**、**WebView** 和 **Geolocation** 从 React Native 中移除，交给 [react-native-community](https://github.com/react-native-community/) 社区维护。所以我们需要修改 `import` 时的路径。

**Slider**、**AsyncStorage**、**CameraRoll**、**Clipboard** 等组件也有移除计划，这次升级也可以顺便迁移一下。

值得注意的是，**[react-native-webview](https://github.com/react-native-community/react-native-webview)** 在一次更新中为了响应 App Store 政策，已经移除了 UIWebView，只支持 WKWebView。如果你做过移动端的适配，你肯定明白 WKWebview 对 cookie 支持不太友好，这里需要重点回归测试一下；另外一点是如果 RN 和 H5 网页是通过 `postMessage` 的方式交互，相关 API 也有一些不兼容更新，这里需要重点适配一下，具体细节可以看[文档](https://github.com/react-native-community/react-native-webview/blob/master/docs/Reference.md)。



#### 2⃣️ SwipeableFlatList 移除

SwipeableFlatList 是 React Native 在 0.5X 某个版本提供的**侧滑删除列表组件**，虽然一直没有官方文档中放出来，但是社区上已经有很多人在使用了。可能对这个组件的实现不太满意，官方在 0.60 里删除了这个组件。为了不让项目报错，我们可能需要把 SwipeableFlatList 相关的源码拿出来自己手动维护一下，有人把相关代码提出来维护了一个 npm 包——[react-native-swipeable-lists](https://github.com/nicastelo/react-native-swipeable-lists)，大家可以引入暂时过度一下。



<br />



### 2.iOS

0.60 版本的 React Native 支持 CocoaPods，2020 年了，RN 终于支持 CocoaPods 了，没有 CocoaPods 的时代，为了使用一些 iOS 第三方库，我们必须手动把库文件拖到主工程里，升级和维护非常不方便。因为 0.61 版本 CocoaPods 是唯一可选包管理方案，所以强烈建议直接升级使用。

#### 1⃣️ 迁移到 CocoaPods & Autolinking 支持

迁移 CocoaPods 前，先在 CLI 里输入一下命令 unlink Native Modules：

```bash
react-native unlink
```

unlink 后就要迁移到 CocoaPods 了。迁移前确保 Ruby 和 CocoaPods 已经安装成功，具体的安装过程不是本文重点就不展开了，没有安装的同学自行 Google 搜索。

我们在 ios 目录里新建一个文件 `Podfile`，在里面输入以下代码：

```ruby
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

```ruby
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



#### 2⃣️ 修改 Header Search Path

上一步修改了 React Native 项目的引用方式，但还有一个问题，那就是寻址的头文件路径并没有修改过来，我们可以观察下面两张图：

- 原来的 Header Search Path 指向的是 `$(SRCROOT)/../node_modules/*`

- 使用 CocoaPods 后路径发生了变化，变成了 `$(PODS_CONFIGURATION_BUILD_DIR)/*`

  

当时这个变化卡了我一天，而且这个变化是在 `project.pbxproj` 中的，非常难以阅读就忽略掉了。后来通过新建一个 RN 新项目发现了问题。解决方法是删除原来的 Header Search Path 内容，手动把新的路径添加进去。

![Xnip2020-08-23_14-50-59](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/Xnip2020-08-23_14-50-59.png)

![迁移后](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/RNDemo位置.png)

上面两步做完后可以尝试 build 一下项目，大概率你会发现还是 build 不起来。因为错误原因千奇百怪我也无法一一覆盖，这里还是问 Google 比较方便。



#### 3⃣️ 新增 Start Packager 脚本

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



#### 4⃣️ 新增 LaunchScreen.storyboard

随着 iPhone 产品线的增多，iPhone手机的尺寸也多了起来，原来一个尺寸配一个 `LaunchImage` 的方式逐渐变的不再适用，这时候  官方建议用 `LaunchScreen.storyboard` 来制作启动屏，并且要求 2021 年所有 APP 都得改为此方案。

具体的配置网上有很多教程了，大家搜索参考配置就好。我个人参考了以下教程：

- [iOS 开发时如何使用 Launch Screen Storyboard](https://www.jianshu.com/p/77054dccafdb)
- [通过 LaunchScreen.storyboard 来为 RN 应用添加启动屏](https://github.com/crazycodeboy/react-native-splash-screen/blob/master/add-LaunchScreen-tutorial-for-ios.md)
- [iOS 13 使用 LaunchScreen.storyboard 适配各尺寸启动图](https://juejin.im/post/6844904040132771847)



#### 5⃣️ 修改 xcodebuild 脚本

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



### 3.Android

0.60 的 Android 更新主要是 3 点：

- React Native 项目升级到 AndroidX
- React Native 第三方依赖支持 autolink
- 支持 Hermes，一个 Facebook 开源的 Javascript 引擎

升级前先需要升级 Gradle 和 Groovy 的版本。具体细节参考 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)。



#### 1⃣️ 升级到 AndroidX

AndroidX 的推进主要是 Google 官方受够了 Android 目前混乱不堪的 `android.support` ，用一个统一的 `androidx` 来代替。升级跟着 Android 官方文档走就行，我主要参考了以下文档：

- [总是听到有人说 AndroidX，到底什么是 AndroidX？](https://blog.csdn.net/sinyu890807/article/details/97142065)

- [AndroidX 概览](https://developer.android.com/jetpack/androidx?hl=zh-cn)
- [迁移到 AndroidX](https://developer.android.com/jetpack/androidx/migrate?hl=zh-cn)
- [Android AndroidX 的迁移](https://www.jianshu.com/p/7dc111353328)

迁移工作主要是修改 `import` 路径，工作量可能有些大，但心理负担较小，本质上就是改了个名字，问题不大。



#### 2⃣️ Autolinking 支持

Autolinking 功能集成前先试试运行 `react-native unlink`，看看能不能自动取消链接。如果取消失败，就要自己手动删除旧的 link 代码，加入新的 Autolinking 代码。下面我以 react-native-svg 这个第三方库为例进行说明：



1.检查 `android/settings.gradle`，删除旧的 `include` 配置，加入下面新的代码：

```groovy
rootProject.name = '你的项目'

- include ':react-native-svg'
- project(':react-native-svg').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-svg/android')

+ apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
```



2.检查 `android/app/build.gradle`，删除旧的配置，文件的最后一行加入一行配置：

```groovy
dependencies {
-   implementation project(':react-native-svg')
}

+ apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
```



3.检查 `MainApplication.java`，删除旧的引用：

```java
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

```java
+ import com.your-app-name.CustomToastPackage; // <-- Add this line with your package name.

protected List<ReactPackage> getPackages() {
  @SuppressWarnings("UnnecessaryLocalVariable")
  List<ReactPackage> packages = new PackageList(this).getPackages();
+   packages.add(new CustomToastPackage()); // <-- Add this line with your package name.
  return packages;
}
```



#### 3⃣️ Hermes 支持

![N4e9rx](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/N4e9rx.png)

[Hermes](https://hermesengine.dev/) 是一个 Facebook 开源的 Javascript 引擎，和现在的 JSC 相比，在包体积和启动速度上有所优化。社区上已经有很多介绍 Hermes 的文章了，我找了几篇比较好的，如果对 Hermes 感兴趣可以移步查看。

- [携程对 RN 新一代 JS 引擎 Hermes 的调研](https://cloud.tencent.com/developer/article/1492194)
- [React Native发布新一代JS引擎Hermes](https://juejin.im/post/6844903945467330567)
- [Hermes Engine 初探](https://juejin.im/post/6844903905306869767)

Hermes 的相关特性不是本文重点，所以就不多介绍了。

Android 想要使用 Hermes 的话，必须得使用版本号大于 0.60.4 的 React Native，并且要对 `android/app/build.gradle` 做一些修改：

```groovy
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



## 四、React Native 0.61 升级

React Native 0.61 最主要的更新就是 **Fast Refresh** 的引入了，这个功能大大提升了开发体验。

**Fast Refresh** 的加入有两个好处，第一个是把 **live reloading** 和 **hot reloading** 两个功能合二为一并做了功能加强；第二个终于支持 Hooks 热更新了。虽然 0.59.10 已经支持 hooks，但是当时的函数式组件不支持热更新，开发体验过于差劲。升级到 React Native 0.61 后就可以使用了。

整体来说 0.61 的更新很小，一两个小时就可以完成升级。升级前建议参考  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5)  和 [Upgrade to React Native 0.61](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.61/) 这篇博文，我会对文中没有说明的地方进行补充。



### 1.React Native

JavaScript 这里主要是一些 API 的变动和升级，跟着报错信息修改就好，难度并不大。

#### 1⃣️ React 升级到 16.9

React 升级到 16.9 后，`componentWillMount` 等 API 废弃，必须迁移到 `UNSAFE_componentWillMount` 等带有 `UNSAFE_` 前缀的 API。

主工程里这些 API 比较容易重构和替换，麻烦的是一些很久没有维护的第三方 JS 包，这时候需要自己手动 Fork 一份代码维护，或者替换同功能的正在维护的第三方包，这个属于技术债，只能一点一点克服。



#### 2⃣️ 引用路径改动

更新后有些方法和组件的引用路径发生了变更，需要我们适配一下：

1.`ErrorUtils` 默认绑定到 global 上，不需要 `import ErrorUtils from ErrorUtils` 导入了

`2.RCTNetworking` 引用路径发生改变，需要修改为：

```javascript
const RCTNetworking = require('react-native/Libraries/Network/RCTNetworking');
```

3.`Dimensions` 导入方式也发生了改变，需要修改：

```javascript
import Dimensions from 'Dimensions';
```

⬇️

```javascript
import { Dimensions } from 'react-native';
```



### 2.iOS

0.61 之后，React Native iOS 端只支持通过 Cocoapods Link 了，如果 0.60 已经升级到 Cocoapods 了，那么这次的 iOS 升级将会非常快，只需要改动 Podfile 中一些库的导入路径就可以了。

具体的差异可见 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5)，非常简单，比对修改后重新 `pod install` 就可以了。



### 3.Android

0.61 的 Android 升级也比较简单，升级了 Gradle 版本，修改了 Hermes 的引用路径，跟着  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5) 的 Diff 依次修改就可。





<br />



## 五、React Native 0.62 升级

React Native 0.62 也是加强了开发者体验，RN 项目默认引入了 **Flipper** 这个 Facebook 制作的移动端调试工具，支持了 **React DevTools v4**，错误提示可以选择新的 **LogBox**，比原来的错误提示更加友好从而更容易定位问题。

除了开发体验的加强，这次更新还支持了 Dark Mode 模式，RN 之后就可以做暗黑模式的适配了。

整体来说 0.62 的更新也很小，一两个小时就可以完成升级。升级前建议参考  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2)  和 [Upgrade to React Native 0.62](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.62/) 这篇博文，我会对文中没有说明的地方进行补充。



### 1.React Native

#### 1⃣️ useNativeDriver 显式指定

React Native 之前使用 `Animated` API 时，`useNativeDriver` 默认值为 false，也就是说默认都是  JS 线程绘制动画。版本升级后需要显式指定 `useNativeDriver` 的值。我认为这个更新的意义在于每次使用 `Animated` 时，强迫开发者思考能不能让动画在 Native 线程运行，优化动画体验。



#### 2⃣️ LogBox 开启

**LogBox** 这个功能在 0.62 里是默认关闭的，0.63 版本默认开启。0.62 里开启方式比较 Hack，需要按以下步骤操作：

1.项目根目录新建一个 `before.js`，然后里面只写一行代码：

```javascript
require('react-native').unstable_enableLogBox();
```

2.在 JS 所有文件的入口文件 `index.js` 的第一行里导入这个文件：

```javascript
import './before';
```

上面两步**必须严格执行**，不然的话会有红屏报错。





### 2.iOS

#### 1⃣️ CocoaPods 更新

Cocoapods 在这个版本里也有些改动，除去 Flipper 相关的 pod，改动非常小，根据 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) 中的 Diff 差异修改就好。



#### 2⃣️ Swift 支持

0.62 升级需要修改一些 Swift 相关的配置，具体升级流程可见 [React Native 0.62 upgrade (Xcode)](https://github.com/react-native-community/upgrade-support/issues/13)



### 3.Android

0.61 的 Android 升级也比较简单，升级了 Gradle 版本，除去 Flipper 相关的更新，改动非常小，跟着 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) 的 Diff 依次修改就可。



### 4.Flipper

![Flipper](https://github.com/facebook/flipper/raw/master/website/static/img/layout.png)

0.62 之后，**Flipper** 在 RN 的项目里是默认添加的，可以方便的查看 Layout、network 和 log 等信息。

旧项目升级时，**Flipper** 其实是可选的，安装有些波折，上手体验了一下感觉如下（版本为 0.52.1）：

- 把 React Native 的 `console.log` 信息和 Native 的 log 信息和在一个应用里，比较方便查看
- 可以查看 Native Layout 布局，并且内置了 `React DevTools v4`，两者比对可以方便查看布局
- Network 可以方便查看网络信息，这个一直是 RN 调试的一个痛点
- 可以快速的截屏录屏，有助于和 UED 沟通
- 支持自定义插件



上面都是优点，缺点还是有不少的，下面我说说我用下来感觉到的不足：

- network 对 UTF-8 支持不太好。**Flipper** 对编码没有处理好，导致中文显示乱码，我已经给官方提了 [issues](https://github.com/facebook/flipper/issues/1466)，但是一直没有理我
- network 图片解析也有问题，被解析为乱码的文本
- log 模块的数据都是字符串，即使你 log 的是 object，它也只是展示 `JSON.stringify` 后的数据



上面就是我的使用体验，要不要在项目中使用，我觉得大家还是亲自体验一下比较好。

如果要在项目中集成 **Flipper**，根据  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) 进行集成就好，难度不是很大。



<br />



## 后记

上面就是 React Native 版本升级指南的内容了，本升级教程会持续更新，为了获得最佳体验可以查看阅读[博客原文](https://supercodepower.com/docs/react-native-upgrade/index)。

觉得文章对你有用的话一定要记得**点赞**哦 🌟，谢谢你，这对我来说真的很重要！

<br />

更多优秀文章推荐：

- [React Native 性能优化指南](https://juejin.im/post/5e1676e16fb9a04847095b12)从渲染层的角度分析了 RN 性能优化的 6 个点，并以图文形式讲解了 FlatList 的实现原理
- 一篇介绍了 [webpack 中最易混淆的 5 个知识点](https://juejin.im/post/5cede821f265da1bbd4b5630)，掘金快 800 赞了，一文讲清楚 Webpack 中那些**长得像却意义不同的概念**
- 一篇详细介绍了 [webpack dll 是个什么东西](https://juejin.im/post/5d8aac8fe51d4578477a6699)，并且给出了 2 条最佳实践，**摆脱繁琐的 dll 配置**


<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::






