export default {
  label: 'Layout Section',
  group: 'container',
  nameKey: 'displayName',
  container: true,
  fields: [
    { key: 'displayName',  type: 'string',  default: '' },
    { key: 'collapsed',    type: 'boolean', default: false },
    { key: 'collapsible',  type: 'boolean', default: true },
  ],
}
