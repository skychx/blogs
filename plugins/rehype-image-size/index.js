const path = require("path");
const {createImageDimensionResolver} = require("./utils");

const DEFAULT_TIMEOUT = 8000;
const DEBUG = process.env.DEBUG_REHYPE_IMAGE_SIZE === "1";
const pendingWarnings = new Set();
let summaryHookInstalled = false;

function hasExplicitAspectRatio(style) {
  return typeof style === "string" && /(?:^|;)\s*aspect-ratio\s*:/i.test(style);
}

function appendStyle(style, rule) {
  if (!style) {
    return rule;
  }

  const normalized = String(style).trim();
  const suffix = normalized.endsWith(";") ? "" : ";";
  return `${normalized}${suffix} ${rule}`;
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

function applyDimensionsToImage(node, dimensions) {
  const properties = node.properties || (node.properties = {});
  const style = properties.style;

  if (!hasExplicitAspectRatio(style)) {
    properties.style = appendStyle(style, `aspect-ratio: ${dimensions.width} / ${dimensions.height};`);
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
      if (node.type !== "element" || node.tagName !== "img") {
        return;
      }

      const properties = node.properties || {};
      const src = typeof properties.src === "string" ? properties.src : null;
      if (!src) {
        return;
      }

      tasks.push(
        resolver.resolve(src, file.path).then((dimensions) => {
          if (dimensions) {
            applyDimensionsToImage(node, dimensions);
            return;
          }

          const message = `[rehype-image-size] Failed to resolve image dimensions for "${src}" in "${getFileLabel(
            file
          )}"`;
          warn(file, node, message);
        })
      );
    });

    await Promise.all(tasks);
    await resolver.flush();
  };
}

module.exports = rehypeImageSize;
