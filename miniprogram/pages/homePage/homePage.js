

Page({
  data: {
    currentDate: '', // 当前日期
    currentTime: '', // 当前时间
    localWeather: '', // 当地天气
    showPopup: false // 控制弹窗的显示和隐藏
  },

  onLoad: function (options) {
    // 获取当前日期
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    this.setData({
      currentDate: `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`,
    });

    // 更新时间
    this.updateTime();
    // 每秒钟更新一次时间
    setInterval(() => {
      this.updateTime();
    }, 1000);

    // 模拟获取当地天气（示例）
    this.setData({
      localWeather: '晴', // 这里替换成真实的获取天气的方法
    });

    // 弹窗
    this.setData({
      showPopup: true
    });
  },

  // 弹窗
  closePopup: function () {
    // 关闭弹窗
    this.setData({
      showPopup: false
    });
  },

  // 点击按钮跳转到另一个页面
  getcard: function() {
    wx.requestSubscribeMessage({
      tmplIds: ['MotvKt8ltyHoe2G9eGpIPUsYwnay7QrZFcmp6uTfqTM', 'jplzlAN43zmS1kwmBp09CuKMo76Mf295WQ80UP54_-M'], // 消息模板id1和消息模板id2
      success(res) {
          console.log(res, "订阅成功");
          // 判断用户是否同意授权
          if (res['MotvKt8ltyHoe2G9eGpIPUsYwnay7QrZFcmp6uTfqTM'] === 'accept' && res['jplzlAN43zmS1kwmBp09CuKMo76Mf295WQ80UP54_-M'] === 'accept') {
              console.log('用户已授权');
              wx.navigateTo({
                url: "/pages/goods/goods", // 页面路径，注意路径的写法
              })
          } else {
              console.log('用户未授权');
              // 如果用户未授权，可以给出提示或者其他处理
          }
      },
      fail(res) {
          console.log('授权失败', res);
      }
  });
  },

  // 更新时间
  updateTime: function () {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const currentTime = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    this.setData({
      currentTime: currentTime
    });
  }
});
