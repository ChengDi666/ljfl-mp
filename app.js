const WXAPI = require('apifm-wxapi')
const CONFIG = require('config.js')
const AUTH = require('utils/auth')
App({
  onLaunch: function() {
    WXAPI.init(CONFIG.subDomain)
    const that = this;
    // 检测新版本
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    /**
     * 初次加载判断网络情况
     * 无网络状态下根据实际情况进行调整
     */
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType
        if (networkType === 'none') {
          that.globalData.isConnected = false
          wx.showToast({
            title: '当前无网络',
            icon: 'loading',
            duration: 2000
          })
        }
      }
    });
    /**
     * 监听网络状态变化
     * 可根据业务需求进行调整
     */
    wx.onNetworkStatusChange(function(res) {
      if (!res.isConnected) {
        that.globalData.isConnected = false
        wx.showToast({
          title: '网络已断开',
          icon: 'loading',
          duration: 2000,
          complete: function() {
            that.goStartIndexPage()
          }
        })
      } else {
        that.globalData.isConnected = true
        wx.hideToast()
      }
    });
    //  获取接口和后台权限
    WXAPI.vipLevel().then(res => {
      that.globalData.vipLevel = res.data
    })
    //  获取商城名称
    WXAPI.queryConfigBatch('mallName,recharge_amount_min,WITHDRAW_MIN,ALLOW_SELF_COLLECTION,order_hx_uids').then(function(res) {
      if (res.code == 0) {
        res.data.forEach(config => {
          wx.setStorageSync(config.key, config.value);
          if (config.key === 'recharge_amount_min') {
            that.globalData.recharge_amount_min = config.value;
          }
        })
        
      }
    })
    // 读取评价赠送多少积分
    WXAPI.scoreRules({
      code: 'goodReputation'
    }).then(function(res) {
      if (res.code == 0) {        
        that.globalData.order_reputation_score = res.data[0].score;
      }
    })
    // 拉取站点信息
    WXAPI.siteStatistics().then(res => {
      if (res.code == 0) {
        if (res.data.wxAppid) {
          wx.setStorageSync('wxAppid', res.data.wxAppid);
        }
      }
    })
  },
  goStartIndexPage: function() {
    setTimeout(function() {
      wx.redirectTo({
        url: "/pages/start/start"
      })
    }, 1000)
  },  
  onShow (e) {
    this.globalData.launchOption = e
    // 保存邀请人
    if (e && e.query && e.query.inviter_id) {
      wx.setStorageSync('referrer', e.query.inviter_id)
      if (e.shareTicket) {
        wx.getShareInfo({
          shareTicket: e.shareTicket,
          success: res => {
            // console.log(res)
            // console.log({
            //   referrer: e.query.inviter_id,
            //   encryptedData: res.encryptedData,
            //   iv: res.iv
            // })
            wx.login({
              success(loginRes) {
                if (loginRes.code) {
                  WXAPI.shareGroupGetScore(
                    loginRes.code,
                    e.query.inviter_id,
                    res.encryptedData,
                    res.iv
                  ).then(_res => {
                    // console.log(_res)
                  }).catch(err => {
                    console.error(err)
                  })
                } else {
                  console.error('登录失败！' + loginRes.errMsg)
                }
              }
            })
          }
        })
      }
    }
    // 自动登录
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        AUTH.login()
      }
    })
    WXAPI.queryConfigBatch('mallName,WITHDRAW_MIN,ALLOW_SELF_COLLECTION,order_hx_uids,subscribe_ids,share_profile').then(res => {
      if (res.code == 0) {
        res.data.forEach(config => {
          wx.setStorageSync(config.key, config.value);
        })
        if (this.configLoadOK) {
          this.configLoadOK()
        }
      }
    })
  },
    
  onShow (e) {
    this.globalData.launchOption = e
    // 保存邀请人
    if (e && e.query && e.query.inviter_id) {
      wx.setStorageSync('referrer', e.query.inviter_id)
      if (e.shareTicket) {
        wx.getShareInfo({
          shareTicket: e.shareTicket,
          success: res => {
            // console.log(res)
            console.log({
              referrer: e.query.inviter_id,
              encryptedData: res.encryptedData,
              iv: res.iv
            })
            wx.login({
              success(loginRes) {
                if (loginRes.code) {
                  WXAPI.shareGroupGetScore(
                    loginRes.code,
                    e.query.inviter_id,
                    res.encryptedData,
                    res.iv
                  ).then(_res => {
                    console.log(_res)
                  }).catch(err => {
                    console.error(err)
                  })
                } else {
                  console.error('登录失败！' + loginRes.errMsg)
                }
              }
            })
          }
        })
      }
    }
    if(wx.getStorageSync('token')) {  //  更新号码信息
      WXAPI.userDetail(wx.getStorageSync('token')).then(res => {
        if(res.code == 0) {
          wx.setStorageSync('mobile', res.data.base.mobile);
        }
      });
    }
    // 自动登录
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        AUTH.login()
      }
    })
    setTimeout(() => {
      AUTH.checkBindingAddress().then(res => { // 检查是否绑定平台
        console.log(res)
        if(res.code == 100) return // 未绑定手机
        if(res.code == 200 && res.msg == 'ok') return; // 已绑定
        if(res.code != 200) { // 错误提示
          setTimeout(() => {
            wx.showToast({
              title: '用户信息尚未同步，部分功能无法使用！',
              icon: 'none',
              duration: 2000
            })
          }, 2000);
          return;
        }
        // console.log('正确：', res.msg)
        // 绑定成功提示
        wx.showModal({
          title: '温馨提示',
          content: res.msg,
          showCancel: false
        })
      })
    }, 2000);
  },
  globalData: {                
    isConnected: true
  }
})