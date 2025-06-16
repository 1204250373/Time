// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { OPENID, APPID } = cloud.getWXContext();
    const serverTime = new Date();
    return serverTime;
  } catch (err) {
    return err;
  }
};
