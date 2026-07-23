<template>
  <div class="layout-editor">

    <!-- Left: monitor parameters (inlined) -->
    <aside class="left-pane">
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Monitor Parameters</h2>
          <p class="panel-subtitle">
            Edit the left-panel filter sections. Double-click any section name to rename it.
            Expand a section to add filters, dropdowns, or nested groups.
          </p>
        </div>

        <ComponentNode
          v-if="monitorPanel"
          :item="monitorPanel"
          :path="monitorPanelPath"
          :depth="0"
        />
        <p v-else class="text-muted small fst-italic px-1 mt-3">No MonitorPanel found in left-panel config.</p>
      </div>
    </aside>

    <div class="pane-divider" />

    <!-- Right: visualization tabs -->
    <BTabs
      v-model="activeTabIndex"
      class="right-pane"
      nav-class="layout-tab-nav"
      content-class="layout-tab-content"
    >
      <BTab v-for="(tab, i) in tabList" :key="tab.key">
        <template #title>
          <input
            v-if="editingTab === tab.key"
            v-model="editTitle"
            v-focus
            class="tab-title-input"
            @click.stop
            @mousedown.stop
            @blur="commitEdit"
            @keyup.enter="commitEdit"
            @keyup.escape="cancelEdit"
          />
          <span v-else @dblclick.stop="startEdit(tab.key, tab.title)">{{ tab.title }}</span>
          <span
            v-if="activeTabIndex === i && editingTab !== tab.key"
            class="tab-close ms-2"
            @click.stop="deleteTab(tab.key)"
            title="Delete tab"
          >×</span>
        </template>

        <!-- Tab body -->
        <div class="content-body">

          <!-- Grid builder -->
          <BCard class="mb-3">
            <template #header>
              <div class="d-flex align-items-baseline gap-2 flex-wrap">
                <strong class="small">Dashboard Layout</strong>
                <span class="text-muted" style="font-size:11px">Rows are horizontal bands. Cells within a row split it vertically.</span>
              </div>
            </template>

            <div class="grid-preview mb-3">
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
                  <BFormSelect v-model="cell.chart" size="sm">
                    <option v-for="c in CHART_TYPES" :key="c.v" :value="c.v">{{ c.l }}</option>
                    <optgroup v-if="adaptChartTypes.length" label="Adapt Library">
                      <option v-for="c in adaptChartTypes" :key="c.v" :value="c.v">{{ c.l }}</option>
                    </optgroup>
                  </BFormSelect>
                  <div class="d-flex align-items-center justify-content-between gap-1 mt-1">
                    <BInputGroup size="sm">
                      <BInputGroupText>w</BInputGroupText>
                      <BFormInput type="number" v-model.number="cell.size" min="5" max="95" style="width:46px" @change="clampCellSizes(ri)" />
                      <BInputGroupText>%</BInputGroupText>
                    </BInputGroup>
                    <BButton v-if="row.cells.length > 1" variant="link" size="sm" class="text-danger p-0 lh-1" @click="removeCell(ri, ci)" title="Remove cell">×</BButton>
                  </div>
                </div>
              </div>
            </div>

            <div class="d-flex flex-column gap-1 mb-3">
              <div v-for="(row, ri) in gridRows" :key="ri" class="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded">
                <span class="text-muted small" style="min-width:46px">Row {{ ri + 1 }}</span>
                <BInputGroup size="sm" style="width:auto">
                  <BInputGroupText>h</BInputGroupText>
                  <BFormInput type="number" v-model.number="row.size" min="5" max="95" style="width:50px" @change="clampRowSizes" />
                  <BInputGroupText>%</BInputGroupText>
                </BInputGroup>
                <BButton size="sm" variant="outline-secondary" :disabled="row.cells.length >= 4" @click="addCell(ri)">+ cell</BButton>
                <BButton size="sm" variant="outline-danger" :disabled="gridRows.length === 1" @click="removeRow(ri)">× row</BButton>
              </div>
            </div>

            <BButton variant="outline-secondary" size="sm" :disabled="gridRows.length >= 6" @click="addRow">+ Add Row</BButton>
          </BCard>

          <!-- Cell configuration -->
          <BCard v-if="storedCells.length" class="mb-3">
            <template #header>
              <div class="d-flex align-items-baseline gap-2 flex-wrap">
                <strong class="small">Cell Configuration</strong>
                <span class="text-muted" style="font-size:11px">Set field values for each chart cell in this tab.</span>
              </div>
            </template>

            <div v-for="(cell, ci) in storedCells" :key="ci" class="cell-config" :class="{ 'mt-2': ci > 0 }">
              <div class="d-flex align-items-center gap-2 px-3 py-2 bg-light border-bottom">
                <code class="small text-primary">{{ cell.cell }}</code>
                <strong class="small">{{ adaptLibrary[cell.component]?.label ?? cell.component }}</strong>
              </div>
              <div v-if="adaptLibrary[cell.component]?.fields?.length" class="px-3 py-2">
                <BFormGroup
                  v-for="field in adaptLibrary[cell.component].fields"
                  :key="field.key"
                  :label="field.key"
                  label-cols="4"
                  label-class="font-monospace small text-muted"
                  class="mb-2"
                >
                  <BFormSelect
                    v-if="field.type === 'datasource'"
                    size="sm"
                    :model-value="cell[field.key] ?? '/'"
                    @update:model-value="setCellField(ci, field.key, $event)"
                  >
                    <option value="/">/ (default)</option>
                    <option v-for="ds in storedDatasources" :key="ds" :value="ds">{{ ds }}</option>
                  </BFormSelect>
                  <BFormInput
                    v-else-if="field.type === 'number'"
                    type="number"
                    size="sm"
                    :model-value="cell[field.key] ?? (field.default ?? 0)"
                    @change="setCellField(ci, field.key, Number($event.target.value))"
                  />
                  <BFormCheckbox
                    v-else-if="field.type === 'boolean'"
                    :model-value="cell[field.key] ?? (field.default ?? false)"
                    @update:model-value="setCellField(ci, field.key, $event)"
                  />
                  <BFormInput
                    v-else
                    size="sm"
                    :model-value="cell[field.key] ?? (field.default ?? '')"
                    @change="setCellField(ci, field.key, $event.target.value)"
                  />
                </BFormGroup>
              </div>
              <div v-else class="px-3 py-2 text-muted small fst-italic">"{{ cell.component }}" has no adapt library fields defined.</div>
            </div>
          </BCard>

          <BButton variant="primary" size="sm" @click="saveTab">Save Layout</BButton>

        </div>
      </BTab>

      <template #tabs-end>
        <li class="nav-item d-flex align-items-center">
          <BButton variant="link" size="sm" class="add-tab-btn" @click="showNewModal = true">+ Tab</BButton>
        </li>
      </template>
    </BTabs>

    <!-- New tab modal -->
    <BModal
      v-model="showNewModal"
      title="New Tab"
      ok-title="Create"
      ok-variant="primary"
      cancel-variant="outline-secondary"
      @ok.prevent="createTab"
      @hidden="resetForm"
    >
      <BForm @submit.prevent="createTab">
        <BFormGroup label="Title" label-for="new-tab-title">
          <BFormInput
            id="new-tab-title"
            v-model="newTitle"
            placeholder="e.g. Claims Overview"
            @input="syncKey"
          />
        </BFormGroup>
        <BFormGroup label="Key" label-for="new-tab-key" description="No spaces — used as the config identifier.">
          <BFormInput
            id="new-tab-key"
            v-model="newKey"
            placeholder="e.g. claims_overview"
            style="font-family: monospace"
            @input="keyManuallyEdited = true"
          />
        </BFormGroup>
        <p v-if="newError" class="text-danger small mt-2 mb-0">{{ newError }}</p>
      </BForm>
    </BModal>

  </div>
