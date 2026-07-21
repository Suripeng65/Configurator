import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'
import './config/vendor-axios'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import {PiniaColada} from "@pinia/colada";

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(createBootstrap())
app.mount('#app')
app.use(PiniaColada, {
  queryOptions: {
    // change the stale time for all queries to 0ms
    staleTime: 0,
  },
  mutationOptions: {
    // add global mutation options here
  },
  plugins: [
    // add Pinia Colada plugins here
  ],
})
