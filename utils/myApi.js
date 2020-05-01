// const urls = 'https://api.jssrxx.com/api'
const urls = 'https://api.lvfen.site/v1'

function Address(id) {
  //  当前地址的下级地址
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls}/addresses/${id}/children`,
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
      url: `${urls}/addresses/position?position={"lat": "${lat}", "lng": "${lng}"}`,
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

function queryUserOpenid(openid) {
  //  通过Openid查询用户是否存在
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls}/customers`,
      data: {
        search: openid
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
  //  客户注册
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${urls}/customers`,
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
      url: `${urls}/customers/${userData.id}`,
      data: {
        addresses: userData.address
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
