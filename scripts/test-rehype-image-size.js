// plugins/rehype-image-size 的测试：pnpm test:rehype-image-size
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
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
  assert.equal(node.properties.style, "aspect-ratio: 640 / 640;");
});

test("相对 md 文件路径的本地图片", async () => {
  const node = img({src: "../static/img/undraw_docusaurus_tree.svg"});
  await run(node);
  assert.equal(node.properties.style, "aspect-ratio: 1129 / 663;");
});

test("远程图片命中缓存", async () => {
  const node = img({src: REMOTE_SRC});
  await run(node);
  assert.equal(node.properties.style, "aspect-ratio: 1200 / 800;");
});

test("追加到已有 style 后面，已经写了 aspect-ratio 的不覆盖", async () => {
  const withStyle = img({src: REMOTE_SRC, style: "width: 50%"});
  const withRatio = img({src: REMOTE_SRC, style: "aspect-ratio: 1 / 1"});
  await run(withStyle, withRatio);
  assert.equal(withStyle.properties.style, "width: 50%; aspect-ratio: 1200 / 800;");
  assert.equal(withRatio.properties.style, "aspect-ratio: 1 / 1");
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
  assert.deepEqual(node.properties, {src: REMOTE_SRC, alt: "demo", style: "aspect-ratio: 1200 / 800;"});
});

test("拿不到尺寸时不加样式，并给出提示", async () => {
  const node = img({src: "/img/not-exist.png"});
  const messages = await run(node);
  assert.equal(node.properties.style, undefined);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Failed to resolve image dimensions for "\/img\/not-exist\.png"/);
});
