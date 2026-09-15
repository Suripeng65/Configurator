import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Nodemap',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'NodeMap' },
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
