import type { AdaptComponentSchema } from './types'

const schema: AdaptComponentSchema = {
  title: 'Transform Button',
  'x-catalog': { group: 'other', nameKey: 'field' },
  type: 'object',
  properties: {
    component: { const: 'TransformButton' },
    field: { type: 'string', default: '' },
    value: { type: 'string', default: '' },
    displayName: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    datasourceName: { type: 'string', default: '' },
    targetDatasource: { type: 'string', default: '' },
  },
  required: ['component'],
}

export default schema
