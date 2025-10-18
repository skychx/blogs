---
slug: react-native-performance-js
title: ⚡️ React Native Startup Speed Optimization—JS Part
authors: skychx

description: From React Native startup to the first page render completion, analyzing React Native's startup performance optimization path with source code and new architecture insights
draft: false
tags: [react native, cross-platform development, performance optimization]
---

[Previous article](https://supercodepower.com/react-native-performance-native) mainly analyzed React Native's initialization process from a Native perspective and summarized several optimization points for React Native container initialization based on source code. This article focuses on JavaScript and summarizes some JS-side optimization points.

{/* truncate */}

## 1. JSEngine

![React Native JSEngine startup](https://image-1255652541.file.myqcloud.com/uPic/rn_start_jsEngine.jpg)

### Hermes

Hermes is a JS engine open-sourced by Facebook in mid-2019. From the [release](https://github.com/facebook/hermes/releases) records, you can see this is a JS engine specially built for React Native, designed for Hybrid UI systems from the beginning.

Hermes **supports direct bytecode loading**, meaning `Babel`, `Minify`, `Parse`, and `Compile` processes are all completed on the developer's computer, directly deploying bytecode for Hermes to run. This can **eliminate the JSEngine process of parsing and compiling JavaScript**, greatly accelerating JS code loading speed and significantly improving startup speed.

![Hermes bytecode precompilation](https://image-1255652541.file.myqcloud.com/uPic/Hermes.gif)

For more features about Hermes, you can read my old article ["Which Mobile JS Engine is the Best?"](https://supercodepower.com/mobile-javascript-engines#3hermes) where I provided more detailed feature explanations and data comparisons, so I won't elaborate here.

## 2. JS Bundle

![React Native JS Bundle startup](https://image-1255652541.file.myqcloud.com/uPic/rn_start_jsBundle.jpg)

The previous optimizations were actually Native-layer optimizations. From here, we enter the area most familiar to web front-end developers.

Actually, when it comes to JS Bundle optimization, the paths are always the same:

- **Reduce**: Reduce the total size of the Bundle to decrease JS loading and parsing time
- **Delay**: Dynamic import, lazy loading, on-demand loading, delayed execution
- **Split**: Split common modules and business modules to avoid duplicate introduction of common modules

If you have webpack packaging optimization experience, seeing the above optimization methods, you might already have some webpack configuration items in mind. However, React Native's packaging tool is not webpack but Facebook's self-developed [Metro](https://facebook.github.io/metro/). Although the configuration details are different, the principles are similar. Below, I'll explain how React Native optimizes JS Bundle based on these points.

### 2.1 Reduce JS Bundle Size

When Metro packages JS, it converts ESM modules to CommonJS modules, which causes Tree Shaking, currently popular and dependent on ESM, to be completely ineffective. According to the [official response](https://github.com/facebook/metro/issues/227#issuecomment-583358386), Metro will not support Tree Shaking in the future:

![Tree Shaking is too low, we made something cooler called Hermes](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-05_10-36-13.jpg)

For this reason, we mainly reduce bundle size in three directions:

- For the same functionality, prioritize smaller third-party libraries
- Use babel plugins to avoid full imports
- Establish coding standards to reduce duplicate code

Let's take a few examples to explain the three approaches above.

#### 2.1.0 Use react-native-bundle-visualizer to view package size

Before optimizing bundle files, you must know what's in the bundle. The best way is to visualize all dependency packages. In web development, you can use Webpack's `webpack-bundle-analyzer` plugin to view the dependency size distribution. React Native also has similar tools. You can use [`react-native-bundle-visualizer`](https://github.com/IjzerenHein/react-native-bundle-visualizer) to view dependencies:

![Bundle visualizer example](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_20-36-59.jpg)

Usage is very simple; just install and analyze according to the documentation.

<br />

#### 2.1.1 Replace moment.js with day.js

This is a very classic example. For the same time formatting third-party library, [moment.js](https://github.com/moment/moment) is 200 KB, while [day.js](https://github.com/iamkun/dayjs) is only 2KB, and its API remains consistent with moment.js. If your project uses moment.js, replacing it with day.js can immediately reduce JSBundle size.

<br />

#### 2.1.2 lodash.js with babel-plugin-lodash

lodash is basically standard in web front-end engineering, but for most people, among the nearly 300 functions encapsulated by lodash, they only use a few common ones like `get`, `chunk`. Importing the entire library for just these few functions is somewhat wasteful.

Of course, the community has optimization solutions for this scenario, such as `lodash-es`, which exports functions in ESM format, and then uses Tree Shaking optimization from tools like Webpack to keep only the referenced files. However, as mentioned earlier, React Native's packaging tool Metro doesn't support Tree Shaking, so for `lodash-es` files, they will still be fully imported, and the full `lodash-es` file is much larger than `lodash`.

I did a simple test: for a newly initialized React Native application, after fully importing lodash, the package size increased by 71.23KB; after fully importing `lodash-es`, the package size expanded by 173.85KB.

Since `lodash-es` is not suitable for use in RN, we can only find solutions with `lodash`. lodash actually has another usage method, which is directly referencing single files. For example, if we want to use the `join` method, we can reference it like this:

```javascript
// Full import
import { join } from 'lodash'

// Single file import
import join from 'lodash/join'
```

This way, only the `lodash/join` file will be packaged during bundling.

But this approach is still too troublesome. For example, if we want to use seven or eight lodash methods, we would need to import seven or eight times separately, which is very tedious. For such a popular tool library as lodash, the community definitely has experts who have arranged it. The [`babel-plugin-lodash`](https://github.com/lodash/babel-plugin-lodash) babel plugin can automatically perform the following transformations during JS compilation by manipulating the AST:

```javascript
import { join, chunk } from 'lodash'
// ⬇️
import join from 'lodash/join'
import chunk from 'lodash/chunk'
```

Usage is also very simple. First run `yarn add babel-plugin-lodash -D` to install, then enable the plugin in the `babel.config.js` file:

```javascript
// babel.config.js

module.exports = {
  plugins: ['lodash'],
  presets: ['module:metro-react-native-babel-preset'],
};
```

Taking the `join` method as an example, you can see the **incremental** JS Bundle size for various methods:

| Full lodash | Full lodash-es | lodash/join single file import | lodash + babel-plugin-lodash |
| ----------- | ------------- | ---------------------- | ---------------------------- |
| 71.23 KB    | 173.85 KB     | 119 Bytes              | 119 Bytes                    |

From the table, `lodash` with `babel-plugin-lodash` is the optimal development choice.

<br />

#### 2.1.3 Using babel-plugin-import

`babel-plugin-lodash` can only solve lodash import issues. Actually, the community has another very practical babel plugin: [`babel-plugin-import`](https://github.com/ant-design/babel-plugin-import), **which can basically solve all on-demand import problems**.

Let me give a simple example. Alibaba has a very useful [ahooks](https://ahooks.js.org/) open-source library that encapsulates many commonly used React hooks. The problem is that this library is encapsulated for the Web platform. For example, the `useTitle` hook is used to set webpage titles, but the React Native platform doesn't have related BOM APIs, so this hook is completely unnecessary to import and will never be used on RN.

At this point, we can use `babel-plugin-import` to achieve on-demand imports. Assuming we only need to use the `useInterval` hook, we import it in our business code:

```javascript
import { useInterval } from 'ahooks'
```

Then run `yarn add babel-plugin-import -D` to install the plugin and enable it in the `babel.config.js` file:

```javascript
// babel.config.js

module.exports = {
  plugins: [
    [
      'import',
      {
        libraryName: 'ahooks',
        camel2DashComponentName: false, // Whether camelCase to dash
        camel2UnderlineComponentName: false, // Whether camelCase to underscore
      },
    ],
  ],
  presets: ['module:metro-react-native-babel-preset'],
};
```

After enabling, you can achieve on-demand imports for ahooks:

```javascript
import { useInterval } from 'ahooks'
// ⬇️
import useInterval from 'ahooks/lib/useInterval'
```

Below is the JSBundle **size increment** in various situations. Overall, `babel-plugin-import` is the optimal choice:

| Full ahooks | ahooks/lib/useInterval single file import | ahooks + babel-plugin-import |
| ----------- | --------------------------------- | ---------------------------- |
| 111.41 KiB  | 443 Bytes                         | 443 Bytes                    |

Of course, `babel-plugin-import` can act on many library files, such as internal/third-party encapsulated UI components. Basically, on-demand imports can be achieved through `babel-plugin-import` configuration options. If needed, you can refer to usage experiences summarized by others online. I won't elaborate here.

<br />

#### 2.1.4 babel-plugin-transform-remove-console

The babel plugin to remove console is also very useful. We can configure it to remove `console` statements when packaging and releasing, which reduces package size and also speeds up JS execution. We just need to install it and configure it simply:

```javascript
// babel.config.js

module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    env: {
        production: {
            plugins: ['transform-remove-console'],
        },
    },
};
```

<br />

#### 2.1.5 Establish Good Coding Standards

There are too many best practices for coding standards. To fit the theme (reduce code size), I'll randomly mention a few points:

- **Code abstraction and reuse**: For repeated logic in code, abstract it into a method based on reusability. Don't copy and paste every time you use it
- **Delete invalid logic**: This is also common. As business iterates, much code becomes unused. If a feature is deprecated, delete it directly. If you need it later, you can find it in git records
- **Delete redundant styles**: For example, introduce [ESLint plugin for React Native](https://github.com/Intellicode/eslint-plugin-react-native/blob/master/README.md), enable the `"react-native/no-unused-styles"` option, and use ESLint to prompt for invalid style files

Honestly, these optimizations can't reduce code by much, maybe a few KB. The greater value lies in **improving project robustness and maintainability**.

### 2.2 Inline Requires

`Inline Requires` can be understood as **lazy execution**. Note that I'm not talking about lazy loading here. Generally, after RN container initialization, it will fully load and parse the JS Bundle file. The role of `Inline Requires` is **delayed execution**, meaning JS code only executes when needed, not at startup. In React Native 0.64, `Inline Requires` is enabled by default.

First, we need to confirm that `Inline Requires` is enabled in `metro.config.js`:

```javascript
// metro.config.js

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // <-- here
      },
    }),
  },
};
```

Actually, the principle of `Inline Requires` is very simple—it just changes the position of require imports.

For example, if we write a utility function `join` and put it in the `utils.js` file:

```javascript
// utils.js

export function join(list, j) {
  return list.join(j);
}
```

Then we import this library in `App.js`:

```javascript
// App.js

import { join } from 'my-module';

const App = (props) => {
  const result = join(['a', 'b', 'c'], '~');

  return <Text>{result}</Text>;
};
```

The above writing, after being compiled by `Metro`, is **equivalent** to being compiled into the following form (file-top-level imports converted to usage-position imports):

```javascript
const App = (props) => {
  const result = require('./utils').join(['a', 'b', 'c'], '~');

  return <Text>{result}</Text>;
};
```

The actual compiled code looks like this:

![Inline requires example](https://image-1255652541.file.myqcloud.com/uPic/rn_start_inlineRequire.jpg)

The `r()` function in the red box in the image above is actually RN's encapsulated `require()` function. You can see that Metro automatically moved top-level imports to the usage position.

It's worth noting that Metro's automatic `Inline Requires` configuration currently **does not support** `export default` exports. That is, if your join function is written like this:

```javascript
export default function join(list, j) {
  return list.join(j);
}
```

When imported like this:

```javascript
import join from './utils';

const App = (props) => {
  const result = join(['a', 'b', 'c'], '~');

  return <Text>{result}</Text>;
};
```

The corresponding import in the code compiled by Metro **remains at the function top level**:

![Default export not inlined](https://image-1255652541.file.myqcloud.com/uPic/rn_start_require.jpg)

This needs special attention. There are also related articles in the community calling for everyone not to use the `export default` syntax. Interested parties can learn more:

[Deep Analysis of ES Module (1): Disable export default object](https://zhuanlan.zhihu.com/p/40733281)

[Deep Analysis of ES Module (2): Completely disable default export](https://zhuanlan.zhihu.com/p/97335917)

### 2.3 JSBundle Split Loading

Bundle splitting scenarios generally occur in situations where Native is primary and React Native is secondary. These scenarios are usually like this:

- Suppose there are two RN-based business lines A and B, and their JSBundles are dynamically deployed
- A's JSBundle size is 700KB, including 600KB of base package (React, React Native JS code) and 100KB of business code
- A's JSBundle size is 800KB, including 600KB of base package and 200KB of business code
- Every time jumping from Native to A/B's RN container, it needs to **fully** download, parse, and run

From the example above, you can see that the 600KB base package is **duplicate** across multiple business lines and completely unnecessary to download and load multiple times. At this point, an idea naturally emerges:

> Package some common libraries into a `common.bundle` file. We only need to dynamically deploy business packages `businessA.bundle` and `businessB.bundle`, and then implement loading `common.bundle` file first on the client, then loading `business.bundle` file

This approach has several benefits:

- `common.bundle` can be placed locally, saving multiple downloads for multiple business lines, **saving traffic and bandwidth**
- Can load `common.bundle` during RN container pre-initialization, **resulting in smaller business package volumes for secondary loading and faster initialization**

Following the above thinking, the above problem transforms into two smaller problems:

- How to implement JSBundle splitting?
- How do iOS/Android RN containers implement multi-bundle loading?

<br />

#### 2.3.1 JS Bundle Splitting

Before splitting bundles, you need to understand the workflow of the Metro packaging tool. Metro's packaging process is very simple, with only three steps:

- **Resolution**: Can be simply understood as analyzing the dependency relationships of each module, ultimately generating a dependency graph
- **Transformation**: Code compilation and transformation, mainly using Babel's compilation and transformation capabilities
- **Serialization**: After all code transformations are complete, print the transformed code, generating one or more bundle files

From the above process, you can see that our bundle splitting step will only occur in the `Serialization` step. As long as we use the various methods exposed by `Serialization`, we can implement bundle splitting.

Before formally splitting bundles, let's set aside various technical details and simplify the problem: **For an array of all numbers, how do you divide it into even and odd arrays?**

This problem is too simple. Anyone who has just learned programming should be able to think of the answer: traverse the original array, if the current element is odd, put it in the odd array, if even, put it in the even array.

Metro's splitting of JS bundles follows the same principle. When Metro packages, it sets a moduleId for each module. This id is an incrementing number starting from 0. When we split bundles, we output common modules (like `react`, `react-native`) to `common.bundle` and business modules to `business.bundle`.

Because we need to accommodate multiple business lines, the current industry mainstream splitting solution is as follows:

**1.** First establish a `common.js` file that imports all common modules, then Metro uses this `common.js` as the entry file to package a `common.bundle` file, **while recording all common module moduleIds**

```javascript
// common.js

require('react');
require('react-native');
......
```

**2.** Package business line A. Metro's packaging entry file is A's project entry file. During packaging, you need to **filter** out the **common module moduleIds** recorded in the previous step, so the packaging result only contains A's business code

```javascript
// indexA.js

import {AppRegistry} from 'react-native';
import BusinessA from './BusinessA';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => BusinessA);
```

**3.** Business lines B, C, D, E... have the same packaging process as business line A

<br />

The above approach looks good, but there's still a problem: **every time Metro starts packaging, moduleId starts incrementing from 0, which will cause different JSBundle IDs to duplicate**.

To avoid id duplication, the current industry mainstream practice is to use the module's path as moduleId (because module paths are basically fixed and non-conflicting), which solves the id conflict problem. Metro exposes the `createModuleIdFactory` function, where we can override the original incrementing number logic:

```javascript
module.exports = {
  serializer: {
    createModuleIdFactory: function () {
      return function (path) {
        // Build ModuleId based on file's relative path
        const projectRootPath = __dirname;
        let moduleId = path.substr(projectRootPath.length + 1);
        return moduleId;
      };
    },
  },
};
```

<br />

Integrating the first step's approach, we can build the following `metro.common.config.js` configuration file:

```javascript
// metro.common.config.js

const fs = require('fs');

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  serializer: {
    createModuleIdFactory: function () {
      return function (path) {
        // Build ModuleId based on file's relative path
        const projectRootPath = __dirname;
        let moduleId = path.substr(projectRootPath.length + 1);

        // Write moduleId to idList.txt file, recording common module ids
        fs.appendFileSync('./idList.txt', `${moduleId}\n`);
        return moduleId;
      };
    },
  },
};
```

Then run the command line to package:

```bash
# Packaging platform: android
# Packaging config file: metro.common.config.js
# Packaging entry file: common.js
# Output path: bundle/common.android.bundle

npx react-native bundle --platform android --config metro.common.config.js --dev false --entry-file common.js --bundle-output bundle/common.android.bundle
```

Through the above command packaging, you can see that moduleId has been converted to relative paths, and `idList.txt` also records all moduleIds:

![Common bundle output](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_22-20-28.jpg)

![ID list output](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_22-20-49.jpg)

<br />

The key to the second step is filtering common module moduleIds. Metro provides the `processModuleFilter` method, which can be used to implement module filtering. The specific logic can be seen in the following code:

```javascript
// metro.business.config.js

const fs = require('fs');

// Read idList.txt, convert to array
const idList = fs.readFileSync('./idList.txt', 'utf8').toString().split('\n');

function createModuleId(path) {
  const projectRootPath = __dirname;
  let moduleId = path.substr(projectRootPath.length + 1);
  return moduleId;
}

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  serializer: {
    createModuleIdFactory: function () {
      // createModuleId logic is completely the same as metro.common.config.js
      return createModuleId;
    },
    processModuleFilter: function (modules) {
      const mouduleId = createModuleId(modules.path);

      // Filter data in common.bundle through moduleId
      if (idList.indexOf(mouduleId) < 0) {
        console.log('createModuleIdFactory path', mouduleId);
        return true;
      }
      return false;
    },
  },
};
```

Finally, run the command line to package:

```bash
# Packaging platform: android
# Packaging config file: metro.business.config.js
# Packaging entry file: index.js
# Output path: bundle/business.android.bundle

npx react-native bundle --platform android --config metro.business.config.js --dev false --entry-file index.js --bundle-output bundle/business.android.bundle
```

The final packaging result is only 11 lines (without splitting it would be 398 lines), showing that the benefits of splitting are significant.

![Business bundle output](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_22-34-24.jpg)

Of course, using relative paths as moduleId when packaging will inevitably increase package size. We can use md5 to calculate the relative path and take the first few characters as the final moduleId; or still use incremental ids but use more complex mapping algorithms to ensure moduleId uniqueness and stability. This content actually belongs to the very classic **Map key design problem**. Interested readers can learn about related algorithm theory.

<br />

#### 2.3.2 Native Implementation of Multi-bundle Loading

Bundle splitting is only the first step. To display a complete and correct RN interface, you also need to achieve "merging," which refers to implementing multi-bundle loading on the Native side.

Loading `common.bundle` is relatively easy; just load it directly during RN container initialization. I've already introduced the container initialization process in detail in the previous section, so I won't elaborate here. At this point, the problem transforms into the loading issue of `business.bundle`.

Unlike browser multi-bundle loading where you can dynamically generate a `<script />` tag and insert it into HTML to achieve dynamic loading, we need to combine specific RN container implementations to achieve `business.bundle` loading requirements. At this point, we need to focus on two points:

1. **Timing**: When to start loading?
2. **Method**: How to load the new bundle?

<br />

For the first question, our answer is to load `business.bundle` after `common.bundle` is loaded.

After `common.bundle` loading is complete, the iOS side sends a global notification with event name `RCTJavaScriptDidLoadNotification`, while the Android side calls the `onReactContextInitialized()` method of all ReactInstanceEventListener registered in the ReactInstanceManager instance. We can implement business package loading in the corresponding event listeners and callbacks.

<br />

For the second question, on iOS, we can use RCTCxxBridge's `executeSourceCode` method to execute a piece of JS code in the current RN instance context, thereby achieving incremental loading. However, it's worth noting that `executeSourceCode` is a private method of RCTCxxBridge, and we need to expose it using Category.

On Android, we can use the newly established ReactInstanceManager instance, get the current ReactContext context object through `getCurrentReactContext()`, then call the context object's `getCatalystInstance()` method to get the catalyst instance, and finally call the catalyst instance's `loadScriptFromFile(String fileName, String sourceURL, boolean loadSynchronously)` method to complete incremental loading of the business JSBundle.

Example code for iOS and Android is as follows:

```objectivec
NSURL *businessBundleURI = // Business bundle URI
NSError *error = nil;
NSData *sourceData = [NSData dataWithContentsOfURL:businessBundleURI options:NSDataReadingMappedIfSafe error:&error];
if (error) { return }
[bridge.batchedBridge executeSourceCode:sourceData sync:NO]
```

```java
ReactContext context = RNHost.getReactInstanceManager().getCurrentReactContext();
CatalystInstance catalyst = context.getCatalystInstance();
String fileName = "businessBundleURI"
catalyst.loadScriptFromFile(fileName, fileName, false);
```

<br />

------

The example code in this section belongs to demo level. If you want to actually integrate into a production environment, you need to customize it according to the actual architecture and business scenarios. There's a React Native bundle splitting repository [react-native-multibundler](https://github.com/smallnew/react-native-multibundler) with quite good content that everyone can refer to and learn from.

## 3. Network

![React Native network startup](https://image-1255652541.file.myqcloud.com/uPic/rn_start_network.jpg)

We generally request the network after React Component's `componentDidMount()` execution to get data from the server, then change the Component's state to render the data.

Network optimization is a very large and independent topic with many points that can be optimized. Here I'll list several network optimization points related to first-screen loading:

- **DNS caching**: Cache IP addresses in advance to skip DNS resolution time
- **Cache reuse**: Before entering the RN page, request network data in advance and cache it. After opening the RN page and before requesting the network, check cached data first. If the cache hasn't expired, get data directly from local cache
- **Request merging**: If still using HTTP/1.1, if there are multiple requests on the first screen, merge multiple requests into one request
- **HTTP2**: Use HTTP2's parallel requests and multiplexing to optimize speed
- **Reduce size**: Remove redundant fields from APIs, reduce image resource sizes, etc.
- ......

Since network is relatively independent here, iOS/Android/Web optimization experiences can all be applied to RN. Just follow everyone's previous optimization experience.

## 4. Render

![React Native render startup](https://image-1255652541.file.myqcloud.com/uPic/rn_start_render.jpg)

**The time spent on rendering is basically positively correlated with the UI complexity of the first-screen page**. You can see where time consumption occurs through the rendering process:

- **VDOM calculation**: The higher the page complexity, the longer the JavaScript-side calculation time will be (VDOM generation and Diff)
- **JS Native communication**: JS calculation results are converted to JSON and passed to the Native side through Bridge. The higher the complexity, the larger the JSON data volume, potentially blocking Bridge communication
- **Native rendering**: The Native side recursively parses the render tree. The more complex the layout, the longer the rendering time

We can enable `MessageQueue` monitoring in the code to see what's happening on the JS Bridge after APP startup:

```javascript
// index.js

import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue'
MessageQueue.spy(true);
```

![MessageQueue monitoring output](https://image-1255652541.file.myqcloud.com/uPic/rn_start_MessageQueue.jpg)

From the image, you can see that after JS loading is complete, there are many UI-related `UIManager.createView()` and `UIManager.setChildren()` communications. Combined with the time consumption summary above, we have corresponding solutions:

- Reduce UI nesting levels through certain layout techniques to lower UI view complexity
- Reduce re-rendering, directly intercept the redraw process on the JS side, reducing the frequency and data volume of bridge communication
- If it's an RN-primary architecture APP, the first screen can be directly replaced with Native View, completely脱离 RN's rendering process

I've explained the above techniques in detail in my old article ["React Native Performance Optimization Guide"](https://supercodepower.com/react_native_performance_optimization_guides), so I won't elaborate here.

### Fabric

From the above, you can see that React Native's rendering needs to pass large amounts of JSON data over the Bridge. During React Native initialization, excessive data volume can block the bridge, slowing down our startup and rendering speed. Fabric in React Native's new architecture can solve this problem. JS and Native UI are no longer asynchronous communications but can achieve direct calls, greatly accelerating rendering performance.

Fabric can be said to be the most anticipated part of RN's new architecture. If you want to learn more, you can go to [official issues area: React Native Fabric (UI-Layer Re-architecture)](https://github.com/react-native-community/discussions-and-proposals/issues/4) to follow along.

:::info 2022-01-19 update
React Native's official website has a new [architecture column](https://reactnative.dev/docs/architecture-overview) that very detailedly explains how [Fabric architecture](https://reactnative.dev/docs/fabric-renderer) works. Interested people can go check it out
:::

## Summary

This article mainly analyzes the characteristics and role of the Hermes engine from a **JavaScript** perspective, summarizes and analyzes various optimization methods for JSBundle, and combines network and rendering optimization to comprehensively improve the startup speed of React Native applications.

### RN Performance Optimization Series Table of Contents:

- [🎨 React Native Performance Optimization—Render Part](https://supercodepower.com/react_native_performance_optimization_guides)
- [⚡️ React Native Startup Speed Optimization—Native Part](https://supercodepower.com/react-native-performance-native)
- [⚡️ React Native Startup Speed Optimization—JS Part](https://supercodepower.com/react-native-performance-js)

## References

[🤔 Which Mobile JS Engine is the Best?](https://supercodepower.com/mobile-javascript-engines)

[China Securities React Native Hot Update Optimization Practice](https://juejin.cn/post/6844904184542822408)

[How to Implement Bundle Splitting in React Native?](https://time.geekbang.org/dailylesson/detail/100056862)

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