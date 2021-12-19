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
---

本教程要做的是一个**零依赖**的**软渲染器**，所以依赖的环境就是 `C++` 的开发环境。

> 注：**零依赖**意味着这个项目不依赖任何第三方库，**软渲染**意味着所有计算都是在 CPU 侧进行的，没有 GPU 参与

`C++` 环境搭建配置有多种方法，最快捷的方式就是直接用高度集成的 IDE，win 电脑可以用 Visual Studio，Mac 用户可以用 Xcode。当然你也可以用 CMake + VSCode 搭建 `C++` 运行环境。

我这个人很懒，平常开发 Xcode 用的又比较多，不想多折腾了，所以直接用 Xcode 构建项目了，小伙伴们千万不要学习我这种坏习惯。

## Xcode 创建 `C++` 项目

### 1.新建项目

1.Xcode 创建 `C++` 项目非常简单，启动 XCode 后点击 `Create a new Xcode project`，创建一个新项目

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-01-12_23-14-30.png)

<br />

2.在跳出的弹框里选择 `Command Line Tool`，然后点击 `Next`

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-01-12_23-15-18.png)

<br />

3.在新的弹窗里填写好 `Product Name`，`Language` 选择 `C++`，然后点击 `Next`

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-01-13_22-20-29.png)

<br />

4.在新的弹窗里选择项目路径，点击 `Create` 创建项目

到这里项目就创建好了。

### 2.配置相对路径

软渲染器需要对硬盘上的一些文件做一些 IO 操作，这时候就需要配置项目的相对路径。

首先按照 `Product` -> `Scheme` -> `Edit Scheme` 的次序，打开一个弹窗。

然后在弹窗里勾选 `Using custom working directory`，并选择项目文件所在路径就可：

![](https://image-1255652541.file.myqcloud.com/uPic/Xnip2021-01-12_23-23-44.png)

### 3.把源代码拖进去

因为本项目是零依赖的，渲染方式是根据源代码生成一张 tga 格式的图片。因为我们是来写软渲染器而不是写图片编码器的，所以直接把[源代码](https://github.com/ssloy/tinyrenderer/blob/909fe20934/tgaimage.cpp)里的 `tgaimage.h` 和 `tgaimage.cpp` 拖到我们的项目工程里就可以了。

加上 main.cpp，现在的工程目录里只有三个文件

```bash
.
├── main.cpp
├── tgaimage.cpp
└── tgaimage.h
```

然后我们在 main.cpp 里写一些简单的代码——创建一个 100x100 的图片，在 (52, 41) 这个坐标上画一个红的的点（`rgb(255, 0, 0)`）


```cpp
#include "tgaimage.h"

const TGAColor red = TGAColor(255, 0, 0, 255);

int main(int argc, char** argv) {
	TGAImage image(100, 100, TGAImage::RGB);
	image.set(52, 41, red);
	image.flip_vertically();
	image.write_tga_file("output/lesson00.tga");
	return 0;
}
```

点击 Xcode 左上角三角形的 build 按钮，如果编译成功并在 `output` 这个文件夹下生成一张名为 `lesson00.tga` 的图片，就说明环境配置成功了！

![](https://image-1255652541.file.myqcloud.com/uPic/reddot.png)

<br />

<br />

今天在图片上画了一个点，明天我们就学习一下如何**高性能**的画一条直线。


<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::


