const fs = require("fs/promises");
const path = require("path");

const CACHE_VERSION = 1;
const defaultCacheStates = new Map();
const TRACE_KEY = process.env.TRACE_IMAGE_CACHE_KEY || "";

function getDefaultCacheFile(siteDir) {
  return path.join(siteDir, ".cache", "docusaurus-image-size-cache.json");
}

async function readCacheFile(cacheFile) {
  try {
    const content = await fs.readFile(cacheFile, "utf8");
    const parsed = JSON.parse(content);
    if (parsed && parsed.version === CACHE_VERSION && parsed.entries && typeof parsed.entries === "object") {
      return parsed.entries;
    }
  } catch (error) {
    return {};
  }

  return {};
}

function createPersistentCacheState(cacheFile) {
  let loaded = false;
  let dirty = false;
  let entries = new Map();
  let flushPromise = null;

  async function ensureLoaded() {
    if (loaded) {
      return;
    }

    const rawEntries = await readCacheFile(cacheFile);
    entries = new Map(Object.entries(rawEntries));
    loaded = true;
  }

  async function flush() {
    await ensureLoaded();
    if (!dirty) {
      return;
    }

    if (!flushPromise) {
      flushPromise = (async () => {
        const diskEntries = await readCacheFile(cacheFile);
        const mergedEntries = new Map(Object.entries(diskEntries));
        for (const [key, value] of entries) {
          mergedEntries.set(key, value);
        }

        const payload = {
          version: CACHE_VERSION,
          entries: Object.fromEntries(mergedEntries),
        };

        await fs.mkdir(path.dirname(cacheFile), {recursive: true});
        await fs.writeFile(cacheFile, JSON.stringify(payload, null, 2));
        entries = mergedEntries;
        dirty = false;
      })().finally(() => {
        flushPromise = null;
      });
    }

    await flushPromise;
  }

  return {
    cacheFile,
    async get(key) {
      await ensureLoaded();
      return entries.get(key) || null;
    },
    async set(key, value) {
      await ensureLoaded();

      const previous = entries.get(key);
      if (previous && previous.width === value.width && previous.height === value.height) {
        if (TRACE_KEY && key.includes(TRACE_KEY)) {
          console.warn(`[image-size-cache] skip unchanged ${key}`);
        }
        return;
      }

      entries.set(key, value);
      dirty = true;
      if (TRACE_KEY && key.includes(TRACE_KEY)) {
        console.warn(`[image-size-cache] set ${key} -> ${JSON.stringify(value)}`);
      }
    },
    async flush() {
      if (TRACE_KEY) {
        const matched = [...entries.keys()].filter((key) => key.includes(TRACE_KEY));
        if (matched.length > 0) {
          console.warn(`[image-size-cache] flush candidates ${matched.join(", ")}`);
        }
      }
      await flush();
    },
  };
}

function getPersistentImageSizeCache({siteDir, cacheFile}) {
  const resolvedCacheFile = cacheFile || getDefaultCacheFile(siteDir);

  if (!defaultCacheStates.has(resolvedCacheFile)) {
    defaultCacheStates.set(resolvedCacheFile, createPersistentCacheState(resolvedCacheFile));
  }

  return defaultCacheStates.get(resolvedCacheFile);
}

module.exports = {
  getPersistentImageSizeCache,
};
