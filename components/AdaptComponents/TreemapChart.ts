import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Treemap Chart',
  'x-catalog': { group: 'chart' },
  type: 'object',
  properties: {
    component: { const: 'TreemapChart' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'x-axis': {
      type: 'object',
      properties: { dim: { type: 'string' } },
      description: 'Enter dimension name (e.g., report_dt)',
      default: { dim: '' },
    },
    'render-type': { type: 'string', enum: ['basic', 'category', 'continuous'], default: 'basic' },
    relationships: {
      oneOf: [
        {
          type: 'array',
          items: { type: 'string' },
          title: 'Hierarchy',
          description: 'Enter hierarchy levels (one per line)',
        },
        {
          type: 'object',
          title: 'Parent-Child',
          description: 'Configure parent-child relationship',
          properties: {
            'id-column': { type: 'string' },
            'parent-column': { type: 'string' },
          },
        },
      ],
      default: [],
    },
  },
  required: ['component'],
}

export default schema
