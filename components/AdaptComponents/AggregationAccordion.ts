import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Aggregation Accordion',
  'x-catalog': { group: 'container', nameKey: 'displayName' },
  type: 'object',
  properties: {
    component: { const: 'AggregationAccordion' },
    displayName: { type: 'string', default: '' },
    contents: { $ref: '#/$defs/AdaptComponentContents' },
  },
  required: ['component'],
}

export default schema
