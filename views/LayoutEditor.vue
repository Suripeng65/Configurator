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
            @keydown.stop
            @keyup.enter="e => e.target.blur()"
            @keyup.escape="cancelEdit"
            @blur="commitEdit"
          />
          <span v-else @dblclick.stop="startEdit(tab.key, tab.title)">{{ localTabTitles[tab.key] ?? tab.title }}</span>
          <span
            v-if="activeTabIndex === i && editingTab !== tab.key"
            class="tab-close ms-2"
            @click.stop="deleteTab(tab.key)"
            title="Delete tab"
          >×</span>
        </template>

        <!-- Tab body -->
        <div class="content-body">

          <div class="tab-meta mb-3">
            <span class="text-muted small">ID:</span>
            <code class="tab-key-badge">{{ tab.key }}</code>
          </div>

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
                <strong class="small">{{ ADAPT_COMPONENTS[cell.component]?.label ?? cell.component }}</strong>
              </div>
              <div v-if="ADAPT_COMPONENTS[cell.component]?.fields?.length" class="px-3 py-2">
                <BFormGroup
                  v-for="field in ADAPT_COMPONENTS[cell.component].fields"
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
          <BButton variant="link" size="sm" class="add-tab-btn" @click="createTab">+ Tab</BButton>
        </li>
      </template>
    </BTabs>

  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { BTabs, BTab, BFormGroup, BFormInput, BFormSelect, BFormCheckbox, BInputGroup, BInputGroupText, BButton, BCard } from 'bootstrap-vue-next'
import { useLayoutEditor } from '@src/composables/useLayoutEditor.js'
import { useTabManager }   from '@src/composables/useTabManager.js'
import { useGridBuilder, CHART_TYPES } from '@src/composables/useGridBuilder.js'
import { ADAPT_COMPONENTS } from '@src/components/AdaptComponents/index.js'
import ComponentNode from '@src/components/user/ComponentNode.vue'

const vFocus = { mounted: (el) => el.focus() }

const meta = inject('meta')
const { setValue, deleteNode, addChild } = useLayoutEditor(meta)

const mainPanel = computed(() => meta?.value?.layout?.viz?.['main-panel'] ?? null)

const {
  tabList, activeTabIndex, activeTabKey,
  localTabTitles, editingTab, editTitle,
  startEdit, commitEdit, cancelEdit,
  deleteTab, createTab,
} = useTabManager(mainPanel, { setValue, deleteNode, addChild })

const {
  gridRows, cellId,
  addRow, removeRow, addCell, removeCell, clampRowSizes, clampCellSizes,
  storedCells, storedDatasources, setCellField,
  saveTab,
} = useGridBuilder(activeTabKey, mainPanel, { setValue })

// ── Monitor Parameters 
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

.tab-meta { display: flex; align-items: center; gap: 6px; }
.tab-key-badge {
  font-size: 11px;
  background: #f3f4f6;
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: monospace;
}

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
