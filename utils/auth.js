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

async function checkBindingAddress(users) { // 检查是否绑定平台
  const checkTokenRes = await WXAPI.checkToken(wx.getStorageSync('token'))
  // console.log(checkTokenRes)
  if(checkTokenRes.code != 0 || checkTokenRes.msg != 'success') { // token 失效
    return {code: 100, msg: 'token 失效'}
  }
  const userInfo = await WXAPI.userDetail(wx.getStorageSync('token')) // 商城用户信息
  // console.log(userInfo)
  if( userInfo.code != 0 ) return { code: 100, msg: '没有用户信息' } // 没有用户信息
  const phone = userInfo.data.base.mobile ? userInfo.data.base.mobile :wx.getStorageSync('mobile')
  // console.log(phone)
  if(!phone || phone == '') return {code: 100, msg: '尚未绑定手机号'}
  const queryAddress = await WXAPI.queryAddress(wx.getStorageSync('token')) // 商城用户地址列表
  // console.log(queryAddress.data)
  if(queryAddress.data && queryAddress.data.length) { return { code: 200, msg: 'ok' } } // 商城有绑定地址
  // const userInfo = await WXAPI.userDetail(wx.getStorageSync('token')) // 商城用户信息
  return myApi.getCustomers({phonenumber: phone}).then(async res => {
    console.log(res.data)
    // return { code: 200, msg: 'ok' }
    const data = res.data[0]
    if(data && data.address_id) { // 用户存在且有地址
      const address = await asyncAddresses(data, data.nickname, data.phonenumber);  // 同步地址
      const scode = await asyncScode(data.phonenumber, data.score, '注册同步积分');  // 同步积分
      const cardno = await syncCardno(userInfo.data, data.cardno)   // 同步卡号
      let str = '', err = ''
      address ? str += '地址' : err += '地址'
      cardno ? str += '，卡号' : err += '，卡号'
      scode ? str += '，积分' : err += '，积分'
      // console.log(msg)
      str == '' ? str = '' : str += ' 同步成功'
      err == '' ? err = '' : err += ' 同步失败'
      return {code: 200, msg: str + err }
    } else {
      return {code: 0, msg: '系统用户未注册'}
    }
  })
}

async function syncCardno(data, cardno) {  //  同步卡号到商城 (商城用户信息， 平台卡号)
  const messages = {
    avatarUrl: data.base.avatarUrl,
    city: data.base.city,
    nick: data.base.nick,
    province: data.base.province,
    extJsonStr: JSON.stringify({ cardno }),  //  附加信息
    token: wx.getStorageSync('token')
  };
  // console.log(messages)
  const cardnoData = await WXAPI.modifyUserInfo(messages)
  if(cardnoData.msg == "success") return true;
  return false
}

async function asyncAddresses(data, nick, mobile) { // 同步地址
   await delAllAddress(); // 清空用户地址
   // console.log(data);
   if(data.address_id == null) { //  用户没绑定地址
     // console.log('用户没绑定地址');
     return true;
   }
   const addressCode = await myApi.getPostcode(); // 地址编码
   const addressName = await myApi.queryScode(data.address_id); // 平台绑定地址
   const shortAddress = addressName.data[0].fullname.replace(addressCode.data.cityname,"")
   if(addressName.data == undefined || addressName.data.length == 0) { //  地址名称分解接口有问题,需要绑定提示
     return false; 
   }
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
   const address = await WXAPI.addAddress(postData) // 添加地址返回
   if(address.code == 0 && address.msg == 'success') return true;
   return false;
}

async function delAllAddress() {
  //  删除商城全部地址
  WXAPI.queryAddress(wx.getStorageSync('token')).then(function(res) {
    if (res.code == 0) {
      res.data.map((item) => {
        // console.log(item.id);
        WXAPI.deleteAddress(wx.getStorageSync('token'), item.id);
      });
    }
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
        wx.setStorageSync('mobile', res.data.mobile)
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
            referrer: referrer,
            // postJsonString
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
    //  合肥
  var urls = 'https://user.api.it120.cc';
  const datas = {
      merchantNo: '2006131424420936',
      merchantKey: '5f036a02f929bfac3fd5a2af0ed4a306',
    };
  
  const adminToken = await myApi.getFormData(`${urls}/login/key`, datas);   //  登录
  // console.log(adminToken);
  const isOK = await delScore(mobile, adminToken);  //  清空积分
  if(!isOK) { return false; } //  清除积分失败
  // if(!score) { return true } // 已清空积分，且传入积分为0
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
    // console.log(resdata);
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
          // console.log(res);
          resolve(res);
      },
      fail: function (err) {
          // console.log(err);
          // return false;
          reject(err);
      }
    });
    });
}


function customerCheck() {  //  检查用户是否存在
  return myApi.getCustomers({phonenumber: wx.getStorageSync('mobile')}).then(res => {
    // console.log(res);
    if(res.data.length != 0) {
      return true;
    }
    return false;
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
  asyncScode,
  customerCheck,
  checkBindingAddress
}