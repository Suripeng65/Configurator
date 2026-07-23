export default {
  group: 'chart',
  label: 'Stacked Area',
  fields: [
    { key: 'datasourceName',         type: 'datasource' },
    { key: 'x-axis',                 type: 'string'     },
    { key: 'generate-report',        type: 'boolean'    },
    { key: 'boost-point-threshold',  type: 'number'     },
    { key: 'boost-series-threshold', type: 'number'     },
  ],
}
