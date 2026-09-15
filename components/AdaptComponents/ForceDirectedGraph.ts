export default{
    id:'ForceDirectedGraph',
    label: 'Force Directed Graph',
    fields:[
      {
        key: 'generate-report', 
        type:'checkboxArray', 
        value: [],
        options: [
          { text: 'Jasper', value: 'jasper' },
          { text: 'CSV', value: 'csv' },
        ]
      },
      {
        key: 'network-direction-arrows',
        type: 'boolean',
        default: true
      },
      {
        key: 'network-link-weight',
        type: 'boolean',
        default: true
      }
    ]
}