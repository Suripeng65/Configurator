import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Tree Table',
  'x-catalog': { group: 'chart' },
  type: 'object',
  allOf: [{ $ref: '#/$defs/AdaptComponent' }],
  properties: {
    component: { const: 'TreeTable' },
    'status-bar': { type: 'boolean', title: 'Status Bar Visibility', default: false },
    'max-threshold': { type: 'number', title: 'Max Threshold Of Data Items', default: 50000 },
    toolbar: { type: 'boolean', title: 'Show Toolbar', default: false },
    'enable-metric-selection': { type: 'boolean', title: 'Enable Metric Selection (eyeball)', default: false },
    'quick-filter': { type: 'boolean', title: 'Show quick filter', default: false },
  },
  required: ['component'],
}

export default schema
