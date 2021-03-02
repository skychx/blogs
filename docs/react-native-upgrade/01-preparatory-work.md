---
id: preparatory-work
title: 磨刀不误砍柴工
sidebar_label: 磨刀不误砍柴工
description: React Native 升级、React Native 0.60 升级、React Native 0.61 升级、React Native 0.62 升级
keywords:
  - React Native 升级
  - React Native 0.60 升级
  - React Native 0.61 升级
  - React Native 0.62 升级
---

:::info 提示
这部分知识我认为是最重要的，毕竟**版本更新是永恒的，操作流程却是不变的**
:::


<br />

详细介绍各端构建工具前，我们抛开各种技术细节，从整个项目的生命周期出发，看看大部分产品是怎么做技术规划的：

- **产品早期**：架构都比较简单，整个项目拿个**配置文件**做配置就好了，配置文件越简单越好，xml、json 就被拿出来用了
- **产品发展期**：需要配置的地方变多了，这时候**多加几个配置项多加几个参数**，虽然有些繁琐，但静态的配置文件还够用
- **产品成熟期**：人员扩增代码膨胀，静态的配置文件完全不够用了，为了达到动态配置的目的，往往会引入一门**脚本语言**或自创一套 **DSL** 来管理相关配置
- ~~**产品晚期**：一把火烧了另起炉灶（记得删掉）~~



理清一个技术产品的生命周期后，你就会对日常开发中配置文件有了整体的认知：那些又臭又长的配置项，乱七八糟的兼容写法，毫无美感的 DSL，最神奇的是这些七拼八凑的东西还能把项目跑起来，Build 成功的那一刻你一定会对这种人类奇迹发出由衷的敬佩之情——**原来这就叫专业啊**！

<br />

收一收澎湃的情绪，牢记上面的指导经验，我们下面开始讨论技术细节。

<br />

## 1.Web 前端 项目配置

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

## 2.iOS 项目配置

iOS 项目主要有两个点：**project.pbxproj** 和 **CocoaPods**。这两块儿的知识了解后，升级 RN 就完全不虚了。

<br />

### 1⃣️ project.pbxproj 与 Xcode

`project.pbxproj` 就是一个 iOS 项目的**配置文件**，从数据结构特点上有些像 JSON，年龄可以追溯到 NeXT，可读性基本为 0，每次 git 合并都是纯黑的噩梦。不信你瞅瞅下图，这是给人看的吗。

![image-20200825202753481](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200825202753481.png)

可读性这么差的东西能传下来，其实全靠 **XCode** 这个 IDE 给它续命。我们每次在 XCode 里修改的配置，例如 `Build Settings` 等选项，最后都会反映到 `project.pbxproj` 这个配置文件上，也算是一种另类 DSL 了。

`project.pbxproj` 相关的知识我推荐下面几篇文章，阅读后会让你对 iOS 编译打包流程有个更深的了解：

- [iOS 开发 Xcode 中的 project.pbxproj -- 深入剖析](https://blog.csdn.net/kuangdacaikuang/article/details/52987132)：介绍了 `project.pbxproj` 文件的一些特点

- [Xcode 工程文件 project.pbxproj 小结](https://www.jianshu.com/p/e82ec6a56fc2)：看完后会对 XCode 配置和 `project.pbxproj` 文件的对应关系有着更深刻的了解
- [Xcode - Target , PROJECT 区别](https://www.jianshu.com/p/e304247ede59)：介绍了 Xcode 中各个配置项是什么意思
- [XCode Build 过程](https://wiki.jikexueyuan.com/project/objc/Build-tool/6-1.html)

<br />

### 2⃣️ CocoaPods

CocoaPods 是一个负责管理 iOS 项目中第三方开源库的工具，目前主流 iOS 工程都是用 CocoaPods 管理第三方库的。

React Native 在 0.60 里终于用上了 CocoaPods，和 iOS 社区步调一致了起来。这样做的好处就是后续维护和迭代的压力会小很多，鬼知道我以前升级各种 iOS SDK 的日子是怎么熬过来的。

相对 `project.pbxproj`，CocoaPods 无疑简单了不少，写配置脚本的 **Ruby** 语言也比较清爽，Podfile 的可读性要高很多。

```java
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


## 3.Android 项目配置

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


## 4.RN 官方升级助手

React Native 官方在 2019 年 7 月 0.60 大版本更新时，推出了 [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) 这个 Diff 小工具。通过这个工具我们可以方便的看出版本更新时各个配置脚本的改动，非常的方便。

![](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/ob8sym.jpg)


<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::