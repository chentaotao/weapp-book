import wepy from 'wepy'

const reg = /^9787[0-9]{9}$/g

function scanCode () {
  return new Promise((resolve, reject) => {
    wepy.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode'],
      success (res) {
        resolve(res)
      },
      fail (error) {
        reject(error)
      }
    })
  })
}

function showError(msg) {
  wepy.showModal({
    content: msg,
    showCancel: false
  })
}

function scanCodeToShowBookInfo (navType) {
  scanCode().then(res => {
    if (res) {
      const bookCode = reg.test(res.result)
      if (bookCode) {
        wepy[navType]({
          url: `./bookInfo?bookId=${res.result}&readOnly=false`
        })
      } else {
        showError('没有扫到书籍条形码')
      }
    }
  }, () => {
    wepy.redirectTo({
      url: './index'
    })
  })
}

function scanCodeToReturnBook (navType) {
  scanCode().then(res => {
    if (res) {
      const bookCode = reg.test(res.result)
      if (bookCode) {
        // TODO: 这里之前需要做书验证,是否在库里被借阅等等
        wepy.showModal({
          title: '还书提醒',
          content: `确定要还吗?`,
          confirmText: '还书',
          cancelText: '再想想',
          success(res) {
            if (res.confirm) {
              wepy[navType]({
                url: './turnback'
              })
            }
          }
        })
      } else {
        showError('没有扫到书籍条形码')
      }
    }
  })
}

export {
  scanCodeToShowBookInfo,
  scanCodeToReturnBook
}