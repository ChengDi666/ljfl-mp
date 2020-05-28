const urls = require('../config');

function Address(id) {
  //  当前地址的下级地址
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/addresses/${id}/children`,
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
      url: `${urls.myLink}/addresses/position?position={"lat": "${lat}", "lng": "${lng}"}`,
      // data: {
      //   position: {lat:lat,lng:lng}
      // },
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

function queryUserOpenid(openid, include) {
  //  通过Openid查询用户是否存在
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/customers`,
      data: {
        search: openid,
        include : include
      },
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

function getUserMessage(userData) {
  //  客户注册
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/customers`,
      data: {
        nickname: userData.nickname,
        realname: userData.nickname,
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
  //  客户修改地址
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls.myLink}/customers/${userData.id}`,
      data: {
        // addresses: userData.address,
        address_id: userData.address.data[0].id
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