</template>

<script setup>
import { ref, computed, watch, inject, nextTick } from 'vue'
import { BTabs, BTab, BModal, BForm, BFormGroup, BFormInput, BFormSelect, BFormCheckbox, BInputGroup, BInputGroupText, BButton, BCard } from 'bootstrap-vue-next'
import { useLayoutEditor } from '@src/composables/useLayoutEditor.js'
import ComponentNode from '@src/components/user/ComponentNode.vue'

const vFocus = { mounted: (el) => el.focus() }

const meta = inject('meta')
const { setValue, deleteNode, addChild } = useLayoutEditor(meta)

const mainPanel    = computed(() => meta?.value?.layout?.viz?.['main-panel'] ?? null)
const adaptLibrary = computed(() => meta?.value?.layout?.adaptLibrary ?? {})
const adaptChartTypes = computed(() =>
  Object.entries(adaptLibrary.value).map(([v, def]) => ({ v, l: def.label || v }))
)

const tabList = computed(() => {
  if (!mainPanel.value) return []
  return (mainPanel.value['tab-array'] ?? [])
    .filter(k => mainPanel.value[k] != null)
    .map(k => ({ key: k, title: mainPanel.value[k]?.title ?? k }))
})

// ── Active tab ────────────────────────────────────────────────────────────────
const activeTabIndex = ref(0)
const activeTabKey   = computed(() => tabList.value[activeTabIndex.value]?.key ?? null)

