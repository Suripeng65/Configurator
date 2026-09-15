import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Scatterplot',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'ScatterplotChart' },
    datasourceName: { type: 'string', default: '/', 'x-widget': 'datasource' },
    'x-axis': { type: 'string' },
    'generate-report': { type: 'boolean' },
    'boost-point-threshold': { type: 'number' },
    'boost-series-threshold': { type: 'number' },
  },
  required: ['component'],
}

export default schema
