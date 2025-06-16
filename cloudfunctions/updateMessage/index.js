// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// // 云函数入口函数
// exports.main = async (event, context) => {
//   const db = cloud.database();
//   const messages = db.collection('message');
  
//   try {
//     // 根据消息记录的 _id 更新消息数组
//     const result = await messages.doc(event.messageId).update({
//       // 使用 $push 操作符将新消息插入到消息数组中
//       data: {
//         messages: db.command.push(event.newMessage)
//       }
//     });
    
//     return result;
//   } catch (err) {
//     console.error('更新消息失败：', err);
//     throw err;
//   }
// }

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database();
  const messages = db.collection('message');

  
  try {
    // 根据消息记录的 _id 更新消息数组
    const result = await messages.doc(event.messageId).update({
      // 使用 $push 操作符将新消息插入到消息数组中
      data: {
        messages: db.command.push({
          ...event.newMessage,
          createTime: db.serverDate() // 使用服务器时间
        })
      }
    });
    
    return result;
  } catch (err) {
    console.error('更新消息失败：', err);
    throw err;
  }
}
