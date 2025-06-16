// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // const currentTime = new Date().toLocaleString(); // 获取当前时间并格式化为字符串
    // console.log('Current time:', currentTime); // 添加调试语句
    const result = await cloud.openapi.subscribeMessage.send({
      touser: event.openid, // 替换成用户的openid
      page: '/pages/orders/orders', // 点击模板消息会跳转到小程序的哪个页面
      data: {
        thing2: {
          value: '日卡',//商品名称
        },
        thing3: {
          value: event.nickName,//买家
        },
        time5: {
          value: event.time,//拍下时间
          // value:currentTime,
        },
        character_string1: {
          value: event.orderNumber,//单号
        },
        thing6: {
          value: '请尽快联系',//温馨提醒
        },
      },
      templateId: 'MotvKt8ltyHoe2G9eGpIPUsYwnay7QrZFcmp6uTfqTM', // 替换成你自己的模板ID
      miniprogramState: 'developer', // 这里可以选择开发版本或体验版本
    });
    return result;
  } catch (err) {
    return err;
  }
}