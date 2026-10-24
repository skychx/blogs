module.exports = function devImageProxyLoader(source, sourceMap) {
  const {imageOrigin, proxyPath} = this.getOptions();
  const hostname = new URL(imageOrigin).hostname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imageUrl = new RegExp(`(?:https?:)?//${hostname}(?=/)`, "g");
  const rewritten = source.replace(imageUrl, proxyPath);

  // 同时覆盖 Markdown 图片、JSX、模板字符串、srcSet 和生成的站点配置。
  // 内容变化时丢弃旧 source map，避免 DevTools 指向错误的列。
  this.callback(null, rewritten, rewritten === source ? sourceMap : undefined);
};
