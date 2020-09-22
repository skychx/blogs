---
id: use-charles
title: 🍶 为什么你的 Charles 抓不了包？
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/WechatIMG17.jpeg
description: React Native 作为一款跨端框架，有一个最让人头疼的问题，那就是版本更新。尤其是遇到大版本更新，JavaScript、iOS 和 Android 三端的配置构建文件都有非常大的变动，有时候三者的配置文件又互相耦合在一起，往往牵一发而动全身。
draft: false
tags: [react native, 跨端开发, '前端工程化']
---



这篇文章不会详细介绍 Charles 的各个功能（例如 remote 和 rewrite），而是专注于分析一个问题：**什么情况下 Charles 会抓包失败？**

为了解决这个问题，我会从 Charles 的原理分析，并且结合 Android/iOS 的官方政策，一一分析 Charles 抓包中的那些失效问题。看完后如果你觉得有用，**一定**要记得给我点赞 🌟，谢谢你，这对我真的很重要！



## 一、Charles 抓包原理



只看理论有些干，我们可以用个实例看一下 Charles 内部的工作情况。我在浏览器上访问 `cdn.staticfile.org` 的一个 HTTP 资源，具体的网络报文我用 Wireshark 抓了一下：



结合 Wireshark 的抓包报文和 Charles 的网络分析，我们可以看出这个 HTTP 请求的报文流向：

1. 浏览器从端口号 `56075` 发起一个请求，请求发送到本地 Charles 监听的 `8888` 端口，这个连接直接在本机进行

2. Charles 从端口号 `56076` 发起一个请求，因为这个网络包要入公网，所以 IP 为 `192.168.31.44`（我的电脑 IP 地址，下节会介绍）； `cdn.staticfile.org` 的 IP 为 `111.63.183.223`，因为是 HTTP 请求，所以端口号为 `80`

3. `111.63.183.223:80` 返回一个 HTTP 响应到 Charles 的代理客户端 `192.168.31.44:56076`

4. Charles 内部做了一些处理，然后把响应报文通过 `8888` 端口发送到 `127.0.0.1:56075`，到这里浏览器就收到了响应

在第二步和第三步中，报文经过了 Charles，Charles 这时就可以对报文进行一些加工，例如 Remote 重定向，Rewrite，缓存报文并可视化等操作。







## 二、Charles 抓包配置

为了文章的连续性，这里我会对 Charles 的抓包代理配置进行简单的说明。如果你对这里很熟悉可以选择跳过，不太熟悉可以把文章收藏方便后续检索查阅。



开始配置前我们先回顾一下基础的网络知识，网络数据如果想从 A 传输到 B，想确定一个连接就必须确定 5 个关键信息：`源 IP 地址`，`源端口`，`传输层协议`，`目的 IP 地址`和`目的端口`。这 5 个关键信息又叫`五元组`，一个五元组就可以确定一个连接。



如果用 Charles 抓包，我们就要对照分析一下代理链接的五元组：

- `源 IP 地址`：被抓包应用的 IP 地址，一般为本机 IP，无法修改
- `源端口`：被抓包应用的端口号，一般为操作系统分配，无法修改
- `传输层协议`：Charles 目前主要代理的是 HTTP 协议，一般为 TCP
- `目的 IP 地址`：Charles 的 IP 地址，一般为本机 IP，无法修改
- `目的端口`：Charles 的代理端口，默认为 8888，**可以修改**

> ⚠️ 注：上述分析中只考虑了一般情况，如果你真的想改也可以改，但这种 hack 行为不在本文考虑范围内

从上面的分析我们可以看出，想要打通五元组，我们主要要关注两个点：**目的 IP 地址**和**目的端口**。



我们先分析一下**目的 IP 地址**。因为 Charles 安装在电脑上，所以 Charles 的 IP 就是电脑的 IP。如果你是 Mac 电脑，可以按住 `option` 键再用鼠标点击菜单栏的 Wi-Fi 图标，得到电脑 IP 地址。也可以访问 **系统偏好设置 -> 网络** 得到 IP 地址。这里我的 IP 地址是 `192.168.31.44`，后面会用到。

![getLocalIP](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/getLocalIP.jpg)



Charles 的代理端口号可以从 **Charles -> Proxy -> Proxy Setttings** 进行查看和更改。端口默认是 8888，一般不建议修改。

