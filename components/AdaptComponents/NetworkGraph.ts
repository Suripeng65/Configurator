export default{
    id:'NetworkGraph',
    label: 'Network Graph',
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