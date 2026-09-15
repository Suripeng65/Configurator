export default {
  label: 'Stratification Dropdown',
  group: 'filter',
  nameKey: 'displayName',
  fields: [
    { key: 'displayName', type: 'string', default: '' },
    { key: 'options',     type: 'array',  default: [] },
  ],
}
