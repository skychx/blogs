---
id: day10-Ambient-occlusion
title: day10：环境光遮蔽（Ambient Occlusion）
sidebar_label: day10：环境光遮蔽
description: 环境光遮蔽（Ambient Occlusion）
keywords:
  - OpenGL
  - 软渲染器
  - 造轮子
  - 从零实现一个软渲染器
  - day10：环境光遮蔽
  - Ambient Occlusion
  - SSAO
  - 环境光遮蔽
---

import { RendererDemo, RendererDemos } from '../../src/components/rendererDemo';

终于到最后一天了。昨天我们用 Shadow Mapping 给场景加上了阴影，光源照不到的地方暗了下来。不过 Phong 光照模型里还有一个「偷懒」的地方一直没动：**环境光**。它到现在还是一个常数，模型上不管什么地方，分到的环境光都一样多。

今天我们就来实现**环境光遮蔽（Ambient Occlusion，简称 AO）**，让环境光也有明有暗。会讲两种方法：一种是简单粗暴的暴力法，另一种是游戏里常用的屏幕空间环境光遮蔽（SSAO）。最后再把这十天做的东西都组合起来，拍一张全家福。

> 本文源码 👉：[toy-renderer-ts/days/day10](https://github.com/skychx/toy-renderer-ts/tree/main/days/day10)

## 1.环境光为什么不该是常数

Phong 光照模型里的环境光，模拟的是从四面八方反射过来的间接光。用一个常数来表示，背后的假设是：**每个点从各个方向收到的间接光都一样多**。

这个假设在空旷的地方还说得过去，到了角落里就不对了。想象一个阴天，整片天空都是亮的：站在空地上的人，被天空均匀地照着；蹲在墙角的人就要暗一些，因为有一半的天空被墙挡住了。

模型上也是一样的道理。眼窝、鼻孔、胳膊和身体之间的缝隙，周围都有东西挡着，能照进去的环境光自然就少。环境光遮蔽要算的就是：**每个点周围，有多少比例的方向没有被挡住**。

真正的全局光照要模拟光在物体之间来回反射，计算量非常大；环境光遮蔽只考虑「挡没挡住」，算是一个又便宜又好用的近似。

## 2.暴力法

### 2.1 思路

怎么知道一个点周围有多少方向被挡住了？昨天的阴影其实已经回答了一半：Shadow Mapping 能告诉我们，一个点在**某一个**光照方向上有没有被挡住。

那就把这件事重复很多遍：**假设模型被一个均匀发光的大球包围着，我们在球面上取几百个方向，每个方向都当成一个平行光源，算一次阴影**。一个点在多少个方向上没有被挡住，它的环境光就有多亮。

### 2.2 在球面上均匀地取点

第一步是在球面上取点，而且要取得**均匀**，不然有的方向的光就被算多了。

最直接的想法是随机取一个经度、再随机取一个纬度。但这样取出来的点并不均匀，会扎堆在两极（下面左图）。原因是纬度越高，纬线圈越短，同样多的点挤在越来越短的纬线圈上，自然就越来越密了。

![两种在球面上取点的方法](/img/toy-renderer/day10/sphere-sampling.svg)

正确的做法有点反直觉：**让 y 在 $[-1, 1]$ 里均匀分布**，再随机转一个角度（上面右图）。这背后有一个阿基米德发现的有趣结论：用两个平行平面去切一个球，切下来的那一圈球面的面积，只和两个平面之间的距离有关，和切在哪里无关。所以 y 均匀分布，点在球面上就是均匀分布的：

```ts
// 在球面上均匀地取一个方向
function randomSphereDirection(): Vec3 {
  // y 在 [-1, 1] 里均匀分布，再随机转一个角度，得到的点在球面上就是均匀分布的
  const y = Math.random() * 2 - 1;
  const phi = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(1 - y * y);
  return [r * Math.cos(phi), y, r * Math.sin(phi)];
}
```

### 2.3 每个方向一张 shadow map

对于每个方向，都把相机放过去，用正交投影渲染一张 shadow map，和昨天的第一遍一模一样。为了算得快一点，这里的 shadow map 只用 400x400 的画布：

```ts
// 一个方向上的 shadow map
type ShadowMap = {
  dir: Vec3; // 指向光源的方向
  depth: Float32Array; // 从这个方向看过去的深度
  M: Mat; // 从模型坐标变换到这张 shadow map 屏幕上的矩阵
};

const shadowMapSize = 400; // shadow map 用小一点的画布，算得快一些

// 把相机放在 dir 方向上，用正交投影渲染一遍，得到这个方向的 shadow map（和 day9 的第一遍一样）
function createShadowMap(models: Model[], dir: Vec3): ShadowMap {
  // 方向几乎朝正上方或者正下方时，up 不能再取 (0, 1, 0)，否则叉乘出来是 0
  const up: Vec3 = Math.abs(dir[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
  const uniforms = createUniforms(dir, false, up);
  const frame = new Frame(shadowMapSize, shadowMapSize);
  const depth = new Float32Array(shadowMapSize * shadowMapSize).fill(-Infinity);
  render(
    models.map(model => [model, new DepthShader(model, uniforms)]),
    frame,
    depth,
  );
  const M = matMul(viewportOf(frame), matMul(uniforms.Projection, uniforms.ModelView));
  return { dir, depth, M };
}
```

这里有个小坑提一下：day6 的 lookAt 是用 $\vec{up} \times \vec{z}$ 来算相机 x 轴的。如果相机正好在模型的正上方或者正下方，视线和 up 平行，叉乘出来是零向量，归一化的时候就会除以 0。所以这种时候要换一个 up。

我们一共取 256 个方向，就要渲染 256 张 shadow map。为了不让页面卡住，每渲染几张，就让浏览器喘口气，顺便更新一下进度：

```ts
const shadowMaps: ShadowMap[] = [];
for (let i = 0; i < 256; i++) {
  shadowMaps.push(createShadowMap([head.model], randomSphereDirection()));
  if (i % 8 === 0) {
    progress.textContent = `正在渲染 shadow map：${i} / 256`;
    await new Promise(resolve => setTimeout(resolve)); // 让浏览器喘口气，更新一下进度
  }
}
```

### 2.4 数一数有多少个方向没被挡住

最后从相机的位置渲染一遍。片元着色器拿到当前像素以后，挨个检查它在这 256 个方向上有没有被挡住，每一次检查都和昨天的阴影测试一样：

```ts
fragment(bar: Vec3, fragCoord: Vec3): Color | null {
  const n = normalize(interpolate(this.varyingNormal, bar));
  // 当前像素在模型上的位置：和 day9 一样，用相机矩阵的逆矩阵变换回去
  const p = matVec(this.MCameraInverse, [...fragCoord, 1] as Vec4);

  let lit = 0;
  for (const { dir, depth, M } of this.shadowMaps) {
    // 表面背对着这个方向，光肯定照不到
    if (dot(n, dir) <= 0) {
      continue;
    }
    // 和 day9 一样的阴影测试
    const [x, y, z, w] = matVec(M, p);
    const sx = Math.round(x / w);
    const sy = Math.round(y / w);
    const outside = sx < 0 || sy < 0 || sx >= shadowMapSize || sy >= shadowMapSize;
    if (outside || depth[sx + sy * shadowMapSize] < z / w + 0.03) {
      lit++;
    }
  }

  // 表面最多只能被一半的方向照到（另一半在它背面），所以乘 2，没被挡住的地方正好是 1
  const ao = Math.min(1, (lit * 2) / this.shadowMaps.length);
  const uv = interpolate(this.varyingUV, bar);
  const color: Color = this.diffuse ? this.diffuse.get(uv[0], uv[1]) : [255, 255, 255];
  return [color[0] * ao, color[1] * ao, color[2] * ao];
}
```

有两个细节值得说一下：

- **背对的方向直接跳过**：一个点只能被它「前面」的光照到，法线和光照方向的点乘小于 0，说明光是从背后来的，肯定照不到。这一步不能省：人头模型的脖子底部是开口的，如果不跳过，光会从开口照进脖子里面，被误算成照亮了外面
- **最后要乘 2**：任何一个点，都有一半的方向在它的背面，所以就算周围什么都没有，最多也只能被一半的方向照到。乘 2 以后，完全没被挡住的地方正好是 1

下面左边是只有环境光的效果，右边乘上了皮肤的颜色。眼窝、鼻翼、嘴角、耳朵后面、下巴底下，这些凹进去的地方都自然地暗了下去，人头一下子就有了立体感：

<RendererDemos title="左：只有环境光，右：环境光 × 皮肤的颜色">
  <RendererDemo src="day10/ao-head" title="只有环境光" />
  <RendererDemo src="day10/ao-head-texture" title="环境光 × 皮肤的颜色" />
</RendererDemos>

### 2.5 小结

暴力法的效果很好，问题是太慢了：为了一帧画面，要额外渲染几百遍场景。所以实际中一般不会每一帧都这么算，而是**提前算好存起来**，这个过程叫做「烘焙」。

原教程第一版就是把结果烘焙到了一张贴图里：对每个方向，把能被看到的点按 uv 坐标在贴图上标记出来，最后取平均。这样算一次就能一直用，不过模型不能变形，而且还有一个坑：还记得 day8 说的，暗黑破坏神左右两条胳膊共用同一块贴图吗？两条胳膊的遮挡情况会被累加到同一个地方。原作者烘焙出来的暗黑破坏神看起来就有点怪，他在文章里还调侃了一句「Wow, he is in a bad mood...」（他看起来心情不太好啊），原因就出在这里。

## 3.屏幕空间环境光遮蔽（SSAO）

### 3.1 思路

暴力法太贵，游戏里每秒要渲染几十帧，可等不了这么久。于是就有了**屏幕空间环境光遮蔽（Screen Space Ambient Occlusion，SSAO）**，它的思路是：不去管整个场景，只用一张**深度图**（也就是 zbuffer）来估算遮挡。

我们可以把 zbuffer 想象成一张「地形图」：每个像素的深度就是这个位置的海拔，离相机越近，海拔越高。对于一个像素，往周围几个方向看过去，如果四周的「山」都很高，说明它在一个坑里，环境光就少；如果四周都是平地，环境光就多。

zbuffer 是渲染时顺手就有的数据，SSAO 只是在它的基础上做一次后处理，速度和场景复不复杂没关系，只和屏幕的分辨率有关，所以特别适合实时渲染。

### 3.2 照搬原教程

原教程的做法是这样的：对每个像素，往周围 8 个方向各走一段距离，找出这个方向上「地平线」的最大仰角。仰角越大，说明这个方向被挡得越多。

我一开始照搬了这个写法，结果是下面左图的样子：暗黑破坏神身上的效果还行，但是**地板整片都是灰的**，可地板明明是一块空旷的平面，什么都没有挡着它。

![左：照搬原教程的写法，右：改进以后](/img/toy-renderer/day10/ssao.jpg)

问题出在仰角是相对于**水平线**（也就是屏幕平面）来算的。地板在屏幕上是斜着的，离相机近的那一边深度更大，所以地板上的每个点，往近处看都像有一座「山」，就被误判成了被挡住：

![地平线的仰角，要相对于表面本身来算](/img/toy-renderer/day10/horizon.svg)

> 注：原教程的场景里只有暗黑破坏神，没有地板，所以这个问题不太明显；再加上作者最后用了一个 100 次方来拉高对比度，平面上的这点灰也就被压没了

### 3.3 改进：和表面本身比

解决方法是**和表面本身的倾斜程度比**：先用当前像素前后两个像素的深度差，估算出表面在这个方向上的坡度（切线），地平线只有比切线更高，才算是真的挡住了环境光。这样一来，平面不管怎么斜，地平线都和切线重合，就不会被误判了。

另外还加了一个距离判断：如果某个像素比当前像素高出太多，说明它离得很远（比如站在地板前面的暗黑破坏神的腿），不应该算作遮挡。不然物体的轮廓周围会出现一圈黑边，这是 SSAO 里很常见的一个问题。

```ts
// 沿着 (dx, dy) 方向往外走，看看周围的「地平线」比表面本身高出多少（用角度表示）
function horizonAngle(zbuffer: Float32Array, x: number, y: number, dx: number, dy: number) {
  const z = zbuffer[x + y * width];
  const depthAt = (t: number) => {
    const cx = Math.round(x + dx * t);
    const cy = Math.round(y + dy * t);
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) {
      return -Infinity;
    }
    return zbuffer[cx + cy * width];
  };

  // 表面本身在这个方向上的倾斜角度：用前后两个像素的深度差来估算
  const front = depthAt(1);
  const back = depthAt(-1);
  if (front === -Infinity || back === -Infinity) {
    return 0; // 在模型的边缘上，估算不出来，就当作没有遮挡
  }
  const tangent = Math.atan(((front - back) / 2) * depthScale);

  // 往外走，找出地平线的最大仰角
  let horizon = tangent;
  for (let t = 2; t <= 30; t++) {
    const neighbor = depthAt(t);
    if (neighbor === -Infinity) {
      break; // 走到背景上了
    }
    const elevation = (neighbor - z) * depthScale; // 高度差，单位是像素
    if (elevation > 30) {
      continue; // 高出太多的东西离得太远，不算遮挡
    }
    horizon = Math.max(horizon, Math.atan(elevation / t));
  }
  // 地平线只有比表面本身的倾斜程度更高，才会挡住环境光
  return horizon - tangent;
}
```

`depthScale` 是一个换算系数：深度的单位和屏幕上的像素不一样，乘上视口矩阵的缩放系数（day6 里的 $\frac{w}{2}$），高度差就换算成了像素，这样和距离 `t` 比才有意义。

把 8 个方向的遮挡加起来，就得到了每个像素的环境光遮蔽：

```ts
// 把 zbuffer 当成一张「地形图」，看看每个像素四周的「山」有多高
function ssao(zbuffer: Float32Array): Float32Array {
  const ao = new Float32Array(width * height).fill(1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (zbuffer[x + y * width] === -Infinity) {
        continue; // 背景
      }
      // 往周围 8 个方向看，地平线越高，能照进来的环境光就越少
      let occlusion = 0;
      for (let k = 0; k < 8; k++) {
        const angle = (k * Math.PI) / 4;
        occlusion += Math.sin(horizonAngle(zbuffer, x, y, Math.cos(angle), Math.sin(angle)));
      }
      // 平方一下，让明暗对比更明显
      ao[x + y * width] = Math.pow(1 - occlusion / 8, 2);
    }
  }
  return ao;
}
```

改进以后的效果就是上面的右图：地板恢复成了白色，胸甲之间的缝隙、胳膊和身体之间、角的根部这些凹进去的地方暗了下来，脚和地板接触的地方还多了一圈淡淡的阴影。

这种「找地平线」的思路，其实就是 NVIDIA 提出的 HBAO（Horizon-Based Ambient Occlusion）的核心想法，只是我们做了很多简化。SSAO 也有它的局限：它只能看到屏幕上有的东西，屏幕外面、或者被挡在后面的物体，它就不知道了；实际的实现里还会加上随机采样、模糊等处理，让结果更平滑。

## 4.全家福

最后，我们把这十天做的东西都放到一起：切线空间的法线贴图、Phong 光照、阴影，再加上今天的 SSAO。

做法也很简单：先只画一遍深度，用 SSAO 算出每个像素的环境光遮蔽，存在 `aobuffer` 里；正式着色的时候，片元着色器按 `fragCoord` 去 `aobuffer` 里取出当前像素的值，乘在环境光上：

```ts
// 当前像素的环境光遮蔽，直接按屏幕坐标去 SSAO 的结果里取
const ao = this.aobuffer[fragCoord[0] + fragCoord[1] * width];
```

```ts
const ambient = 0.5 * ao;
```

这就是我们十天的成果：

<RendererDemo src="day10/final" title="全家福：法线贴图 + Phong 光照 + 阴影 + SSAO" />

<br />

<br />

## 5.写在最后

回头看一下这十天，我们从在画布上点一个像素开始：

- day1~day4：画点、画线、画三角形，用 zbuffer 处理遮挡，再贴上纹理
- day5~day6：用矩阵和齐次坐标实现透视投影，让相机能从任意角度观察模型
- day7：抽出渲染管线，有了顶点着色器和片元着色器
- day8~day10：在着色器里实现法线贴图、Phong 光照、阴影和环境光遮蔽

整个渲染器的核心部分（画布、数学库、模型解析、贴图和 `gl.ts`）加起来也就 400 多行 TypeScript，没有用到任何第三方库，所有的像素都是我们自己一个一个算出来的。

当然，这离真正的渲染引擎还差得很远：没有抗锯齿，没有透视校正，没有半透明，速度也慢得可怜。不过造这个轮子的目的从来都不是性能，而是搞清楚 OpenGL 这类图形 API 在底层到底做了些什么。现在再去看 OpenGL 的文档，顶点着色器、片元着色器、`gl_FragCoord`、深度测试这些概念，应该都不陌生了。

如果还想继续玩下去，我准备了几篇番外：

- **透视校正插值**：仔细看 day9、day10 的地板，棋盘格在三角形的对角线那里是「弯」的，这一篇就来解决它
- **卡通渲染**：只改着色器，给模型换一个画风
- **[用 WebGPU 重写一遍](./extra3-WebGL.md)**：把我们的着色器搬到真正的 GPU 上跑，看看显卡是怎么干同样的事的
- **[软渲染器性能优化](./extra4-Software-optimization.md)**：回到 CPU，去掉重复的切线计算、重心坐标计算和临时数组，看看还能快多少

想系统地往下学的话，推荐 GAMES202（高质量实时渲染），阴影、环境光遮蔽、全局光照这些话题它都讲得很深入；或者换一个方向，试试光线追踪，那又是另外一个好玩的轮子了。

最后，感谢 [ssloy](https://github.com/ssloy) 大神的 [tinyrenderer](https://github.com/ssloy/tinyrenderer)，没有这么好的教程，就不会有这个系列。

## 参考链接

[tinyrenderer Lesson 8: Ambient occlusion](https://github.com/ssloy/tinyrenderer/wiki/Lesson-8:-Ambient-occlusion)

[tinyrenderer（第二版）：Indirect lighting](https://haqr.eu/tinyrenderer/ssao/)

[Sphere Point Picking - Wolfram MathWorld](https://mathworld.wolfram.com/SpherePointPicking.html)

[GAMES202-高质量实时渲染](https://www.bilibili.com/video/BV1YK4y1T7yY)

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::
