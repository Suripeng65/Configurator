// one function per rule. each rule received the full uiTemplate meta
// and returns a violation message string if it fails
// or nothing if it passes. 
import { findComponents, getScope } from "@src/utils/datasources.util"
import { compareMetaSize } from "./fileSize.util"
import { findSuspiciousScriptInjection, findSuspiciousSqlInjection,generateMessage } from './security.util'

export function requiresName(meta){
    if(!meta?.name?.trim()) return "UI Template must have a name."
}
export function requiresDatasourceTable(meta: any): string | void {
  const datasources = findComponents(meta?.layout, 'Datasource')
  const missing = datasources
    .filter(({ matchedObject }) => !matchedObject?.['flat-table-target'] && !matchedObject?.['option-target'])
    .map(({ matchedObject, fullPathArray }, i) => {
      const name = matchedObject?.name || `datasource #${i + 1}`
      const scope = getScope(meta, fullPathArray)
      return `"${name}" (${scope} scope)`
    })
  if (missing.length) {
    return `Table is required for ${missing.join(', ')}.`
  }
}

function tabTitleFromPath(meta: any, fullPathArray: string[]): string {
  if (fullPathArray[0] === 'viz' && fullPathArray[1] === 'main-panel' && fullPathArray[2]) {
    const tabKey = fullPathArray[2]
    return meta?.layout?.viz?.['main-panel']?.[tabKey]?.title ?? tabKey
  }
  return 'Unknown'
}
 
function describeChartLocation(meta: any, matchedObject: any, fullPathArray: string[], i: number): string {
  const cell = matchedObject?.cell ? ` in cell "${matchedObject.cell}"` : ` #${i + 1}`
  const tab = tabTitleFromPath(meta, fullPathArray)
  return `${matchedObject.component}${cell} (${tab} tab)`
}

const X_AXIS_REQUIRED_CHART_TYPES = ['LineChart', 'StackedAreaChart', 'StackedBarChart']

export function requiresXAxisForCharts(meta: any): string | void {
  const missing = []
  for (const type of X_AXIS_REQUIRED_CHART_TYPES) {
    findComponents(meta?.layout, type).forEach(({ matchedObject, fullPathArray }, i) => {
      if (!matchedObject?.['x-axis']) {
        missing.push(describeChartLocation(meta, matchedObject, fullPathArray, i))
      }
    })
  }
  if (missing.length) return `X-axis is required for: ${missing.join(', ')}.`
}

 
 
export function requiresNodeMapFields(meta: any): string | void {
  const missing = []
  findComponents(meta?.layout, 'NodeMap').forEach(({ matchedObject, fullPathArray }, i) => {
    const missingFields = []
    if (!matchedObject?.latitude) missingFields.push('latitude')
    if (!matchedObject?.longitude) missingFields.push('longitude')
    if (!matchedObject?.extendedType) missingFields.push('extendedType')
    if (missingFields.length) {
      missing.push(`${describeChartLocation(meta, matchedObject, fullPathArray, i)} is missing ${missingFields.join(', ')}`)
    }
  })
  if (missing.length) return `NodeMap requires latitude, longitude, and extendedType — ${missing.join('; ')}.`
}


export function requiresHeatMapFields(meta: any): string | void {
  const missing = []
  findComponents(meta?.layout, 'HeatMap').forEach(({ matchedObject, fullPathArray }, i) => {
    const missingFields = []
    if (!Array.isArray(matchedObject?.['layers-config']) || matchedObject['layers-config'].length === 0) {
      missingFields.push('layers-config')
    }
    if (!matchedObject?.['geo-level']) missingFields.push('geo-level')
    // if (!matchedObject?.['state-name']) missingFields.push('state-name')
    // if (!matchedObject?.['county-name']) missingFields.push('county-name')
    // if (!matchedObject?.['county-fips']) missingFields.push('county-fips')
    // if (matchedObject?.extendedType !== 'county-name') missingFields.push('extendedType (must be "county-name")')
    if (missingFields.length) {
      missing.push(`${describeChartLocation(meta, matchedObject, fullPathArray, i)} is missing ${missingFields.join(', ')}`)
    }
  })
  if (missing.length) {
    return `HeatMap requires layers-config, geo-level, state-name, county-name, county-fips, and extendedType — ${missing.join('; ')}.`
  }
}
 
export function reqruiedTreemapFields(meta: any): string | void {
    console.log(findComponents(meta?.layout, 'TreemapChart'))
  const missing = []
  findComponents(meta?.layout, 'TreemapChart').forEach(({ matchedObject, fullPathArray }, i) => {
    const missingFields = []
    if(!matchedObject?.['render-type']) missingFields.push('render-type')
    if(matchedObject?.['render-type'] !== "basic" && !matchedObject?.relationships) missingFields.push('relationships')
    if (missingFields.length) {
      missing.push(describeChartLocation(meta, matchedObject, fullPathArray, i))
    }
  })
  if (missing.length) {
    return `Treemap requires render-type and relationships - ${missing.join(', ')}.`
  }
}

export function requiresBulletChartListPlotBands(meta: any): string | void {
  const missing = []
  findComponents(meta?.layout, 'BulletChartList').forEach(({ matchedObject, fullPathArray }, i) => {
    const plotBands = matchedObject?.["plot-bands"]
    const isValid = Array.isArray(plotBands)
      && plotBands.length >= 3 && plotBands.length <= 5
    if (!isValid) {
      missing.push(describeChartLocation(meta, matchedObject, fullPathArray, i))
    }
  })
  if (missing.length) {
    return `plotBands is required for BulletChartList and must be an array of 3 to 5 numbers: ${missing.join(', ')}.`
  }
}

export function noScriptContent(meta:any): string|void {
    const identified=[]
    Object.keys(meta).forEach((key)=>{
        if(meta[key]) identified.push(...findSuspiciousScriptInjection(meta[key], [key]))
    })
    if(identified.length > 0) return generateMessage(identified)
}

export function noSqlInjectionContent(meta:any): string|void {
     const identified=[]
    Object.keys(meta).forEach((key)=>{
        if(meta[key]) identified.push(...findSuspiciousSqlInjection(meta[key], [key]))
    })
    if(identified.length > 0) return generateMessage(identified)
}

export function checkMetaSize(meta:any){
    return compareMetaSize(meta)
}
