---
slug: react-native-tweet
title: 🤯 These React Native Pitfalls Only Come with 2+ Years of Development Experience
authors: skychx

description: These React Native pitfalls only come with 2+ years of development experience
draft: false
tags: [react native, cross-platform development]
---

When developing with React Native, if you're just writing some simple pages, you can basically write them following the [official documentation reactnative.dev](https://reactnative.dev/). However, React Native has hundreds of APIs. Without certain development experience and pitfall-hitting experience, you really can't grasp the key points when facing new requirements.

This article summarizes the problems I encountered in personal React Native development and some less common APIs. If someone happens to see this article and solves actual problems with it, that would be great.

{/* truncate */}

<br />

## 1. Built-in Components

This section mainly supplements the official website's [React Native Core Components](https://reactnative.dev/docs/components-and-apis) content, mainly talking about some places that make development experience unpleasant, helping newcomers avoid pitfalls.

### 1.View

The `View` component, as the most basic component, supports half of the RN page. During use, there are several attributes that are relatively uncommon but I personally find quite useful.

- `hitSlop` attribute: This attribute can expand the touchable range of View, which is very beneficial when used on small buttons
- `pointerEvents` attribute: This attribute is similar to CSS's `pointer-events` attribute and can control View's response to touch events

### 2.Text

The `Text` component is a commonly used component, and there are a few points developers need to pay attention to:

- There is a **character swallowing phenomenon** on Android, where the last character doesn't display on some devices. The cause is unknown. The current compromise is to add an extra space or zero-width character to the last line of text, or directly force modify the font family
- Android has an attribute called `includeFontPadding`. When set to false, it can reduce the padding above and below text (this padding is reserved for superscript/subscript characters, like H₂O, 2ⁿᵈ), which can better achieve vertical center alignment
- When implementing text center alignment, it's best to nest a `Text` tag inside a `View`, then set some flex properties on the `View` to control `Text` center alignment. Web development often uses the lineheight property to achieve single-line text vertical center alignment. This implementation is actually a temporary measure and doesn't work well in RN. **Best practice is still to use flex properties to achieve center alignment**
- **Font configuration** is relatively troublesome. There's a good tutorial [Ultimate guide to use custom fonts in react native](https://mehrankhandev.medium.com/ultimate-guide-to-use-custom-fonts-in-react-native-77fcdf859cf4) that you can refer to

### 3.TextInput

The input component is also commonly used. Personally, I find several things unsatisfactory:

- The **default styles** on iOS/Android differ significantly. Without encapsulation, you would need to write a lot of platform-specific code
- When `placeholder` text is relatively long and line wrapping occurs, there's no API to control its line height
- When multiple `TextInput` components appear on a page, you need to wrap them with a `ScrollView` component to implement focus switching between different `TextInput` components

### 4.Image

I personally think the Image component performs very well in terms of presentation, but beginners might not be used to some details:

