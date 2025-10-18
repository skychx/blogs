---
slug: webpack_five_knowledge_points
title: 📦 5 Most Confusing Knowledge Points in Webpack
authors: skychx

description: In webpack, what's the difference between module, chunk and bundle? What's the difference between filename and chunkFilename? What do webpackPrefetch, webpackPreload and webpackChunkName actually do? What are the differences between hash, chunkhash, contenthash? What do eval, cheap, inline and module mean in source-map?
draft: false
tags: [webpack, 'frontend engineering']
---

![image-20200518210532171](https://image-1255652541.file.myqcloud.com/uPic/image-20200518210532171.png)

Today I'm mainly sharing some **confusing knowledge points in webpack, which are also common interview topics**. I've summarized content scattered across documentation and tutorials, which appears to be **unique on the entire internet**. You can **bookmark this** for easy reference and learning later.

{/* truncate */}

A couple of days ago, while optimizing the company's code packaging project, I crammed a lot of webpack4 knowledge. If you had asked me to learn webpack a few years ago, I would have definitely refused. I had seen webpack's old documentation before, which was even more rudimentary than our internal project's documentation.

But I recently looked at webpack4's documentation and found that webpack's official [guide](https://webpack.docschina.org/guides/) is actually quite well-written. Following this guide to learn webpack4 basic configuration is completely not a problem. Friends who want to systematically learn webpack can take a look.

<br/>

:::tip Friendly reminder
Friendly reminder: This article is not a beginner tutorial and won't spend extensive笔墨 describing webpack's basic configuration. Readers should use it together with the tutorial [source code](https://github.com/skychx/blogDemoRepo/tree/master/apps/webpack-confuse).
:::

<br/>

## 1. In webpack, what's the difference between `module`, `chunk` and `bundle`?

Honestly, when I first started reading webpack documentation, I was confused by these 3 terms. I felt they were all talking about packaged files, but sometimes it was chunk, sometimes bundle, and I gradually got lost in the details. So we need to step back and look at these terms from a macro perspective.

The webpack official website provides [explanations](https://webpack.docschina.org/glossary) for chunk and bundle, but honestly they're too abstract. Let me give you an example to provide a **visualized** explanation.

First, let's write our business code in the src directory, including index.js, utils.js, common.js and index.css - 4 files. The directory structure is as follows:

```bash
src/
├── index.css
├── index.html # This is HTML template code
├── index.js
├── common.js
└── utils.js
```

Write some simple styles in index.css:

```css
body {
    background-color: red;
}
```

Write a square function in utils.js:

```javascript
export function square(x) {
    return x * x;
}
```

Write a log utility function in common.js:

```javascript
module.exports = {
  log: (msg) => {
    console.log('hello ', msg)
  }
}
```

Make some simple modifications to index.js, importing the css file and common.js:

```javascript
import './index.css';
const { log } = require('./common');

log('webpack');
```

Webpack configuration is as follows:

```javascript
{
    entry: {
        index: "../src/index.js",
        utils: '../src/utils.js',
    },
    output: {
        filename: "[name].bundle.js", // Output index.js and utils.js
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader, // Create a link tag
                    'css-loader', // css-loader is responsible for parsing CSS code, handling dependencies in CSS
                ],
            },
        ]
    }
    plugins: [
        // Use MiniCssExtractPlugin to extract CSS files, introducing style files in the form of link tags
        new MiniCssExtractPlugin({
            filename: 'index.bundle.css' // Output css file name is index.css
        }),
    ]
}
```

Let's run webpack and see the packaging results:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3g9kn79ntj30o6060ab8.jpeg)

We can see that index.css and common.js are imported in index.js, and the generated index.bundle.css and index.bundle.js both belong to chunk 0. Since utils.js is packaged independently, its generated utils.bundle.js belongs to chunk 1.

Still a bit confusing? I made a diagram that you'll definitely understand at a glance:

![image-20200518210532171](https://image-1255652541.file.myqcloud.com/uPic/image-20200518210532171.png)

Looking at this diagram makes it very clear:

1. For a piece of code with the same logic, when we write files one by one, whether they are ESM, commonJS or AMD, they are all **modules**;
2. When our written module source files are passed to webpack for packaging, webpack will generate **chunk** files based on file reference relationships, and webpack will perform some operations on these chunk files;
3. After webpack processes the chunk files, it will finally output **bundle** files. These bundle files contain the final source files after loading and compilation, so they can run directly in the browser.

Generally, one chunk corresponds to one bundle, such as `utils.js -> chunks 1 -> utils.bundle.js` in the diagram above; but there are exceptions, for example, in the diagram above, I used `MiniCssExtractPlugin` to extract the `index.bundle.css` file from chunks 0.

### 1.1 One-sentence summary:

`module`, `chunk` and `bundle` are actually three names for the same logical code in different transformation scenarios:

What we write directly are modules, what webpack processes are chunks, and what's finally generated for direct browser execution are bundles.

<br/>

## 2. What's the difference between `filename` and `chunkFilename`?

### 2.1 filename

filename is a very common configuration, corresponding to the input files in `entry`, the output file name after webpack packaging. For example, with the configuration below, the generated file name is `index.min.js`.

```javascript
{
    entry: {
        index: "../src/index.js"
    },
    output: {
        filename: "[name].min.js", // index.min.js
    }
}
```

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3evh2dfwjj30m4034q3e.jpeg)

### 2.2 chunkFilename

`chunkFilename` refers to the name of `chunk` files that are not listed in `entry` but need to be packaged. Generally, this `chunk` file refers to code that needs to be **lazy-loaded**.

For example, let's write lazy loading code for `lodash` in our business code:

```javascript
// File: index.js

// Create a button
let btn = document.createElement("button");
btn.innerHTML = "click me";
document.body.appendChild(btn);

// Asynchronously load code
async function getAsyncComponent() {
    var element = document.createElement('div');
    const { default: _ } = await import('lodash');

    element.innerHTML = _.join(['Hello!', 'dynamic', 'imports', 'async'], ' ');

    return element;
}

// When clicking the button, lazy load lodash and display Hello! dynamic imports async on the webpage
btn.addEventListener('click', () => {
    getAsyncComponent().then(component => {
        document.body.appendChild(component);
    })
})
```

Our `webpack` configuration remains the same as before:

```javascript
{
    entry: {
        index: "../src/index.js"
    },
    output: {
        filename: "[name].min.js", // index.min.js
    }
}
```

The packaging result at this time is as follows:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3ew6tebfqj30m6044t9c.jpeg)

This `1.min.js` is the asynchronously loaded `chunk` file. The [documentation](https://webpack.docschina.org/configuration/output/#output-chunkfilename) explains it this way:

> `output.chunkFilename` defaults to using `[id].js` or the value inferred from `output.filename` (`[name]` will be pre-replaced with `[id]` or `[id].`)

The documentation is too abstract. Let's combine it with the above example:

The output file name for `output.filename` is `[name].min.js`, `[name]` is inferred as `index` based on the `entry` configuration, so the output is `index.min.js`;

Since `output.chunkFilename` is not explicitly specified, `[name]` will be replaced with the `id` number of the `chunk` file. Here the file's `id` number is 1, so the file name is `1.min.js`.

If we explicitly configure `chunkFilename`, files will be generated according to the configured name:

```javascript
{
    entry: {
        index: "../src/index.js"
    },
    output: {
        filename: "[name].min.js",  // index.min.js
        chunkFilename: 'bundle.js', // bundle.js
    }
}
```

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3ewki4ycbj30mq044aap.jpeg)

### 2.3 One-sentence summary:

`filename` refers to the name of files that are **listed in** `entry` and output after packaging.

`chunkFilename` refers to the name of files that are **not listed in** `entry` but need to be packaged.

<br/>

## 3. What do `webpackPrefetch`, `webpackPreload` and `webpackChunkName` actually do?

These terms are actually from webpack's [magic comments](https://webpack.docschina.org/api/module-methods/#magic-comments). The documentation mentions 6 configurations, and these configurations can be **combined**. Let's talk about the three most commonly used configurations.

### 3.1 webpackChunkName

Earlier, I gave an example of asynchronously loading `lodash`. We finally hardcoded `output.chunkFilename` to `bundle.js`. In our business code, it's impossible to only asynchronously load one file, so hardcoding is definitely not feasible. But when written as `[name].bundle.js`, the packaged file has an unclear meaning and low recognition chunk `id`.

```javascript
{
    entry: {
        index: "../src/index.js"
    },
    output: {
        filename: "[name].min.js",  // index.min.js
        chunkFilename: '[name].bundle.js', // 1.bundle.js, chunk id is 1, low recognition
    }
}
```

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3ez57b6bfj30mo044js1.jpeg)

This is where `webpackChunkName` comes in handy. When we `import` files, we can give alias names to chunk files in the form of comments within the `import`:

```javascript
async function getAsyncComponent() {
    var element = document.createElement('div');

    // Add comment /* webpackChunkName: "lodash" */ in the import parentheses to give an alias to the imported file
    const { default: _ } = await import(/* webpackChunkName: "lodash" */ 'lodash');

    element.innerHTML = _.join(['Hello!', 'dynamic', 'imports', 'async'], ' ');

    return element;
}
```

The packaged files generated at this time look like this:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3eza2hnfvj30si03yq3r.jpeg)

Now the question arises: `lodash` is the name we gave, so logically it should generate `lodash.bundle.js`. What's the `vendors~` prefix?

Actually, webpack lazy loading is implemented using a built-in plugin [SplitChunksPlugin](https://webpack.docschina.org/plugins/split-chunks-plugin). This plugin has some [default configuration items](https://webpack.docschina.org/plugins/split-chunks-plugin/#optimization-splitchunks), such as `automaticNameDelimiter`, whose default separator is `~`, which is why this symbol appears in the final file name. I won't elaborate on this content; interested students can research it themselves.

### 3.2 webpackPrefetch and webpackPreload

These two configurations are called pre-fetch (Prefetch) and pre-load (Preload) respectively. There are some subtle differences between them. Let's first talk about `webpackPreload`.

In the lazy loading code above, we only trigger the asynchronous loading of `lodash` when clicking the button. At this time, a `script` tag is dynamically generated and loaded into the `head`:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f073l8ndj30v80aa770.jpeg)

If we add `webpackPrefetch` when we `import`:

```javascript
...

const { default: _ } = await import(/* webpackChunkName: "lodash" */ /* webpackPrefetch: true */ 'lodash');

...
```

It will pre-fetch the lodash code in the form of `<link rel="prefetch" as="script">`:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f0clldalj30tw0a2417.jpeg)

