const path = require("path");
const {createImageDimensionResolver} = require("./utils");

const DEFAULT_TIMEOUT = 8000;
const DEBUG = process.env.DEBUG_REHYPE_IMAGE_SIZE === "1";
const pendingWarnings = new Set();
let summaryHookInstalled = false;

function hasStyleProperty(style, property) {
  return typeof style === "string" && new RegExp(`(?:^|;)\\s*${property}\\s*:`, "i").test(style);
}

function appendStyle(style, rule) {
  if (!style) {
    return rule;
  }

  const normalized = String(style).trim();
  const suffix = normalized.endsWith(";") ? "" : ";";
  return `${normalized}${suffix} ${rule}`;
}

function isHtmlImageNode(node) {
  return node && node.type === "element" && node.tagName === "img";
}

function isMdxJsxImageNode(node) {
  return node && (node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") && node.name === "img";
}

function getMdxJsxAttribute(node, name) {
  if (!Array.isArray(node.attributes)) {
    return null;
  }

  return node.attributes.find((attribute) => attribute && attribute.type === "mdxJsxAttribute" && attribute.name === name) || null;
}

function getSerializableMdxJsxProperties(node) {
  if (!isMdxJsxImageNode(node) || !Array.isArray(node.attributes)) {
    return null;
  }

  const properties = {};
  for (const attribute of node.attributes) {
    if (!attribute || attribute.type !== "mdxJsxAttribute" || typeof attribute.name !== "string") {
      return null;
    }

    if (typeof attribute.value === "string" || attribute.value == null) {
      properties[attribute.name] = attribute.value == null ? true : attribute.value;
      continue;
    }

    return null;
  }

  return properties;
}

function normalizeImageNode(node) {
  if (!isMdxJsxImageNode(node)) {
    return node;
  }

  const properties = getSerializableMdxJsxProperties(node);
  if (!properties) {
    return node;
  }

  node.type = "element";
  node.tagName = "img";
  node.properties = properties;
  delete node.name;
  delete node.attributes;

  return node;
}

function getImageSrc(node) {
  if (isHtmlImageNode(node)) {
    const properties = node.properties || {};
    return typeof properties.src === "string" ? properties.src : null;
  }

  if (isMdxJsxImageNode(node)) {
    const srcAttribute = getMdxJsxAttribute(node, "src");
    return srcAttribute && typeof srcAttribute.value === "string" ? srcAttribute.value : null;
  }

  return null;
}

function getImageStyle(node) {
  if (isHtmlImageNode(node)) {
    const properties = node.properties || {};
    return properties.style;
  }

  if (isMdxJsxImageNode(node)) {
    const styleAttribute = getMdxJsxAttribute(node, "style");
    return styleAttribute ? styleAttribute.value : null;
  }

  return null;
}

function getGeneratedLocalImageDimensions(node) {
  // Docusaurus 把本地 Markdown 图片转换为无源位置的 require() JSX，并自动填入宽高。
  // 这些宽高用于占位，不是作者指定的显示宽度。
  if (!isMdxJsxImageNode(node) || node.position) {
    return null;
  }

  const src = getMdxJsxAttribute(node, "src")?.value;
  if (src?.type !== "mdxJsxAttributeValueExpression" || !src.value?.startsWith("require(")) {
    return null;
  }

  const width = Number(getMdxJsxAttribute(node, "width")?.value);
  const height = Number(getMdxJsxAttribute(node, "height")?.value);
  return width > 0 && height > 0 ? {width, height} : null;
}

function setImageStyle(node, style, declarations) {
  if (isHtmlImageNode(node)) {
    const properties = node.properties || (node.properties = {});
    properties.style = style;
    return;
  }

  if (isMdxJsxImageNode(node)) {
    // 未转换成 HAST 的 JSX（例如 width={400}）需要 React style 对象，不能传 CSS 字符串。
    const attributes = Array.isArray(node.attributes) ? node.attributes : (node.attributes = []);
    attributes.push({
      type: "mdxJsxAttribute",
      name: "style",
      value: {
        type: "mdxJsxAttributeValueExpression",
        value: JSON.stringify(declarations),
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [{
              type: "ExpressionStatement",
              expression: {
                type: "ObjectExpression",
                properties: Object.entries(declarations).map(([key, value]) => ({
                  type: "Property",
                  key: {type: "Identifier", name: key},
                  value: {type: "Literal", value},
                  kind: "init",
                  method: false,
                  shorthand: false,
                  computed: false,
                })),
              },
            }],
          },
        },
      },
    });
  }
}

