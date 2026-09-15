export default {
  label: 'Transform Button',
  group: 'other',
  nameKey: 'field',
  fields: [
    { key: 'field', type: 'string', default: '' },
    { key: 'value',   type: 'string', default: '' },
    { key: 'displayName',  type: 'string', default: '' },
    { key: 'description', type: 'string', default: '' },
    { key: 'datasourceName',   type: 'string', default: '' },
    { key: 'targetDatasource', type: 'string', default: '' },
  ],
}
