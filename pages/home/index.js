const wxpay = require('../../utils/pay.js')
const app = getApp()
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const Add = require('../../utils/myApi')

Page({
  data: {
    users: [],    //  关注用户列表
    phonenumber: '',
    listArr: [],
    selectUser: {},
    iosDialog1: false,
    scores: '',
    
    showIOSDialog: false,
  },

  close: function() {
    console.log(this.data.scores);
    this.setData({
        showIOSDialog: false,
        // iosDialog1: false,
    });
  },

  bindinputScore(e) {
    this.setData({
      scores: e.detail.value
    });
  },

  bingLongTaps(e) {
    console.log(e);
    console.log(e.currentTarget.dataset.item);
    this.data.selectUser = e.currentTarget.dataset.item;
    //  唤起操作列表
    this.setData({
      showIOSDialog: true
    });
  },

getsss() {
  WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
    if (res.code == 0) {
      that.setData({
        score: res.data.score
      });
    }
  })
},
  goScore() {
    console.log('积分转让');
    console.log(this.data.selectUser);
    this.setData({
      iosDialog1: true
    });
    WXAPI.userAmount(wx.getStorageSync('token')).then((res) => {
      console.log(res);
      if (res.code == 0) {
        console.log(res.data.score);
        this.setData({
          myScore: res.data.score
        })
      }
    })
  },
  scoreTo() {
    //  积分转让
      console.log('积分转让');
      console.log(this.data.scores - 0);
      console.log(this.data.myScore);
      // console.log(this.data.selectUser);
      // this.setData({
      //   iosDialog1: true
      // })
      if((this.data.scores - 0) > this.data.myScore) {
        wx.showToast({
          title: '超过您的积分',
          icon: 'none'
        })
      } else {
        this.setData({
          iosDialog1: false
        });
        wx.showToast({
          title: '积分转让成功'
        })
      }
      return ;
    Add.scoresTo().then((res) => {
      console.log(res);
    });
  },

  removeUser() {
    //  取关某人
      console.log('取关某人');
      console.log(this.data.selectUser);
    WXAPI.removeAttention(wx.getStorageSync('token'), this.data.selectUser.uid).then((res) => {
      console.log(res);
      if(res.code == 0) {        
        //  刷新关注列表
        this.userList();
      }
    });
  },

  addusers(e) {
    //  点击添加关注
    console.log(e);
    console.log(e.target.dataset.id);
    const id = e.target.dataset.id;
    if(id) {
      this.getusers(id);
    }
  },
  bindinput(e) {
    // console.log(e.detail.value)
    this.setData({
      phonenumber: e.detail.value
    });
  },
  goSearch() {  //  通过手机号查询
    console.log(this.data.phonenumber);
    if(this.data.phonenumber != '' && this.data.phonenumber.length == 11) {
      console.log('符合规范： ',this.data.phonenumber);
      Add.getUserId(this.data.phonenumber).then((res) => {
        console.log(res);
        const arr = [res];
        this.setData({
          listArr: arr
        })
      })
    } else {
      wx.showToast({
        title: '您的输入不符合要求',
        icon: 'none'
      })
    }
  },
  getusers(id) {  //  关注某人
    console.log(id);
    WXAPI.addAttention(wx.getStorageSync('token'), id).then((res) => {
      console.log(res);
      if(res.code == 0) {
        this.setData({
          listArr: [],
          phonenumber: ''
        })
        //  刷新关注列表
        this.userList();
      }
    });
  },
  userList() {  //  获取关注列表
    WXAPI.AttentionList({ token: wx.getStorageSync('token') }).then((res) => {
      console.log(res);
      let users;
      if(res.code == 0) {
        users = res.data.result;
      } else {
        wx.showToast({
          title: res.msg,
          icon: 'none'
        })
        users = []; 
      }
      this.setData({
        users: users
      })
    });
  },


  onLoad: function(options) {
    this.userList();
    if (options && options.type) {
      if (options.type == 99) {
        this.setData({
          hasRefund: true
        });
      } else {
        this.setData({
          hasRefund: false,
          status: options.type
        });
      }      
    }
  },
  onReady: function() {
    // 生命周期函数--监听页面初次渲染完成

  },

  onShow: function() {
    // AUTH.checkHasLogined().then(isLogined => {
    //   if (isLogined) {
    //     // this.doneShow();
    //   } else {
    //     wx.showModal({
    //       title: '提示',
    //       content: '本次操作需要您的登录授权',
    //       cancelText: '暂不登录',
    //       confirmText: '前往登录',
    //       success(res) {
    //         if (res.confirm) {
    //           wx.switchTab({
    //             url: "/pages/my/index"
    //           })
    //         } else {
    //           wx.navigateBack()
    //         }
    //       }
    //     })
    //   }
    // })
  },

  onHide: function() {
    // 生命周期函数--监听页面隐藏

  },
  onUnload: function() {
    // 生命周期函数--监听页面卸载

  },
  onPullDownRefresh: function() {
    // 页面相关事件处理函数--监听用户下拉动作

  },
  onReachBottom: function() {
    // 页面上拉触底事件的处理函数

  },

})