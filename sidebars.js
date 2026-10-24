/*
 * @Author: chenhao25
 * @Date: 2020-08-05 21:27:29
 * @LastEditors: chenhao25
 * @LastEditTime: 2021-02-09 09:11:53
 * @FilePath: /blogs/sidebars.js
 */
module.exports = {
  "react-native-upgrade": [
    {
      type: "category",
      collapsed: false,
      label: "React Native 升级指南",
      items: [
        "react-native-upgrade/index",
        "react-native-upgrade/preparatory-work",
        "react-native-upgrade/workflow",
        "react-native-upgrade/to-060",
        "react-native-upgrade/to-061",
        "react-native-upgrade/to-062",
      ],
    },
    {
      type: "category",
      collapsed: false,
      label: "React Native 性能优化",
      items: [
        {
          type: "link",
          label: "RN 初始化——Native 篇",
          href: "../../react-native-performance-native",
        },
        {
          type: "link",
          label: "RN 初始化——JS 篇",
          href: "../../react-native-performance-js",
        },
        {
          type: "link",
          label: "RN 运行时——Render 篇",
          href: "../../react_native_performance_optimization_guides",
        },
      ],
    },
  ],
  "cs-toys": [
    "toys/home",
    {
      type: "category",
      collapsed: false,
      label: "十天自制软渲染器",
      items: [
        "toy-renderer/index",
        "toy-renderer/day1-env-setup",
        "toy-renderer/day2-draw-line",
        "toy-renderer/day3-draw-triangle",
        "toy-renderer/day4-Z-buffering",
        "toy-renderer/day5-Perspective-projection",
        "toy-renderer/day6-Moving-the-camera",
        "toy-renderer/day7-Shaders",
        "toy-renderer/day8-Normal-mapping",
        "toy-renderer/day9-Shadow-mapping",
        "toy-renderer/day10-Ambient-occlusion",
        "toy-renderer/extra1-Perspective-correct-interpolation",
        "toy-renderer/extra2-Toon-shading",
        "toy-renderer/extra3-WebGL",
      ],
    },
    {
      type: "category",
      collapsed: false,
      label: "TypeScript 数据结构",
      items: [
        "toy-data-structures/index",
        "toy-data-structures/01-Array-and-LinkedList",
        "toy-data-structures/02-Stack-and-Queue",
        "toy-data-structures/03-BinarySearchTree",
        "toy-data-structures/04-Set-and-Map",
        "toy-data-structures/05-Heap-and-PriorityQueue",
        "toy-data-structures/06-SegmentTree",
        "toy-data-structures/07-Trie",
        "toy-data-structures/08-UnionFind",
        "toy-data-structures/09-AVLTree",
        "toy-data-structures/10-RedBlackTree",
        "toy-data-structures/11-HashTable",
      ],
    },
  ],
  learn: [
    "learn/home",
    {
      type: "category",
      collapsed: false,
      label: "技术课程",
      items: ["learn/course/graphics"],
    },
    {
      type: "category",
      collapsed: false,
      label: "技术书籍",
      items: ["learn/book/network", "learn/book/web-fe"],
    },
  ],
};