This asynchronously loaded code doesn't need to be manually triggered by clicking the button. Webpack will load the `lodash` file during idle time after the parent chunk completes loading.

`webpackPreload` preloads resources that might be needed under the current navigation. Its main differences from `webpackPrefetch` are:

- preload chunks start loading in parallel when the parent chunk loads. prefetch chunks start loading after the parent chunk finishes loading.
- preload chunks have medium priority and download immediately. prefetch chunks download when the browser is idle.
- preload chunks are requested immediately in the parent chunk for the current moment. prefetch chunks are used for some future moment

### 3.3 One-sentence summary:

`webpackChunkName` gives aliases to pre-loaded files, `webpackPrefetch` downloads files when the browser is idle, and `webpackPreload` downloads files in parallel when the parent chunk loads.

<br/>

## 4. What are the differences between `hash`, `chunkhash`, `contenthash`?

First, let me give some background. Hash is generally used in combination with CDN caching. If the file content changes, the corresponding file hash value will also change, the corresponding HTML referenced URL address will also change, triggering the CDN server to pull corresponding data from the source server, thereby updating the local cache.

### 4.1 hash

hash calculation is related to the entire project's build. Let's make a simple demo.

Using the demo code from case 1, the file directory is as follows:

```bash
src/
├── index.css
├── index.html
├── index.js
└── utils.js
```

