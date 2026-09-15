import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Tab Content',
  'x-catalog': { group: 'container' },
  type: 'object',
  properties: {
    component: { const: 'TabContent' },
    tabs: { type: 'array', items: { type: 'string' }, default: [] },
    contents: { $ref: '#/$defs/AdaptComponentContents' },
  },
  required: ['component'],
}

export default schema
