import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Accordion Group',
  'x-catalog': { group: 'container', nameKey: 'groupName' },
  type: 'object',
  properties: {
    component: { const: 'AccordionGroup' },
    groupName: { type: 'string', default: '' },
    collapsedByDefault: { type: 'boolean', default: false },
    contents: { $ref: '#/$defs/AdaptComponentContents' },
  },
  required: ['component'],
}

export default schema
