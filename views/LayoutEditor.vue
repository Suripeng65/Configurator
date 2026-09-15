<script setup lang="ts">
import { inject, ref, computed, watch } from 'vue'
import useEditorWorkflow from "@src/composables/EditorWorkflow";
import { uiTemplatesQueries } from '@src/queries'
import { ADAPT_COMPONENTS } from '@src/components/AdaptComponents/index';
import { ownSchemaFor, ownFormData, getOwnFieldKeys } from '@src/components/AdaptComponents/schemaUtils';
import { useLayoutEditor } from '@src/composables/useLayoutEditor'
import { useGridEditor } from '@src/composables/useGridEditor'
import {findComponents} from "@src/utils/datasources.util.ts";
import ComponentNode from '@src/components/LayoutEditor/ComponentNode.vue'
import { useTabManager }   from '@src/composables/useTabManager.js'
import { JsonForms } from '@jsonforms/vue'
import { renderers } from '@src/components/LayoutEditor/jsonforms/renderers'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

const meta  = inject<any>('meta')
const { setValue, addChild, deleteNode } = useLayoutEditor(meta)

console.log(meta)

//main panel variables
const mainPanel = computed(() => meta?.value?.layout?.viz?.['main-panel'] ?? null)
// Left panel variables
const leftPanel         = computed(() => meta?.value?.layout?.viz?.['left-panel'] ?? {})
const leftTabKey        = computed(() => leftPanel.value?.tabs?.[0] ?? 'tab-one')
const leftTabContent    = computed(() => leftPanel.value[leftTabKey.value] ?? {})
const monitorPanelIndex = computed(() => (leftTabContent.value.contents ?? []).findIndex(c => c.component === 'MonitorPanel'))
const monitorPanel      = computed(() => monitorPanelIndex.value >= 0 ? leftTabContent.value.contents[monitorPanelIndex.value] : null)
const monitorPanelPath  = computed(() => ['viz', 'left-panel', leftTabKey.value, 'contents', monitorPanelIndex.value])

const {data} = useEditorWorkflow(uiTemplatesQueries, meta)
const {
  tabList, activeTabIndex, activeTabKey,
  localTabTitles, editingTab, editTitle,
  startEdit, commitEdit, createTab, deleteTab
} = useTabManager(mainPanel, { setValue, deleteNode, addChild })

const {
  cellId,
  gridRows,
  updateCellSize,
  updateRowSizes,
  addCell,
  addRow,
  removeRow,
  updateCellChart,
  updateCellDatasource,
  removeCell,
  updateCellField
} = useGridEditor(mainPanel, activeTabKey, {setValue})

// ── Chart-property panel (JSONForms, same schemas/renderers ComponentNode.vue uses) ──
function cellSchema(chartType) {
  return ownSchemaFor(ADAPT_COMPONENTS[chartType])
}
function cellFormData(cell) {
  return ownFormData(ADAPT_COMPONENTS[cell.chart], cell)
}
function onCellFormChange(ri, ci, cell, { data }) {
  const schema = ADAPT_COMPONENTS[cell.chart]
  if (!schema) return
  for (const key of getOwnFieldKeys(schema)) {
    if (data[key] !== cell[key]) updateCellField(ri, ci, key, data[key])
  }
}

const datasources = computed(()=>{ 
  return findComponents(meta.value.layout, "Datasource")
})

const DATASOURCES = computed(() => {
  const result = findComponents(meta.value.layout, "Datasource");
  return Array.from(new Set(result.map(source => source.matchedObject.name)))
})

const accessibleDatasources = computed(()=>{
  return datasources.value.filter((ds)=>{
    const pattern = 'viz.main-panel.datasources'
    const key = activeTabKey.value

    //only return datasource that are globally accessible and the tab specific ones
    return ds.fullPathArray.includes(key) || ds.path.match(pattern)
  })
})

</script>

