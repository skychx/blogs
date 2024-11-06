---
slug: react-native-tweet
title: 🤯 没 2 年 React Native 开发经验，你都遇不到这些坑
authors: skychx

description: 没 2 年 React Native 开发经验，你都遇不到这些坑
draft: false
tags: [react native, 跨端开发]
---

React Native 开发时，如果只是写些简单的页面，基本上按着[官方文档 reactnative.dev](https://reactnative.dev/)就能写出来，但是 React Native 的 API 有几百个，没有一定的开发踩坑经验，面对一些新的需求时确实会抓不到重点。

本文总结了我个人开发 React Native 中遇到的问题和一些冷门的 API，如果有有缘人看到这篇文章并解决了实际问题，那就最好不过了。


{/* comments */}

<br />

## 一、内置组件

本节内容主要是是对官网 [React Native Core Components](https://reactnative.dev/docs/components-and-apis) 内容的补充，主要是说一些让人开发体验不爽的地方，帮助后来人避坑。



### 1.View

`View` 组件作为最基础的组件，撑起了 RN 页面的半壁江山，在使用的过程中有几个属性比较冷门但个人认为挺有用的属性。

- `hitSlop` 属性：这个属性可以扩大 View 的触控范围，在一些小按钮上用收益还是很大的
- `pointerEvents` 属性：这个属性类似 CSS 的 `pointer-events` 属性，可以控制 View 对 touch 事件的响应



### 2.Text

`Text` 组件是很常用的属性，有几个小点需要开发者注意一下：

- Android 上存在**吞字现象**，现象是部分机型上最后一个字符不显示，原因不明。目前的折衷方案是文字的最后一行多加一个空格 or 零宽字符，或者直接强制修改字体 family
- Android 有个属性叫 `includeFontPadding`，设置为 false 后可以减少文字上下的 padding（这个 padding 是为角标字符预留的，例如 H₂O、2ⁿᵈ），这样可以更好的实现上下垂直居中对齐
- 实现文字的居中对齐时，最好用一个 `View` 嵌套一个 `Text` 标签，然后给 `View` 设置一些 flex 属性控制 `Text` 居中对齐。Web 开发中经常使用 lineheight 属性实现单行文字的垂直居中对齐，这种实现方式本来就是权宜之计，在 RN 上行不太通。**最佳实践还是利用 flex 属性实现居中对齐**
- **字体的配置**相对来说比较麻烦，有个不错的教程 [Ultimate guide to use custom fonts in react native](https://mehrankhandev.medium.com/ultimate-guide-to-use-custom-fonts-in-react-native-77fcdf859cf4) 可以参考一下



### 3.TextInput

输入框组件也是很常用的属性，个人用下来有几个不爽的地方：

- iOS/Android 的**默认样式**差距比较大，不做封装的话会写非常多的平台相关代码
- `placeholder` 的文字比较长时，若出现换行现象，没有 API 去控制它的行高
- 若一个页面出现多个 `TextInput` 组件时，需要用 `ScrollView` 组件包裹，才能实现不同 `TextInput` 组件焦点切换的功能



### 4.Image

Image 组件在表现上我个人认为非常优秀了，但在一些细节上初步上手的同学可能还是不太习惯：

- 没有 CSS 那么多的滤镜属性，只支持模糊效果，不过个人基本没遇到过图像滤镜需求
- 加载网络图片时，**必须指定图片宽高**，若不设置尺寸默认为 0
- Android 上图片尺寸**非常**大时（貌似是 2048x2048？），图片会直接加载不出来，不过这种场景很少很少，基本都会瓦片图分步加载，要不然大图会引起 OOM 的
- iOS/Android 对 webp 的支持也不是开箱即用的，需要分别配置：
  - iOS 使用 `SDImageWebPCoder` 提供支持
  - Android 使用 `fresco` 提供支持
  - 具体配置方案可以参考 [react-native-webp-format](https://github.com/Aleksefo/react-native-webp-format)
- Android 不支持点九图



### 5.Modal

RN 官方之前提供的 Modal 组件有个很明显的问题，**Modal 无法覆盖到状态栏**。比如说我们做了一个弹窗，背景是黑色半透明的，但状态栏是白色的，这样在感官上就非常的割裂。

所幸 0.62 版本上了一个 `statusBarTranslucent` 属性，设为 true 就可以覆盖到状态栏之上。如果是 0.62 以下的版本，就需要改一些配置了，可以参考 stackoverflow 的这个回答：[How to hide the statusBar when react-native modal shown?](https://stackoverflow.com/questions/45369688/how-to-hide-the-statusbar-when-react-native-modal-shown)



### 6.ScrollView

ScrollView 组件是 RN 提供的滑动容器组件，有几个比较冷门但是很好用的 API 我这里说明一下。

第一个是**吸顶功能**，涉及到 `StickyHeaderComponent` 和 `stickyHeaderIndices` 这两个 API，可以实现滚动吸顶的效果，非常的好用。

第二个是 `automaticallyAdjustContentInsets` 属性，有时候 **iOS 滚动列表上会出现莫名其妙的空白区域**，这个是 iOS Native 层实现的，RN 具体的触发时机我没有做详细的测试，但基本上把这个属性关掉就可以规避了。



### 7.FlatList

FlatList 主要是注意 3 个点：

- FlatList 提供自定义的头部/底部/空白/分割线组件，比一般的 Web 组件封装更彻底一些
- React 渲染列表的时候会要求加 `key` 以提高 diff 性能，但是 FlatList 封装的比较多，需要用 [`keyExtractor`](https://reactnative.dev/docs/flatlist#keyextractor) 这个 API 来指定列表 Cell 的 `key`
- FlatList 性能优化的内容官网写的不是很好，我之前写了个[更易懂的](https://supercodepower.com/react_native_performance_optimization_guides#%E5%85%AD%E3%80%81%E9%95%BF%E5%88%97%E8%A1%A8%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96)，有需求的同学可以了解一下


<br />


## 二、内置 API

本节内容主要是是对官网 [React Native API](https://reactnative.dev/docs/accessibilityinfo) 内容的补充，主要是说一些让人开发体验不爽的地方，帮助后来人避坑。



### 1.AppState

AppState 这个 API 在实际开发中主要是**监听 APP 前后台切换**的，这个 API 在 iOS 上表现符合语义，但是 Android 上就有问题了，因为 AppState 在 Android 端的实现其实是基于 [Activity 的生命周期](https://developer.android.com/guide/components/activities/activity-lifecycle#lc) 的。

就比如说 AppState 提供的 `background` 这个状态，其实是基于 Activity 的 [onPause()](https://developer.android.com/guide/components/activities/activity-lifecycle#onpause) 的，但是根据 Android 的文档，`onPause()` 执行时有这么几种场景：

- APP 切换到系统后台（符合预期）
- 当前 RN 容器 Activity 上层覆盖了新的 Activity（不符合预期）
- 当前 RN 容器 Activity 上层覆盖了 Dialog，例如权限申请弹窗（Dialog 本质上就是个半透明 Dialog）（不符合预期）

综上所述，使用 AppState 监听 APP 状态时要充分考虑 Android 的这些“异常”表现是否会引起程序 BUG。



### 2.Permissions

APP 平台的权限管理是一件很繁琐的事情，RN 官方只提供了 `PermissionsAndroid`，没有提供跨平台的权限管理 API，使用时很不方便。这里我建议使用 [react-native-permissions](https://github.com/zoontek/react-native-permissions) 这个库，管理权限更便捷。



### 3.Event

RN 官网上没有暴露 Event 相关的 API，但是 RN 已经[对外导出](https://github.com/facebook/react-native/blob/8d0a2e79212b77cafcc9af73e92c0f2b23f782e8/index.js#L416)了 `DeviceEventEmitter`  这个「发布-订阅」事件管理 API，使用也很简单，如下案例使用即可。

```javascript
import { DeviceEventEmitter } from 'react-native';

// 触发
DeviceEventEmitter.emit('EVENT');
// 监听
const listener = DeviceEventEmitter.addListener( 'EVENT', () => {});
// 移除
listener.remove()
```



### 4.Animated

RN 的动画 API，说实话掌握成本比较高，单官方 API 就涉及到 `Animated`、`LayoutAnimation`、`Easing`、`useNativeDriver` 等概念，而且文档分布比较分散，初学者很难在脑海里构建一个完整的脑图。

如果你想构建性能更高的动画，还得学习 [react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler#readme)、[react-native-reanimated](https://github.com/software-mansion/react-native-reanimated#readme) 等第三方库的 API，学习成本直线飙升。

这里我推荐 [React Native Animation Book](https://animationbook.codedaily.io/introduction) 这本在线书籍，基本上算是手把手教学，看完之后就对 RN 的动画 API 有个整体的认识了。

<br />

## 三、第三方 Library

React Native 陆陆续续把一些非核心的组件交给社区维护，例如 `webview`、`async-storage` 等。还有一些非官方但很好用的组件，例如 `react-native-svg`、`react-native-camera` 等等。

除了这些和 Native 相关的第三方库，JS 社区里**宿主无关的 JS 库**也是可以使用的，例如 `lodash`、`redux` 等纯逻辑库。

由于第三方库太多了，所以我这里就不一一列举了。


<br />


## 四、特效篇

React Native 的 style 样式属性**只**提供了基础的布局属性，例如 flexbox layout、fontSize 等等。但是很多 CSS3 的特效属性，React Native 基本上都得引入第三方库。我梳理了一下常用的几个 UI 特效要用到的属性和插件，方便开发者使用。



### 1.圆角效果

这个直接使用 View styles 属性的 [`borderRadius`](https://reactnative.dev/docs/view-style-props#borderradius) 即可，RN 同时也支持设置 View 四个角的单独弧度。



### 2.模糊效果

blur 效果要用到 [@react-native-community/blur](https://github.com/Kureev/react-native-blur) 这个 RN 官方社区库。这个 RN 模糊库比 CSS 的 `blur()` 属性更强大一些，CSS 只支持高斯模糊，这个库支持起码三种模糊效果，不过具体效果还是要和 UED 商议。



### 3.阴影效果

阴影可以用 RN 提供的 [`Shadow Props`](https://reactnative.dev/docs/shadow-props)，但是它是分平台的：

- iOS 提供了 `shadowColor`、`shadowOffset`、`shadowOpacity` 和 `shadowRadius` 四个属性，和 CSS 的 box-shadow 属性完全对标，可以满足绝大多数的场景
- Android 只提供了 `shadowColor` 和 [`elevation`](https://reactnative.dev/docs/view-style-props#elevation-android) 两个属性，而且从严格意义上来说，`elevation` 其实是「仰角」的意思，是 Android 官方提供的属性，模拟现实中的从上向下的光照引起的阴影变化。虽然理论一套一套的，但是在现实开发中就会发现，`elevation` 搞出来的阴影非常丑，和 iOS 比起来完全是天壤之别。社区上比较好的替代方案是 [react-native-drop-shadow](https://github.com/hoanglam10499/react-native-drop-shadow)，本质是利用位图模拟阴影



### 4.渐变效果

渐变要使用一个第三方库：[react-native-linear-gradient](https://github.com/react-native-linear-gradient/react-native-linear-gradient)，正如库名，这个仓库只提供「线性渐变」的解决方案，以个人经验，线性渐变在绝大部分情况下都足够了。如果要使用「径向渐变」，可以使用 [react-native-svg](https://github.com/react-native-svg/react-native-svg) 的 `RadialGradient`  组件。


<br />


## 五、可视化篇

Web 平台除了最基础的 `<p/>` `<img/>` 标签，还支持 SVG、canvas 这些自由度较高的绘制 API。它们支持最多的就是可视化场景，例如各种自定义图像和图表。下面就简单介绍一下 RN 中对标 Web 的的一些第三方库。



### 1.SVG

RN 的 SVG 支持是基于 [react-native-svg](https://github.com/react-native-svg/react-native-svg) 这个仓库，就个人的使用体验来说，基本和 Web 的 SVG 功能没啥两样。除了自绘一些自定义 SVG，它更多的功能是作为底层库支持上层图表的使用。



### 2.类 canvas

RN 中是没有 canvas 这个概念的，市面上也没有很好用的 canvas 替代品。有开发者搞出了 [react-native-skia](https://github.com/react-native-skia/react-native-skia)，也有一些 [demo 展示](https://twitter.com/chrfalch/status/1434880480650932232)。但它目前其实还是一个实验性项目，上生产环境风险还是太大了。不过就我个人经验来说，很多绘制功能都能基于 SVG 实现，必须用 canvas 的情况应该并不多见。

> 基于 skia 你再把 flutter 集成进去，可以玩套娃游戏了 :)



### 3.OpenGL 支持

在移动端平台上，WebGL 就是浏览器平台对 OpenGL ES 的封装，RN 本身已经很贴近 Native 平台了，就没必要舍近求远支持 WebGL 了，直接支持 OpenGL ES 就好。

目前 RN 对 OpenGL 的支持是基于 [gl-react](https://github.com/gre/gl-react) 的，底层的适配层是基于 [expo-gl](https://docs.expo.dev/versions/latest/sdk/gl-view/)。网上有个 gl-react 的 [demo 教程](https://www.youtube.com/watch?v=rMdLNvVOUEI)，有需要的读者可以学习一下。

> 因为个人没做过 RN 3D 相关的需求，所以也无法对该库得出一个准确的评价，需要读者自行判断



### 4.图表功能

图表是个很现实的需求，在一些 B 端场景上经常会有报表需求。因为 RN 只有 SVG 支持比较完善，所以 RN 的图表基本都是基于 SVG 绘制的。

Web 上基于 SVG 的图表库有很多，但是 RN 能用到的可能没有几个。**主要原因是 RN 和 Web 的宿主环境不一样**，一些图表库可能会用到 Web 特供 API（例如 `getElmentById`），像 [ECharts](https://github.com/apache/echarts) 这样的库 RN 肯定是用不了的。

可迁移使用的库一般要满足两个条件：

- **纯逻辑**：`D3.js` 一些纯逻辑的库，只用到 JS 的语言能力，例如 [d3-scale](https://github.com/d3/d3-scale)
- **平台无关**：直接基于 React 构建，没有用到平台特有 API，例如 [victory-native](https://github.com/FormidableLabs/victory-native)

这里有一个基于 D3.js 实现的股票箱型图的[视频教程](https://www.youtube.com/watch?v=gLsi1IO4BpA)，感兴趣的读者可以了解一下。



### 5.海报功能

海报分享是现如今非常常见的一个前端功能，网页基本是基于 canvas 生成分享海报的，RN 虽没有较好的 canvas API，但是有个不错的库——[react-native-view-shot](https://github.com/gre/react-native-view-shot)，可以把 RN 写的 View 生成一张图片。借用这个库就能在 APP 本地生成图片，转而实现海报功能。

<br />

## 推荐阅读

### RN 性能优化系列目录：

- [🎨 React Native 性能优化——Render 篇](https://supercodepower.com/react_native_performance_optimization_guides)
- [⚡️ React Native 启动速度优化——Native 篇](https://supercodepower.com/react-native-performance-native)
- [⚡️ React Native 启动速度优化——JS 篇](https://supercodepower.com/react-native-performance-js)



----

个人微信：**egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
