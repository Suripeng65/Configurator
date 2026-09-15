import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Flex Dropdown',
  'x-catalog': { group: 'filter', nameKey: 'label' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'FlexDropdown' },
    label: { type: 'string', default: '' },
    dim: { type: 'string', default: '' },
    options: { type: 'array', items: { type: 'string' }, default: [] },
  },
  required: ['component'],
}

export default schema
