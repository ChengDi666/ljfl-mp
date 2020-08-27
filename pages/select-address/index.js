const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const Add = require('../../utils/myApi')

const app = getApp()
Page({
  data: {
    addressList: []
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
    const openidMessage =  await WXAPI.userWxinfo(wx.getStorageSync('token'))
    const user = await Add.queryUserOpenid(openidMessage.data.openid)
    this.setData({
      customers: user.customer
    })
  },
  onShow: function() {
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

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除该收货地址吗？',
      success: async (res) => {
        if (res.confirm) {
          //  获取详细地址信息
          const AddressMessage = await WXAPI.addressDetail(wx.getStorageSync('token'), id)
          this.setCustomers(AddressMessage.data.extJson.myAddressId);
          WXAPI.deleteAddress(wx.getStorageSync('token'), id).then(function () {
            wx.navigateBack({})
          });
        } else {
          // console.log('用户点击取消')
        }
      }
    })
  },


  setCustomers(id) {
    //  删除后更新地址
    const arr = this.data.customers.addresses.data.map((item) => {
      if (id != item.id) { return item; }
    }).filter(item => item);
    Add.amendCustomersAddress({
      address: { data: arr },
      id: this.data.customers.id
    });
  }

})