- It doesn't have as many filter properties as CSS, only supporting blur effects. However, I've basically never encountered image filter needs
- When loading network images, **you must specify image width and height**. If dimensions aren't set, they default to 0
- When images are **very** large on Android (seems to be 2048x2048?), images won't load directly. However, this scenario is very rare. Basically, you'll use tiled images for step-by-step loading, otherwise large images would cause OOM
- iOS/Android support for webp is not out-of-the-box and needs separate configuration:
  - iOS uses `SDImageWebPCoder` to provide support
  - Android uses `fresco` to provide support
  - Specific configuration can reference [react-native-webp-format](https://github.com/Aleksefo/react-native-webp-format)
- Android doesn't support nine-patch images

### 5.Modal

The Modal component previously provided by RN had an obvious problem: **Modal couldn't cover the status bar**. For example, if we made a popup with a semi-transparent black background, but the status bar is white, this feels very disconnected visually.

Fortunately, version 0.62 added a `statusBarTranslucent` attribute. Setting it to true can make it cover the status bar. For versions below 0.62, you need to change some configurations. You can reference this stackoverflow answer: [How to hide the statusBar when react-native modal shown?](https://stackoverflow.com/questions/45369688/how-to-hide-the-statusbar-when-react-native-modal-shown)

### 6.ScrollView

The ScrollView component is a scrolling container component provided by RN. I'll explain a few relatively uncommon but very useful APIs here.

The first is the **sticky header feature**, involving the `StickyHeaderComponent` and `stickyHeaderIndices` APIs, which can achieve sticky header effects when scrolling - very useful.

The second is the `automaticallyAdjustContentInsets` attribute. Sometimes **mysterious blank areas appear on iOS scrolling lists**. This is implemented in the iOS Native layer. I haven't done detailed testing of the specific trigger timing in RN, but basically turning off this attribute can avoid it.

### 7.FlatList

FlatList mainly需要注意 3 个点：

- FlatList provides custom header/footer/empty/separator components, which are more thoroughly encapsulated than general Web components
- React requires adding `key` when rendering lists to improve diff performance, but FlatList is more encapsulated and needs to use the [`keyExtractor`](https://reactnative.dev/docs/flatlist#keyextractor) API to specify the `key` for list cells
- The official website's content on FlatList performance optimization isn't written very well. I previously wrote a [more understandable version](https://supercodepower.com/react_native_performance_optimization_guides#%E5%85%AD%E3%80%81%E9%95%BF%E5%88%97%E8%A1%A8%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96). Students with needs can learn about it

<br />

## 2. Built-in APIs

This section mainly supplements the official website's [React Native API](https://reactnative.dev/docs/accessibilityinfo) content, mainly talking about some places that make development experience unpleasant, helping newcomers avoid pitfalls.

### 1.AppState

The AppState API is mainly used for **monitoring APP foreground/background switching** in actual development. This API performs semantically correctly on iOS, but has problems on Android because AppState implementation on Android is actually based on [Activity lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle#lc).

For example, the `background` state provided by AppState is actually based on Activity's [onPause()](https://developer.android.com/guide/components/activities/activity-lifecycle#onpause), but according to Android documentation, `onPause()` execution has several scenarios:

- APP switches to system background (expected)
- Current RN container Activity is covered by a new Activity (unexpected)
- Current RN container Activity is covered by a Dialog, such as a permission request popup (Dialog is essentially a semi-transparent Dialog) (unexpected)

In summary, when using AppState to monitor APP status, you must fully consider whether these "abnormal" Android behaviors will cause program bugs.

### 2.Permissions

APP platform permission management is a very tedious matter. RN officials only provide `PermissionsAndroid`, without cross-platform permission management API, which is inconvenient to use. Here I recommend using the [react-native-permissions](https://github.com/zoontek/react-native-permissions) library, which makes managing permissions more convenient.

### 3.Event

The RN official website doesn't expose Event-related APIs, but RN has already [exported](https://github.com/facebook/react-native/blob/8d0a2e79212b77cafcc9af73e92c0f2b23f782e8/index.js#L416) the `DeviceEventEmitter` "publish-subscribe" event management API. Usage is very simple, as shown in the following case.

```javascript
import { DeviceEventEmitter } from 'react-native';

// Trigger
DeviceEventEmitter.emit('EVENT');
// Listen
const listener = DeviceEventEmitter.addListener( 'EVENT', () => {});
// Remove
listener.remove()
```

### 4.Animated

RN's animation API, honestly, has a high learning curve. The official API alone involves concepts like `Animated`, `LayoutAnimation`, `Easing`, `useNativeDriver`, etc., and the documentation is quite scattered. It's difficult for beginners to build a complete mental map.

If you want to build higher-performance animations, you also need to learn APIs from third-party libraries like [react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler#readme), [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated#readme), making the learning cost skyrocket.

Here I recommend the online book [React Native Animation Book](https://animationbook.codedaily.io/introduction), which basically provides step-by-step teaching. After reading it, you'll have an overall understanding of RN's animation APIs.

<br />

## 3. Third-party Libraries

React Native has gradually handed over some non-core components to community maintenance, such as `webview`, `async-storage`, etc. There are also some unofficial but very useful components, such as `react-native-svg`, `react-native-camera`, etc.

Besides these Native-related third-party libraries, **host-independent JS libraries** from the JS community can also be used, such as pure logic libraries like `lodash`, `redux`, etc.

Since there are too many third-party libraries, I won't list them all here.

<br />

## 4. Effects Section

React Native's style properties **only** provide basic layout attributes, such as flexbox layout, fontSize, etc. However, many CSS3 effect properties basically require introducing third-party libraries in React Native. I've sorted out common UI effects' required properties and plugins to facilitate developer use.

### 1. Rounded Corners

You can directly use the View styles property [`borderRadius`](https://reactnative.dev/docs/view-style-props#borderradius) for this. RN also supports setting individual arc radii for all four corners of View.

### 2. Blur Effect

For blur effects, you need to use the [@react-native-community/blur](https://github.com/Kureev/react-native-blur) RN official community library. This RN blur library is more powerful than CSS's `blur()` property. CSS only supports Gaussian blur, while this library supports at least three types of blur effects, though specific effects need to be discussed with UED.

### 3. Shadow Effect

Shadows can use RN's provided [`Shadow Props`](https://reactnative.dev/docs/shadow-props), but they are platform-specific:

- iOS provides four attributes: `shadowColor`, `shadowOffset`, `shadowOpacity`, and `shadowRadius`, which completely correspond to CSS's box-shadow property and can satisfy most scenarios
- Android only provides `shadowColor` and [`elevation`](https://reactnative.dev/docs/view-style-props#elevation-android) attributes. Strictly speaking, `elevation` actually means "elevation angle" - an official Android attribute that simulates shadow changes caused by top-down lighting in reality. Although there's a complete theory behind it, in actual development, you'll find that shadows created by `elevation` are very ugly, completely different from iOS. A better community alternative is [react-native-drop-shadow](https://github.com/hoanglam10499/react-native-drop-shadow), which essentially uses bitmaps to simulate shadows

### 4. Gradient Effect

For gradients, you need to use a third-party library: [react-native-linear-gradient](https://github.com/react-native-linear-gradient/react-native-linear-gradient). As the name suggests, this repository only provides "linear gradient" solutions. From my experience, linear gradients are sufficient in most cases. If you need "radial gradients", you can use the `RadialGradient` component from [react-native-svg](https://github.com/react-native-svg/react-native-svg).

<br />

## 5. Visualization Section

Besides the most basic `<p/>` `<img/>` tags, the Web platform also supports high-freedom drawing APIs like SVG and canvas. They support visualization scenarios most, such as various custom graphics and charts. Below, I'll briefly introduce some third-party libraries in RN that correspond to Web platforms.

### 1.SVG

RN's SVG support is based on the [react-native-svg](https://github.com/react-native-svg/react-native-svg) repository. From my personal usage experience, it's basically no different from Web's SVG functionality. Besides drawing custom SVG, it's more often used as an underlying library to support upper-level chart usage.

### 2.Canvas-like

RN doesn't have the concept of canvas, and there aren't many good canvas alternatives on the market. Some developers have created [react-native-skia](https://github.com/react-native-skia/react-native-skia), and there are some [demo showcases](https://twitter.com/chrfalch/status/1434880480650932232). But it's currently an experimental project, and the risk of using it in production is still too high. However, from my personal experience, many drawing functions can be implemented based on SVG. Cases that must use canvas should be quite rare.

> Based on skia, if you integrate flutter into it, you can play matryoshka games :)

### 3.OpenGL Support

On mobile platforms, WebGL is the browser platform's encapsulation of OpenGL ES. RN is already very close to the Native platform, so there's no need to go the long way around to support WebGL. Direct OpenGL ES support would be fine.

Currently, RN's OpenGL support is based on [gl-react](https://github.com/gre/gl-react), with the underlying adaptation layer based on [expo-gl](https://docs.expo.dev/versions/latest/sdk/gl-view/). There's a gl-react [demo tutorial](https://www.youtube.com/watch?v=rMdLNvVOUEI) online that interested readers can study.

> Because I haven't done RN 3D-related requirements, I can't give an accurate evaluation of this library. Readers need to judge for themselves.

### 4.Chart Functionality

Charts are a very practical need, often appearing in B-side scenarios with reporting requirements. Because RN only has relatively complete SVG support, RN charts are basically drawn based on SVG.

There are many SVG-based chart libraries on the Web, but probably only a few can be used in RN. **The main reason is that RN and Web host environments are different**. Some chart libraries might use Web-exclusive APIs (like `getElmentById`), making libraries like [ECharts](https://github.com/apache/echarts) unusable in RN.

Migratable libraries generally need to meet two conditions:

- **Pure logic**: Pure logic libraries like some `D3.js` that only use JS's language capabilities, such as [d3-scale](https://github.com/d3/d3-scale)
- **Platform-independent**: Directly built based on React without using platform-specific APIs, such as [victory-native](https://github.com/FormidableLabs/victory-native)

Here's a [video tutorial](https://www.youtube.com/watch?v=gLsi1IO4BpA) implementing a stock box plot based on D3.js that interested readers can check out.

### 5.Poster Functionality

Poster sharing is a very common front-end feature nowadays. Web pages basically generate sharing posters based on canvas. Although RN doesn't have good canvas APIs, there's a good library—[react-native-view-shot](https://github.com/gre/react-native-view-shot)—that can generate images from Views written in RN. Using this library, you can generate images locally in the APP and thus implement poster functionality.

<br />

## Recommended Reading

### RN Performance Optimization Series Table of Contents:

- [🎨 React Native Performance Optimization—Render Part](https://supercodepower.com/react_native_performance_optimization_guides)
- [⚡️ React Native Startup Speed Optimization—Native Part](https://supercodepower.com/react-native-performance-native)
- [⚡️ React Native Startup Speed Optimization—JS Part](https://supercodepower.com/react-native-performance-js)

----

Personal WeChat: **egg_labs**

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

<br />

<br />

<br />

<br />

:::note A little tail
Welcome to follow our official account: **卤代烃实验室**: Focusing on frontend technology, hybrid development, and computer graphics, only writing in-depth technical articles
:::