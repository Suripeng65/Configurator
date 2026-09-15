import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Bullet Chart',
  'x-catalog': { group: 'chart' },
  type: 'object',
  properties: {
    component: { const: 'BulletChartList' },
    'generate-report': {
      type: 'array',
      items: { oneOf: [{ const: 'jasper', title: 'Jasper' }, { const: 'csv', title: 'CSV' }] },
      uniqueItems: true,
      default: [],
    },
    'plot-bands': {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 5,
      description: 'Enter column name',
      default: [],
    },
  },
  required: ['component'],
}

export default schema
