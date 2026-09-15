import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Bar Chart',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'BarChart' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'boost-point-threshold': { type: 'number', description: 'Threshold for boost mode' },
    'categorize-by': {
      type: 'array',
      items: { type: 'object', properties: { dim: { type: 'string' } } },
      description: 'Enter dimension name (e.g., report_dt)',
      default: [],
    },
  },
  required: ['component'],
}

export default schema
