export default{
    id:'HeatMap',
    label: 'Heatmap',
    fields:[
      {
        key: 'geo-level',
        type: 'string',
        value: '',
        placeholder: 'Column name representing geography level ("state", "county", etc.)'
      },
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
        key: 'layers-config',
        type: 'arrayOfObjects',
        value: [],
        objectSchema: [
          { key: 'id', type: 'string', placeholder: 'e.g., abbreviation' },
          { key: 'name', type: 'string', placeholder: 'e.g., state_name' },
          { key: 'layer', type: 'string', placeholder: 'e.g., state' },
          { key: 'max-zoom', type: 'number', placeholder: 'e.g., 10' },
          { key: 'min-zoom', type: 'number', placeholder: 'e.g., 1' },
          { key: 'component', type: 'string', placeholder: 'e.g., HeatmapLayer' },
        ]
      }
    ]
}