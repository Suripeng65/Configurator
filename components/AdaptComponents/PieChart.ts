export default{
    id:'PieChart',
    label: 'Pie Chart',
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
    //   {
    //     key: 'x-axis',
    //     type: 'object',
    //     value: { dim: '' },
    //     placeholder: 'Enter dimension name (e.g., report_dt)'
    //   }
    ]
}