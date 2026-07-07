import { createRouter, createWebHistory } from 'vue-router'
import ConfigEditor from '../views/ConfigEditor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'ConfigEditor', component: ConfigEditor },
  ],
})

export default router
