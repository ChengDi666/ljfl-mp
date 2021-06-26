const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const Add = require('../../utils/myApi')

const app = getApp()
Page({
  data: {
    addressList: [],
    isCustorme: false
  },

  selectTap: function(e) {
    wx.navigateTo({
      url: "/pages/address-add/index"
    })
    // var id = e.currentTarget.dataset.id;
    // WXAPI.updateAddress({
    //   token: wx.getStorageSync('token'),
    //   id: id,
    //   isDefault: 'true'
    // }).then(function(res) {
    //   wx.navigateBack({})
    // })
  },

  addAddess: function() {
    // console.log(this.data.addressList)
    if(this.data.addressList == null || this.data.addressList.length == 0) {
      wx.navigateTo({
        url: "/pages/address-add/index"
      })
    }
  },

  editAddess: function(e) {
    // console.log(e)
    wx.navigateTo({
      url: "/pages/address-add/index?id=" + e.currentTarget.dataset.id
    })
  },

  onLoad: async function() {
    // const openidMessage =  await WXAPI.userWxinfo(wx.getStorageSync('token'))
    // console.log(openidMessage);
    // const user = await Add.queryUserOpenid(openidMessage.data.openid)
    // this.setData({
    //   customers: user.customer
    // })
  },
  onShow: async function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.initShippingAddress();
      } else {
        wx.showModal({
          title: '提示',
          content: '本次操作需要您的登录授权',
          cancelText: '暂不登录',
          confirmText: '前往登录',
          success(res) {
            if (res.confirm) {
              wx.switchTab({
                url: "/pages/my/index"
              })
            } else {
              wx.navigateBack()
            }
          }
        })
      }
    })
  },
  initShippingAddress: function () {
    var that = this;
    WXAPI.queryAddress(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        that.setData({
          addressList: res.data
        });
      } else if (res.code == 700) {
        that.setData({
          addressList: null
        });
      }
    })
  },


})