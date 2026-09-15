export default{
    id:'LinkMap',
    label: 'Linkmap',
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
        key: 'link-arrows',
        type: 'boolean',
        default: true
      },
      {
        key: 'link-width-weight',
        type: 'boolean',
        default: true
      }
    ]
}