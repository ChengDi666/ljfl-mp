const WXAPI = require('apifm-wxapi')
const myApi = require('./myApi');

async function checkSession(){
  return new Promise((resolve, reject) => {
    wx.checkSession({
      success() {
        return resolve(true)
      },
      fail() {
        return resolve(false)
      }
    })
  })
}

// 检测登录状态，返回 true / false
async function checkHasLogined() {
  const token = wx.getStorageSync('token')
  if (!token) {
    return false
  }
  const loggined = await checkSession()
  if (!loggined) {
    wx.removeStorageSync('token')
    return false
  }
  const checkTokenRes = await WXAPI.checkToken(token)
  if (checkTokenRes.code != 0) {
    wx.removeStorageSync('token')
    return false
  }
  return true
}

async function wxaCode(){
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        return resolve(res.code)
      },
      fail() {
        wx.showToast({
          title: '获取code失败',
          icon: 'none'
        })
        return resolve('获取code失败')
      }
    })
  })
}

async function getUserInfo() {
  return new Promise((resolve, reject) => {
    wx.getUserInfo({
      success: res => {
        return resolve(res)
      },
      fail: err => {
        console.error(err)
        return resolve()
      }
    })
  })
}

async function login(page){
  const _this = this
  wx.login({
    success: function (res) {
      WXAPI.login_wx(res.code).then( (res) => {
        // console.log(res)
        if (res.code == 10000) {
          // 去注册
          //_this.register(page)
          return;
        }
        if (res.code != 0) {
          // 登录错误
          wx.showModal({
            title: '无法登录',
            content: res.msg,
            showCancel: false
          })
          return;
        }
        wx.setStorageSync('token', res.data.token)
        wx.setStorageSync('uid', res.data.uid)
        if ( page ) {
          page.onShow()
        }
      })
    }
  })
}

async function register(page) {
  let _this = this;
  wx.login({
    success: function (res) {
      let code = res.code; // 微信登录接口返回的 code 参数，下面注册接口需要用到
      wx.getUserInfo({
        success: function (res) {
          let iv = res.iv;
          let encryptedData = res.encryptedData;
          let referrer = '' // 推荐人
          let referrer_storge = wx.getStorageSync('referrer');
          if (referrer_storge) {
            referrer = referrer_storge;
          }
          // 下面开始调用注册接口
          WXAPI.register_complex({
            code: code,
            encryptedData: encryptedData,
            iv: iv,
            referrer: referrer
          }).then(function (res) {
            _this.login(page);
          })
        }
      })
    }
  })
}

function loginOut(){
  wx.removeStorageSync('token')
  wx.removeStorageSync('uid')
}

async function checkAndAuthorize (scope) {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        if (!res.authSetting[scope]) {
          wx.authorize({
            scope: scope,
            success() {
              resolve() // 无返回参数
            },
            fail(e){
              console.error(e)
              // if (e.errMsg.indexof('auth deny') != -1) {
              //   wx.showToast({
              //     title: e.errMsg,
              //     icon: 'none'
              //   })
              // }
              wx.showModal({
                title: '无权操作',
                content: '需要获得您的授权',
                showCancel: false,
                confirmText: '立即授权',
                confirmColor: '#e64340',
                success(res) {
                  wx.openSetting();
                },
                fail(e){
                  console.error(e)
                  reject(e)
                },
              })
            }
          })
        } else {
          resolve() // 无返回参数
        }
      },
      fail(e){
        console.error(e)
        reject(e)
      }
    })
  })  
}

 async function asyncScode(mobile, score, text) { //  同步积分
    //  绿分
  var urls = 'https://user.api.it120.cc';
  const datas = {
      merchantNo: '2005060925355435',
      merchantKey: '00dfbdb296ec754d2899102eac0434a6',
    };
  
  const adminToken = await myApi.getFormData(`${urls}/login/key`, datas);
  console.log(adminToken);
  const isOK = await delScore(mobile, adminToken);  //  清空积分
  if(!isOK) { //  清除积分失败
    return false;
  }
  const messages = {
    score: score,
    mobile: mobile,
    remark: text
  };
  const resdata = await UserScoreLog(messages, adminToken);
    if(resdata.statusCode != 200) {  //  请求错误
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      return false;
    }
    if(resdata.data.code != 0) { //  数据错误
      wx.showToast({
        title: `积分同步出现异常，请联系工作人员 —— ${resdata.data.msg}`,
        icon: 'none',
        mask: true,
        duration: 3000
      })
      return false;
    }
    return true;
}


async function delScore(mobile, adminToken) {
  const userAmount = await WXAPI.userAmount(wx.getStorageSync('token'));
  if (userAmount.data.score != 0) {
    const num = 0 - userAmount.data.score
    const resdata = await UserScoreLog({
      score: num,
      mobile: mobile,
      remark: '清空积分'
    }, adminToken);
    console.log(resdata);
    if(resdata.statusCode != 200) {  //  请求错误
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
      return false;
    }
    if(resdata.data.code != 0) { //  数据错误
      wx.showToast({
        title: `积分同步出现异常，请联系工作人员 —— ${resdata.data.msg}`,
        icon: 'none',
        mask: true,
        duration: 3000
      })
      return false;
    }
  }
  return true;
}


function UserScoreLog(messages, adminToken) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://user.api.it120.cc/user/apiExtUserScoreLog/save`,
      method: 'POST',
      header: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-Token': adminToken.data.data
      },
      data: messages,
      success: function (res) {
          console.log(res);
          resolve(res);
      },
      fail: function (err) {
          console.log(err);
          // return false;
          reject(err);
      }
    });
    });
}

module.exports = {
  checkHasLogined: checkHasLogined,
  wxaCode: wxaCode,
  getUserInfo: getUserInfo,
  login: login,
  register: register,
  loginOut: loginOut,
  checkAndAuthorize: checkAndAuthorize,
  asyncScode
}