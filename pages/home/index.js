const wxpay = require('../../utils/pay.js')
const app = getApp()
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const Add = require('../../utils/myApi')

Page({
  data: {
    users: [],                     //  关注用户列表
    phonenumber: '',               //  查询号码
    listArr: [],                   //  用户查询结果
    selectUser: {},                //  选择操作的用户
    showPopUp: false,              //  对话框开关
    scores: '',                    //  转让积分数
    showDialog: false,             //  操作列表开关
    isok: false
  },

  closePopUp() {  //  关闭弹框
    this.setData({
      showPopUp: false,
    });
  },

  close: function() { // 关闭操作列表
    this.setData({
        showDialog: false
    });
  },


  shezhi(){
    wx.showActionSheet({
      itemList: ['同步当前地址下的用户'],
      success: (res) => {
        // console.log(res.tapIndex)
        if(res.tapIndex == 0) {
          this.myHome();
        }
      },
      fail (res) {
        // console.log(res.errMsg)
      }
    })
  },

  myHome() {
    wx.showLoading({
      title: '正在同步中',
    })
    // console.log(this.data.address_id);
    if(this.data.address_id) {
      Add.getCustomers({addressid: this.data.address_id}).then((res) => {
        // console.log(res)
        if(res.data.length != 0) {
          console.log('有值')

          // return ;
          res.data.forEach(async element => {
            const items = await this.getUserMessage(element.phonenumber);
            // console.log(items);
            // items.nicks = items.nick
            // items.avatarUrls = items.avatarUrl
            
            this.getusers(items.data.uid);
            // console.log(items);
            // const user = this.data.users;
            // user.push(items);
            // this.setData({
            //   users: user
            // });
          });          
          wx.hideLoading();
          return ;
        }
        wx.hideLoading();
  
        // console.log(asd);
        // console.log(this.data.users);
      });
    } else {
      wx.hideLoading();
      wx.showToast({
        title: '请稍后重试',
        icon: 'none'
      })
    }
  },

  bindinputScore(e) {
    this.setData({
      scores: e.detail.value
    });
  },

  userActions(e) {
    // console.log(e);
    // console.log(e.currentTarget.dataset.item);
    this.data.selectUser = e.currentTarget.dataset.item;
    // wx.showActionSheet({
    //   itemList: ['积分转让', '取消关注'],
    //   success: (res) => {
    //     console.log(res.tapIndex)
    //     if(res.tapIndex == 0) {
    //       // this.myHome();
    //     }
    //   },
    //   fail (res) {
    //     // console.log(res.errMsg)
    //   }
    // })
    //  唤起操作列表
    this.setData({
      showDialog: true
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
    // console.log(this.data.selectUser);
    this.setData({
      showPopUp: true
    });
    WXAPI.userAmount(wx.getStorageSync('token')).then((res) => {
      //  获取我的积分
      // console.log(res);
      if (res.code == 0) {
        // console.log(res.data.score);
        this.setData({
          myScore: res.data.score
        })
      }
    })
  },
  scoreTo() {
    //  积分转让
    this.setData({
      isok: true
    })
    wx.showLoading({
      title: '积分转让中',
    })
      // console.log('积分转让');
      console.log("我的积分： ", this.data.myScore);
      console.log("转让积分： ", this.data.scores);
      if((this.data.scores - 0) > this.data.myScore) {
        wx.hideLoading();
        wx.showToast({
          title: '超过您的积分',
          icon: 'none'
        })
      } else {
        Add.scoresTo(wx.getStorageSync('uid'), this.data.selectUser.uid, this.data.scores).then((res) => {
          wx.hideLoading();
          // console.log(res);
          if(res.statusCode == 200) {
            this.setData({
              showPopUp: false
            });
            wx.showToast({
              title: '积分转让成功'
            })
          } else {
            wx.showToast({
              title: '积分转让失败，请稍后重试',
              icon: 'none'
            })
          }
          setTimeout(() => {
            this.setData({
              isok: false,
              scores: ''
            })
          }, 1000);
        });
        wx.hideLoading();
      }
      return ;
  
  },

  removeUser() {
    //  取关某人
      console.log('取关某人');
      // console.log(this.data.selectUser);
    WXAPI.removeAttention(wx.getStorageSync('token'), this.data.selectUser.uid).then((res) => {
      // console.log(res);
      if(res.code == 0) {        
        //  刷新关注列表
        wx.showToast({
          title: '取关成功',
        })
        setTimeout(() => {
          this.userList();          
        }, 1000);
      }
    });
  },

  addusers(e) {
    //  点击添加关注
    // console.log(e.target.dataset.id);
    const id = e.target.dataset.id;
    if(id) {
      this.getusers(id);
    }
  },
  bindinput(e) {
    // console.log(e.detail.value)
    if(e.detail.value == '') {
      this.setData({
        listArr: []
      })
    }
    this.setData({
      phonenumber: e.detail.value
    });
  },
  async goSearch() {  //  通过手机号查询
    wx.showLoading({
      title: '正在搜索'
    });
    // console.log(this.data.phonenumber);
    if(this.data.phonenumber != '' && this.data.phonenumber.length == 11) {
      console.log('符合规范： ',this.data.phonenumber);
      const searchUser = await this.getUserMessage(this.data.phonenumber);
      // console.log(searchUser)
      if(searchUser.data == undefined) { //  没有用户
        wx.hideLoading();
        wx.showToast({
          title: '查无此用户',
          icon: 'none'
        })
        return ;
      }
      this.setData({
        listArr: [searchUser.data]
      })
      wx.hideLoading();
    } else {
      wx.hideLoading();
      wx.showToast({
        title: '您的输入不符合要求',
        icon: 'none'
      })
    }
  },
  getUserMessage(phonenumber){
    return Add.getUserId(phonenumber).then((res) => {
      // console.log(res);
      if(res.statusCode != 200) {
        return ;
      }
      return res;
    }).catch(err => {
      console.log(err);
      wx.showToast({
        title: '获取用户失败',
        icon: 'none'
      })
    });
  },
  getusers(id) {  //  关注某人
    // console.log(id);
    WXAPI.addAttention(wx.getStorageSync('token'), id).then((res) => {
      // console.log(res);
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
    wx.showLoading();
    WXAPI.AttentionList({ token: wx.getStorageSync('token') }).then((res) => {
      // console.log(res);
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
      wx.hideLoading();
    });
    wx.hideLoading();
  },


  onLoad: async function(options) {
    // console.log(options)
    const custorme = await AUTH.customerCheck();
    if(custorme && options.phone) { //  是客户，显示同步
      Add.getCustomers({phonenumber: options.phone}).then(res => {
        // console.log(res);
        if(res.data.length != 0) {
          this.setData({
            address_id: res.data[0].address_id
          })
          return ;
        }
      });
    }
  },
  onReady: function() {
    // 生命周期函数--监听页面初次渲染完成
  },

  onShow: function() {
    AUTH.checkHasLogined().then(async isLogined => {
      // console.log(isLogined);
      if (isLogined) {
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
        } else {
          // console.log('绑定了手机');
          //  登录且绑定手机号
          this.userList();
        }
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