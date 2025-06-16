// app.js
App({
	onLaunch: function () {
		if (!wx.cloud) {
			console.error('请使用 2.2.3 或以上的基础库以使用云能力');
		} else {
			wx.cloud.init({
				// env 参数说明：
				//   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
				//   此处请填入环境 ID, 环境 ID 可打开云控制台查看
				//   如不填则使用默认环境（第一个创建的环境）
				env: 'keshe-1gfstedfa4d972e5',
				traceUser: true,
			});
		}

		this.globalData = {};

		// 展示本地存储能力
		const logs = wx.getStorageSync('logs') || []
		logs.unshift(Date.now())
		wx.setStorageSync('logs', logs)

		// 登录
		wx.login({
			success: res => {
				// 发送 res.code 到后台换取 openId, sessionKey, unionId
			}
		})

		// 在小程序初始化时检查用户登录状态
		//  const isLoggedIn = wx.getStorageSync('isLoggedIn');
		//  if (!isLoggedIn) {
		//    // 如果用户未登录，则跳转至登录页面
		//    wx.navigateTo({
		//     url: '/pages/index/index?redirectTo=' + encodeURIComponent('/pages/personalCenter/personalCenter'),
		//   });
		//  }
	}
});

/**
 * 全局分享配置，页面无需开启分享
 * 如页面开启分享开关，则走页面分享配置（即使未配置内容）
 */
! function() {
  //获取页面配置并进行页面分享配置
  var PageTmp = Page
  Page = function(pageConfig) {
    let view = Page
    //全局开启分享
    pageConfig = Object.assign({
      onShareAppMessage: function() {

      }
    }, pageConfig);
    //3. 配置页面模板
		PageTmp(pageConfig);
		pageConfig = Object.assign({
      onShareAppMessage: function () {
        return {
          title:"Time时间市场",
          imageUrl: wx.getStorageSync("/miniprogram/images/logo.png")
        }
      }
    }, pageConfig);
  }
}();