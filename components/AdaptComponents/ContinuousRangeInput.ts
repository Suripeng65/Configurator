import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Range Selector',
  'x-catalog': { group: 'filter', nameKey: 'label' },
  type: 'object',
  properties: {
    component: { const: 'ContinuousRangeInput' },
    label: { type: 'string', default: '' },
    dim: { type: 'string', default: '' },
  },
  required: ['component'],
}

export default schema
