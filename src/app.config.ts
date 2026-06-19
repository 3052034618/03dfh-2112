export default defineAppConfig({
  pages: [
    'pages/hall/index',
    'pages/create/index',
    'pages/mine/index',
    'pages/game-detail/index',
    'pages/comfort-zone/index',
    'pages/role-plaza/index',
    'pages/vote/index',
    'pages/role-result/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '剧本杀野车',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8f5ff'
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#7c3aed',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/hall/index',
        text: '大厅'
      },
      {
        pagePath: 'pages/create/index',
        text: '发车'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
