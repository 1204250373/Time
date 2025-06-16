// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    // motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },

    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },

  saveUserInfo() {
    // 如果用户信息不完整，给出提示并返回
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先选择头像和输入昵称',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    // 如果用户信息完整，则保存用户信息并跳转到首页
    wx.setStorageSync('userInfo', this.data.userInfo); // 保存用户信息到本地缓存
    // 在登录成功后调用此方法，将登录状态存储到本地缓存
    wx.setStorageSync('isLoggedIn', true);

    // 在保存用户信息后调用获取 OpenID 的函数
    this.getOpenid();
    wx.reLaunch({
      url: '/pages/personalCenter/personalCenter',
    })
    // wx.switchTab({
    //   url: '/pages/personalCenter/personalCenter' // 跳转到首页
    // });

  },
  // 调用云函数获取 OpenID
  getOpenid() {
    wx.cloud.callFunction({
      name: 'helloCloud',
      success: res => {
        const openid = res.result
        // 将 OpenID 缓存到本地
        wx.setStorageSync('openid', openid)
        console.log('成功获取到用户的 OpenID：', openid)
      },
      fail: err => {
        console.error('获取 OpenID 失败：', err)
      }
    })
  },
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail
    const {
      nickName
    } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  onInputChange(e) {
    const nickName = e.detail.value
    const {
      avatarUrl
    } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })


      }
    })
  },
})