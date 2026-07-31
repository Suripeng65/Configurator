import { computed } from 'vue'
import { parseGridRows } from '@src/utils/grid-row-parser'

export function useGridEditor(mainPanel, activeTabKey, adaptLibrary, {setValue}) {
  const gridRows = computed(() => {
    const key = activeTabKey.value
    if (!key || !mainPanel.value?.[key]) {
      return []
    }
    return parseGridRows(mainPanel.value?.[key])
  })
  const FIELD_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }
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
    gc.contents.push({ cell: cellId, component: 'DataTable' })
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
    gc.contents.push({ cell: `dashboard-cell-${newRi + 1}-1`, component: 'BarChart' })
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

  return {
    gridRows,
    addCell,
    removeCell,
    addRow,
    removeRow,
    updateCellChart,
    updateCellDatasource,
    cellId,
  }
}
