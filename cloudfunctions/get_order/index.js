// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
//初始化数据库
const db = cloud.database()
const _ =db.command
const $ = _.aggregate
// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection('product').aggregate()
  .lookup({
    from:'Purchased',
    localField: { field1: 'type', field2: '_openid' }, // 本地字段，用于匹配
    foreignField: { field1: 'type', field2: '_openid' }, // 外联字段，用于匹配
    as: 'Info' // 查询结果别名，可自定义
  })
  .end()
}