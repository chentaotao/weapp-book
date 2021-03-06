import wepy from 'wepy'
import { getUserToken } from './storage'
import userLoginFunc from './userLogin'

// const remoteServer = 'http://192.168.10.241:3000/mock/205'
// const remoteServer = 'http://192.168.10.166:9651'
// const remoteServer = 'https://39.107.77.177'
const remoteServer = 'https://daxian.work'

function handlerStatus (res) {
  if (res.statusCode === 200) {
    return res.data
  } else {
    wepy.showToast({
      title: '服务器响应失败!',
      icon: 'none',
      duration: 2000,
      success () {
        throw Error(res.data)
      }
    })
  }
}

function handlerResponse (res) {
  if (!res) return null
  if (res.head) {
    if (res.head.code === '200') {
      return res.data
    } else if (res.head.code === '401') {
      // wepy.showModal({
      //   content: '服务器验证失败,需要重新登录',
      //   showCancel: false,
      //   success () {
      //   }
      // })
      userLoginFunc()
    }
  } else if (!res.head && !res.data) {
    return res
  } else {
    wepy.showToast({
      title: res.head.msg,
      icon: 'none',
      duration: 2000
    })
  }
}

function request ({ url, method, data, header, absolute }) {
  return new Promise((resolve, reject) => {
    const userToken = getUserToken()
    const params = Object.create(null)
    params.url = absolute ? url : remoteServer + url
    params.header = header || {
      'Authorization': userToken || '',
      'Content-Type': 'application/json'
    }
    if (method !== undefined) params.method = method
    if (data !== undefined) params.data = data
    wepy.request({
      ...params,
      success (res) {
        resolve(handlerResponse(handlerStatus(res)))
      },
      fail (res) {
        reject(res)
      }
    })
  })
}

function get ({ url, data }) {
  return request({ url, method: 'GET', data: data })
}

function post ({url, data}) {
  return request({url, data, method: 'POST'})
}

export {
  get,
  post,
  request
}
