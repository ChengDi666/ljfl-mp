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
    qqq: '请选择',
    xiaoquAdd: [],
    xiaoquIndex: [0,0],

    markers: [],

    sel_showModal:false,
    value: [0],
    user_openid: '',
    add_id: ''
  },


shiyan(e) {
  Add.amendCustomersAddress(e);
},

  
  regionchange(e) {
    // console.log(e)
    // 地图发生变化的时候，获取中间点，也就是用户选择的位置toFixed
    if (e.type == 'end' && (e.causedBy == 'scale' || e.causedBy == 'drag')) {
      // console.log(e)
      var that = this;
      this.mapCtx = wx.createMapContext("map4select");
      this.mapCtx.getCenterLocation({
        type: 'gcj02',
        success: (res) => {
          console.log(res, 11111)
          Add.AddressRange(res.latitude, res.longitude).then((result) => {
            console.log(result);
            if(result.statusCode == 500) { return }
            const list = result.data.map((item) => {
              item.checked = false;
              return item
            })
            this.setData({
              addressList: list
            });
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
    }
},

 //定位到自己的位置事件
 my_location: function(e) {
  var that = this;
  that.onLoad();
},

    // 外面的弹窗
    sel_btn () {
      this.setData({
        sel_showModal:true
      })
    },
   
    // 弹出层里面的弹窗
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
          checkedAdd: {},
          addressList: []
        })
      }, 500);
    },

    sel_haode() {
      if(this.data.checkedAdd.checked) {
        this.setData({
          sel_showModal:false
        })
        console.log(this.data.checkedAdd)
        const aa = this.qingqiu(this.data.checkedAdd.id).then((res) => {
          console.log(res)
          this.data.xiaoquAdd[0] = res;
          this.data.xiaoquAdd[1] = [{name:'请选择'}];
          this.setData({
            xiaoquAdd: this.data.xiaoquAdd
          })
        });
        console.log(aa)
        return ;
      }
      wx.showToast({
        title: '请选择地址',
        icon: 'none',
        duration: 2000,
        mask: true
      })
    },

    dChange(e) {
      wx.showLoading({
        title: '加载中',
      })
      console.log(e)
      console.log(this.data.value)
      console.log(e.detail.value)
      let valueCheng = {
        column: '',
        row: ''
      }
      e.detail.value.map((item, index) => {
        if(item != this.data.value[index]) {
          valueCheng.column = index;
          valueCheng.row = item;
          console.log('第' + valueCheng.column + '列,第' + valueCheng.row + '行,变了')
        }
      });
      this.data.value = e.detail.value
      // const a = e.detail.value[0]
      // console.log(a)
      // console.log(this.data.addressList[0][a])
      const addId = this.data.xiaoquAdd[valueCheng.column][valueCheng.row].id;
      const delNum = this.data.xiaoquAdd.length - (valueCheng.column + 1);
      if(addId == 0) {
        this.data.xiaoquAdd.splice(valueCheng.column + 1, delNum);
        e.detail.value.splice(valueCheng.column + 1, delNum);
        this.setData({
          value: e.detail.value,
          xiaoquAdd: this.data.xiaoquAdd
        })
        wx.hideLoading()
        console.log(this.data.xiaoquAdd)
        console.log(this.data.value)
        return ;
      }
      this.qingqiu(addId).then((res) => {
        console.log(res)
        if(res.length < 1) {
          this.data.xiaoquAdd.splice(valueCheng.column + 1, delNum);
          e.detail.value.splice(valueCheng.column + 1, delNum);
          this.setData({
            value: e.detail.value,
            xiaoquAdd: this.data.xiaoquAdd
          })
          wx.hideLoading()
          console.log(this.data.xiaoquAdd)
          console.log(this.data.value)
          return ;
        }
        this.data.xiaoquAdd[valueCheng.column + 1] = res
        this.data.xiaoquAdd.splice(valueCheng.column + 2, delNum);
        e.detail.value.push(0);
        this.setData({
          value: e.detail.value,
          xiaoquAdd: this.data.xiaoquAdd
        })
        wx.hideLoading()
      })
      this.data.qqq = this.data.qqq.split(' ');
      console.log(this.data.xiaoquAdd)
      this.data.qqq[valueCheng.column] = this.data.xiaoquAdd[valueCheng.column][valueCheng.row].name
      this.data.add_id = this.data.xiaoquAdd[this.data.xiaoquAdd.length-1][valueCheng.row]
      console.log(this.data.add_id)
      this.setData({
        qqq: this.data.qqq.join(' ')
      })
    },

    qingqiu(id) {
      return Add.address(id).then((res) => {
        if(res.data.length < 1) {
          return res.data;
        }
        const aaa = [{
          id: 0,
          name: '请选择'
        }].concat(res.data)
        console.log(res);
        return aaa;
      });
    },






  radioChange: function (e) {
    console.log(e.detail.value)
    var checked = e.detail.value
    var changed = {}
    for (var i = 0; i < this.data.addressList.length; i++) {
      if (checked.indexOf(this.data.addressList[i].id) !== -1) {
        changed['addressList[' + i + '].checked'] = true
        this.setData({
          checkedAdd: this.data.addressList[i]
        })
        console.log(this.data.checkedAdd)
      } else {
        changed['addressList[' + i + '].checked'] = false
      }
    }
    this.setData(changed)
  },

    // 外面的弹窗
    btn () {
      this.setData({
        showModal:true
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
        this.setData({
          showModal:false
        })
        console.log(this.data.checkedAdd)
        const aa = this.qingqiu(this.data.checkedAdd.id).then((res) => {
          console.log(res)
          this.data.xiaoquAdd[0] = res;
          this.setData({
            xiaoquAdd: this.data.xiaoquAdd
          })
        });
        console.log(aa)
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
  console.log(e)
  const uid = await Add.queryUserOpenid(this.data.user_openid)
  uid[0].addresses = [this.data.add_id]
  console.log(uid)
  this.shiyan({
    address: this.data.add_id,
    id: uid[0].id,
    uid: uid
  })
  if (!this.data.checkedAdd.id) {
    wx.showToast({
      title: '请选择地址',
      icon: 'none'
    })
    return
  }
  let p_id
  let c_id
  const username = this.data.checkedAdd.fullname + ' ' + this.data.qqq
  const p_index = username.indexOf('省')+1
  const c_index = username.indexOf('市')+1
  const str = username.substring(0,p_index);
  const strs = username.substring(p_index, p_index+3);
  const add_s = username.substring(p_index+2, username.length);
  console.log(add_s)
  if(str) {
    this.data.provinces.map((item) => {
      if(item.name == str) {
        p_id = item.id
        console.log(item)
      }
    })
  }
  const cities = await WXAPI.nextRegion(p_id);
  cities.data.map((item) => {
    if(item.name == '合肥市') {
      c_id = item.id
      console.log(item)
    }
  })
  if (add_s == "") {
    wx.showToast({
      title: '请填写详细地址',
      icon: 'none'
    })
    return
  }
  const postData = {
    token: wx.getStorageSync('token'),
    linkMan: this.data.nick,
    address: add_s,
    mobile: this.data.mobile,
    isDefault: 'true',
    provinceId: p_id,
    cityId: c_id
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
    console.log(a)
    this.setData({
      user_openid: a.data.openid
    })
    const b = await WXAPI.userDetail(wx.getStorageSync('token'))
    if(!b.data.base.mobile) {
      wx.showToast({
        title: '未绑定手机号',
        icon: 'none'
      })
    }
    console.log(b)
    this.setData({
      mobile: b.data.base.mobile,
      nick: b.data.base.nick
    })
    
  console.log({
    nickname: this.data.nick,
    mobile: this.data.mobile,
    openid: this.data.user_openid
  })
  Add.ceshi({
    score: '10',
    phonenumber: this.data.mobile,
    token: wx.getStorageSync('token')
  });
    wx.getLocation({
      type: 'gcj02', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: (res) => {
        this.data.latitude = res.latitude
        this.data.longitude = res.longitude
        Add.AddressRange(res.latitude, res.longitude).then((result) => {
          console.log(result);
          if(result.statusCode == 500) { return }
          const list = result.data.map((item) => {
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
        console.log(res)
        // wx.openLocation({
        //   latitude: res.latitude,
        //   longitude: res.longitude,
        // })
      }      
    })
    WXAPI.province().then((res) => {
      console.log(res)
      this.setData({
        provinces: res.data
      })

    })

    
  },

async onLoad(e) {


  if (e.id) { // 修改初始化数据库数据
    const res = await WXAPI.addressDetail(wx.getStorageSync('token'), e.id)
    console.log(res)
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
        console.log('用户点击取消')
      }
    }
  })
},
})
