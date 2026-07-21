<template>
  <div class="tab-content-wrap">
    <div class="content-body">

      <!-- Dashboard layout builder -->
      <div class="form-section">
        <div class="section-header">
          <div class="section-title">Dashboard Layout</div>
          <span class="section-hint">Rows are horizontal bands. Cells within a row split it vertically.</span>
        </div>

        <div class="grid-preview">
          <div
            v-for="(row, ri) in gridRows"
            :key="ri"
            class="preview-row"
            :style="{ flex: row.size }"
          >
            <div
              v-for="(cell, ci) in row.cells"
              :key="ci"
              class="preview-cell"
              :style="{ flex: cell.size }"
            >
              <span class="cell-id-label">{{ cellId(ri, ci) }}</span>
              <select v-model="cell.chart" class="cell-chart-select">
                <option v-for="c in CHART_TYPES" :key="c.v" :value="c.v">{{ c.l }}</option>
                <optgroup v-if="adaptChartTypes.length" label="Adapt Library">
                  <option v-for="c in adaptChartTypes" :key="c.v" :value="c.v">{{ c.l }}</option>
                </optgroup>
              </select>
              <div class="cell-footer">
                <label class="size-label">
                  w <input v-model.number="cell.size" type="number" min="5" max="95" class="size-input" @change="clampCellSizes(ri)" /> %
                </label>
                <button v-if="row.cells.length > 1" class="cell-remove" @click="removeCell(ri, ci)" title="Remove cell">×</button>
              </div>
            </div>
          </div>
        </div>

        <div class="row-controls">
          <div v-for="(row, ri) in gridRows" :key="ri" class="row-control">
            <span class="row-control-label">Row {{ ri + 1 }}</span>
            <label class="size-label">
              h <input v-model.number="row.size" type="number" min="5" max="95" class="size-input" @change="clampRowSizes" /> %
            </label>
            <button class="row-action-btn" :disabled="row.cells.length >= 4" @click="addCell(ri)">+ cell</button>
            <button class="row-action-btn row-action-btn--danger" :disabled="gridRows.length === 1" @click="removeRow(ri)">× row</button>
          </div>
        </div>

        <button class="add-row-btn" :disabled="gridRows.length >= 6" @click="addRow">+ Add Row</button>
      </div>

      <!-- Cell configuration -->
      <div v-if="storedCells.length" class="form-section">
        <div class="section-header">
          <div class="section-title">Cell Configuration</div>
          <span class="section-hint">Set field values for each chart cell in this tab.</span>
        </div>

        <div v-for="(cell, ci) in storedCells" :key="ci" class="cell-config">
          <div class="cell-config-header">
            <code class="cell-id-tag">{{ cell.cell }}</code>
            <span class="cell-type-tag">{{ adaptLibrary[cell.component]?.label ?? cell.component }}</span>
          </div>
          <div v-if="adaptLibrary[cell.component]?.fields?.length" class="cell-fields">
            <div v-for="field in adaptLibrary[cell.component].fields" :key="field.key" class="cell-field-row">
              <label class="cell-field-label">{{ field.key }}</label>
              <select
                v-if="field.type === 'datasource'"
                class="cell-field-select"
                :value="cell[field.key] ?? '/'"
                @change="setCellField(ci, field.key, $event.target.value)"
              >
                <option value="/">/ (default)</option>
                <option v-for="ds in storedDatasources" :key="ds" :value="ds">{{ ds }}</option>
              </select>
              <input
                v-else-if="field.type === 'number'"
                type="number"
                class="cell-field-input"
                :value="cell[field.key] ?? (field.default ?? 0)"
                @change="setCellField(ci, field.key, Number($event.target.value))"
              />
              <input
                v-else-if="field.type === 'boolean'"
                type="checkbox"
                class="cell-field-check"
                :checked="cell[field.key] ?? (field.default ?? false)"
                @change="setCellField(ci, field.key, $event.target.checked)"
              />
              <input
                v-else
                class="cell-field-input"
                :value="cell[field.key] ?? (field.default ?? '')"
                @change="setCellField(ci, field.key, $event.target.value)"
              />
            </div>
          </div>
          <div v-else class="cell-no-def">"{{ cell.component }}" has no adapt library fields defined.</div>
        </div>
      </div>

      <div class="save-bar">
        <button class="btn-save" @click="save">Save Layout</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useLayoutEditor } from '../../composables/useLayoutEditor.js'

