import { vanillaRenderers } from '@jsonforms/vue-vanilla'
import ArrayOfArraysRenderer, { arrayOfArraysTester } from './ArrayOfArraysRenderer.vue'

export const renderers = [
  ...vanillaRenderers,
  { renderer: ArrayOfArraysRenderer, tester: arrayOfArraysTester },
]
