---
slug: what-can-cdp-do-in-browser-use
title: 🦾 [浏览器自动化] 可为与不可为：CDP 视角下的 Browser 控制边界
authors: skychx
description: CDP 是有能力边界的，所以说知道它擅长什么不擅长什么，对于架构的整体设计和未来演化方向有很大的意义。
tags: [CDP, AI Agent, Chrome DevTools]
---

import { HeroImage } from '../src/components/heroImage';

<HeroImage name="cdp-browser-use-hero.jpg" w={1920} h={744} />

如果我们把人类对电脑的所有操作记为全集，那么 Browser, CDP 和 puppeteer 可操作的集合范畴如下：

- **Computer**：所有操作的全集
- **Browser**：App 层权限，Browser 为了安全，还限制了许多能力，比如说直接操作本地的文件
- **CDP**：专注于 Debug 能力，浏览器的非调试信息（比如说收藏网页）是没有权限访问的
- **puppeteer**：基于 CDP 构建，但是有一部分 CDP API 并没有用到，所以能力属于 CDP 的子集

在 Browser-Use 场景，不同于 VNC 这种更为通用的投屏方案，CDP 是有能力边界的，所以说知道它擅长什么不擅长什么，对于架构的整体设计和未来演化方向有很大的意义。

{/* truncate */}

下面主要是从浏览器角度出发，列出 CDP(puppeteer) 可以做到的事情，支持难度分类如下：

- **直接支持**：pptr 有封装好的现成的 API
- **间接支持**：需要组合多个 pptr API/CDP API 实现相关功能
- **不能支持**：CDP 完全做不到的事情

<br/>

## 一、浏览器功能

这部分主要指浏览器级别的全局功能。包括 tabs 管理，页面导航等功能。

### Tabs