const props = defineProps({
  tabKey: { type: String, required: true },
})

const meta = inject('meta')
const { setValue } = useLayoutEditor(meta)

const mainPanel       = computed(() => meta?.value?.layout?.viz?.['main-panel'] ?? null)
const adaptLibrary    = computed(() => meta?.value?.layout?.adaptLibrary ?? {})
const adaptChartTypes = computed(() =>
  Object.entries(adaptLibrary.value).map(([v, def]) => ({ v, l: def.label || v }))
)
const existingTab = computed(() => mainPanel.value?.[props.tabKey] ?? null)

const CHART_TYPES = [
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

// ── Grid state ────────────────────────────────────────────────────────────────
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
      const stored = contents.find(c => c.cell === `dashboard-cell-${ri + 1}-${ci + 1}`)
      return {
        chart: stored?.component ?? 'BarChart',
        size:  Number(cell.size) || Math.floor(100 / (row.cells?.length || 1)),
      }
    }),
  }))
}

const gridRows = ref(parseGridRows(existingTab.value))

function cellId(ri, ci) { return `dashboard-cell-${ri + 1}-${ci + 1}` }

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

// ── Cell configuration ────────────────────────────────────────────────────────
function getGcIndex() {
  return (existingTab.value?.contents ?? []).findIndex(c => c.component === 'GridContainer')
}

const storedCells = computed(() => {
  const gcIdx = getGcIndex()
  if (gcIdx < 0) return []
  return existingTab.value?.contents?.[gcIdx]?.contents ?? []
})

const storedDatasources = computed(() =>
  (existingTab.value?.datasources ?? []).map(ds => ds.name).filter(n => n && n !== '/')
)

function setCellField(cellIndex, fieldKey, value) {
  const gcIdx = getGcIndex()
  if (gcIdx < 0) return
  setValue(['viz', 'main-panel', props.tabKey, 'contents', gcIdx, 'contents', cellIndex, fieldKey], value)
}

// ── Build & save ──────────────────────────────────────────────────────────────
const FIELD_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }

function buildTabConfig() {
  const title = existingTab.value?.title ?? props.tabKey

  const layoutRows = gridRows.value.map((row, ri) => ({
    size: String(row.size),
    cells: row.cells.map((cell, ci) => {
      const obj = { id: cellId(ri, ci) }
      if (row.cells.length > 1) obj.size = String(cell.size)
      return obj
    }),
  }))

  const existingGc    = existingTab.value?.contents?.find(c => c.component === 'GridContainer')
  const existingCells = existingGc?.contents ?? []

  const contents = []
  gridRows.value.forEach((row, ri) => {
    row.cells.forEach((cell, ci) => {
      const id         = cellId(ri, ci)
      const prev       = existingCells.find(c => c.cell === id)
      const cellConfig = { ...(prev ?? {}), cell: id, component: cell.chart }
      const adaptDef   = adaptLibrary.value[cell.chart]
      if (adaptDef) {
        for (const field of adaptDef.fields ?? []) {
          if (!(field.key in cellConfig)) {
            cellConfig[field.key] = field.default !== undefined
              ? field.default
              : (FIELD_DEFAULTS[field.type] ?? '')
          }
        }
      }
      if (!('datasourceName' in cellConfig)) cellConfig.datasourceName = '/'
      contents.push(cellConfig)
    })
  })

  const base = existingTab.value ?? {}
  return {
    ...base,
    title,
    component: 'TabWrapper',
    contents: [{ layouts: [{ id: 'layout-1', rows: layoutRows }], contents, component: 'GridContainer' }],
    datasources: base.datasources ?? [{ name: '/', component: 'Datasource', 'dql-metrics': [], 'flat-table-target': '' }],
    'right-panel':     base['right-panel']     ?? { 'tab-array': [], defaultTab: null },
    'generate-report': base['generate-report'] ?? [],
  }
}

