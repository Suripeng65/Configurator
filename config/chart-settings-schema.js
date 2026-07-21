import { uniqBy } from 'lodash'
import { useDatasetStore } from '@src/stores/Dataset/dataset-store'

/**
 *
 * @param {Object[]} axisObjs
 * @param {string} axisObjs[].value - The raw value
 * @param {string} axisObjs[].label - The display name
 * @param {Object[]} stratifyBy
 * @param {string} stratifyBy[].value - The raw value
 * @param {string} stratifyBy[].label - The display name
 * @returns
 */
export function generateSchema(params) {
  const { chartConfigRef} = params
  switch(chartConfigRef){
    case "scatterplot":
      return getScatterplotChartSetting(params)
    case "network-graph":
      return getNetworkChartSetting(params)
    default:
      return {
        formSchema:[]
      }
  }
}

function getScatterplotChartSetting(params){
  const { axisObjs = [], stratifyBy = [], chartConfigRef} = params
  const aggregationOptions = uniqBy(axisObjs, 'value')
  return  {
      formSchema: [
        {
          name: 'plotting',
          type: 'tab',
          label: 'Chart Plotting',
          children: [
            {
              $formkit: 'select',
              name: 'xaxis',
              type: 'select',
              label: 'X-Axis',
              options: aggregationOptions,
              valueType: 'string',
            },
            {
              $formkit: 'select',
              name: 'yaxis',
              type: 'select',
              label: 'Y-Axis',
              options: aggregationOptions,
              valueType: 'string',
            },
            {
              $formkit: 'select',
              name: 'categorizeBy',
              type: 'select',
              label: 'Categorize By',
              options: stratifyBy.length > 0 ? stratifyBy : ['None'],
              valueType: 'string',
            },
          ],
        },
      ],
    }
}

function getNetworkChartSetting(params){
  const { 
    datasource: {
      monitorProperties, 
      getCompleteColumnConfigMap: columnMap
    }
  } = params
  const dimensions = monitorProperties.filter((d)=>columnMap[d].role === 'DIMENSION').map((d)=>{return {value:d, label:columnMap[d]?.displayName}})

  return {
     formSchema: [
        {
          name: 'plotting',
          type: 'tab',
          label: 'Chart Plotting',
          children: [
            {
              $formkit: 'select',
              name: 'dim1',
              type: 'select',
              label: 'Dimension 1',
              options: dimensions,
              valueType: 'string',
            },
            {
              $formkit: 'select',
              name: 'dim2',
              type: 'select',
              label: 'Dimension 2',
              options: dimensions,
              valueType: 'string',
            },
          ],
        },
      ]
  }
}