<template>
  <Splitpanes class="layout-editor">
    <Pane class="left-pane" size="25">
      <!-- LEFT PANEL -->
       <div class="panel">
        <div class="panel-header">
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
    </Pane>
    <Pane class="right-pane">
    <BTabs
      v-model="activeTabIndex"
      nav-class="layout-tab-nav"
      content-class="layout-tab-content"
    >
      <BTab v-for="(tab, i) in tabList" :key="tab.key" :id="tab.key">
        <template #title>
          <input
            v-if="editingTab === tab.key"
            v-model="editTitle"
            v-focus
            class="tab-title-input"
            @click.stop
            @mousedown.stop
            @keydown.stop
            @keyup.enter="e => e.target.blur()"
            @blur="commitEdit"
          />
          <span v-else @dblclick.stop="startEdit(tab.key, tab.title)">{{ localTabTitles[tab.key] ?? tab.title }}</span>
          <!-- {{ tab.title }} -->
          <span
            v-if="activeTabIndex === i && editingTab !== tab.key"
            class="tab-close ms-2"
            @click.stop="deleteTab(tab.key)"
            title="Delete tab"
          >×</span>
        </template>
        <div class="content-body">
           <BCard v-if="gridRows" class="grid-card">
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
                   <!-- for each cell -->
                    <div style="display:flex; flex-direction: row; justify-content: space-between;">
                    <span class="cell-id-label">{{ cellId(ri, ci) }}</span>
                    <BButton v-if="row.cells.length > 1" variant="link" size="sm" class="text-danger p-0 lh-1" @click="removeCell(ri, ci)" title="Remove cell">✕</BButton>
                    <BButton v-else variant="link" size="sm" class="text-danger p-0 lh-1" @click="removeRow(ri)" title="Remove Row">X</BButton>

                    </div>
                    <div  class="field-row">
                      <label class="field-label">Chart</label>
                      <BFormSelect :model-value="cell.chart" size="sm" @update:model-value="(val) => updateCellChart(ri, ci, val)">
                        <option v-for="c in Object.keys(ADAPT_COMPONENTS)" :key="c" :value="c">{{ ADAPT_COMPONENTS[c].title }}</option>
                      </BFormSelect>
                    </div>
                   <div  class="field-row">
                      <label class="field-label">Datasource</label>
                      <BFormSelect :model-value="cell.datasourceName" size="sm" @update:model-value="(val) => updateCellDatasource(ri, ci, val)">
                        <option :value="undefined" disabled> Select a datasource...</option>
                        <option v-for="ds in accessibleDatasources" :key="ds.path" :value="ds.matchedObject.name">
                          {{ ds.matchedObject.name }} 
                        </option>
                      </BFormSelect>
                    </div>
                    <div  class="field-row">
                       <label class="field-label">Container Width</label>
                        <div class="d-flex align-items-center justify-content-between gap-1 mt-1">
                        <BInputGroup size="sm">
                          <BInputGroupText>w</BInputGroupText>
                          <BFormInput type="number" :model-value="cell.size" min="5" max="95" style="width:46px" @change="updateCellSize(ri, ci, Number($event.target.value))" />
                          <BInputGroupText>%</BInputGroupText>
                        </BInputGroup>
                      </div>
                    </div>
                   
                    <!-- Chart-specific properties -->
                    <div v-if="cell.chart && ADAPT_COMPONENTS[cell.chart]" class="chart-properties cn-jsonforms">
                      <json-forms
                        :schema="cellSchema(cell.chart)"
                        :data="cellFormData(cell)"
                        :renderers="renderers"
                        @change="onCellFormChange(ri, ci, cell, $event)"
                      />
                    </div>
                  </div>
                </div>
            </div>
            <div class="d-flex flex-column gap-1 mb-3">
              <div v-for="(row, ri) in gridRows" :key="ri" class="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded">
                <span class="text-muted small" style="min-width:60px">Row {{ Number(ri) + 1 }}</span>
                <BInputGroup size="sm" style="width:auto">
                  <BInputGroupText>h</BInputGroupText>
                  <BFormInput type="number" :model-value="row.size" min="5" max="95" style="width:60px" @change="updateRowSizes(ri, Number($event.target.value))" />
                  <BInputGroupText>%</BInputGroupText>
                </BInputGroup>
                <BButton size="sm" variant="outline-secondary" :disabled="row.cells.length >= 4" @click="addCell(ri)">+ cell</BButton>
                <BButton size="sm" variant="outline-danger" :disabled="gridRows.length === 1" @click="removeRow(ri)">× row</BButton>
              </div>
            </div>

            <BButton variant="outline-secondary" size="sm" :disabled="gridRows.length >= 6" @click="addRow">+ Add Row</BButton>
           </BCard>
           <div v-else class="fallback-tree">
            <p class="text-muted small fst-italic px-1 mb-3">This tab does not use the standard grid layout. Showing the raw structure with the best effort.</p>
             <ComponentNode
              v-if="mainPanel?.[activeTabKey]"
              :item="mainPanel[activeTabKey]"
              :path="['viz', 'main-panel', activeTabKey]"
              :depth="0"
            />
           </div>
        </div>
      </BTab>
       <template #tabs-end>
        <li class="nav-item d-flex align-items-center">
          <BButton variant="link" size="sm" class="add-tab-btn" @click="createTab">+ Tab</BButton>
        </li>
      </template>
    </BTabs>
    </Pane>
  </Splitpanes>
</template>

