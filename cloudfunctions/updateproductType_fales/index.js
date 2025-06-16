// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const { orderNumber, type } = event

  try {
    const result = await db.collection('product').where({
      orderNumber
    }).update({
      data: {
        type: '我发布的'
      }
    })

    if (result.stats.updated === 1) {
      return {
        success: true
      }
    } else {
      return {
        success: false,
        message: '更新失败，请重试'
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