The core webpack configuration is as follows (omitting some module configuration information):

```javascript
{
    entry: {
        index: "../src/index.js",
        utils: '../src/utils.js',
    },
    output: {
        filename: "[name].[hash].js",  // Change to hash
    },

    ......

    plugins: [
        new MiniCssExtractPlugin({
            filename: 'index.[hash].css' // Change to hash
        }),
    ]
}
```

The generated file names are as follows:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f1suvmekj30tk08otat.jpeg)

We can find that the generated file's hash is exactly the same as the project's build hash.

### 4.2 chunkhash

Because hash is the project's build hash value, if there are some changes in the project, hash will definitely change. For example, if I changed the code in utils.js, although the code in index.js hasn't changed, they all use the same hash. Once the hash changes, the cache definitely becomes invalid, which makes it impossible to implement CDN and browser caching.

chunkhash solves this problem. It performs dependency file parsing based on different entry files (Entry), builds corresponding chunks, and generates corresponding hash values.

Let's give another example. Let's modify the file in utils.js:

```javascript
export function square(x) {
    return x * x;
}

// Add cube() function for calculating cubes
export function cube(x) {
    return x * x * x;
}
```

Then change all hash in webpack to chunkhash:

```javascript
{
    entry: {
        index: "../src/index.js",
        utils: '../src/utils.js',
    },
    output: {
        filename: "[name].[chunkhash].js", // Change to chunkhash
    },

    ......

    plugins: [
        new MiniCssExtractPlugin({
            filename: 'index.[chunkhash].css' // Change to chunkhash
        }),
    ]
}
```

