// wx.cloud.init({
// 	env: 'subway-3g5yromife3ef1b1'
// })

// import qqmapwx from '../../utils/qqmap-wx-jssdk.min.js';
const key = 'BRMBZ-DLDEL-NZGPA-M7Q5G-EYHFJ-UYFXD'; //使用在腾讯位置服务申请的key
const referer = '腾讯位置服务地图选点'; //调用插件的app的名称
const location = JSON.stringify({
  latitude: 39.89631551,
  longitude: 116.323459711
});
const category = '生活服务,娱乐休闲';

const db = wx.cloud.database();
const chooseLocation = requirePlugin('chooseLocation');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // _openid: '',
    // name:'',
    nickName:'',
    handleContact(e) {
      console.log(e.detail)
    },
    addressInfo: {},
    selectedLocation: null, // 用于存储选中的位置信息
  },




  bindStartTimeChange: function (e) {
    // console.log('开始时间：', e.detail.value)
    this.setData({
      startTime: e.detail.value
    })
  },
  bindStartDateChange: function (e) {
    // console.log('开始日期：', e.detail.value)
    this.setData({
      startDate: e.detail.value
    })
  },
  bindEndDateChange: function (e) {
    // console.log('结束日期：', e.detail.value)
    this.setData({
      endDate: e.detail.value
    })
  },
  bindEndTimeChange: function (e) {
    // console.log('结束时间：', e.detail.value)
    this.setData({
      endTime: e.detail.value
    })
  },

  ddxd() {
    let that = this;
    wx.navigateTo({
      url: 'plugin://chooseLocation/index?key=' + key + '&referer=' + referer + '&location=' + location + '&category=' + category,
      success(res) {
        res.eventChannel.on('acceptDataFromOpenerPage', function(data) {
          that.setData({
            selectedLocation: data
          });
        });
      }
    });
  },
  

  //发布and授权
  submit(e) {
    const formData = e.detail.value;
    if (
      formData.startDate !== null && formData.startDate !== "" &&
      formData.startTime !== "" &&
      formData.endDate !== null && formData.endDate !== "" &&
      formData.endTime !== "" &&
      formData.price !== "" &&
      formData.remark !== ""
    ) {
      const that = this;
      wx.requestSubscribeMessage({
        tmplIds: ['MotvKt8ltyHoe2G9eGpIPUsYwnay7QrZFcmp6uTfqTM', 'jplzlAN43zmS1kwmBp09CuKMo76Mf295WQ80UP54_-M'], // 消息模板id1和消息模板id2
        success(res) {
            console.log(res, "订阅成功");
            // 判断用户是否同意授权
            if (res['MotvKt8ltyHoe2G9eGpIPUsYwnay7QrZFcmp6uTfqTM'] === 'accept' && res['jplzlAN43zmS1kwmBp09CuKMo76Mf295WQ80UP54_-M'] === 'accept') {
                console.log('用户已授权');
                // 执行提交操作
                that.doSubmit(e);
            } else {
                console.log('用户未授权');
                // 如果用户未授权，可以给出提示或者其他处理
            }
        },
        fail(res) {
            console.log('授权失败', res);
        }
    });

    } else {
      wx.showToast({
        title: '请完整填写信息',
        icon: 'error'
      })
    }
  },
  //重置
  reset() {
    this.setData({
      startDate: "",
      startTime: "", // 修正为 startTime
      endDate: "",
      endTime: "", // 添加这一行以确保重置结束时间
      price: "", // 重置价格输入框
      remark: "" ,// 重置备注输入框
      selectedLocation: null
    })
  },
  //提交
  doSubmit(e) {
    // 提交操作的逻辑代码
    // 从 event.detail.value 中获取表单数据
    const formData = e.detail.value;
    console.log('提交表单', formData);
    // 保存正确的上下文
    const that = this;
    // 生成一个6位随机数
    function generateRandomNumber() {
      return Math.floor(Math.random() * 900000 + 100000);
    }
    // 调用函数生成随机数
    var randomNumber = generateRandomNumber();
    var randomNumberString = randomNumber.toString();
    //生成时间戳
    const timestamp = Date.now();
    var timestampString = timestamp.toString();
    //订单号 = 时间戳 + 6位随机数
    const orderNumber = timestampString + randomNumberString;
    // 将服务器时间与产品信息一起添加到数据库中
    db.collection('product').add({
      data: {
        orderNumber: orderNumber,
        start_date: e.detail.value.startDate,
        start_time: e.detail.value.startTime,
        end_date: e.detail.value.endDate,
        end_time: e.detail.value.endTime,
        price: e.detail.value.price,
        remark: e.detail.value.remark,
        type: "我发布的",
        status: "未提现的",
        outTradeNo: '',
        nickName:this.data.nickName,
        location:this.data.selectedLocation,
        time: db.serverDate()
      },
      success: function (res) {
        console.log('添加产品信息成功', res);
        console.log(orderNumber);
        // 清空表单数据
        that.reset(); // 使用正确的上下文调用 reset 函数
        wx.showToast({
          title: '成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function (err) {
        console.error('添加产品信息失败', err);
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this;
    const userInfo = wx.getStorageSync('userInfo');
    const nickName = userInfo.nickName;
    console.log('本地缓存中的用户信息:', nickName);
    that.setData({
      nickName:nickName,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    var isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (!isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      // 禁用按钮
      this.setData({
        disableSubmitBtn: true // 设置一个数据字段表示按钮是否禁用
      });
    } else {
      // 如果已登录，则允许用户进行操作
      // 可以执行其他操作的逻辑
    };
    let that = this;
    const location = chooseLocation.getLocation(); // 如果点击确认选点按钮，则返回选点结果对象，否则返回null
    console.log(location);
    that.setData({
      selectedLocation: location, // 将 _openid 设置到页面数据中
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
     // 页面卸载时设置插件选点数据为null，防止再次进入页面，geLocation返回的是上次选点结果
     chooseLocation.setLocation(null);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})