const fsSync = require("fs");
const fs = require("fs/promises");
const http = require("http");
const https = require("https");
const path = require("path");
const {createRequire} = require("module");
const {getPersistentImageSizeCache} = require("./cache");

let imageSizeFn;

function getImageSizeCandidates(siteDir) {
  const pnpmRoot = path.join(siteDir, "node_modules/.pnpm");
  const candidates = ["image-size"];

  try {
    const entries = fsSync.readdirSync(pnpmRoot, {withFileTypes: true});
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("image-size@")) {
        candidates.push(path.join(pnpmRoot, entry.name, "node_modules/image-size"));
      }
    }
  } catch (error) {
    return candidates;
  }

  return candidates;
}

function loadImageSize(siteDir) {
  if (imageSizeFn) {
    return imageSizeFn;
  }

  const requireFromSite = createRequire(path.join(siteDir, "package.json"));
  for (const candidate of getImageSizeCandidates(siteDir)) {
    try {
      const mod = requireFromSite(candidate);
      imageSizeFn = mod.imageSize || mod.default || mod;
      return imageSizeFn;
    } catch (error) {
      continue;
    }
  }

  throw new Error(
    "Unable to load image-size. Install it as a direct dependency or keep the current pnpm lockfile layout."
  );
}

function isRemoteUrl(src) {
  return /^https?:\/\//i.test(src);
}

function isDataUrl(src) {
  return /^data:/i.test(src);
}

function resolveLocalImagePath(src, filePath, siteDir) {
  if (!src || isRemoteUrl(src) || isDataUrl(src)) {
    return null;
  }

  if (src.startsWith("/")) {
    return path.join(siteDir, "static", src.slice(1));
  }

  if (!filePath) {
    return null;
  }

  return path.resolve(path.dirname(filePath), src);
}

async function getLocalCacheKey(localPath) {
  try {
    const stat = await fs.stat(localPath);
    return `local:${localPath}:${Math.floor(stat.mtimeMs)}`;
  } catch (error) {
    return null;
  }
}

async function readLocalImageBuffer(imagePath) {
  try {
    return await fs.readFile(imagePath);
  } catch (error) {
    return null;
  }
}

async function fetchRemoteImageBuffer(src, timeout) {
  return await new Promise((resolve) => {
    const client = src.startsWith("https:") ? https : http;
    const request = client.get(
      src,
      {
        headers: {
          Referer: "https://supercodepower.com/",
          "User-Agent": "docusaurus-image-metadata",
        },
      },
      (response) => {
        if ((response.statusCode || 0) >= 400) {
          response.resume();
          resolve(null);
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );

    request.setTimeout(timeout, () => request.destroy(new Error("request timeout")));
    request.on("error", () => resolve(null));
  });
}

function createImageDimensionResolver({siteDir, timeout = 8000, cacheFile, onDebug}) {
  const memoryCache = new Map();
  const persistentCache = getPersistentImageSizeCache({siteDir, cacheFile});
  const imageSize = loadImageSize(siteDir);

  async function resolve(src, filePath) {
    if (!src || isDataUrl(src)) {
      return null;
    }

    const localPath = resolveLocalImagePath(src, filePath, siteDir);
    const persistentCacheKey = localPath ? await getLocalCacheKey(localPath) : isRemoteUrl(src) ? `remote:${src}` : null;
    const cacheKey = persistentCacheKey || localPath || src;

    if (memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey);
    }

    if (persistentCacheKey) {
      const cached = await persistentCache.get(persistentCacheKey);
      if (cached) {
        memoryCache.set(cacheKey, cached);
        return cached;
      }
    }

    let dimensions = null;
    try {
      const buffer = localPath ? await readLocalImageBuffer(localPath) : await fetchRemoteImageBuffer(src, timeout);
      if (buffer) {
        dimensions = imageSize(buffer);
      }
    } catch (error) {
      dimensions = null;
    }

    const result =
      dimensions && dimensions.width && dimensions.height
        ? {width: dimensions.width, height: dimensions.height}
        : null;

    memoryCache.set(cacheKey, result);
    if (result && persistentCacheKey) {
      await persistentCache.set(persistentCacheKey, result);
    }
    if (onDebug) {
      onDebug(result, src, filePath);
    }

    return result;
  }

  async function flush() {
    await persistentCache.flush();
  }

  return {
    resolve,
    flush,
  };
}

module.exports = {
  createImageDimensionResolver,
};
