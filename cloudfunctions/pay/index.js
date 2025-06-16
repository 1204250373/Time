// 云函数代码
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const Number_ = event.Number; // 接收小程序端传递的outTradeNo
  const price_ = event.price;
  const totalFee = Math.round(price_ * 100); // 将价格转换为以分为单位的整数形式
  const res = await cloud.cloudPay.unifiedOrder({
    "body" : "Time时间市场", // 商品描述
    "outTradeNo" : Number_ , // 商户订单号
    "spbillCreateIp" : "127.0.0.1", // 终端 IP
    "subMchId" : "1677562349", // 商户号
    "totalFee" : totalFee, // 总金额
    "envId": "cloud1-4gwl778a44199408", // 云函数环境名称
    "functionName": "pay" // 支付结果通知回调云函数名
  })
  return res
}