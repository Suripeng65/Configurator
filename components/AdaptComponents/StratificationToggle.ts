import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Stratification Toggle',
  'x-catalog': { group: 'filter', nameKey: 'dim' },
  type: 'object',
  properties: {
    component: { const: 'StratificationToggle' },
    dim: { type: 'string', default: '' },
  },
  required: ['component'],
}

export default schema
