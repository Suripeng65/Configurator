/**
 * Created by nchen on 4/10/2017.
 */

const root = '/'
let callingTimeout = null
const sessionConfig = {
  SESSION_COOKIE_NAME: 'AcumenRadvWebPortal.SessionRecords',
  sl_polling_freq: 1,
  sl_warning_time: 720,
  sl_lock_time: 900,
  config_url: '',
  login_url: root, // need to be set up
  touch_url: root, // need to be set up
  touch_validation: function (response) {
    if (!response) return false
    if (!response.status) return false
    if (response.status >= 200 && response.status < 300) {
      return true
    } else {
      return false
    }
  },
}

let flag = '' // warning,logout,""

const timeOut = {
  warningTimeOut: {},
  warningCallBack: function () {},
  logoutTimeOut: {},
  logoutCallBack: function () {},
  clearWindowCallback: function () {},
  touch: function () {},
  timeInterval: 0,
}

export function doesLSEnabled() {
  const test = 'test'
  try {
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Program entry
 * @param warning
 * @param logout
 * @param clear
 * @param touch
 */
export function setTimeoutCallback({ warning, logout, clear, touch }) {
  timeOut.warningCallBack = warning
  timeOut.logoutCallBack = logout
  timeOut.clearWindowCallback = clear
  timeOut.touch = touch
  bindingEvents()
}

function setWarningTimeOut() {
  clearTimeout(timeOut.warningTimeOut)
  timeOut.warningTimeOut = setTimeout(function () {
    timeOut.warningCallBack.call()
  }, sessionConfig.sl_warning_time * 1000)
}

function setLockoutTimeOut() {
  clearTimeout(timeOut.logoutTimeOut)
  timeOut.logoutTimeOut = setTimeout(function () {
    timeOut.logoutCallBack.call()
  }, sessionConfig.sl_lock_time * 1000)
}

function setLogout() {
  console.warn('logout')
  timeOut.logoutCallBack.call()
  flag = 'logout'
}

function setWarning() {
  console.warn('warning')
  timeOut.warningCallBack.call()
  flag = 'warning'
}

function setUpIntervalWithLocalStorage() {
  if (!doesLSEnabled()) {
    return false
  }
  setInterval(function () {
    const now = new Date()
    const cookieValue = localStorage.getItem(sessionConfig.SESSION_COOKIE_NAME)
    if (cookieValue === 'logout') {
      setLogout()
    } else if (cookieValue) {
      const cookieTime = new Date(cookieValue)
      const timePassed = now - cookieTime
      if (timePassed >= sessionConfig.sl_lock_time * 1000) {
        if (flag !== 'logout') {
          setLogout()
        }
      } else if (timePassed >= sessionConfig.sl_warning_time * 1000) {
        if (flag !== 'warning') {
          setWarning()
        }
      } else {
        flag = ''
      }
    }
    if (flag === '') {
      timeOut.clearWindowCallback.call()
    }
  }, sessionConfig.sl_polling_freq * 1000)
}

function resetLocalStorage(SESSION_COOKIE_NAME, value) {
  if (!value) {
    const d = new Date()
    value = d.toISOString()
  }
  localStorage.setItem(SESSION_COOKIE_NAME, value)
}

export function failedTouch() {
  if (doesLSEnabled()) {
    resetLocalStorage(sessionConfig.SESSION_COOKIE_NAME, 'logout')
  } else {
    timeOut.clearWindowCallback.call()
    timeOut.logoutCallBack.call()
  }
}

export function resetTimeout() {
  flag = ''
  if (doesLSEnabled()) {
    resetLocalStorage(sessionConfig.SESSION_COOKIE_NAME)
  } else {
    setWarningTimeOut()
    setLockoutTimeOut()
  }
}

function validation(key, value) {
  switch (key) {
    case 'sl_warning_time':
      return !!value
    case 'sl_lock_time':
      return !!value
    case 'sl_polling_freq':
      return !!value
    default:
      return true
  }
}

/**
 * Entry point
 * @param args
 */
export function set(args) {
  Object.keys(args).map(function (key) {
    if (validation(key, args[key])) {
      sessionConfig[key] = args[key]
    }
  })
  flag = ''
  resetTimeout()
  setUpIntervalWithLocalStorage()
}

function retouch() {
  if (!callingTimeout) {
    callingTimeout = setTimeout(function () {
      callingTimeout = undefined
      timeOut.touch()
    }, get().sl_polling_freq * 1000)
  }
}

export function bindingEvents() {
  const events = ['click', 'keydown']
  events.map(function (e) {
    document.body.addEventListener(e, function () {
      retouch()
    })
  })
  document.querySelectorAll('input').forEach((t) => {
    events.map(function (e) {
      t.addEventListener(e, function () {
        retouch()
      })
    })
  })
}

export function get() {
  return sessionConfig
}

export function getLogoutMessage() {
  return 'As a result of inactivity, your session has expired, and the system has logged you out. Click the OK button to access the login page.'
}

export function getWarningMessage() {
  return `As a result of inactivity, a logout is scheduled to occur in a few minute(s). If you want to remain logged in, click the "Yes, remain logged in" button.`
}

export default {
  set,
  get,
  resetTimeout,
  setTimeoutCallback,
  bindingEvents,
  doesLSEnabled,
  getWarningMessage,
  getLogoutMessage,
  failedTouch,
}
