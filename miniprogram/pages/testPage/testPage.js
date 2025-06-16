const db = wx.cloud.database();
Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		dateobj: [], // 将属性名改为 dateobj，并初始化为空数组
		dateobj_num: 0,
		_openid: '',
		nickName: '',
	},


	bindFliterStartDateChange: function (e) {
		this.setData({
			fliterStartDate: e.detail.value //展示在wxml的时间
		})
	},

	bindFliterStartTimeChange: function (e) {
		this.setData({
			fliterStartTime: e.detail.value
		})
	},
	bindFliterEndDateChange: function (e) {
		this.setData({
			fliterEndDate: e.detail.value
		})
	},
	bindFliterEndTimeChange: function (e) {
		this.setData({
			fliterEndTime: e.detail.value
		})
	},

	submit(e) {
		//获取用户筛选的开始日期，且转换为Date类型
		const _fliterStartDate = new Date(this.data.fliterStartDate); // 获取 _fliterStartDate 的值
		console.log("用户选择的开始日期", _fliterStartDate);

		//获取用户筛选的开始时间，且转换为分钟数
		let fliterStartTime_String = this.data.fliterStartTime;
		let [filterStartHours, filterStartMinutes] = fliterStartTime_String.split(":").map(Number);
		let _fliterStartTime = filterStartHours * 60 + filterStartMinutes;
		console.log("用户选择的开始时间", _fliterStartTime)

		//获取用户筛选的结束日期，且转换为Date类型
		const _fliterEndDate = new Date(this.data.fliterEndDate); // 获取 _fliterStartDate 的值
		console.log("用户选择的结束日期", _fliterEndDate);

		//获取用户筛选的结束时间，且转换为分钟数
		let fliterEndTime_String = this.data.fliterEndTime;
		let [filterEndHours, filterEndMinutes] = fliterEndTime_String.split(":").map(Number);
		let _fliterEndTime = filterEndHours * 60 + filterEndMinutes;
		console.log("用户选择的结束时间", _fliterEndTime)

		wx.showLoading({ // 显示加载提示
			title: '加载中',
			mask: true // 显示透明蒙层，防止用户触摸穿透
		});

		db.collection("product").where({
			type: '我发布的'
		}).get({
			success: res => {
				//获取用户筛选的开始时间，且转换为分钟数
				// let fliterStartTime_String = this.data.fliterStartTime;
				// let [startHours, startMinutes] = fliterStartTime_String.split(":").map(Number);
				// let _fliterStartTime = startHours * 60 + startMinutes;
				// console.log("用户选择的开始时间", _fliterStartTime)

				let filteredData = res.data.filter(item => {
					let startDate = new Date(item.start_date);

					let startTime_String = item.start_time;
					let [startHours, startMinutes] = startTime_String.split(":").map(Number);
					let startTime = startHours * 60 + startMinutes;
					
					let endDate = new Date(item.end_date);

					let endTime_String = item.end_time;
					let [endHours, endMinutes] = endTime_String.split(":").map(Number);
					let endTime = endHours * 60 + endMinutes;

					//若开始时间为空

					// return startDate >= _fliterStartDate &&
					// 	endDate <= _fliterEndDate &&
					// 	startTime >= _fliterStartTime &&
					// 	endTime <= _fliterEndTime;
					console.log("开始日期", startDate)
					console.log("开始时间", startTime)
					console.log("结束日期", endDate)
					console.log("结束时间", endTime)

				})

				this.setData({
					dateobj: filteredData,
					dateobj_num: filteredData.length
				});

				this.calculateDistance();
				wx.hideLoading();
			},
			fail: () => {
				wx.hideLoading(); // 如果数据加载失败，也隐藏加载提示
				wx.showToast({
					title: '加载失败',
					icon: 'none',
					duration: 2000
				});
			}
		});
	},


	//购买支付
	buy(e) {
		const index = e.currentTarget.dataset.index;
		const item = this.data.dateobj[index];
		const orderNumber = item.orderNumber;
		const that = this;
		const openid = item._openid;
		const nickName = this.data.nickName;
		// const currentOpenid = that.data._openid;
		const productItem = item._openid;
		console.log('item', openid)
		// 判断商品是否为用户自己发布的
		if (productItem === that.data._openid) {
			wx.showToast({
				title: '不能购买自己的商品',
				icon: 'none',
				duration: 2000
			});
			return; // 如果是自己的商品，则停止执行购买流程
		}
		wx.showModal({
			title: '确认购买',
			content: '您确定要购买此商品吗？',
			success(res) {
				if (res.confirm) {
					wx.showLoading({
						title: '购买中'
					})
					wx.cloud.callFunction({
						name: 'buyproduct',
						data: {
							orderNumber,
							currentOpenid: that.data._openid,
						},
						success: res => {
							const ordernumber = item.orderNumber;
							const timestamp = new Date().getTime(); // 获取当前时间戳
							const price = item.price;
							// 将orderNumber和时间戳结合生成outTradeNo
							const Number = `${ordernumber}${timestamp}`;
							console.log('bb2', Number)
							console.log('bb3', price)
							wx.cloud.callFunction({
								name: 'pay',
								data: {
									Number,
									payment: res.result.payment,
									price,
								},
								success: res => {
									const payment = res.result.payment
									wx.requestPayment({
										...payment,
										success(res) {
											wx.showToast({
												title: '购买成功',
												icon: 'success',
												duration: 2000
											})
											that.sendone(openid, orderNumber, nickName); // 调用sendone方法并传递openid作为参数
											wx.redirectTo({
												url: '../../pages/goods/goods'
											})
											that.updateproductType_success(orderNumber, Number) // 修改
											console.log('pay success', res)
										},
										fail(err) {
											console.log('aaaa', res.result.payment)
											console.log('bb1', Number)
											console.error('pay fail', err)
											that.updateproductType_fales(orderNumber, '我发布的') // 修改
										}
									})

								},
								fail: err => {
									console.error(err)
									wx.showToast({
										title: '购买失败',
										icon: 'error',
										duration: 2000
									})
									that.updateproductType_fales(orderNumber, '我发布的') // 修改成 this.updateOrderType
								},
								complete() {
									wx.hideLoading()
								}
							})
						},
						fail: console.error
					})
				}
			}
		});
	},
	//支付失败的更新
	updateproductType_fales(orderNumber, type) {
		wx.cloud.callFunction({
			name: 'updateproductType_fales',
			data: {
				orderNumber,
				type
			},
			success: result => {
				if (result.result.success) {
					console.log('fales更新成功')
				} else {
					console.error(result.result.message)
				}
			},
			fail: console.error
		});
	},
	//支付成功的更新
	updateproductType_success(orderNumber, Number) {
		wx.cloud.callFunction({
			name: 'updateproductType_success',
			data: {
				orderNumber,
				Number,
			},
			success: result => {
				if (result.result.success) {
					console.log('fales更新成功')
				} else {
					console.error(result.result.message)
				}
			},
			fail: console.error
		});
	},
	//发送订阅消息
	sendone(openid, orderNumber, nickName) {
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
				name: "send_to_seller",
				data: {
					openid: openid,
					time: time,
					orderNumber: orderNumber,
					nickName: nickName,
				},
			})
			.then(res => {
				console.log("发送单条成功", res);
			})
			.catch(err => {
				console.log("发送单条失败", err);
			});
	},


	// 使用 watch 监听 product 表的变化
	dbwatch() {
		const watcher = db.collection('product').where({
			type: '我发布的'
		}).watch({
			onChange: snapshot => {
				// 使用箭头函数，保持 this 的上下文
				this.refresh();
			},
			onError: err => {
				console.error('监听出错', err);
			}
		});
	},

	// 获取数据渲染页面
	refresh() {
		wx.showLoading({ // 显示加载提示
			title: '加载中',
			mask: true // 显示透明蒙层，防止用户触摸穿透
		});

		db.collection("product").where({
			type: '我发布的'
		}).get({
			success: res => {
				this.setData({
					dateobj: res.data // 将获取到的数据设置到 dateobj 属性中
				});
				this.calculateDistance(); // 在成功获取数据后立即计算距禽并更新 distance 属性
				wx.hideLoading(); // 数据加载完成后隐藏加载提示
			},
			fail: () => {
				wx.hideLoading(); // 如果数据加载失败，也隐藏加载提示
				wx.showToast({
					title: '加载失败',
					icon: 'none',
					duration: 2000
				});
			}
		});
	},

	//计算
	rad(d) {
		return d * Math.PI / 180.0; // 定义一个函数 rad，用于将角度转换为弧度
	},
	//计算
	getDistance(lat1, lng1, lat2, lng2) {
		var radLat1 = this.rad(lat1); // 将第一个纬度值转换为弧度
		var radLat2 = this.rad(lat2); // 将第二个纬度值转换为弧度
		var a = radLat1 - radLat2; // 计算纬度的差值
		var b = this.rad(lng1) - this.rad(lng2); // 计算经度的差值
		var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2))); // 使用 Haversine 公式计算两点之间的球面距离
		s = s * 6378.137; // EARTH_RADIUS; 将球面距离转换为实际距离（假设地球半径为 6378.137 公里）
		s = Math.round(s * 10000) / 10000; // 将距离四舍五入保留四位小数，输出为公里

		var distance = s; // 将距离保存到变量 distance 中
		var distance_str = ""; // 初始化距离字符串变量
		return s; // 返回计算得到的距离
	},
	//计算
	calculateDistance() {
		const {
			userLatitude,
			userLongitude,
			dateobj
		} = this.data;
		if (userLatitude && userLongitude && dateobj) {
			let updatedDateobj = dateobj.map(item => {
				const resKm = this.getDistance(userLatitude, userLongitude, item.location.latitude, item.location.longitude);
				const distance = resKm.toFixed(2);
				let distanceDisplay = distance > 1 ? distance + 'km' : (distance * 1000) + 'm';
				return {
					...item,
					distance: distanceDisplay
				};
			});

			this.setData({
				dateobj: updatedDateobj
			});
			console.log('结果2', updatedDateobj); // 使用 updatedDateobj 而不是 dateobj
		}
	},

	onLoad() {
		let that = this;
		const userInfo = wx.getStorageSync('userInfo');
		const nickName = userInfo.nickName;
		console.log('本地缓存中的用户信息:', nickName);
		//获取openid数组
		let _openid = wx.getStorageSync('openid');
		this.refresh(),
			this.dbwatch(),
			// 将 _openid 设置到页面数据中
			that.setData({
				_openid: _openid.openid,
				nickName: nickName,
			});
		console.log('从本地缓存中获取到的openid:', _openid);
		wx.getLocation({
			isHighAccuracy: true,
			success: (res) => {
				const latitude = res.latitude;
				const longitude = res.longitude;
				console.log('用户的经度', latitude);
				console.log('用户的纬度', longitude);
				this.setData({
					userLatitude: latitude,
					userLongitude: longitude
				});
				this.refresh(); // 获取位置信息后执行距离计算
			},
			fail: (err) => {
				console.error('获取位置信息失败', err);
				// 处理位置信息获取失败的情况
			}
		});


	},
	onReady() {},
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
	onHide() {},
	onUnload() {},
	onPullDownRefresh() {},
	onReachBottom: function () {
		// wx.showLoading({
		//   title: '刷新中！',
		//   duration: 1000
		// })

		let x = this.data.product_nums + 20
		console.log(x)
		let old_data = this.data.dateobj
		db.collection('product').orderBy('time', 'desc').skip(x) // 限制返回数量为 20 条
			.get()
			.then(res => {
				// 这里是从数据库获取文字进行转换 变换显示（换行符转换） 
				// res.data.forEach((item, i) => {
				//   res.data[i].remark = res.data[i].remark.split('*hy*').join('\n');
				// })

				// 利用concat函数连接新数据与旧数据
				// 并更新product_nums  
				this.setData({
					dateobj: old_data.concat(res.data),
					product_nums: x
				})
				console.log(res.data)
			})
			.catch(err => {
				console.error(err)
			})
		console.log('circle 下一页');
		// wx.hideLoading(); // 数据加载完成后隐藏加载提示
	},

	onShareAppMessage() {}
})