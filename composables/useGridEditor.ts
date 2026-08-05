import { computed } from 'vue'
import { parseGridRows } from '@src/utils/grid-row-parser'

export function useGridEditor(mainPanel, activeTabKey, adaptLibrary, {setValue}) {
  const gridRows = computed(() => {
    const key = activeTabKey.value
    if (!key || !mainPanel.value?.[key]) {
      return []
    }
    const rows = parseGridRows(mainPanel.value?.[key])
    // Seed each field with its previously-saved value (from chartMeta, the raw
    // stored cell) when one exists. Fields with no stored value are left
    // `undefined` so the input/radio renders empty, waiting for user input,
    // instead of pre-filling a schema default before the user has chosen one.
    for (const row of rows) {
      for (const cell of row.cells) {
        const def = adaptLibrary.value[cell.chart]
        for (const field of def?.fields ?? []) {
          if (cell[field.key] === undefined && field.key in (cell.chartMeta ?? {})) {
            cell[field.key] = cell.chartMeta[field.key]
          }
        }
      }
    }
    return rows
  })
  function cellId(ri, ci) { return `dashboard-cell-${ri + 1}-${ci + 1}` }

  function getTabData() {
    const key = activeTabKey.value
    return mainPanel.value?.[key]
  }

  function getGridContainer() {
    const tab = getTabData()
    if (!tab?.contents) return null
    return tab.contents.find(c => c.component === 'GridContainer')
  }

  function equalSizes(n) {
    const base = Math.floor(100 / n)
    return Array.from({ length: n }, (_, i) => (i < n - 1 ? base : 100 - base * (n - 1)))
  }

  function clampSize(size) {
    return String(Math.max(5, Math.min(95, Number(size) || 5)))
  }

  // Writes row/cell size percentages straight into the real stored layout,
  // same as the other update* functions — this was the last piece still
  // living only in the local `gridRows` draft, requiring an explicit "Save
  // Tab" step to avoid being silently lost.
  function updateRowSize(ri, size) {
    const row = getGridContainer()?.layouts?.[0]?.rows?.[ri]
    if (!row) return
    row.size = clampSize(size)
  }

  function updateCellSize(ri, ci, size) {
    const cell = getGridContainer()?.layouts?.[0]?.rows?.[ri]?.cells?.[ci]
    if (!cell) return
    cell.size = clampSize(size)
  }

  function addCell(ri) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]?.rows?.[ri]) return
    const row = gc.layouts[0].rows[ri]
    const newCells = row.cells?.length ?? 0
    const sizes = equalSizes(newCells + 1)
    
    // Update cell sizes
    if (row.cells) {
      row.cells.forEach((c, i) => { c.size = sizes[i] })
    } else {
      row.cells = []
    }
    row.cells.push({ size: sizes[sizes.length - 1] })
    
    // Add content
    const cellId = `dashboard-cell-${ri + 1}-${newCells + 1}`
    gc.contents.push({ cell: cellId, component: 'DataTable', datasourceName: '/' })
  }

  function removeCell(ri, ci) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]?.rows?.[ri]) return
    if (!confirm(`Remove cell at Row "${ri + 1}" Column "${ci + 1}"?`)) return
    const row = gc.layouts[0].rows[ri]
    const cellId = `dashboard-cell-${ri + 1}-${ci + 1}`
    
    // Remove from cells
    row.cells?.splice(ci, 1)
    
    // Remove from contents
    const idx = gc.contents.findIndex(c => c.cell === cellId)
    if (idx !== -1) gc.contents.splice(idx, 1)
    
    // Rebalance sizes
    if (row.cells?.length) {
      const sizes = equalSizes(row.cells.length)
      row.cells.forEach((c, i) => { c.size = sizes[i] })
    }
  }

  function addRow() {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]) return
    const rows = gc.layouts[0].rows
    const sizes = equalSizes(rows.length + 1)
    
    // Update existing row sizes
    rows.forEach((r, i) => { r.size = sizes[i] })
    
    // Add new row
    rows.push({ 
      size: sizes[sizes.length - 1], 
      cells: [{ size: 100 }] 
    })
    
    // Add content for new cell
    const newRi = rows.length - 1
    gc.contents.push({ cell: `dashboard-cell-${newRi + 1}-1`, component: 'BarChart', datasourceName: '/' })
  }

  function removeRow(ri) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]) return
    const rows = gc.layouts[0].rows
    
    // Remove cells from this row
    const row = rows[ri]
    if (row?.cells) {
      row.cells.forEach((_, ci) => {
        const cellId = `dashboard-cell-${ri + 1}-${ci + 1}`
        const idx = gc.contents.findIndex(c => c.cell === cellId)
        if (idx !== -1) gc.contents.splice(idx, 1)
      })
    }
    
    // Remove row
    rows.splice(ri, 1)
    
    // Rebalance sizes
    if (rows.length) {
      const sizes = equalSizes(rows.length)
      rows.forEach((r, i) => { r.size = sizes[i] })
    }
  }

  function updateCellChart(ri, ci, chart) {
    console.log('updateCellChart called:', ri, ci, chart)
    const gc = getGridContainer()
    if (!gc?.contents) {
      console.log('No grid container')
      return
    }
    const cellId = `dashboard-cell-${ri + 1}-${ci + 1}`
    console.log('Looking for cell:', cellId)
    const content = gc.contents.find(c => c.cell === cellId)
    console.log('Found content:', content)
    if (content) {
      content.component = chart
      console.log('Updated to:', content)
    }
  }

  function updateCellDatasource(ri, ci, datasourceName) {
    const gc = getGridContainer()
    if (!gc?.contents) return
    const cellId = `dashboard-cell-${ri + 1}-${ci + 1}`
    const content = gc.contents.find(c => c.cell === cellId)
    if (content) content.datasourceName = datasourceName
  }

  // Writes chart-specific field values straight into the real stored cell,
  // same as updateCellChart/updateCellDatasource — so field edits can never be
  // silently discarded by a `gridRows` recompute triggered by another edit.
  function updateCellField(ri, ci, key, value) {
    const gc = getGridContainer()
    if (!gc?.contents) return
    const cellId = `dashboard-cell-${ri + 1}-${ci + 1}`
    const content = gc.contents.find(c => c.cell === cellId)
    if (content) content[key] = value
  }

  return {
    gridRows,
    addCell,
    removeCell,
    addRow,
    removeRow,
    updateCellChart,
    updateCellDatasource,
    updateCellField,
    updateRowSize,
    updateCellSize,
    cellId,
  }
}
