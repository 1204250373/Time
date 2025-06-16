// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database();
  const messages = db.collection('message');
  
  try {
    // 根据订单号查询消息记录
    const result = await messages.where({
      orderNumber: event.orderNumber
    }).get();
    
    return result;
  } catch (err) {
    console.error('查询消息失败：', err);
    throw err;
  }
}