function Address(id) {
  let asdd = [];
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.jssrxx.com/api/addresses/${id}/children`,
      data: {},
      header: {
        'content-type': 'application/json' // 默认值
      },
        // console.log(res.data)
      success (res) {
        asdd = res.data;
        return resolve(res)
      }
    })
  });
}


function AddressRange(lat, lon) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.jssrxx.com/api/addresses/search/lat='${lat}'&lng='${lon}'`,
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

module.exports = {
  address: Address,
  AddressRange: AddressRange
}
