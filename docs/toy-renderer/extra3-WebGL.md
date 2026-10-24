---
id: extra3-WebGL
title: 番外：用 WebGL 重写一遍
sidebar_label: 番外：用 WebGL 重写一遍
description: 用 WebGL 重写一遍
keywords:
  - OpenGL
  - WebGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - GLSL
  - 着色器
---

前言里说过，这个系列的目标是实现一个简易版本的 OpenGL，搞清楚 OpenGL 这类图形 API 在底层是怎么工作的。十天下来，光栅化、zbuffer、透视投影、着色器，全都是我们一行一行手写出来的。

那真正的 OpenGL 用起来是什么样的呢？这篇番外我们换成 WebGL，把 day8 的人头（切线空间的法线贴图 + Phong 光照）重新画一遍。模型解析和矩阵运算还是用我们自己写的 `model.ts` 和 `math.ts`，光栅化、插值、深度测试这些活，全部交给显卡。

> 本文源码 👉：[toy-renderer-ts/days/extra-webgl](https://github.com/skychx/toy-renderer-ts/tree/main/days/extra-webgl)

## 1.WebGL 是什么

WebGL 是浏览器提供的一套调用显卡的 API，基本上就是把 OpenGL ES（OpenGL 给手机这类嵌入式设备用的版本）搬到了 JavaScript 里。我们用的是 WebGL2，它对应的是 OpenGL ES 3.0，着色器用 GLSL ES 3.00 来写。

用 WebGL 画一个模型，流程和我们的软渲染器几乎可以一一对应起来：

| 软渲染器                           | WebGL                                            |
| ---------------------------------- | ------------------------------------------------ |
| `IShader` 的 `vertex()`            | 顶点着色器                                       |
| `IShader` 的 `fragment()`          | 片元着色器                                       |
| varying 数组和 `interpolate()`     | `out`、`in` 变量，显卡自动插值                   |
| `triangle()` 里的包围盒、重心坐标  | 显卡自动光栅化                                   |
| 透视除法和 `Viewport` 矩阵         | 显卡自动做透视除法，视口用 `gl.viewport()` 设置  |
| zbuffer                            | `gl.enable(gl.DEPTH_TEST)`                       |
| `Texture` 的 `get()`               | GLSL 里的 `texture()`                            |
| `Frame` 和 `putImageData()`        | 显卡直接画到 canvas 上                           |

着色器还是要我们自己写，只是从 TS 换成了 GLSL；表格里剩下的那些，显卡全包了。

下面我们按「着色器 → 矩阵 → 把数据交给显卡 → 画出来」的顺序，一块一块地看。

## 2.着色器

### 2.1 顶点着色器

GLSL 的语法和 C 语言很像，`vec3`、`mat4` 这些向量和矩阵类型，还有它们的加减乘除，都是语言自带的，用起来比我们的 `math.ts` 还顺手。先看顶点着色器：

```glsl
#version 300 es
in vec3 aPosition; // 顶点的位置
in vec3 aNormal;   // 顶点的法线
in vec2 aUV;       // 顶点的 uv

uniform mat4 uModelView;
uniform mat4 uModelViewIT; // ModelView 的逆转置矩阵，用来变换法线
uniform mat4 uProjection;

// out 变量就是 varying：显卡会把三个顶点的值插值好，再交给片元着色器
out vec2 vUV;
out vec3 vNormal;   // 顶点的法线（相机坐标系）
out vec3 vPosition; // 顶点的位置（相机坐标系）

void main() {
  vUV = aUV;
  vNormal = (uModelViewIT * vec4(aNormal, 0.0)).xyz;
  // 先变换到相机坐标系，记下来给片元着色器算切线用，再做投影
  vec4 p = uModelView * vec4(aPosition, 1.0);
  vPosition = p.xyz;
  gl_Position = uProjection * p;
}
```

第一行的 `#version 300 es` 表示这是 GLSL ES 3.00 的代码，必须写在最前面。剩下的部分可以和 day8 的 `vertex()` 对照着看：

- `in`：顶点着色器的输入，每个顶点都不一样，比如顶点的位置、法线、uv。我们的 `vertex(iface, nthvert)` 是自己去 `Model` 里取数据的，而显卡上的着色器访问不到 JS 里的对象，只能读事先交给显卡的数据，第 4 节再讲怎么交
- `uniform`：和 day7 讲的一样，对所有顶点、所有像素都一样的数据，比如各种变换矩阵
- `out`：就是 varying。我们的 varying 是一个存了三个顶点的数组，片元着色器拿到重心坐标以后自己插值；GLSL 的顶点着色器一次只处理一个顶点，给 `out` 变量赋个值就完事了，插值由显卡负责，而且自带透视校正
- `gl_Position`：顶点的裁剪坐标，也就是 `vertex()` 的返回值，后面的透视除法和视口变换都由显卡来做

代码里的 `.xyz` 表示取出向量的前三个分量。GLSL 里可以用 `.xyz`、`.xy`、`.rgb` 这样的写法随意地取向量的分量，写起来非常方便。

### 2.2 片元着色器

再来看片元着色器：

```glsl
#version 300 es
precision highp float;

in vec2 vUV;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler2D uDiffuse;   // 漫反射贴图
uniform sampler2D uNormalMap; // 法线贴图（切线空间）
uniform sampler2D uSpecular;  // 高光贴图
uniform vec3 uLight;          // 相机坐标系下，指向光源的方向

out vec4 fragColor; // 这个像素最终的颜色

void main() {
  // uv 坐标的原点在图片的左下角，而图片的像素是从上往下存的，所以 v 要翻转一下
  vec2 uv = vec2(vUV.x, 1.0 - vUV.y);
  // 插值出来的顶点法线，切线空间的 z 轴
  vec3 n = normalize(vNormal);

  // 用相邻像素之间位置的差和 uv 的差，求出切线 t 和副切线 b
  mat2x3 E = mat2x3(dFdx(vPosition), dFdy(vPosition));
  mat2 U = mat2(dFdx(vUV), dFdy(vUV));
  vec3 perturbed = n;
  // uv 的差退化成了一条线（行列式为 0）时没法算切线，直接用插值出来的法线
  if (abs(determinant(U)) > 1e-12) {
    mat2x3 TB = E * inverse(U);
    vec3 t = normalize(TB[0]);
    vec3 b = normalize(TB[1]);
    // 切线空间里的法线 (x, y, z)，意思是 x 个 t 加 y 个 b 再加 z 个 n
    vec3 nm = normalize(texture(uNormalMap, uv).rgb * 2.0 - 1.0);
    perturbed = normalize(t * nm.x + b * nm.y + n * nm.z);
  }

  // Phong 光照模型
  vec3 l = normalize(uLight);
  // 反射光的方向：r = 2n(n·l) - l
  vec3 r = normalize(2.0 * perturbed * dot(perturbed, l) - l);
  // 相机在原点，从物体指向相机的方向就是 -vPosition，不用再近似成 (0, 0, 1) 了
  vec3 v = normalize(-vPosition);

  float ambient = 0.3;
  float diffuse = max(0.0, dot(perturbed, l));
  float specular = texture(uSpecular, uv).r * pow(max(0.0, dot(r, v)), 20.0);

  // 颜色的取值范围是 [0, 1]，超过 1 的部分，显卡会自动截断
  vec3 color = texture(uDiffuse, uv).rgb;
  fragColor = vec4(color * (ambient + diffuse) + specular, 1.0);
}
```

先说几个和 TS 版本不一样的地方：

- `precision highp float` 声明了浮点数的精度。片元着色器里的 float 没有默认精度，必须写上这一句
- `sampler2D` 就是贴图，用 `texture(贴图, uv)` 读出颜色。读出来的颜色，每个分量的范围是 $[0, 1]$，而不是 $[0, 255]$
- 又看到了熟悉的 v 翻转：显卡读贴图的时候，v = 0 对应的是图片最上面的一行像素，和 day4 写 `texture.ts` 时遇到的是同一个问题
- `fragColor` 是片元着色器的输出，相当于 `fragment()` 的返回值。颜色超过 1 的部分显卡会自动截断，不用像 day8 那样写 `Math.min(255, ...)`

光照部分基本上是把 day8 的 `phong()` 翻译了一遍，只改了一处：day8 算高光的时候，把视线的方向近似成了 $(0, 0, 1)$；这里相机就在原点（3.1 节会讲），从物体指向相机的方向就是 `-vPosition`，就顺手换成了准确的值。

剩下的就是中间求切线的那一段了，这也是这篇番外最有意思的地方。

### 2.3 看不到三角形的片元着色器

回忆一下 day8 是怎么求切线 $\vec{t}$ 和副切线 $\vec{b}$ 的：顶点着色器把三个顶点在相机坐标系里的位置存进 `varyingTri`，片元着色器拿到这三个顶点，算出三角形的两条边 $E$ 和对应的 uv 差 $U$，最后 $[\vec{t}\ \vec{b}] = EU^{-1}$。

可到了显卡上，这招就行不通了：片元着色器拿到的 `vPosition`、`vUV`，都是已经插值好的、当前像素自己的值。它不知道自己在哪个三角形里，更不知道三角形的三个顶点在哪。

好在 GLSL 提供了 `dFdx` 和 `dFdy` 这两个函数。显卡跑片元着色器的时候，并不是一个像素一个像素地跑，而是 **2x2 个像素一组**，一起跑。既然是一起跑的，同一组里的像素就可以看看邻居的变量是多少：

- `dFdx(v)`：右边像素的 v 减去左边像素的 v，也就是往右走一个像素，v 变了多少
- `dFdy(v)`：上面像素的 v 减去下面像素的 v，也就是往上走一个像素，v 变了多少

![dFdx 和 dFdy](/img/toy-renderer/extra3/derivatives.svg)

把它用在位置上：屏幕上往右走一个像素，对应到三角形上，点在相机坐标系里也会挪一小段，`dFdx(vPosition)` 就是这一小段，它是一个贴在三角形上的很短的向量；`dFdy(vPosition)` 也一样。同时，`dFdx(vUV)` 和 `dFdy(vUV)` 告诉了我们，沿着这两个短向量走，uv 分别变了多少。

再回头看 day8 的推导，我们其实只用到了「三角形上的两个向量，以及沿着它们走 uv 变了多少」，至于这两个向量是不是三角形的边，根本无所谓。所以把 $E$ 和 $U$ 换成：

$$
E = \begin{bmatrix}\text{dFdx}(P) & \text{dFdy}(P)\end{bmatrix}, \quad U = \begin{bmatrix}\text{dFdx}(uv) & \text{dFdy}(uv)\end{bmatrix}
$$

公式 $[\vec{t}\ \vec{b}] = EU^{-1}$ 一个字都不用改。对应到代码里，就是 `mat2x3(dFdx(vPosition), dFdy(vPosition))` 和 `mat2(dFdx(vUV), dFdy(vUV))` 这两行，`E * inverse(U)` 算出来的矩阵，第一列是 $\vec{t}$，第二列是 $\vec{b}$。

这里有个容易踩的坑：GLSL 的矩阵是**按列**存的。`mat2x3(a, b)` 的意思是把 a、b 分别当作第一列和第二列，拼成一个 2 列 3 行的矩阵（注意 GLSL 是先说列数再说行数，和数学里「几行几列」的习惯正好相反），`TB[0]` 取出来的也是第一列。好处是代码和公式长得一模一样，不用像 day8 那样再转置一下（day8 的向量都是按行存的）。

还有一个细节：算 $U$ 用的是没有翻转过的 `vUV`。切线和副切线是按 uv 坐标定义的（u 增大的方向和 v 增大的方向），翻转 v 只是为了读贴图，这一点和 day8 是一样的。

> 注：三角形边缘的 2x2 小组里，有的像素其实在三角形外面。显卡照样会让它们把片元着色器跑一遍，只是不把结果画出来，为的就是让 `dFdx`、`dFdy` 能算出来

> 注：这种在片元着色器里现算切线的方法，来自 Christian Schüler 的文章 [Normal Mapping Without Precomputed Tangents](http://www.thetenthplanet.de/archives/1180)。实际项目里更常见的做法，是在加载模型的时候就把每个顶点的切线算好，和位置、法线一起作为顶点数据传给显卡

### 2.4 编译着色器

着色器的代码只是一段字符串，要等网页跑起来以后，再交给显卡驱动去编译：

```ts
// 编译一个着色器，有语法错误的话，直接把错误信息抛出来
function compileShader(type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader)!);
  }
  return shader;
}

// 把顶点着色器和片元着色器链接成一个程序
const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program)!);
}
gl.useProgram(program);
```

GLSL 写错了，TS 的类型检查是发现不了的，只有运行的时候编译失败了，才能通过 `getShaderInfoLog` 看到错误信息。所以写 GLSL 的时候，记得多看看控制台。

## 3.矩阵

### 3.1 相机放在原点

day6 写 `lookAt` 的时候，我们把 center 移到了原点，相机在 z 轴上离原点 c 远的地方，day5 的投影矩阵也是按照这个位置来做透视的。

OpenGL 的习惯不一样：**相机放在原点，朝着 -z 方向看**。所以 `lookAt` 只需要改一个地方，平移的时候把 eye 移到原点：

```ts
// 平移：OpenGL 的相机放在原点，所以要把 eye 移到原点（gl.ts 里移的是 center）
const translation: Mat = [
  [1, 0, 0, -eye[0]],
  [0, 1, 0, -eye[1]],
  [0, 0, 1, -eye[2]],
  [0, 0, 0, 1],
];
```

旋转的部分和 day6 一模一样，就不贴了。

### 3.2 透视投影

投影矩阵也要换成 OpenGL 的版本：

```ts
// 透视投影矩阵：fovy 是上下方向的视角，aspect 是画面的宽高比，
// near、far 是近平面和远平面到相机的距离，只有这两个平面之间的东西才会被画出来
function perspective(fovy: number, aspect: number, near: number, far: number): Mat {
  const f = 1 / Math.tan(fovy / 2);
  return [
    [f / aspect, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, (far + near) / (near - far), (2 * far * near) / (near - far)],
    [0, 0, -1, 0],
  ];
}
```

看上去比 day5 的投影矩阵复杂不少，我们一行一行地看。

先看最后一行 $[0, 0, -1, 0]$，它让 $w = -z$。相机在原点、朝着 -z 方向看，相机前面的物体 z 都是负数，$-z$ 正好就是物体到相机的距离，x、y 除以它，就有了近大远小。day5 的投影矩阵让 $w = 1 - z/c$，也就是 $(c - z)/c$，$c - z$ 同样是物体到相机的距离，道理是一样的。

再看前两行。在离相机 $d$ 远的地方，上下视角为 fovy 时，能看到的 y 的范围是 $[-d\tan(fovy/2),\ d\tan(fovy/2)]$。y 乘上 $f = 1/\tan(fovy/2)$，再除以 $w$（也就是 $d$），正好落在 $[-1, 1]$ 里。x 方向还要再除以画面的宽高比 aspect，这样画面才不会被拉伸。

我们的软渲染器里，人头画多大是由 `Viewport` 决定的（只用了画布中间 3/4 的区域）；OpenGL 里则是由 fovy 决定的：fovy 越大，看到的范围越大，人头就越小。这里取了 45°，人头的大小和 day8 差不多。

最后是第三行，它管的是 z：透视除法以后，离相机 near 远的地方，z 会变成 -1，far 远的地方变成 1。x、y、z 不在 $[-1, 1]$ 里的部分，显卡会直接裁掉，这也是「裁剪坐标」这个名字的由来。我们的软渲染器偷了个懒，没有做这一步。

还要注意，OpenGL 里 z 越小离相机越近，和我们 day4 的 zbuffer 正好反过来。不过 WebGL 的深度测试默认就是 z 小的留下来，和这个矩阵是配套的，我们什么都不用改。

带 near、far 的透视投影矩阵是怎么推导出来的，可以看 GAMES101 的第 4 讲：先把视锥体「挤」成一个长方体，再做正交投影。

### 3.3 矩阵是按列存的

矩阵最后要通过 uniform 传给着色器：

```ts
// 把一个矩阵传给着色器：OpenGL 的矩阵是按列存的，我们的矩阵是按行存的，
// 所以第二个参数要传 true，让 WebGL 帮我们转置一下
function setMatrix(name: string, m: Mat) {
  gl.uniformMatrix4fv(gl.getUniformLocation(program, name), true, m.flat());
}
```

我们的 `Mat` 是按行存的二维数组，`m[0]` 是第一行；而 2.3 节说过，OpenGL 的矩阵是按列存的，传给它的一维数组，前 4 个数会被当成第一列。所以 `uniformMatrix4fv` 的第二个参数 transpose 要传 `true`，让 WebGL 帮我们转置一下。

> 注：WebGL1 里这个参数只能传 `false`，得自己先把矩阵转置好再传进去

## 4.把数据交给显卡

### 4.1 顶点数据

显卡没法调用 `model.vert()` 这样的 JS 函数，所以要先把所有顶点的数据排成一个大数组，一次性传给显卡，存到显存里。

这里有个小麻烦：obj 文件里，一个顶点的位置、uv、法线是分开编号的（就是 `f 24/1/24` 里的三个数），而显卡要求同一个顶点的所有数据共用一个编号。最省事的办法是按三角形把数据展开，每个三角形 3 个顶点，被好几个三角形共用的顶点，就重复存几遍：

```ts
// obj 里的顶点、uv、法线各有各的序号，显卡却要求同一个顶点的数据用同一个序号，
// 所以我们按三角形把每个顶点的数据都展开，三个顶点一组
const positions: number[] = [];
const normals: number[] = [];
const uvs: number[] = [];
for (let i = 0; i < model.nfaces(); i++) {
  for (let j = 0; j < 3; j++) {
    positions.push(...model.vert(i, j));
    normals.push(...model.normal(i, j));
    uvs.push(...model.uv(i, j));
  }
}
```

然后把这三组数据分别传给显卡，并告诉显卡，它们对应的是顶点着色器里的哪个 `in` 变量：

```ts
// 把一组顶点数据传给显卡，告诉顶点着色器里名叫 name 的 in 变量：从这里读，每个顶点读 size 个数
function createAttribute(name: string, data: number[], size: number) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

createAttribute('aPosition', positions, 3);
createAttribute('aNormal', normals, 3);
createAttribute('aUV', uvs, 2);
```

`createBuffer` 和 `bufferData` 在显存里开一块空间，把数据拷过去；`getAttribLocation` 找到顶点着色器里对应的 `in` 变量；`vertexAttribPointer` 告诉显卡，每个顶点要从这块数据里读几个 float。之后显卡跑顶点着色器的时候，就会自动把第 i 个顶点的数据填进 `aPosition`、`aNormal`、`aUV` 里。

### 4.2 贴图

贴图也一样，要先传给显卡：

```ts
// 读取一张贴图，放到显卡的第 unit 号纹理单元上，再告诉片元着色器里名叫 name 的变量去这里读
async function loadTexture(url: string, unit: number, name: string) {
  const blob = await (await fetch(url)).blob();
  // 和 texture.ts 一样，不能让浏览器做颜色校正
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
  // 生成 mipmap，贴图缩小的时候，显卡会在不同大小的贴图之间插值，避免出现摩尔纹
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.uniform1i(gl.getUniformLocation(program, name), unit);
}

await loadTexture('/obj/african_head/african_head_diffuse.png', 0, 'uDiffuse');
await loadTexture('/obj/african_head/african_head_nm_tangent.png', 1, 'uNormalMap');
await loadTexture('/obj/african_head/african_head_spec.png', 2, 'uSpecular');
```

显卡上有好几个纹理单元（texture unit），我们把三张贴图分别放在 0、1、2 号单元上，再通过 `uniform1i` 告诉片元着色器里的 `uDiffuse`、`uNormalMap`、`uSpecular`，分别去哪个单元读。

这里还多了一步 `generateMipmap`。我们的 `Texture.get()` 是直接取离 uv 最近的那个像素；显卡的 `texture()` 要讲究得多：它会用周围的 4 个像素做双线性插值；贴图被缩小显示的时候，还会用事先生成好的一系列小尺寸贴图（mipmap）来避免摩尔纹。这些都是显卡在硬件上直接做的，几乎不花时间，原理可以看 GAMES101 的第 9 讲。

## 5.画出来

终于可以画图了：

```ts
// 深度测试：对应我们自己写的 zbuffer
gl.enable(gl.DEPTH_TEST);
// 视口变换：对应我们的 Viewport 矩阵
gl.viewport(0, 0, canvas.width, canvas.height);

const light: Vec3 = [1, 1, 1]; // 指向光源的方向

// 相机在一个球面上绕着模型转：theta 是绕 y 轴转的角度，phi 是抬头的角度，
// 初始值对应的就是 day8 的相机位置 (1, 1, 3)
const distance = Math.sqrt(11);
let theta = Math.atan2(1, 3);
let phi = Math.asin(1 / distance);

function draw() {
  const eye: Vec3 = [
    distance * Math.cos(phi) * Math.sin(theta),
    distance * Math.sin(phi),
    distance * Math.cos(phi) * Math.cos(theta),
  ];
  const ModelView = lookAt(eye, [0, 0, 0], [0, 1, 0]);
  setMatrix('uModelView', ModelView);
  setMatrix('uModelViewIT', transpose(inverse(ModelView)));
  setMatrix('uProjection', perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100));
  gl.uniform3fv(gl.getUniformLocation(program, 'uLight'), transformDirection(ModelView, light));

  // 清空颜色和深度，对应 frame.clear() 和 zbuffer.fill(-Infinity)
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // 每三个顶点画一个三角形
  gl.drawArrays(gl.TRIANGLES, 0, model.nfaces() * 3);
}
```

我们手写的 zbuffer，到了 WebGL 里就是一行 `gl.enable(gl.DEPTH_TEST)`；对每个三角形调用顶点着色器、光栅化、插值、调用片元着色器，也只是一行 `gl.drawArrays`。

相机的位置用的是球坐标：相机在一个半径为 `distance` 的球面上，`theta` 是绕 y 轴转的角度，`phi` 是抬头的角度，初始值算出来正好是 day8 的相机位置 $(1, 1, 3)$。按住鼠标拖动的时候改一改 `theta` 和 `phi`，再用 `requestAnimationFrame` 不停地调用 `draw()` 就行，这部分代码比较简单，就不贴了。

左边是 day8 的软渲染器画的，右边是 WebGL 画的：

![左：day8 的软渲染器，右：WebGL](/img/toy-renderer/extra3/compare.jpg)

几乎一模一样！仔细看的话，右边的皮肤要细腻一些，这就是双线性插值和 mipmap 的功劳。

按住鼠标拖动，就能从各个角度看这个人头了，连后脑勺也能看到：

![按住鼠标拖动，从不同的角度看](/img/toy-renderer/extra3/views.jpg)

## 6.快了多少

页面上会显示每秒画了多少帧。不过这个数字一般就是屏幕的刷新率：60Hz 的屏幕显示 60 FPS，120Hz 的高刷屏显示 120 FPS。这是因为 `requestAnimationFrame` 是跟着屏幕刷新走的，帧数被屏幕限制住了，显卡其实还闲得很。

为了看看显卡到底有多快，我在自己的电脑上单独测了一下：连续画几千帧再取平均，画一帧还不到 1 毫秒。而我们的软渲染器画 day8 这张图，要 120 毫秒左右，一秒钟最多也就画 8 帧，两者差了好几百倍。

差距为什么这么大？我们的软渲染器是在 CPU 上用一个线程，一个像素一个像素地算；而显卡里有成千上万个计算核心，可以同时跑一大批像素的片元着色器，光栅化、插值、深度测试、读贴图这些固定的步骤，还有专门的硬件电路来做。

## 写在最后

回头看一下，WebGL 帮我们做掉的那些事：光栅化、插值、透视校正、深度测试，正好是我们前十天花力气最多的地方；而留给我们自己写的，主要就是着色器。现在再看到 `gl_Position`、varying、`gl.enable(gl.DEPTH_TEST)` 这些东西，我们都知道它们背后发生了什么。

平时用的 three.js 这类库，底层调用的也是这些 WebGL API。有了这十天打下的底子，再去看它们的源码，应该也不会觉得那么神秘了。

## 参考链接

[WebGL2 理论基础](https://webgl2fundamentals.org/webgl/lessons/zh_cn/)

[Followup: Normal Mapping Without Precomputed Tangents](http://www.thetenthplanet.de/archives/1180)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
