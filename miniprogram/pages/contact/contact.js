const db = wx.cloud.database();
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    other_messages: [], // 自己的消息
    my_messages: [], // 对方的消息
    // messages:[],
    combinedMessages: [], // 新的数组，用于存储合并后的消息列表
    inputValue: '', // 输入框的值
    orderNumber: '',
    _openid: '',
    otherid: '',
    imageUrls:[],
  },

  // 输入框输入事件处理方法
  inputMessage: function (event) {
    this.setData({
      inputValue: event.detail.value // 更新输入框的值
    });
  },

  // 发送消息
  sendMessage: function () {
    // 获取用户输入的消息内容
    var content = this.data.inputValue;
    const otherid = this.data.otherid;
    console.log("发送给", otherid);
    let that = this;
    // 如果用户没有输入内容，则不执行发送操作
    if (!content) {
      return;
    }
    // 获取订单号
    var orderNumber = this.data.orderNumber;
    var _openid = this.data._openid;
    // 在云函数中查询消息表
    wx.cloud.callFunction({
      name: 'queryMessage',
      data: {
        orderNumber: orderNumber
      },
      success: res => {
        // 获取查询结果
        var messages = res.result.data;

        // 遍历查询结果，查找自己的消息记录
        var myMessage = messages.find(message => {
          return message._openid === _openid; // 假设使用openid作为用户唯一标识
        });

        // 如果找到自己的消息记录，则插入新消息
        if (myMessage) {
          // 构造新消息对象
          var newMessage = {
            type: 'text',
            content: content,
            createTime: new Date(), // 使用当前时间作为创建时间
            sender: _openid // 假设当前用户为发送者
          };

          // 更新数据库中的消息记录，将新消息插入到消息数组中
          wx.cloud.callFunction({
            name: 'updateMessage',
            data: {
              messageId: myMessage._id, // 要更新的消息记录的_id
              newMessage: newMessage
            },
            success: res => {
              // 发送成功，清空输入框
              this.setData({
                inputValue: ''
              });
              wx.showToast({
                title: '发送成功',
                icon: 'success',
                duration: 800
              });
              // 刷新页面显示最新消息列表
              this.refreshMessageList();
              that.sendone(otherid, orderNumber, content); // 调用sendone方法并传递openid作为参数
            },
            fail: err => {
              console.error('更新消息失败：', err);
            }
          });
        } else {
          console.error('未找到与当前用户相关的消息记录');
        }
      },
      fail: err => {
        console.error('查询消息失败：', err);
      }
    });
  },

  //选择图片
  choose: function () {
    let that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'], //指定格式
      sourceType: ['album', 'camera'], //指定图片源
      mediaType: ['image'], //指定格式
      // maxDuration: 30, //视频长度
      camera: 'back', //指定后置
      success(res) {
        console.log('1', res.tempFiles[0].tempFilePath)
        console.log('2', res.tempFiles[0].size)
        // 调用上传图片函数
        that.uploadImage(res.tempFiles[0].tempFilePath);
      },
      fail: err => {
        console.error('选择图片失败：', err.errMsg);
      }
    })

  },

  // 上传图片
  uploadImage: function (filePath) {
    let that = this;
    const otherid = this.data.otherid;
    wx.cloud.uploadFile({
      cloudPath: 'chat_images/' + new Date().getTime() + '.png', // 上传至云端的路径
      filePath: filePath, // 小程序临时文件路径
      success: res => {
        // 返回文件 ID
        console.log('3', res.fileID);
        const fileID = res.fileID;
        var content = res.fileID;
        // 获取订单号
        var orderNumber = this.data.orderNumber;
        var _openid = this.data._openid;
        // 在云函数中查询消息表
        wx.cloud.callFunction({
          name: 'queryMessage',
          data: {
            orderNumber: orderNumber
          },
          success: res => {
            // 获取查询结果
            var messages = res.result.data;

            // 遍历查询结果，查找自己的消息记录
            var myMessage = messages.find(message => {
              return message._openid === _openid; // 假设使用openid作为用户唯一标识
            });

            // 如果找到自己的消息记录，则插入新消息
            if (myMessage) {
              // 构造新消息对象
              var newMessage = {
                type: 'image',
                content: content,
                createTime: new Date(), // 使用当前时间作为创建时间
                sender: that.data._openid // 假设当前用户为发送者
              };

              // 更新数据库中的消息记录，将新消息插入到消息数组中
              wx.cloud.callFunction({
                name: 'updateMessage',
                data: {
                  messageId: myMessage._id, // 要更新的消息记录的_id
                  newMessage: newMessage
                },
                success: res => {
                  wx.showToast({
                    title: '发送成功',
                    icon: 'success',
                    duration: 800
                  });
                  // 刷新页面显示最新消息列表
                  this.refreshMessageList();
                  that.sendone(otherid, orderNumber, content); // 调用sendone方法并传递openid作为参数
                },
                fail: err => {
                  console.error('更新消息失败：', err);
                }
              });
            } else {
              console.error('未找到与当前用户相关的消息记录');
            }
          },
          fail: err => {
            console.error('查询消息失败：', err);
          }
        });
      },
      fail: err => {
        // handle error
      }
    });
  },


  // 接收消息
  receiveMessage: function (message) {
    // 将接收到的消息添加到 combinedMessages 数组中
    this.data.combinedMessages.push(message);

    // 更新页面
    this.setData({
      combinedMessages: this.data.combinedMessages
    });
    // console.log('获取临时链接：', combinedMessages)
  },
  
  //刷新
  refreshMessageList: function () {
    var orderNumber = this.data.orderNumber;
    var _openid = this.data._openid;

    wx.cloud.database().collection('message').where({
      orderNumber: orderNumber
    }).get({
      success: res => {
        var messages = res.data;

        // 合并所有消息的 messages 属性到一个数组
        var combinedMessages = messages.flatMap(msg => msg.messages);

        // 排序消息
        combinedMessages.sort((a, b) => {
          return new Date(a.createTime) - new Date(b.createTime);
        });

        // 更新页面数据
        this.setData({
          combinedMessages: combinedMessages,
        });

        console.log("我的消息:", myMessages);
        console.log("其他人的消息:", otherMessages);
        console.log("合并后的消息列表:", combinedMessages);
      },
      fail: err => {
        console.error('获取消息列表失败', err);
      }
    });
  },
  
  // 数据库的监听器
  dbWatcher: function () {
    let that = this;
    db.collection('message')
      .where({

        orderNumber: this.data.orderNumber
      })
      .watch({
        onChange: function (res) {
          // 监控数据发生变化时触发
          if (res.docChanges != null) {
            res.docChanges.forEach(change => {
              if (change.dataType == "update") { // 数据库监听到的内容
                // 假设 messages 是一个数组，我们取最后一个元素
                let length = change.doc.messages.length;
                let value = change.doc.messages[length - 1]; // 要增添的内容
                that.receiveMessage(value); // 使用receiveMessage方法处理新消息
              }
            });
          }
        },
        onError: (err) => {
          console.error(err)
        }
      })
  },

  //发送订阅消息
  sendone(otherid, orderNumber, content) {
    let that = this;
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    // 将月、日、时、分、秒转换为两位数格式
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    let time = `${year}-${month}-${day} ${hours}:${minutes}`;

    wx.cloud.callFunction({
        name: "send_messages",
        data: {
          openid: otherid,
          time: time,
          orderNumber: orderNumber,
          content: content,
        },
      })
      .then(res => {
        console.log("发送单条成功", res);
      })
      .catch(err => {
        console.log("发送单条失败", err);
      });
  },

  onLoad: function (options) {
    // 从页面参数中获取订单号
    var id = options.Id;
    var otherid = options.otherid;
    var _openid = wx.getStorageSync('openid');
    // 将订单号和 openid 存储到页面的 data 中
    this.setData({
      // orderNumber: orderNumber,
      orderNumber: id,
      _openid: _openid.openid,
      otherid: otherid,
    });
    console.log('fSghoiahgikahgagaga:', otherid);
    // 打印获取到的 openid 和订单号
    console.log('从本地缓存中获取到的 openid:', _openid);
    console.log("页面的Number:", this.data.orderNumber);
    // 查询消息列表
    this.refreshMessageList();
    // 启动数据库监听器
    this.dbWatcher();
  },

  // 页面渲染函数
  onReady: function () {

  },

  onShow() {

  },

  onHide() {

  },

  onUnload() {

  },

  onPullDownRefresh() {

  },

  onReachBottom() {

  },

  onShareAppMessage() {

  }
})