import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Scatterplot Chart',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'ScatterplotChart' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'boost-point-threshold': { type: 'number', description: 'Threshold for boost mode' },
    'boost-series-threshold': { type: 'number', description: 'Threshold for boost mode' },
    'x-axis': {
      type: 'array',
      items: { type: 'object', properties: { dim: { type: 'string' } } },
      description: 'Enter dimension name (e.g., report_dt)',
      default: [],
    },
  },
  required: ['component'],
}

export default schema
