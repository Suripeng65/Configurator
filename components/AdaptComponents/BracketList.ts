import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Bracket List',
  'x-catalog': { group: 'filter', nameKey: 'displayName' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'BracketList' },
    displayName: { type: 'string', default: '' },
    dim: { type: 'string', default: '' },
    datasourceName: { type: 'string', default: '/', 'x-widget': 'datasource' },
    values: { type: 'array', items: { type: 'array', items: { type: 'string' } }, default: [] },
  },
  required: ['component'],
}

export default schema
