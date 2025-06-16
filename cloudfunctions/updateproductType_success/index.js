// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const {
    orderNumber,
    Number,
  } = event

  try {
    // 查询符合条件的订单数据
    const res = await db.collection('product').where({
      orderNumber
    }).get()

    const orders = res.data

    if (orders.length > 0) {
      // 更新订单数据的type字段为"售出中"
      await db.collection('product').doc(orders[0]._id).update({
        data: {
          type: '售出中',
          outTradeNo:Number,
        }
      })

      const newOrderData = {
        ...orders[0]
      }
      delete newOrderData._id
      newOrderData._openid = cloud.getWXContext().OPENID;
      await db.collection('product').add({
        data: {
          // ...orders[0],
          // _openid: cloud.getWXContext().OPENID,
          // _id: null, // 设置为null会自动生成新的_id
          ...newOrderData,
          type: '购买中'
        }
      })

      return {
        success: true
      }
    } else {
      return {
        success: false,
        message: '未找到符合条件的订单数据'
      }
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      message: '更新失败，请重试'
    }
  }
}