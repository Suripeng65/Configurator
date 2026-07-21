import { plugin, defaultConfig } from '@formkit/vue'

export default function registerFormkit(app) {
  app.use(plugin, defaultConfig)
}
