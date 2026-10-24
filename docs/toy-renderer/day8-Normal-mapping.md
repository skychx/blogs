---
id: day8-Normal-mapping
title: day8：Phong 光照与法线贴图
sidebar_label: day8：Phong 光照与法线贴图
description: Phong 光照与法线贴图
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day8：Phong 光照与法线贴图
  - 法线贴图
  - 切线空间
  - Phong 光照模型
  - 高光贴图
---

昨天我们把渲染器重构成了着色器的形式，今天就在片元着色器上好好做做文章，让人头看起来更真实一些。主要讲三件事：

- **法线贴图**：用一张贴图给每个像素提供一个法线，让模型的细节一下子丰富起来
- **Phong 光照模型**：给模型加上高光
- **切线空间的法线贴图**：工程上更常用的一种法线贴图

这一篇会比较长，大家可以分几次看。这部分内容对应 GAMES101 的第 7 讲和第 9 讲。

> 本文源码 👉：[toy-renderer-ts/days/day08](https://github.com/skychx/toy-renderer-ts/tree/main/days/day08)

## 1.法线贴图

### 1.1 贴图里也能存法线

Gouraud 着色用的是每个**顶点**的法线，三角形内部的法线都是插值出来的。顶点就那么多，模型上很多细节（比如脸上的皱纹、伤疤）比三角形还小，靠插值是插不出来的。

那怎么给模型加上这些细节呢？再加几万个三角形当然可以，但代价太大了。更聪明的办法是：**把每个像素的法线存到一张贴图里**。

贴图里除了颜色，其实什么数据都可以存，关键看我们怎么解读。一个像素有 r、g、b 三个分量，一个法线有 x、y、z 三个分量，正好可以一一对应起来。颜色的取值范围是 $[0, 255]$，法线每个分量的取值范围是 $[-1, 1]$，换算一下就行：

$$
n = \frac{color}{255} \times 2 - 1
$$

下面左边这张图就是人头模型的法线贴图，看上去像一张彩虹色的人脸（右边那张蓝紫色的我们第 3 节再讲）：

![两种法线贴图](/img/toy-renderer/day8/nm-textures.jpg)

```ts
// 从法线贴图里读出法线：颜色每个分量的范围是 [0, 255]，法线每个分量的范围是 [-1, 1]
function sampleNormal(texture: Texture, uv: Vec2): Vec3 {
  const [r, g, b] = texture.get(uv[0], uv[1]);
  return normalize([(r / 255) * 2 - 1, (g / 255) * 2 - 1, (b / 255) * 2 - 1]);
}
```

> 注：day4 读贴图时我们特意关掉了浏览器的颜色校正（`colorSpaceConversion: 'none'`），就是为了这一刻。法线贴图里存的不是颜色，浏览器要是「好心」帮我们校正一下，读出来的法线就全歪了

### 1.2 在相机坐标系里算光照

前几天的光照都是在世界坐标系里算的，从今天开始，我们把光照挪到**相机坐标系**里算（原教程第二版也是这么做的）。这样做的好处是，等会儿算高光的时候，相机就在 z 轴上，视线方向很好表示。

要在相机坐标系里算光照，光照方向和法线都要先变换过去：

- **光照方向**是一个向量，乘上 ModelView 矩阵就行，记得 w 取 0（day5 讲过，平移对向量不起作用）
- **法线**要用 ModelView 的**逆转置矩阵**来变换，这就是 day6 第 6 节讲的内容，今天终于用上了

> 注：原教程第一版这里用的是 Projection × ModelView 的逆转置矩阵，严格来说不对：透视投影不是仿射变换，变换以后的「法线」已经没有物理意义了。第二版改成了只用 ModelView，我们也只用 ModelView

这些对所有像素都一样的数据，我们打包成一组 uniform，通过构造函数传给着色器。这和 OpenGL 里用 `gl.uniform*` 系列函数给着色器传数据是一个意思：

```ts
// 着色器要用到的 uniform
type Uniforms = {
  ModelView: Mat;
  Projection: Mat;
  ModelViewIT: Mat; // ModelView 的逆转置矩阵，用来变换法线
  light: Vec3; // 相机坐标系下，指向光源的方向
};

// 根据相机和光源的位置，算出所有的 uniform
function createUniforms(eye: Vec3, light: Vec3): Uniforms {
  const center: Vec3 = [0, 0, 0];
  const up: Vec3 = [0, 1, 0];
  const ModelView = lookAt(eye, center, up);
  return {
    ModelView,
    Projection: projection(length(sub(eye, center))),
    ModelViewIT: transpose(inverse(ModelView)),
    // 光照方向是一个向量，变换到相机坐标系时 w 取 0
    light: normalize(transformDirection(ModelView, light)),
  };
}

// 用 4x4 矩阵变换一个向量：向量的 w 是 0，平移对它不起作用
function transformDirection(m: Mat, v: Vec3): Vec3 {
  const [x, y, z] = matVec(m, [v[0], v[1], v[2], 0] as Vec4);
  return [x, y, z];
}
```

这里用到了两个新的矩阵运算：转置 `transpose` 和求逆 `inverse`。求逆用的是线性代数课上学过的高斯-约旦消元法：在矩阵右边拼一个单位矩阵，然后做行变换，把左边变成单位矩阵，右边就是逆矩阵了。代码不长，这里就不贴了，感兴趣的可以去 `math.ts` 里看。

> 注：lookAt 算出来的矩阵只有旋转和平移，按 day6 的结论，直接用它变换法线其实也没问题。不过养成好习惯，法线还是老老实实用逆转置矩阵

另外，插值已经手写好几遍了，今天顺手抽成一个函数：

```ts
// 用重心坐标插值：values 是三角形三个顶点上的值，bar 是重心坐标
export function interpolate<T extends number[]>(values: T[], bar: Vec3): T {
  return values[0].map(
    (_, i) => values[0][i] * bar[0] + values[1][i] * bar[1] + values[2][i] * bar[2],
  ) as T;
}
```

### 1.3 代码实现

有了这些准备，法线贴图的着色器就很简单了：片元着色器插值出 uv 以后，从法线贴图里读出法线，变换到相机坐标系，然后照常计算漫反射：

```ts
// 法线贴图（模型空间）：法线不再从顶点插值，而是从贴图里一个像素一个像素地读出来
class NormalMapShader implements IShader {
  asset: Asset;
  uniforms: Uniforms;
  uniformM: Mat;
  varyingUV: Vec2[] = [
    [0, 0],
    [0, 0],
    [0, 0],
  ];

  constructor(asset: Asset, uniforms: Uniforms) {
    this.asset = asset;
    this.uniforms = uniforms;
    this.uniformM = matMul(uniforms.Projection, uniforms.ModelView);
  }

  vertex(iface: number, nthvert: number): Vec4 {
    this.varyingUV[nthvert] = this.asset.model.uv(iface, nthvert);
    const v = this.asset.model.vert(iface, nthvert);
    return matVec(this.uniformM, [v[0], v[1], v[2], 1] as Vec4);
  }

  fragment(bar: Vec3): Color | null {
    const uv = interpolate(this.varyingUV, bar);
    // 从法线贴图里读出模型空间的法线，用逆转置矩阵变换到相机坐标系
    const nm = sampleNormal(this.asset.nm, uv);
    const n = normalize(transformDirection(this.uniforms.ModelViewIT, nm));
    const diffuse = Math.max(0, dot(n, this.uniforms.light));
    const color = this.asset.diffuse.get(uv[0], uv[1]);
    return [color[0] * diffuse, color[1] * diffuse, color[2] * diffuse];
  }
}
```

`asset` 里装的是模型和它的各种贴图。模型的贴图都是按文件名后缀来命名的（`_diffuse`、`_nm`、`_nm_tangent`、`_spec`），所以写了一个 `loadAsset` 函数一次性全部读进来：

```ts
// 加载模型和它的贴图：贴图的文件名，就是在模型文件名后面加上不同的后缀
async function loadAsset(name: string): Promise<Asset> {
  return {
    model: await loadModel(`${name}.obj`),
    diffuse: await loadTexture(`${name}_diffuse.png`),
    nm: await loadTexture(`${name}_nm.png`),
    nmTangent: await loadTexture(`${name}_nm_tangent.png`),
    spec: await loadTexture(`${name}_spec.png`),
  };
}
```

渲染出来的效果是这样的。和昨天的 Gouraud 着色比一下，脸颊上的伤疤、额头和眼角的皱纹都出来了，可模型的三角形一个都没有多：

![模型空间的法线贴图](/img/toy-renderer/day8/normal-map.jpg)

## 2.Phong 光照模型

### 2.1 三种光

到目前为止，我们的光照只考虑了漫反射：表面越正对着光源越亮。现实中的光照要复杂得多，计算真实的光照非常耗费算力，图形学里常用一些简单的近似。[Phong 光照模型](https://www.wikiwand.com/en/Phong_reflection_model)就是其中最经典的一个，它把看到的光分成三部分：

- **环境光（ambient）**：模拟从四面八方反射过来的间接光，简单粗暴地用一个常数表示。有了它，背光的地方也不至于一片漆黑
- **漫反射（diffuse）**：就是我们一直在用的那个，和法线与光照方向夹角的余弦成正比
- **高光（specular）**：光滑的表面上，会有一块特别亮的光斑，比如额头、鼻尖上油亮的反光

最终的颜色就是三者按一定权重加起来。下面四张图分别是环境光、漫反射、高光（单独看太暗了，这里放大了 3 倍）以及三者加起来的效果。为了只看光照，这里用一张浅灰色的贴图代替了皮肤的颜色：

![环境光、漫反射、高光，以及三者加起来的效果](/img/toy-renderer/day8/phong-components.jpg)

### 2.2 高光

环境光和漫反射都讲过了，我们重点看看高光。

想象一面镜子：只有当我们的眼睛正好在光的反射方向上时，才能看到光源的倒影。光滑的物体表面也是一样，**反射光的方向和视线越接近，高光越亮**。

反射光的方向怎么算呢？看下面这张图，$\vec{n}$ 是法线，$\vec{l}$ 是指向光源的方向，反射光 $\vec{r}$ 和 $\vec{l}$ 关于法线对称：

![反射光的方向](/img/toy-renderer/day8/reflection.svg)

$\vec{l}$ 在法线上的投影是 $\vec{n}(\vec{n} \cdot \vec{l})$（假设 $\vec{n}$、$\vec{l}$ 都是单位向量）。从图里可以看出，$\vec{l}$ 和 $\vec{r}$ 加起来正好是这个投影的 2 倍，所以：

$$
\vec{r} = 2\vec{n}(\vec{n} \cdot \vec{l}) - \vec{l}
$$

有了反射方向，高光的强度就可以用反射光和视线夹角 $\beta$ 的余弦来算。不过直接用 $\cos\beta$ 的话，光斑会特别大，看上去不像高光。所以 Phong 用了一个小技巧：**给余弦加一个指数** $e$：

$$
specular = \cos^e \beta
$$

小于 1 的数，指数越大，结果越小。从下面的曲线可以看出，$e$ 越大，曲线越「瘦」，只有 $\beta$ 非常接近 0 的时候才亮，高光的光斑也就越小、越集中：

![cos 的 e 次方曲线](/img/toy-renderer/day8/shininess.svg)

金属、塑料这种很光滑的东西，$e$ 可以取到几十甚至上百；比较粗糙的表面 $e$ 就取小一点。我们这里取 20。

> 注：GAMES101 里讲的是 Blinn-Phong 模型，它用光照方向和视线方向的「半程向量」代替了反射向量，算起来更快一些，思路是一样的

还剩最后一个问题：视线方向是什么？我们是在相机坐标系里算的光照，相机朝着 -z 方向看，从物体指向相机的方向近似就是 $(0, 0, 1)$。所以 $\cos\beta = \vec{r} \cdot (0, 0, 1)$，也就是 $\vec{r}$ 的 z 分量，连点乘都省了。

> 注：严格来说，每个像素指向相机的方向都不一样，这里统一近似成了 $(0, 0, 1)$，原教程也是这么处理的，效果上基本看不出差别

### 2.3 高光贴图

人脸上不同地方的「油亮程度」是不一样的：额头、鼻尖容易反光，头发、嘴唇就不太会。这个信息也存在一张贴图里，叫**高光贴图**（`_spec.png`），我们用它来控制每个地方的高光强度。

把上面这些写成代码就是这样的：

```ts
// Phong 光照模型：n 是相机坐标系下的法线，返回这个像素最终的颜色
function phong(asset: Asset, uniforms: Uniforms, uv: Vec2, n: Vec3, weights: Weights): Color {
  const l = uniforms.light;
  // 反射光的方向：r = 2n(n·l) - l
  const r = normalize(sub(scale(n, 2 * dot(n, l)), l));

  // 环境光：一个常数
  const ambient = weights.ambient;
  // 漫反射：和法线与光照方向的夹角有关
  const diffuse = weights.diffuse * Math.max(0, dot(n, l));
  // 高光：和反射光与视线的夹角有关。相机朝着 -z 方向看，从物体指向相机的方向近似是 (0, 0, 1)，
  // 所以 r 和视线的点乘就是 r 的 z 分量；高光贴图决定了每个地方的高光有多强
  const strength = asset.spec.get(uv[0], uv[1])[0] / 255;
  const specular = weights.specular * strength * Math.pow(Math.max(0, r[2]), 20);

  // 环境光和漫反射要乘上物体本身的颜色；高光是光源的颜色（白光），直接加上去
  const color = asset.diffuse.get(uv[0], uv[1]);
  return [
    Math.min(255, color[0] * (ambient + diffuse) + 255 * specular),
    Math.min(255, color[1] * (ambient + diffuse) + 255 * specular),
    Math.min(255, color[2] * (ambient + diffuse) + 255 * specular),
  ];
}
```

这里有两点和原教程不太一样，提一下：

- 原教程第一版把高光贴图里的值当成了指数 $e$，第二版改成了当作高光的强度，我们用的是第二版的思路
- 原教程两个版本里，高光都乘上了贴图的颜色。但按 Phong 模型的本意，高光反射的是光源本身的颜色，和物体的颜色关系不大，所以我这里把高光当作白光直接加了上去。对于这种深色的皮肤，高光看起来会更自然一些

三种光的权重是可以随便调的，不同的权重会让物体呈现出不同的质感，这里用的是环境光 0.3、漫反射 1、高光 1：

```ts
const defaultWeights: Weights = { ambient: 0.3, diffuse: 1, specular: 1 };

// Phong 光照：法线还是从模型空间的法线贴图里读
class PhongShader extends NormalMapShader {
  weights: Weights;

  constructor(asset: Asset, uniforms: Uniforms, weights = defaultWeights) {
    super(asset, uniforms);
    this.weights = weights;
  }

  fragment(bar: Vec3): Color | null {
    const uv = interpolate(this.varyingUV, bar);
    const nm = sampleNormal(this.asset.nm, uv);
    const n = normalize(transformDirection(this.uniforms.ModelViewIT, nm));
    return phong(this.asset, this.uniforms, uv, n, this.weights);
  }
}
```

加上高光以后，额头、鼻梁、颧骨和脖子上都有了反光，皮肤一下子就有了质感：

![Phong 光照 + 纹理](/img/toy-renderer/day8/phong.jpg)

## 3.切线空间的法线贴图

### 3.1 另一种法线贴图

回头看一下第 1 节那两张法线贴图，左边那张五颜六色，右边那张整体是蓝紫色的。它们存的其实是同一套法线，只是用了不同的坐标系：

- 左边是**模型空间**的法线贴图，存的是法线在模型坐标系里的方向。人头不同部位的法线朝向各不相同，所以颜色五花八门
- 右边是**切线空间**的法线贴图，存的是法线相对于**表面自身**的方向

切线空间是一个跟着表面走的坐标系：z 轴是表面的法线 $\vec{n}$，x 轴和 y 轴贴在表面上，分别叫**切线** $\vec{t}$（tangent）和**副切线** $\vec{b}$（bitangent）。法线贴图存的是细节对法线的「扰动」，一般扰动都不大，法线基本都是 $(0, 0, 1)$ 附近的方向，换算成颜色就是 $(128, 128, 255)$ 附近的蓝紫色，这就是切线空间法线贴图看上去总是蓝紫色的原因。

### 3.2 为什么要用切线空间

模型空间的法线贴图用起来这么简单，为什么还要搞个切线空间出来？主要有两个原因。

第一个原因是**动画**。模型空间的法线贴图是按模型的某一个姿势做的，如果模型会动（比如人张嘴说话），表面的朝向变了，贴图里存的法线就不对了，得给每个姿势都做一张贴图。切线空间的法线是相对于表面的，表面怎么动，它就跟着怎么动，一张贴图就够了。

第二个原因是**省贴图**。美术同学为了省空间，经常让左右对称的部位共用同一块贴图，比如暗黑破坏神左右两条胳膊、两条腿，用的都是同一块纹理。模型空间的法线贴图里，一个像素只能存一个方向，左边胳膊对了，右边胳膊就是反的。

我们来验证一下。用两种法线贴图分别渲染暗黑破坏神（光从右边照过来），然后把两张图逐像素相减，差别越大的地方越亮：

![两种法线贴图渲染结果的差别](/img/toy-renderer/day8/diablo-diff.jpg)

结果非常明显：差别全部集中在暗黑破坏神的右半边（画面左侧），左半边几乎一模一样。把右胳膊放大对比一下，左边是模型空间的法线贴图，右边是切线空间的法线贴图：

![左：模型空间的法线贴图，右：切线空间的法线贴图](/img/toy-renderer/day8/diablo-arm.jpg)

光是从右边照过来的，胳膊外侧（画面左边）背对着光源，应该是暗的。左图却把胳膊外侧照亮了，这就是贴图共用导致的错误；右图的明暗就正常了。

### 3.3 求切线空间的基

要使用切线空间的法线贴图，就得先在每个像素上求出切线空间的三个基向量：$\vec{t}$、$\vec{b}$、$\vec{n}$。

$\vec{n}$ 好办，就是插值出来的顶点法线。$\vec{t}$ 和 $\vec{b}$ 呢？我们换一张网格贴图看一下：网格的红线是 v 不变、u 在变化的线，蓝线是 u 不变、v 在变化的线。

![左：切线空间的法线贴图，右：换成网格贴图](/img/toy-renderer/day8/tangent-grid.jpg)

切线 $\vec{t}$ 就是 **u 增大的方向**，也就是沿着红线的方向；副切线 $\vec{b}$ 是 **v 增大的方向**，也就是沿着蓝线的方向。

具体到一个三角形上，三个顶点在空间里的位置是 $P_0$、$P_1$、$P_2$，在 uv 坐标里的位置是 $U_0$、$U_1$、$U_2$：

![三角形和它的 uv 坐标](/img/toy-renderer/day8/tangent-space.svg)

记三角形的两条边和对应的 uv 差为：

$$
\vec{e_1} = P_1 - P_0, \quad \vec{e_2} = P_2 - P_0, \quad \Delta\vec{u_1} = U_1 - U_0, \quad \Delta\vec{u_2} = U_2 - U_0
$$

我们可以把「空间里的一个向量，对应 uv 坐标里变化了多少」看成一个线性变换，用矩阵 $M$ 表示。两条边就满足：

$$
M \begin{bmatrix}\vec{e_1} & \vec{e_2}\end{bmatrix} = \begin{bmatrix}\Delta\vec{u_1} & \Delta\vec{u_2}\end{bmatrix}
$$

把右边记作矩阵 $E$ 和 $U$，就是 $ME = U$。

而切线 $\vec{t}$ 是 u 增大 1、v 不变的方向，副切线 $\vec{b}$ 是 v 增大 1、u 不变的方向，也就是说：

$$
M \begin{bmatrix}\vec{t} & \vec{b}\end{bmatrix} = \begin{bmatrix}1 & 0 \\ 0 & 1\end{bmatrix}
$$

对比一下两个式子，把 $ME = U$ 两边同时右乘 $U^{-1}$，得到 $MEU^{-1} = I$，所以：

$$
\begin{bmatrix}\vec{t} & \vec{b}\end{bmatrix} = EU^{-1}
$$

只需要求一个 2x2 矩阵的逆，就能算出切线和副切线。这个推导来自原教程的第二版，第一版用的是梯度的方法，会涉及到一点微积分，第二版的思路要直观很多。

还有个细节：原作者在第一版里留了一道思考题——为什么用的是插值出来的顶点法线，而不是三角形本身的法线？答案是为了**平滑**：三角形本身的法线在每个三角形内部都是一样的，用它的话，法线贴图里那些「没有扰动」的地方会把三角形的棱角又显露出来；用插值的法线，就和 Gouraud 着色一样，看起来是光滑的。

### 3.4 代码实现

最后把切线空间的法线变换回相机坐标系。还记得 day6 的坐标系变换吗？切线空间里的坐标 $(x, y, z)$，意思就是 $x$ 个 $\vec{t}$ 加 $y$ 个 $\vec{b}$ 再加 $z$ 个 $\vec{n}$：

$$
\vec{n'} = x\vec{t} + y\vec{b} + z\vec{n}
$$

顶点着色器除了 uv，还要把顶点的法线和顶点在相机坐标系里的位置都记下来，留给片元着色器算切线：

```ts
vertex(iface: number, nthvert: number): Vec4 {
  const { model } = this.asset;
  this.varyingUV[nthvert] = model.uv(iface, nthvert);
  this.varyingNormal[nthvert] = transformDirection(
    this.uniforms.ModelViewIT,
    model.normal(iface, nthvert),
  );
  // 先变换到相机坐标系，记下来给片元着色器算切线用，再做投影
  const v = model.vert(iface, nthvert);
  const p = matVec(this.uniforms.ModelView, [v[0], v[1], v[2], 1] as Vec4);
  this.varyingTri[nthvert] = [p[0], p[1], p[2]];
  return matVec(this.uniforms.Projection, p);
}
```

片元着色器按上面的公式求出 $\vec{t}$ 和 $\vec{b}$，再把贴图里的法线变换过来，最后交给 Phong 光照模型：

```ts
fragment(bar: Vec3): Color | null {
  const uv = interpolate(this.varyingUV, bar);
  // 插值出来的顶点法线，切线空间的 z 轴
  const n = normalize(interpolate(this.varyingNormal, bar));

  // 用三角形的两条边和对应的 uv 差，求出切线 t 和副切线 b
  const [p0, p1, p2] = this.varyingTri;
  const [uv0, uv1, uv2] = this.varyingUV;
  const E: Mat = [sub(p1, p0), sub(p2, p0)];
  const U: Mat = [
    [uv1[0] - uv0[0], uv1[1] - uv0[1]],
    [uv2[0] - uv0[0], uv2[1] - uv0[1]],
  ];
  // uv 三角形退化成了一条线（面积为 0）时没法算切线，直接用插值出来的法线
  if (Math.abs(U[0][0] * U[1][1] - U[0][1] * U[1][0]) < 1e-12) {
    return phong(this.asset, this.uniforms, uv, n, defaultWeights);
  }
  const [t, b] = matMul(inverse(U), E);

  // 切线空间里的法线 (x, y, z)，意思是 x 个 t 加 y 个 b 再加 z 个 n
  const nm = sampleNormal(this.asset.nmTangent, uv);
  const T = normalize(t as Vec3);
  const B = normalize(b as Vec3);
  const perturbed = normalize(add(add(scale(T, nm[0]), scale(B, nm[1])), scale(n, nm[2])));

  return phong(this.asset, this.uniforms, uv, perturbed, defaultWeights);
}
```

细心的同学可能会发现，公式里是 $EU^{-1}$，代码里写的却是 `matMul(inverse(U), E)`。这是因为代码里的向量都是**按行**存的（`E` 的每一行是一条边，`U` 的每一行是一组 uv 差），相当于公式里的 $E$ 和 $U$ 都转置了一下。对 $[\vec{t}\ \vec{b}] = EU^{-1}$ 两边同时转置：

$$
\begin{bmatrix}\vec{t} & \vec{b}\end{bmatrix}^T = (U^{-1})^T E^T = (U^T)^{-1} E^T
$$

代码里的 `U` 和 `E` 正好就是这里的 $U^T$ 和 $E^T$，所以写成了 `inverse(U)` 乘 `E`，算出来的两行就是 $\vec{t}$ 和 $\vec{b}$。

渲染结果就是上面 3.3 节的那张图。对人头来说，它和模型空间的版本几乎一样，毕竟存的是同一套法线；但到了暗黑破坏神这种共用贴图的模型上，就只有切线空间的版本是对的了。

<br />

<br />

到这里，我们的人头已经相当像样了。不过目前的光照都是「局部」的：每个像素只管自己的法线和光照方向，完全不管周围有没有东西挡着光。比如暗黑破坏神的角，本来应该在肩膀上投下一块影子，现在却什么都没有。明天我们就来实现**阴影**。

## 参考链接

[tinyrenderer Lesson 6: Shaders for the software renderer](https://github.com/ssloy/tinyrenderer/wiki/Lesson-6:-Shaders-for-the-software-renderer)

[tinyrenderer Lesson 6bis: tangent space normal mapping](https://github.com/ssloy/tinyrenderer/wiki/Lesson-6bis:-tangent-space-normal-mapping)

[tinyrenderer（第二版）：More data!](https://haqr.eu/tinyrenderer/textures/)

[tinyrenderer（第二版）：Tangent space normal mapping](https://haqr.eu/tinyrenderer/tangent/)

[GAMES101-现代计算机图形学入门](https://www.bilibili.com/video/BV1X7411F744)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
