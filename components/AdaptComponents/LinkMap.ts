import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Linkmap',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'LinkMap' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'link-arrows': { type: 'boolean', default: true },
    'link-width-weight': { type: 'boolean', default: true },
  },
  required: ['component'],
}

export default schema