watch(tabList, (list) => {
  if (activeTabIndex.value >= list.length) {
    activeTabIndex.value = Math.max(0, list.length - 1)
  }
}, { immediate: true })

// ── Inline title editing ──────────────────────────────────────────────────────
const editingTab = ref(null)
const editTitle  = ref('')

function startEdit(key, title) {
  editingTab.value = key
  editTitle.value  = title
}

function commitEdit() {
  const key = editingTab.value
  if (!key) return
  const title = editTitle.value.trim()
  if (title) setValue(['viz', 'main-panel', key, 'title'], title)
  editingTab.value = null
}

function cancelEdit() { editingTab.value = null }

// ── Delete tab ────────────────────────────────────────────────────────────────
function deleteTab(key) {
  const label = mainPanel.value?.[key]?.title ?? key
  if (!confirm(`Delete tab "${label}"?`)) return
  const arr  = mainPanel.value?.['tab-array'] ?? []
  const idx  = arr.indexOf(key)
  if (idx >= 0) deleteNode(['viz', 'main-panel', 'tab-array', idx])
  const tabs = mainPanel.value?.['tabs'] ?? []
  const tIdx = tabs.indexOf(key)
  if (tIdx >= 0) deleteNode(['viz', 'main-panel', 'tabs', tIdx])
  deleteNode(['viz', 'main-panel', key])
  nextTick(() => {
    if (activeTabIndex.value >= tabList.value.length) {
      activeTabIndex.value = Math.max(0, tabList.value.length - 1)
    }
  })
}

// ── Grid state (resets when active tab changes) ───────────────────────────────
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

const gridRows = ref([])

watch(activeTabKey, (key) => {
  gridRows.value = parseGridRows(mainPanel.value?.[key] ?? null)
}, { immediate: true })

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

// ── Build & save ──────────────────────────────────────────────────────────────
const FIELD_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }

function buildTabConfig() {
  const key  = activeTabKey.value
  const base = mainPanel.value?.[key] ?? {}
  const title = base.title ?? key

  const layoutRows = gridRows.value.map((row, ri) => ({
    size: String(row.size),
    cells: row.cells.map((cell, ci) => {
      const obj = { id: cellId(ri, ci) }
      if (row.cells.length > 1) obj.size = String(cell.size)
      return obj
    }),
  }))

  const existingGc    = base.contents?.find(c => c.component === 'GridContainer')
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
    title,
    component: 'TabWrapper',
    contents: [{ layouts: [{ id: 'layout-1', rows: layoutRows }], contents, component: 'GridContainer' }],
    datasources: base.datasources ?? [{ name: '/', component: 'Datasource', 'dql-metrics': [], 'flat-table-target': '' }],
    'right-panel':     base['right-panel']     ?? { 'tab-array': [], defaultTab: null },
    'generate-report': base['generate-report'] ?? [],
  }
}

function saveTab() {
  const key = activeTabKey.value
  if (!key) return
  setValue(['viz', 'main-panel', key], buildTabConfig())
}

// ── New tab ───────────────────────────────────────────────────────────────────
const showNewModal      = ref(false)
const newTitle          = ref('')
const newKey            = ref('')
const newError          = ref('')
const keyManuallyEdited = ref(false)

function toKey(str) {
  return str.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
}

function syncKey() {
  if (!keyManuallyEdited.value) newKey.value = toKey(newTitle.value)
}

