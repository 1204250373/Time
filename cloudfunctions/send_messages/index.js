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
        time2: {
          value: event.time,//时间
        },
        thing1: {
          value: event.content,//留言内容
        },
        thing3: {
          value: '请尽快联系',//备注
        },
      },
      templateId: 'jplzlAN43zmS1kwmBp09CuKMo76Mf295WQ80UP54_-M', 
      miniprogramState: 'developer', // 这里可以选择开发版本或体验版本
    });
    return result;
  } catch (err) {
    return err;
  }
}