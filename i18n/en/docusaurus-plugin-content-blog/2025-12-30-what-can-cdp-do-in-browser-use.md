---
slug: what-can-cdp-do-in-browser-use
title: 🦾 [Browser Automation] Possibilities and Limitations：Browser Control Boundaries from a CDP Perspective
authors: skychx
description: CDP has capability boundaries. Understanding what it excels at and what it doesn't is crucial for overall architectural design and future evolution.
tags: [CDP, AI Agent, Chrome DevTools]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="cdp-browser-use-hero.jpg" w={1920} h={744} />

If we consider all human operations on a computer as the universal set, then the operational scope of Computer, Browser, CDP, and puppeteer can be categorized as follows:

- **Computer**: The universal set of all operations
- **Browser**: App-level permissions. Browser restricts many capabilities for security, such as direct access to local files
- **CDP**: Focused on debugging capabilities. Non-debugging information of the browser (such as bookmarked web pages) cannot be accessed
- **puppeteer**: Built on top of CDP, but doesn't utilize all CDP APIs, so its capabilities are a subset of CDP

In Browser-Use scenarios, unlike VNC which is a more general screen casting solution, CDP has capability boundaries. Therefore, understanding its strengths and limitations is significant for overall architectural design and future evolution direction.

{/* truncate */}

Below is primarily from a browser perspective, listing what CDP (puppeteer) can accomplish. Support difficulty is classified as follows:

- **Direct Support**: pptr has ready-made APIs available
- **Indirect Support**: Requires combining multiple pptr APIs/CDP APIs to implement related functionality
- **Cannot Support**: Things CDP is completely incapable of doing

<br/>

## I. Browser Functions

This mainly refers to global browser-level functions, including tabs management, page navigation, etc.

### Tabs

