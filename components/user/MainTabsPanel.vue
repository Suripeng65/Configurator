<template>
  <div class="panel">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">Visualization Tabs</h2>
        <p class="panel-subtitle">Reorder, rename, or remove chart tabs. The ★ tab loads by default.</p>
      </div>
    </div>

    <div v-if="!mainPanel" class="empty-state">No main panel configuration found.</div>

    <div v-else class="tab-list">
      <div
        v-for="(tab, index) in tabList"
        :key="tab.key"
        class="tab-card"
        :class="{ 'is-default': tab.key === defaultTab }"
      >
        <button
          class="star-btn"
          :class="{ active: tab.key === defaultTab }"
          :title="tab.key === defaultTab ? 'Default tab' : 'Set as default'"
          @click="setDefault(tab.key)"
        >★</button>

        <div class="tab-info">
          <input
            :value="tab.title"
            class="tab-title-input"
            placeholder="Tab title"
            @change="setTitle(tab.key, $event.target.value)"
          />
          <span class="tab-key">{{ tab.key }}</span>
        </div>

        <span class="chart-badge">{{ chartTypeLabel(tab.key) }}</span>

        <div class="tab-actions">
          <button :disabled="index === 0" class="icon-btn" @click="moveTab(index, index - 1)" title="Move up">↑</button>
          <button :disabled="index === tabList.length - 1" class="icon-btn" @click="moveTab(index, index + 1)" title="Move down">↓</button>
          <button class="icon-btn delete" @click="removeTab(index, tab.key)" title="Remove tab">✕</button>
        </div>
      </div>

      <!-- Grid-builder add-tab form -->
      <div v-if="addingTab" class="add-tab-form">
        <h3 class="form-title">New Tab</h3>

        <!-- Basics -->
        <div class="form-basics">
          <div class="form-field">
            <label class="form-label">Title</label>
            <input v-model="newTabTitle" class="input-field" placeholder="e.g. Line Chart Overview" />
          </div>
          <div class="form-field">
            <label class="form-label">Key <span class="hint">(no spaces)</span></label>
            <input v-model="newTabKey" class="input-field" placeholder="e.g. line_overview" />
          </div>
        </div>

        <!-- Grid builder -->
        <div class="grid-builder">
          <div class="grid-builder-header">
            <span class="grid-title">Dashboard Layout</span>
            <span class="grid-hint">Each row is a horizontal band. Cells within a row split it vertically.</span>
          </div>

          <!-- Visual preview -->
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
                <select v-model="cell.chart" class="cell-chart-select" @click.stop>
                  <option v-for="c in CHART_TYPES" :key="c.v" :value="c.v">{{ c.l }}</option>
                  <optgroup v-if="adaptChartTypes.length" label="Adapt Library">
                    <option v-for="c in adaptChartTypes" :key="c.v" :value="c.v">{{ c.l }}</option>
                  </optgroup>
                </select>
                <div class="cell-footer">
                  <label class="size-label">
                    w <input v-model.number="cell.size" type="number" min="5" max="95" class="size-input" @change="clampCellSizes(ri)" />%
                  </label>
                  <button v-if="row.cells.length > 1" class="cell-remove" @click="removeCell(ri, ci)" title="Remove cell">×</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Per-row controls -->
          <div class="row-controls">
            <div v-for="(row, ri) in gridRows" :key="ri" class="row-control">
              <span class="row-control-label">Row {{ ri + 1 }}</span>
              <label class="size-label">
                h <input v-model.number="row.size" type="number" min="5" max="95" class="size-input" @change="clampRowSizes" />%
              </label>
              <button class="row-action-btn" @click="addCell(ri)" :disabled="row.cells.length >= 4" title="Split row horizontally">+ cell</button>
              <button class="row-action-btn row-action-btn--danger" @click="removeRow(ri)" :disabled="gridRows.length === 1" title="Remove row">× row</button>
            </div>
          </div>

          <button class="add-row-btn" :disabled="gridRows.length >= 6" @click="addRow">+ Add Row</button>
        </div>

        <p v-if="addError" class="add-error">{{ addError }}</p>
        <div class="form-actions">
          <button class="btn-confirm" @click="confirmAddTab">Create Tab</button>
          <button class="btn-cancel-sm" @click="addingTab = false">Cancel</button>
        </div>
      </div>

      <!-- Orphan tabs: exist in config but not yet in tab-array -->
      <div v-for="key in orphanTabKeys" :key="'orphan-' + key" class="tab-card tab-card--orphan">
        <div class="orphan-badge">⚠ Unregistered</div>
        <div class="tab-info">
          <span class="tab-title-orphan">{{ mainPanel[key]?.title ?? key }}</span>
          <span class="tab-key">{{ key }}</span>
        </div>
        <button class="register-btn" @click="registerTab(key)" title="Add to tab list">Register Tab →</button>
      </div>

      <button v-if="!addingTab" class="add-tab-btn" @click="startAddTab">+ Add Tab</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTemplateStore } from '@src/stores/template'

