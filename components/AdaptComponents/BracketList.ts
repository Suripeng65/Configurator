import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Bracket List',
  'x-catalog': { group: 'filter', nameKey: 'label' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'BracketList' },
    label: { type: 'string', default: '' },
    dim: { type: 'string', default: '' },
    values: { type: 'array', items: { type: 'array', items: { type: 'string' } }, default: [] },
    contents: { $ref: '#/$defs/AdaptComponentContents' },
  },
  required: ['component'],
}

export default schema
