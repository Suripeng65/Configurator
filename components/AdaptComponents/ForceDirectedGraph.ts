import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Force Directed Graph',
  'x-catalog': { group: 'chart' },
  type: 'object',
  properties: {
    component: { const: 'ForceDirectedGraph' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'network-direction-arrows': { type: 'boolean', default: true },
    'network-link-weight': { type: 'boolean', default: true },
  },
  required: ['component'],
}

export default schema