// Keys that are structural properties of main-panel, not tab configs
const MAIN_PANEL_META_KEYS = new Set(['tab-array', 'tabs', 'defaultTab', 'datasources', 'component'])

const CHART_LABELS = {
  BarChart: 'Bar Chart', PieChart: 'Pie Chart', LineChart: 'Line Chart',
  StackedBarChart: 'Stacked Bar', StackedAreaChart: 'Stacked Area',
  DonutChart: 'Donut', ScatterplotChart: 'Scatterplot', TreemapChart: 'Treemap',
  DataTable: 'Data Table',
}

const store = useTemplateStore()

const adaptLibrary    = computed(() => store.template?.layout?.adaptLibrary ?? {})
const adaptChartTypes = computed(() =>
  Object.entries(adaptLibrary.value).map(([v, def]) => ({ v, l: def.label || v }))
)

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

const addingTab  = ref(false)
const newTabTitle = ref('')
const newTabKey   = ref('')
const addError    = ref('')

// Grid builder state — list of rows, each with size (height %) and cells
const gridRows = ref([{ size: 100, cells: [{ chart: 'BarChart', size: 100 }] }])

const mainPanel = computed(() => store.template?.layout?.viz?.['main-panel'] ?? null)
const tabList = computed(() => {
  if (!mainPanel.value) return []
  return (mainPanel.value['tab-array'] ?? [])
    .filter(key => mainPanel.value[key] != null)   // skip keys deleted from the config object
    .map(key => ({ key, title: mainPanel.value[key]?.title ?? key }))
})
const defaultTab = computed(() => mainPanel.value?.defaultTab ?? null)

// Tab config objects that exist in main-panel but aren't listed in tab-array yet
const orphanTabKeys = computed(() => {
  if (!mainPanel.value) return []
  const registered = new Set(mainPanel.value['tab-array'] ?? [])
  return Object.keys(mainPanel.value).filter(k =>
    !registered.has(k) &&
    !MAIN_PANEL_META_KEYS.has(k) &&
    mainPanel.value[k] !== null &&
    typeof mainPanel.value[k] === 'object' &&
    'title' in mainPanel.value[k]
  )
})

function chartTypeLabel(tabKey) {
  const tab = mainPanel.value?.[tabKey]
  if (!tab?.contents) return ''
  const allLabels = {
    ...CHART_LABELS,
    ...Object.fromEntries(Object.entries(adaptLibrary.value).map(([k, d]) => [k, d.label || k]))
  }
  const charts = []
  const walk = (arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach(c => {
      if (c.component && allLabels[c.component]) charts.push(allLabels[c.component])
      walk(c.contents)
    })
  }
  walk(tab.contents)
  return [...new Set(charts)].slice(0, 2).join(' + ')
}

function setTitle(tabKey, title) {
  store.setValue(['viz', 'main-panel', tabKey, 'title'], title)
}

function setDefault(tabKey) {
  store.setValue(['viz', 'main-panel', 'defaultTab'], tabKey)
}

function moveTab(fromIndex, toIndex) {
  store.moveItem(['viz', 'main-panel', 'tab-array'], fromIndex, toIndex)
  store.moveItem(['viz', 'main-panel', 'tabs'], fromIndex, toIndex)
}

function removeTab(index, tabKey) {
  if (!confirm(`Remove tab "${tabKey}"?`)) return
  store.deleteNode(['viz', 'main-panel', 'tab-array', index])
  const tabsIdx = (mainPanel.value?.tabs ?? []).indexOf(tabKey)
  if (tabsIdx >= 0) store.deleteNode(['viz', 'main-panel', 'tabs', tabsIdx])
  if (defaultTab.value === tabKey && mainPanel.value?.['tab-array']?.length) {
    store.setValue(['viz', 'main-panel', 'defaultTab'], mainPanel.value['tab-array'][0])
  }
}

