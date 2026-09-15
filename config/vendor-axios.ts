// ajax call configs
import isDev from './is-dev'
import axios from 'axios'
import getBaseUrl from './get-base-url'
import HTTP_ERROR_MESSAGE from './http-error-message'
import { has } from 'lodash'
import $bus from '@src/helper/plugins/event-bus/index'

export const EventBus = $bus
if (isDev() && import.meta.env.VITE_MOCKS !== 'mirage') {
  const port = 9000
  const contextPath = 'gateway'

  axios.defaults.baseURL = `http://localhost:${port}/${contextPath}/`

  const token = import.meta.env.VITE_SECDEV_TOKEN

  // eslint-disable-not-line no-undef
  axios.defaults.headers.Authorization = 'Basic ' + token
} else {
  axios.defaults.baseURL = getBaseUrl()
}

axios.interceptors.request.use(
  function (config) {
    if (config.url !== 'generate-report/chart') {
      if (
        ['post', 'put'].includes(config.method.toLowerCase()) &&
        has(config.params, 'dsid')
      ) {
        config.data = { ...config.data, dsid: config.params.dsid }
      }
      if (
        ['post', 'put'].includes(config.method.toLowerCase()) &&
        has(config.params, 'schemaName')
      ) {
        config.data = { ...config.data, release: config.params.schemaName }
      }
      if (
        ['post', 'put'].includes(config.method.toLowerCase()) &&
        has(config.params, 'siteCode')
      ) {
        config.data = { ...config.data, siteCode: config.params.siteCode }
      }
      if (
        ['post', 'put'].includes(config.method.toLowerCase()) &&
        has(config.params, 'templateConfigId')
      ) {
        config.data = {
          ...config.data,
          templateConfigId: config.params.templateConfigId,
        }
      }
    }
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  function (response) {
    // Do something with response data
    return response
  },
  function (error) {
    // Do something with response error
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      let title = 'Failed to make request'
      let message = ''
      let displayError = true
      switch (error.response.status) {
        case 401:
          title = 'Unauthorized!'
          message = HTTP_ERROR_MESSAGE.error401
          break
        case 403:
          title = 'Forbidden!'
          message = HTTP_ERROR_MESSAGE.error403
          break
        case 404:
          title = 'Not found!'
          message = HTTP_ERROR_MESSAGE.error404
          break
        case 415:
          if (!isDev()) {
            window.location.reload()
            displayError = false
          }
          break
        case 500:
          title = 'Error'
          message = HTTP_ERROR_MESSAGE.error500
          // if(!isDev()) displayError = false;
          break
        default:
          if (
            error.response.config.url === 'libraryEntry/save.json' ||
            error.response.config.url === 'workspace-viz/check-duplicate'
          ) {
            displayError = false
          }
          message = HTTP_ERROR_MESSAGE.default
          break
      }
      if (displayError) {
        /*      if(getErrorMessage(error.response)){
        message = getErrorMessage(error.response)
      } */
        /* Notification.warning({
          title: `${error.response.status}:${title}`,
          message: `${message}`,
        }) */
        const e = {
          errorType: `${error.response.status}`,
          errorMessage: `${message}`,
        }
        EventBus.$emit('http-error', e)
      }
    }
    return Promise.reject(error)
    // }
  }
)

/* function getErrorMessage(response){
  if(typeof response.data === 'string'){
    return response.data
  }else if(typeof response.data.message === 'string'){
    return response.data.message
  }else if(Array.isArray(response.data)){
    return response.data.join(".")
  }
  return ""
} */
