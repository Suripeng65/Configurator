export function parseGridRows(tab) {
    console.log(tab?.contents)
    if (!tab?.contents) return [{ size: 100, cells: [{ chart: 'BarChart', size: 100 }] }]
    
    const gc = tab.contents.find(c => c.component === 'GridContainer')
    if (!gc) return [{ size: 100, cells: [{ chart: 'BarChart', size: 100, chartMeta:{}, datasourcesName:"/" }] }]
    const rows     = gc.layouts?.[0]?.rows ?? []
    const contents = gc.contents ?? []
    if (!rows.length) return [{ size: 100, cells: [{ chart: 'BarChart', size: 100 , chartMeta:{}, datasourcesName:"/"}] }]
    console.log(">>>>>rows", rows)
    return rows.map((row, ri) => ({
      size: Number(row.size) || Math.floor(100 / rows.length),
      cells: (row.cells ?? []).map((cell, ci) => {
        const stored = contents.find(c => c.cell === `dashboard-cell-${ri + 1}-${ci + 1}`)
        return {
          chart: stored?.component ?? 'BarChart',
          size:  Number(cell.size) || Math.floor(100 / (row.cells?.length || 1)),
          datasourceName: stored?.datasourceName,
          chartMeta:{...stored}
        }
      }),
    }))
}

export function isFlatArray(v) {
  return Array.isArray(v) && v.every(x => x === null || typeof x !== 'object')
}
export function isMultiline(v) {
  return Array.isArray(v) || (v !== null && typeof v === 'object')
}