function createTab() {
  const title = newTitle.value.trim()
  const key   = newKey.value.trim()
  if (!title) { newError.value = 'Title is required.'; return }
  if (!key)   { newError.value = 'Key is required.'; return }
  if (mainPanel.value?.[key]) { newError.value = `Key "${key}" already exists.`; return }

  const tabArrayLen = mainPanel.value?.['tab-array']?.length ?? 0
  const tabsLen     = mainPanel.value?.['tabs']?.length ?? 0

  const tabConfig = {
    title,
    component: 'TabWrapper',
    contents: [{
      component: 'GridContainer',
      layouts: [{ id: 'layout-1', rows: [{ size: '100', cells: [{ id: 'dashboard-cell-1-1' }] }] }],
      contents: [{ cell: 'dashboard-cell-1-1', component: 'BarChart', datasourceName: '/' }],
    }],
    datasources: [{ name: '/', component: 'Datasource', 'dql-metrics': [], 'flat-table-target': '' }],
    'right-panel': { 'tab-array': [], defaultTab: null },
    'generate-report': [],
  }

  addChild(['viz', 'main-panel'], key, 'object')
  setValue(['viz', 'main-panel', key], tabConfig)
  addChild(['viz', 'main-panel', 'tab-array'], null, 'string')
  setValue(['viz', 'main-panel', 'tab-array', tabArrayLen], key)
  addChild(['viz', 'main-panel', 'tabs'], null, 'string')
  setValue(['viz', 'main-panel', 'tabs', tabsLen], key)

  showNewModal.value = false
  nextTick(() => { activeTabIndex.value = tabList.value.length - 1 })
}

function resetForm() {
  newTitle.value          = ''
  newKey.value            = ''
  newError.value          = ''
  keyManuallyEdited.value = false
}

// ── Monitor Parameters ────────────────────────────────────────────────────────
const leftPanel         = computed(() => meta?.value?.layout?.viz?.['left-panel'] ?? {})
const leftTabKey        = computed(() => leftPanel.value?.tabs?.[0] ?? 'tab-one')
const leftTabContent    = computed(() => leftPanel.value[leftTabKey.value] ?? {})
const monitorPanelIndex = computed(() => (leftTabContent.value.contents ?? []).findIndex(c => c.component === 'MonitorPanel'))
const monitorPanel      = computed(() => monitorPanelIndex.value >= 0 ? leftTabContent.value.contents[monitorPanelIndex.value] : null)
const monitorPanelPath  = computed(() => ['viz', 'left-panel', leftTabKey.value, 'contents', monitorPanelIndex.value])
</script>

<style scoped>
.layout-editor {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

/* ── Left pane ── */
.left-pane {
  width: 300px;
  flex-shrink: 0;
  overflow-y: auto;
  background: #fff;
}

.pane-divider {
  width: 1px;
  background: #e5e7eb;
  flex-shrink: 0;
}

/* ── BTabs as right pane ── */
.right-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.right-pane :deep(.layout-tab-content) {
  flex: 1;
  overflow: auto;
  background: #f8f9fb;
}

.right-pane :deep(.tab-pane) {
  height: 100%;
}

/* ── Tab nav ── */
.right-pane :deep(.layout-tab-nav) {
  flex-wrap: nowrap;
  overflow-x: auto;
  border-bottom: 2px solid #e5e7eb;
  background: #fff;
}

.right-pane :deep(.layout-tab-nav .nav-link) {
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 16px;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  margin-bottom: -2px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.right-pane :deep(.layout-tab-nav .nav-link:hover) {
  color: #374151;
  background: #f9fafb;
  border-color: transparent;
}
.right-pane :deep(.layout-tab-nav .nav-link.active) {
  color: #4f46e5;
  background: transparent;
  border-bottom-color: #4f46e5;
}

/* ── Tab title slot ── */
.tab-title-input {
  border: 1px solid #c4b5fd;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 13px;
  font-weight: 500;
  color: #4f46e5;
  background: #f5f3ff;
  outline: none;
  width: 120px;
}

.tab-close {
  font-size: 14px;
  color: #d1d5db;
  line-height: 1;
  padding: 1px 3px;
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.1s, background 0.1s;
}
.tab-close:hover { color: #dc2626; background: #fee2e2; }

.add-tab-btn { color: #9ca3af !important; text-decoration: none !important; }
.add-tab-btn:hover { color: #4f46e5 !important; }

/* ── Tab body ── */
.content-body { padding: 20px 28px 32px; }

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
/* ── Cell config ── */
.cell-config { border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }

/* ── Monitor Parameters ── */
.panel { padding: 20px; }
.panel-header { margin-bottom: 16px; }
.panel-title  { font-size: 16px; font-weight: 700; color: #111; margin: 0; }
.panel-subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; line-height: 1.5; margin-bottom: 0; }
</style>
