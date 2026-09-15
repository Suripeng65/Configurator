export default{
    id:'TreeTable',
    label: 'Tree Table',
    fields:[
        {
        key: 'status-bar',
        label: 'Status Bar Visibility',
        type:'boolean', 
        default: false
      },
      { 
        key: 'max-threshold',
        label: 'Max Threshold Of Data Items',
        type: 'number',
        default: 50000
      },
      {key: 'toolbar',
        type: 'boolean',
        label: 'Show Toolbar',
        default: false
      },

{key: 'enable-metric-selection',
    type: 'boolean',
        label: 'Enable Metric Selection (eyeball)',
        default: false
},
{key: 'quick-filter',
    type: 'boolean',
        label: 'Show quick filter',
        default: false
}
    ]
}