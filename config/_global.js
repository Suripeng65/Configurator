import isDev from '../config/is-dev'
import $bus from '../helper/plugins/event-bus/index.js'
import { get, has, isEmpty } from 'lodash'
const Census_Tracts = 'Census Tracts'
const DIM_STRATIFICATION_OPTION_VALUE = '$STRATIFICATION$'

// ---------Vue Functions--------------//
export const initVueGlobalProperties = (app) => {
  app.config.globalProperties._get = get
  app.config.globalProperties._has = has
  app.config.globalProperties._isEmpty = isEmpty

  app.config.globalProperties.isDev = isDev

  app.config.globalProperties.$Max_Facility_Nodes = 1000

  app.config.globalProperties.$Census_Tracts = Census_Tracts

  window.DIM_STRATIFICATION_OPTION_VALUE =
    app.config.globalProperties.DIM_STRATIFICATION_OPTION_VALUE =
      DIM_STRATIFICATION_OPTION_VALUE

  app.config.globalProperties.$EventBus = $bus

  window.LANDINGVIEW = app.config.globalProperties.LANDINGVIEW = 'dataset'
}

// ---------Vue components--------------//
