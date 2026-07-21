import { library, config } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(fas)
library.add(far)

config.autoAddCss = false // do not inject the CSS automatically for CSP compliance

export default function registerFontAwesome(app) {
  app.component('font-awesome-icon', FontAwesomeIcon)
  app.component('FontAwesomeIcon', FontAwesomeIcon)
}
