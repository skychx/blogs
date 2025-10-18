---
slug: webpack_dll
title: 📦 The Painstakingly Learned Webpack DLL Configuration May Already Be Obsolete
authors: skychx

description: If you've read some webpack4 optimization articles, you'll definitely encounter DLL dynamic link libraries. They are remembered by many beginners for their complex configuration. Today, I'll explore webpack DLL configuration step by step from a learner's perspective and finally arrive at a perfect solution.
draft: false
tags: [webpack, 'frontend engineering']
---

If you've read some webpack4 optimization articles, you'll definitely encounter DLL dynamic link libraries. They are remembered by many beginners for their complex configuration. Today, I'll explore webpack DLL configuration step by step from a learner's perspective and finally arrive at a perfect solution.

**The content and viewpoints in this article are different from most webpack4 optimization articles**. If you have different opinions, welcome to discuss with me in the comments section.

{/* truncate */



:::tip Friendly reminder
This article is not a beginner tutorial and won't spend extensive笔墨 describing webpack's basic configuration. Readers should use it together with the tutorial [source code](https://github.com/skychx/blogDemoRepo/tree/master/apps/webpack-optimization).
:::





## 1. Basic Concepts: DLL is Actually Caching

Honestly, when I first saw this **DLL dynamic link library**, I was really intimidated: what is this thing? How have I never heard of it?

As an eager learner, I quickly Googled it and found the standard definition in [Wikipedia](https://zh.wikipedia.org/wiki/动态链接库):

> So-called dynamic linking means making some frequently shared code into DLL files. When executable files call functions within DLL files, the Windows operating system will load the DLL files into memory. The structure of DLL files themselves is executable files, and functions are only linked when the program needs them. Through dynamic linking, memory waste can be greatly reduced.

Sigh, you officials just don't speak plain language.

Let me translate this from a frontend perspective, combining it with webpack:

Specifically for webpack, it means pre-packaging commonly used but time-consuming code in advance (such as react, react-dom), naming it DLL. In subsequent packaging, it skips the original unpackaged code and directly uses the DLL. This way, build time is shortened, improving webpack packaging speed.

I stared at the sentence above for three minutes. What DLL, what dynamic link library - in the frontend world, isn't this just **caching**! It's all trading space for time.

> Note: Here, it can be narrowly understood as trading space for time. If we really want to explore the knowledge behind `dll`: **dynamic link libraries** and **static link libraries**, that involves compiler knowledge again, and explaining it specifically would be another new article, so let's put that aside for now.

Let's compare DLL and the network caching we often encounter in frontend. A table makes it clear:

| DLL                                         | Cache                                   |
| ------------------------------------------- | -------------------------------------- |
| 1. Package common code into DLL files and store on disk | 1. Store commonly used files on disk/memory |
| 2. Dynamically link DLL files on second packaging, don't repackage | 2. Directly read cache on second load, don't re-request |
| 3. Shortened packaging time                 | 3. Shortened loading time               |

So in the frontend world, DLL is just another type of cache.

## 2. Manual DLL Configuration: Too Many Steps to Remember

Let's start without configuration first. Let's imagine, if you were asked to **manually create and manage cache**, what would you do?

I think everyone's approach would generally be like this:

1. On the first request, **store** the requested content
2. Establish a **mapping table**. When subsequent requests occur, first check this mapping table to see if the requested content has been cached. If so, load the cache; otherwise, follow the normal request process (this is the so-called **cache hit** problem)
3. After hitting the cache, directly take content from the cache and hand it to the program for processing

The main process is just these 3 steps. If you want to make it more complex, you can add weights, expiration times, multi-level caching, etc., but the main process is the 3 steps above.

Generally, when we're developing, browsers and HTTP protocols have already encapsulated these operations for us, so we just remember a few parameters and tune them; but webpack dll is different. It requires us to manually implement the above 3 steps, which is very boring + tedious.

The code below is quite messy because I don't intend to properly explain these convoluted configurations. For the specific structure, it's best to look at the example [source code](https://github.com/skychx/blogDemoRepo/tree/master/apps/webpack-optimization) I posted on github. **It's okay if you don't understand, there are better solutions later**.



:::note
If you find it annoying, just skip the content below
:::



**Step 1**, we first need to create DLL files. This is equivalent to storing our first request content, and then we need to create a mapping table to tell the program what files we made into DLLs (this is equivalent to **Step 2**):



First, let's write a packaging script to create DLL files, aiming to package `react` and `react-dom` into DLL files:

```javascript
// File directory: configs/webpack.dll.js
// Code is too long, you can skip reading

'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: {
        react: ['react', 'react-dom'],
    },
    // This outputs DLL files
    output: {
        path: path.resolve(__dirname, '../dll'),
        filename: '_dll_[name].js',
        library: '_dll_[name]',
    },
    // This outputs mapping table
    plugins: [
        new webpack.DllPlugin({
            name: '_dll_[name]', // name === output.library
            path: path.resolve(__dirname, '../dll/[name].manifest.json'),
        })
    ]
};
```



Now that the packaging script is written, we need to run it, right? So we write a run script in the `scripts` tag of `package.json`, so we can package DLL files by running `npm run build:dll`:

```javascript
// package.json

{
  "scripts": {
    "build:dll": "webpack --config configs/webpack.dll.js",
  },
}
```



**Step 3**, link DLL files, which means telling webpack which DLL files can be hit, and the configuration is also a big chunk:

```javascript
// File directory: configs/webpack.common.js
// Code is too long, you can skip reading

const path = require('path');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin'); // As the name suggests, adds resources to html, this plugin adds dll to index.html
const webpack = require('webpack');
module.exports = {
  // ......
  plugins: [
    new webpack.DllReferencePlugin({
      // Note: DllReferencePlugin's context must be at the same level as package.json, otherwise linking will fail
      context: path.resolve(__dirname, '../'),
      manifest: path.resolve(__dirname, '../dll/react.manifest.json'),
    }),
    new AddAssetHtmlPlugin({
      filepath: path.resolve(__dirname, '../dll/_dll_react.js'),
    }),
  ]
}
```



To reduce the secondary packaging time of some large libraries, we wrote a bunch of configuration code in 3 files, being very careful, as if walking on thin ice, and might even fail to link due to scope issues (yes, I'm talking about myself). Configuring dll brings huge psychological pressure. Is there any other way to reduce our mental burden?



## 3. AutoDllPlugin: Free Yourself from Configuration Burden

In section 2, I **aggressively tried to discourage you**, just to introduce this plugin: [autodll-webpack-plugin](https://github.com/asfktz/autodll-webpack-plugin). This plugin integrates the above 3 chunks of code together, freeing us from tedious configuration. Let's see how to use it:



```javascript
// File directory: configs/webpack.common.js

const path = require('path');
const AutoDllPlugin = require('autodll-webpack-plugin'); // Step 1: Import DLL automatic link library plugin

module.exports = {
  // ......
  plugins: [
        // Step 2: Configure files to be packaged as DLL
        new AutoDllPlugin({
            inject: true, // Set to true to inject DLL bundles into index.html
            filename: '[name].dll.js',
            context: path.resolve(__dirname, '../'), // AutoDllPlugin's context must be at the same level as package.json, otherwise linking will fail
            entry: {
                react: [
                    'react',
                    'react-dom'
                ]
            }
        })
  ]
}
```



The usage of `autodll-webpack-plugin` is very similar to other webpack `plugin` usage methods. Compared to manually importing dll methods, it's much simpler, and this plugin was previously used by vue-cli, so its quality is quite stable. Everyone can use it with confidence.



## 4. Abandoning DLL: The Common Choice of Vue & React Officials

In section 3, I said `autodll-webpack-plugin` was previously used by vue-cli. Does that mean it's not used now? Are there bugs? That's really not the case.

When learning webpack, to learn from the webpack configurations of excellent frameworks in the industry, I specifically looked at the source code of vue-cli and create-react-app, but didn't find any trace of dll configuration.

This is very strange. I had previously looked at some nuxt.js 1.0 source code, which did have dll configuration code. Logically, vue-cli should also have it, so I guessed that dll was removed during some upgrade. So I started looking for commit records, and sure enough, I found it:

![](https://image-1255652541.file.myqcloud.com/images/20190924233946.png)

> In black and white, the three big words "remove DLL option" are clearly written



So what's the reason? In this [issue](https://github.com/vuejs/vue-cli/issues/1205), You Yuxi explained the reason for removal:

![](https://image-1255652541.file.myqcloud.com/images/20190924233941.png)



> `dll` option will be removed. Webpack 4 should provide good enough perf and the cost of maintaining DLL mode inside Vue CLI is no longer justified.
>
> dll configuration will be removed because Webpack 4's packaging performance is good enough, and there's no longer a need to continue maintaining dll in Vue CLI.



Similarly, in this [PR](https://github.com/facebook/create-react-app/pull/2710), create-react-app gave a similar explanation: **webpack 4 has better packaging performance than dll**.



![](https://image-1255652541.file.myqcloud.com/images/20190924233947.png)



So, if the project is on webpack 4, using dll doesn't bring much benefit. I tried it with actual project code, and adding dll might bring a 1-2s speed improvement, which can be considered negligible for the overall packaging time.

Vue and React officials stopped using dll in 2018, and now 2019 is almost over, so **what I said above is useless, you don't need to learn it**, do you feel relieved (aggressively hinting for likes)?



## 5. Plugins Better Than DLL

DLL acceleration is not obvious. Are there better alternatives? In the README.md of [AutoDllPlugin](https://github.com/asfktz/autodll-webpack-plugin), they recommend [HardSourceWebpackPlugin](https://github.com/mzgoddard/hard-source-webpack-plugin), which has simpler initial configuration, requiring only one line of code:



```javascript
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
  // ......
  plugins: [
    new HardSourceWebpackPlugin() // <- Just add this line of code
  ]
}
```



How obvious is the acceleration of this plugin? I tested it with the example code from this article. The image below shows the normal packaging time, about 900 ms:

![](https://image-1255652541.file.myqcloud.com/images/20190924233943.png)



After adding dll optimization, the packaging time is 507 ms, shortened by about 400 ms:

![](https://image-1255652541.file.myqcloud.com/images/20190924233944.png)



Using only HardSourceWebpackPlugin, the packaging time is shortened to 253 ms:

![](https://image-1255652541.file.myqcloud.com/images/20190924233942.png)



Looking at the relevant [documentation](https://github.com/webpack/webpack/issues/6527), it seems this technology was directly put into webpack 5, out of the box. So, although you don't need to learn dll configuration, **webpack 5 is coming**......

![](https://image-1255652541.file.myqcloud.com/images/Xnip2019-09-22_23-46-29.png)





## 6. Written at the End

It's hard to say this article is a tutorial. It's more of a record of my exploration process in learning webpack. Honestly, after I manually configured dll, I felt quite awesome that I could configure such complex configurations well.

When I later found `autodll-webpack-plugin` and discovered that dll had been abandoned, I was actually a bit disappointed, feeling that my previous efforts were wasted, and couldn't help but have the idea of "can't learn anymore". But when I carefully thought about the principles of dll, I realized it's just that one thing - trading space for time, just with more complex configuration.

So this also reminds us that when learning new knowledge, don't focus on process configuration and parameter tuning. Because **processes will eventually be simplified, parameters (APIs) will eventually be upgraded**. We need to grasp the big picture and let small things go, focusing energy on the most core content, because core ideas are the least likely to become outdated.





## 7. Reference Reading



[Essential for interviews! 5 most confusing knowledge points in webpack](https://juejin.im/post/5cede821f265da1bbd4b5630)

[webpack official documentation](https://webpack.docschina.org/guides/)

[autodll-webpack-plugin](https://github.com/asfktz/autodll-webpack-plugin)

[HardSourceWebpackPlugin](https://github.com/mzgoddard/hard-source-webpack-plugin)







<br />

<br />

<br />

<br />

:::note A small note
Welcome to follow the official account: **卤代烃实验室**: Focus on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::