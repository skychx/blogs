// 图片尺寸插件测试，运行：pnpm test:rehype-image-size
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {createRequire} = require("node:module");
const {pathToFileURL} = require("node:url");
const {test} = require("node:test");
const rehypeImageSize = require("../plugins/rehype-image-size");

const siteDir = path.join(__dirname, "..");
const REMOTE_SRC = "https://example.com/cached.png";

// 用临时缓存文件：远程图片直接命中缓存，不依赖网络，也不会改到仓库里的 .cache
const cacheFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rehype-image-size-")), "cache.json");
fs.writeFileSync(
  cacheFile,
  JSON.stringify({version: 1, entries: {[`remote:${REMOTE_SRC}`]: {width: 1200, height: 800}}})
);

const transformer = rehypeImageSize({siteDir, cacheFile});

function img(properties) {
  return {type: "element", tagName: "img", properties, children: []};
}

async function run(...nodes) {
  const messages = [];
  const file = {path: path.join(siteDir, "blog/test.md"), message: (message) => messages.push(message)};
  await transformer({type: "root", children: nodes}, file);
  return messages;
}

test("static 目录下的本地图片", async () => {
  const node = img({src: "/img/logo.jpeg"});
  await run(node);
  assert.equal(node.properties.style, "width: 100%; aspect-ratio: auto 640 / 640;");
});

test("相对 md 文件路径的本地图片", async () => {
  const node = img({src: "../static/img/undraw_docusaurus_tree.svg"});
  await run(node);
  assert.equal(node.properties.style, "width: 100%; aspect-ratio: auto 1129 / 663;");
});

test("远程图片命中缓存", async () => {
  const node = img({src: REMOTE_SRC});
  await run(node);
  assert.equal(node.properties.style, "width: 100%; aspect-ratio: auto 1200 / 800;");
});

test("保留作者在属性或 style 中写的宽度，未写宽度时默认 100%", async () => {
  const percentage = img({src: REMOTE_SRC, width: "40%"});
  const pixels = img({src: REMOTE_SRC, width: 200, height: 100});
  const withStyle = img({src: REMOTE_SRC, style: "width: 50%"});
  const otherStyle = img({src: REMOTE_SRC, style: "max-width: 400px; border-radius: 8px"});
  await run(percentage, pixels, withStyle, otherStyle);
  assert.equal(percentage.properties.width, "40%");
  assert.equal(percentage.properties.style, "aspect-ratio: auto 1200 / 800;");
  assert.equal(pixels.properties.width, 200);
  assert.equal(pixels.properties.height, 100);
  assert.equal(pixels.properties.style, "aspect-ratio: auto 1200 / 800;");
  assert.equal(withStyle.properties.style, "width: 50%; aspect-ratio: auto 1200 / 800;");
  assert.equal(otherStyle.properties.style, "max-width: 400px; border-radius: 8px; width: 100%; aspect-ratio: auto 1200 / 800;");
});

test("保留作者指定的 aspect-ratio", async () => {
  const withRatio = img({src: REMOTE_SRC, style: "aspect-ratio: 1 / 1"});
  await run(withRatio);
  assert.equal(withRatio.properties.style, "aspect-ratio: 1 / 1; width: 100%;");
});

test("md 里手写的 <img> 标签（MDX JSX 节点）", async () => {
  const node = {
    type: "mdxJsxTextElement",
    name: "img",
    attributes: [
      {type: "mdxJsxAttribute", name: "src", value: REMOTE_SRC},
      {type: "mdxJsxAttribute", name: "alt", value: "demo"},
    ],
    children: [],
  };
  await run(node);
  assert.equal(node.type, "element");
  assert.deepEqual(node.properties, {src: REMOTE_SRC, alt: "demo", style: "width: 100%; aspect-ratio: auto 1200 / 800;"});
});

test("拿不到尺寸时仍使用默认宽度，并给出提示", async () => {
  const node = img({src: "/img/not-exist.png"});
  const messages = await run(node);
  assert.equal(node.properties.style, "width: 100%;");
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Failed to resolve image dimensions for "\/img\/not-exist\.png"/);
});

test("实际 MDX 编译和 SSR 保留百分比、像素及 JSX 宽度，动态样式不被覆盖", async () => {
  const docusaurusRequire = createRequire(require.resolve("@docusaurus/core/package.json"));
  const mdxRequire = createRequire(docusaurusRequire.resolve("@docusaurus/mdx-loader/package.json"));
  const {evaluate} = await import(pathToFileURL(mdxRequire.resolve("@mdx-js/mdx")).href);
  const React = require("react");
  const {renderToStaticMarkup} = require("react-dom/server");
  const source = [
    `![default](${REMOTE_SRC})`,
    `<img src="${REMOTE_SRC}" alt="percent" width="40%" />`,
    `<img src="${REMOTE_SRC}" alt="pixels" width="200" />`,
    `<img src="${REMOTE_SRC}" alt="jsx" width={400} />`,
    `<img src="${REMOTE_SRC}" alt="dynamic" style={{width: "25%"}} />`,
    `<img src="${REMOTE_SRC}" alt="inline-style" style="width: 30%" />`,
  ].join("\n\n");
  const {default: Content} = await evaluate({value: source, path: path.join(siteDir, "blog/test.mdx")}, {
    ...require("react/jsx-runtime"),
    rehypePlugins: [[rehypeImageSize, {siteDir, cacheFile}]],
  });
  const html = renderToStaticMarkup(React.createElement(Content));
  const images = html.match(/<img\b[^>]*>/g);
  assert.equal(images.length, 6);
  assert.match(images[0], /style="width:100%;aspect-ratio:auto 1200 \/ 800"/);
  assert.match(images[1], /width="40%"/);
  assert.match(images[2], /width="200"/);
  assert.match(images[3], /width="400"/);
  for (const image of images.slice(1, 4)) {
    assert.match(image, /style="aspect-ratio:auto 1200 \/ 800"/);
    assert.doesNotMatch(image, /width:100%/);
  }
  assert.match(images[4], /style="width:25%"/);
  assert.match(images[5], /style="width:30%;aspect-ratio:auto 1200 \/ 800"/);
});

test("Docusaurus 自动生成的本地图片宽高不影响默认 100% 的显示宽度", async () => {
  const docusaurusRequire = createRequire(require.resolve("@docusaurus/core/package.json"));
  const loaderPath = docusaurusRequire.resolve("@docusaurus/mdx-loader/package.json");
  const mdxRequire = createRequire(loaderPath);
  const {compile} = await import(pathToFileURL(mdxRequire.resolve("@mdx-js/mdx")).href);
  const transformImage = require(path.join(path.dirname(loaderPath), "lib/remark/transformImage")).default;
  const source = '![local](/img/logo.jpeg)\n\n<img src="/img/logo.jpeg" width="200" />';
  const result = await compile({value: source, path: path.join(siteDir, "blog/test.mdx")}, {
    remarkPlugins: [[transformImage, {siteDir, staticDirs: [path.join(siteDir, "static")], onBrokenMarkdownImages: "throw"}]],
    rehypePlugins: [[rehypeImageSize, {siteDir, cacheFile}]],
  });
  const code = String(result);
  assert.match(code, /width: "640"/);
  assert.match(code, /height: "640"/);
  assert.match(code, /width: "100%"/);
  assert.match(code, /aspectRatio: "auto 640 \/ 640"/);
  assert.match(code, /width: "200"/);
  assert.equal(code.match(/width: "100%"/g).length, 1);
});
