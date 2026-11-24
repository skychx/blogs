---
id: day1-env-setup
title: day1：环境搭建
sidebar_label: day1：环境搭建
description: 环境搭建
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day1：环境搭建
  - TypeScript
  - canvas
  - Bun
---

import { RendererDemo } from '../../src/components/rendererDemo';

本教程要做的是一个**零依赖**的**软渲染器**，所以依赖的环境就是 `TypeScript` 的运行环境。

> 注：**零依赖**意味着这个项目不依赖任何第三方库，**软渲染**意味着所有计算都是在 CPU 侧进行的，没有 GPU 参与

[tinyrenderer](https://github.com/ssloy/tinyrenderer) 原教程是用 `C++` 写的，渲染结果会保存成一张 tga 格式的图片，想看效果还得专门找个能打开 tga 的看图软件。我这里把它换成了 `TypeScript` + `canvas`，主要有这么几个考虑：

- **上手简单**：不用装 Xcode、Visual Studio 这些大家伙，有个浏览器就能看到渲染结果
- **canvas 正合适**：canvas 的 `ImageData` 本身就是一块像素内存，拿来当软渲染器的「画布」再合适不过了
- **语法友好**：TS 的语法大家都熟，不用为了学图形学再去啃一遍 C++

不过这里要先说明一点：我们**只把 canvas 当成一块显示像素的屏幕**，不会用它自带的 `lineTo`、`fillRect` 这些绘图 API，要是用了它们，那就不叫造轮子了。所有的点、线、三角形，都是我们自己一个像素一个像素算出来的。

运行环境我选的是 [Bun](https://bun.sh/)，它能直接运行 TS 文件，还自带了打包工具和开发服务器，一个工具就全搞定了，不用再去配 webpack、Vite 这些东西。

> 本文源码 👉：[toy-renderer-ts/days/day01](https://github.com/skychx/toy-renderer-ts/tree/main/days/day01)

## 1.安装 Bun

Bun 的安装非常简单，macOS 和 Linux 用户在终端里执行：

```bash
curl -fsSL https://bun.sh/install | bash
```

Windows 用户在 PowerShell 里执行：

```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

装好以后执行一下 `bun --version`，能打印出版本号，就说明安装成功了。

## 2.把项目跑起来

### 2.1 下载代码

我已经把每一天的代码都整理好放在 GitHub 上了，直接 clone 下来就能跑：

```bash
git clone https://github.com/skychx/toy-renderer-ts.git
cd toy-renderer-ts
bun install
bun dev
```

> 注：`bun install` 只装了 Bun 的类型声明（`@types/bun`），给编辑器做代码提示用，渲染器本身不依赖任何第三方库

然后用浏览器打开 `http://localhost:8080`，就能看到每一天的渲染结果了。

### 2.2 目录结构

项目的目录结构是这样的：

```bash
.
├── days            # 每一天的代码
│   ├── day01
│   │   ├── frame.ts
│   │   ├── index.html
│   │   └── main.ts
│   ├── day02
│   └── ...
├── obj             # 模型和贴图
├── index.html      # 目录页
└── server.ts       # 本地开发服务器
```

`days` 下面每一天的文件夹都是一份完整的、能单独运行的代码，比如 `day05` 里放的就是第五天结束时的全部代码。

像 `frame.ts`、`math.ts` 这样的工具文件，每天都会复制一份过去再修改。代码虽然有重复，但好处是看哪一天就只用看那一个文件夹；想知道某一天改了什么，直接 diff 一下前后两个文件夹就行：

```bash
diff -r days/day04 days/day05
```

### 2.3 开发服务器

`server.ts` 是本地开发服务器，一共就二十来行：

```ts
import home from './index.html';

// 目录页挂在根路径上
const routes: Record<string, Bun.HTMLBundle> = { '/': home };

// 每一天的页面挂在 /day01、/day02 这样的路径上
// Bun 会自动编译 html 里引用的 TS 文件，改完代码刷新一下页面就行
for (const file of new Bun.Glob('days/*/index.html').scanSync()) {
  const day = file.split('/')[1];
  routes[`/${day}`] = (await import(`./${file}`)).default;
}

const server = Bun.serve({
  port: 8080,
  routes,
  development: true,
  // routes 没匹配上的请求都会走到这里：把 obj 目录下的模型和贴图原样返回
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    if (path.startsWith('/obj/')) {
      const file = Bun.file(`.${path}`);
      if (await file.exists()) {
        return new Response(file);
      }
    }
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`打开 ${server.url} 看看效果吧`);
```

它只做了两件事：

- 把每一天的 `index.html` 挂到 `/day01`、`/day02` 这样的路径上，Bun 会自动编译 html 里引用的 TS 文件，改完代码刷新一下页面就能看到效果
- 把 `obj` 目录下的模型和贴图文件原样返回，后面我们用 `fetch` 读取模型文件的时候会用到

## 3.准备一块画布

### 3.1 ImageData

tinyrenderer 原版用的是一个叫 `TGAImage` 的类，它最核心的功能只有一个：**给某个坐标的像素设置颜色**。我们用 canvas 实现一个一样的东西就行。

canvas 的 `ImageData` 里有一个 `data` 数组，按「从左到右、从上到下」的顺序存着每个像素的颜色。每个像素占 4 个字节，依次是 r、g、b、a（a 是透明度，取值范围也是 0~255），所以坐标 $(x, y)$ 的像素在数组里的位置就是：

$$
index = (y \times width + x) \times 4
$$

### 3.2 坐标系：直接用 canvas 的

这里有个小细节需要提前说清楚：**canvas 的原点在左上角，y 轴朝下**；而我们在数学课上习惯的坐标系，原点在左下角，y 轴朝上。

![canvas 的坐标系 vs 我们习惯的坐标系](/img/toy-renderer/day1/coordinate.svg)

同样是 (2, 1) 这个点，在两个坐标系里的位置完全不一样。tinyrenderer 原版选的是数学上的坐标系，所以它的 C++ 代码在保存图片前都要调用一次 `image.flip_vertically()`，把整张图上下翻转一次。

我们不折腾这一套：**整套教程直接采用 canvas 原生的坐标系，原点在左上角，y 轴朝下**。好处是 `y` 正好就是像素所在的行号，上面的下标公式拿来就能用，不用做任何换算；代价是后面做视口变换时，要把 $[-1, 1]$ 里 y = 1 的「上方」映射到屏幕的第 0 行，公式里会出现一个负号。习惯就好——WebGPU、DirectX 这些更「现代」的图形 API，屏幕坐标也都是 y 朝下的。

### 3.3 Frame 类

把上面这些封装一下，就是我们的画布 `Frame`（帧缓冲，Framebuffer）：

```ts
// 颜色，依次是 r、g、b 三个分量，取值范围都是 0~255
export type Color = [number, number, number];

export class Frame {
  width: number;
  height: number;
  // canvas 的像素数据，每个像素占 4 个字节，依次是 r、g、b、a
  imageData: ImageData;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.imageData = new ImageData(width, height);
    this.clear([0, 0, 0]);
  }

  // 用一种颜色填满整个画布
  clear(color: Color) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.set(x, y, color);
      }
    }
  }

  // 给 (x, y) 处的像素上色
  set(x: number, y: number, color: Color) {
    // 像素的坐标只能是整数，小数直接舍掉
    x = Math.floor(x);
    y = Math.floor(y);
    // 超出画布的点直接忽略
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return;
    }

    // 坐标系和 canvas 原生的一致：原点在左上角，y 轴朝下，y 正好就是像素所在的行号
    const i = (y * this.width + x) * 4;

    const data = this.imageData.data;
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = 255; // 不透明
  }

  // 把画布上的像素显示到 canvas 元素上
  render(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.getContext('2d')!.putImageData(this.imageData, 0, 0);
  }
}
```

代码很简单，有两个地方提一下：

- 像素坐标只能是整数，所以 `set` 里先用 `Math.floor` 把小数舍掉。`data` 是一个 `Uint8ClampedArray`，如果拿小数当下标去赋值，不会报错，但也什么都不会发生，这种 bug 查起来非常头疼
- 超出画布的点直接忽略。后面画三角形、做透视的时候，难免会算出一些在画布外面的点

## 4.画一个点

画布有了，我们来画第一个点。我们创建一个 100x100 的画布，在 (52, 41) 这个坐标上画一个红色的点（`rgb(255, 0, 0)`）——按左上角的坐标算，就是从左往右数 52 个像素、再从上往下数 41 个像素：

```ts
import { Frame, Color } from './frame';

const red: Color = [255, 0, 0];

// 创建一个 100×100 的画布，在 (52, 41) 这个坐标上画一个红色的点
const frame = new Frame(100, 100);
frame.set(52, 41, red);

frame.render(document.querySelector<HTMLCanvasElement>('#dot')!);
```

html 里放一个 canvas，再把 main.ts 引进来：

```html
<canvas id="dot" style="width: 400px; image-rendering: pixelated"></canvas>
<script type="module" src="./main.ts"></script>
```

100x100 的画布在屏幕上实在太小了，所以这里用 CSS 把它放大了 4 倍显示，`image-rendering: pixelated` 可以让放大后的像素保持清晰的小方块，不会被浏览器模糊处理。

执行 `bun dev`，打开 `http://localhost:8080/day01`，如果能看到下面这个红点，就说明环境配置成功了！

<RendererDemo src="day01/dot" title="在 (52, 41) 画的红点" size={400} />

<br />

<br />

今天在画布上画了一个点，明天我们就学习一下如何**高性能**的画一条直线。


<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
