/**
 * Created by nchen on 3/3/2017.
 */
import dialog from './dialog.vue'
import { set } from './utility'
import { init } from './config'

/**
 * @params classname: the spinner class you want to specify, globally
 * @type {{install: MyPlugin.install}}
 */
const MyPlugin = {
  install: function (app, options) {
    if (options) {
      set(options)
    }
    app.component('acumen-session-timeout', dialog)
    app.config.globalProperties.$sessionTimeoutSetConfig = set
    app.config.globalProperties.$sessionTimeoutInit = init
  },
}

export default MyPlugin