![getCharlesPort](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/getCharlesPort.jpg)



### HTTP 代理配置

确定好 Charles 的 IP 和端口号后，我们就可以分设备配置 HTTP 代理了。



#### 1.电脑端 HTTP 代理配置

无论你使用的是 window 还是 mac，Charles 作为一款在电脑上安装的 APP，代理本机请求时，网络数据都是在本地转发的，所以相对来说电脑端的配置是最简单的。我们只要根据路径  **Charles -> Proxy -> macOS Proxy** 依次点击开启代理就可。

因为本机代理默认是关闭的，我们也可以在 `Proxy Setttings` 中点击 `macOS`，勾选 `Enable macOS proxy on lounch`，这样每次打开 Charles 就会默认打开代理了。





#### 2.iOS 代理配置

想要抓 iOS 的网络包，只需要把 iOS 的网络包转发到代理 IP 和 代理端口就行。

配置前我们要保证手机和电脑在同一个局域网里（一般手机电脑连同一个 Wi-Fi 就行），然后打开 iOS 的 **设置 -> 无线局域网**，进入已连接的 Wi-Fi 的设置页面，滑动到最底部选择配置代理，然后手动配置代理。

**服务器**要输入的就是前面得到的 Charles IP 地址，案例里是 `192.168.31.44`；**端口**是前面的 Charles 代理端口，一般为 8888。



#### 3.Android 代理配置

Android 的代理配置其实和 iOS 差不多，但是 Android 厂家众多，操作步骤不像 iOS 那么统一，一一覆盖也没有太大的意义，所以我只做个简单的步骤演示：



### HTTPS 代理配置

HTTPS 本质上就是 HTTP 协议 + TLS 协议，从建立连接的角度看，主要是在 TCP 三次握手之后又加入了 TLS 握手。



TLS 的加入，加强了网络的安全性的同时，也增加了抓包的复杂度，下一节我会详细解释，这里先做个步骤演示。

#### 1.电脑端安装证书

**Charles -> Help -> SSL Proxying -> Install Charles Root Certificate** 在电脑端安装证书。

安装好后要手动信任证书。



#### 2.iOS 安装证书

点击 **Charles -> Help -> SSL Proxying -> Install Charles Root Certificate on a Mobile Derive**，这时候会跳出一个弹窗，然后我们根据提示在手机端访问 `chls.pro/ssl`，下载安装 Charles CA 证书。

安装好后还要手动确认开启权限，分别是 **通用 -> 描述文件与设备管理 -> 信任** 和 **通用 -> 关于本机 -> 证书信任设置 -> 针对根证书启用完全信任**，这两个同意后 iOS 就安装证书成功了。





#### 3.Android 安装证书

点击 **Charles -> Help -> SSL Proxying -> Save Charles Root Certificate**，把证书文件以 `*.cer` 格式保存。

用 USB 或着其它方式把 CA 证书导入到 Android 内，然后点击证书并确认安装。



## 三、Charles 抓包失败案例分析



### 1.关闭代理！关闭代理！关闭代理！

作为一名程序员，为了顺畅的访问 GitHub 等网站，我们总会用些“辅助工具”。这些工具一般会自动开启 HTTP/HTTPS 代理从而抢占端口，导致 Charles 代理失败。解决这个问题也很简单，**Charles 抓包前，把电脑和手机的辅助工具都关掉**，这样就不会有代理冲突的问题了。

肯定也有人想过我们本地挂两个代理，报文先经过工具，然后经过 Charles 抓包，最后传输到客户端。首先这种方案是可行的，但是实际用下来会非常的卡，延迟也很高，所以并不建议这样使用。



### 2.确定数据走的 HTTP 协议吗？

本小节开始前我们先看一下官方是如何定义 Charles 的：

> Charles is an **HTTP** proxy / **HTTP** monitor / Reverse Proxy that enables a developer to view all of the **HTTP** and **SSL** / **HTTPS** traffic between their machine and the Internet.

从介绍中我们可以看出 Charles 是一款专注于分析 **HTTP** 报文的网络工具，所以说对于其它协议支持是非常有限的。比如说现在的 IM 或音视频应用，出于性能和安全上的考虑，基本都是自己基于某一传输层协议自己封装的，这些数据 Charles 肯定是抓不到的。

