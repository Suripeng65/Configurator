import { computed } from 'vue'
import { parseGridRows } from '@src/utils/grid-row-parser'
import { ADAPT_COMPONENTS } from '@src/components/AdaptComponents/index'
import { getOwnFieldKeys } from '@src/components/AdaptComponents/schemaUtils'

export function useGridEditor(mainPanel, activeTabKey, {setValue}) {
  const gridRows = computed(() => {
    const key = activeTabKey.value
    if (!key || !mainPanel.value?.[key]) {
      return []
    }
    const rows = parseGridRows(mainPanel.value?.[key])
    if(!rows){ 
      console.log("Middle panel layout is not a GridContainer, trying the best effort")
      return null
    }
    // Seed each field with its previously-saved value (from chartMeta, the raw
    // stored cell) when one exists. Fields with no stored value are left
    // `undefined` so the input/radio renders empty, waiting for user input,
    // instead of pre-filling a schema default before the user has chosen one.
    for (const row of rows) {
      for (const cell of row.cells) {
        const schema = ADAPT_COMPONENTS[cell.chart]
        for (const key of getOwnFieldKeys(schema)) {
          if (cell[key] === undefined && key in (cell.chartMeta ?? {})) {
            cell[key] = cell.chartMeta[key]
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
    return Array.from({ length: n }, (_, i) => String(i < n - 1 ? base : 100 - base * (n - 1)))
  }
  function clampSize(size){
    return String(Math.max(5, Math.min(95, Number(size) || 5)))
  }

  function updateRowSizes(ri, size) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]?.rows) return
    const row = gc.layouts[0].rows[ri]
    row.size = clampSize(size)
  }

  function updateCellSize(ri, ci, size) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]?.rows?.[ri]?.cells?.[ci]) return
    const cell = gc.layouts[0].rows[ri].cells[ci]
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
    const newCellId = cellId(ri, newCells)
    row.cells.push({id:newCellId, size: sizes[sizes.length - 1] })
    
    // Add content
    // const _cellId = `dashboard-cell-${ri + 1}-${newCells + 1}`
    gc.contents.push({ cell: newCellId, component: 'BarChart'/*, datasourceName:'/'*/ })
  }

  /** Rebase cell IDs in row `ri` starting from column `fromCi` to match new positions. */
  function rebaseCellIdsInRow(ri, fromCi) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]?.rows?.[ri]?.cells) return
    const cells = gc.layouts[0].rows[ri].cells
    for (let i = fromCi; i < cells.length; i++) {
      const oldId = cells[i].id
      const newId = cellId(ri, i)
      if (oldId === newId) continue
      cells[i].id = newId
      // Update the corresponding content entry
      const content = gc.contents.find(c => c.cell === oldId)
      if (content) content.cell = newId
    }
  }

  function removeCell(ri, ci) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]?.rows?.[ri]) return
    if (!confirm(`Remove cell at Row "${ri + 1}" Column "${ci + 1}"?`)) return
    const row = gc.layouts[0].rows[ri]
    const targetId = cellId(ri, ci)
    
    // Remove from cells
    row.cells?.splice(ci, 1)
    
    // Remove from contents
    const idx = gc.contents.findIndex(c => c.cell === targetId)
    if (idx !== -1) gc.contents.splice(idx, 1)
    
    // Rebase IDs of cells that shifted position
    rebaseCellIdsInRow(ri, ci)
    
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
    const newRi = rows.length
    const newCellId = cellId(newRi, 0)
    rows.push({ 
      size: sizes[sizes.length - 1], 
      cells: [{ size: 100, id:newCellId }] 
    })
    
    // Add content for new cell
    // const newRi = rows.length - 1
    gc.contents.push({ cell: newCellId, component: 'BarChart'/*, datasourceName:'/'*/ })
  }

  function removeRow(ri) {
    const gc = getGridContainer()
    if (!gc?.layouts?.[0]) return
    const rows = gc.layouts[0].rows
    
    // Remove cells from this row
    const row = rows[ri]
    if (row?.cells) {
      row.cells.forEach((_, ci) => {
        const targetId = cellId(ri, ci)
        const idx = gc.contents.findIndex(c => c.cell === targetId)
        if (idx !== -1) gc.contents.splice(idx, 1)
      })
    }
    
    // Remove row
    rows.splice(ri, 1)
    
    // Rebase cell IDs in all rows that shifted up
    for (let r = ri; r < rows.length; r++) {
      rebaseCellIdsInRow(r, 0)
    }
    
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
  function updateCellField(ri, ci, key, value){
    const gc = getGridContainer()
    if(!gc.contents) return
    const cellId = `dashboard-cell-${ri + 1}-${ci + 1}`
    const content = gc.contents.find(c => c.cell === cellId)
    if(content) content[key] = value
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
    updateCellField,
    clampSize,
    updateCellSize,
    updateRowSizes,
  }
}
