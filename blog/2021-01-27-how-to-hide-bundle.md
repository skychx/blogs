---
slug: how-to-hide-bundle
title: 🙈 如何隐藏你的热更新 bundle 文件？
author: 卤代烃
author_title: 微信公众号@卤代烃实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.file.myqcloud.com/uPic/WechatIMG17.jpeg
description: 如何隐藏热更新的 bundle 文件
draft: false
tags: [密码学, 网络安全, 计算机网络, React Native]
---



前段时间我们公司的一个大佬从一些渠道得知了一些小道消息，某国民级 APP 因为 Apple App Store 审核人员检测出 React Native 热更新的内容，被拒审了三个月。我们的热更新平台和出事的 APP 原理相似，所以也存在着拒审危险。那么我们就要想一些办法，隐藏热更新 bundle，不被审核人员发现。



其实这个问题蛮复杂的，因为它不单纯是一个技术问题，还涉及到各种复杂的商业利益，在诸多的限制条件下，你很难去找到一个最优解。而且这个问题也比较敏感，我也只能大致讲一下我的思路，具体的代码实现本文也不会提供。

>  郑重声明：若有人按本文思路隐藏热更新数据导致应用拒审或下架，本人概不负责

<!--truncate-->

## 一、商业利益

Apple 公司对 iPhone 生态有着非常严格的管控：App 上架必须走 App Store，动态链接库要参与签名，带 JIT 功能的虚拟机不能用......

