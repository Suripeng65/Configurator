export default{
    id:'TileGridMapChart',
    label: 'Tile Grid Map Chart',
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
      {key: 'geo-level', type:'string', value:'', placeholder: 'e.g. state / jd'},
      {
        key: 'layers-config',
        type: 'arrayOfObjects',
        value: [],
        objectSchema: [
          { key: 'id', type: 'string', placeholder: 'e.g., abbreviation' },
          { key: 'name', type: 'string', placeholder: 'e.g., state_name' },
          { key: 'layer', type: 'string', placeholder: 'e.g., state' },
          { key: 'component', type: 'string', placeholder: 'e.g., HeatmapLayer' },
        ]
      }
    ]
}