- **Necessity**: High
- **Support Level**: Indirect Support
- **pptr API**: [Browser.newPage()](https://pptr.dev/api/puppeteer.browser.newpage), [Browser.pages()](https://pptr.dev/api/puppeteer.browser.pages), [Page.bringToFront()](https://pptr.dev/api/puppeteer.page.bringtofront), [Page.close()](https://pptr.dev/api/puppeteer.page.close)

Tabs (tag pages) are a very important feature. CDP's tabs-related APIs are quite weak, and puppeteer hasn't provided related abstraction and encapsulation. This means implementing the 4 basic tab functions of "create/update/switch/close" requires combining multiple CDP APIs indirectly.

![tabs](https://image-1255652541.file.myqcloud.com/uPic/0-cdp-do-tabs.png)
<br/>

There's also an issue: if Tabs are dragged to change their display order, CDP cannot perceive these changes. For example, the tabs in the image above have been dragged, but CDP directly gets the order as: "History, Baidu, Today's Headlines". However, this issue can be ignored.

<br/>

### Navigate

- **Necessity**: High
- **Support Level**: Direct Support
- **pptr API**: [Page.goBack()](https://pptr.dev/api/puppeteer.page.goback), [Page.goForward()](https://pptr.dev/api/puppeteer.page.goforward), [Page.reload()](https://pptr.dev/api/puppeteer.page.reload), [Page.goto()](https://pptr.dev/api/puppeteer.page.goto)

![navigate](https://image-1255652541.file.myqcloud.com/uPic/1-cdp-do-navigate.png)
Navigate mainly refers to navigation within a Tab, including the 4 most basic functions: back/forward/refresh/goto.

Puppeteer has provided good encapsulation based on CDP's [Page.getNavigationHistory](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-getNavigationHistory) and [Page.navigateToHistoryEntry](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-navigateToHistoryEntry) APIs, so they can basically be used directly.

However, it's worth noting that the input box's suggestion records cannot be obtained through CDP:

![search](https://image-1255652541.file.myqcloud.com/uPic/2-cdp-do-search.png)

<br/>

### Extensions (Browser Plugins)

- **Necessity**: Medium
- **Support Level**: Direct Support
- **pptr API**: [Chrome Extensions](https://pptr.dev/guides/chrome-extensions)

Plugins can be directly injected during browser initialization through pptr APIs. Plugin capability is quite important, for example ad-block can shield some ad DOMs, making web pages cleaner and easier for models to locate.

<br/>

### Internal Settings Pages

- **Necessity**: Medium
- **Support Level**: Direct Support
- **pptr API**: [Page.goto()](https://pptr.dev/api/puppeteer.page.goto)

Internal settings pages are defined here as pages starting with the `chrome://` protocol. For example, `chrome://history/` is the browser's history page. Since these settings pages are all web-based, they can all be captured by CDP. There are many such pages, like `chrome://downloads/`, `chrome://extensions/`, etc.

In other words, as long as we know the settings page's URI, we can navigate directly there. This depends on overall requirements and can be supported as needed.

| History Page | History Page Screenshot |
| :---: | :---: |
| ![history-page](https://image-1255652541.file.myqcloud.com/uPic/3-cdp-do-history-page.png) | ![history-page-screenshot](https://image-1255652541.file.myqcloud.com/uPic/4-cdp-do-history-page-screenshot.png) |

<br/>

### Settings Menu

- **Necessity**: Low
- **Support Level**: Not Supported

CDP cannot perceive it. However, since the entry points for these secondary and tertiary menus are quite deep, active changes are rare. Moreover, they all navigate to built-in web pages starting with `chrome://` protocol. After obtaining the corresponding URIs, we can navigate directly.

![list](https://image-1255652541.file.myqcloud.com/uPic/5-cdp-do-list.png)

<br/>

### Other App-Level Functions

- **Necessity**: Low
- **Support Level**: Not Supported

Besides the common functions above, there are some relatively obscure App-level functions that won't affect the main web browsing process. For example:

- Login to Google account popup
- Tab groups
- Reading mode/Reading list
- ......

These are all features that can enhance browsing experience but aren't problematic if missing. In AI scenarios, simpler is always more robust, so there's no need to support these dessert features.

| Login Popup | Tab Groups |
| :---: | :---: |
| ![login](https://image-1255652541.file.myqcloud.com/uPic/6-cdp-do-login.png) | ![group](https://image-1255652541.file.myqcloud.com/uPic/7-cdp-do-group.png) |
|  |  |
| **Reading Mode** | **Reading List** |
| ![read-mode](https://image-1255652541.file.myqcloud.com/uPic/8-cdp-do-read-mode.png) | ![read-list](https://image-1255652541.file.myqcloud.com/uPic/9-cdp-do-read-list.png) |

<br/>

## II. Keyboard Shortcuts

- **Necessity**: High
- **Support Level**: Indirect Support
- **pptr API**: [Keyboard class](https://pptr.dev/api/puppeteer.keyboard)

Keyboard shortcuts are a relatively complex issue.

Major operating systems have developed for decades, and although they use the same keyboard, they've added their own considerations to keyboard shortcuts. Thus, keyboard shortcuts across operating systems are inherently complex. In CDP scenarios, keyboard shortcuts on macOS also require separate adaptation. Let me expand on these two directions below.

### Cross-Platform Perspective

From a cross-platform perspective, Windows and Linux common shortcuts are relatively unified, but macOS is quite special.

First, for most common shortcuts (select all/copy/paste, etc.), macOS uses the Command key (i.e., the `Meta` key), while Windows/Linux use Ctrl (i.e., the `Control` key).

Therefore, when the LLM issues a shortcut action command, such as the "select all" shortcut, the engineering end needs to do some fallback: first determine the specific OS of the current runtime environment, then modify the action command to ensure correct execution:

```JavaScript
hotkey("ctrl+A") --> isMacOS? --- true ---> keyboard('Meta+KeyA')
                        └------- false --> keyboard('Control+KeyA')
```

Besides these common shortcuts, there are actually many situations that need adaptation. For example:

- View browser history: macOS is `Command+Y`, Linux and Windows are `Ctrl+H`
- Quit browser: macOS is `Command+Q`, Linux and Windows are `Alt+F`, then press `X` key
- Navigate to previous page: macOS is `Command+[`, Linux and Windows are `Alt+LeftArrow`
- ......

<br/>

For related shortcuts, you can refer to the official specifications:

| Platform   | Supported Shortcuts                                                                                                                            |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| macOS      | https://support.apple.com/zh-cn/102650                                                                                                          |
| Windows    | https://support.microsoft.com/en-us/windows/keyboard-shortcuts-in-windows-dcc61a57-8ff0-cffe-9796-cb9706c75eec                                 |
| Linux GNOME | https://help.gnome.org/users/gnome-help/stable/shell-keyboard-shortcuts.html.en                                                                 |
| Chrome     | https://support.google.com/chrome/answer/157179?hl=zh-Hans&co=GENIE.Platform%3DDesktop                                                           |

These are all quite tedious. Besides leaving them to AI to write, the best approach is to provide only basic adaptation, then fix issues as they arise. Otherwise, it's a bottomless pit.

<br/>

### CDP Perspective

Due to permission issues, keyboard instructions sent through CDP are not true system keyboard instructions. It can be simply understood as the scope being limited to within Chrome and Page. Moreover, our **macOS is acting up again**.

First, let's talk about the most basic "select all" shortcut. On macOS, if you directly send `Meta+KeyA`, you'll find that the select all operation doesn't execute at all.

```JavaScript
await page.keyboard.down("Meta");
await page.keyboard.down("KeyA");
await page.keyboard.up("KeyA");
await page.keyboard.up("Meta"); // not working in macOS
```

The specific reason is quite complex. You can refer to [#776](https://github.com/puppeteer/puppeteer/issues/776) and [#1313](https://github.com/puppeteer/puppeteer/issues/1313). The core reason is as follows:

> The first bug here is that we **don't** send nativeKeyCodes, so no real OSX events get made. When sending the nativeKeyCodes, "a" is keyCode 0 and protocol decides not to send a falsey keyCode. After these are fixed, OSX **doesn't** like to perform keyboard shortcuts unless the application has the foreground. And lastly, if Chromium has the foreground, we send the nativeKeyCode, and protocol processes it, the shortcut gets captured by the address bar **instead of** the page.
>
> https://github.com/puppeteer/puppeteer/issues/776#issuecomment-329589760

You can see the response was in 2017. Nearly 10 years later, this problem still exists.

<br/>

However, the good news is that for common shortcuts like "select all/copy/paste", CDP has some alternative solutions. CDP's [Input.dispatchKeyEvent](https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchKeyEvent) for sending keyboard instructions has an additional commands parameter with some [editing commands](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/editing/commands/editor_command_names.h) that can trigger related operations. For example, if I want to execute a "select all" operation, I can write it like this:

```JavaScript
await page.keyboard.down("KeyA", { commands: ["SelectAll"] });
await page.keyboard.up("KeyA"); // working in macOS
```

<br/>

This way, these common editing shortcuts can be supported:

| Operation | macOS               | Windows/Linux | CDP commands |
| :---      | :------------------ | :------------ | :----------- |
| Copy      | Command + C         | Ctrl + C      | Copy         |
| Paste     | Command + V         | Ctrl + V      | Paste        |
| Cut       | Command + X         | Ctrl + X      | Cut          |
| Undo      | Command + Z         | Ctrl + Z      | Undo         |
| Redo      | Shift + Command + Z | Ctrl + Y      | Redo         |
| Select All| Command + A         | Ctrl + A      | SelectAll    |

<br/>

For some other shortcuts with higher permissions, we can also do **function mapping**:

- View browser history: `Page.goto('chrome://history/')`
- Quit browser: `Browser.close()`
- Navigate to previous page: `Page.goBack()`
- ......

Of course, these should also be added as needed. Full adaptation is not very meaningful.

<br/>

## III. Web Page Functions

Mainly refers to operations on the web page itself, affecting mainly the current web page, including screenshots, file uploads/downloads, etc.

### Screenshots

- **Necessity**: High
- **Support Level**: Direct Support

CDP's [Page.captureScreenshot](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot) API can directly screenshot the web page content itself. However, it's important to note that CDP screenshots can only capture the web page itself (content within the **green box**). The external Chrome UI cannot be screenshotted.

Therefore, special attention is needed here. Some VLM models were trained during their training phase using complete Chrome screenshots (content within the **red box**). If generalization capability is average, directly passing CDP screenshots to VLM might cause action coordinate misalignment issues.

![screenshot](https://image-1255652541.file.myqcloud.com/uPic/10-cdp-do-screenshot.png)

### Basic Interactions

- **Necessity**: High
- **Support Level**: Indirect Support
- **pptr API**: [Keyboard class](https://pptr.dev/api/puppeteer.keyboard), [Mouse class](https://pptr.dev/api/puppeteer.mouse)

Basic operations here mainly refer to behaviors like click, drag, keyboard, etc. Puppeteer has created atomic methods for these that can be directly combined and used. Moreover, pptr also provides various DOM callbacks to execute related action operations, which is very flexible. Here, I recommend directly checking pptr's documentation: [pptr: Page Interactions](https://pptr.dev/guides/page-interactions), as it's described quite clearly.

<br/>

### Dialog Popups

- **Necessity**: High
- **Support Level**: Indirect Support
- **pptr API**: [Dialog class](https://pptr.dev/api/puppeteer.dialog)

CDP can directly perceive popup-related events (for example [Page.javascriptDialogOpening](https://chromedevtools.github.io/devtools-protocol/tot/Page/#event-javascriptDialogOpening)), so triggering of the following 4 types of popups can all be perceived:

| Alert | Confirm |
| :---: | :---: |
| ![alert](https://image-1255652541.file.myqcloud.com/uPic/11-cdp-do-alert.png) | ![confirm](https://image-1255652541.file.myqcloud.com/uPic/12-cdp-do-confirm.png) |
|  |  |
| **Prompt** | **Beforeunload** |
| ![dialog](https://image-1255652541.file.myqcloud.com/uPic/13-cdp-do-dialog.png) | ![beforeunload](https://image-1255652541.file.myqcloud.com/uPic/14-cdp-do-beforeunload.png) |

Because a popup is a browser behavior with very high priority, once invoked, it basically interrupts all web page behaviors, and the JS engine also suspends and stops responding. Therefore, popups must be responded to and closed to execute subsequent processes. Overall, this is a very high-priority feature.

<br/>

### Right-Click Menu

- **Necessity**: Low
- **Support Level**: Indirect Support

CDP cannot perceive the **system menu** itself triggered by clicking the "right mouse button" within the page:

| Page | Image | Link | Tab |
| :---: | :---: | :---: | :---: |
| ![page-right-button](https://image-1255652541.file.myqcloud.com/uPic/15-cdp-do-page-right-button.png) | ![link-right-button](https://image-1255652541.file.myqcloud.com/uPic/16-cdp-do-link-right-button.png) | ![17-cdp-do-image-right-button](https://image-1255652541.file.myqcloud.com/uPic/17-cdp-do-image-right-button.png) | ![tab-right-button](https://image-1255652541.file.myqcloud.com/uPic/18-cdp-do-tab-right-button.png) |

However, the functions within the system popup can basically be achieved through other means. For example, functions like "back/forward/reload" can all be substituted with some Navigate methods. But based on current user requirements, the necessity of these functions is not very high.

<br/>

For **custom right-click menus** within web pages, since they are basically DOM-drawn, they can actually be perceived through in-page screenshots. For example, the DOM menu of bilibili player's right-click in the image below can be captured by CDP screenshots:

![custom-right-button](https://image-1255652541.file.myqcloud.com/uPic/19--cdp-do-custom-right-button.png)

<br/>

### Input Selectors

- **Necessity**: High
- **Support Level**: Indirect Support

Most HTML form functions are supported, but some Input selectors use system controls (for example, HTML's default Select selector, date selector), causing CDP screenshots to be unable to perceive them.

Current testing shows these selectors cannot be captured by CDP Screenshot:

| Select | Date | Time | Color |
| :---: | :---: | :---: | :---: |
| ![select](https://image-1255652541.file.myqcloud.com/uPic/20-cdp-do-select.png) | ![date](https://image-1255652541.file.myqcloud.com/uPic/21-cdp-do-date.png) | ![time](https://image-1255652541.file.myqcloud.com/uPic/22-cdp-do-time.png) | ![23-cdp-do-link-color](https://image-1255652541.file.myqcloud.com/uPic/23-cdp-do-link-color.png) |

However, there are workarounds. We can try using JS code injection to replace existing system controls with DOM controls, indirectly achieving the screenshot requirement. For example, for the Select Option Picker, the effect after replacement is as follows:

![select-dom](https://image-1255652541.file.myqcloud.com/uPic/24-cdp-do-select-dom.png)

<br/>

### File Upload/Download

- **Necessity**: High
- **Support Level**: Direct Support
- **pptr API**: [ElementHandle.uploadFile()](https://pptr.dev/api/puppeteer.elementhandle.uploadfile), [FileChooser class](https://pptr.dev/api/puppeteer.filechooser), [DownloadBehavior](https://pptr.dev/api/puppeteer.downloadbehavior)

**English Translation**

The logic for executing files in pptr is quite robust. Both the `uploadFile` API and `FileChooser` can provide excellent support for file uploads.

For the file download scenario, pptr does not offer a direct API. The only operation available to users is specifying the download strategy and path via `DownloadBehavior`. However, CDP itself exposes four APIs: [Browser.setDownloadBehavior](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#method-setDownloadBehavior), [Browser.downloadProgress](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#event-downloadProgress), [Browser.downloadWillBegin](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#event-downloadWillBegin) and [Browser.cancelDownload](https://chromedevtools.github.io/devtools-protocol/tot/Browser/#method-cancelDownload). By combining these APIs, file download functionality can also be implemented.

It is worth noting that attention should be paid to the permission settings of the download directory during file downloads. A lack of write permissions will result in download failures.

<br/>

### Print

- **Necessity**: Medium
- **Support Level**: Direct Support
- **pptr API**: [Page.pdf()](https://pptr.dev/api/puppeteer.page.pdf)

This is also a ready-made API that can be called directly.

<br/>

### Other Page-Level Functions

- **Necessity**: Low
- **Support Level**: Not Supported

Besides the various high-frequency functions mentioned above, browsers also have some dessert-level minor functions. But from a personal perspective and user requirements, these functions are basically unused in Browser-Use scenarios. Moreover, these functions are basically not supported by CDP. But for the completeness of this article's content, I'll still list them:

- Bookmarks
- Translation
- Search
- QR code
- ......

| Bookmarks | Translation |
| :---: | :---: |
| ![mark](https://image-1255652541.file.myqcloud.com/uPic/25-cdp-do-mark.png) | ![trans](https://image-1255652541.file.myqcloud.com/uPic/26-cdp-do-trans.png) |
| | |
| **Search** | **QR Code** |
| ![search](https://image-1255652541.file.myqcloud.com/uPic/27-cdp-do-search.png) | ![qrcode](https://image-1255652541.file.myqcloud.com/uPic/28-cdp-do-qrcode.png) |

## Conclusion

In summary, we can see that CDP has obvious capability boundaries, but it's already sufficient to support 95% of business functions. Most importantly, polishing these related functions well can maximize AI's capabilities.
