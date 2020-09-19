const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const Add = require('../../utils/myApi')
Page({
  data: {
    longitude: '',
    latitude: '',
    addressList: [[''],[''],['']],
    showModal:false,
    checkedAdd: {},   //  选中的小区地址
    longAddress: '请选择',
    xiaoquAdd: [],      //  所有地址数组

    markers: [],

    sel_showModal:false,
    value: [0],    //  选择的下标
    user_unionid: '',
    add_id: ''      //   选择的具体地址
  },


async CustomersAddress() {
  //  绑定地址到平台
  let isTrue = false;
  const uid = await Add.getCustomers({unionid: this.data.user_unionid})
  // console.log(uid)
  if(!isTrue) {
    // await this.setPrimaryUser();    //  绑定地址前，测试是否是主用户
    // console.log(this.data.add_id);
    this.data.add_id
    const score = this.data.add_id.score;
    console.log(this.data.mobile, score);
    //  更新地址 时 同步积分
    if(score != 0 && uid.data[0].isholder == 1) {
      // await AUTH.asyncScode(this.data.mobile, score, '绑定地址同步积分');
    }
    Add.amendCustomersAddress({
      addressid: this.data.add_id.id,
      id: uid.data[0].id
    }).then((res) => {
      console.log(res);
      //  更新地址成功后，用户为户主时 同步积分
      if(score != 0 && res.data.data.isholder == 1) {
        console.log('更新地址成功后，用户为户主时 同步积分');
        // await AUTH.asyncScode(this.data.mobile, score, '绑定地址同步积分');
      } else {
        console.log('不是户主，没同步积分');
        console.log(this.data.add_id);
      }
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
      }, () => {
        console.log('有数据了');
        setTimeout(() => {
          wx.hideLoading();
        }, 500);
      })
      wx.showLoading({
        title: '加载中',
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
    // -选择器 -- 确定
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
//  设置主用户
async setPrimaryUser() {
  const isok = await Add.getCustomers({addressid: this.data.add_id.id}).then(res => {
    //  根据地址id 查询是否有用户
    // console.log(res)
    if (res.data.length >= 1) { //  当前地址有用户绑定 —— 不是主用户
      // console.log('当前地址有用户绑定 —— 不是主用户')
      return false;
    }
    return true;
  });
  if(isok) {
    //  修改用户附加信息——主用户
    const userMes = await WXAPI.userDetail(wx.getStorageSync('token'));
    // console.log(userMes)
    const message = {
      avatarUrl: userMes.data.base.avatarUrl,
      city: userMes.data.base.city,
      province: userMes.data.base.province,
      nick: userMes.data.base.nick,
      gender: userMes.data.base.gender,
      token: wx.getStorageSync('token'),
      extJsonStr: JSON.stringify({ '主用户': '是'}),  //  附加信息
    };
    WXAPI.modifyUserInfo(message).then((res) => {
      // console.log(res);
      // console.log('是主用户');
    });
  }
},


async bindSave(e) {
  // console.log(this.data.add_id)
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
  const addressName = await Add.getAddressName(this.data.add_id.id);
  let p_id;
  let c_id;
  await this.data.provinces.map((item) => {
    if(item.name == addressName.data[0]) {
      p_id = item.id
    }
  })
  if (p_id == undefined) {
    wx.showToast({
      title: '网络不稳，请稍后重试',
      icon: 'none'
    });
    return ;
  };
  const cities = await WXAPI.nextRegion(p_id);
  await cities.data.map((item) => {
    if(item.name == addressName.data[1]) {
      c_id = item.id
    }
  })
  if (c_id == undefined) {
    wx.showToast({
      title: '网络不稳，请稍后重试',
      icon: 'none'
    });
    return ;
  };
  addressName.data.splice(0,2);
  const shortAddress = addressName.data.join('.')
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
    isDefault: 'true', //  是否为默认地址
    provinceId: p_id,
    cityId: c_id,
    // extJsonStr: JSON.stringify({ myAddressId: this.data.add_id.id}),  //  附加信息
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
      user_unionid: a.data.unionid
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
