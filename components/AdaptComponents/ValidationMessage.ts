import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Validation Message',
  'x-catalog': { group: 'other', nameKey: 'ruleName' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'ValidationMessage' },
    ruleName: { type: 'string', default: '' },
  },
  required: ['component'],
}

export default schema
