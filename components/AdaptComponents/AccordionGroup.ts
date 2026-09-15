export default {
  label: 'Accordion Group',
  group: 'container',
  nameKey: 'groupName',
  container: true,
  fields: [
    { key: 'groupName',          type: 'string',  default: '' },
    { key: 'collapsedByDefault', type: 'boolean', default: false },
  ],
}
