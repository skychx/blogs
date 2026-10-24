# Website

This website is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ pnpm dev
# English: pnpm dev:en
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

Local development automatically proxies images from `image-1255652541.file.myqcloud.com` through `__dev-images` on the dev server, which sends `Referer: http://supercodepower.com/` to the image host. This avoids hotlink protection blocking localhost previews. The plugin rewrites image host URLs in compiled site modules, including Markdown, JSX, CSS, and the navbar configuration. Production builds keep the original URLs and do not enable the proxy. Restart the dev server after changing the plugin configuration.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

```
$ GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
