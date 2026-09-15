import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Heatmap',
  'x-catalog': { group: 'chart' },
  type: 'object',
  properties: {
    component: { const: 'HeatMap' },
    'geo-level': { type: 'string', default: '', description: 'Column name representing geography level ("state", "county", etc.)' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'layers-config': {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'e.g., abbreviation' },
          name: { type: 'string', description: 'e.g., state_name' },
          layer: { type: 'string', description: 'e.g., state' },
          'max-zoom': { type: 'number', description: 'e.g., 10' },
          'min-zoom': { type: 'number', description: 'e.g., 1' },
          component: { type: 'string', description: 'e.g., HeatmapLayer' },
        },
      },
      default: [],
    },
  },
  required: ['component'],
}

export default schema
