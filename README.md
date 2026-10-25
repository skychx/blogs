# Website

This website is built using [Docusaurus 3](https://docusaurus.io/).

### Installation

Use Node.js **24.22.1** (LTS) and pnpm **12.15.0**. The versions are pinned in `.node-version` and `package.json` so local development and Cloudflare Workers Builds use the same tools.

```sh
fnm install
fnm use
npm install --global pnpm@12.15.0
pnpm install --frozen-lockfile
```

### Local Development

```sh
pnpm dev
# English: pnpm dev:en
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

Local development automatically proxies images from `image-1255652541.file.myqcloud.com` through `__dev-images` on the dev server, which sends `Referer: http://supercodepower.com/` to the image host. This avoids hotlink protection blocking localhost previews. The plugin rewrites image host URLs in compiled site modules, including Markdown, JSX, CSS, and the navbar configuration. Production builds keep the original URLs and do not enable the proxy. Restart the dev server after changing the plugin configuration.

### Build

```sh
pnpm test:rehype-image-size
pnpm test:gitalk-axios
pnpm build
```

The build generates both Chinese and English static pages in `build`. Stop the development server before building, then restart it afterwards: both commands write generated files to `.docusaurus`.

### Deployment

Configure Cloudflare Workers Builds with `pnpm build` as the build command and `pnpm deploy:cloudflare` as the deploy command. Wrangler deploys the static `build` directory using `wrangler.jsonc`. Node runs during the build; the deployed site serves static assets.

Workers Builds reads `.node-version` for Node and the exact `packageManager` version for pnpm. If the dashboard has `NODE_VERSION` or `PNPM_VERSION` build variables, keep them at `24.22.1` and `12.15.0` respectively, since build variables can override repository settings. These are build variables, not Worker runtime bindings.

### Dependency security

`pnpm-workspace.yaml` pins security fixes for indirect dependencies until their parent packages update. The Gitalk patch also routes its bundled Axios entry to the updated dependency; an override alone would leave the old embedded copy active. After changing these pins, run both test scripts, a complete build, and `pnpm audit`.

KaTeX remains at `0.16.31` to preserve the existing formula spacing. The remaining low-severity advisory, [GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7), requires an already polluted renderer prototype and attacker-controlled expressions. Formula rendering currently happens at build time from repository Markdown. Upgrading KaTeX also needs a separate formula layout review.
