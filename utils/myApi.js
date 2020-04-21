function Address(id) {
  let asdd = [];
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.jssrxx.com/api/addresses/${id}/children`,
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


function AddressRange(lat, lon) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.jssrxx.com/api/addresses/search?lat=${lat}&lng=${lon}`,
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

function queryUserOpenid(openid) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.jssrxx.com/api/customers/search`,
      data: {
        openid: openid
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        // console.log(res.data)
        return resolve(res.data)
      }
    })
  });
}

function getUserMessage(userData) {
  //  注册
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.jssrxx.com/api/customers`,
      data: {
        nickname: userData.nickname,
        openid: userData.openid,
        phonenumber: userData.phonenumber
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


function amendCustomersAddress(userData) {
  //  客户添加地址
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.jssrxx.com/api/customers/${userData.id}`,
      data: {
        addresses: [userData.address]
      },
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


module.exports = {
  address: Address,
  AddressRange: AddressRange,
  getUserMessage: getUserMessage,
  queryUserOpenid: queryUserOpenid,
  amendCustomersAddress: amendCustomersAddress
}
