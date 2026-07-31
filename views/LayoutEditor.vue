<script setup lang="ts">
import { inject, ref, computed, watch } from 'vue'
import useEditorWorkflow from "@src/composables/EditorWorkflow";
import { uiTemplatesQueries } from '@src/queries'
import { ADAPT_COMPONENTS } from '@src/components/AdaptComponents/index';
import { useLayoutEditor } from '@src/composables/useLayoutEditor.js'
import { useGridEditor } from '@src/composables/useGridEditor'
import {findComponents} from "@src/utils/datasources.util.ts";
import ComponentNode from '@src/components/user/ComponentNode.vue'
import { useTabManager }   from '@src/composables/useTabManager.js'

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

const adaptLibrary = computed(()=>{
  return Object.entries(ADAPT_COMPONENTS).reduce((acc, curr)=>{
    const [name, def] = curr
    acc[name] = {
      id:def?.id ?? null,
      label: def.label,
      fields: def.fields.map(field => ({ ...field }))
    }
    return acc
  },{})
})

const {
  cellId,
  gridRows,
  clampRowSizes,
  updateCellSize,
  addCell,
  addRow,
  removeRow,
  updateCellChart,
  updateCellDatasource,
  removeCell
  // buildTabConfig
} = useGridEditor(mainPanel, activeTabKey, adaptLibrary, {setValue})

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
  console.log("using this gridRows to build layout...: ",gridRows)
  const contents: any[]= []
  gridRows.value.forEach((row:any, ri:number) => {
    row.cells.forEach((cell:any, ci:number) => {
      const id         = cellId(ri, ci)
      const prev       = existingCells.find(c => c.cell === id)
      const cellConfig = { ...(prev ?? {}), cell: id, component: cell.chart }
      const adaptDef   = adaptLibrary.value[cell.chart]
      
      // Copy chart-specific properties from cell to cellConfig
      if (adaptDef && adaptDef.fields) {
        for (const field of adaptDef.fields) {
          // Use the value from the cell object if it exists, otherwise use default
          if (field.key in cell) {
            cellConfig[field.key] = cell[field.key]
          } else if (!(field.key in cellConfig)) {
            cellConfig[field.key] = field.default !== undefined ? field.default : (FIELD_DEFAULTS[field.type] ?? '')
          }
        }
      }
      
      if (!('datasourceName' in cellConfig)) cellConfig.datasourceName = '/'
      contents.push(cellConfig)
    })
  })
  let res = {
    ...base,
    title,
    component: 'TabWrapper',
    contents: [{ layouts: [{ id: 'layout-1', rows: layoutRows }], contents, component: 'GridContainer' }],
    datasources: accessibleDatasources.value.filter((ds)=>ds.fullPathArray.includes(key)).map((ds)=>ds.matchedObject).reduce((curr, acc)=>{curr[acc.name] = acc; return curr}, {}),
    'right-panel':     base['right-panel']     ?? { 'tab-array': [], defaultTab: null },
    'generate-report': base['generate-report'] ?? [],
  }
  console.log("generating new tab layouts...", res)
  return res
}

function saveTabLayout() {
  const key = activeTabKey.value
  if (!key) return
  setValue(['viz', 'main-panel', key], buildTabConfig())
}

</script>

<template>
  <div class="layout-editor">
    <aside class="left-pane">
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
    </aside>
    <div class="pane-divider" ></div>
    <BTabs
      v-model="activeTabIndex"
      class="right-pane"
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
           <BCard class="grid-card">
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
                    <BFormSelect :model-value="cell.chart" size="sm" @update:model-value="(val) => updateCellChart(ri, ci, val)">
                      <option v-for="c in Object.keys(adaptLibrary)" :key="c" :value="c">{{ adaptLibrary[c].label }}</option>
                    </BFormSelect>
                    
                    <BFormSelect :model-value="cell.datasourceName" size="sm" @update:model-value="(val) => updateCellDatasource(ri, ci, val)">
                      <option v-for="ds in accessibleDatasources" :key="ds.path" :value="ds.matchedObject.name">
                        {{ ds.matchedObject.name }} 
                      </option>
                    </BFormSelect>

                     <div class="d-flex align-items-center justify-content-between gap-1 mt-1">
                    <BInputGroup size="sm">
                      <BInputGroupText>w</BInputGroupText>
                      <BFormInput type="number" v-model.number="cell.size" min="5" max="95" style="width:46px" @change="updateCellSize(ri)" />
                      <BInputGroupText>%</BInputGroupText>
                    </BInputGroup>

                    <!-- <BButton v-if="row.cells.length > 1" variant="link" size="sm" class="text-danger p-0 lh-1" @click="removeCell(ri, ci)" title="Remove cell">×</BButton> -->
                  </div>
                    <!-- Chart-specific properties -->
                    <div v-if="cell.chart && adaptLibrary[cell.chart]" class="chart-properties">
                      <div v-for="field in adaptLibrary[cell.chart].fields" :key="field.key" class="property-field">
                        <!-- String field -->
                        <BFormGroup v-if="field.type === 'string'" :label="field.key">
                          <BFormInput 
                            v-model="cell[field.key]" 
                            size="sm"
                            :placeholder="field.placeholder ?? ''"
                          />
                        </BFormGroup>
                        
                        <!-- Boolean field -->
                        <BFormGroup v-else-if="field.type === 'boolean'" :label="field.key">
                          <BFormRadioGroup
                            v-model="cell[field.key]"
                            :options="[{ text: 'True', value: true }, { text: 'False', value: false }]"
                            >
                          </BFormRadioGroup>
                        </BFormGroup>
                        
                        <!-- Number field -->
                        <BFormGroup v-else-if="field.type === 'number'" :label="field.key">
                          <BFormInput 
                            v-model.number="cell[field.key]" 
                            type="number"
                            size="sm"
                            :placeholder="field.placeholder ?? ''" 
                          />
                        </BFormGroup>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            <div class="d-flex flex-column gap-1 mb-3">
              <div v-for="(row, ri) in gridRows" :key="ri" class="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded">
                <span class="text-muted small" style="min-width:60px">Row {{ ri + 1 }}</span>
                <BInputGroup size="sm" style="width:auto">
                  <BInputGroupText>h</BInputGroupText>
                  <BFormInput type="number" v-model.number="row.size" min="5" max="95" style="width:60px" @change="clampRowSizes" />
                  <BInputGroupText>%</BInputGroupText>
                </BInputGroup>
                <BButton size="sm" variant="outline-secondary" :disabled="row.cells.length >= 4" @click="addCell(ri)">+ cell</BButton>
                <BButton size="sm" variant="outline-danger" :disabled="gridRows.length === 1" @click="removeRow(ri)">× row</BButton>
              </div>
            </div>

            <BButton variant="outline-secondary" size="sm" :disabled="gridRows.length >= 6" @click="addRow">+ Add Row</BButton>
           </BCard>

           <BButton variant="primary" size="sm" @click="saveTabLayout">Save Tab</BButton>
        </div>
      </BTab>
       <template #tabs-end>
        <li class="nav-item d-flex align-items-center">
          <BButton variant="link" size="sm" class="add-tab-btn" @click="createTab">+ Tab</BButton>
        </li>
      </template>
    </BTabs>
  </div>
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
</style>