通过阅读 Charles 的官方文档和自己的测试，Charles 支持以下协议：

- **HTTP/1.1**
- **HTTPS**
- **HTTP/2**
- **ws**（WebSocket）
- **wss**（WebSocket Secure，TLS 加密的 WebSocket）
- **SOCKS**

> ⚠️ 注：**Charles 不支持 HTTP/3**，但是大部分开启 HTTP/3 的网站都做了降级处理。例如用 Chrome 正常访问 Google 时，走的协议是 HTTP/3，连接 Charles 代理后，协议会降级到 HTTP/2

上面列出的几个协议，其实已经覆盖日常业务开发 90% 的应用场景了，若想抓取其他协议的报文，还是老老实实用 Wireshark 吧。



### 3.之前开了黑白名单，再次抓包忘记关了

我想日常工作中，你或你的同事肯定遇到过这种场景：

> 测试报上来一个 BUG，自己连上 Charles 打算分析一下 HTTP 报文想定位一下是前端问题还是后端问题，结果发现请求一直打不通，手忙脚乱半天，才发现自己开了黑白名单，请求都被 Block 掉了

上面案例的黑白名单只是一个统称，具体到 Charles 里，下面的几个配置都有可能造成误解：

- `Proxy Settings` 的 Options 里过滤了一些网址
- `SSL Proxying Settings` 没有匹配所有网址
- `Block List/Allow List` 做了黑白名单设置
- `DNS Spoofing` 做了 HOST 的映射
- `Map Remote` 重定向了请求
- `Rewrite` 重写了请求
- ......

我写了几个高频的 Charles Tools，这些功能很有可能在你开启后就忘记关闭了，如果出了问题难道就要一一排查吗？

其实 Charles 有一个很不起眼的功能，那就是它的 UI 界面**右下角会展示 Charles 正在开启的功能**，如果你怀疑你的 Charles 哪里做了接口限制，你就扫一眼右下角开启的功能，然后依次检查就可。





### 4.Android 版本越高，HTTPS 报文越难抓

在「android 安装证书」那个小节里，我说这个步骤意义不大，根本原因在于：**用户自己安装的 CA 证书没有 ROOT 权限。**

我们先看一张图，这个是 Android 的证书信任页面，我们可以看出，Android 系统把证书信任分为两大块：

- **系统 CA 证书**：基本拥有所有权限
- **用户 CA 证书**：用户自行安装，权限很低

我们自己安装的 Charles 证书都属于用户 CA 证书。除了证书的权限问题，Android 的不同版本对权限的处理规则也不一样：

✅：**Android 7.0 以下**：信任用户 CA 证书，可以简单的理解为我们安装的证书直接获得 ROOT 权限

✅：**Android 7.0 以上， targetSdkVersion < 24**：信任用户 CA 证书

❌：**Android 7.0 以上， targetSdkVersion >= 24**：不信任用户 CA 证书



通过以上的分析，我们可以得出几个让 Android 信任 Charles 证书的方案：

**1.ROOT**

直接 ROOT Android 手机，把 Charles 证书放到系统证书里

**2.准备一个低于 Android 7.0 的手机**

Android 7.0 是 2016 年的系统，按照手机两年一换代一年一更新的速度算，这种手机很难找到了

**3.准备一个 targetSdkVersion < 24 的 APP 安装包**

国内各大应用市场 2019 年统一要求 APP API 版本必须大于 28，这种安装包很难找到了，而且互联网产品迭代这么快，不一定能保证安装包可用



上面的几个方案都是针对其它 APP 的，如果你想抓包的应用是自己公司的，那就很简单了。

Android 有个 `res/xml/network_security_config.xml` 文件，意如其名，这个配置文件是专门控制网络安全的。

比如下面的配置，release 包只信任 `system` 级别的证书，debug 包同时信任 `system` 和 `user` 级别的证书，这样我们在 debug 环境下就可以开心的用 Charles 抓包了。当然安全配置肯定不止这一点内容，感兴趣的同学可以去 [Android 开发者官网](https://developer.android.com/training/articles/security-config)学习了解。

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates overridePins="true" src="system" />
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates overridePins="true" src="system" />
            <certificates overridePins="true" src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```



### 5.TLS 证书固定



### 6.TLS 证书双向验证









