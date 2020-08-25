---
id: workflow
title: 升级流程
sidebar_label: 升级流程
description: React Native 升级、React Native 0.60 升级、React Native 0.61 升级、React Native 0.62 升级
keywords:
  - React Native 升级
  - React Native 0.60 升级
  - React Native 0.61 升级
  - React Native 0.62 升级
---

RN 版本升级时，我的升级流程一般是这样的：

- 通畅的网络环境，可以自由访问 Google 那种
- 查看[官方博客](https://reactnative.dev/blog/)，获取版本更新的主要内容
- 阅读 RN GitHub 上的 [CHANGELOG](https://github.com/react-native-community/releases/blob/master/CHANGELOG.md)，获取版本更新的具体改动，适配 API 变更
- 阅读第三方 npm 包的 `README.md` 文件，是否需要同步升级
- 使用  [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) 做版本 Diff，并阅读 [upgrading-react-native](https://reactnative.thenativebits.com/courses/upgrade-react-native/) 的相关博文，修改项目配置文件与配置脚本
- 删除 node_modules 与缓存，重新 Build 项目，如果 Build 失败，根据报错信息搜索 or 询问 Native 开发同学
- 回归测试

:::info 提示
在更新过程中，个人建议 git commit 操作要尽量原子化，方便后续复盘和回滚，**小心驶得万年船**
:::

<br />

在我实际升级中，因为 React Native 0.59 到 0.60 有非常大的变动，并且业务较为复杂，升级 0.60 花了两个星期的时间：iOS 一周，Android 一周；0.61 和 0.62 的升级就比较简单了，大概一两个小时就可以升级好。

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::