import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Network Graph',
  'x-catalog': { group: 'chart' },
  type: 'object',
  properties: {
    component: { const: 'NetworkGraph' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
  },
  required: ['component'],
}

export default schema
