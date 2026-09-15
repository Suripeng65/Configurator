import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Bar Chart',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'BarChart' },
    datasourceName: { type: 'string', default: '/', 'x-widget': 'datasource' },
    'categorize-by': { type: 'string' },
    'generate-report': { type: 'boolean' },
    'boost-point-threshold': { type: 'number' },
    'boost-series-threshold': { type: 'number' },
  },
  required: ['component'],
}

export default schema
