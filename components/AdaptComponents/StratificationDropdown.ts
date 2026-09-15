import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Stratification Dropdown',
  'x-catalog': { group: 'filter', nameKey: 'displayName' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'StratificationDropdown' },
    displayName: { type: 'string', default: '' },
    options: { type: 'array', items: { type: 'string' }, default: [] },
  },
  required: ['component'],
}

export default schema
