// 本地预览通过同源代理加载图床图片，由 dev server 补上防盗链所需的 Referer。
module.exports = function devImageProxy(context) {
  const proxyPath = `${context.baseUrl}__dev-images`;
  const imageOrigin = "https://image-1255652541.file.myqcloud.com";

  return {
    name: "dev-image-proxy",
    configureWebpack(config, isServer) {
      if (config.mode !== "development" || isServer) {
        return {};
      }

      return {
        module: {
          rules: [
            {
              test: /\.(?:[cm]?[jt]sx?|mdx?|css|json)$/i,
              include: context.siteDir,
              exclude: /node_modules/,
              // 在 MDX / CSS 编译完成后替换，保留图片尺寸插件对原始 URL 的处理。
              enforce: "post",
              use: [{loader: require.resolve("./loader"), options: {imageOrigin, proxyPath}}],
            },
          ],
        },
        devServer: {
          proxy: [
            {
              context: [proxyPath],
              target: imageOrigin,
              changeOrigin: true,
              headers: {Referer: "http://supercodepower.com/"},
              pathRewrite: (requestPath) => requestPath.slice(proxyPath.length) || "/",
            },
          ],
        },
      };
    },
  };
};
