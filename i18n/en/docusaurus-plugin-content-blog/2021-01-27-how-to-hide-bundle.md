---
slug: how-to-hide-bundle
title: 🙈 How to Hide Your Hot Update Bundle Files?
authors: skychx

description: How to hide hot update bundle files
draft: false
tags: [cryptography, network security, network, React Native]
---

A while ago, a senior person at our company learned through some channels that a certain national-level APP was rejected for three months because Apple App Store reviewers detected React Native hot update content. Our hot update platform has similar principles to the problematic APP, so we also face the risk of rejection. Therefore, we need to think of some ways to hide the hot update bundle and avoid being discovered by reviewers.

Actually, this problem is quite complex because it's not purely a technical issue but also involves various complex commercial interests. Under many constraints, it's difficult to find an optimal solution. Moreover, this issue is quite sensitive, so I can only briefly outline my thinking process. This article will not provide specific code implementations.

> Serious declaration: If anyone hides hot update data according to the ideas in this article and the application gets rejected or removed, I will not be responsible.

{/* truncate */}

## 1. Commercial Interests

Apple has very strict control over the iPhone ecosystem: APPs must go through the App Store to be listed, dynamic libraries must participate in signing, virtual machines with JIT functionality cannot be used...

Regarding hot update technology, Apple blocked the JSPatch hot update framework in 2017, causing many APPs to be rejected. According to the official reasons given by Apple, there are mainly three points:

- Hot update code is not properly encrypted and verified, potentially allowing third parties to crack and hijack it
- JSPatch has excessive permissions and might call private APIs, changing the original APP functionality
- For Apple officials, JSPatch has too much freedom and would bypass the App Store, the only traffic distribution platform on iOS, affecting commercial interests

As the saying goes, cutting off someone's income stream is like killing their parents. No matter who this kind of commercial interest issue falls on, it's unbearable. Moreover, many applications aren't like WeChat, which has a huge user base that can negotiate with Apple officials (the WeChat mini-program ecosystem was negotiated, but mini-program payment permissions weren't). So this problem is quite complex.

<br />

Actually, for Apple officials, the attitude toward dynamic hot updates has always been **neither approve nor disapprove**. Compared to JSPatch, React Native and game hot updates are still allowed in these application scenarios, mainly reflected in three points:

- Heavy operation scenarios like online games still need hot updates to maintain activity popularity. Having new activities every week and requiring users to actively download update packages from the App Store is unreasonable. The same applies to APP activity operations
- Hot update technologies like React Native/Lua perform dynamic operations within a container, unlike JSPatch which has such large modification permissions
- Apple officials have reached some subtle balance with game manufacturers/internet giants in terms of commercial interests

To be honest, Apple's review process has always been mysterious. Rejections sometimes feel like playing Tai Chi, and the specifications they provide are interpreted differently by various people. However, to be on the safe side, we still need to study the relevant platform specifications.



## 2. Interpreting Specifications

In 2015, Apple issued an agreement—[Apple Developer Program License Agreement](https://developer.apple.com/programs/ios/information/). Section 3.3.2 contains content about hot updates:

> Except as set forth in the next paragraph, an Application may not download or install executable code. Interpreted code may only be used in an Application if all scripts, code and interpreters are packaged in the Application and not downloaded. The only exceptions to the foregoing are scripts and code downloaded and run by Apple's built-in WebKit framework or JavascriptCore, provided that such scripts and code do not change the primary purpose of the Application by providing features or functionality that are inconsistent with the intended and advertised purpose of the Application as submitted to the App Store.

This paragraph basically says that **except** for WebKit and JavaScriptCore which can dynamically execute deployed scripts and files, **all other** scripts/code/interpreters must be packaged within the APP. This actually leaves a loophole for React Native: React Native uses JavaScriptCore to execute JS script files, so dynamic deployment is also reasonable.

<br />

> Interpreted code may be downloaded to an Application but only so long as such code: (a) does not change the primary purpose of the Application by providing features or functionality that are inconsistent with the intended and advertised purpose of the Application as submitted to the App Store, (b) does not create a store or storefront for other code or applications, and (c) does not bypass signing, sandbox, or other security features of the OS.

This paragraph basically says that I allow you to hot update, but you must follow these three rules:

- Cannot make major modifications to APP functionality, causing the actual application to differ from what's advertised on the APP Store (this is very vague here, the judgment standard depends entirely on the reviewer's mood)
- Cannot dynamically create an app store (probably means not bypassing IAP payment, otherwise how can Apple collect taxes)
- Cannot bypass signing/sandbox/OS security features (this is understandable, maintaining system and ecosystem security)

