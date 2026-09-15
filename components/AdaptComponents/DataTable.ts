import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Data Table',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'DataTable' },
    datasourceName: { type: 'string', default: '/', 'x-widget': 'datasource' },
    'generate-report': { type: 'boolean' },
  },
  required: ['component'],
}

export default schema
