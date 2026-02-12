// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const remarkMath = require("remark-math");

const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "卤代烃实验室",
  tagline: "卤代烃实验室",
  url: "https://supercodepower.com",
  onBrokenLinks: "log", // build 过程中遇到可能无法访问的网站时打印提示
  baseUrl: "/",
  favicon: "img/favicon.ico",
  organizationName: "skychx", // Usually your GitHub org/user name.
  projectName: "超级码力", // Usually your repo name.
  stylesheets: [
    {
      href: "/katex/katex.min.css", // Latex CSS
      type: "text/css",
    },
  ],
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'google-site-verification',
        content: 'pw0OCxbsZncVZICWQ_zB22wf9f5p9COr3wz8_VepGcE'
      }
    },
  ],
  themeConfig: {
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    // announcementBar: {
    //   id: 'supportus',
    //   content:
    //     '⭐️ If you like Docusaurus, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/facebook/docusaurus">GitHub</a>! ⭐️',
    // },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      // https://prismjs.com/#supported-languages
      additionalLanguages: ['bash', 'diff', 'json', "java"],
    },
    algolia: {
      appId: "HX6GJ4R9GS",
      apiKey: "c44280a5e0935f35c65d72e8448d07ef",
      indexName: "supercodepower",
      contextualSearch: false,
    },
    navbar: {
      title: "卤代烃实验室",
      hideOnScroll: false,
      logo: {
        alt: "My Site Logo",
        src: "img/logo.jpeg",
        width: 32,
        height: 32,
      },
      items: [
        {
          to: "docs/learn/home",
          activeBasePath: "docs/learn",
          label: "📖 Courses & Books",
          position: "left",
        },
        {
          to: "docs/toys/home",
          activeBasePath: "docs/toys",
          label: "🧸 造轮子学原理",
          position: "left",
        },
        {
          to: "docs/react-native-upgrade/index",
          activeBasePath: "docs/react-native-upgrade",
          label: "⚛️ React Native 进阶",
          position: "left",
        },
        {
          href: "https://www.cnblogs.com/web-scraper/",
          label: "🕷️ 零代码写爬虫",
          position: "left",
        },
        {
          type: "localeDropdown",
          position: "right",
        },
        {
          href: "https://github.com/skychx",
          className: "header-github-link",
          "aria-label": "GitHub repository",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "🧭 项目导航",
          items: [
            {
              label: "博客 tags",
              to: "tags/",
            },
            {
              label: "React Native 升级指南",
              to: "docs/react-native-upgrade/index",
            },
            {
              label: "web scraper 零行代码写爬虫",
              to: "https://www.cnblogs.com/web-scraper/",
            },
          ],
        },
        {
          title: "🌐 社交账号",
          items: [
            {
              label: "掘金：卤代烃实验室",
              to: "https://juejin.im/user/43636193770071",
            },
            {
              label: "公众号：卤代烃实验室",
              to: "https://image-1255652541.file.myqcloud.com/uPic/20190709220018.png",
            },
            {
              label: "segmentfault：卤代烃",
              to: "https://segmentfault.com/u/skychx",
            },
            {
              label: "知乎",
              to: "https://www.zhihu.com/people/egglabs",
            },
          ],
        },
        {
          title: "👨‍💻 交流",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/skychx",
            },
            {
              label: "微信",
              href: "https://image-1255652541.file.myqcloud.com/uPic/IMG_6752.JPG",
            },
          ],
        },
      ],
      copyright: `<a href="https://beian.miit.gov.cn/" id="beian" target="_blank">晋ICP备19004813号-2</a>`,
    },
    zoom: {
      selector: ".markdown :not(em) > img",
      config: {
        // options you can specify via https://github.com/francoischalifour/medium-zoom#usage
        background: {
          light: "rgb(255, 255, 255)",
          dark: "rgb(50, 50, 50)",
        },
        margin: 80,
      },
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          // routeBasePath: '/',
          sidebarPath: require.resolve("./sidebars.js"),
          remarkPlugins: [remarkMath],
          rehypePlugins: [],
          // Please change this to your repo.
          // editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/',
          showLastUpdateTime: true,
        },
        blog: {
          blogSidebarTitle: "近期文章",
          blogSidebarCount: 10,
          showReadingTime: true,
          path: "./blog",
          routeBasePath: "/",
          feedOptions: {
            type: "all",
            copyright: `Copyright © ${new Date().getFullYear()} 超级码力`,
          },
          remarkPlugins: [remarkMath],
          rehypePlugins: [],
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans", "en"],
  },
  plugins: [
    require.resolve("docusaurus-plugin-image-zoom"),
    [
      require.resolve("./plugins/docusaurus-plugin-google-gtag-body"),
      {
        trackingID: 'G-7EFDJHTD4T',
        anonymizeIP: true,
      },
    ],
  ],
  clientModules: [require.resolve("./src/js/index.js")],
};

async function createConfig() {
  const rehypeKatex = (await import("rehype-katex")).default;
  // @ts-ignore
  config.presets[0][1].docs.rehypePlugins.push(rehypeKatex);
  // @ts-ignore
  config.presets[0][1].blog.rehypePlugins.push(rehypeKatex);

  return config;
}

module.exports = createConfig;
