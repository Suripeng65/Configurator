export default{
    id:'NodeMap',
    label: 'Nodemap',
    fields:[
      {
        key: 'generate-report', 
        type:'checkboxArray', 
        value: [],
        options: [
          { text: 'Jasper', value: 'jasper' },
          { text: 'CSV', value: 'csv' },
        ]
      }
    ]
}