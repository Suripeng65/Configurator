import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Modal Selector',
  'x-catalog': { group: 'filter', nameKey: 'label' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'ModalSelector' },
    label: { type: 'string', default: '' },
    dim: { type: 'string', default: '' },
    contents: { $ref: '#/$defs/AdaptComponentContents' },
  },
  required: ['component'],
}

export default schema