对于热更新技术，Apple 在 2017 年封杀过一次  [JSPatch](https://github.com/bang590/JSPatch) 这个热更新框架，导致很多的 APP 被拒审，根据 Apple 官方给出的理由，主要有三点：

- 热更新代码没有做好加密和校验，有可能被第三方破解劫持
- JSPatch 权限过高，可能会调用私有 API，改变原有的 APP 功能
- 对于 Apple 官方来说，JSPatch 自由度太大，会绕过 App Store 这个 iOS 上的唯一流量分发平台更新应用，影响商业利益

俗话说得好，断人财路如杀人父母，这种涉及商业利益的事情无论放在谁都头上都忍不了，而且很多应用又不是微信，有庞大的用户基数可以和 Apple 官方谈判（微信小程序生态就是谈出来的，但是小程序支付权限就没谈妥），所以说这个问题还是很复杂的。

<br />

其实对于 Apple 官方来说，对与动态化热更新的态度向来是**不赞成也不反对**，和 JSPatch 比起来，React Native 和游戏热更新这两种应用场景还是被允许的，主要还是体现在三点：

- 网游这种重运营的场景还是需要热更新维持活动热度的，每周都有新活动，让用户主动去 App Store 下载更新包很不合理，App 活动运营同理
- React Native/Lua 等热更新技术是在一个容器里进行动态化的，不像 JSPatch 有那么大的修改权限
- 苹果官方在商业利益上和游戏厂商/互联网巨头达到一些微妙的平衡

说实话苹果审核一直很迷，拒审有时候和打太极一样，给出的规范各路解读都不一样，不过为了保险起见，我们还是要研究一下相关的平台规范。





## 二、解读规范

2015 年苹果发过一篇协议——[《Apple Developer Program License Agreement》](https://developer.apple.com/programs/ios/information/)，文中第 3.3.2 节有一段关于热更新的内容：


> Except as set forth in the next paragraph, an Application may not download or install executable code. Interpreted code may only be used in an Application if all scripts, code and interpreters are packaged in the Application and not downloaded. The only exceptions to the foregoing are scripts and code downloaded and run by Apple's built-in WebKit framework or JavascriptCore, provided that such scripts and code do not change the primary purpose of the Application by providing features or functionality that are inconsistent with the intended and advertised purpose of the Application as submitted to the App Store.

这一段话大概就是说**除了** Webkit 和 JavascriptCore 可以动态执行下发的脚本和文件，**其它所有**脚本/代码/解释器都必须打包在 APP 内部。这句话其实就给 React Native 留了一个口子：React Native 就是用 JavascriptCore 执行 JS 脚本文件的，那么动态下发也是合理的。

<br />

> Interpreted code may be downloaded to an Application but only so long as such code: (a) does not change the primary purpose of the Application by providing features or functionality that are inconsistent with the intended and advertised purpose of the Application as submitted to the App Store, (b) does not create a store or storefront for other code or applications, and (c) does not bypass signing, sandbox, or other security features of the OS.

这一段话大概就是说，我允许你热更新，但是必须遵循我这三条规定：

- 不能大的修改 APP 功能，导致应用实际功能和 APP Store 的宣传不符（这个地方就很打太极，评判标准全靠审核人员心情）
- 不能动态创建应用商店（应该是不能绕过 IAP 支付的意思，要不然怎么收苹果税）
- 不能绕过签名/沙箱/OS 的安全功能（这个可以理解，维护系统和生态安全）

<br />

这样解读下来，貌似只要按照规范当个**良民**就可以解决问题了。但是说实话，动态化规范更多的是**君子协议**，如果双方都讲武德，那大家其乐融融都挺好；万一哪个人跳出来要坏规矩，说实话大家都很难堪。在未来，热更新技术肯定还是要以微妙的平衡状态存在下去。



## 三、技术实现

每次设计一些工程方案时，我个人的习惯都是先从理论上找答案。就拿隐藏热更新 bundle 这个例子来说，我们主要是想在信息传输这里找到突破口，实际上香农老爷子 1949 年就提出了一个「[香农一韦弗通信模型](https://www.wikiwand.com/en/Shannon%E2%80%93Weaver_model)」。这个模型里把通信分为五个部分：`信息源`、`发射器`、`信道`、`接收器`、`信息接受者` 和 `噪音`。



![香农一韦弗通信模型](https://image-1255652541.file.myqcloud.com/uPic/shannon-weaver-model_orig.png)

<br />

那么结合这个通信模型，我们隐藏/加密通讯信息的答案就呼之欲出了：

- **对信源加密**：在信息的收发终端发送消息时加密，接受消息时解密
- **对信道加密**：信息在信道传输时，经过信道时进行加密

那么我们下面就对这两个大方向进行扩展和探讨。

<br />

### 1.对消息本身加密/混淆

#### 1.1 隐写术——当代特洛伊木马

隐写术是一个非常非常古老的技术，这个技术的关键就是把想要传递的数据隐藏/伪装一下，不让第三方看出来真实想要传递的数据。

隐写术的例子非常多，比如说特洛伊木马，你从外面看是个木马，但运到城里，士兵就跑出来了；我们看的一些影视剧里，也有类似原理的桥段：主角收到一份无字信纸，在蜡烛上一烤，文字就显现出来。如今的数字时代肯定不会用无字信纸秘密传递消息，我们肯定有些更加赛博的方法，比如说**图种技术**——**把消息隐写到图片文件里**。

如果大家玩过一段时间贴吧，对图种技术肯定不会陌生，有些大神会发个贴，把种子文件隐藏在图片里，大家把图片下载下来，把 `.jpg` 的后缀改为 `.zip` or `.rar`，然后解压文件就能得到隐藏的种子文件，然后在贴吧留下「楼主好人」的美誉。

那么图种技术的原理是啥？其实很简单，它只是单纯的把一个 jpg 文件和一个 rar 文件合并在一起，但是图片查看器会忽略附加的 rar 文件数据，这样在感官上这是一张图片，但是从二进制的角度看这个图片文件里隐藏了一些数据。

下面我们看看图种文件的原理。

<br />

首先我用图片编辑器生成一个 `2x2` 4 个像素大小的图片——`RGBY.jpg`。颜色我参考 Google logo 配了一下：

![RGBY-image](https://image-1255652541.file.myqcloud.com/uPic/RGBY-image.jpg)

然后我们用二进制查看工具（我这里用的是 `Hex Fiend` 软件）查看这个图片的编码，因为图片只有 4 个像素，所以二进制数据也会比较小，注意观察这个文件的二进制数据，它是 `FF D8` 开头，`FF D9` 结尾的。

图片查看器加载一张图片文件时就会做检测，如果是 `FF D8` 开头，就会认为这是一张 jpg 图片，然后就会进入 jpg 图片解码的分支，加载二进制数据遇到 `FF D9` 后，就会认为这个图片已经加载完毕，**后面的数据就不会再管了**。

![RGBY-Binary-Code](https://image-1255652541.file.myqcloud.com/uPic/RGBY-Binary-Code.jpg)

<br />

基于图片预览器不会加载 `FF D9` 之后数据的这个特性，我们可以把一些要隐藏的数据附加到 jpg 文件之后。

这里为了测试方便，我新建了一个内容为 **hello word** 的 `text.txt` 文件，然后用 `cat` 命令把 `RGBY.jpg` 和 `text.txt` 合并一下，生成 `RGBY_text.jpg` 文件：

```bash
cat RGBY.jpg text.txt > RGBY_text.jpg
```

这时候用图片浏览器查看文件，可以看出文件还是正常预览的：

![RGBY_text-image](https://image-1255652541.file.myqcloud.com/uPic/RGBY_text-image.jpg)

但是用二进制查看工具查看这张图片，就会发现他在末尾多了 11 个字节，正是 `text.txt` 里的内容—— `hello word` ：

![RGBY_text-Binary-Code](https://image-1255652541.file.myqcloud.com/uPic/RGBY_text-Binary-Code.jpg)

这样我们就达到了隐写的目的。

<br />

大家不要觉得这个方案 low，实际上阿里的一些密钥就是通过类似的原理写到一张图片里的（当然不会像以上案例那么简单）。我们在传输热更新 bundle 文件时，可以把 bundle 文件隐写在一张图片里，这样审核人员在做流量监控的时候，抓包看到的是一张图片，如果不检查图片的二进制编码，是不会发现里面隐藏了数据的。

针对这种方案，服务端和客户端的改动都比较小，服务端只需要每次下发 bundle 时前合并一个图片文件，客户端读取隐写图片后去掉多余的图片数据就可以了。

<br />

当然隐写术还有很多种，比如说基于 LSB 的图片隐写技术，把数据写在 jpg png mp4 的扩充数据字段里，因为原理大同小异，这里就不多介绍了，感兴趣的同学可以自行搜索学习。

<br />

#### 1.2 对称加密

对称加密也是一个历史悠久的加密技术，在信息技术的加持了下也飞速发展，我举个最简单的对称加密算法——**异或算法加密**。

异或运算我想每一个程序员都不陌生，我们先约定 0 为 false， 1 为 true，那么 **XOR** 运算的真值表如下：

| A    | B    | A ⊕ B |
| ---- | ---- | ----- |
| 0    | 0    | 0     |
| 0    | 1    | 1     |
| 1    | 0    | 1     |
| 1    | 1    | 0     |

从真值表可以很容易推出下面的运算法则：

$$
A \oplus 0=A
$$

$$
A \oplus A=0
$$

$$
(A \oplus B) \oplus C=A \oplus(B \oplus C)
$$

<br />

运用上面的运算规则，我们假设 $A$ 是**密钥**，对**内容** $B$ 加密，那么得到的**密文**就是 $(B \oplus A)$；想对密文解密，只要让密文和密钥 $A$ 再进行一次异或运算就可以了：$(B \oplus A) \oplus A=B \oplus 0=B$

我们可以用代码举例子验算一下：

```javascript
// 加密：
// 原文       密钥       秘文
01010111 ^ 11110011 = 10100100

// 解密：
// 秘文       密钥       原文 
10100100 ^ 11110011 = 01010111
```

:::note LeetCode 指路
关于异或运算在密码学里的运用，可以尝试做一下 LeetCode 中的[1720.解码异或后的数组](https://leetcode-cn.com/problems/decode-xored-array/) ，题目很简单，主要就是运用 $(A \oplus B) \oplus C=A \oplus(B \oplus C)$ 这个公式进行解码。
:::

众所周知，位运算都是非常快的，如果要简单地对 bundle 做个混淆，直接用异或加密，基本上不会影响性能。

虽然异或运算很简单，但是密码学有个第一准则：**永远不要自己实现加密算法**。我们可以用已经非常成熟的对称加密算法（例如 AES 和 CHACHA20）对 bundle 进行加密：性能高，安全性好，最重要的是开源社区都有现成的库，直接调包就可以了。

所以如果用对称加密的方案，只要服务端和客户端商量好一个密钥，然后服务端用密钥加密 bundle，客户端用同一个密钥解密，就能在一定程度上绕过 App Store 的异常流量检测。

<br />

#### 1.3 非对称加密

非对称加密是属于近代密码学的内容了，非常的新，但是也非常的可靠，具体原理太复杂了，一句两句根本说不清楚，我就不做介绍了。

非对称加密和对称加密相比，非常消耗性能，一般在设计时为了均衡速度和安全性要求，对称加密一般用在对**密钥**的加密上。

在加密热更新 bundle 这个场景下，因为 bundle 较大，一般还是采用对称加密的方案，当然也可以参考 HTTPS 等经典加密场景，自行设计一套混合加密方案，不过这个就超出本文的探讨内容了，因此按下不表。

<br />

#### 1.4 总结

一般来说，对 bundle 加密不会单纯使用一种技术，比如说我们会用**混合加密**的方式对 bundle 本身加密，用**消息认证码**（例如 HMAC）防篡改，加入**时间戳随机数**防重放，最后再把加密后的数据进行**隐写**......这里面的组合实在是太多了，个人认为参考一些经典的加密组合进行业务实践即可。



<br />



### 2.对信道加密

信道加密在本文的场景下也比较直观，就是使用 **HTTPS** 协议，目的就是防止审核人员通过抓包的方式捕获到我们的热更新流量。当然 HTTPS 也有很多的有意思的知识点，下面我就简单介绍一下。

<br />

#### 2.1 使用 HTTPS

2021 年了，我想互联网上基本没有裸露的 HTTP 明文流量了吧......前几年可能还会有企业考虑 HTTPS 加密带来的服务器成本，但在各大平台（iOS/Android/Chrome）的要求下，除了个别无人维护的网站，基本都全站上 HTTPS 了，毕竟现在数据的价值远远高于服务端的电费，上了 HTTPS 后，起码被中间人攻击被劫持的概率会降低不少。

上 HTTPS 就高枕无忧了吗？那肯定不是。我去年写过一篇 [Charles 抓包](https://supercodepower.com/use-charles)的文章，里面花了大量的篇幅去介绍 HTTPS 抓包。既然一个 APP 开发者可以借助市场上的工具进行抓包，那么审核人员更可以了。在抓包工具下，大部分 HTTPS 数据都可以被捕获和劫持。下面我们就说说 HTTPS 协议中一些比较高阶的内容。

<br />

#### 2.2 HTTPS 证书固定

**HTTPS 证书固定**，又叫 **HTTPS 证书锁定**，英文名为 **Certificate Pinning**，指的是我们在 APP 内置仅接受指定域名的证书，而不接受操作系统或浏览器内置的CA根证书对应的任何证书。

通过这种授权方式，我们可以保障 APP 与服务端通信的唯一性和安全性。如果开启了抓包软件，不[主动导入固定的证书](https://supercodepower.com/use-charles#5%E8%AF%81%E4%B9%A6%E5%9B%BA%E5%AE%9A%EF%BC%88certificate-pinning%EF%BC%89)，就无法有效的抓包（具体原理可看我的博文：[Charles 抓包原理](https://supercodepower.com/use-charles#%E4%B8%80%E3%80%81charles-%E6%8A%93%E5%8C%85%E5%8E%9F%E7%90%86)）。我想审核人员还没那个精力去砸壳你的 APP 获取你的证书，所以可以通过这种方式隐藏你的热更新 bundle。

当然，证书固定也是有一定代价的。CA 签发证书都存在有效期问题，所以缺点是在证书续期后需要将证书重新内置到 APP 中。

<br />

#### 2.3 HTTPS 双向认证

我们平常使用 HTTPS 时，一般只做了单向认证，即**客户端认证服务端的真实性**。其实 HTTPS 支持双向认证的，即**支持服务端认证客户端的真实性**（具体流程可见下图 * 部分）。

![TLS 1.2 握手流程图](https://image-1255652541.file.myqcloud.com/uPic/TLS12.jpg)

一般来说开启 HTTPS 双向认证的 APP 都是那种安全性要求极高的 APP，比如说金融类 APP 和匿名社交类 APP。而且想要实现双向认证，就必须要在客户端内置一份公钥证书和私钥，但 APP 又有砸壳风险，所以还得想办法把这两个东西加密和隐写（都成俄罗斯套娃了）。

综合来看，实现 HTTPS 双向认证的成本还是很高的，但是一旦实现，安全系数还是非常高的，不仅仅是绕过审核人员的流量检测，综合来看整个 APP 的网络安全都得到了极大的防护。


<br />


## 四、总结

对于热更新这件事，根据 Apple 的应用规范，基于 JavaScriptCore 的热更新是完全可行的，但前提是你必须守规矩，不能脱离 Apple 的掌控范围；但是 App Store 的审核规则又极其不透明，虽然我们是良民，但是一定程度上还是要隐藏一下热更新 bundle，规避不必要的麻烦；隐藏热更新 bundle 我们可以从信源加密和信道加密两个角度去思考，综合来看就是灵活利用密码学知识，对网络数据进行加密，防止被检测出异常流量，隐藏 bundle 的同时，也保护了用户的数据安全，降低被攻击的可能性。


## 五、参考阅读

[🍶 为什么你的 Charles 会抓包失败？](https://supercodepower.com/use-charles)

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



