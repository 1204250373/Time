// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
	env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const Number_ = event.Number; // 接收小程序端传递的outTradeNo
  const outTradeNo = event.outTradeNo;
  const price_ = event.price;
  const totalFee = Math.round(price_ * 100); // 将价格转换为以分为单位的整数形式
	try {
		// 调用微信支付退款API
		const result = await cloud.cloudPay.refund({
			"out_refund_no" : Number_,//商户退款单号
			"out_trade_no" : outTradeNo,//商户订单号
			"nonce_str" : ""+new Date().getTime(),//随机字符串
			"sub_mch_id" : "1677562349",//子商户号
			"total_fee" : totalFee,//订单金额
			"refund_fee":  totalFee,//申请退款金额	
			"envId": "cloud1-4gwl778a44199408"//云开发环境
		})
		console.log(event.Number)
		return result;
	} catch (err) {
		console.log(err);
		return err;
	}
};