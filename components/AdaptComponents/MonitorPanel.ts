import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Monitor Panel',
  'x-catalog': { group: 'container' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'MonitorPanel' },
    contents: { $ref: '#/$defs/AdaptComponentContents' },
  },
  required: ['component'],
}

export default schema
