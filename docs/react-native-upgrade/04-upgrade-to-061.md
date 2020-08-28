---
id: to-061
title: 0.61 升级
sidebar_label: 0.61 升级
description: React Native 升级、React Native 0.60 升级、React Native 0.61 升级、React Native 0.62 升级
keywords:
  - React Native 升级
  - React Native 0.60 升级
  - React Native 0.61 升级
  - React Native 0.62 升级
---

React Native 0.61 最主要的更新就是 **Fast Refresh** 的引入了，这个功能大大提升了开发体验。

**Fast Refresh** 的加入有两个好处，第一个是把 **live reloading** 和 **hot reloading** 两个功能合二为一并做了功能加强；第二个终于支持 Hooks 热更新了。虽然 0.59.10 已经支持 hooks，但是当时的函数式组件不支持热更新，开发体验过于差劲。升级到 React Native 0.61 后就可以使用了。

整体来说 0.61 的更新很小，一两个小时就可以完成升级。升级前建议参考  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5)  和 [Upgrade to React Native 0.61](https://reactnative.thenativebits.com/courses/upgrading-react-native/upgrade-to-react-native-0.61/) 这篇博文，我会对文中没有说明的地方进行补充。

<br />

## 1.React Native

JavaScript 这里主要是一些 API 的变动和升级，跟着报错信息修改就好，难度并不大。

### 1⃣️ React 升级到 16.9

React 升级到 16.9 后，`componentWillMount` 等 API 废弃，必须迁移到 `UNSAFE_componentWillMount` 等带有 `UNSAFE_` 前缀的 API。

主工程里这些 API 比较容易重构和替换，麻烦的是一些很久没有维护的第三方 JS 包，这时候需要自己手动 Fork 一份代码维护，或者替换同功能的正在维护的第三方包，这个属于技术债，只能一点一点克服。



### 2⃣️ 引用路径改动

更新后有些方法和组件的引用路径发生了变更，需要我们适配一下：

1.`ErrorUtils` 默认绑定到 global 上，不需要 `import ErrorUtils from ErrorUtils` 导入了

2.`RCTNetworking` 引用路径发生改变，需要修改为：

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

### 3️⃣ Android 真机 debug 环境下 onPress 事件不能响应

React Native 版本更新的时候，**解决一部分 BUG 的同时一定会引入一些新的 BUG**。

0.61 版本就引入了一个新 BUG：Android 真机用 chrome 浏览器 debug 时，`Touchable*` 系列组件的 `onPress` 事件无发响应。

这个问题 GitHub 上已经有人反馈过了（[issues 27008](https://github.com/facebook/react-native/issues/27008)），有人认为是电脑环境和 Android 手机环境的时间不一致导致，两者的时间差导致点击事件中断。

[解决办法](https://github.com/facebook/react-native/issues/27008#issuecomment-592048282)比较 Hack，方法是关闭 Android 手机的时间自动同步功能，然后重启手机并重新安装应用。测试下来此方法的确可行，在此记录一下助有缘人避坑。

<br />

## 2.iOS

0.61 之后，React Native iOS 端只支持通过 Cocoapods Link 了，如果 0.60 已经升级到 Cocoapods 了，那么这次的 iOS 升级将会非常快，只需要改动 Podfile 中一些库的导入路径就可以了。

具体的差异可见 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5)，非常简单，比对修改后重新 `pod install` 就可以了。

<br />

## 3.Android

0.61 的 Android 升级也比较简单，升级了 Gradle 版本，修改了 Hermes 的引用路径，跟着  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.60.6&to=0.61.5) 的 Diff 依次修改就可。

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::