function registerTab(key) {
  const tabArrayLen = mainPanel.value['tab-array']?.length ?? 0
  const tabsLen = mainPanel.value['tabs']?.length ?? 0
  store.addChild(['viz', 'main-panel', 'tab-array'], null, 'string')
  store.setValue(['viz', 'main-panel', 'tab-array', tabArrayLen], key)
  store.addChild(['viz', 'main-panel', 'tabs'], null, 'string')
  store.setValue(['viz', 'main-panel', 'tabs', tabsLen], key)
}

// ── Grid builder helpers ──────────────────────────────────────────────────────
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
  const sizes = equalSizes(gridRows.value.length)
  gridRows.value.forEach((r, i) => { r.size = sizes[i] })
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
  const sizes = equalSizes(cells.length)
  cells.forEach((c, i) => { c.size = sizes[i] })
}

function clampRowSizes() {
  gridRows.value.forEach(r => { r.size = Math.max(5, Math.min(95, r.size || 5)) })
}

function clampCellSizes(ri) {
  gridRows.value[ri].cells.forEach(c => { c.size = Math.max(5, Math.min(95, c.size || 5)) })
}

// ── Build final tab config from grid state ────────────────────────────────────
function buildGridTabConfig(title) {
  const layoutRows = gridRows.value.map((row, ri) => ({
    size: String(row.size),
    cells: row.cells.map((cell, ci) => {
      const obj = { id: cellId(ri, ci) }
      if (row.cells.length > 1) obj.size = String(cell.size)
      return obj
    }),
  }))

  const FIELD_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }
  const contents = []
  gridRows.value.forEach((row, ri) => {
    row.cells.forEach((cell, ci) => {
      const cellConfig = { cell: cellId(ri, ci), component: cell.chart, datasourceName: '/' }
      const adaptDef = adaptLibrary.value[cell.chart]
      if (adaptDef) {
        for (const field of adaptDef.fields ?? []) {
          if (!(field.key in cellConfig)) {
            cellConfig[field.key] = field.default !== undefined ? field.default : (FIELD_DEFAULTS[field.type] ?? '')
          }
        }
      }
      contents.push(cellConfig)
    })
  })

  return {
    title,
    component: 'TabWrapper',
    contents: [{ layouts: [{ id: 'layout-1', rows: layoutRows }], contents, component: 'GridContainer' }],
    datasources: [{ name: '/', component: 'Datasource', 'dql-metrics': [], 'flat-table-target': '' }],
    'right-panel': { 'tab-array': [], defaultTab: null },
    'generate-report': [],
  }
}

// ── startAddTab / confirmAddTab ───────────────────────────────────────────────
function startAddTab() {
  newTabTitle.value = ''
  newTabKey.value   = ''
  addError.value    = ''
  gridRows.value    = [{ size: 100, cells: [{ chart: 'BarChart', size: 100 }] }]
  addingTab.value   = true
}

function confirmAddTab() {
  const key   = newTabKey.value.trim().replace(/\s+/g, '_')
  const title = newTabTitle.value.trim()
  if (!key || !title) { addError.value = 'Title and key are required.'; return }
  if (mainPanel.value?.[key]) { addError.value = `Key "${key}" already exists.`; return }

  const tabConfig = buildGridTabConfig(title)
  const tabArrayLen = mainPanel.value['tab-array']?.length ?? 0
  const tabsLen     = mainPanel.value['tabs']?.length ?? 0

  store.addChild(['viz', 'main-panel'], key, 'object')
  store.setValue(['viz', 'main-panel', key], tabConfig)
  store.addChild(['viz', 'main-panel', 'tab-array'], null, 'string')
  store.setValue(['viz', 'main-panel', 'tab-array', tabArrayLen], key)
  store.addChild(['viz', 'main-panel', 'tabs'], null, 'string')
  store.setValue(['viz', 'main-panel', 'tabs', tabsLen], key)

  addingTab.value = false
}
</script>

<style scoped>
.panel { padding: 28px 32px; max-width: 860px; }
.panel-header { margin-bottom: 24px; }
.panel-title  { font-size: 18px; font-weight: 700; color: #111; }
.panel-subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }

.tab-list { display: flex; flex-direction: column; gap: 8px; }

