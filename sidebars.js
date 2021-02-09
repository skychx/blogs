/*
 * @Author: chenhao25
 * @Date: 2020-08-05 21:27:29
 * @LastEditors: chenhao25
 * @LastEditTime: 2021-02-09 09:11:53
 * @FilePath: /blogs/sidebars.js
 */
module.exports = {
  'react-native-upgrade': [
    'react-native-upgrade/index',
    'react-native-upgrade/preparatory-work',
    'react-native-upgrade/workflow',
    'react-native-upgrade/to-060',
    'react-native-upgrade/to-061',
    'react-native-upgrade/to-062',
  ],
  'cs-toys': [
    'toys/home',
    {
      type: 'category',
      collapsed: false,
      label: '十天自制软渲染器',
      items: [
        'toy-renderer/index',
        'toy-renderer/day1-env-setup',
        'toy-renderer/day2-draw-line',
        'toy-renderer/day3-draw-triangle',
        'toy-renderer/day4-Z-buffering',
      ],
    },
  ],
};
