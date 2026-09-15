import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Donut Chart',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'DonutChart' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'boost-point-threshold': { type: 'number', description: 'Threshold for boost mode' },
  },
  required: ['component'],
}

export default schema