<br />

Interpreted this way, it seems we can solve the problem by being a **law-abiding citizen** according to the specifications. But to be honest, dynamic specifications are more like **gentlemen's agreements**. If both parties follow martial ethics, everyone gets along happily; if someone jumps out to break the rules, frankly, everyone will be in an awkward position. In the future, hot update technology will definitely continue to exist in a state of delicate balance.

## 3. Technical Implementation

Every time I design some engineering solutions, my personal habit is to first find answers theoretically. Taking the example of hiding hot update bundles, we mainly want to find a breakthrough in information transmission. Actually, Shannon proposed the "[Shannon-Weaver communication model](https://www.wikiwand.com/en/Shannon%E2%80%93Weaver_model)" back in 1949. This model divides communication into five parts: `information source`, `transmitter`, `channel`, `receiver`, `information receiver` and `noise`.



![Shannon-Weaver Communication Model](https://image-1255652541.file.myqcloud.com/uPic/shannon-weaver-model_orig.png)

<br />

Then, combining this communication model, our answer to hiding/encrypting communication information becomes apparent:

- **Encrypt the information source**: Encrypt when sending messages at the information receiving/sending terminals, decrypt when receiving messages
- **Encrypt the channel**: Encrypt when information passes through the channel during transmission

Below, we'll expand and discuss these two major directions.

<br />

### 1. Encrypt/Obfuscate the Message Itself

#### 1.1 Steganography—The Modern Trojan Horse

Steganography is a very, very ancient technology. The key to this technology is to hide/disguise the data you want to transmit, preventing third parties from seeing the real data you want to transmit.

There are many examples of steganography. For example, the Trojan horse: from the outside, it looks like a wooden horse, but when transported into the city, soldiers run out. In some movies and TV shows we've watched, there are similar scenes: the protagonist receives a blank piece of paper, holds it over a candle, and text appears. In today's digital age, we certainly wouldn't use blank paper to secretly transmit messages. We definitely have more cyber methods, such as **image seed technology**—**hiding messages in image files**.

If you've played on Tieba for a while, you're probably familiar with image seed technology. Some masters would post images with torrent files hidden inside. Everyone downloads the image, changes the `.jpg` suffix to `.zip` or `.rar`, then extracts the file to get the hidden torrent file, leaving the praise "OP is a good person" in the Tieba.

So what's the principle of image seed technology? Actually, it's quite simple: it just merges a jpg file and a rar file together. However, image viewers ignore the additional rar file data, so visually it's an image, but from a binary perspective, some data is hidden in this image file.

Let's look at the principle of image seed files.

<br />

First, I use an image editor to generate a `2x2` 4-pixel image—`RGBY.jpg`. I referenced the Google logo for the colors:

![RGBY-image](https://image-1255652541.file.myqcloud.com/uPic/RGBY-image.jpg)

Then we use a binary viewing tool (I'm using `Hex Fiend` software here) to view this image's encoding. Because the image only has 4 pixels, the binary data will also be relatively small. Notice that this file's binary data starts with `FF D8` and ends with `FF D9`.

When an image viewer loads an image file, it will check if it starts with `FF D8`. If it does, it considers it a jpg image and enters the jpg image decoding branch. When loading binary data and encountering `FF D9`, it considers the image loading complete, **and won't care about the data that follows**.

![RGBY-Binary-Code](https://image-1255652541.file.myqcloud.com/uPic/RGBY-Binary-Code.jpg)

<br />

Based on the characteristic that image viewers don't load data after `FF D9`, we can append some data we want to hide to the jpg file.

For testing convenience, I create a `text.txt` file with content **hello word**, then use the `cat` command to merge `RGBY.jpg` and `text.txt`, generating `RGBY_text.jpg` file:

```bash
cat RGBY.jpg text.txt > RGBY_text.jpg
```

When viewing the file with an image browser, you can see the file still previews normally:

![RGBY_text-image](https://image-1255652541.file.myqcloud.com/uPic/RGBY_text-image.jpg)

But when viewing this image with a binary viewing tool, you'll find it has 11 extra bytes at the end, which is exactly the content from `text.txt`—`hello word`:

![RGBY_text-Binary-Code](https://image-1255652541.file.myqcloud.com/uPic/RGBY_text-Binary-Code.jpg)

This way, we've achieved the purpose of steganography.

<br />

Don't think this solution is low-tech. Actually, some of Alibaba's keys are written into images using similar principles (of course, not as simple as the above example). When transmitting hot update bundle files, we can hide the bundle file in an image. This way, when reviewers do traffic monitoring and capture packets, they see an image. Unless they check the image's binary encoding, they won't discover hidden data inside.

For this solution, both server-side and client-side changes are relatively small. The server only needs to merge an image file each time when deploying the bundle, and the client can read the steganographic image and remove the excess image data.

<br />

Of course, there are many types of steganography, such as LSB-based image steganography, writing data in extended data fields of jpg/png/mp4 files. Since the principles are similar, I won't introduce them here. Interested students can search and learn on their own.

<br />

#### 1.2 Symmetric Encryption

Symmetric encryption is also a long-standing encryption technology that has developed rapidly with the support of information technology. Let me take the simplest symmetric encryption algorithm—**XOR algorithm encryption**.

I think every programmer is familiar with XOR operations. Let's first agree that 0 is false and 1 is true, then the truth table for **XOR** operations is as follows:

| A    | B    | A ⊕ B |
| ---- | ---- | ----- |
| 0    | 0    | 0     |
| 0    | 1    | 1     |
| 1    | 0    | 1     |
| 1    | 1    | 0     |

From the truth table, we can easily derive the following operation rules:

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

Applying the above operation rules, let's assume $A$ is the **key**, we encrypt **content** $B$, then the obtained **ciphertext** is $(B \oplus A)$. To decrypt the ciphertext, we just need to perform another XOR operation between the ciphertext and the key $A$: $(B \oplus A) \oplus A=B \oplus 0=B$

We can use code examples to verify:

```javascript
// Encryption:
// Plaintext   Key     Ciphertext
01010111 ^ 11110011 = 10100100

// Decryption:
// Ciphertext Key     Plaintext
10100100 ^ 11110011 = 01010111
```

:::note LeetCode guidance
Regarding the use of XOR operations in cryptography, you can try [1720. Decode XORed Array](https://leetcode.com/problems/decode-xored-array/) on LeetCode. The problem is simple, mainly using the formula $(A \oplus B) \oplus C=A \oplus(B \oplus C)$ for decoding.
:::

As everyone knows, bitwise operations are very fast. If you simply want to obfuscate the bundle, using XOR encryption directly basically won't affect performance.

Although XOR operations are simple, the first principle of cryptography is: **never implement encryption algorithms yourself**. We can use very mature symmetric encryption algorithms (such as AES and CHACHA20) to encrypt the bundle: high performance, good security, and most importantly, there are ready-made libraries in the open-source community, so you can just use them directly.

So if using the symmetric encryption solution, as long as the server and client agree on a key, then the server uses the key to encrypt the bundle, and the client uses the same key to decrypt, which can to some extent bypass App Store's abnormal traffic detection.

<br />

#### 1.3 Asymmetric Encryption

Asymmetric encryption belongs to the content of modern cryptography. It's very new but also very reliable. The specific principles are too complex and cannot be explained clearly in one or two sentences, so I won't introduce them.

Compared to symmetric encryption, asymmetric encryption is very performance-consuming. Generally, when designing to balance speed and security requirements, symmetric encryption is usually used to encrypt **keys**.

In the scenario of encrypting hot update bundles, because bundles are relatively large, symmetric encryption solutions are generally adopted. Of course, you can also refer to classic encryption scenarios like HTTPS and design a hybrid encryption solution yourself, but this goes beyond the scope of this article, so I won't discuss it here.

<br />

#### 1.4 Summary

Generally, bundle encryption doesn't simply use one technology. For example, we might use **hybrid encryption** to encrypt the bundle itself, use **message authentication codes** (like HMAC) to prevent tampering, add **timestamps and random numbers** to prevent replay attacks, and finally perform **steganography** on the encrypted data... There are too many combinations here. I personally think it's sufficient to refer to some classic encryption combinations for business practice.




### 2. Encrypt the Channel

Channel encryption is also quite intuitive in this article's context—it's using **HTTPS** protocol, with the purpose of preventing reviewers from capturing our hot update traffic through packet capture. Of course, HTTPS also has many interesting knowledge points. Below, I'll briefly introduce them.

<br />

#### 2.1 Using HTTPS

In 2021, I think there's basically no exposed HTTP plaintext traffic on the internet anymore... A few years ago, some enterprises might consider the server costs brought by HTTPS encryption, but under the requirements of various platforms (iOS/Android/Chrome), except for some unmaintained websites, basically all have implemented site-wide HTTPS. After all, the value of data today far exceeds server electricity costs. After implementing HTTPS, the probability of being attacked and hijacked by man-in-the-middle attacks is significantly reduced.

Does using HTTPS mean you can rest easy? Definitely not. Last year, I wrote an article about [Charles packet capture](https://supercodepower.com/use-charles), which spent a lot of space introducing HTTPS packet capture. Since an APP developer can use tools on the market to capture packets, reviewers can do even more. Under packet capture tools, most HTTPS data can be captured and hijacked. Below, let's talk about some higher-level content in the HTTPS protocol.

<br />

#### 2.2 HTTPS Certificate Pinning

**HTTPS Certificate Pinning**, also called **HTTPS Certificate Locking**, refers to embedding only certificates from specified domains in the APP, rather than accepting any certificates corresponding to the operating system or browser's built-in CA root certificates.

Through this authorization method, we can ensure the uniqueness and security of communication between the APP and the server. If packet capture software is enabled, without [actively importing the pinned certificate](https://supercodepower.com/use-charles#5证书固定certificate-pinning), effective packet capture is not possible (for specific principles, see my blog post: [Charles Packet Capture Principles](https://supercodepower.com/use-charles#一、charles-抓包原理)). I don't think reviewers have the energy to crack your APP shell to obtain your certificate, so you can hide your hot update bundle this way.

Of course, certificate pinning also has a cost. CA-issued certificates have validity period issues, so the disadvantage is that after certificate renewal, the certificate needs to be re-embedded in the APP.

<br />

#### 2.3 HTTPS Mutual Authentication

When we normally use HTTPS, we generally only do one-way authentication, which is **client authenticates server's authenticity**. Actually, HTTPS supports mutual authentication, which is **supporting server authenticating client's authenticity** (for specific process, see the * part in the diagram below).

![TLS 1.2 Handshake Flowchart](https://image-1255652541.file.myqcloud.com/uPic/TLS12.jpg)

Generally, APPs that enable HTTPS mutual authentication are those with extremely high security requirements, such as financial APPs and anonymous social APPs. Moreover, to achieve mutual authentication, you must embed a public key certificate and private key in the client. But APPs have shell-cracking risks, so you still need to find ways to encrypt and hide these two things (it becomes Russian nesting dolls).

Overall, the cost of implementing HTTPS mutual authentication is still quite high, but once implemented, the security factor is very high. It not only bypasses reviewers' traffic detection but also greatly protects the entire APP's network security.



## 4. Summary

Regarding hot updates, according to Apple's application specifications, hot updates based on JavaScriptCore are completely feasible, but the premise is that you must follow the rules and not leave Apple's control scope. However, App Store's review rules are extremely opaque. Although we are law-abiding citizens, to some extent, we still need to hide the hot update bundle to avoid unnecessary trouble. To hide the hot update bundle, we can think from the perspectives of information source encryption and channel encryption. Overall, it's about flexibly using cryptography knowledge to encrypt network data, prevent detection of abnormal traffic, hide the bundle while also protecting user data security, and reducing the possibility of attacks.

## 5. Recommended Reading

[🍶 Why Does Your Charles Fail to Capture Packets?](https://supercodepower.com/use-charles)

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