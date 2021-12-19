---
slug: react-native-performance-js
title: ⚡️ React Native 启动速度优化——JS 篇
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 从 React Native 的启动到页面的第一次渲染完成，结合 React Native 的源码和 1.0 的新架构，一一分析 React Native 的启动性能优化之路
draft: false
tags: [react native, 跨端开发, 性能优化]
---

## 前言

[上一篇文章](https://supercodepower.com/react-native-performance-native)主要从 Native 的角度分析了 React Native 的初始化流程，并从源码出发，总结了几个 React Native 容器初始化的优化点。本文主要从 JavaScript 入手，总结了一些 JS 侧的优化要点。

<!--truncate-->

## 1.JSEngine

![rn_start_jsEngine](https://image-1255652541.file.myqcloud.com/uPic/rn_start_jsEngine.jpg)

### Hermes

Hermes 是 FaceBook 2019 年中旬开源的一款 JS 引擎，从 [release](https://github.com/facebook/hermes/releases) 记录可以看出，这个是专为 React Native 打造的 JS 引擎，可以说从设计之初就是为 Hybrid UI 系统打造。

Hermes **支持直接加载字节码**，也就是说，`Babel`、`Minify`、`Parse` 和 `Compile` 这些流程全部都在开发者电脑上完成，直接下发字节码让 Hermes 运行就行，这样做可以**省去 JSEngine 解析编译 JavaScript 的流程**，JS 代码的加载速度将会大大加快，启动速度也会有非常大的提升。

![Hermes](https://image-1255652541.file.myqcloud.com/uPic/Hermes.gif)

更多关于 Hermes 的特性，大家可以看我的旧文[《移动端 JS 引擎哪家强》](https://supercodepower.com/mobile-javascript-engines#3hermes)这篇文章，我做了更为详细的特性说明与数据对比，这里就不多说了。



## 2.JS Bundle

![rn_start_jsBundle](https://image-1255652541.file.myqcloud.com/uPic/rn_start_jsBundle.jpg)

前面的优化其实都是 Native 层的优化，从这里开始就进入 Web 前端最熟悉的领域了。

其实谈到 JS Bundle 的优化，来来回回就是那么几条路：

- **缩**：缩小 Bundle 的总体积，减少 JS 加载和解析的时间
- **延**：动态导入（dynamic import），懒加载，按需加载，延迟执行
- **拆**：拆分公共模块和业务模块，避免公共模块重复引入

如果有 webpack 打包优化经验的小伙伴，看到上面的优化方式，是不是脑海中已经浮现出 webpack 的一些配置项了？不过 React Native 的打包工具不是 webpack 而是 Facebook 自研的 [Metro](https://facebook.github.io/metro/)，虽然配置细节不一样，但道理是相通的，下面我就这几个点讲讲 React Native 如何优化 JS Bundle。



### 2.1 减小 JS Bundle 体积

Metro 打包 JS 时，会把 ESM 模块转为 CommonJS 模块，这就导致现在比较火的依赖于 ESM 的 Tree Shaking 完全不起作用，而且根据[官方回复](https://github.com/facebook/metro/issues/227#issuecomment-583358386)，Metro 未来也不会支持 Tree Shaking ：

![（Tree Shaking 太 low 了，我们做了个更酷的 Hermes）](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-05_10-36-13.jpg)

因为这个原因，我们减小 bundle 体积主要是三个方向：

- 对于同样的功能，优先选择体积更小的第三方库
- 利用 babel 插件，避免全量引用
- 制定编码规范，减少重复代码

下面我们举几个例子来解释上面的三个思路。



#### 2.1.0 使用 react-native-bundle-visualizer 查看包体积

优化 bundle 文件前，一定要知道 bundle 里有些什么，最好的方式就是用可视化的方式把所有的依赖包列出来。web 开发中，可以借助 Webpack 的 `webpack-bundle-analyzer` 插件查看 bundle 的依赖大小分布，React Native 也有类似的工具，可以借助 [`react-native-bundle-visualizer`](https://github.com/IjzerenHein/react-native-bundle-visualizer) 查看依赖关系：

![Xnip2021-04-15_20-36-59](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_20-36-59.jpg)

使用非常简单，按照文档安装分析就可。

<br />

#### 2.1.1 moment.js 替换为 day.js

这是一个非常经典的例子。同样是时间格式化的第三方库， [moment.js](https://github.com/moment/moment) 体积 200 KB，[day.js](https://github.com/iamkun/dayjs) 体积只有 2KB，而且 API 与 moment.js 保持一致。如果项目里用了 moment.js，替换为 day.js 后可以立马减少 JSBundle 的体积。

<br />

#### 2.1.2 lodah.js 配合 babel-plugin-lodash

lodash 基本上属于 Web 前端的工程标配了，但是对于大多数人来说，对于 lodash 封装的近 300 个函数，只会用常用的几个，例如 `get`、 `chunk`，为了这几个函数全量引用还是有些浪费的。

社区上面对这种场景，当然也有优化方案，比如说 `lodash-es`，以 ESM 的形式导出函数，再借助 Webpack 等工具的 Tree Sharking 优化，就可以只保留引用的文件。但是就如前面所说，React Native 的打包工具 Metro 不支持 Tree Shaking，所以对于  `lodash-es` 文件，其实还会全量引入，而且 `lodash-es` 的全量文件比 `lodash` 要大得多。

我做了个简单的测试，对于一个刚刚初始化的 React Native 应用，全量引入 lodash 后，包体积增大了 71.23KB，全量引入 `lodash-es` 后，包体积会扩大 173.85KB。

既然 `lodash-es` 不适合在 RN 中用，我们就只能在 `lodash` 上想办法了。lodash 其实还有一种用法，那就是直接引用单文件，例如想用 `join` 这个方法，我们可以这样引用：

```javascript
// 全量
import { join } from 'lodash'

// 单文件引用
import join from 'lodash/join'
```

这样打包的时候就会只打包 `lodash/join` 这一个文件。

但是这样做还是太麻烦了，比如说我们要使用 lodash 的七八个方法，那我们就要分别 import 七八次，非常的繁琐。对于 lodash 这么热门的工具库，社区上肯定有高人安排好了，[`babel-plugin-lodash`](https://github.com/lodash/babel-plugin-lodash) 这个 babel 插件，可以在 JS 编译时操作 AST 做如下的自动转换：

```javascript
import { join, chunk } from 'lodash'
// ⬇️
import join from 'lodash/join'
import chunk from 'lodash/chunk'
```

使用方式也很简单，首先运行 `yarn add babel-plugin-lodash -D` 安装，然后在 `babel.config.js` 文件里启用插件即可：

```javascript
// babel.config.js

module.exports = {
  plugins: ['lodash'],
  presets: ['module:metro-react-native-babel-preset'],
};
```



我以 join 这个方法为例，大家可以看一下各个方法**增加**的 JS Bundle 体积：

| 全量 lodash | 全量 loads-es | lodash/join 单文件引用 | lodash + babel-plugin-lodash |
| ----------- | ------------- | ---------------------- | ---------------------------- |
| 71.23 KB    | 173.85 KB     | 119 Bytes              | 119 Bytes                    |

从表格可见 `lodash` 配合 `babel-plugin-lodash` 是最优的开发选择。

<br />

#### 2.1.3 babel-plugin-import 的使用

`babel-plugin-lodash` 只能转换 `lodash` 的引用问题，其实社区还有一个非常实用的 babel 插件：[`babel-plugin-import`](https://github.com/ant-design/babel-plugin-import)，**基本上它可以解决所有按需引用的问题**。

我举个简单的例子，阿里有个很好用的 [ahooks](https://ahooks.js.org/) 开源库，封装了很多常用的 React hooks，但问题是这个库是针对 Web 平台封装的，比如说 `useTitle` 这个 hook，是用来设置网页标题的，但是 React Native 平台是没有相关的 BOM API 的，所以这个 hooks 完全没有必要引入，RN 也永远用不到这个 API。

这时候我们就可以用 `babel-plugin-import` 实现按需引用了，假设我们只要用到 `useInterval` 这个 Hooks，我们现在业务代码中引入：

```javascript
import { useInterval } from 'ahooks'
```

然后运行 `yarn add babel-plugin-import -D `  安装插件，在 `babel.config.js` 文件里启用插件：

```javascript
// babel.config.js

module.exports = {
  plugins: [
    [
      'import',
      {
        libraryName: 'ahooks',
        camel2DashComponentName: false, // 是否需要驼峰转短线
        camel2UnderlineComponentName: false, // 是否需要驼峰转下划线
      },
    ],
  ],
  presets: ['module:metro-react-native-babel-preset'],
};
```

启用后就可以实现 ahooks 的按需引入：

```javascript
import { useInterval } from 'ahooks'
// ⬇️
import useInterval from 'ahooks/lib/useInterval'
```

下面是各种情况下的 JSBundle **体积增量**，综合来看 `babel-plugin-import` 是最优的选择：

| 全量 ahooks | ahooks/lib/useInterval 单文件引用 | ahooks + babel-plugin-import |
| ----------- | --------------------------------- | ---------------------------- |
| 111.41 KiB  | 443 Bytes                         | 443 Bytes                    |



当然，`babel-plugin-import` 可以作用于很多的库文件，比如说内部/第三方封装的 UI 组件，基本上都可以通过`babel-plugin-import` 的配置项实现按需引入。若有需求，可以看网上其他人总结的使用经验，我这里就不多言了。

<br />

#### 2.1.4 babel-plugin-transform-remove-console

移除 console 的 babel 插件也很有用，我们可以配置它在打包发布的时候移除 `console` 语句，减小包体积的同时还会加快 JS 运行速度，我们只要安装后再简单的配置一下就好了：

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

#### 2.1.5 制定良好的编码规范

编码规范的最佳实践太多了，为了切合主题（减少代码体积），我就随便举几点：

- **代码的抽象和复用**：代码中重复的逻辑根据可复用程度，尽量抽象为一个方法，不要用一次复制一次
- **删除无效的逻辑**：这个也很常见，随着业务的迭代，很多代码都不会用了，如果某个功能下线了，就直接删掉，哪天要用到再从 git 记录里找
- **删除冗余的样式**：例如引入 [ESLint plugin for React Native](https://github.com/Intellicode/eslint-plugin-react-native/blob/master/README.md)，开启 `"react-native/no-unused-styles"` 选项，借助 ESLint 提示无效的样式文件

说实话这几个优化其实减少不了几 KB 的代码，更大的价值在于**提升项目的健壮性和可维护性**。



### 2.2 Inline Requires

`Inline Requires` 可以理解为**懒执行**，注意我这里说的不是懒加载，因为一般情况下，RN 容器初始化之后会全量加载解析 JS Bundle 文件，`Inline Requires` 的作用是**延迟运行**，也就是说只有需要使用的时候才会执行 JS 代码，而不是启动的时候就执行。React Native 0.64 版本里，默认开启了 `Inline Requires` 。

首先我们要在 `metro.config.js` 里确认开启了 `Inline Requires` 功能：

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



其实 `Inline Requires` 的原理非常简单，就是把 require 导入的位置改变了一下。

比如说我们写了个工具函数 `join` 放在 `utils.js` 文件里：

```javascript
// utils.js

export function join(list, j) {
  return list.join(j);
}
```

然后我们在 `App.js` 里 import 这个库：

```javascript
// App.js

import { join } from 'my-module';

const App = (props) => {
  const result = join(['a', 'b', 'c'], '~');

  return <Text>{result}</Text>;
};
```

上面的写法，被 `Metro` 编译后，**相当于**编译成下面的样子（文件顶层导入转化为使用位置处导入）：

```javascript
const App = (props) => {
  const result = require('./utils').join(['a', 'b', 'c'], '~');

  return <Text>{result}</Text>;
};
```

实际编译后的代码其实长这个样子：

![rn_start_inlineRequire](https://image-1255652541.file.myqcloud.com/uPic/rn_start_inlineRequire.jpg)

上图红线中的 `r()` 函数，其实是 RN 自己封装的 `require()` 函数，可以看出 Metro 自动把顶层的 import 移动到使用的位置。



值得注意的是，Metro 的自动 `Inline Requires` 配置，目前是**不支持** `export default` 导出的，也就是说，如果你的 join 函数是这样写的：

```javascript
export default function join(list, j) {
  return list.join(j);
}
```

导入时是这样的：

```javascript
import join from './utils';

const App = (props) => {
  const result = join(['a', 'b', 'c'], '~');

  return <Text>{result}</Text>;
};
```

Metro 编译转换后的代码，对应的 import **还是处于函数顶层**：

![rn_start_require](https://image-1255652541.file.myqcloud.com/uPic/rn_start_require.jpg)

这个需要特别注意一下，社区也有相关的文章，呼吁大家不要用 `export default` 这个语法，感兴趣的可以了解一下：

[深入解析 ES Module（一）：禁用 export default object](https://zhuanlan.zhihu.com/p/40733281)

[深入解析 ES Module（二）：彻底禁用 default export](https://zhuanlan.zhihu.com/p/97335917)



### 2.3 JSBundle 分包加载

分包的场景一般出现在 Native 为主，React Native 为辅的场景里。这种场景往往是这样的：

- 假设有两条基于 RN 的业务线 A 和 B，它们的 JSBundle 都是动态下发的
- A 的 JSBundle 大小为 700KB，其中包括 600KB 的基础包（React，React Native 的 JS 代码）和 100KB 的业务代码
- A 的 JSBundle 大小为 800KB，其中包括 600KB 的基础包和 200KB 的业务代码
- 每次从 Native 跳转到 A/B 的 RN 容器，都要**全量**下载解析运行

大家从上面的例子里可以看出，600KB 的基础包在多条业务线里是**重复**的，完全没有必要多次下载和加载，这时候一个想法自然而然就出来了：

> 把一些共有库打包到一个 `common.bundle` 文件里，我们每次只要动态下发业务包 `businessA.bundle` 和 `businessB.bundle`，然后在客户端实现先加载 `common.bundle` 文件，再加载  `business.bundle` 文件就可以了



这样做的好处有几个：

- `common.bundle` 可以直接放在本地，省去多业务线的多次下载，**节省流量和带宽**
- 可以在 RN 容器预初始化的时候就加载  `common.bundle` ，**二次加载的业务包体积更小，初始化速度更快**



顺着上面的思路，上面问题就会转换为两个小问题：

- 如何实现 JSBundle 的拆包？
- iOS/Android 的 RN 容器如何实现多 bundle 加载？

<br />

#### 2.3.1 JS Bundle 拆包

拆包之前要先了解一下 Metro 这个打包工具的工作流程。Metro 的打包流程很简单，只有三个步骤：

- **Resolution**：可以简单理解为分析各个模块的依赖关系，最后会生成一个依赖图
- **Transformation**：代码的编译转换，主要是借助 Babel 的编译转换能力
- **Serialization**：所有代码转换完毕后，打印转换后的代码，生成一个或者多个 bundle 文件

从上面流程可以看出，我们的拆包步骤只会在 `Serialization` 这一步。我们只要借助 `Serialization` 暴露的各个方法就可以实现 bundle 分包了。

正式分包前，我们先抛开各种技术细节，把问题简化一下：**对于一个全是数字的数组，如何把它分为偶数数组和奇数数组？**

这个问题太简单了，刚学编程的人应该都能想到答案，遍历一遍原数组，如果当前元素是奇数，就放到奇数数组里，如果是偶数，放偶数数组里。

Metro 对 JS bundle 分包其实是一个道理。Metro 打包的时候，会给每个模块设置 moduleId，这个 id 就是一个从 0 开始的自增 number。我们分包的时候，公有的模块（例如 `react` `react-native`）输出到 `common.bundle`，业务模块输出到 `business.bundle` 就行了。

因为要兼顾多条业务线，现在业内主流的分包方案是这样的：

**1.**先建立一个 `common.js` 文件，里面引入了所有的公有模块，然后 Metro 以这个 `common.js` 为入口文件，打一个 `common.bundle` 文件，**同时要记录所有的公有模块的 moduleId**

```javascript
// common.js

require('react');
require('react-native');
......
```

**2.**对业务线 A 进行打包，Metro 的打包入口文件就是 A 的项目入口文件。打包过程中要**过滤**掉上一步记录的**公有模块 moduleId**，这样打包结果就只有 A 的业务代码了

```javascript
// indexA.js

import {AppRegistry} from 'react-native';
import BusinessA from './BusinessA';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => BusinessA);
```

**3.**业务线 B C D E...... 打包流程同业务线 A

<br />

上面的思路看起来很美好，但是还是存在一个问题：**每次启动 Metro 打包的时候，moduleId 都是从 0 开始自增，这样会导致不同的 JSBundle ID 重复**。

为了避免 id 重复，目前业内主流的做法是把模块的路径当作 moduleId（因为模块的路径基本上是固定且不冲突的），这样就解决了 id 冲突的问题。Metro 暴露了 `createModuleIdFactory` 这个函数，我们可以在这个函数里覆盖原来的自增 number 逻辑：

```javascript
module.exports = {
  serializer: {
    createModuleIdFactory: function () {
      return function (path) {
        // 根据文件的相对路径构建 ModuleId
        const projectRootPath = __dirname;
        let moduleId = path.substr(projectRootPath.length + 1);
        return moduleId;
      };
    },
  },
};
```

<br />

整合一下第一步的思路，就可以构建出下面的 `metro.common.config.js` 配置文件：

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
        // 根据文件的相对路径构建 ModuleId
        const projectRootPath = __dirname;
        let moduleId = path.substr(projectRootPath.length + 1);
        
        // 把 moduleId 写入 idList.txt 文件，记录公有模块 id
        fs.appendFileSync('./idList.txt', `${moduleId}\n`);
        return moduleId;
      };
    },
  },
};
```

然后运行命令行命令打包即可：

```bash
# 打包平台：android
# 打包配置文件：metro.common.config.js
# 打包入口文件：common.js
# 输出路径：bundle/common.android.bundle

npx react-native bundle --platform android --config metro.common.config.js --dev false --entry-file common.js --bundle-output bundle/common.android.bundle
```

通过以上命令的打包，我们可以看到 moduleId 都转换为了相对路径，并且 `idList.txt` 也记录了所有的 moduleId：

![common.android.bundle](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_22-20-28.jpg)

![idList.js](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_22-20-49.jpg)

<br />

第二步的关键在于过滤公有模块的 moduleId，Metro 提供了 `processModuleFilter` 这个方法，借助它可以实现模块的过滤。具体的逻辑可见以下代码：

```javascript
// metro.business.config.js

const fs = require('fs');

// 读取 idList.txt，转换为数组
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
      // createModuleId 的逻辑和 metro.common.config.js 完全一样
      return createModuleId;
    },
    processModuleFilter: function (modules) {
      const mouduleId = createModuleId(modules.path);
      
      // 通过 mouduleId 过滤在 common.bundle 里的数据
      if (idList.indexOf(mouduleId) < 0) {
        console.log('createModuleIdFactory path', mouduleId);
        return true;
      }
      return false;
    },
  },
};
```



最后运行命令行命令打包即可：

```bash
# 打包平台：android
# 打包配置文件：metro.business.config.js
# 打包入口文件：index.js
# 输出路径：bundle/business.android.bundle

npx react-native bundle --platform android --config metro.business.config.js --dev false --entry-file index.js --bundle-output bundle/business.android.bundle
```

最后的打包结果只有 11 行（不分包的话得 398 行），可以看出分包的收益非常大。

![business.android.bundle](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-04-15_22-34-24.jpg)

当然使用相对路径作为 moduleId 打包时，不可避免的会导致包体积变大，我们可以使用 md5 计算一下相对路径，然后取前几位作为最后的 moduleId；或者还是采用递增 id，只不过使用更复杂的映射算法来保证 moduleId 的唯一性和稳定性。这部分的内容其实属于非常经典的 **Map key 设计问题**，感兴趣的读者可以了解学习一下相关的算法理论知识。

<br />

#### 2.3.2 Native 实现多 bundle 加载

分包只是第一步，想要展示完整正确的 RN 界面，还需要做到「合」，这个「合」就是指在 Native 端实现多 bundle 的加载。

`common.bundle` 的加载比较容易，直接在 RN 容器初始化的时候加载就好了。容器初始化的流程上一节我已经详细介绍了，这里就不多言了。这时候问题就转换为 `business.bundle` 的加载问题。

React Native 不像浏览器的多 bundle 加载，直接动态生成一个 `<script />` 标签插入 HTML 中就可以实现动态加载了。我们需要结合具体的 RN 容器实现来实现 `business.bundle` 加载的需求。这时候我们需要关注两个点：

1. **时机**：什么时候开始加载？
2. **方法**：如何加载新的 bundle？

<br />

对于第一个问题，我们的答案是 `common.bundle` 加载完成后再加载 `business.bundle`。

`common.bundle` 加载完成后，iOS 端会发送事件名称是 `RCTJavaScriptDidLoadNotification` 的全局通知，Android 端则会向 ReactInstanceManager 实例中注册的所有 ReactInstanceEventListener 回调 `onReactContextInitialized()` 方法。我们在对应事件监听器和回调中实现业务包的加载即可。

<br />

对于第二个问题，iOS 我们可以使用 RCTCxxBridge 的 `executeSourceCode` 方法在当前的 RN 实例上下文中执行一段 JS 代码，以此来达到增量加载的目的。不过值得注意的是，`executeSourceCode` 是 RCTCxxBridge 的私有方法，需要我们用 Category 将其暴露出来。

Android 端可以使用刚刚建立好的 ReactInstanceManager 实例，通过 `getCurrentReactContext()` 获取到当前的 ReactContext 上下文对象，再调用上下文对象的 `getCatalystInstance()` 方法获取媒介实例，最终调用媒介实例的 `loadScriptFromFile(String fileName, String sourceURL, boolean loadSynchronously)` 方法完成业务 JSBundle 的增量加载。

iOS 和 Android 的示例代码如下：

```objectivec
NSURL *businessBundleURI = // 业务包 URI
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

本小节的示例代码都属于 demo 级别，如果想要真正接入生产环境，需要结合实际的架构和业务场景做定制。有一个 React Native 分包仓库 [react-native-multibundler](https://github.com/smallnew/react-native-multibundler) 内容挺不错的，大家可以参考学习一下。


## 3.Network

![rn_start_network](https://image-1255652541.file.myqcloud.com/uPic/rn_start_network.jpg)

我们一般会在 React Component 的 `componentDidMount()` 执行后请求网络，从服务器获取数据，然后再改变 Component 的 state 进行数据的渲染。

网络优化是一个非常庞大非常独立的话题，有非常多的点可以优化，我这里列举几个和首屏加载相关的网络优化点：

- **DNS 缓存**：提前缓存 IP 地址，跳过 DNS 寻址时间
- **缓存复用**：进入 RN 页面前，先提前请求网络数据并缓存下来，打开 RN 页面后请求网络前先检查缓存数据，如果缓存未过期，直接从本地缓存里拿数据
- **请求合并**：如果还在用 HTTP/1.1，若首屏有多个请求，可以合并多个请求为一个请求
- **HTTP2**：利用 HTTP2 的并行请求和多路复用优化速度
- **减小体积**：去除接口的冗余字段，减少图片资源的体积等等
- ......

由于网络这里相对来说比较独立，iOS/Android/Web 的优化经验其实都可以用到 RN 上，这里按照大家以往的优化经验来就可以了。



## 4.Render

![rn_start_render](https://image-1255652541.file.myqcloud.com/uPic/rn_start_render.jpg)

**渲染这里的耗时，基本上和首屏页面的 UI 复杂度成正相关**。可以通过渲染流程查看哪里会出现耗时：

- **VDOM 计算**：页面复杂度越高，JavaScript 侧的计算耗时就会越长（VDOM 的生成与 Diff）
- **JS Native 通讯**：JS 的计算结果会转为 JSON 通过 Bridge 传递给 Native 侧，复杂度越高，JSON 的数据量越大，有可能阻塞 Bridge 通讯
- **Native 渲染**：Native 侧递归解析 render tree，布局越复杂，渲染时间越长



我们可以在代码里开启 `MessageQueue` 监视，看看 APP 启动后 JS Bridge 上面有有些啥：

```javascript
// index.js

import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue'
MessageQueue.spy(true);
```

![rn_start_MessageQueue](https://image-1255652541.file.myqcloud.com/uPic/rn_start_MessageQueue.jpg)

从图片里可以看出 JS 加载完毕后有大量和 UI 相关的 `UIManager.createView()`  `UIManager.setChildren()` 通讯，结合上面的耗时总结，我们对应着就有几条解决方案：

- 通过一定的布局技巧降低 UI 嵌套层级，降低 UI 视图的复杂度
- 减少 re-render，直接在 JS 侧截断重绘流程，减少 bridge 通讯的频率和数据量
- 如果是 React Native 为主架构的 APP，首屏可以直接替换为 Native View，直接脱离 RN 的渲染流程

上面的这些技巧我都在旧文[《React Native 性能优化指南》](https://supercodepower.com/react_native_performance_optimization_guides)里做了详细的解释，这里就不多解释了。


### Fabric

从上面的我们可以看出，React Native 的渲染需要在 Bridge 上传递大量的 JSON 数据，在 React Native 初始化时，数据量过大会阻塞 bridge，拖慢我们的启动和渲染速度。React Native 新架构中的 Fabric 就能解决这一问题，JS 和 Native UI 不再是异步的通讯，可以实现直接的调用，可以大大加速渲染性能。

Fabric 可以说是 RN 新架构里最让人期待的了，想了解更多内容，可以去[官方 issues 区: React Native Fabric (UI-Layer Re-architecture) ](https://github.com/react-native-community/discussions-and-proposals/issues/4)围观。



## 总结

本文主要从 **JavaScript** 的角度出发，分析了 Hermes 引擎的特点和作用，并总结分析了 JSBundle 的各种优化手段，再结合网络和渲染优化，全方位提升 React Native 应用的启动速度。

### RN 性能优化系列目录：

- [🎨 React Native 性能优化——Render 篇](https://supercodepower.com/react_native_performance_optimization_guides)
- [⚡️ React Native 启动速度优化——Native 篇](https://supercodepower.com/react-native-performance-native)
- [⚡️ React Native 启动速度优化——JS 篇](https://supercodepower.com/react-native-performance-js)


## 参考

[🤔 移动端 JS 引擎哪家强？](https://supercodepower.com/mobile-javascript-engines)

[招商证券 react-native 热更新优化实践](https://juejin.cn/post/6844904184542822408)

[React Native中如何实现拆包？](https://time.geekbang.org/dailylesson/detail/100056862)


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
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::