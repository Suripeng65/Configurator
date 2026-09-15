import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Layout Section',
  'x-catalog': { group: 'container', nameKey: 'displayName' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'LayoutSection' },
    displayName: { type: 'string', default: '' },
    collapsed: { type: 'boolean', default: false },
    collapsible: { type: 'boolean', default: true },
    contents: { $ref: '#/$defs/AdaptComponentContents' },
  },
  required: ['component'],
}

export default schema
