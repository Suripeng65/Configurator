// Shared $defs entry every component schema's `allOf` references.
export const AdaptComponentBase = {
  type: 'object',
  required: ['component'],
  properties: {
    component: { type: 'string' },
  },
}
