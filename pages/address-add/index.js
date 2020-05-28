const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const Add = require('../../utils/myApi')
Page({
  data: {
    longitude: '',
    latitude: '',
    addressList: [[''],[''],['']],
    showModal:false,
    checkedAdd: {},
    longAddress: '请选择',
    xiaoquAdd: [],

    markers: [],

    sel_showModal:false,
    value: [0],
    user_openid: '',
    add_id: ''
  },


async CustomersAddress() {
  let isTrue = false;
  const uid = await Add.queryUserOpenid(this.data.user_openid, '')
  console.log(uid)
  let  addMessage;
  // addMessage = uid.data[0].addresses;
  // if(uid.data.length != 0) {
    // if(!addMessage) { //  没有地址信息
    //   addMessage = { data: [this.data.add_id] };
    //   Add.amendCustomersAddress({
    //     address: addMessage,
    //     id: uid.data[0].id
    //   });
    //   return isTrue;
    // } else {
    //   addMessage.data.map((item) => {
    //     if (item.id == this.data.add_id.id) {
    //       isTrue = true;
    //     }
    //   });
    // }
  // }
  if(!isTrue) {
    addMessage = { data: this.data.add_id};
    Add.amendCustomersAddress({
      address: addMessage,
      id: uid.data[0].id
    });
  }
  return isTrue;
},

  
  regionchange(e) {
    wx.showLoading({
      title: '地址加载中',
    })
    // 地图发生变化的时候，获取中间点，也就是用户选择的位置toFixed
    if (e.type == 'end' && (e.causedBy == 'scale' || e.causedBy == 'drag' || e.causedBy == 'update')) {
      var that = this;
      this.mapCtx = wx.createMapContext("map4select");
      this.mapCtx.getCenterLocation({
        type: 'gcj02',
        success: (res) => {
          Add.AddressRange(res.latitude, res.longitude).then((result) => {
            // console.log(result)
            if(result.statusCode != 200 || result.data.data.length == 0) { 
              wx.hideLoading();       
              wx.showToast({
                title: '网络不稳定,请重试!',
                icon: 'none',
                mask: true
              })
              setTimeout(() => {
                that.setData({
                  showModal: false,
                  checkedAdd: {},
                  addressList: []
                })
              }, 1000);
              return 
            }
            var list = result.data.data.map((item) => {
              item.checked = false;
              return item
            })
            this.setData({
              addressList: list
            });
            wx.hideLoading()
          });
          that.setData({
            // latitude: res.latitude,
            // longitude: res.longitude,
            markers: [{
              id: 0,
              latitude: res.latitude,
              longitude: res.longitude,
              width: 50,
              height: 50
            }],
          })
        }
      })
    } else {
      wx.showToast({
        title: '地址加载错误!',
        icon: 'none',
        mask: true
      })
    }
},

 //定位到自己的位置事件
 my_location: function(e) {
  var that = this;
  that.onLoad();
},

    // 外面的弹窗-选择器
    sel_btn () {
      this.setData({
        sel_showModal:true
      })
    },
   
    // 弹出层里面的弹窗-选择器
    sel_call () {
      wx.showToast({
        title: '未选择地址',
        icon: 'none',
        duration: 1000,
        mask: true
      })
      setTimeout(() => {
        this.setData({
          sel_showModal: false,
          value: [0],
          longAddress: '请选择',
        })
      }, 500);
    },
    // -选择器
    sel_haode() {
      let isShow = true;
      if(this.data.value) {
        this.data.value.map((item) => {
          //  如果选择的是“请选择”
          if(item == 0) {
            isShow = false
          }
        })
      }
      if(this.data.checkedAdd.checked && isShow) {
        this.setData({
          sel_showModal:false
        })
        return ;
      }
      wx.showToast({
        title: '请选择具体地址',
        icon: 'none',
        duration: 2000,
        mask: true
      })
    },

    dChange(e) {
      //  值变动
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      // console.log(this.data.value)
      // console.log(e.detail.value)
      let valueCheng = {
        column: '',
        row: ''
      }
      let isChange = false;
      this.data.value = e.detail.value.map((item, index) => {
        if(isChange) {
          return 0;
        }
        if(item != this.data.value[index]) {
          isChange = true
          valueCheng.column = index;
          valueCheng.row = item;
          // console.log('第' + valueCheng.column + '列,第' + valueCheng.row + '行,变了')
          return item;
        }
        return item;
      });
      this.setData({
        value: this.data.value
      })
      //  获取被选择的ID
      const addId = this.data.xiaoquAdd[valueCheng.column][valueCheng.row].id;
      const delNum = this.data.xiaoquAdd.length - (valueCheng.column + 1);
      if(addId == 0) {
        //  如果被选择的是“请选择”,删除后面的列
        this.data.xiaoquAdd.splice(valueCheng.column + 1, delNum);
        this.data.value.splice(valueCheng.column + 1, delNum);
        this.setData({
          value: this.data.value,
          xiaoquAdd: this.data.xiaoquAdd
        })
        wx.hideLoading()
        return ;
      }
      this.qingqiu(addId).then((res) => {
        // console.log(res)
        if(res.length < 1) {
          this.data.xiaoquAdd.splice(valueCheng.column + 1, delNum);
          this.data.value.splice(valueCheng.column + 1, delNum);
          this.setData({
            value: this.data.value,
            xiaoquAdd: this.data.xiaoquAdd
          })
          wx.hideLoading()
          if(!this.data.xiaoquAdd[this.data.xiaoquAdd.length - 1][1].hasChildren) {
            //  最后一列数据，且没有子地址
          }
          return ;
        }
        this.data.xiaoquAdd[valueCheng.column + 1] = res
        this.data.xiaoquAdd.splice(valueCheng.column + 2, delNum);
        this.data.value.push(0);
        this.setData({
          value: this.data.value,
          xiaoquAdd: this.data.xiaoquAdd
        })
        wx.hideLoading()
      })
      this.data.longAddress = this.data.longAddress.split(' ');
      // console.log(this.data.xiaoquAdd)
      this.data.longAddress[valueCheng.column] = this.data.xiaoquAdd[valueCheng.column][valueCheng.row].name
      this.data.add_id = this.data.xiaoquAdd[this.data.xiaoquAdd.length-1][valueCheng.row]
      // console.log(this.data.add_id)
      this.setData({
        longAddress: this.data.longAddress.join(' ')
      })
    },

    qingqiu(id) {
      return Add.address(id).then((res) => {
        // console.log(res)
        if(res.data.data.length < 1) {
          return res.data.data;
        }
        const newData = [{
          id: 0,
          name: '请选择'
        }].concat(res.data.data)
        return newData;
      });
    },






  radioChange: function (e) {
    // console.log(e.detail.value)
    var checked = e.detail.value
    var changed = {}
    for (var i = 0; i < this.data.addressList.length; i++) {
      if (checked.indexOf(this.data.addressList[i].id) !== -1) {
        changed['addressList[' + i + '].checked'] = true
        this.setData({
          checkedAdd: this.data.addressList[i]
        })
        // console.log(this.data.checkedAdd)
      } else {
        changed['addressList[' + i + '].checked'] = false
      }
    }
    this.setData(changed)
  },

    // 地图选点
    btn () {
      this.setData({
        showModal:true,
        value: [0],
        longAddress: '请选择',
      })
    },
   
    // 弹出层里面的弹窗
    ok () {
      wx.showToast({
        title: '未选择地址',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      setTimeout(() => {
        this.setData({
          showModal: false,
          checkedAdd: {},
          addressList: []
        })
      }, 1000);
    },

    haode() {
      if(this.data.checkedAdd.checked) {
        this.qingqiu(this.data.checkedAdd.id).then((res) => {
          // console.log(res)
          this.data.xiaoquAdd = [res];
          this.setData({
            xiaoquAdd: this.data.xiaoquAdd
          })
        });
        this.setData({
          showModal:false
        })
        return ;
      }
      wx.showToast({
        title: '请选择地址',
        icon: 'none',
        duration: 2000,
        mask: true
      })
    },



async bindSave(e) {
  if(await this.CustomersAddress()) {
    //  地址已存在
    wx.showToast({
      title: '地址已存在',
      icon: 'none'
    })
    return ;
  }
  if (!this.data.checkedAdd.id) {
    wx.showToast({
      title: '请选择地址',
      icon: 'none',
      mask: true
    })
    return
  }
  let p_id
  let c_id
  const username = this.data.checkedAdd.parent_name + '.' + this.data.longAddress
  const userAddressArr = username.split('.');
  const provincesName = userAddressArr[0];
  const citiesName = userAddressArr[1];
  userAddressArr.splice(0,2);
  const shortAddress = userAddressArr.join('.');
  if(provincesName) {
    this.data.provinces.map((item) => {
      if(item.name == provincesName) {
        p_id = item.id
        // console.log(item)
      }
    })
  }
  const cities = await WXAPI.nextRegion(p_id);
  cities.data.map((item) => {
    if(item.name == citiesName) {
      c_id = item.id
      // console.log(item)
    }
  })
  if (shortAddress == "") {
    wx.showToast({
      title: '请填写详细地址',
      icon: 'none',
      mask: true
    })
    return
  }
  const postData = {
    token: wx.getStorageSync('token'),
    linkMan: this.data.nick,
    address: shortAddress,
    mobile: this.data.mobile,
    // isDefault: 'true', //  是否为默认地址
    provinceId: p_id,
    cityId: c_id,
    extJsonStr: JSON.stringify({ myAddressId: this.data.add_id.id}),  //  附加信息
  }
  let apiResult
  if (this.data.id) {
    postData.id = this.data.id
    apiResult = await WXAPI.updateAddress(postData)
  } else {
    apiResult = await WXAPI.addAddress(postData)
  }
  if (apiResult.code != 0) {
    // 登录错误 
    wx.hideLoading();
    wx.showToast({
      title: apiResult.msg,
      icon: 'none'
    })
    return;
  } else {
    wx.navigateBack()
  }
},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady () {
    //  通过本地存储的token 获取Openid
    const a =  await WXAPI.userWxinfo(wx.getStorageSync('token'))
    this.setData({
      user_openid: a.data.openid
    })
    const b = await WXAPI.userDetail(wx.getStorageSync('token'))
    if(!b.data.base.mobile) {
      wx.showToast({
        title: '未绑定手机号',
        icon: 'none',
        duration: 2000,
        mask: true
      })
      setTimeout(() => {
        wx.switchTab({
          url: "/pages/my/index"
        })
      }, 1000);
    }
    this.setData({
      mobile: b.data.base.mobile,
      nick: b.data.base.nick
    })
    wx.getLocation({
      type: 'gcj02', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: (res) => {
        this.data.latitude = res.latitude
        this.data.longitude = res.longitude
        Add.AddressRange(res.latitude, res.longitude).then((result) => {
          // console.log(result);
          if(result.statusCode != 200 || result.data.data.length == 0) { return }
          const list = result.data.data.map((item) => {
            item.checked = false;
            return item
          })
          this.setData({
            addressList: list
          });
        });
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          markers: [{
            latitude: res.latitude,
            longitude: res.longitude,
            width: 50,
            height: 50
          }],
        })
        // wx.openLocation({
        //   latitude: res.latitude,
        //   longitude: res.longitude,
        // })
      }      
    })
    WXAPI.province().then((res) => {
      // console.log(res)
      this.setData({
        provinces: res.data
      })

    })

    
  },

async onLoad(e) {
  if (e.id) { // 修改初始化数据库数据
    const res = await WXAPI.addressDetail(wx.getStorageSync('token'), e.id)
    if (res.code == 0) {
      this.setData({
        id: e.id,
        addressData: res.data.info
      })
      // this.provinces(res.data.info.provinceId, res.data.info.cityId, res.data.info.districtId)
    } else {
      wx.showModal({
        title: '错误',
        content: '无法获取快递地址数据',
        showCancel: false
      })
    }
  } else {
    // this.provinces()
  }
},
deleteAddress: function (e) {
  const id = e.currentTarget.dataset.id;
  wx.showModal({
    title: '提示',
    content: '确定要删除该收货地址吗？',
    success: function (res) {
      if (res.confirm) {
        WXAPI.deleteAddress(wx.getStorageSync('token'), id).then(function () {
          wx.navigateBack({})
        })
      } else {
        // console.log('用户点击取消')
      }
    }
  })
},
})
