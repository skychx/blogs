---
slug: React-Native-Update-Guide
title: 🚀 React Native Version Upgrade Guide
authors: skychx
description: A comprehensive guide to upgrading React Native versions, covering JavaScript, iOS, and Android configurations
draft: false
tags: [React Native, mobile development, upgrade guide]
---

# React Native Version Upgrade Guide

## Preface

React Native, as a cross-platform framework, has one of the most headache-inducing problems: **version updates**. Especially when encountering major version updates, the configuration and build files for JavaScript, iOS, and Android all undergo significant changes. Sometimes these configuration files are coupled together, where one change affects everything.

This article assumes that the person leading the React Native upgrade is a **frontend** developer who is familiar with JavaScript-based frontend build processes. If conditions permit, it's strongly recommended to involve iOS and Android developers during the upgrade. For some trivial upgrade details, **face-to-face communication is far more efficient than search engines**.

> Tip: Because each modification and new content will hide the article for re-review, it's recommended to read the original blog post for the best reading experience

👉 [Read Original Blog Post](https://supercodepower.com/docs/react-native-upgrade/index)

If you find this article useful, please remember to **like it** 🌟. Thank you, it really means a lot to me!

{/* truncate */}

<br />

## 1. Preparation is Key

I consider this part of the knowledge the most important, after all, **version updates are eternal, but the operational process remains unchanged**.

Before introducing the build tools for each platform in detail, let's set aside the technical details and look at the project lifecycle from a broader perspective to see how most products plan their technology:

- **Early product stage**: Architecture is relatively simple, the entire project can be managed with a **configuration file**. The simpler the configuration file, the better, so xml and json are used
- **Product development stage**: More configuration needs arise, at this time **add a few more configuration items and parameters**. Although somewhat cumbersome, static configuration files are still sufficient
- **Product maturity stage**: Personnel expansion and code bloat, static configuration files are completely insufficient. To achieve dynamic configuration, a **scripting language** or a custom **DSL** is often introduced to manage related configurations
- ~~**Product decline stage**: Burn it down and start over (remember to delete)~~

After understanding the lifecycle of a technology product, you'll have an overall understanding of configuration files in daily development: those long and smelly configuration items, messy compatibility code, unaesthetic DSLs, and most miraculously, these pieced-together things can actually run the project. The moment the build succeeds, you'll sincerely admire this human miracle—**so this is what professionalism looks like!**

Containing our surging emotions and keeping the above guiding experience in mind, let's start discussing the technical details below.

<br />

### 1. [Web Frontend] Project Configuration

Frontend engineering has always been a hot topic in frontend development. Although it's always popular, the specific implementation is still a mess. I personally believe there are two main reasons: one is that frontend builds started from scratch, with relatively weak foundations; the other is community-driven, with a hundred flowers blooming but no unified standards. Take the current main configuration files in frontend:

- Use `package.json` to manage npm packages
- Use npm scripts for process management, sometimes putting related scripts in `package.json`
- Use eslint for coding standards, sometimes writing a `.eslintrc.js`
- Use babel for syntax compatibility, sometimes writing a `babel.config.js`
- Use webpack for project building and packaging publishing
- ......

The above only lists a few mainstream configurations. If nothing unexpected, your project now has 5 **configuration files**. Under the bonding of JavaScript, the frontend's universal **scripting language**, these configuration files can also **reference and couple with each other**. With this level of complexity, the development experience is not even half as good as iOS and Android.

If you think I'm just criticizing frontend, then you misunderstood me. What I want to express is that if you can handle such complex configurations, iOS and Android project configurations are **a piece of cake**.

<br />

### 2. [iOS] Project Configuration

iOS projects mainly have two points: **project.pbxproj** and **CocoaPods**. After understanding these two areas, upgrading RN becomes completely stress-free.

#### 1⃣️ project.pbxproj and Xcode

`project.pbxproj` is the **configuration file** for an iOS project. From a data structure perspective, it's somewhat like JSON, dating back to the NeXT era, with basically zero readability. Every git merge is a pure nightmare. Believe it or not, look at the picture below, is this meant for humans to read?

![project.pbxproj example](https://image-1255652541.file.myqcloud.com/uPic/image-20200825202753481.png)

Something with such poor readability could be passed down, all thanks to the **XCode** IDE that keeps it alive. Every time we modify configurations in XCode, such as `Build Settings` and other options, they are eventually reflected in the `project.pbxproj` configuration file, which can be considered a form of alternative DSL.

For `project.pbxproj` related knowledge, I recommend the following articles. Reading them will give you a deeper understanding of the iOS compilation and packaging process:

- [iOS Development xcode project.pbxproj -- In-depth Analysis](https://blog.csdn.net/kuangdacaikuang/article/details/52987132): Introduces some characteristics of the `project.pbxproj` file
- [Xcode Project File project.pbxproj Summary](https://www.jianshu.com/p/1b2c3d4e5f6g): After reading, you'll have a deeper understanding of the correspondence between XCode configurations and `project.pbxproj` files
- [Xcode - Target, PROJECT Differences](https://www.jianshu.com/p/e304247ede59): Explains what each configuration item means in Xcode
- [XCode Build Process](https://wiki.jikexueyuan.com/project/objc/Build-tool/6-1.html)

#### 2⃣️ CocoaPods

CocoaPods is a tool responsible for managing third-party open-source libraries in iOS projects. Currently, mainstream iOS projects use CocoaPods to manage third-party libraries.

React Native finally started using CocoaPods in 0.60, aligning with the iOS community. The benefit of this is that subsequent maintenance and iteration pressure will be much smaller. God knows how I survived the days of upgrading various iOS SDKs before.

Compared to `project.pbxproj`, CocoaPods is undoubtedly much simpler. The **Ruby** language for writing configuration scripts is relatively clean, and the readability of Podfile is much higher.

```ruby
platform :ios, '9.0'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target 'YourProjectName' do
  pod 'React', :path => '../node_modules/react-native/'
  pod 'React-Core', :path => '../node_modules/react-native/React'

  use_native_modules!
end
```

For CocoaPods learning materials, you can refer to the following text. If it's not enough, you can search on your own:

[CocoaPods Tutorial](https://www.jianshu.com/p/dfe970588f95)

<br />

### 3. [Android] Project Configuration

Android project configuration is mainly controlled by **gradle** files, which are written in **Groovy**, a JVM-based scripting language. At this point, the approach is clear: as long as we understand some Groovy syntax and gradle writing conventions, we can read and modify Android configuration files. Here I recommend some related tutorials. After reading them, you'll have a general understanding:

- [Groovy Script Basics Complete Guide](https://blog.csdn.net/yanbober/article/details/49047515)
- [Gradle Script Basics Complete Guide](https://blog.csdn.net/yanbober/article/details/49314255)
- [Gradle Tips and Tricks](https://developer.android.google.cn/studio/build/gradle-tips?hl=zh_cn)

After learning the basic syntax, let's return to Android projects. Android project configuration is mainly controlled by 3 files, and these are also the files with the most conflicts during upgrades:

- `settings.gradle`: Used to indicate to Gradle which modules should be included when building the application
- `build.gradle`: Defines build configurations that apply to all modules in the project
- `app/build.gradle`: Defines the build configuration for the App

Personally, I think Android's Gradle configuration is relatively easy to get started with because gradle files have the advantage of being able to **freely add comments**. Everyone can spend some time adding comments to each configuration item, so you won't be intimidated during the upgrade process.

<br />

### 4. RN Official Upgrade Helper

React Native officially launched the [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) Diff tool in July 2019 during the 0.60 major version update. Through this tool, we can easily see the changes in each configuration script during version updates, which is very convenient.

![Upgrade Helper interface](https://image-1255652541.file.myqcloud.com/uPic/ob8sym.jpg)

<br />

## 2. Upgrade Process

When upgrading RN versions, my general upgrade process is as follows:

- Smooth network environment that can freely access Google
- Check the [official blog](https://reactnative.dev/blog/) to get the main content of version updates
- Read the [CHANGELOG](https://github.com/react-native-community/releases/blob/master/CHANGELOG.md) on RN GitHub to get specific changes in version updates and adapt to API changes
- Read third-party dependency `README.md` files to see if they need to be upgraded simultaneously
- Use [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) to do version Diff, and read related blog posts from [upgrading-react-native](https://reactnative.thenativebits.com/courses/upgrade-react-native/) to modify project configuration files and scripts
- Delete node_modules and cache, rebuild the project. If the build fails, search based on error messages or ask Native development colleagues
- Regression testing

During the update process, I personally recommend making git commit operations as atomic as possible to facilitate subsequent review and rollback. **Better safe than sorry**.

In my actual upgrades, because React Native 0.59 to 0.60 had very large changes and the business was quite complex, upgrading to 0.60 took two weeks: one week for iOS, one week for Android; upgrades to 0.61 and 0.62 were simpler, taking about one or two hours.

<br />

## 3. React Native 0.60 Upgrade

On July 3, 2019, Facebook officially released React Native 0.60. This was a very major version update. Although no new features were added, many optimizations were made at the underlying level, aligning with mainstream configurations:

- Remove components like WebView and hand them over to the [react-native-community](https://github.com/react-native-community/) for maintenance
- Use CocoaPods to manage iOS third-party dependencies, aligning with iOS mainstream configurations
- Android migrates to AndroidX for easier subsequent upgrades and updates
- Some React Native third-party packages will be automatically linked, no longer needing manual `react-native link *`

You must be patient when upgrading to 0.60, as it's unlikely to succeed in one go. It's recommended to refer to [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) and the blog post [Upgrade to React Native 0.60](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.60/). I will supplement areas not explained in the text.

Before upgrading, ensure that relevant third-party packages are already the latest versions.

<br />

### 1.React Native

JavaScript is relatively easier to upgrade here, after all, this is the home ground for frontend programmers. After upgrading the version number according to Diff differences, you also need to pay attention to the following points:

#### 1⃣️ Some RN built-in components handed over to community maintenance

**NetInfo**, **WebView**, and **Geolocation** have been removed from React Native and handed over to the [react-native-community](https://github.com/react-native-community/) for maintenance. So we need to modify the `import` paths.

Components like **Slider**, **AsyncStorage**, **CameraRoll**, **Clipboard** also have removal plans, and you can migrate them during this upgrade.

It's worth noting that **[react-native-webview](https://github.com/react-native-community/react-native-webview)** removed UIWebView in an update to respond to App Store policies, now only supporting WKWebView. If you've done mobile adaptation, you surely understand that WKWebView doesn't support cookies very well, so this needs重点回归测试；另外一点是如果 RN 和 H5 网页是通过 `postMessage` 的方式交互，相关 API 也有一些不兼容更新，这里需要重点适配一下，具体细节可以看[文档](https://github.com/react-native-community/react-native-webview/blob/master/docs/Reference.md)。

#### 2⃣️ SwipeableFlatList Removal

SwipeableFlatList is a **swipe-to-delete list component** provided by React Native in some version of 0.5X. Although it was never officially documented, many people in the community were already using it. Possibly because they weren't satisfied with the component's implementation, the official team removed this component in 0.60. To prevent project errors, we might need to extract the SwipeableFlatList related source code and maintain it manually. Someone has extracted the relevant code and maintained an npm package—[react-native-swipeable-lists](https://github.com/nicastelo/react-native-swipeable-lists), which everyone can introduce as a temporary transition.

<br />

### 2.iOS

React Native 0.60 supports CocoaPods. In 2020, RN finally supports CocoaPods. In the era without CocoaPods, to use some iOS third-party libraries, we had to manually drag library files into the main project, making upgrades and maintenance very inconvenient. Because CocoaPods is the only optional package management solution in version 0.61, it's strongly recommended to upgrade directly to use it.

#### 1⃣️ Migrate to CocoaPods & Autolinking Support

Before migrating to CocoaPods, first enter the following command in the CLI to unlink Native Modules:

```bash
react-native unlink
```

After unlinking, it's time to migrate to CocoaPods. Before migration, ensure that Ruby and CocoaPods are successfully installed. The specific installation process is not the focus of this article, so I won't elaborate. Those who haven't installed them can search Google on their own.

We create a new file `Podfile` in the ios directory and enter the following code:

```ruby
platform :ios, '9.0'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target 'YourProjectName' do
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

  target 'YourProjectNameTests' do
    inherit! :search_paths
    # Pods for testing
  end

  use_native_modules!
end
```

In the code above, lines starting with `pod` import official `react-native` related code from the `node_modules` directory. The following two lines of code implement the autolink functionality:

```ruby
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target 'YourProjectName' do
  ...
  use_native_modules!
end
```

After configuring the `Podfile`, run `pod install` in the ios folder to install related dependencies.

After successful installation, a xcworkspace space will be generated. At this point, you need to exit the current xcodeproj project and open xcworkspace.

In xcworkspace, there are two top-level folders: one is your xcodeproj project, and one is the Pods folder (left image): the former contains your business code, while the latter manages installed third-party library files. At this point, you need to manually delete the `*.xcodeproj` files under `YourProject/Libraries` directory (right image red box ➊) because they already exist in the Pods folder (right image red box ➋).

![iOS directory changes](https://image-1255652541.file.myqcloud.com/uPic/iOS%E7%9B%AE%E5%BD%95%E5%8F%98%E5%8C%96.png)

#### 2⃣️ Modify Header Search Path

The previous step modified the React Native project's reference method, but there's still one problem: the addressing header file paths haven't been updated. We can observe the following two pictures:

- The original Header Search Path pointed to `$(SRCROOT)/../node_modules/*`

- After using CocoaPods, the path changed to `$(PODS_CONFIGURATION_BUILD_DIR)/*`

This change stumped me for a day, and since this change is in `project.pbxproj`, which is very difficult to read, it was ignored. Later, I discovered the problem by creating a new RN project. The solution is to delete the original Header Search Path content and manually add the new path.

![Xnip2020-08-23_14-50-59](https://image-1255652541.file.myqcloud.com/uPic/Xnip2020-08-23_14-50-59.png)

![After migration](https://image-1255652541.file.myqcloud.com/uPic/RNDemo位置.png)

After completing the above two steps, you can try to build the project. Most likely, you'll find it still won't build. Because the error causes are varied, I can't cover them all, so it's better to ask Google.

#### 3⃣️ Add Start Packager Script

Assuming you've successfully built the iOS project at this point, you'll find a problem: previously, after iOS build succeeded, it would automatically start a node server to compile javascript files. After the update, it doesn't automatically start the node server, requiring us to manually `npm run start` to start the node server, which is very inconvenient.

Where's the problem? The reason is that in the original build method, there's a Start Packager script in `React.xcodeproj` under Libraries. This script automatically starts a node server after the project builds successfully:

![Original StartPackager location](https://image-1255652541.file.myqcloud.com/uPic/原_StartPackager_位置.png)

After migrating to Pods, this script is gone, and we need to manually add it in the main project. The addition method is also very simple. I've marked it in the picture below: click the project folder, click ➕ in `TARGETS`'s `Build Phases`, then click `New Run Script Phase` to add a new script area, and then fill in the following code:

![New StartPackager](https://image-1255652541.file.myqcloud.com/uPic/新建StartPackager.png)

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

The position of this Start Packager script is also somewhat particular. It's best to place it between `Check Pods Manifest.lock` and `Compile Sources`, otherwise it will cause errors when starting the node server.

#### 4⃣️ Add LaunchScreen.storyboard

With the increase in iPhone product lines, iPhone sizes have also increased. The original method of configuring one `LaunchImage` per size is gradually becoming no longer suitable. At this point, Apple officially recommends using `LaunchScreen.storyboard` to create splash screens and requires all APPs to switch to this solution by 2021.

There are many tutorials online for specific configuration. Everyone can search and reference for configuration. I personally referred to the following tutorials:

- [How to use Launch Screen Storyboard in iOS development](https://www.jianshu.com/p/77054dccafdb)
- [Add launch screen for RN app through LaunchScreen.storyboard](https://github.com/crazycodeboy/react-native-splash-screen/blob/master/add-LaunchScreen-tutorial-for-ios.md)
- [iOS 13 using LaunchScreen.storyboard to adapt launch screens for various sizes](https://juejin.im/post/6844904040132771847)

#### 5⃣️ Modify xcodebuild script

If the project previously had automated packaging scripts configured, because this upgrade migrated to workspace, some modifications need to be made to the original packaging scripts:

```bash
xcodebuild archive -project YourProjectName.xcodeproj
```

⬇️

```bash
xcodebuild archive -workspace YourProjectName.xcworkspace
```

For xcodebuild, you can refer to these two articles:

- [Using xcodebuild commands for automated packaging](https://www.jianshu.com/p/f50053d50436)
- [Xcodebuild from beginner to expert](https://www.hualong.me/2018/03/14/Xcodebuild/)

<br />

### 3.Android

The 0.60 Android update mainly has 3 points:

- React Native project upgraded to AndroidX
- React Native third-party dependencies support autolink
- Support for Hermes, a Facebook open-source Javascript engine

Before upgrading, you need to upgrade Gradle and Groovy versions first. For specific details, refer to [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/).

#### 1⃣️ Upgrade to AndroidX

The promotion of AndroidX is mainly because Google officially got tired of the current chaotic `android.support` in Android, replacing it with a unified `androidx`. Just follow the Android official documentation for the upgrade. I mainly referred to the following documents:

- [Always hearing people talk about AndroidX, what exactly is AndroidX?](https://blog.csdn.net/sinyu890807/article/details/97142065)

- [AndroidX Overview](https://developer.android.com/jetpack/androidx?hl=zh-cn)
- [Migrate to AndroidX](https://developer.android.com/jetpack/androidx/migrate?hl=zh-cn)
- [Android AndroidX migration](https://www.jianshu.com/p/7dc111353328)

The migration work mainly involves modifying `import` paths. The workload might be large, but the psychological burden is smaller. Essentially, it's just a name change, so it's not a big problem.

#### 2⃣️ Autolinking Support

Before integrating the Autolinking feature, try running `react-native unlink` to see if it can automatically unlink. If unlinking fails, you need to manually delete the old link code and add new Autolinking code. Below I use react-native-svg as an example to explain:

1. Check `android/settings.gradle`, delete the old `include` configuration, and add the following new code:

```groovy
rootProject.name = 'YourProject'

- include ':react-native-svg'
- project(':react-native-svg').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-svg/android')

+ apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
include ':app'
```

2. Check `android/app/build.gradle`, delete the old configuration, and add a line of configuration at the end of the file:

```groovy
dependencies {
-   implementation project(':react-native-svg')
}

+ apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
```

3. Check `MainApplication.java`, delete the old reference:

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

It's worth noting that in our business, we might encapsulate some Native Modules ourselves. After the above modifications, the way to import Native Modules also needs corresponding changes. Here you can refer to the official documentation [Android Register the Module](https://reactnative.dev/docs/native-modules-android#register-the-module):

```java
+ import com.your-app-name.CustomToastPackage; // <-- Add this line with your package name.

protected List<ReactPackage> getPackages() {
  @SuppressWarnings("UnnecessaryLocalVariable")
  List<ReactPackage> packages = new PackageList(this).getPackages();
+   packages.add(new CustomToastPackage()); // <-- Add this line with your package name.
  return packages;
}
```

#### 3⃣️ Hermes Support

![Hermes logo](https://image-1255652541.file.myqcloud.com/uPic/N4e9rx.png)

[Hermes](https://hermesengine.dev/) is a Facebook open-source Javascript engine. Compared to the current JSC, it has optimizations in bundle size and startup speed. There are already many articles in the community introducing Hermes. I found a few good ones. If you're interested in Hermes, you can move on to read them.

- [Ctrip's research on RN's new generation JS engine Hermes](https://cloud.tencent.com/developer/article/1492194)
- [React Native releases new generation JS engine Hermes](https://juejin.im/post/6844903945467330567)
- [Hermes Engine exploration](https://juejin.im/post/6844903905306869767)

Hermes-related features are not the focus of this article, so I won't introduce them much more.

If Android wants to use Hermes, it must use React Native with a version number greater than 0.60.4, and some modifications need to be made to `android/app/build.gradle`:

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

The above only lists the main changes. If you don't want to use Hermes, you can make no changes at all; if you want to try it, it's best to make modifications according to the detailed changes listed in [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/), and then read React Native's official [Using Hermes](https://reactnative.dev/docs/hermes/) for configuration and debugging.

<br />

## 4. React Native 0.61 Upgrade

The most important update in React Native 0.61 is the introduction of **Fast Refresh**, which greatly improves the development experience.

The addition of **Fast Refresh** has two benefits: first, it combines **live reloading** and **hot reloading** features and enhances their functionality; second, it finally supports Hooks hot reloading. Although 0.59.10 already supported hooks, functional components at that time didn't support hot reloading, making the development experience too poor. After upgrading to React Native 0.61, it can be used.

Overall, the 0.61 update is very small, and the upgrade can be completed in one or two hours. Before upgrading, it's recommended to refer to [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5) and the blog post [Upgrade to React Native 0.61](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.61/). I will supplement areas not explained in the text.

### 1.React Native

JavaScript here mainly involves some API changes and upgrades. Just follow the error messages to make modifications. The difficulty is not high.

#### 1⃣️ React upgraded to 16.9

After React upgrades to 16.9, APIs like `componentWillMount` are deprecated and must be migrated to APIs with the `UNSAFE_` prefix, such as `UNSAFE_componentWillMount`.

These APIs in the main project are relatively easy to refactor and replace. The trouble is some third-party JS packages that haven't been maintained for a long time. At this point, you need to manually Fork a copy of the code to maintain yourself, or replace them with third-party packages with the same functionality that are currently maintained. This is technical debt that can only be overcome gradually.

#### 2⃣️ Import path changes

After the update, some methods and component import paths have changed, and we need to adapt:

1. `ErrorUtils` is bound to global by default, no need to `import ErrorUtils from ErrorUtils`

2. `RCTNetworking` import path has changed, needs to be modified to:

```javascript
const RCTNetworking = require('react-native/Libraries/Network/RCTNetworking');
```

3. `Dimensions` import method has also changed, needs to be modified:

```javascript
import Dimensions from 'Dimensions';
```

⬇️

```javascript
import { Dimensions } from 'react-native';
```

### 2.iOS

After 0.61, React Native iOS only supports linking through Cocoapods. If you've already upgraded to Cocoapods in 0.60, then this iOS upgrade will be very fast. You only need to change some library import paths in the Podfile.

Specific differences can be seen in [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5), which is very simple. After comparing and modifying, just `pod install` again.

### 3.Android

The 0.61 Android upgrade is also relatively simple. It upgraded the Gradle version and modified the Hermes import path. Just follow the Diff from [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5) to make modifications sequentially.

<br />

## 5. React Native 0.62 Upgrade

React Native 0.62 also enhances the developer experience. RN projects by default introduce **Flipper**, a mobile debugging tool made by Facebook, support **React DevTools v4**, and can choose the new **LogBox** for error prompts, which is more user-friendly than the original error prompts and easier to locate problems.

In addition to enhancing the development experience, this update also supports Dark Mode, so RN can now adapt to dark mode.

Overall, the 0.62 update is also very small, and the upgrade can be completed in one or two hours. Before upgrading, it's recommended to refer to [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) and the blog post [Upgrade to React Native 0.62](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.62/). I will supplement areas not explained in the text.

### 1.React Native

#### 1⃣️ Explicit useNativeDriver specification

When React Native previously used the `Animated` API, the default value of `useNativeDriver` was false, meaning animations were drawn on the JS thread by default. After the version upgrade, you need to explicitly specify the value of `useNativeDriver`. I think the significance of this update is that every time you use `Animated`, it forces developers to think about whether animations can run on the Native thread to optimize the animation experience.

#### 2⃣️ LogBox enabled

**LogBox** is disabled by default in 0.62 and enabled by default in version 0.63. The way to enable it in 0.62 is somewhat hacky and requires the following steps:

1. Create a `before.js` file in the project root directory, and write only one line of code:

```javascript
require('react-native').unstable_enableLogBox();
```

2. Import this file in the first line of the entry file `index.js` for all JS files:

```javascript
import './before';
```

The above two steps **must be strictly followed**, otherwise there will be red screen errors.

### 2.iOS

#### 1⃣️ CocoaPods update

Cocoapods also has some changes in this version. Aside from Flipper-related pods, the changes are very small. Just make modifications according to the Diff differences in [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2).

#### 2⃣️ Swift support

0.62 upgrade requires modifying some Swift-related configurations. The specific upgrade process can be seen in [React Native 0.62 upgrade (Xcode)](https://github.com/react-native-community/upgrade-support/issues/13)

### 3.Android

The 0.61 Android upgrade is also relatively simple. It upgraded the Gradle version. Aside from Flipper-related updates, the changes are very small. Just follow the Diff from [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) to make modifications sequentially.

### 4.Flipper

After 0.62, **Flipper** is added by default in RN projects, making it convenient to view Layout, network, and log information.

When upgrading old projects, **Flipper** is actually optional. Installation has some twists and turns. After trying it out, my experience is as follows (version 0.52.1):

- Combines React Native's `console.log` information and Native log information in one application, making it convenient to view
- Can view Native Layout layout and has built-in `React DevTools v4`. Comparing the two makes it convenient to view layouts
- Network can conveniently view network information, which has always been a pain point in RN debugging
- Can quickly take screenshots and screen recordings, helping to communicate with UED
- Supports custom plugins

The above are all advantages, but there are quite a few disadvantages. Let me talk about the shortcomings I felt:

- Network doesn't support UTF-8 very well. **Flipper** doesn't handle encoding well, causing Chinese characters to display as garbled text. I've already raised [issues](https://github.com/facebook/flipper/issues/1466) with the official team, but they haven't responded
- Network image parsing also has problems, being parsed as garbled text
- Log module data are all strings. Even if you log an object, it only displays data after `JSON.stringify`

The above is my user experience. Whether to use it in projects, I think everyone should experience it for themselves.

If you want to integrate **Flipper** in your project, just follow [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) for integration. The difficulty is not very high.

<br />

## Postscript

The above is the content of the React Native version upgrade guide. This upgrade tutorial will be continuously updated. For the best experience, you can view and read the [original blog post](https://supercodepower.com/docs/react-native-upgrade/index).

If you find this article useful, please remember to **like it** 🌟. Thank you, it really means a lot to me!

<br />

More excellent article recommendations:

- [React Native Performance Optimization Guide](https://juejin.im/post/5e1676e16fb9a04847095b12) analyzes 6 points of RN performance optimization from the rendering layer perspective and explains the implementation principle of FlatList with illustrations
- An article introducing [5 most confusing concepts in webpack](https://juejin.im/post/5cede821f265da1bbd4b5630) with nearly 800 likes on Juejin, explaining **concepts that look similar but have different meanings** in Webpack
- A detailed article explaining [what webpack dll is](https://juejin.im/post/5d8aac8fe51d4578477a6699) with 2 best practices to **escape tedious dll configuration**

<br />

<br />

<br />

<br />

:::note A little tail
Welcome to follow our official account: **卤代烃实验室**: Focusing on frontend technology, hybrid development, and computer graphics, only writing in-depth technical articles
:::