import axios from 'axios'
import { set } from './utility'

/**
 *
 * @param params {logoutUrl,sessionConfigUrl,touchUrl}
 */
export function init(params) {
  if (!params) params = {}
  if (isDev()) {
    setTimeout(function () {
      set({
        touch_url: getTouchUrl(params.touchUrl),
        sl_polling_freq: 3,
        sl_warning_time: params.sl_warning_time
          ? params.sl_warning_time
          : 500000,
        sl_lock_time: params.sl_lock_time ? params.sl_lock_time : 1500000,
        touch_validation: function () {
          return true
        },
      })
    }, 1000)
  } else {
    // production
    axios
      .all([
        getSessionConfig(params.sessionConfigUrl),
        getLogoutConfig(params.logoutUrl),
      ])
      .then(
        axios.spread(function (session, logout) {
          set({
            touch_url: getTouchUrl(params.touchUrl),
            sl_polling_freq: 1,
            sl_warning_time: session.data.sessionTimeOutWarningInSeconds,
            sl_lock_time: session.data.sessionTimeOutInSeconds,
            login_url: logout.data.timeoutUrl
              ? logout.data.timeoutUrl
              : logout.data.url,
            touch_validation: function (response) {
              if (response.status >= 200 && response.status < 300) {
                if (response.data.value) {
                  return true
                }
              }
              return false
            },
          })
        })
      )
  }
}

function isDev() {
  return process.env.NODE_ENV === 'development'
}

function getTouchUrl(touchUrl = 'app/touch.json') {
  return touchUrl
}

function getSessionConfig(sessionConfigUrl = 'app/sessionTimeOutConfig') {
  return axios.get(sessionConfigUrl)
}

function getLogoutConfig(logoutUrl = 'app/logoutLinkConfig') {
  return axios.get(logoutUrl)
}
