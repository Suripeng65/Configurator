export default {
  label: 'Bracket List',
  group: 'filter',
  nameKey: 'label',
  container: true,
  fields: [
    { key: 'label', type: 'string', default: '' },
    { key: 'dim',   type: 'string', default: '' },
    { key: 'values',   type: 'json', default: null },
  ],
}