The build result is as follows:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f23xxxo8j30ts050q4b.jpeg)

We can see that the hash for chunk 0 are all the same, while the hash for chunk 1 is different from the above.

Assuming I remove the cube() function from utils.js and package again:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f26rwpnqj30tc04ywfu.jpeg)

By comparison, we can find that only the hash of chunk 1 has changed, while the hash of chunk 0 remains the same.

### 4.3 contenthash

Let's go a step further. index.js and index.css belong to the same chunk. If the content of index.js changes but index.css doesn't change, their hashes both change after packaging, which is a waste for the CSS file. How to solve this problem?

contenthash will create a unique hash based on resource content, meaning if the file content doesn't change, the hash doesn't change.

Let's modify the webpack configuration:

```javascript
{
    entry: {
        index: "../src/index.js",
        utils: '../src/utils.js',
    },
    output: {
        filename: "[name].[chunkhash].js",
    },

    ......

    plugins: [
        new MiniCssExtractPlugin({
            filename: 'index.[contenthash].css' // Change to contenthash here
        }),
    ]
}
```

We made 3 modifications to the index.js file (just changed the output content of the log function, too simple to write), and then built separately. The result screenshots are as follows:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f2ih0bqyj30tm050wfu.jpeg)

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f2ifrmbhj30te04yabg.jpeg)

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3f2ifm1v9j30t404ygmy.jpeg)

We can find that the CSS file's hash hasn't changed at all.

### 4.4 One-sentence summary:

hash calculation is related to the entire project's build;

chunkhash calculation is related to the same chunk content;

contenthash calculation is related to the file content itself.

<br/>

## 5. What do `eval`, `cheap`, `inline` and `module` mean in `source-map`?

source-map, with "map" in it, obviously means mapping. source-map is a **mapping file between source code and transformed code**. The specific principles involve a lot of content. Interested students can search for themselves; I won't elaborate here.

Let's first see how many types of source-map there are from the official website:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3gv1pguatj30u20u0jzg.jpeg)



emmmm, 13 types, I'm out.

If you look more carefully, you'll find that most of these 13 types are permutations and combinations of the 4 words `eval`, `cheap`, `inline` and `module`. I made a simple table that's much more straightforward than the official website:

