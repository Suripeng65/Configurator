// Returns null when `tab` isn't in the standard GridContainer shape (missing
// entirely, or an out-of-date/differently-structured template) instead of
// fabricating a fake default row — callers should fall back to rendering the
// tab's raw contents (e.g. via ComponentNode) rather than hiding real data
// behind synthesized grid state.
export function parseGridRows(tab) {
    if (!tab?.contents) return null

    const gc = tab.contents.find(c => c.component === 'GridContainer')
    if (!gc) return null
    const rows     = gc.layouts?.[0]?.rows ?? []
    const contents = gc.contents ?? []
    if (!rows.length) return [{ size: 100, cells: [{ chart: 'BarChart', size: 100, chartMeta:{}, datasourceName:"/" }] }]
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