function getFileLabel(file) {
  if (file && typeof file.path === "string") {
    return path.relative(process.cwd(), file.path);
  }

  return "unknown-file";
}

function warn(file, node, message) {
  if (file && typeof file.message === "function") {
    file.message(message, node);
  }

  if (!DEBUG) {
    pendingWarnings.add(message);
    installSummaryHook();
    return;
  }

  console.warn(message);
}

function debugLog(message) {
  if (DEBUG) {
    console.log(`[rehype-image-size] ${message}`);
  }
}

function flushWarningSummary() {
  if (pendingWarnings.size === 0) {
    return;
  }

  const warnings = [...pendingWarnings];
  pendingWarnings.clear();
  console.warn(`[rehype-image-size] ${warnings.length} images failed to resolve dimensions:`);
  for (const warning of warnings) {
    console.warn(warning);
  }
}

function installSummaryHook() {
  if (summaryHookInstalled) {
    return;
  }

  summaryHookInstalled = true;
  process.once("beforeExit", flushWarningSummary);
  process.once("exit", flushWarningSummary);
}

function visit(node, callback) {
  if (!node || typeof node !== "object") {
    return;
  }

  callback(node);

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      visit(child, callback);
    }
  }
}

function applyDimensionsToImage(node, dimensions, generatedLocalImage = false) {
  const style = getImageStyle(node);

  if (style && typeof style !== "string") {
    return;
  }

  // 含动态 style 或属性展开的 JSX 无法静态判断宽度，保留作者的设置。
  if (
    isMdxJsxImageNode(node) &&
    (style != null || node.attributes?.some((attribute) => attribute.type === "mdxJsxExpressionAttribute"))
  ) {
    return;
  }

  const hasWidth = isHtmlImageNode(node)
    ? node.properties?.width != null
    : getMdxJsxAttribute(node, "width") != null;
  const declarations = {};
  let nextStyle = style;

  if ((!hasWidth || generatedLocalImage) && !hasStyleProperty(style, "width")) {
    nextStyle = appendStyle(nextStyle, "width: 100%;");
    declarations.width = "100%";
  }

  if (dimensions && !hasStyleProperty(style, "aspect-ratio")) {
    const ratio = `auto ${dimensions.width} / ${dimensions.height}`;
    nextStyle = appendStyle(nextStyle, `aspect-ratio: ${ratio};`);
    declarations.aspectRatio = ratio;
  }

  if (nextStyle !== style) {
    setImageStyle(node, nextStyle, declarations);
  }
}

function rehypeImageSize(options = {}) {
  const siteDir = options.siteDir || process.cwd();
  const resolver = createImageDimensionResolver({
    siteDir,
    timeout: options.timeout || DEFAULT_TIMEOUT,
    cacheFile: options.cacheFile,
    onDebug: (result, src, filePath) => {
      debugLog(`${result ? "resolved" : "failed"} ${src} in ${filePath ? path.relative(process.cwd(), filePath) : "unknown-file"}`);
    },
  });

  return async function transformer(tree, file) {
    const tasks = [];

    visit(tree, (node) => {
      const normalizedNode = normalizeImageNode(node);

      if (!isHtmlImageNode(normalizedNode) && !isMdxJsxImageNode(normalizedNode)) {
        return;
      }

      const src = getImageSrc(normalizedNode);
      if (!src) {
        const dimensions = getGeneratedLocalImageDimensions(normalizedNode);
        if (dimensions) {
          applyDimensionsToImage(normalizedNode, dimensions, true);
        }
        return;
      }

      tasks.push(
        resolver.resolve(src, file.path).then((dimensions) => {
          applyDimensionsToImage(normalizedNode, dimensions);
          if (dimensions) {
            return;
          }

          const message = `[rehype-image-size] Failed to resolve image dimensions for "${src}" in "${getFileLabel(
            file
          )}"`;
          warn(file, normalizedNode, message);
        })
      );
    });

    await Promise.all(tasks);
    await resolver.flush();
  };
}

module.exports = rehypeImageSize;