- **必要性**：高
- **支持度**：间接支持
- **pptr API**：[Browser.newPage()](https://pptr.dev/api/puppeteer.browser.newpage), [Browser.pages()](https://pptr.dev/api/puppeteer.browser.pages), [Page.bringToFront()](https://pptr.dev/api/puppeteer.page.bringtofront), [Page.close()](https://pptr.dev/api/puppeteer.page.close)
  

Tabs（标签页）是非常重要的一个功能，CDP 的 tabs 相关 API 能力比较弱，puppeteer 也没有做相关的抽象和封装。这就导致想实现 tab 的「新建/更新/切换/关闭」这 4 个基础的功能需要组合多个 CDP API 间接实现。

![tabs](https://image-1255652541.file.myqcloud.com/uPic/0-cdp-do-tabs.png)
<br/>

还有个问题如果 Tabs 被人拖拽改变了显示顺序，这部分改变 CDP 是无法感知的。比如说上面图的 tabs 是拖拽过的，但是 CDP 直接拿到的顺序是：`历史记录，百度一下，你就知道，今日头条`，不过这种问题可以忽略。

<br/>

### Navigate

- **必要性**：高
- **支持度**：直接支持
- **pptr API**：[Page.goBack()](https://pptr.dev/api/puppeteer.page.goback), [Page.goForward()](https://pptr.dev/api/puppeteer.page.goforward), [Page.reload()](https://pptr.dev/api/puppeteer.page.reload), [Page.goto()](https://pptr.dev/api/puppeteer.page.goto)

![navigate](https://image-1255652541.file.myqcloud.com/uPic/1-cdp-do-navigate.png)
Navigate 主要是 Tab 内部导航，包括 back/forward/refresh/goto 4 个最基础的功能。

这部分功能 puppeteer 基于 CDP 的 [Page.getNavigationHistory](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-getNavigationHistory) 和 [Page.navigateToHistoryEntry](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-navigateToHistoryEntry) API 做了良好的封装，基本上可以直接拿来使用。

但值得注意的是输入框的联想记录是无法通过 CDP 获取：

![search](https://image-1255652541.file.myqcloud.com/uPic/2-cdp-do-search.png)

<br/>

### 扩展程序（浏览器插件）

- **必要性**：中
- **支持度**：直接支持
- **pptr API**：[Chrome Extensions](https://pptr.dev/guides/chrome-extensions)

可以初始化 browser 的时候就通过 pptr API 直接注入插件。插件能力还是比较重要的，比如说 ad-block，可以屏蔽一些广告的 DOM，让网页更干净，方便模型去定位。

<br/>

### 内部设置页

- **必要性**：中
- **支持度**：直接支持
- **pptr API**：[Page.goto()](https://pptr.dev/api/puppeteer.page.goto)

内部设置页我这里定义为 `chrome://` 协议开头的页面，比如说 `chrome://history/` 就是浏览器的历史记录页。这些设置页其实都是以网页为载体的，所以都能被 CDP 捕获到，这些页面有很多，比如还有 `chrome://downloads/` `chrome://extensions/` 等。

换句话说，我们只要知道设置页面的 URI 就可以直接 navigate 过去，这个看整体的诉求，可按需支持。

| History Page | History Page Screenshot |
| :---: | :---: |
| ![history-page](https://image-1255652541.file.myqcloud.com/uPic/3-cdp-do-history-page.png) | ![history-page-screenshot](https://image-1255652541.file.myqcloud.com/uPic/4-cdp-do-history-page-screenshot.png) |

<br/>

### 设置菜单

- **必要性**：低
- **支持度**：不支持

CDP 无法感知，但这种二级菜单三级菜单入口也比较深，主动改动的情况比较少见，而且其导航到的都是 `chrome://` 协议开头的内置网页，拿到对应的 URI 后都可以直接 navigate 过去。

![list](https://image-1255652541.file.myqcloud.com/uPic/5-cdp-do-list.png)

<br/>

### 其它 App 级功能

- **必要性**：低
- **支持度**：不支持

除了上面常见的功能，还有一些较为冷门，或者说不会影响浏览网页主流程的 App 级功能。比如说：

- 登录 Google 账号的弹窗
- 标签页分组
- 阅读模式/阅读清单
- ......

这些都是有可以增强浏览体验，没有也没啥问题的功能。在 AI 场景上，永远是越简单的越健壮，所以这些甜品功能也没必要支持。

| 登录弹窗 | 标签页分组 |
| :---: | :---: |
| ![login](https://image-1255652541.file.myqcloud.com/uPic/6-cdp-do-login.png) | ![group](https://image-1255652541.file.myqcloud.com/uPic/7-cdp-do-group.png) |
|  |  |
| **阅读模式** | **阅读清单** |
| ![read-mode](https://image-1255652541.file.myqcloud.com/uPic/8-cdp-do-read-mode.png) | ![read-list](https://image-1255652541.file.myqcloud.com/uPic/9-cdp-do-read-list.png) |

<br/>

## 二、快捷键

- **必要性**：高
- **支持度**：间接支持
- **pptr API：** [Keyboard class](https://pptr.dev/api/puppeteer.keyboard)

快捷键是一个较为复杂的问题。

几大操作系统发展了几十年，虽然用的都是同一款键盘，但在快捷键上加入了一堆自己的小心思，所以各操作系统的快捷键本身就有很高的复杂度；CDP 场景下的快捷键，在 macOS 下也需要单独的适配。下面我就这两个方向展开说说。

### 跨平台角度

跨平台角度看，Windows 和 Linux 的常用快捷键还是比较统一的，但是 macOS 就比较特殊。

首先是对于大部份常用快捷键（全选/复制/黏贴 等），在 Mac 上使用的装饰键是 Command（即 `Meta` 键），但在 Windows/Linux 上为 Ctrl（即 `Control` 键）。

所以当 LLM 发出一个快捷键的 action 指令时，比如说「全选」快捷键，在工程这端需要做一下兜底，先判断当前运行环境的具体 OS，然后需要把 action 指令做修改以让指令正确的执行：

```JavaScript
hotkey("ctrl+A") --> isMacOS? --- true ---> keyboard('Meta+KeyA')
                         └------- false --> keyboard('Control+KeyA')
```

除了这类常见的快捷键，其实还有很多的情况需要去适配。比如说：

- 查看浏览器历史记录：macOS 是 `Command+Y`，Linux 和 Windows 是 `Ctrl+H`
- 退出浏览器：macOS 是 `Command+Q`，Linux 和 Windows 是 `Alt+F`，然后按 `X` 键
- 导航到上个页面：macOS 是 `Command+[`，Linux 和 Windows 是 `Alt+LeftArrow`
- ......

<br/>

相关的快捷键可以参考官方给的规范：

| 平台        | 支持的快捷键                                                                                                   |
| :---------- | :------------------------------------------------------------------------------------------------------------- |
| macOS       | https://support.apple.com/zh-cn/102650                                                                         |
| Windows     | https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec |
| Linux GNOME | https://help.gnome.org/users/gnome-help/stable/shell-keyboard-shortcuts.html.en                                |
| Chrome      | https://support.google.com/chrome/answer/157179?hl=zh-Hans&co=GENIE.Platform%3DDesktop                         |

这些都很繁琐，除了交给 AI 来写，最好的方式还是只提供基础的适配，然后遇到啥修啥，要不然就是个无底洞。

<br/>

### CDP 角度

CDP 因为权限问题，通过它发送的键盘指令，并不是真正的系统键盘指令，可以简单理解为作用域限制在 Chrome 和 Page 内部。而且，我们的 macOS **又出幺蛾子了**。

首先说最基础的「全选」快捷键。在 macOS 上如果你直接发送 `Meta+KeyA`，你会发现根本不会执行全选操作。

```JavaScript
await page.keyboard.down("Meta");
await page.keyboard.down("KeyA");
await page.keyboard.up("KeyA");
await page.keyboard.up("Meta"); // not working in macOS
```

具体原因比较复杂，可以参考 [#776](https://github.com/puppeteer/puppeteer/issues/776) 和 [#1313](https://github.com/puppeteer/puppeteer/issues/1313)，核心原因如下：

> The first bug here is that we **don't** send nativeKeyCodes, so no real OSX events get made. When sending the nativeKeyCodes, "a" is keyCode 0 and protocol decides not to send a falsey keyCode. After these are fixed, OSX **doesn't** like to perform keyboard shortcuts unless the application has the foreground. And lastly, if Chromium has the foreground, we send the nativeKeyCode, and protocol processes it, the shortcut gets captured by the address bar **instead of** the page. 
> 
> https://github.com/puppeteer/puppeteer/issues/776#issuecomment-329589760

可以看到回复在 2017 年，快 10 年了这个问题其实还存在。

<br/>

不过好在对于「全选/复制/粘贴」这些常见的快捷键，CDP 有些别的曲线救国方案。CDP 发送键盘指令的 [Input.dispatchKeyEvent](https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchKeyEvent)，有个额外的 commands 指令，上面有一些[编辑指令](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/editing/commands/editor_command_names.h)可以触发相关的操作，比如说我想执行「全选」操作，我就可以这样写：

```JavaScript
await page.keyboard.down("KeyA", { commands: ["SelectAll"] });
await page.keyboard.up("KeyA"); // working in macOS
```

<br/>

这样下面这些常见的编辑类快捷键就可以支持了：

| 操作 | macOS               | Windows/Linux | CDP commands |
| :--- | :------------------ | :------------ | :----------- |
| 复制 | Command + C         | Ctrl + C      | Copy         |
| 粘贴 | Command + V         | Ctrl + V      | Paste        |
| 剪切 | Command + X         | Ctrl + X      | Cut          |
| 撤销 | Command + Z         | Ctrl + Z      | Undo         |
| 恢复 | Shift + Command + Z | Ctrl + Y      | Redo         |
| 全选 | Command + A         | Ctrl + A      | SelectAll    |

<br/>

对于一些其他的权限较高的快捷键，我们可以可以做好**功能映射**：

- 查看浏览器历史记录：`Page.goto('chrome://history/')`
- 退出浏览器：`Browser.close()`
- 导航到上个页面：`Page.goBack()`
- ......

当然这些也最好按需添加，全适配意义不大。

<br/>

## 三、网页功能

主要指对网页本身的做的操作，影响范围主要为当前网页，有截图，文件上传下载等功能。

### 截图

- **必要性**：高
- **支持度**：直接支持

CDP 的 [Page.captureScreenshot](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot) API 可以直接对网页内容本身做截图。但需要注意的是，CDP 截图只能截到网页本身（也就是**绿框**内的内容），外部的 Chrome UI 是截图不到的。

所以这里需要格外注意，部分 VLM 模型在训练阶段是用的完整的 Chrome 截图（**红框**内的内容），如果泛化能力一般，直接把 CDP 截图传给 VLM，可能会有 action 坐标错位的问题。

![screenshot](https://image-1255652541.file.myqcloud.com/uPic/10-cdp-do-screenshot.png)

### 基础交互

- **必要性**：高
- **支持度**：间接支持
- **pptr API：** [Keyboard class](https://pptr.dev/api/puppeteer.keyboard), [Mouse class](https://pptr.dev/api/puppeteer.mouse)

这里的基础操作主要是指 click，drag，keyboard 等行为，这些 puppeteer 做好了原子方法，可以直接组合使用。而且 pptr 也提供了各种 DOM 回调去执行相关的 action 操作，还是非常灵活的。这里推荐直接看 pptr 的文档：[pptr: Page Interactions](https://pptr.dev/guides/page-interactions)，还是描述的比较清晰的。

<br/>

### Dialog 弹窗

- **必要性**：高
- **支持度**：间接支持
- **pptr API：** [Dialog class](https://pptr.dev/api/puppeteer.dialog)

CDP 可以直接感知到弹窗的相关事件（例如 [Page.javascriptDialogOpening](https://chromedevtools.github.io/devtools-protocol/tot/Page/#event-javascriptDialogOpening)），所以下方的 4 类弹窗的触发都是可以感知到的：
| Alert | Confirm |
| :---: | :---: |
| ![alert](https://image-1255652541.file.myqcloud.com/uPic/11-cdp-do-alert.png) | ![confirm](https://image-1255652541.file.myqcloud.com/uPic/12-cdp-do-confirm.png) |
|  |  |
| **Prompt** | **Beforeunload** |
| ![dialog](https://image-1255652541.file.myqcloud.com/uPic/13-cdp-do-dialog.png) | ![beforeunload](https://image-1255652541.file.myqcloud.com/uPic/14-cdp-do-beforeunload.png) |

因为弹窗是一个优先级很高的浏览器行为，它一旦唤起基本会中断网页的所有行为，JS 引擎也会挂起停止响应，所以必须得响应关闭弹窗才能执行后续流程，综合来看是一个非常高优的功能。

<br/>

### 右键菜单

- **必要性**：低
- **支持度**：间接支持

CDP 无法感知到在页面内点击「鼠标右键」后触发的 **系统菜单** 本身：

| Page | Image | Link | Tab |
| :---: | :---: | :---: | :---: |
| ![page-right-button](https://image-1255652541.file.myqcloud.com/uPic/15-cdp-do-page-right-button.png) | ![link-right-button](https://image-1255652541.file.myqcloud.com/uPic/16-cdp-do-link-right-button.png) | ![17-cdp-do-image-right-button](https://image-1255652541.file.myqcloud.com/uPic/17-cdp-do-image-right-button.png) | ![tab-right-button](https://image-1255652541.file.myqcloud.com/uPic/18-cdp-do-tab-right-button.png) |

但系统弹窗内的功能基本可以通过其他方式实现，比如说「返回/前进/重新加载」等功能都可以用一些 Navigate 的方法做平替。但就目前的用户诉求看，这部分功能的必要性并不高。

<br/>

对于网页内**自定义的右键菜单**，因为基本都是 DOM 绘制的，其实可以通过网页内截图感知到的，例如下图中 bilibili 播放器的右键 DOM 菜单就可以被 CDP 截图捕获：

![custom-right-button](https://image-1255652541.file.myqcloud.com/uPic/19--cdp-do-custom-right-button.png)

<br/>

### Input 选择器

- **必要性**：高
- **支持度**：间接支持

HTML 的大部分表单功能都是支持的，但是部分 Input 选择器使用了系统控件（例如 HTML 默认的 Select 选择器，日期选选择器），导致 CDP 截图无法感知到。

目前测试下来有这些选择器都是无法被 CDP Screenshot 所捕获的：

| Select | Date | Time | Color |
| :---: | :---: | :---: | :---: |
| ![select](https://image-1255652541.file.myqcloud.com/uPic/20-cdp-do-select.png) | ![date](https://image-1255652541.file.myqcloud.com/uPic/21-cdp-do-date.png) | ![time](https://image-1255652541.file.myqcloud.com/uPic/22-cdp-do-time.png) | ![23-cdp-do-link-color](https://image-1255652541.file.myqcloud.com/uPic/23-cdp-do-link-color.png) |

但是也不是没有迂回的办法，我们可以尝试使用 JS 代码注入替换掉现有的系统控件为 DOM 控件，间接的实现被截图的诉求。例如 Select Option Picker，替换后的效果如下：

![select-dom](https://image-1255652541.file.myqcloud.com/uPic/24-cdp-do-select-dom.png)

<br/>

### 文件上传/下载

- **必要性**：高
- **支持度**：直接支持
- **pptr API：** [ElementHandle.uploadFile()](https://pptr.dev/api/puppeteer.elementhandle.uploadfile), [FileChooser class](https://pptr.dev/api/puppeteer.filechooser), [DownloadBehavior](https://pptr.dev/api/puppeteer.downloadbehavior)
  

pptr 上执行文件的逻辑较为完善，结合 uploadFile API 和 FileChooser 都可以做较好的文件上传支持。但是在文件下载上并没有提供非常好的 API，用户可以操作的就是通过 DownloadBehavior 去指定下载策略和下载路径。

<br/>

### 打印

- **必要性**：中
- **支持度**：直接支持
- **pptr API**：[Page.pdf()](https://pptr.dev/api/puppeteer.page.pdf)

这个也是现成的 API，直接调用即可。

<br/>

### 其它 Page 级功能

- **必要性**：低
- **支持度**：不支持

除了上述的各种高频功能，浏览器还有一些甜品级小功能，但从个人角度和用户诉求上看，这些功能在 Browser-Use 场景基本上用不到，而且这些功能 CDP 也基本不支持，但为了本文的内容完整性还是列出来：

- 书签
- 翻译
- 搜索
- 二维码
- ......

| 书签 | 翻译 |
| :---: | :---: |
| ![mark](https://image-1255652541.file.myqcloud.com/uPic/25-cdp-do-mark.png) | ![trans](https://image-1255652541.file.myqcloud.com/uPic/26-cdp-do-trans.png) |
| | |
| **搜索** | **二维码** |
| ![search](https://image-1255652541.file.myqcloud.com/uPic/27-cdp-do-search.png) | ![qrcode](https://image-1255652541.file.myqcloud.com/uPic/28-cdp-do-qrcode.png) |

## 总结

综上所述，我们可以看到 CDP 还是有明显的能力边界，但是已经足够支持 95% 的业务功能了。最重要的是把相关的功能打磨好，才能最大程度的放大 AI 的能力。