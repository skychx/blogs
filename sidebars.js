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
      ],
    },
  ],
};
