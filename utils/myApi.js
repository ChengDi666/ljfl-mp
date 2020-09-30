const urls = require('../config');

function Address(id) {
  //  当前地址的下级地址
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/addresses/${id}/children`,
      data: {},
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res.data)
        return resolve(res)
      }
    })
  });
}


function AddressRange(lat, lng) {
  //  获取区域内的地址信息
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/addresses/position?position={"lat": "${lat}", "lng": "${lng}"}`,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res);
        return resolve(res);
      },
      fail (err) {
        return resolve(err);
      }
    })
  });
}

function queryUserOpenid(unionid) {
  //  通过unionid查询用户是否存在
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/customers/unionid/${unionid}`,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res)
        return resolve(res.data)
      },
      fail (err) {
        console.log(err)
      }
    })
  });
}

function queryScode(id) {
  //  通过地址id 查询地址和积分
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/addresses?id=${id}`,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res)
        return resolve(res.data)
      },
      fail (err) {
        console.log(err)
      }
    })
  });
}


function getUserId(phonenumber) {
  //  关注 -  通过 手机号查询 商城用户
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/backend/user?phonenumber=${phonenumber}`,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res)
        return resolve(res)
      },
      fail (err) {
        console.log(err)
      }
    })
  });
}

function getUserMessage(userData) {
  //  客户注册
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/customers`,
      data: {
        nickname: userData.nickname,
        realname: userData.nickname,
        phonenumber: userData.phonenumber,
        address_id: userData.address_id,
        unionid: userData.unionid,
        user_id: userData.user_id,
        type_value: userData.type_value
      },
      method: 'POST',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res.data)
        return resolve(res)
      }
    })
  });
}


function getCustomers(data) {
  //  通过手机 查询客户信息
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/customers`,
      method: 'GET',
      data: data,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res)
        return resolve(res.data)
      }
    })
  });
}


function getAddressName(id) {
  //  通过 id 拆分地址
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/addresses/${id}/details`,
      method: 'GET',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res)
        return resolve(res.data)
      }
    })
  });
}

function getAddresses(mobile) {
  //  通过手机号获取用户信息
  return new Promise((resolve, reject) => {
    wx.request({
        url: `${urls.myLink}/api/addresses?search=${mobile}`,
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            // console.log(res);
            return resolve(res)
        }
    });
  });
}


function scoresTo(from, to, score) {
  //  积分转让
  return new Promise((resolve, reject) => {
    wx.request({
        url: `${urls.myLink}/api/backend/adjustscore?from=${from}&to=${to}&score=${score}`,
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            // console.log(res);
            return resolve(res)
        }
    });
  });
}




function amendCustomersAddress(id, userData) {
  //  客户修改地址
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/api/customers/${id}`,
      data: userData,
      method: 'PUT',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res.data)
        return resolve(res)
      }
    })
  });
}


function getFormData(urls,datas) {
  //  登录后台
  return new Promise((resolve, reject) => {
    wx.request({
        url: urls,
        method: 'POST',
        header: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        data: datas,
        success: function (res) {
            // console.log(res);
            resolve(res);
        },
        fail: function (err) {
            // console.log(err);
            reject(err.errMsg);
        }
    });
  });
}


module.exports = {
  address: Address,
  AddressRange: AddressRange,
  getUserMessage: getUserMessage,
  queryUserOpenid: queryUserOpenid,
  getCustomers: getCustomers,
  getAddressName: getAddressName,
  amendCustomersAddress: amendCustomersAddress,
  getFormData,
  queryScode,
  getAddresses,
  getUserId,
  scoresTo
}
