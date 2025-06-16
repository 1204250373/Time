// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const {
    orderNumber,
    currentOpenid
  } = event;

  try {
    // 使用事务来确保商品只能被一个用户购买
    const res = await db.runTransaction(async transaction => {
      const productRes = await transaction.collection("product").where({
        orderNumber: orderNumber,
        type: '我发布的'
      }).get();

      if (productRes.data.length === 0) {
        return {
          canBuy: false
        };
      }

      // const canBuy = productRes.data[0]._openid !== currentOpenid;
      // if (canBuy) {
      //   // 更新商品类型为购买中
      //   await transaction.collection("product").where({
      //     orderNumber: orderNumber
      //   }).update({
      //     data: {
      //       type: '付款中'
      //     }
      //   });
      // }

      const product = productRes.data[0];
      if (product._openid === currentOpenid) {
        return {
          canBuy: false,
          message: '不允许自发自买'
        };
      }

      // 更新商品类型
      await transaction.collection("product").where({
        orderNumber: orderNumber
      }).update({
        data: {
          type: '付款中'
        }
      });

      return {
        canBuy: canBuy,
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        nonceStr: Math.random().toString(36).substr(2),
        package: 'prepay_id=' + Date.now(),
        paySign: 'paySign',
      };
    });

    return res;
  } catch (e) {
    console.error(e);
    return {
      canBuy: false
    };
  }
}