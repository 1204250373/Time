const db = wx.cloud.database();
const time = require('../../utils/time.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    titleList: ["我发布的", "已购买的", "已售出的", "全部订单", "退款/售后"], // 修改这里，添加 "全部订单" 选项
    title: "全部订单", // 修改这里，设置默认的类型为 "全部订单"
    order: [],
    // emptyText: "暂无订单数据", // 当数据为空时显示的文本提示
    _openid: '',
		isLoggedIn: false, // 添加一个标识用户是否已登录的变量
  },

  // 转换时间
  change_time(li) {
    if (li.length == 0) {
      return li
    } else {
      for (let i = 0; i < li.length; i++) {
        li[i].time = time.formatTime(new Date(li[i].time))
        if (i + 1 == li.length) {
          return li
        }
      }
    }
  },

  // 选择订单类型
  select_title(e) {
    let that = this
    let name = e.currentTarget.dataset.name
    this.setData({
      title: name
    });
    if (name === "全部订单") {
      that.get_all_orders(); // 如果选择的是 "全部订单"，则获取所有订单数据
    } else {
      that.get_order(name); // 否则，按照选择的类型获取订单数据
    }
  },

  // 获取订单
  get_order(type) {
    let that = this;
    let _openid = that.data._openid;
    if (!_openid) {
      wx.showToast({
        title: '无效的用户身份，请重新登录',
        icon: 'none'
      });
      return;
    }
    wx.showLoading({
      title: '获取订单中',
    });
    //合并 "我发布的" 和 "售出中"，以及 "已购买的" 和 "购买中"
    if (type === "我发布的" || type === "售出中") {
      db.collection('product').where({
        type: {
          $in: ["我发布的", "售出中"]
        }, // 查询我发布的和售出中的订单
        _openid: _openid
      }).orderBy('time', 'desc').get().then(res => {
        wx.hideLoading();
        that.setData({
          order: that.change_time(res.data)
        });
        console.log('获取我发布的和售出中的订单成功', res.data);
      }).catch(err => {
        wx.hideLoading();
        console.log('获取我发布的和售出中的订单失败', err);
      });
    } else if (type === "已购买的" || type === "购买中") {
      db.collection('product').where({
        type: {
          $in: ["已购买的", "购买中"]
        }, // 查询已购买的和购买中的订单
        _openid: _openid
      }).orderBy('time', 'desc').get().then(res => {
        wx.hideLoading();
        that.setData({
          order: that.change_time(res.data)
        });
        console.log('获取已购买的和购买中的订单成功', res.data);
      }).catch(err => {
        wx.hideLoading();
        console.log('获取已购买的和购买中的订单失败', err);
      });
    } else if (type === "退款/售后" ||type === "退款中" || type === "待确认退款" || type === "退款完成") {
      db.collection('product').where({
        type: {
          $in: ["退款中", "待确认退款", "退款完成"]
        }, // 查询已购买的和购买中的订单
        _openid: _openid
      }).orderBy('time', 'desc').get().then(res => {
        wx.hideLoading();
        that.setData({
          order: that.change_time(res.data)
        });
        console.log('获取退款中的和待确认退款和退款完成的订单成功', res.data);
      }).catch(err => {
        wx.hideLoading();
        console.log('获取退款中的和待确认退款和退款完成的订单失败', err);
      });
    }else {
      db.collection('product').where({
        type: type, // 查询我发布的和售出中的订单
        _openid: _openid
      }).orderBy('time', 'desc').get().then(res => {
        wx.hideLoading();
        that.setData({
          order: that.change_time(res.data)
        });
        console.log('获取我售出的订单成功', res.data);
      }).catch(err => {
        wx.hideLoading();
        console.log('获取我售出的订单失败', err);
      });
    }
  },

  // 获取所有订单
  get_all_orders() {
    let that = this;
    let _openid = that.data._openid;
    if (!_openid) {
      wx.showToast({
        title: '无效的用户身份，请重新登录',
        icon: 'none'
      });
      return;
    }
    wx.showLoading({
      title: '获取订单中',
    });
    db.collection('product').where({
      _openid: _openid
    }).orderBy('time', 'desc').get().then(res => {
      wx.hideLoading();
      that.setData({
        order: that.change_time(res.data)
      });
      console.log('获取所有订单成功', res.data);
    }).catch(err => {
      wx.hideLoading();
      console.log('获取所有订单失败', err);
    });
  },

  //确认收货
  qrsh(e) {
    let that = this;
    let currentOpenid = that.data._openid;
    // 获取当前点击商品的索引
    const index = e.currentTarget.dataset.index;
    const item = this.data.order[index];
    wx.showModal({
      title: '确认收货',
      content: '确定要确认收货吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '确认收货中',
          });
          // 查询订单
          // 根据订单号筛选订单并更新状态
          db.collection('product').where({
            orderNumber: item.orderNumber
          }).get({
            success: function (res) {
              const orders = res.data; // 获取到所有符合条件的订单
              let updateCount = 0; // 用于记录已更新的订单数量

              // 遍历所有订单，同时更新状态为已售出的
              orders.forEach(order => {
                db.collection('product').doc(order._id).update({
                  data: {
                    type: '已售出的'
                  },
                  success: function (res) {
                    updateCount++; // 每次更新成功，更新计数加1
                    // 当所有订单都更新完成时
                    if (updateCount === orders.length) {
                      console.log('所有订单状态已更新为已售出');
                      // 判断是否有订单属于当前用户，若有，则再次更新为已购买的
                      orders.forEach(order => {
                        if (order._openid === currentOpenid) {
                          db.collection('product').doc(order._id).update({
                            data: {
                              type: '已购买的'
                            },
                            success: function (res) {
                              console.log('订单状态已更新为已购买的');
                              wx.reLaunch({
                                url: '../../pages/orders/orders'
                              });
                            },
                            fail: function (err) {
                              console.error('更新订单状态为已购买时出错：', err);
                              wx.showToast({
                                title: '更新订单状态失败，请重试',
                                icon: 'none'
                              });
                            }
                          });
                        }
                      });
                    }
                  },
                  fail: function (err) {
                    console.error('更新订单状态为已售出时出错：', err);
                    wx.showToast({
                      title: '更新订单状态失败，请重试',
                      icon: 'none'
                    });
                  }
                });
              });
            },
            fail: function (err) {
              console.error('查询订单失败：', err);
              wx.showToast({
                title: '查询订单失败，请重试',
                icon: 'none'
              });
            }
          });

        } else if (res.cancel) {
          console.log('用户取消了确认收货操作');
        }
      }
    });
  },
  //下架商品
  xj(e) {
    let that = this;
    // 获取当前点击商品的索引
    const index = e.currentTarget.dataset.index;
    const item = this.data.order[index];
    wx.showModal({
      title: '确认下架',
      content: '确定要下架这个商品吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '下架中',
          });
          // 删除商品数据
          db.collection('product').where({
            orderNumber: item.orderNumber
          }).remove({
            success: function (res) {
              console.log('商品下架成功');
              wx.showToast({
                title: '商品下架成功',
                icon: 'success'
              });
              //此处刷新页面，未完成
              wx.reLaunch({
                url: '../../pages/orders/orders'
              });
            },
            fail: function (err) {
              console.error('商品下架失败：', err);
              wx.showToast({
                title: '商品下架失败，请重试',
                icon: 'none'
              });
            }
          });
        } else if (res.cancel) {
          console.log('用户取消了下架操作');
        }
      }
    });
  },
  //取消订单
  qxdd_1(e) {
    let that = this;
    // 获取当前点击商品的索引
    const index = e.currentTarget.dataset.index;
    const item = this.data.order[index];
    wx.showModal({
      title: '取消订单',
      content: '确定要取消订单吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '取消中',
          });
          // 删除商品数据
          db.collection('product').where({
            orderNumber: item.orderNumber
          }).remove({
            success: function (res) {
              console.log('订单取消成功');
              wx.showToast({
                title: '订单取消成功',
                icon: 'success'
              });
              //此处刷新页面，未完成
              wx.reLaunch({
                url: '../../pages/orders/orders'
              });
            },
            fail: function (err) {
              console.error('订单取消失败：', err);
              wx.showToast({
                title: '订单取消失败，请重试',
                icon: 'none'
              });
            }
          });
        } else if (res.cancel) {
          console.log('用户取消了取消订单操作');
        }
      }
    });
  },

  qxdd_2(e) {
    let that = this;
    // 获取当前点击商品的索引
    const index = e.currentTarget.dataset.index;
    const item = this.data.order[index];
    wx.showModal({
      title: '取消订单',
      content: '确定要取消订单吗？',
      async success(res) { // 使用 async 关键字声明异步函数
        if (res.confirm) {
          wx.showLoading({
            title: '取消中',
          });

          try {
            // 更新 type=购买中 的订单为退款中
            await db.collection('product').where({
              orderNumber: item.orderNumber,
              type: '购买中'
            }).update({
              data: {
                type: '退款中'
              }
            });

            // 更新 type=售出中 的订单为待确认退款
            await db.collection('product').where({
              orderNumber: item.orderNumber,
              type: '售出中'
            }).update({
              data: {
                type: '待确认退款'
              }
            });

            console.log('更新成功');
          } catch (err) {
            console.error('更新失败：', err);
          }

          wx.hideLoading(); // 更新完成后隐藏 loading 提示框
          wx.reLaunch({
            url: '../../pages/orders/orders'
          });
        } else if (res.cancel) {
          console.log('用户取消了取消订单操作');
        }
      }
    });
  },


  //联系卖家/买家
  //contact_1写在了goods.js，暂不删除
  contact_1: function (e) {
    let index = e.currentTarget.dataset.index; // 获取当前点击商品的索引
    let item = this.data.order[index]; // 获取当前点击的商品信息
    let currentOpenid = this.data._openid; // 获取当前用户的 openid
    let Id = e.currentTarget.id;
    // 查询数据库，找出商品中不等于当前用户缓存的 openid 的记录
    db.collection('product').where({
      _openid: db.command.neq(currentOpenid),
      orderNumber: item.orderNumber,
    }).get().then(res => {
      console.log("res", res.data);
      // 将满足条件的记录添加到消息表格
      if (res.data.length > 0) {
        let record = res.data[0]; // 假设只有一条记录满足条件
        // 在添加消息之前，先检查消息表中是否已存在相同的记录
        db.collection('message').where({
          _openid: currentOpenid,
          buyerId: currentOpenid,
          sellerId: record._openid,
          orderNumber: item.orderNumber
        }).get().then(result => {
          console.log("ahahahashashahaha", record._openid);
          if (result.data.length === 0) {
            // 如果消息表中不存在相同的消息记录，则添加消息
            db.collection('message').add({
              data: {
                buyerId: currentOpenid,
                sellerId: record._openid,
                orderNumber: item.orderNumber
              }
            }).then(() => {
              console.log('Message added successfully.');
              wx.navigateTo({
                // url: '../../pages/contact/contact',
               url: '../../pages/contact/contact?Id=' + Id + '&otherid=' + record._openid,
                success: (res) => {
                  console.log('Navigated to chat page successfully.');
                },
                fail: (err) => {
                  console.error('Failed to navigate to chat page:', err);
                }
              });
            }).catch(err => {
              console.error('Failed to add message:', err);
            });
          } else {
            console.log('Message already exists.');
            wx.navigateTo({
              // url: '../../pages/contact/contact',
             url: '../../pages/contact/contact?Id=' + Id + '&otherid=' + record._openid,
              success: (res) => {
                console.log('Navigated to chat page successfully.');
              },
              fail: (err) => {
                console.error('Failed to navigate to chat page:', err);
              }
            });
          }
        }).catch(err => {
          console.error('Failed to query message:', err);
        });
      } else {
        console.log('No matching records found.');
      }
    }).catch(err => {
      console.error('Failed to query product:', err);
    });
  },

  contact_2: function (e) {
    console.log(e.currentTarget.id)
    let Id = e.currentTarget.id;
    let index = e.currentTarget.dataset.index; // 获取当前点击商品的索引
    let item = this.data.order[index]; // 获取当前点击的商品信息
    let currentOpenid = this.data._openid; // 获取当前用户的 openid
    // wx.setStorageSync('orderNumber', item.orderNumber);
    // 查询数据库，找出商品中不等于当前用户缓存的 openid 的记录
    db.collection('product').where({
      _openid: db.command.neq(currentOpenid),
      orderNumber: item.orderNumber,
    }).get().then(res => {
      console.log("res", res.data);
      // console.log("获取到的orderNumber:", item.orderNumber); 
      // 将满足条件的记录添加到消息表格
      if (res.data.length > 0) {
        let record = res.data[0]; // 假设只有一条记录满足条件
        // 在添加消息之前，先检查消息表中是否已存在相同的记录
        db.collection('message').where({
          _openid: currentOpenid,
          sellerId: currentOpenid,
          buyerId: record._openid,
          orderNumber: item.orderNumber
        }).get().then(result => {
          if (result.data.length === 0) {
            // 如果消息表中不存在相同的消息记录，则添加消息
            db.collection('message').add({
              data: {
                buyerId: record._openid,
                sellerId: currentOpenid,
                orderNumber: item.orderNumber
              }
            }).then(() => {
              console.log('Message added successfully.');
              // getApp().globalData.orderNumber = Id;
              wx.navigateTo({
               url: '../../pages/contact/contact?Id=' + Id + '&otherid=' + record._openid,
                // url: '../../pages/contact/contact',
                success: (res) => {
                  console.log('Navigated to chat page successfully.');
                  console.log("传过去的orderNumber:", Id);
                },
                fail: (err) => {
                  console.error('Failed to navigate to chat page:', err);
                }
              });

            }).catch(err => {
              console.error('Failed to add message:', err);
            });
          } else {
            console.log('Message already exists.');
            wx.navigateTo({
             url: '../../pages/contact/contact?Id=' + Id + '&otherid=' + record._openid,
              // url: '../../pages/contact/contact',
              // url: '../../pages/contact/contact?orderNumber=' + item.orderNumber,
              success: (res) => {
                console.log('Navigated to chat page successfully.');
              },
              fail: (err) => {
                console.error('Failed to navigate to chat page:', err);
              }
            });
          }
        }).catch(err => {
          console.error('Failed to query message:', err);
        });
      } else {
        console.log('No matching records found.');
      }
    }).catch(err => {
      console.error('Failed to query product:', err);
    });
  },

  //确认退款
  qrtk(e) {
    // 获取当前点击商品的索引
    const index = e.currentTarget.dataset.index;
    const item = this.data.order[index];
    const ordernumber = item.orderNumber;
    const outTradeNo = item.outTradeNo;
    const timestamp = new Date().getTime(); // 获取当前时间戳
    // 将orderNumber和时间戳结合生成outTradeNo
    const Number = `${ordernumber}${timestamp}`;
    const price = item.price;
		wx.showModal({
			title: '是否确认退款',
			content: '您确定要退款吗',
			async success(res) { // 使用 async 关键字声明异步函数
        if (res.confirm) {
          wx.showLoading({
            title: '退款中',
          });
          try {
            wx.cloud.callFunction({
							name: "refund",
							data: {
								Number,
                outTradeNo,
                price,
							},
							success: res => {
								console.log('调用云函数成功', res.result);
				
								db.collection('product').where({
									orderNumber: item.orderNumber
								}).update({
									data: {
										type: '退款完成'
									},
									success: function (res) {
										console.log('订单取消成功');
										wx.hideLoading(); // 更新完成后隐藏 loading 提示框
										wx.showToast({
											title: '退款成功',
											icon: 'success'
										});
									},
									fail: function (err) {
										console.error('退款失败：', err);
										wx.showToast({
											title: '退款失败，请重试',
											icon: 'none'
										});
									}
								});
							},
							fail: err => {
								console.error('调用云函数失败', err);
								// 处理调用云函数失败的情况
							}
						})
            console.log('更新成功');
          } catch (err) {
            console.error('更新失败：', err);
          }

          wx.redirectTo({
            url: '../../pages/orders/orders'
          });
        } else if (res.cancel) {
          console.log('用户取消了取消订单操作');
        }
      }
		})

    

  },

	qxtk(e) {
		// 获取当前点击商品的索引
    const index = e.currentTarget.dataset.index;
    const item = this.data.order[index];
		wx.showModal({
      title: '取消退款',
      content: '确定要取消退款吗？',
      async success(res) { // 使用 async 关键字声明异步函数
        if (res.confirm) {
          wx.showLoading({
            title: '取消中',
          });

          try {
            // 更新 type=退款中 的订单为购买中
            await db.collection('product').where({
              orderNumber: item.orderNumber,
              type: '退款中'
            }).update({
              data: {
                type: '购买中'
              }
            });

            // 更新 type=待确认退款 的订单为售出中
            await db.collection('product').where({
              orderNumber: item.orderNumber,
              type: '待确认退款'
            }).update({
              data: {
                type: '售出中'
              }
            });

            console.log('更新成功');
          } catch (err) {
            console.error('更新失败：', err);
          }

          wx.hideLoading(); // 更新完成后隐藏 loading 提示框
          wx.reLaunch({
            url: '../../pages/orders/orders'
          });
        } else if (res.cancel) {
          console.log('用户取消了取消订单操作');
        }
      }
    });
	},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this;
    let _openid = wx.getStorageSync('openid');
    let type = options.type;
    that.setData({
      title: type,
      _openid: _openid.openid, // 将 _openid 设置到页面数据中
    });
    console.log('从本地缓存中获取到的openid:', _openid); // 打印获取到的 openid
    // that.get_order(type); // 在页面加载时获取对应类型的订单数据
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
    // let that = this;
    // let type = that.data.title;
    // that.get_order(type);

    //手动创建一个模拟的事件对象simulatedEvent包含了currentTarget 和 dataset，并将 that.data.title 赋值给 name
    let that = this;
    let simulatedEvent = {
      currentTarget: {
        dataset: {
          name: that.data.title
        }
      }
    };
    that.select_title(simulatedEvent);
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