.tab-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tab-card:hover { border-color: #c7d2fe; box-shadow: 0 1px 4px rgba(99,102,241,0.08); }
.tab-card.is-default { border-color: #fbbf24; background: #fffbeb; }

.star-btn { font-size: 18px; color: #d1d5db; background: none; padding: 0 2px; line-height: 1; }
.star-btn.active { color: #f59e0b; }
.star-btn:hover:not(.active) { color: #fbbf24; }

.tab-info { flex: 1; min-width: 0; }
.tab-title-input {
  border: 1px solid transparent;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #111;
  width: 100%;
  padding: 2px 4px;
  border-radius: 4px;
}
.tab-title-input:focus, .tab-title-input:hover { border-color: #d1d5db; background: #fff; }

.tab-key { display: block; font-size: 11px; color: #9ca3af; font-family: monospace; margin-top: 2px; padding: 0 4px; }

.chart-badge {
  font-size: 11px;
  background: #f3f4f6;
  color: #374151;
  padding: 3px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-actions { display: flex; gap: 4px; flex-shrink: 0; }
.icon-btn {
  width: 26px; height: 26px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover:not(:disabled) { background: #e5e7eb; }
.icon-btn:disabled { opacity: 0.3; cursor: default; }
.icon-btn.delete:hover:not(:disabled) { background: #fee2e2; color: #dc2626; }

.add-tab-btn {
  align-self: flex-start;
  background: none;
  border: 2px dashed #d1d5db;
  color: #6b7280;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 4px;
  width: 100%;
}
.add-tab-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

.add-tab-form {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-title { font-size: 15px; font-weight: 700; color: #1e2a3a; margin: 0; }

.form-basics { display: flex; gap: 12px; flex-wrap: wrap; }
.form-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px; }
.form-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
.hint { font-weight: 400; color: #9ca3af; text-transform: none; letter-spacing: 0; }

.input-field {
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}
.input-field:focus { border-color: #6366f1; outline: none; }

/* Grid builder */
.grid-builder { display: flex; flex-direction: column; gap: 10px; }
.grid-builder-header { display: flex; align-items: baseline; gap: 10px; }
.grid-title { font-size: 13px; font-weight: 600; color: #374151; }
.grid-hint  { font-size: 11px; color: #9ca3af; }

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

.preview-row {
  display: flex;
  gap: 3px;
  padding: 3px;
  min-height: 0;
}

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

.cell-chart-select {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  padding: 2px 4px;
  background: #fff;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.cell-chart-select:focus { border-color: #6366f1; outline: none; }

.cell-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.cell-remove {
  background: none;
  color: #d1d5db;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
}
.cell-remove:hover { color: #dc2626; }

/* Row controls */
.row-controls { display: flex; flex-direction: column; gap: 4px; }
.row-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 6px 10px;
}
.row-control-label { color: #6b7280; width: 46px; flex-shrink: 0; font-size: 11px; }

.size-label {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #6b7280;
}
.size-input {
  width: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 11px;
  text-align: center;
}
.size-input:focus { border-color: #6366f1; outline: none; }

.row-action-btn {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 5px;
  background: #f3f4f6;
  color: #374151;
}
.row-action-btn:hover:not(:disabled) { background: #e5e7eb; }
.row-action-btn:disabled { opacity: 0.35; cursor: default; }
.row-action-btn--danger:hover:not(:disabled) { background: #fee2e2; color: #dc2626; }

.add-row-btn {
  align-self: flex-start;
  background: none;
  border: 1px dashed #c4b5fd;
  color: #7c3aed;
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
}
.add-row-btn:hover:not(:disabled) { background: #f5f3ff; }
.add-row-btn:disabled { opacity: 0.35; cursor: default; }

.form-actions { display: flex; gap: 8px; align-items: center; }
.btn-confirm { background: #4f46e5; color: #fff; padding: 7px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; }
.btn-confirm:hover { background: #4338ca; }
.btn-cancel-sm { background: none; color: #6b7280; padding: 6px 10px; font-size: 13px; }
.add-error { color: #dc2626; font-size: 12px; margin: 0; }

.tab-card--orphan {
  border-color: #fcd34d;
  background: #fffbeb;
  opacity: 0.9;
}

.orphan-badge {
  font-size: 10px;
  font-weight: 700;
  color: #92400e;
  background: #fde68a;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-title-orphan {
  font-size: 14px;
  font-weight: 600;
  color: #78350f;
  padding: 2px 4px;
}

.register-btn {
  background: #f59e0b;
  color: #fff;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.register-btn:hover { background: #d97706; }

.empty-state { color: #9ca3af; padding: 40px; text-align: center; }
</style>
