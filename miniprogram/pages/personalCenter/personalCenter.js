const db = wx.cloud.database();

const app = getApp();

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		userInfo: {
			avatarUrl: '',
			nickName: '',
			_openid: ''
		},
		userprofile: "../../images/个人头像.png",
		username: "",
		isLoggedIn: false, // 新增一个标识用户是否已登录的变量
		showUserProfile: true // 新增一个标识是否显示userprofile的变量
	},
	//订单
	goorder() {
		try {
			wx.setStorageSync('tab', 0)
		} catch (e) {}
	},
	goorders(e) {
		try {
			let tab = e.currentTarget.dataset.index
			wx.setStorageSync('tab', tab)
		} catch (e) {}
	},

	// 退出
	logout(e) {
		wx.showModal({
			title: '',
			content: '确认退出',
			success: res => {
				if (res.confirm) {
					wx.removeStorageSync('user');
					wx.removeStorageSync('userInfo'); // 移除用户信息的本地缓存
					wx.removeStorageSync('isLoggedIn'); // 移除用户登录状态的本地缓存
					app.globalData.userInfo = null;
					console.log("aaa");
					// 清除 OpenID
					wx.removeStorageSync('openid');
					console.log("已清除");
					this.setData({
						'userInfo.avatarUrl': '',
						'userInfo.nickName': '',
						isLoggedIn: false, // 退出登录后设置为false
						showUserProfile: true // 退出登录后重新显示userprofile
					});
					// 手动设置 isLoggedIn 为 false
					this.setData({
						isLoggedIn: false
					});
				} else if (res.cancel) {}
			}
		});
	},

	// 头像点击事件
	handleAvatarClick: function () {
		if (!this.data.isLoggedIn) {
			// 如果用户未登录，则执行登录操作
			wx.navigateTo({
				url: '/pages/index/index?redirectTo=' + encodeURIComponent('/pages/personalCenter/personalCenter')
			});
			
		}
		// else {
		// 如果用户已登录，则执行其他操作，比如跳转到个人中心页面
		// 	wx.navigateTo({
		// 		url: '/pages/testPage/testPage'
		// 	});
		// }
	},

	addBalanceOrders() {
		// 查询满足条件的 product 记录
		db.collection("product").where({
			_openid: this.data._openid,
			type: "已售出的",
			status: "未提现的"
		}).get().then(res => {
			const products = res.data;
			if (products.length === 0) {
				console.log('未找到满足条件的记录');
					// 跳转页面
					wx.navigateTo({
						url: '../wallet/wallet',
					})
				return;
			}

			// 检查是否已存在相同 orderNumber 的记录
			const existingOrderNumbers = new Set(); // 用于存储已存在的 orderNumber
			db.collection("balanceOrders").field({
				orderNumber: true
			}).get().then(result => {
				result.data.forEach(item => {
					existingOrderNumbers.add(item.orderNumber);
				});

				// 将满足条件的 product 记录添加到 balanceOrders 表中
				const promises = products.map(product => {
					if (existingOrderNumbers.has(product.orderNumber)) {
						console.log('已存在相同 orderNumber 的记录，跳过添加:', product.orderNumber);
						return Promise.resolve(); // 已存在相同 orderNumber 的记录，跳过添加
					}

					// 删除 product 记录中的一些字段，例如 _id、_openid等，避免添加到 balanceOrders 时出现问题
					delete product._id;
					delete product._openid;
					delete product.start_date;
					delete product.start_time;
					delete product.end_date;
					delete product.end_time;
					delete product.remark;

					// 添加到 balanceOrders 表中
					return db.collection("balanceOrders").add({
						data: product
					});
				});

				// 等待所有添加操作完成
				Promise.all(promises).then(res => {
					console.log('成功添加到 balanceOrders 表中', res);
					// 跳转页面
					wx.navigateTo({
						url: '../wallet/wallet',
					})
				}).catch(err => {
					console.error('添加到 balanceOrders 表中失败', err);
				});
			}).catch(err => {
				console.error('查询 balanceOrders 表失败', err);
			});
		}).catch(err => {
			console.error('查询 product 表失败', err);
		});
		
	},

	set() {
		wx.showToast({
			title: '敬请期待',
			duration: 3000,
			icon: "none",
		})
	},

	feedback() {
		wx.showToast({
			title: '敬请期待',
			duration: 3000,
			icon: "none",
		})
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad(options) {
		let that = this;
		let _openid = wx.getStorageSync('openid');
		// 从本地缓存中获取用户信息
		const userInfo = wx.getStorageSync('userInfo');
		console.log('本地缓存中的用户信息:', userInfo);
    // const bbbbaaa = wx.getStorageSync('isLoggedIn');
    // console.log('wfqwfgqwgwg:',bbbbaaa);

		// 更新页面数据
		if (userInfo) {
			this.setData({
				'userInfo.avatarUrl': userInfo.avatarUrl,
				'userInfo.nickName': userInfo.nickName,
			});
		} else {
			// 处理缓存中没有数据的情况，例如跳转到登录页面重新登录
			wx.navigateTo({
				url: '/pages/index/index?redirectTo=' + encodeURIComponent('/pages/personalCenter/personalCenter'),
			});
		}
		that.setData({
			_openid: _openid.openid,
		});
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {
		// 每次页面显示时检查是否已经登录
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    console.log('登录状态已成功缓存:',isLoggedIn);
		if (isLoggedIn) {
			// 如果用户已登录，则更新页面数据并切换到显示用户头像和昵称
			const userInfo = wx.getStorageSync('userInfo');
			if (userInfo) {
				this.setData({
					'userInfo.avatarUrl': userInfo.avatarUrl,
					'userInfo.nickName': userInfo.nickName,
					isLoggedIn: true,
					showUserProfile: false // 登录成功后切换到显示userInfo.nickName
				});
			} else {
				// 如果用户已退出登录，则清空页面数据并切换到显示用户头像和昵称
				this.setData({
					'userInfo.avatarUrl': '',
					'userInfo.nickName': '',
					isLoggedIn: false,
					showUserProfile: true
				});
			}
		}
	}
});