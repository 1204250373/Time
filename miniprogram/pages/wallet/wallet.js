const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    balance: 0.00, // 默认用户余额为0
    _openid: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时获取用户余额
    this.getBalance();
  },

  // 获取用户余额
  getBalance() {
    let that = this;

    wx.showLoading({
      title: '获取余额中',
    });

    // 获取当前用户的 openid
    const _openid = wx.getStorageSync('openid');

    //查询 balanceOrders 表中 openid 是当前用户的记录，并将它们中的 price 相加
    db.collection('balanceOrders').where({
      _openid: _openid._openid
    }).get().then(res => {
      let totalPrice = 0;
      res.data.forEach(item => {
        totalPrice += parseFloat(item.price); // 假设 price 字段为 price
      });
      // 更新成功后，更新页面数据
      that.setData({
        balance: totalPrice
      });
      wx.hideLoading(); // 隐藏加载提示
    }).catch(err => {
      console.error('查询用户订单记录失败', err);
      wx.hideLoading(); // 隐藏加载提示
      wx.showToast({
        title: '查询用户订单记录失败',
        icon: 'none'
      });
    });
  },

  //提现
  withdraw() {
    let that = this;
    const _openid = wx.getStorageSync('openid');
    if (that.data.balance == 0) {
      wx.showToast({
        title: '您当前没有余额',
        duration: 2000,
        icon: "error",
        mask: true,

      })
    } else {
      wx.showModal({
        title: '提示',
        content: '您确定要全部提现吗',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            db.collection("wallet").add({
              data: {
                balance: that.data.balance
              }
            }).then(res => {
              that.choose();
              // 查询并更新满足条件的 product 记录
              db.collection("product").where({
                _openid: _openid.openid,
                type: "已售出的",
                status: "未提现的"
              }).update({
                data: {
                  status: "已提现的"
                }
              }).then(result => {
                console.log('成功更新 product 表中记录为已提现', result);

                // 删除满足条件的 balanceOrders 记录
                db.collection("balanceOrders").where({
                  _openid: _openid.openid // 确保查询条件不为空
                }).remove().then(res => {
                  console.log('成功删除 balanceOrders 表中记录', res);
                  wx.reLaunch({
                    url: '../../pages/wallet/wallet',
                  })
                }).catch(err => {
                  console.error('删除 balanceOrders 表中记录失败', err);
                });
              }).catch(err => {
                console.error('更新 product 表中记录为已提现失败', err);
              });
            })


          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })

    }

  },

  //选择图片
  choose: function () {
    let that = this;
    wx.chooseMedia({
      count: 1,
      // mediaType: ['image','video'],//指定格式
      // sourceType: ['album', 'camera'],//指定图片源
      mediaType: ['image'], //指定格式
      sourceType: ['album'], //指定图片源
      // maxDuration: 30, //视频长度
      // camera: 'back', //指定后置
      success(res) {
        console.log(res.tempFiles[0].tempFilePath)
        console.log(res.tempFiles[0].size)
        // 调用上传图片函数
        that.uploadImage(res.tempFiles[0].tempFilePath);
      },
      fail: err => {
        console.error('选择图片失败：', err.errMsg);
      }
    })

  },

  // 上传图片至云存储
  uploadImage: function (tempFilePath) {
    let that = this;
    // 调用云开发的文件上传函数
    wx.cloud.uploadFile({
      cloudPath: 'images/' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000), // 云存储路径，这里使用时间戳和随机数作为文件名
      filePath: tempFilePath, // 要上传的文件临时路径
      success: res => {
        console.log('上传图片成功：', res.fileID);
        // 可以在这里处理上传成功后的逻辑，比如将 fileID 存储到数据库中
        const db = wx.cloud.database();
        const walletCollection = db.collection('wallet');

        // 假设您要将 fileID 存储到名为 imageFileID 的字段中
        walletCollection.where({
          _openid: that.data._openid // 确保使用正确的openid
        }).update({
          data: {
            imageFileID: res.fileID
          },
          success: function (result) {
            console.log('文件ID更新成功：', result);
          },
          fail: function (error) {
            console.error('文件ID更新失败：', error);
          }
        });
      },
      fail: err => {
        console.error('上传图片失败：', err.errMsg);
      }
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
    }
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