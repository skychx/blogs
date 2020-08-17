module.exports = {
  title: '超级码力：微信公众号@卤蛋实验室',
  tagline: '微信公众号@卤蛋实验室',
  url: 'https://supercodepower.com',
  onBrokenLinks: 'log', // build 过程中遇到可能无法访问的网站时打印提示
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'skychx', // Usually your GitHub org/user name.
  projectName: '超级码力', // Usually your repo name.
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    // announcementBar: {
    //   id: 'supportus',
    //   content:
    //     '⭐️ If you like Docusaurus, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/facebook/docusaurus">GitHub</a>! ⭐️',
    // },
    prism: {
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/dracula'),
    },
    algolia: {
      apiKey: '84e7e5d1edaa85e79c4902b37f862a50',
      indexName: 'supercodepower',
      searchParameters: {},
    },
    navbar: {
      title: '超级码力',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        // {
        //   to: 'docs/',
        //   activeBasePath: 'docs',
        //   label: 'Docs',
        //   position: 'left',
        // },
        {
          href: 'https://www.cnblogs.com/web-scraper/',
          label: '零代码写爬虫',
          position: 'left',
        },
        {
          href: 'https://github.com/skychx',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '🧭 项目导航',
          items: [
            {
              label: '博客 tags',
              to: 'tags/',
            },
            {
              label: 'web scraper 零行代码写爬虫',
              to: 'https://www.cnblogs.com/web-scraper/',
            },
          ],
        },
        {
          title: '🌐 社交账号',
          items: [
            {
              label: '掘金',
              to: 'https://juejin.im/user/43636193770071',
            },
            {
              label: 'segmentfault',
              to: 'https://segmentfault.com/u/skychx',
            },
            {
              label: '知乎',
              to: 'https://www.zhihu.com/people/skychx',
            },
          ],
        },
        {
          title: '👨‍💻 交流',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/skychx',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 超级码力. 微信公众号@卤蛋实验室`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          homePageId: 'toc',
          // routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          path: './blog',
          routeBasePath: '/',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} 超级码力`,
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
