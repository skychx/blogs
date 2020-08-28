---
id: to-062
title: 0.62 升级
sidebar_label: 0.62 升级
description: React Native 升级、React Native 0.60 升级、React Native 0.61 升级、React Native 0.62 升级
keywords:
  - React Native 升级
  - React Native 0.60 升级
  - React Native 0.61 升级
  - React Native 0.62 升级
---

React Native 0.62 也是加强了开发者体验，RN 项目默认引入了 **Flipper** 这个 Facebook 制作的移动端调试工具，支持了 **React DevTools v4**，错误提示可以选择新的 **LogBox**，比原来的错误提示更加友好从而更容易定位问题。

除了开发体验的加强，这次更新还支持了 Dark Mode 模式，RN 之后就可以做暗黑模式的适配了。

整体来说 0.62 的更新也很小，一两个小时就可以完成升级。升级前建议参考  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2)  和 [Upgrade to React Native 0.62](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.62/) 这篇博文，我会对文中没有说明的地方进行补充。

<br />

## 1.React Native

### 1⃣️ useNativeDriver 显式指定

React Native 之前使用 `Animated` API 时，`useNativeDriver` 默认值为 false，也就是说默认都是  JS 线程绘制动画。版本升级后需要显式指定 `useNativeDriver` 的值。我认为这个更新的意义在于每次使用 `Animated` 时，强迫开发者思考能不能让动画在 Native 线程运行，优化动画体验。



### 2⃣️ LogBox 开启

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



### 3️⃣ iOS TextInput 输入汉字时文字抖动

React Native 版本更新的时候，**解决一部分 BUG 的同时一定会引入一些新的 BUG**。

0.62 版本就引入了一个新 BUG：iOS TextInput 输入汉字时文字抖动，具体表现可以看这个 [issues](https://github.com/facebook/react-native/issues/28488)。

这个 BUG 在 0.63 已经得到解决了，相关的 commit 是这个：[Fixes TextInput shaking when typing Chinese](https://github.com/facebook/react-native/commit/9cdc19a93669b37c0518bd32263e156ffc9193c7)，大家可以手动添加一下这个修复，或者直接升级到 0.63，都可以解决问题。


<br />


## 2.iOS

### 1⃣️ CocoaPods 更新

Cocoapods 在这个版本里也有些改动，除去 Flipper 相关的 pod，改动非常小，根据 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) 中的 Diff 差异修改就好。



### 2⃣️ Swift 支持

0.62 升级需要修改一些 Swift 相关的配置，具体升级流程可见 [React Native 0.62 upgrade (Xcode)](https://github.com/react-native-community/upgrade-support/issues/13)

<br />

## 3.Android

0.61 的 Android 升级也比较简单，升级了 Gradle 版本，除去 Flipper 相关的更新，改动非常小，跟着 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) 的 Diff 依次修改就可。

<br />

## 4.Flipper

![Flipper](https://github.com/facebook/flipper/raw/master/website/static/img/layout.png)

0.62 之后，**Flipper** 在 RN 的项目里是默认添加的，可以方便的查看 Layout、network 和 log 等信息。

旧项目升级时，**Flipper** 其实是可选的，安装有些波折，上手体验了一下感觉如下（版本为 0.52.1）：

- 把 React Native 的 `console.log` 信息和 Native 的 log 信息和在一个应用里，比较方便查看
- 可以查看 Native Layout 布局，并且内置了 `React DevTools v4`，两者比对可以方便查看布局
- Network 可以方便查看网络信息，这个一直是 RN 调试的一个痛点
- 可以快速的截屏录屏，有助于和 UED 沟通
- 支持自定义插件

<br />

上面都是优点，缺点还是有不少的，下面我说说我用下来感觉到的不足：

- network 对 UTF-8 支持不太好。**Flipper** 对编码没有处理好，导致中文显示乱码，我已经给官方提了 [issues](https://github.com/facebook/flipper/issues/1466)，但是一直没有理我
- network 图片解析也有问题，被解析为乱码的文本
- log 模块的数据都是字符串，即使你 log 的是 object，它也只是展示 `JSON.stringify` 后的数据

<br />

以上就是我的使用体验，要不要在项目中使用，我觉得大家还是亲自体验一下比较好。

如果要在项目中集成 **Flipper**，根据  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.61.5&to=0.62.2) 进行集成就好，难度不是很大。


<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::