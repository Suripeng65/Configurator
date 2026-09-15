export default{
    id:'BulletChartList',
    label: 'Bullet Chart',
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
        key: 'plot-bands',
        type: 'stringArray',
        value: [],
        minItems: 3,
        maxItems: 5,
        placeholder: 'Enter column name'
      }
    ]
}