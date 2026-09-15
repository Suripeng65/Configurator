export default{
    id:'DonutChart',
    label: 'Donut Chart',
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
        {key: 'boost-point-threshold', type:'number', value:'', placeholder: 'Threshold for boost mode'},
    ]
}