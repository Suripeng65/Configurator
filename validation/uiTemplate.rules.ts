// One function per rule. Each rule receives the full UiTemplate `meta`
// object ({id, name, description, layout}) and returns a violation message
// string if it fails, or nothing if it passes. To add a rule, add another
// exported function here — nothing else needs to change.

import { findSuspiciousScriptStrings, findSuspiciousSqlStrings, describeSuspiciousStrings } from './security.util'
import { checkMetaSize } from './size.util'
import { findComponents, getScope } from '../utils/datasources.util'
export { validComponentSchemas } from '../components/AdaptComponents/validate'

export function requiresName(meta: any): string | void {
  if (!meta?.name?.trim()) return 'Template must have a name.'
}

export function requiresAtLeastOneVisualizationTab(meta: any): string | void {
  const tabs = meta?.layout?.viz?.['main-panel']?.['tab-array'] ?? []
  if (tabs.length === 0) return 'Layout must have at least one visualization tab.'
}

export function noScriptContent(meta: any): string | void {
  const hits = [
    ...findSuspiciousScriptStrings(meta?.name, ['name']),
    ...findSuspiciousScriptStrings(meta?.description, ['description']),
    ...findSuspiciousScriptStrings(meta?.layout, ['layout']),
  ]
  if (hits.length) return describeSuspiciousStrings(hits, 'malicious script')
}

export function noSqlInjectionContent(meta: any): string | void {
  const hits = [
    ...findSuspiciousSqlStrings(meta?.name, ['name']),
    ...findSuspiciousSqlStrings(meta?.description, ['description']),
    ...findSuspiciousSqlStrings(meta?.layout, ['layout']),
  ]
  if (hits.length) return describeSuspiciousStrings(hits, 'malicious SQL')
}

export function notTooLarge(meta: any): string | void {
  return checkMetaSize(meta)
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

const CHART_TYPES_REQUIRING_DATASOURCE = ['BarChart', 'PieChart']

function tabTitleFromPath(meta: any, fullPathArray: string[]): string {
  if (fullPathArray[0] === 'viz' && fullPathArray[1] === 'main-panel' && fullPathArray[2]) {
    const tabKey = fullPathArray[2]
    return meta?.layout?.viz?.['main-panel']?.[tabKey]?.title ?? tabKey
  }
  return 'Unknown'
}

export function requiresChartDatasourceName(meta: any): string | void {
  const gridContainers = findComponents(meta?.layout, 'GridContainer')

  const missing = []
  for (const { matchedObject, fullPathArray } of gridContainers) {
    const contents = matchedObject?.contents ?? []
    contents.forEach((item: any, i: number) => {
      if (CHART_TYPES_REQUIRING_DATASOURCE.includes(item?.component) && !item?.datasourceName) {
        const cell = item?.cell ?? `#${i + 1}`
        const tab = tabTitleFromPath(meta, fullPathArray)
        missing.push(`${item.component} in cell "${cell}" (${tab} tab)`)
      }
    })
  }

  if (missing.length) {
    return `Datasource is required for: ${missing.join(', ')}.`
  }
}

export function requiresKnownValidationRuleName(meta: any): string | void {
  const messages = findComponents(meta?.layout, 'ValidationMessage')
  if (!messages.length) return

  const datasources = findComponents(meta?.layout, 'Datasource')
  const knownRuleNames = new Set(
    datasources.flatMap(({ matchedObject }) =>
      (matchedObject?.rules ?? []).map((r: any) => r?.ruleName).filter(Boolean)
    )
  )

  const unknown = [...new Set(
    messages
      .map(({ matchedObject }) => matchedObject?.ruleName)
      .filter((ruleName: string) => ruleName && !knownRuleNames.has(ruleName))
  )]

  if (unknown.length) {
    return `Validation Message rule name${unknown.length > 1 ? 's' : ''} not defined in any datasource's rules: ${unknown.join(', ')}.`
  }
}

// Identifies one chart instance for a violation message: its cell (if part
// of a GridContainer's contents) and its owning tab.
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
    if (!matchedObject?.['state-name']) missingFields.push('state-name')
    if (!matchedObject?.['county-name']) missingFields.push('county-name')
    if (!matchedObject?.['county-fips']) missingFields.push('county-fips')
    if (matchedObject?.extendedType !== 'county-name') missingFields.push('extendedType (must be "county-name")')
    if (missingFields.length) {
      missing.push(`${describeChartLocation(meta, matchedObject, fullPathArray, i)} is missing ${missingFields.join(', ')}`)
    }
  })
  if (missing.length) {
    return `HeatMap requires layers-config, geo-level, state-name, county-name, county-fips, and extendedType — ${missing.join('; ')}.`
  }
}

export function requiresTreemapFields(meta: any): string | void {
  const missing = []
  findComponents(meta?.layout, 'TreemapChart').forEach(({ matchedObject, fullPathArray }, i) => {
    const missingFields = []
    if (!matchedObject?.['render-type']) missingFields.push('render-type')
    if (!matchedObject?.relationships) missingFields.push('relationships')
    if (missingFields.length) {
      missing.push(`${describeChartLocation(meta, matchedObject, fullPathArray, i)} is missing ${missingFields.join(', ')}`)
    }
  })
  if (missing.length) return `Treemap requires render-type and relationships — ${missing.join('; ')}.`
}

export function requiresBulletChartListPlotBands(meta: any): string | void {
  const missing = []
  findComponents(meta?.layout, 'BulletChartList').forEach(({ matchedObject, fullPathArray }, i) => {
    const plotBands = matchedObject?.plotBands
    const isValid = Array.isArray(plotBands)
      && plotBands.length >= 3 && plotBands.length <= 5
      && plotBands.every((v: any) => typeof v === 'number')
    if (!isValid) {
      missing.push(describeChartLocation(meta, matchedObject, fullPathArray, i))
    }
  })
  if (missing.length) {
    return `plotBands is required for BulletChartList and must be an array of 3 to 5 numbers: ${missing.join(', ')}.`
  }
}
