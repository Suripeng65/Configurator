import { vanillaRenderers } from '@jsonforms/vue-vanilla'
import ArrayOfArraysRenderer, { arrayOfArraysTester } from './ArrayOfArraysRenderer.vue'

// vue-vanilla's default ArrayListRenderer (rank 2) already handles a plain
// array of strings/numbers/objects fine via DispatchRenderer per item — it's
// only array-of-arrays (nested primitive arrays, e.g. BracketList's
// `values`) that has no sensible default, since each "item" is itself an
// array with no control of its own. ArrayOfArraysRenderer (rank 5) wins the
// tester for that one shape; everything else falls through to the defaults.
export const renderers = [
  ...vanillaRenderers,
  { renderer: ArrayOfArraysRenderer, tester: arrayOfArraysTester },
]
