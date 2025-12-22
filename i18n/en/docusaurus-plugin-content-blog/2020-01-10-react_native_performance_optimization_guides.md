---
slug: react_native_performance_optimization_guides
title: 🎨 React Native Performance Optimization Guide - Rendering Chapter
authors: skychx

description: The React Native performance optimizations discussed in this article haven't reached the level of modifying React Native source code, so they are highly universal and useful for most RN developers. 1. Reduce re-render 2. Reduce rendering pressure 3. Image optimization tips 4. Object creation and call separation 5. Animation performance optimization 6. Long list performance optimization 7. Tools for React Native performance optimization 8. Recommended reading
draft: false
tags: [react native, 'performance optimization', cross-platform development]
---



![](https://image-1255652541.file.myqcloud.com/images/20200109010149.png)

:::info Update Notice
Article updated on 2022-08-29 with "Image" optimization content

Article updated on 2022-01-22 with "Fabric" architecture chapter

Article updated on 2021-07-01 with Redux optimization content
:::



Talking about React Native in 2020, in the ever-changing frontend circle, might be considered quite alternative. Before writing this article, I hesitated, but then I thought that writing technical articles isn't about following trends - writing about whatever is trendy. So I decided to write this React Native performance optimization article.

The React Native performance optimizations discussed in this article haven't reached the level of modifying React Native source code, so they are **highly universal** and useful for most RN developers.

{/* truncate */}

The content of this article is partly React/RN/Android/iOS official recommended optimization suggestions, partly optimization points discovered from reading source code, and partly excellent open-source frameworks that can solve some performance bottlenecks. **The content summarized in this article is rarely seen on the internet, so you will definitely gain something after reading it.** If you think it's well-written, please don't be stingy with your likes, and share this 10,000+ word article to let more people see it.

:::tip Reading Reminder
Before reading this article, it's important to clarify one point: some optimization suggestions may not apply to all teams. Some teams use React Native as an enhanced web page, some teams use React Native to implement non-core functions, and some teams use React Native as their core architecture. Different positioning requires different choices. For these scenarios, I'll also mention them in the article, but specific usage still needs to be decided by developers.
:::

## Table of Contents:

- 1. Reduce re-render
- 2. Reduce rendering pressure
- 3. Image optimization tips
- 4. Object creation and call separation
- 5. Animation performance optimization
- 6. Long list performance optimization
- 7. Tools for React Native performance optimization
- 8. Recommended reading

## 1. Reduce re-render

Since React Native is also part of the React ecosystem, many React optimization techniques can be applied here. So let's start with the most familiar content.

For React, reducing re-render can be said to be the most beneficial thing.

### 1⃣️ shouldComponentUpdate

**📄 Documentation:** https://react.docschina.org/docs/optimizing-performance.html#shouldcomponentupdate-in-actionsx

**Simple Example:**

```javascript
class Button extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.color !== nextProps.color) {
      return true;
    }
    return false;
  }

  render() {
    return <button color={this.props.color} />;
  }
}
```

No matter which article discusses React performance optimization, `shouldComponentUpdate` **must** be a guest of honor.

Through this API, we can get the previous and next state/props, then manually check if the state has changed, and decide whether the component needs to re-render based on the change.

The [🔗 official documentation](https://react.docschina.org/docs/optimizing-performance.html#shouldcomponentupdate-in-action) already explains the working principle and usage scenarios of `shouldComponentUpdate` **very** clearly, so there's no need for me to copy the article here. In actual projects, Yuewen Group's [🔗 React Native application **"元气阅读"**](https://juejin.im/post/5b61479b6fb9a04f9963be77#heading-20) provides a good example, and [🔗 Twitter's performance optimization sharing](https://medium.com/@paularmstrong/twitter-lite-and-high-performance-react-progressive-web-apps-at-scale-d28a00e780a3) is also well-illustrated with graphics and has high reference value. Interested students can click to view.

What I want to remind you here is that **shouldComponentUpdate is strongly related to business logic**. If you use this API, you must consider all props and states related to this component. If there are omissions, data and view inconsistencies may occur. So be very careful when using it.

### 2⃣️ React.memo

**📄 Documentation:** https://react.docschina.org/docs/react-api.html#reactmemo

`React.memo` is a new feature introduced in React v16.6, a higher-order component specifically for React function components.

By default, it performs shallow comparison just like `PureComponent`. Since it's a higher-order component, you just need to wrap the original component:

```javascript
const MemoButton = React.memo(function Button(props) {
  return <button color={this.props.color} />;
});
```

If you want to customize the comparison process like `shouldComponentUpdate`, `React.memo` also supports passing in a custom comparison function:

```javascript
function Button(props) {
  return <button color={this.props.color} />;
}
function areEqual(prevProps, nextProps) {
  if (prevProps.color !== nextProps.color) {
      return false;
    }
  return true;
}
export default React.memo(MyComponent, areEqual);
```

**It's worth noting** that the return value of the `areEqual()` function is opposite to `shouldComponentUpdate`. If props are equal, `areEqual()` returns `true`, while `shouldComponentUpdate` returns `false`.

### 3⃣️ React.PureComponent

**📄 Documentation:** https://react.docschina.org/docs/react-api.html#reactpurecomponent

**Simple Example:**

```javascript
class PureComponentButton extends React.PureComponent {
  render() {
    return <button color={this.props.color} />;
  }
}
```

Corresponding to `shouldComponentUpdate`, React also has a similar component `React.PureComponent`, which performs a **shallow comparison** on props and state before component updates. So when dealing with data with too many nesting levels, for example, if you pass in a two-level nested Object as props, `shouldComponentUpdate` will be in a dilemma: should I update or not?

Considering the above situation, I rarely use `PureComponent` in my projects. **Although it's simple and easy to use, when facing complex logic, it's actually not as simple and direct as manually managing with `shouldComponentUpdate`**. Of course, this is just my personal development habit. The community also has other solutions:

- Split components into very small sub-components, then uniformly use `PureComponent` to manage rendering timing
- Use [immutable objects](https://facebook.github.io/immutable-js/), then cooperate with `PureComponent` for data comparison (🔗 Reference link: [Youzan React Optimization](https://juejin.im/post/59cdaaccf265da066f6ac83b#heading-4))
- ......

On this issue, opinions vary. Without affecting functionality, it mainly depends on team choice. As long as you agree in advance, the workload in daily development is actually similar (after all, not every page needs performance optimization).

### 4⃣️ React.useMemo and React.useCallback

**📄 Documentation:** https://zh-hans.reactjs.org/docs/hooks-reference.html#usememo

After React16 was released, the React team mainly promoted functional components and hooks. Among them, the officially provided `useMemo` and `useCallback` can perform fine-grained performance optimizations. For specific usage, you can directly check the official documentation.

### 5⃣️ Skillful use of redux

Assuming an RN project uses redux to manage global state, when developing a new page from scratch, because the project is relatively simple with little logic in the early stages, we often wrap the entire Page with `react-redux` and pass redux data in. This is fine in the early stages.

But as the project iterates, the logic of this page will definitely become more complex, and the referenced components and dependent `redux` states will also increase. This will cause a problem: any change in dependent `redux` sub-states will cause the **entire Page** to `re-render`, even if the component that depends on this state only occupies a small part of the entire page.

This situation is actually easy to optimize: don't wrap the entire Page with `react-redux`, but wrap the components that directly depend on redux data with `react-redux`. This can control the performance impact of component redrawing to a minimum.

![Skillful use of redux](https://image-1255652541.file.myqcloud.com/uPic/per-react-redux.png)

<br/>

## 2. Reduce rendering pressure

React Native's layout system relies on the [🔗 Yoga](https://github.com/facebook/yoga) cross-platform layout library at the bottom, mapping virtual DOM to native layout nodes. In web development, 99% of the time one Virtual DOM corresponds to one real DOM. Is it also a one-to-one relationship in React Native? Let's write a simple example to explore.

First, let's write two orange-background cards using JSX. In addition to the card text, the first card also nests a yellow View, and the second card nests an empty View:

```javascript
// The following example code only retains core structure and styles, just get the spirit
render() {
  return (
    <View>
      <View style={{backgroundColor: 'orange'}}>
        <View style={{backgroundColor: 'yellow'}}>
          <Text>Card2</Text>
        </View>
      </View>
      <View style={{backgroundColor: 'orange'}}>
        <View>
          <Text>Card2</Text>
        </View>
      </View>
    </View>
  );
};
```

When viewing React nesting levels with `react-devtools`, it's as shown below:

![](https://image-1255652541.file.myqcloud.com/images/20191226233200.png)

From the image above, we can see that React components still correspond one-to-one with the written structure.

Let's look at the nesting levels after React Native renders to native views (use Debug View Hierarchy on iOS, Layout Inspector on Android):

![](https://image-1255652541.file.myqcloud.com/images/20191226233634.png)

From the image above, we can see that iOS has one React node corresponding to one native View node; but the empty View of the second card on Android **disappeared!**

If we look through React Native's source code, we'll find that before React Native Android UI layout, it will filter Views that only have layout properties ([LAYOUT_ONLY_PROPS source code](https://github.com/facebook/react-native/blob/c2c4b43dfe098342a6958a20f6a1d841f7526e48/ReactAndroid/src/main/java/com/facebook/react/uimanager/ViewProps.java#L185)), **which can reduce View nodes and nesting**, making it more friendly to fragmented Android.

Through this small example, we can see that when React components are mapped to native Views, it's not a one-to-one correspondence. After understanding this knowledge, how can we optimize the layout?

### 1⃣️ Use React.Fragment to avoid multi-level nesting

**📄 React Fragments Documentation**: https://zh-hans.reactjs.org/docs/fragments.html

Let's start with the most familiar place - React.Fragment. This API allows a React component to return multiple nodes. It's very simple to use:

```javascript
render() {
  return (
    <React.Fragment>
      <ChildA />
      <ChildB />
      <ChildC />
    </React.Fragment>
  );
}

// Or use Fragment short syntax
render() {
  return (
    <>
      <ChildA />
      <ChildB />
      <ChildC />
    </>
  );
}
```

The role of `Fragments` is quite obvious: **avoid writing an extra layer of `View`**. It's very useful, for example, React components you encapsulate in your business, React Native official encapsulated components (such as `ScrollView` or `Touchable*` components). Making good use of this attribute can reduce your View nesting levels.

### 2⃣️ Reduce GPU overdraw

In business development, we often encounter this scenario: the background color of the entire interface is white, and a card component with a white background is added on top, and the card contains a small component with a white background...

```javascript
// The following example code only retains core structure and styles, just get the spirit
render() {
  return (
    <View>
      <View style={{backgroundColor: 'white'}}>
        <View style={{backgroundColor: 'white'}}>
          <Text style={{backgroundColor: 'white'}}>Card1</Text>
        </View>
      </View>
      <View>
        <View>
          <Text>Card2</Text>
        </View>
      </View>
    </View>
  );
};
```

First, let's clarify one point: the color of each pixel on the screen is determined by the colors of multiple layers. The GPU will render the final color after mixing these layers, but the GPU rendering mechanisms of iOS and Android are **inconsistent**.

Although the final rendering result of the code above is all white in display, GPU optimization is different. We use iOS's Color Blended Layers and Android's [🔗 GPU overdraw](https://developer.android.com/studio/profile/inspect-gpu-rendering#debug_overdraw) debugging tools to view the final rendering result:

![](https://image-1255652541.file.myqcloud.com/images/20200105182318.png)

For iOS, red areas indicate color mixing:

- Several Views in Card1 have set non-transparent background colors. After the GPU gets the top-level color, it no longer calculates the colors of the lower layers
- Card2's Text View background color is **transparent**, so the GPU also needs to get the color of the next layer for mixing

For Android, the GPU will uselessly render pixels that are invisible to the user. There's a color indicator bar: `white -> blue -> green -> pink -> red`, with colors further back indicating more severe overdraw.

- Several Views in Card1 have set non-transparent background colors. Red indicates at least 4 overdraws have occurred
- Only text in Card2 has overdraw

In the overdraw test, the experimental results of iOS and Android are almost completely opposite, so the solution definitely can't satisfy both. Personally, I think when doing view optimization in React Native development, we should prioritize optimizing Android, so we can optimize from the following points:

- **Reduce repeated background color settings**: If every View sets a background color, it will cause very serious overdraw on Android; and when there are only layout properties, React Native will also reduce Android's layout nesting
- **Avoid setting semi-transparent colors**: Semi-transparent color areas will cause overdraw on both iOS and Android
- **Avoid setting rounded corners**: Rounded corner areas will cause overdraw on both iOS and Android
- **Avoid setting shadows**: Shadow areas will cause overdraw on both iOS and Android
- ......

There are too many details about avoiding GPU overdraw. General pages don't need this fine-grained management, but you can consider this direction when optimizing long lists.

<br/>

## 3. Image optimization tips

Another big part of performance optimization is images. Image optimization here doesn't just mean reducing image size and HTTP bandwidth usage. I'll discuss more about Image component optimizations, such as cache control, image sampling, and other techniques.

### 1⃣️ Optimization items for Image component

React Native's `Image` component, if just used as a regular image display component, has everything it should have, such as:

- Load local/network images
- Automatically match @2x/@3x images
- Image loading events: `onLoadStart`/`onLoad`/`onLoadEnd`/`onError`
- loading default image or loading indicator
- ......

However, if you want to use it as an **image download management library**, it becomes very difficult because several of Image's properties have different behaviors on iOS/Android. Some are implemented and some are not, making it very inconvenient to use.

Before explaining image optimization, let's first think about what a **basic** image download management library needs to implement:

1. **Image types**: First, your main responsibility is to load images. You should at least be able to **load multiple image types**
2. **Download management**: In scenarios of loading multiple images, you should be able to manage multiple requests and **control image loading priority**
3. **Cache management**: Implement three-level caching well. You can't request network for every image. Balance **memory cache and disk cache strategies** well
4. **Multi-image loading**: When multiple images render simultaneously, how to **load images quickly and reduce stuttering**

Based on the above 4 principles, let's analyze the `Image` component one by one.

#### 1.Image types

Basic `png`/`jpg`/`base64`/`gif` formats are well supported. However, note that if you want `gif` images loaded on Android to animate, you need to add some dependencies in `build.gradle`. For specific content, you can check this [🔗 link](https://facebook.github.io/react-native/docs/image#gif-and-webp-support-on-android).

If you want to load webp format images, there are some problems. As an image format launched by Google, Android naturally supports it, but iOS doesn't, so we need to install some third-party plugins. There's a [react-native-webp-format](https://github.com/Aleksefo/react-native-webp-format) in the community that can extend react native's webp capabilities.

#### 2.Download management

Let's start with the conclusion: the `Image` component's ability to manage image downloads is basically 0.

`Image` can basically only monitor the loading process of a single image: `onLoadStart`/`onLoad`/`onLoadEnd`/`onError`. If you want to control the download priority of multiple images, sorry, it's not available.

#### 3.Cache management

Cache needs to be discussed from two aspects: one is managing cache through HTTP header information, and the other is directly managing cache through some component properties.

When the Image component requests network images, it can actually add HTTP header information, so you can use HTTP caching to manage images. The writing is as shown in the code below:

```javascript
<Image
  source={{
    uri: 'https://facebook.github.io/react/logo-og.png',
    method: 'POST',
    headers: {
      Pragma: 'no-cache',
    },
    body: 'Your Body goes here',
  }}
  style={{width: 400, height: 400}}
/>
```

For specific control parameters, you can refer to [🔗 MDN HTTP caching](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching_FAQ), so I won't go into detail here.

Directly controlling image cache through properties is available on iOS. Android? Sorry, not available.

iOS can control cache through the cache field in the source parameter. The properties are also very common ones: default/no cache/force cache/cache only. For specific usage, you can see [🔗 iOS Image cache documentation](https://facebook.github.io/react-native/docs/images#uri-data-images).

#### 4.Multi-image loading

We're almost in the 5G era. Short videos/VLogs are watched every day, not to mention multi-image scenarios, which are basically standard features of internet applications.

Before discussing image loading, let's clarify a concept: **image file size != image size in memory after loading**.

The jpg png webp we often talk about are compressed original files, suitable for disk storage and network transmission, but when displayed on the screen, they need to be restored to original size.

![React Native Performance Optimization - Image Memory Optimization](https://image-1255652541.file.myqcloud.com/images/20191216234550.png)

For example, a 100x100 jpg image might only be a few kb in disk space, but when loaded into memory (不考虑分辨率等问题), it will occupy 3.66 Mb.

```javascript
// Different resolutions/folders/encoding formats will bring numerical differences
// The following calculation is just the most general scenario, just get the spirit

(100 * 100 * 3) / (8 * 1024) = 3.66 Mb
(width * height * bytes per pixel) / (8 * 1024) = 3.66 Mb
```

The above is just a 100x100 image. If the image size doubles, the image size in memory grows by a square factor. When there are many images, memory usage is still quite terrifying.

In multi-image loading scenarios, through practice, iOS performs well no matter how you折腾, but Android easily has problems. Below, let's discuss in detail how to optimize images on the Android side.

In some scenarios, Android's memory will explode and frame rate will directly drop to single digits. This scenario is often small Image containers loading particularly large images, for example, 100x100 containers loading 1000x1000 images. The reason for memory explosion is the reason mentioned above (supplementary note: this problem seems to have been fixed after 0.6X).

So how to solve this problem? Image has a `resizeMethod` property that solves the problem of Android image memory explosion. When the actual image size and container style size are inconsistent, it decides what strategy to use to adjust the image size.

- `resize`: **Small containers loading large images should use this property**. The principle is to use algorithms to modify its data in memory before image decoding. Generally, the image size will be reduced to about 1/8 of the original.
- `scale`: Doesn't change the image byte size, modifies image width and height through scaling. Because of hardware acceleration, loading speed will be faster.
- `auto`: The documentation says it automatically switches between resize and scale properties through heuristic algorithms. **This heuristic algorithm is very misleading**. At first glance, you might think it compares container size and image size to adopt different strategies. But I looked at the source code, and it just judges the image path. If it's a local image, it will use resize, otherwise it uses the scale property. So http images all use scale, and we still need to manually control according to specific scenarios.

By the way, when Android loads images, there will also be a **300ms easy-in loading animation effect**, which makes the image loading seem slower. We can close this loading animation by setting the `fadeDuration` property to 0.

### 2⃣️ Prioritize using 32-bit color depth images

:::caution 2022-08-29 Update
This optimization is not a cure-all!!!

The main reason for writing this originally was considering `CPU -> GPU` communication issues, for example, 32-bit images can save CPU conversion time on iOS. But for 99% of projects, such optimization is not very useful.
:::

**📄 Color depth wiki**: https://www.wikiwand.com/zh-hans/%E8%89%B2%E5%BD%A9%E6%B7%B1%E5%BA%A6

The concept of **color depth** was actually mentioned earlier. For example, the PNG images with transparency we commonly use are 32-bit:

- **R**: Red, occupies 8 bit
- **G**: Green, occupies 8 bit
- **B**: Blue, occupies 8 bit
- **A**: Alpha channel, occupies 8 bit

Why recommend using 32-bit images? There are 2 direct reasons:

1. **Android** recommends using [🔗 ARGB_8888](https://developer.android.com/reference/android/graphics/Bitmap.Config#ARGB_8888) format images because this format has better display effects (some projects might use [🔗 ARGB_4444](https://developer.android.com/reference/android/graphics/Bitmap.Config#ARGB_4444) to optimize memory usage, but this configuration was deprecated in API level 29 due to image display quality issues)
2. **iOS** GPU only supports loading 32-bit images. If it's other formats (such as 24-bit jpg), it will first be converted to 32-bit in CPU, then passed to GPU

Although 32-bit images are recommended, honestly, this is uncontrollable for frontend development because image sources generally come from 2 places:

1. Designer's cut images, controlled by the designer
2. Images on the network, controlled by the uploader

So if you want to optimize based on this point, the communication cost is quite high and the return is not high (generally only has some problems in long lists), but it's still an idea for image optimization, so I put it in this section.

### 3⃣️ Keep Image and ImageView dimensions consistent

Earlier, I gave an example of a 100x100 ImageView loading a 1000x1000 Image causing Android memory OOM, and proposed setting `resizeMethod={'resize'}` to reduce the image's volume in memory. Actually, this is a last resort. If you can control the loaded image size, you should keep Image and ImageView dimensions consistent.

First, let's look at the problems caused by **inconsistent dimensions**:

- Image smaller than ImageView: Image is not clear, has a "sticker aged" texture
- Image larger than ImageView: Wastes memory, might cause OOM
- Inconsistent dimensions bring anti-aliasing calculations, increasing graphics processing burden

When developing with React Native, the unit used for layout is pt, which has a multiple relationship with px. When loading network images, we can use React Native's [🔗 PixelRatio.getPixelSizeForLayoutSize](https://reactnative.cn/docs/pixelratio/#getpixelsizeforlayoutsize) method to load different sized images according to different resolutions, ensuring Image and ImageView dimensions are consistent.

### 4⃣️ Use react-native-fast-image

**📄 react-native-fast-image documentation**: https://github.com/DylanVann/react-native-fast-image

After analyzing the above several Image properties, overall, the Image component's ability to manage images is relatively weak. There's an Image component alternative in the community: **react-native-fast-image**.

Its underlying implementation uses [🔗 iOS's SDWebImage](https://github.com/rs/SDWebImage) and [🔗 Android's Glide](https://github.com/bumptech/glide). Native development students must be very familiar with these two star image download management libraries, which have good performance in cache management, loading priority, and memory optimization. And these properties are available on both platforms, and this library has encapsulated them well. However, the official website only has basic function installation and configuration. If you want to introduce some functions (such as supporting WebP), you still need to check the documentation of SDWebImage and Glide.

Before introducing it, I still want to remind you that React Native's Android Image component encapsulates Facebook's Fresco at the bottom. Introducing this library is equivalent to introducing Glide again, so the package size will inevitably become larger. So before introducing it, you might need to balance it.

### 5⃣️ Image server assistance

All the above optimizations are from the React Native side, but a product is never a one-man show. With the help of server-side power, many things can be saved.

#### 1.Use WebP

I don't need to say much about the advantages of WebP. With the same visual effect, image size will be significantly reduced. And it can significantly reduce the size of CodePush hot update packages (in hot update packages, images occupy more than 90% of the size).

Although WebP decompression time in frontend might be a little more, considering that reduced transmission size will shorten network download time, the overall benefit is still positive.

#### 2.Image hosting customizes images

Generally, larger enterprises have built-in image hosting and CDN services that provide some **custom image functions**, such as specifying image width and height, controlling image quality. Of course, some excellent third-party object storage also provides these functions, such as [🔗 Qiniu Cloud Image Processing](https://developer.qiniu.com/dora/api/1279/basic-processing-images-imageview2).

By using cloud image customization functions, frontend can easily **control image attributes by controlling URL parameters**.

For example, Android changing image byte size through `resizeMethod`'s `resize` can also solve the problem, but this algorithm still runs on the frontend and will still occupy user memory resources. We change the link to:

```html
https://www.imagescloud.com/image.jpg/0/w/100/h/100/q/80
// w: width is 100 px
// h: height is at most 100 px
// q: compression quality is 80
```

This way, we can transfer the computation to the server-side, reducing frontend CPU usage and optimizing overall frontend performance.

-----

Although transferring cropping pressure to server-side/CDN, from an overall perspective, we also need to reconsider server-side design. Here we can refer to the blog post of "NetEase Cloud Music Team": [云音乐 iOS 端网络图片下载优化实践](https://zhuanlan.zhihu.com/p/559129705), which through a series of designs solved the following problems:

- Different URL spliced parameters lead to cache misses, which causes repeated download problems
- Different device UI sizes may be inconsistent, leading to different downloaded image sizes. The more device types, the more spliced size scenarios, and the server needs to crop repeatedly
- Quality parameters are decided by upper-level business themselves, leading to different ends not being well agreed upon, downloading various types of images

These optimizations ultimately improved download speed by 50% and saved 10% of CDN bandwidth, which is very worth reading.

<br/>

## 4. Object creation and call separation

Object creation and call separation is actually more of a coding habit.

We know that in JavaScript, everything is an object, and in JS engines, creating an object takes about 10+ times the time of calling an existing object. In **most cases**, this performance consumption and time consumption is not worth mentioning at all. But I still want to summarize it here because this thinking habit is very important.

### 1⃣️ Use public class fields syntax to bind callback functions

**📄 Documentation**: https://zh-hans.reactjs.org/docs/handling-events.html

As a frontend application, besides rendering the interface, another important thing is handling user interactions and listening to various events. So binding various handling events on components is also an optimization point.

How to handle events in React is already a very classic topic. I searched and found that there have been such articles since React first came out, with four or five handling methods. With the addition of new Hooks, there are even more ways to play.

The most common binding method should be directly handling events through arrow functions:

```javascript
class Button extends React.Component {
  handleClick() {
    console.log('this is:', this);
  }

  render() {
    return <button onClick={(e) => this.handleClick(e)}>Click me</button>;
  }
}
```

But the problem with this syntax is that every time the Button component re-renders, a new `handleClick()` function is created. When the number of re-renders is large, it will cause certain garbage collection pressure on the JS engine and may cause some performance problems.

The [🔗 official documentation](https://zh-hans.reactjs.org/docs/handling-events.html) recommends developers use [🔗 public class fields syntax](https://babeljs.io/docs/plugins/transform-class-properties/) to handle callback functions. This way, a function is only created once and won't be created again when the component re-renders:

```javascript
class Button extends React.Component {
  // This syntax ensures that this is bound in handleClick.
  handleClick = () => {
    console.log('this is:', this);
  }

  render() {
    return <button onClick={this.handleClick}>Click me</button>;
  }
}
```

In actual development, after some data comparison, **the performance consumption caused by different event binding methods is basically negligible**. Too many re-renders are the real performance killer. But I think this awareness is still necessary. After all, logically speaking, creating a new function every time you re-render is really unnecessary.

### 2⃣️ Use public class fields syntax to bind render functions

This is actually similar to the first one, except changing event callback functions to render functions, which is very common in React Native's Flatlist.

Many newcomers using Flatlist will directly pass anonymous functions to renderItem, which creates new anonymous functions every time the render function is called:

```javascript
render(){
  <FlatList
    data={items}
    renderItem={({ item }) => <Text>{item.title}</Text>}
  />
}
```

When changed to public class fields style functions, this phenomenon can be avoided:

```javascript
renderItem = ({ item }) => <Text>{item.title}</Text>;

render(){
  <FlatList
    data={items}
    renderItem={renderItem}
  />
}
```

Similarly, `ListHeaderComponent` and `ListFooterComponent` should also be written this way, passing in pre-rendered Elements in advance to avoid regenerating render functions during re-render, causing component internal images to reload and flash.

### ~~3⃣️ Use StyleSheet.create instead of StyleSheet.flatten~~

:::warning
Nowadays StyleSheet.create doesn't provide any performance optimization. It returns the passed styles as-is. For details, see [source code](https://github.com/facebook/react-native/blob/1465c8f3874cdee8c325ab4a4916fda0b3e43bdb/Libraries/StyleSheet/StyleSheet.js#L359-L372) and [documentation update](https://github.com/facebook/react-native-website/pull/629/files), so this optimization suggestion is invalid.
:::

**📄 Documentation**: https://reactnative.cn/docs/stylesheet/

~~`StyleSheet.create` this function will convert the passed Object into optimized StyleID, which will have some optimizations in memory usage and Bridge communication.~~

```javascript
const styles = StyleSheet.create({
  item: {
    color: 'white',
  },
});

console.log(styles.item) // Prints an integer ID
```

~~In business development, we often extract some common UI components and pass in different parameters to make the UI components display different styles.~~

~~For the flexibility of UI styles, we generally use `StyleSheet.flatten` to merge custom styles passed through props with default styles into one style object:~~

```javascript
const styles = StyleSheet.create({
  item: {
    color: 'white',
  },
});

StyleSheet.flatten([styles.item, props.style]) // <= Merge default styles and custom styles
```

~~The advantage of this is that you can flexibly control styles, but the problem is that when using this method, it will [🔗 recursively traverse](https://github.com/facebook/react-native/blob/aee88b6843/Libraries/StyleSheet/flattenStyle.js) style objects that have already been converted to StyleID, and then **generate a new style object**. This will break the optimization before `StyleSheet.create` and might cause some performance burden.~~

~~Of course, this section doesn't mean you can't use `StyleSheet.flatten`. **Universality and high performance cannot be achieved simultaneously**. Adopting different solutions according to different business scenarios is the right approach.~~

### 4⃣️ Avoid creating new arrays/objects in render functions

When we write code, to avoid passing `undefined` where `[]` is expected because data is not available, we often pass an empty array by default:

```javascript
render() {
  return <ListComponent listData={this.props.list || []}/>
}
```

Actually, a better approach is the following:

```javascript
const EMPTY_ARRAY = [];

render() {
    return <ListComponent listData={this.props.list || EMPTY_ARRAY}/>
}

```

This can't really be considered a performance optimization, it's still the thinking emphasized earlier: **separate object creation and calls**. After all, how much performance problem can recreating an empty array/object during each render cause?

Changing `[]` to a unified `EMPTY_ARRAY` constant is actually similar to avoiding Magic Numbers in daily coding. It's a programming habit, but I think this optimization can be categorized into this category, so I'm mentioning it specifically.

<br/>

## 5. Animation performance optimization

Making animations smooth is very simple. On most devices, you just need to ensure a frame rate of 60fps. But achieving this goal still has some problems on React Native. I drew a diagram describing the current React Native basic architecture (version 0.61).

![](https://image-1255652541.file.myqcloud.com/images/20191222161738.png)

- **UI Thread**: The thread that specifically draws UI on iOS/Android
- **JS Thread**: Most of our business code runs on this thread, React redrawing, processing HTTP request results, disk data IO, etc.
- **other Thread**: Refers to other threads, such as data request threads, disk IO threads, etc.

From the diagram above, we can easily see that **the JS thread is too busy, it has too much to do**. And communication between UI Thread and JS Thread is **asynchronous** (Async Bridge). As long as there are other tasks, it's difficult to ensure that every frame is rendered in time.

After analyzing clearly, the direction of React Native animation optimization naturally comes out:

- Reduce asynchronous communication between JS Thread and UI Thread
- Try to reduce calculations on the JS Thread side

### 1⃣️ Enable `useNativeDriver: true`

:::info Update Notice
After React Native 0.62, the default value of `useNativeDriver` was changed from `false` to `true`
:::

**📄 Documentation**: https://facebook.github.io/react-native/docs/animations#using-the-native-driver

JS Thread and UI Thread communicate through JSON strings. For some predictable animations, such as clicking a like button to trigger a like animation, this kind of completely predictable animation can use `useNativeDrive: true` to enable native animation drive.

![](https://image-1255652541.file.myqcloud.com/images/20191222164337.png)

By enabling native driver, we send all its configuration information to the native side before starting the animation, using native code to execute the animation on the UI thread, without communicating back and forth between the two ends for each frame. This way, once the animation starts, it completely leaves the JS thread, so even if the JS thread is stuck, it won't affect the animation.

Usage is very simple, just add `useNativeDrive: true` to the animation configuration before starting the animation:

```javascript
Animated.timing(this.state.animatedValue, {
  toValue: 1,
  duration: 500,
  useNativeDriver: true // <-- Add this line
}).start();
```

After enabling, all animations will run on the Native thread, and animations will become very smooth and fluid.

After various stress tests, when using native driver animations, there are basically no frame drops, but when using JS-driven animations, once the operation speed increases, frame drops will occur.

It's worth noting that the `useNativeDriver` property also has limitations and can only be used on animation properties that are not layout-related, such as `transform` and `opacity`. Layout-related properties, such as height and position-related properties, will cause errors when enabled. Also, as mentioned earlier, `useNativeDriver` can only be used on predictable animations. For animations that follow gestures, `useNativeDriver` cannot be used.

### 2⃣️ Use `setNativeProps`

**📄 Documentation**: https://facebook.github.io/react-native/docs/direct-manipulation

The `setNativeProps` property is equivalent to directly manipulating the browser's DOM. React officials generally don't recommend directly manipulating DOM, but business scenarios are ever-changing, and you will always encounter some scenarios where you have to manipulate DOM. The same is true in React Native.

For example, in the animation below, when scrolling up and down on the screen, the y-axis offset can be optimized through `ScrollView#onScroll` property's `useNativeDrive: true`. But we can see that as we scroll up and down, the number in the circle also changes accordingly.

![](https://image-1255652541.file.myqcloud.com/images/20191222170401.gif)

If we store the number in `this.state`, every scroll inevitably requires a lot of `setState`, and the React side will perform a lot of redrawing operations, which might cause frame drops. Here we can use `setNativeProps` to avoid React side redrawing, equivalent to directly modifying the number on the DOM, which can make the animation smoother.

### 3⃣️ Use InteractionManager

**📄 Documentation**: https://facebook.github.io/react-native/docs/interactionmanager

An important reason why native apps feel so smooth is that they avoid heavy operations during interactions and animations.

In React Native, the JS thread is too busy and has to do everything. We can put some heavy tasks in `InteractionManager.runAfterInteractions()` to ensure that all interactions and animations have been processed before execution.

```javascript
InteractionManager.runAfterInteractions(() => {
  // ...tasks that require long synchronous execution...
});
```

In the components officially provided by React Native, PanResponder, Animated, and VirtualizedList all use InteractionManager to balance the execution timing between complex tasks and interaction animations.

### 4⃣️ Use react-native-reanimated and react-native-gesture-handler

📺 Video Tutorial: https://www.youtube.com/channel/UC806fwFWpiLQV5y-qifzHnA

**📄 react-native-gesture-handler documentation**: https://github.com/software-mansion/react-native-gesture-handler

**📄 react-native-reanimated documentation**: https://github.com/software-mansion/react-native-reanimated

These two libraries were recommended by a Youtube freelance software developer blogger [🔗 William Candillon](https://www.youtube.com/channel/UC806fwFWpiLQV5y-qifzHnA). Later, I checked and found that they are also the default built-in animation and gesture libraries in Expo.

The purpose of these two libraries is to replace React Native's official [🔗 gesture library](https://facebook.github.io/react-native/docs/gesture-responder-system) and [🔗 animation library](https://facebook.github.io/react-native/docs/animated). Besides having friendlier APIs, I think the biggest advantage is: **gesture animations run on the UI Thread**.

As we mentioned earlier, the `useNativeDrive: true` property **can only be used on predictable animations**. Animations that follow gestures cannot use this property, so gesture capture and animation are both dynamically calculated on the JS side.

Let's take a simple example: **ball follows gesture movement**.

First, let's look at the gesture animation provided by React Native officials. We can see that the JS Thread has a lot of calculations, and the calculation results are asynchronously transmitted to the UI Thread. With any slight disturbance, frame drops will occur.

![](https://image-1255652541.file.myqcloud.com/images/20191222174355.png)

If using **react-native-gesture-handler**, gesture capture and animation are both performed on the UI Thread, free from JS Thread calculations and asynchronous thread communication, so fluidity is naturally greatly improved:

![](https://image-1255652541.file.myqcloud.com/images/20191222174928.png)

So, if you want to build complex gesture animations with React Native, using **react-native-gesture-handler** and **react-native-reanimated** is a good choice that can greatly improve animation fluidity.

### 5⃣️ Use BindingX

**📄 BindingX Documentation**: https://alibaba.github.io/bindingx/guide/cn_introduce

BindingX is an open-source framework from Alibaba used to solve rich interaction problems on `weex` and `React Native`. The **core idea** is to describe "interaction behavior" in the form of expressions and preset them to Native in advance, avoiding frequent communication between JS and Native when the behavior is triggered.

Of course, introducing the above third-party libraries will definitely bring some learning costs. For pages with complex interactions, some teams might use native components instead, for example, [🔗 Meituan Waimai](https://mp.weixin.qq.com/s/9wv4uHg51EELU0yoIFQw8A) will use native components to implement fine animations and strong interaction modules, so specific usage still depends on the team's technical reserves and APP scenarios.

![](https://image-1255652541.file.myqcloud.com/images/20191229205057.png)

<br/>

## 6. Long list performance optimization

In React Native development, the scenario most likely to encounter performance requirements is long lists. In daily business practice, after good optimization, rendering thousands of data is still no problem.

Virtual lists have always been a classic topic in frontend. The core idea is very simple: only render currently displayed and soon-to-be-displayed Views, and use blank Views for distant Views, thereby reducing the memory usage of long lists.

On the React Native official website, [🔗 list configuration optimization](https://reactnative.cn/docs/optimizing-flatlist-configuration/) is actually explained very well. We basically just need to understand several configuration items clearly and then configure them flexibly. But the problem lies in the four words "**understand clearly**". In this section, I'll combine graphics and text to explain these configurations clearly.

### 1⃣️ Relationships between various lists

React Native has several list components, let me briefly introduce them:

- **ScrollView**: Renders all Views in the view, directly connects to Native's scroll list
- **VirtualizedList**: Core file of virtual list, uses ScrollView, long list optimization configuration items mainly control it
- **FlatList**: Uses VirtualizedList, implements multi-row functionality, most functions are provided by VirtualizedList
- **SectionList**: Uses VirtualizedList, uses VirtualizedSectionList at the bottom, converts 2D data to 1D data

There are also some other dependent files. A [🔗 blog post](https://juejin.im/post/5d2f0cde6fb9a07eba2c7269) has a diagram that summarizes well. I'll borrow its diagram here:

![](https://image-1255652541.file.myqcloud.com/images/20200105203140.png)

We can see that **VirtualizedList** is the main actor. Below, let's combine some example code to analyze its configuration items.

### 2⃣️ List configuration items

Before explaining, let's write a small demo. The demo is very simple - a list based on FlatList with different colors for odd and even rows.

```javascript
export default class App extends React.Component {
  renderItem = item => {
    return (
      <Text
        style={{
          backgroundColor: item.index % 2 === 0 ? 'green' : 'blue',
        }}>
        {'第 ' + (item.index + 1) + ' 个'}
      </Text>
    );
  }

  render() {
    let data = [];
    for (let i = 0; i < 1000; i++) {
      data.push({key: i});
    }

    return (
      <View style={{flex: 1}}>
        <FlatList
          data={data}
          renderItem={this.renderItem}
          initialNumToRender={3} // Number of elements rendered in first batch
          windowSize={3} // Rendering area height
          removeClippedSubviews={Platform.OS === 'android'} // Whether to clip subviews
          maxToRenderPerBatch={10} // Maximum number for incremental rendering
          updateCellsBatchingPeriod={50} // Time interval for incremental rendering
          debug // Enable debug mode
        />
      </View>
    );
  }
}
```

VirtualizedList has a **debug** configuration item. After enabling it, it will display the virtual list's display situation on the right side of the view.

This property is not mentioned in the documentation. I discovered it by looking through [🔗 source code](https://github.com/facebook/react-native/blob/master/Libraries/Lists/VirtualizedList.js#L90). I found that after enabling it, it's very convenient for demonstration and explanation, as you can intuitively learn concepts like initialNumToRender, windowSize, Viewport, Blank areas, etc.

Below is a demo screenshot after enabling debug:

![](https://image-1255652541.file.myqcloud.com/images/20200105212114.png)

The diagram above is very clear. The **yellow part** of the debug indicator bar on the right represents Items in memory. Let me describe each attribute in text:

#### 1.initialNumToRender

The number of elements that should be rendered in the first batch, just enough to cover the first screen is best. And from the debug indicator, we can see that this batch of elements will always exist in memory.

#### 2.Viewport

Viewport height, which is what users can see, generally the device height.

#### 3.windowSize

Rendering area height, generally an integer multiple of Viewport. Here I set it to 3. From the debug indicator, we can see that its height is **3 times** that of **Viewport**, extending one screen height above and one screen height below. Content within this area will be saved in memory.

Setting windowSize to a smaller value can reduce memory consumption and improve performance, but when quickly scrolling the list, the chance of encountering unrendered content will increase, and you'll see placeholder white Views. Everyone can set windowSize to 1 to test, and you'll 100% see placeholder Views.

#### 4.Blank areas

Blank Views. VirtualizedList will replace Items outside the rendering area with blank Views to reduce the memory usage of long lists. Can be at both top and bottom.

The above is a rendering diagram. We can use react-devtools to look at React's Virtual DOM again (for screenshot convenience, I set initialNumToRender and windowSize to 1). We can see it's consistent with the schematic diagram above.

![](https://image-1255652541.file.myqcloud.com/images/20200105214338.png)

#### 5.removeClippedSubviews

This property translated as "clip subviews" doesn't have very clear documentation. The general idea is that setting it to true can improve rendering speed, but might cause bugs on iOS. This property doesn't do any optimization in VirtualizedList, it's directly passed through to ScrollView.

In a [🔗 commit](https://github.com/facebook/react-native/commit/1a499f4) in version 0.59, FlatList enables this function by default on Android. If your version is below 0.59, you can enable it with the following method:

```javascript
removeClippedSubviews={Platform.OS === 'android'}
```

#### 6.maxToRenderPerBatch and updateCellsBatchingPeriod

VirtualizedList's data is not rendered all at once, but in batches. These two properties control **incremental rendering**.

These two properties are generally used together. maxToRenderPerBatch represents the **maximum number** for each incremental render, and updateCellsBatchingPeriod represents the **time interval** for each incremental render.

We can adjust these two parameters to balance rendering speed and response speed. However, as an art, parameter tuning is difficult to reach a unified "best practice", so in our business, we haven't touched these two properties and just use the system default values.

### 2⃣️ ListItems optimization

**📄 ListItems optimization documentation**: https://reactnative.cn/docs/optimizing-flatlist-configuration/#list-items

The documentation mentions several optimization points. I've actually introduced them all in the previous text. Let me briefly mention them again:

#### 1.Use getItemLayout

If FlatList (VirtualizedList)'s ListItem **height is fixed**, then using getItemLayout is very worthwhile.

In the source code ([#L1287](https://github.com/facebook/react-native/blob/master/Libraries/Lists/VirtualizedList.js#L1287), [#L2046](https://github.com/facebook/react-native/blob/master/Libraries/Lists/VirtualizedList.js#L2046)), if you don't use getItemLayout, then the height of all Cells needs to call View's onLayout to dynamically calculate height. This calculation consumes time. If we use getItemLayout, VirtualizedList directly knows the Cell's height and offset, saving the calculation and this overhead.

Here I also want to mention a few points to pay attention to when using getItemLayout:

- If ListItem height is not fixed, when using getItemLayout to return a fixed height, because the final rendered height is inconsistent with the predicted height, page jumping problems will occur [🔗 issue link](https://juejin.im/post/5b61479b6fb9a04f9963be77#heading-38)
- If you use `ItemSeparatorComponent`, the separator line's size must also be considered in offset calculation [🔗 documentation link](https://reactnative.cn/docs/flatlist.html#getitemlayout)
- If FlatList uses `ListHeaderComponent`, you must also consider the Header's size in offset calculation [🔗 official example code link](https://github.com/facebook/react-native/blob/8553e1acc4195479190971cc7a3ffaa0ed37a5e0/RNTester/js/examples/MultiColumn/MultiColumnExample.js#L120)

#### 2.Use simple components & Use light components

Using simple components means reducing logic judgment and nesting. Optimization methods can refer to the content of "[2. Reduce rendering pressure](#2-reduce-rendering-pressure)".

#### 3.Use shouldComponentUpdate

Refer to the content of "[1. Reduce re-render](#1-reduce-re-render)".

#### 4.Use cached optimized images

Refer to the content of "[3. Image optimization tips](#3-image-optimization-tips)".

#### 5.Use keyExtractor or key

Regular optimization point, you can see React's documentation [🔗 Lists & Keys](https://zh-hans.reactjs.org/docs/lists-and-keys.html).

#### 6.Avoid anonymous function on renderItem

renderItem should avoid using anonymous functions, refer to the content of "[4. Object creation and call separation](#4-object-creation-and-call-separation)".

<br/>

## 7. Tools for React Native performance optimization

Performance optimization tools are essentially a subset of debugging tools. Because of its特殊性, React Native needs to use RN/iOS/Android three-end tools for some performance analysis and debugging. Below, I'll list the tools I usually use. Specific usage methods are not the focus of this article. If needed, you can search according to keywords.

#### 1.React Native official debugging tools

The official website explains this very clearly. For specific content, see [🔗 direct link](https://reactnative.cn/docs/debugging/).

#### 2.react-devtools

React Native runs on native APPs, so you can't use browser plugins for layout viewing. You need to use this Electron-based react-devtools. When writing this article, React Native's latest version was still 0.61, which doesn't support the latest V4 version of react-devtools, so you still need to install the old version. For specific installation methods, see this [🔗 link](https://zh-hans.reactjs.org/blog/2019/08/15/new-react-devtools.html).

#### 3.XCode

iOS development IDE. When viewing and analyzing performance issues, you can use **instruments** and **Profiler** for debugging.

![](https://image-1255652541.file.myqcloud.com/images/20200108234146.png)

#### 4.Android Studio

Android development IDE. For viewing performance, you can use **Android Profiler**. The [🔗 official website](https://developer.android.com/studio/profile?hl=zh-cn) explains it very detailedly.

#### 5.iOS Simulator

iOS simulator. Its Debug can show some analysis content.

![](https://image-1255652541.file.myqcloud.com/images/20200107233550.png)

#### 6.Android real device -> Developer options

Android developer options have many things to see, such as GPU rendering analysis and animation debugging. Can be enabled for use during real device debugging.

<br/>

## 8. New Architecture - Fabric

:::info 2022-01-19 Update
React Native's official website has a new [architecture column](https://reactnative.dev/docs/architecture-overview) that very detailedly introduces how [Fabric architecture](https://reactnative.dev/docs/fabric-renderer) works. Interested people can go check it out
:::

## 9. Recommended reading

【React Native Performance Optimization Guide】is basically finished here. There might be some imprecise or incorrect points in the content of the article. I ask all frontend/iOS/Android experts to provide guidance.

The full article references nearly 50 links, which would take up too much space if placed at the end, so I've scattered them throughout the article. I've marked them with **emoji 🔗** for your reference. If you have questions, you can go to the original text to view.

### RN Performance Optimization Series Directory:

- [🎨 React Native Performance Optimization - Rendering Chapter](https://supercodepower.com/react_native_performance_optimization_guides)
- [⚡️ React Native Startup Speed Optimization - Native Chapter](https://supercodepower.com/react-native-performance-native)
- [⚡️ React Native Startup Speed Optimization - JS Chapter](https://supercodepower.com/react-native-performance-js)



<br />

<br />

<br />

<br />

:::note A small note
Welcome to follow the official account: **卤代烃实验室**: Focus on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::