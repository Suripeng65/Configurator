export default{
    id:'TreemapChart',
    label: 'Treemap Chart',
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
        key: 'x-axis',
        type: 'object',
        value: { dim: '' },
        placeholder: 'Enter dimension name (e.g., report_dt)'
      },
        {key: 'render-type', type:'dropdown', value:'basic', options:['basic', 'category', 'continuous']},
        {
          key: 'relationships',
          type: 'hierarchy',
          value: [],
          radioOptions: [
            { text: 'Hierarchy', value: 'array' },
            { text: 'Parent-Child', value: 'object' }
          ],
          arrayLabel: 'Enter hierarchy levels (one per line):',
          objectLabel: 'Configure parent-child relationship:',
          arrayPlaceholder: 'Enter hierarchy levels\nExample:\nLevel 1\nLevel 2\nLevel 3'
        }
    ]
}