<style scoped>
.layout-editor {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

/* ── Left pane ── */
.left-pane {
  width: 450px;
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
  height: auto;
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
.fallback-tree{
  display:flex;
  flex-direction:column;
  gap: 4px;
}

/* ── Chart properties inline layout ── */
.chart-properties {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-label {
  min-width: 120px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0;
}

.field-row > :not(.field-label) {
  flex: 1;
}

/* ── JSONForms field panel (vue-vanilla default renderers get almost no
   built-in CSS — fieldset/legend in particular fall back to raw browser
   styles, which is why this needs a fuller reset than just a few classes) ── */
.cn-jsonforms { font-size: 12px; max-width: 100%; }
.cn-jsonforms :deep(*) { box-sizing: border-box; }

.cn-jsonforms:deep(fieldset) { border: none; margin: 0; padding: 0; min-width: 0; width: 100%; }
.cn-jsonforms:deep(legend) { all: unset; display: block; width: 100%; }

.cn-jsonforms:deep(.vertical-layout) { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.cn-jsonforms:deep(.vertical-layout-item) { min-width: 0; }
.cn-jsonforms:deep(.horizontal-layout) { display: flex; gap: 8px; min-width: 0; }
.cn-jsonforms:deep(.horizontal-layout-item) { flex: 1; min-width: 0; }

/* label column + input column on one line; error/description span both
   columns on their own row below, so they don't get squeezed next to the input */
.cn-jsonforms:deep(.control) {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 4px 12px;
  min-width: 0;
}
.cn-jsonforms:deep(.label) {
  grid-column: 1;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}
.cn-jsonforms:deep(.wrapper) { grid-column: 2; min-width: 0; }
.cn-jsonforms:deep(.asterisk) { color: #dc2626; margin-left: 2px; }
.cn-jsonforms:deep(.description),
.cn-jsonforms:deep(.error) { grid-column: 1 / -1; font-size: 11px; }
.cn-jsonforms:deep(.description) { color: #9ca3af; }
.cn-jsonforms:deep(.error) { color: #dc2626; }

.cn-jsonforms:deep(.input:not([type="checkbox"])),
.cn-jsonforms:deep(.select),
.cn-jsonforms:deep(.text-area) {
  font-size: 12px;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-family: inherit;
  background: #fff;
  width: 100%;
}
.cn-jsonforms:deep(.input:not([type="checkbox"]):focus),
.cn-jsonforms:deep(.select:focus),
.cn-jsonforms:deep(.text-area:focus) { outline: none; border-color: #6366f1; }
.cn-jsonforms:deep(input[type="checkbox"].input) { width: auto; flex-shrink: 0; margin: 0; }

/* Nested object fields (e.g. pin-bottom, x-axis) */
.cn-jsonforms:deep(.group) {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
}
.cn-jsonforms:deep(.group-label) {
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
.cn-jsonforms:deep(.group-item) { margin-bottom: 6px; }
.cn-jsonforms:deep(.group-item:last-child) { margin-bottom: 0; }

/* Array fields (arrayOfObjects / plain string arrays) */
.cn-jsonforms:deep(.array-list) {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 10px;
}
.cn-jsonforms:deep(.array-list-legend) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.cn-jsonforms:deep(.array-list-label) {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}
.cn-jsonforms:deep(.array-list-add) {
  font-size: 12px;
  line-height: 1;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 1px dashed #9ca3af;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
}
.cn-jsonforms:deep(.array-list-add:hover) { border-color: #6366f1; color: #6366f1; }
.cn-jsonforms:deep(.array-list-add:disabled) { opacity: 0.4; cursor: not-allowed; }

.cn-jsonforms:deep(.array-list-item-wrapper) { margin-bottom: 6px; }
.cn-jsonforms:deep(.array-list-item-wrapper:last-child) { margin-bottom: 0; }
.cn-jsonforms:deep(.array-list-item) {
  border: 1px solid #f0f0f0;
  border-radius: 5px;
  background: #fafafa;
}
.cn-jsonforms:deep(.array-list-item-toolbar) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  cursor: pointer;
}
.cn-jsonforms:deep(.array-list-item-label) {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
}
.cn-jsonforms:deep(.array-list-item-move-up),
.cn-jsonforms:deep(.array-list-item-move-down),
.cn-jsonforms:deep(.array-list-item-delete) {
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 2px 4px;
  flex-shrink: 0;
}
.cn-jsonforms:deep(.array-list-item-move-up:hover),
.cn-jsonforms:deep(.array-list-item-move-down:hover) { color: #6366f1; }
.cn-jsonforms:deep(.array-list-item-delete:hover) { color: #dc2626; }
.cn-jsonforms:deep(.array-list-item-move-up:disabled),
.cn-jsonforms:deep(.array-list-item-move-down:disabled),
.cn-jsonforms:deep(.array-list-item-delete:disabled) { opacity: 0.3; cursor: not-allowed; }
.cn-jsonforms:deep(.array-list-item-content) {
  padding: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.cn-jsonforms:deep(.array-list-no-data) {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
  padding: 4px 0;
}
</style>
