import wepy from 'wepy'
// api
import { getBookState, returnBook, bookDetail } from '@/api/book'
import { request } from '@/utils/http'

const reg = /^9787[0-9]{9,13}$/

/**
 * 扫码动作封装
 *
 * @returns
 */
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

/**
 * 从豆瓣获取书籍数据
 *
 * @param {any} isbn
 * @returns
 */
async function getBookInfoFromDouBan (isbn) {
  const result = await request({
    url: `/v2/book/isbn/${isbn}`,
    header: { 'Content-Type': 'json' }
  })
  // const result = await request({
  //   url: `https://daxian.work/v2/book/isbn/${isbn}`,
  //   header: { 'Content-Type': 'json' },
  //   absolute: true
  // })
  return result
}

/**
 * 统一错误处理弹出框
 *
 * @param {any} msg
 */
function showError(msg) {
  wepy.showModal({
    content: msg,
    showCancel: false
  })
}

// 书籍是否可以出借
// status     0:书籍未添加，1：书籍有库存，2：书籍无库存
// borrowType 0:用户未借过该书 ， 1：用户借过该书
async function bookCanbeBorrow (isbn) {
  // 获取当前书是否在公司书库内
  const result = await getBookState({bookIsbn: isbn})
  if (result && result.status) {
    const state = result.status
      // 库里没有该书
    if (state === '0') {
      showError('公司并没有该书可供借阅')
      return false
    } else if (state === '2') {
      showError('Ops!该书已经被借光了.')
      return false
    } else {
      return true
    }
  } else {
    showError('图书状态读取失败.')
    return false
  }
}

async function bookCanbeReturn (isbn) {
  // 获取当前书是否在公司书库内
  const result = await getBookState({bookIsbn: isbn})
  console.log(result)
  if (result) {
    const state = result.status
    const type = result.borrowType

    if (state === '0') {
      showError('公司并没有录入该书.')
      return false
    }
    if (type === '0') {
      showError('你好像还没借过这本书.')
      return false
    }
    return true
  }
}

// 借书
async function scanCodeToBorrowBook (navType) {
  try {
    const res = await scanCode()
    if (res) {
      const isbn = res.result
      const bookCode = reg.test(isbn)
      // ISBN码验证
      if (bookCode) {
        wepy.showLoading({title: '正在读取书籍内容...'})
        // 书籍是否可以出借
        const result = await bookCanbeBorrow(isbn)
        wepy.hideLoading()
        if (result) {
            // 公司有书且可以提供借阅,则跳转到详情页
          wepy[navType]({
            url: `./bookInfo?bookId=${isbn}&readOnly=false`
          })
        }
      } else {
        showError('没有扫到书籍条形码')
      }
    } else {
      wepy.redirectTo({
        url: './index'
      })
    }
  } catch (error) {}
}

// 还书
async function scanCodeToReturnBook (navType) {
  try {
    const code = await scanCode()
    if (code) {
      const isbn = code.result
      const bookCode = reg.test(isbn)
      const param = {bookIsbn: isbn}
      // 检查当前扫码的书是否是公司内的书
      if (bookCode) {
        // 获取当前书是否在公司书库内
        const result = await bookCanbeReturn(isbn)
        if (result) {
          // 获取图书信息
          const { title } = await bookDetail(param)
          wepy.showModal({
            title: '还书提醒',
            content: `确定要还<${title}>这本书吗?`,
            confirmText: '还书',
            cancelText: '再想想',
            success(res) {
              if (res.confirm) {
                returnBook(param).then(r => {
                  wepy[navType]({
                    url: `./turnback?bookId=${isbn}`
                  })
                }).catch(error => {
                  showError(error)
                })
              }
            }
          })
        }
      } else {
        showError('没有扫到书籍条形码')
      }
    }
  } catch (error) {}
}

// 获取书详情
function showBookInfo (isbn) {
  const bookCode = reg.test(isbn)
  if (bookCode) {
    wepy.navigateTo({
      url: `./bookInfo?bookId=${isbn}&readOnly=false`
    })
  } else {
    showError('书籍条形码错误.')
  }
}

// 录入图书
async function scanCodeToEntryBook () {
  try {
    const res = await scanCode()
    if (res) {
      const isbn = res.result
      const bookCode = reg.test(isbn)
      // ISBN码验证
      if (bookCode) {
        wepy.navigateTo({
          url: `./entryInfo?bookId=${isbn}&isAdmin=true`
        })
        // }
        // const result = await entryBook({b})
      }
    } else {
      showError('没有扫到书籍条形码')
    }
  } catch (error) {}
}

export {
  scanCodeToBorrowBook,
  showBookInfo,
  scanCodeToReturnBook,
  getBookInfoFromDouBan,
  scanCodeToEntryBook
}