| Parameter | Parameter Explanation |
| ------ | ------------------------------------------------------------ |
| eval   | Packaged modules all use `eval()` for execution, line mapping might be inaccurate; doesn't generate independent map files |
| cheap  | map mapping only shows lines not columns, ignores source maps from loaders |
| inline | Mapping files are encoded in base64 format, added at the end of bundle files, doesn't generate independent map files |
| module | Adds mapping for loader source maps and third-party modules |

Still don't understand? Let's look at a demo.

Let's make some webpack configurations. devtool is specifically for configuring source-map.

```javascript
......

{
    devtool: 'source-map',
}

......
```

For simplicity, let's only write one line of code in index.js. To get error information, we'll intentionally misspell:

```javascript
console.lg('hello source-map !') // log written as lg
```

Let's try several common configurations:

### 5.1 source-map

source-map is the most comprehensive and will generate independent map files:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3gvxig4qsj30pm04s3zf.jpeg)

Note the cursor position in the image below. source-map will display error **row and column** information:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3gvxwshtqj30i201kaa6.jpeg)

### 5.2 cheap-source-map

cheap means inexpensive. It won't generate column mapping, and accordingly the volume will be much smaller. Let's compare it with source-map's packaging result - it's only 1/4 of the original.

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3gwjzzvjyj30pm04wgmj.jpeg)

### 5.3 eval-source-map

eval-source-map will package and run modules using eval() function, doesn't generate independent map files, and will display error **row and column** information:

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3gw4w3acqj30no04ajs2.jpeg)

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3gvxwshtqj30i201kaa6.jpeg)

```javascript
// index.bundle.js file

!function(e) {
    // ......
    // Omit unimportant code
    // ......
}([function(module, exports) {
    eval("console.lg('hello source-map !');//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi4vc3JjL2luZGV4Mi5qcz9mNmJjIl0sIm5hbWVzIjpbImNvbnNvbGUiLCJsZyJdLCJtYXBwaW5ncyI6IkFBQUFBLE9BQU8sQ0FBQ0MsRUFBUixDQUFXLG9CQUFYIiwiZmlsZSI6IjAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zb2xlLmxnKCdoZWxsbyBzb3VyY2UtbWFwICEnKSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///0\n")
}
]);
```

### 5.4 inline-source-map

Mapping files are encoded in base64 format, added at the end of bundle files, doesn't generate independent map files. After adding the map file, we can clearly see that the package volume has increased;

![](https://image-1255652541.file.myqcloud.com/uPic/006tNc79ly1g3gwa1dyjmj30nm0423z5.jpeg)

```javascript
// index.bundle.js file

!function(e) {

}([function(e, t) {
    console.lg("hello source-map !")
}
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4uL3NyYy9pbmRleDIuanMiXSwibmFtZXMiOlsiaW5zdGFsbGVkTW9kdWxlcyIsIl9fd2VicGFja19yZXF1aXJ......

// base64 is too long, I deleted part of it, get the spirit
```

### 5.5 Common configurations:

The examples above are demonstrations. Combining [official recommendations](https://webpack.docschina.org/configuration/devtool/#%E5%AF%B9%E4%BA%8E%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83) and practical experience, the commonly used configurations are actually these:

**1. source-map**

Comprehensive with everything, but because it has everything, it might make webpack build time longer. Use depending on the situation.

**2. cheap-module-eval-source-map**

This is generally recommended for development environments (dev), making a good balance between build speed and error reminders.

**3. cheap-module-source-map**

Generally, production environments don't configure source-map. If you want to catch online code errors, you can use this

## Written at the end

This article is pretty much finished here. Later, I will also write some articles about webpack packaging optimization.

From learning webpack to this output, it took about 2 weeks. Personally, I feel that webpack is ultimately just a part of the toolchain. Many configuration contents don't need to be memorized like JavaScript's built-in methods. You can write a comprehensive demo yourself, know what configuration items can roughly do, and just look them up when you need to use them.

Therefore, I summarized this article about webpack's confusing knowledge points. Everyone can click to bookmark it. When preparing for interviews or reviewing in the future, you can understand the general idea by reading it.

<br />

<br />

<br />

<br />

:::note A small note
Welcome to follow the official account: **卤代烃实验室**: Focus on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::