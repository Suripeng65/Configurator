import { ref, computed, watch } from 'vue'
import { ADAPT_COMPONENTS } from '../components/AdaptComponents/index.js'

export const CHART_TYPES = [
  { v: 'BarChart',         l: 'Bar Chart' },
  { v: 'LineChart',        l: 'Line Chart' },
  { v: 'StackedBarChart',  l: 'Stacked Bar' },
  { v: 'StackedAreaChart', l: 'Stacked Area' },
  { v: 'PieChart',         l: 'Pie Chart' },
  { v: 'DonutChart',       l: 'Donut Chart' },
  { v: 'ScatterplotChart', l: 'Scatterplot' },
  { v: 'TreemapChart',     l: 'Treemap' },
  { v: 'DataTable',        l: 'Data Table' },
]

const FIELD_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }

export function useGridBuilder(activeTabKey, mainPanel, { setValue }) {
  // ── Grid rows ─────────────────────────────────────────────────────────────
  function cellId(ri, ci) { return `dashboard-cell-${ri + 1}-${ci + 1}` }

  function parseGridRows(tab) {
    if (!tab?.contents) return [{ size: 100, cells: [{ chart: 'BarChart', size: 100 }] }]
    const gc = tab.contents.find(c => c.component === 'GridContainer')
    if (!gc) return [{ size: 100, cells: [{ chart: 'BarChart', size: 100 }] }]
    const rows     = gc.layouts?.[0]?.rows ?? []
    const contents = gc.contents ?? []
    if (!rows.length) return [{ size: 100, cells: [{ chart: 'BarChart', size: 100 }] }]
    return rows.map((row, ri) => ({
      size: Number(row.size) || Math.floor(100 / rows.length),
      cells: (row.cells ?? []).map((cell, ci) => {
        const stored = contents.find(c => c.cell === cellId(ri, ci))
        return {
          chart: stored?.component ?? 'BarChart',
          size:  Number(cell.size) || Math.floor(100 / (row.cells?.length || 1)),
        }
      }),
    }))
  }

  const gridRows = ref([])

  watch(activeTabKey, (key) => {
    gridRows.value = parseGridRows(mainPanel.value?.[key] ?? null)
  }, { immediate: true })

  function equalSizes(n) {
    const base = Math.floor(100 / n)
    return Array.from({ length: n }, (_, i) => (i < n - 1 ? base : 100 - base * (n - 1)))
  }

  function addRow() {
    const sizes = equalSizes(gridRows.value.length + 1)
    gridRows.value.forEach((r, i) => { r.size = sizes[i] })
    gridRows.value.push({ size: sizes[sizes.length - 1], cells: [{ chart: 'BarChart', size: 100 }] })
  }

  function removeRow(ri) {
    gridRows.value.splice(ri, 1)
    equalSizes(gridRows.value.length).forEach((s, i) => { gridRows.value[i].size = s })
  }

  function addCell(ri) {
    const cells = gridRows.value[ri].cells
    const sizes = equalSizes(cells.length + 1)
    cells.forEach((c, i) => { c.size = sizes[i] })
    cells.push({ chart: 'DataTable', size: sizes[sizes.length - 1] })
  }

  function removeCell(ri, ci) {
    const cells = gridRows.value[ri].cells
    cells.splice(ci, 1)
    equalSizes(cells.length).forEach((s, i) => { cells[i].size = s })
  }

  function clampRowSizes() {
    gridRows.value.forEach(r => { r.size = Math.max(5, Math.min(95, r.size || 5)) })
  }

  function clampCellSizes(ri) {
    gridRows.value[ri].cells.forEach(c => { c.size = Math.max(5, Math.min(95, c.size || 5)) })
  }

  // ── Cell configuration ────────────────────────────────────────────────────
  function getGcIndex() {
    const tab = mainPanel.value?.[activeTabKey.value]
    return (tab?.contents ?? []).findIndex(c => c.component === 'GridContainer')
  }

  const storedCells = computed(() => {
    const key = activeTabKey.value
    if (!key) return []
    const gcIdx = getGcIndex()
    if (gcIdx < 0) return []
    return mainPanel.value?.[key]?.contents?.[gcIdx]?.contents ?? []
  })

  const storedDatasources = computed(() => {
    const key = activeTabKey.value
    if (!key) return []
    return (mainPanel.value?.[key]?.datasources ?? []).map(ds => ds.name).filter(n => n && n !== '/')
  })

  function setCellField(cellIndex, fieldKey, value) {
    const key   = activeTabKey.value
    const gcIdx = getGcIndex()
    if (!key || gcIdx < 0) return
    setValue(['viz', 'main-panel', key, 'contents', gcIdx, 'contents', cellIndex, fieldKey], value)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function buildTabConfig() {
    const key  = activeTabKey.value
    const base = mainPanel.value?.[key] ?? {}

    const layoutRows = gridRows.value.map((row, ri) => ({
      size: String(row.size),
      cells: row.cells.map((cell, ci) => {
        const obj = { id: cellId(ri, ci) }
        if (row.cells.length > 1) obj.size = String(cell.size)
        return obj
      }),
    }))

    const existingCells = base.contents?.find(c => c.component === 'GridContainer')?.contents ?? []

    const contents = []
    gridRows.value.forEach((row, ri) => {
      row.cells.forEach((cell, ci) => {
        const id         = cellId(ri, ci)
        const prev       = existingCells.find(c => c.cell === id)
        const cellConfig = { ...(prev ?? {}), cell: id, component: cell.chart }
        const adaptDef   = ADAPT_COMPONENTS[cell.chart]
        if (adaptDef) {
          for (const field of adaptDef.fields ?? []) {
            if (!(field.key in cellConfig)) {
              cellConfig[field.key] = field.default !== undefined ? field.default : (FIELD_DEFAULTS[field.type] ?? '')
            }
          }
        }
        if (!('datasourceName' in cellConfig)) cellConfig.datasourceName = '/'
        contents.push(cellConfig)
      })
    })

    return {
      ...base,
      title:     base.title ?? key,
      component: 'TabWrapper',
      contents:  [{ layouts: [{ id: 'layout-1', rows: layoutRows }], contents, component: 'GridContainer' }],
      datasources:       base.datasources ?? [{ name: '/', component: 'Datasource', 'dql-metrics': [], 'flat-table-target': '' }],
      'right-panel':     base['right-panel']     ?? { 'tab-array': [], defaultTab: null },
      'generate-report': base['generate-report'] ?? [],
    }
  }

  function saveTab() {
    const key = activeTabKey.value
    if (!key) return
    setValue(['viz', 'main-panel', key], buildTabConfig())
  }

  return {
    gridRows,
    cellId,
    addRow, removeRow, addCell, removeCell,
    clampRowSizes, clampCellSizes,
    storedCells, storedDatasources, setCellField,
    saveTab,
  }
}
