import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

export default function registerAGGrid(app) {
  app.component('VSelect', vSelect)
}
