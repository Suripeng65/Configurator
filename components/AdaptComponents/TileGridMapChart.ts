import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Tile Grid Map Chart',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'TileGridMapChart' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'geo-level': { type: 'string', default: '', description: 'e.g. state / jd' },
    'layers-config': {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'e.g., abbreviation' },
          name: { type: 'string', description: 'e.g., state_name' },
          layer: { type: 'string', description: 'e.g., state' },
          component: { type: 'string', description: 'e.g., HeatmapLayer' },
        },
      },
      default: [],
    },
  },
  required: ['component'],
}

export default schema