function save() {
  setValue(['viz', 'main-panel', props.tabKey], buildTabConfig())
}
</script>

<style scoped>
.tab-content-wrap { display: flex; flex-direction: column; height: 100%; }
.content-body { flex: 1; overflow-y: auto; padding: 20px 28px 32px; }

.form-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.section-title { font-size: 13px; font-weight: 700; color: #374151; }
.section-hint  { font-size: 11px; color: #9ca3af; }

/* ── Grid preview ── */
.grid-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  height: 200px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fb;
}
.preview-row { display: flex; gap: 3px; padding: 3px; min-height: 0; }
.preview-cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 4px;
  background: #fff;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  padding: 6px 8px;
  min-width: 0;
  overflow: hidden;
}
.cell-id-label {
  font-size: 9px;
  font-family: monospace;
  color: #6366f1;
  background: #eff6ff;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: flex-start;
}
.cell-chart-select { border: 1px solid #e5e7eb; border-radius: 4px; font-size: 11px; padding: 2px 4px; background: #fff; flex: 1; min-width: 0; cursor: pointer; }
.cell-chart-select:focus { border-color: #6366f1; outline: none; }
.cell-footer { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.cell-remove { background: none; color: #d1d5db; font-size: 14px; line-height: 1; padding: 0 2px; }
.cell-remove:hover { color: #dc2626; }

.row-controls { display: flex; flex-direction: column; gap: 4px; }
.row-control { display: flex; align-items: center; gap: 8px; font-size: 12px; background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 6px; padding: 6px 10px; }
.row-control-label { color: #6b7280; width: 46px; flex-shrink: 0; font-size: 11px; }
.size-label { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #6b7280; }
.size-input { width: 44px; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px 4px; font-size: 11px; text-align: center; }
.size-input:focus { border-color: #6366f1; outline: none; }
.row-action-btn { font-size: 11px; padding: 3px 9px; border-radius: 5px; background: #f3f4f6; color: #374151; }
.row-action-btn:hover:not(:disabled) { background: #e5e7eb; }
.row-action-btn:disabled { opacity: 0.35; cursor: default; }
.row-action-btn--danger:hover:not(:disabled) { background: #fee2e2; color: #dc2626; }
.add-row-btn { align-self: flex-start; background: none; border: 1px dashed #c4b5fd; color: #7c3aed; padding: 5px 14px; border-radius: 6px; font-size: 12px; }
.add-row-btn:hover:not(:disabled) { background: #f5f3ff; }
.add-row-btn:disabled { opacity: 0.35; cursor: default; }

/* ── Cell configuration ── */
.cell-config { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
.cell-config + .cell-config { margin-top: 8px; }
.cell-config-header { display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; }
.cell-id-tag { font-size: 10px; font-family: monospace; color: #6366f1; background: #eff6ff; padding: 1px 6px; border-radius: 3px; }
.cell-type-tag { font-size: 11px; font-weight: 600; color: #374151; }
.cell-fields { display: flex; flex-direction: column; background: #fff; }
.cell-field-row { display: grid; grid-template-columns: 170px 1fr; align-items: center; gap: 8px; padding: 6px 12px; border-top: 1px solid #f0f0f0; }
.cell-field-label { font-size: 11px; font-family: monospace; color: #6b7280; }
.cell-field-input { border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 8px; font-size: 12px; background: #fff; max-width: 260px; }
.cell-field-input:focus { border-color: #6366f1; outline: none; }
.cell-field-select { border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 8px; font-size: 12px; background: #fff; max-width: 260px; }
.cell-field-select:focus { border-color: #6366f1; outline: none; }
.cell-field-check { width: 14px; height: 14px; cursor: pointer; accent-color: #4f46e5; }
.cell-no-def { font-size: 11px; color: #9ca3af; padding: 10px 12px; font-style: italic; }

/* ── Save ── */
.save-bar { padding-top: 4px; }
.btn-save { background: #4f46e5; color: #fff; font-size: 13px; font-weight: 500; padding: 8px 24px; border-radius: 6px; }
.btn-save:hover { background: #4338ca; }
</style>
