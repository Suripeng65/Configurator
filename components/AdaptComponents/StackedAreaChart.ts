export default{
    id:'StackedAreaChart',
    label: 'Stacked Area Chart',
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
      {key: 'boost-series-threshold', type:'number', value:'', placeholder: 'Threshold for boost mode'},
      {
        key: 'x-axis',
         type: 'arrayOfObjects',
        value: [],
        placeholder: 'Enter dimension name (e.g., report_dt)',
        objectSchema: [{ key: 'dim', type: 'string', placeholder: 'e.g., report_dt' }]
      },
    ]
}