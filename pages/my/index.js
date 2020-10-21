const app = getApp()
const CONFIG = require('../../config.js')
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')
const Add = require('../../utils/myApi')

Page({
	data: {
    wxlogin: true,

    balance:0.00,
    freeze:0,
    score:0,
    growth:0,
    score_sign_continuous:0,
    rechargeOpen: false // 是否开启充值[预存]功能
  },
	onLoad(options) {
    // scene 需要使用 decodeURIComponent 才能获取到生成二维码时传入的 scene
    //  扫推荐码进来
    const scene = decodeURIComponent(options.scene);
    if(scene != 'undefined') {
      wx.setStorageSync('tuijian', scene);
    }

    // AUTH.asyncScode('13865077006', 0);
    WXAPI.province().then((res) => {
      // console.log(res)
      this.setData({
        provinces: res.data
      })
    })
	},	
  onShow() {
    const _this = this
    //  版本信息
    // const order_hx_uids = wx.getStorageSync('order_hx_uids')
    // this.setData({
    //   version: CONFIG.version,
    //   order_hx_uids
    // })
    AUTH.checkHasLogined().then(isLogined => {
      this.setData({
        wxlogin: isLogined
      })
      if (isLogined) {        
        _this.getUserApiInfo();
        _this.getUserAmount();
      } else {
        // console.log('没登陆有');
      }
    })
    // 获取购物车数据，显示TabBarBadge
    TOOLS.showTabBarBadge();
  },
  // aboutUs : function () {
  //   wx.showModal({
  //     title: '关于我们',
  //     content: '本系统基于开源小程序商城系统 https://github.com/EastWorld/wechat-app-mall 搭建，祝大家使用愉快！',
  //     showCancel:false
  //   })
  // },
  loginOut(){
    AUTH.loginOut()
    wx.reLaunch({
      url: '/pages/my/index'
    })
  },
  async registerCustomer(data) {
    // console.log(data)
    const CustomerAddress = await Add.getCustomers({phonenumber: data.mobile});
    // console.log(CustomerAddress);
    if(CustomerAddress.data.length == 0) {  //  在平台没数据, 不与平台关联
      // console.log('在平台没数据, 不与平台关联');
      return;
    }
    //  绑定手机时调用
    const myuser_id = wx.getStorageSync('tuijian');
    let isOk = true;
    const customerUnionid = await WXAPI.userWxinfo(wx.getStorageSync('token'))
    // const CustomerAddress = await Add.getCustomers({phonenumber: data.mobile});
    // console.log(CustomerAddress);
    // console.log(customerUnionid);
    // console.log(this.data.apiUserInfoMap)
    const messages = {
      nickname: data.nick,
      phonenumber: data.mobile,
      unionid: customerUnionid.data.unionid,
      avatarurl: this.data.apiUserInfoMap.base.avatarUrl
    }
    if(myuser_id) {
      messages.user_id = myuser_id;
    }
    if(CustomerAddress.data.length != 0) {//  用户存在
      if(CustomerAddress.data[0].cardno) {  //  用户有生态卡号
        this.syncCardno(CustomerAddress.data[0].cardno);
      }
      messages.type_value = CustomerAddress.data[0].type_value ? CustomerAddress.data[0].type_value : 102004
      messages.address_id = CustomerAddress.data[0].address_id;
      isOk = await this.syncAddress(CustomerAddress.data[0], data.nick, data.mobile);
      if(!isOk) { //  有地址 - 同步地址信息成功
        const score = CustomerAddress.data[0].score
        if(score != 0) {  //  有积分进行同步
          await AUTH.asyncScode(data.mobile, score, '注册同步积分');
          //  清除系统内客户积分
          this.delCustomerScore(CustomerAddress.data[0]);
          this.getUserAmount();
        }
      }
    }
    if(true) {  //  创建-更新 用户
      Add.getUserMessage(messages).then((res) => {
        if(isOk) {
          wx.showModal({
            title: '温馨提示',
            content: '是否去绑定地址，完善信息',
            success (res) {
              if (res.confirm) {
                wx.navigateTo({
                  url: "/pages/select-address/index"
                })
              } else if (res.cancel) {
                // console.log('用户点击取消')
              }
            }
          })
        }
      });
    }
  },
  syncCardno(id) {  //  同步卡号到商城
    // console.log('同步卡号');
    // console.log(this.data.apiUserInfoMap);
    const messages = {
      avatarUrl: this.data.apiUserInfoMap.base.avatarUrl,
      city: this.data.apiUserInfoMap.base.city,
      nick: this.data.apiUserInfoMap.base.nick,
      province: this.data.apiUserInfoMap.base.province,
      extJsonStr: JSON.stringify({ cardno: id}),  //  附加信息
      token: wx.getStorageSync('token')
    };
    WXAPI.modifyUserInfo(messages).then(res => {
      // console.log(res);
      this.setData({
        userCardno: id
      })
    });
  },
  delCustomerScore(data) {
    // console.log('删除系统积分：');
    // console.log(data);
    Add.getUserMessage({
      phonenumber: data.phonenumber,
      score: 0
    }).then(res => {
      // console.log(res)
    });
  },
  async syncAddress(data, nick, mobile) {
    //  地址同步到商城
    await this.delAllAddress();
    // console.log(data);
    if(data.address_id == null) { //  用户没绑定地址
      // console.log('用户没绑定地址');
      return true;
    }
    
    const addressCode = await Add.getPostcode();
    const addressName = await Add.queryScode(data.address_id);
    // console.log(addressName);
    const shortAddress = addressName.data[0].fullname.replace(addressCode.data.cityname,"")
    // const addressName = await Add.getAddressName(data.address_id);
    // console.log(a);
    // let p_id;
    // let c_id;
    if(addressName.data == undefined || addressName.data.length == 0) { 
      //  地址名称分解接口有问题,需要绑定提示
      return true; 
    }
    // await this.data.provinces.map((item) => {
    //   if(item.name == addressName.data[0]) {
    //     p_id = item.id
    //   }
    // })
    // const cities = await WXAPI.nextRegion(p_id);
    // await cities.data.map((item) => {
    //   if(item.name == addressName.data[1]) {
    //     c_id = item.id
    //   }
    // })
    // addressName.data.splice(0,2);
    // const shortAddress = addressName.data.join('.')
    const postData = {
      token: wx.getStorageSync('token'),
      linkMan: nick,
      address: shortAddress,
      mobile: mobile,
      isDefault: 'true', //  是否为默认地址
      provinceId: addressCode.data.provincecode,
      cityId: addressCode.data.citycode,
      // extJsonStr: JSON.stringify({ myAddressId: data.id}),  //  附加信息
    }
    // console.log(postData);
    await WXAPI.addAddress(postData)
    return false;
  },
  async delAllAddress() {
    //  删除商城全部地址
    WXAPI.queryAddress(wx.getStorageSync('token')).then(function(res) {
      if (res.code == 0) {
        res.data.map((item) => {
          // console.log(item.id);
          WXAPI.deleteAddress(wx.getStorageSync('token'), item.id);
        });
      }
    })
  },
  getPhoneNumber: function(e) {
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showModal({
        title: '提示',
        content: e.detail.errMsg,
        showCancel: false
      })
      return;
    }
    WXAPI.bindMobileWxa(wx.getStorageSync('token'), e.detail.encryptedData, e.detail.iv).then(res => {
      if (res.code === 10002) {
        this.setData({
          wxlogin: false
        })
        return
      }
      if (res.code == 0) {
        wx.showToast({
          title: '绑定成功',
          icon: 'success',
          duration: 2000
        })
        this.getUserApiInfo('true').then((res) => {
          this.registerCustomer(res.base);
          wx.setStorageSync('mobile', res.base.mobile)
        });
      } else {
        wx.showModal({
          title: '提示',
          content: res.msg,
          showCancel: false
        })
      }
    })
  },
  getUserApiInfo: function (isReturn) {
    var that = this;
    return WXAPI.userDetail(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        let _data = {}
        _data.apiUserInfoMap = res.data
        if (res.data.base.mobile) {
          _data.userMobile = res.data.base.mobile
        }
        if (res.data.ext != undefined && res.data.ext.cardno != undefined) {  //  生态卡号
          _data.userCardno = res.data.ext.cardno
        }
        if (that.data.order_hx_uids && that.data.order_hx_uids.indexOf(res.data.base.id) != -1) {
          _data.canHX = true // 具有扫码核销的权限
        }
        that.setData(_data);
        if(isReturn) {
          return res.data;
        }
      }
    })
  },
  getUserAmount: function () {
    var that = this;
    WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        that.setData({
          balance: res.data.balance.toFixed(2),
          freeze: res.data.freeze.toFixed(2),
          score: res.data.score,
          growth: res.data.growth
        });
      }
    })
  },
  goAsset: function () {
    wx.navigateTo({
      url: "/pages/asset/index"
    })
  },
  goScore: function () {
    wx.navigateTo({
      url: "/pages/score/index"
    })
  },
  goOrder: function (e) {
    wx.navigateTo({
      url: "/pages/order-list/index?type=" + e.currentTarget.dataset.type
    })
  },
  cancelLogin() {
    this.setData({
      wxlogin: true
    })
  },
  goLogin() {
    this.setData({
      wxlogin: false
    })
  },
  processLogin(e) {
    //  确认信息
    // console.log(e);
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '已取消',
        icon: 'none',
      })
      return;
    }
    // console.log('去注册');
    AUTH.register(this);
  },
  scanOrderCode(){
    wx.scanCode({
      onlyFromCamera: true,
      success(res) {
        wx.navigateTo({
          url: '/pages/order-details/scan-result?hxNumber=' + res.result,
        })
      },
      fail(err) {
        console.error(err)
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
      }
    })
  },
  clearStorage(){
    wx.clearStorageSync()
    wx.showToast({
      title: '已清除',
      icon: 'success'
    })
  },
})