<template>
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">Monitor Parameters</h2>
      <p class="panel-subtitle">
        Edit the left-panel filter sections. Double-click any section name to rename it.
        Expand a section to add filters, dropdowns, or nested groups.
      </p>
    </div>

    <div class="sections-list">
      <div v-if="!topSections.length && !showAddForm" class="empty-state">
        No workspace filter sections found.
        <br />
        <button class="add-section-btn" @click="showAddForm = true">+ Add first section</button>
      </div>

      <WorkspaceSection
        v-for="(section, idx) in topSections"
        :key="idx"
        :item="section"
        :path="[...monitorContentsPath, idx]"
        :depth="0"
      />

      <!-- Top-level add form -->
      <div v-if="showAddForm" class="add-section-form">
        <select v-model="newSectionType" class="add-select">
          <option value="LayoutSection">Layout Section (container)</option>
          <option value="AccordionGroup">Accordion Group (container)</option>
          <option value="AggregationAccordion">Aggregation Accordion (container)</option>
          <option value="FlexDropdown">Dropdown Filter (leaf)</option>
          <option value="ModalSelector">Modal Selector (leaf)</option>
          <option value="ValidationMessage">Validation Message</option>
        </select>
        <input
          v-model="newSectionName"
          class="add-input"
          :placeholder="isLeaf ? 'Label' : 'Section name'"
          @keyup.enter="addSection"
          @keyup.escape="cancelAdd"
        />
        <input
          v-if="isLeaf && needsDim"
          v-model="newSectionDim"
          class="add-input add-input--dim"
          placeholder="dimension key"
          @keyup.enter="addSection"
          @keyup.escape="cancelAdd"
        />
        <button class="btn-confirm" @click="addSection">Add</button>
        <button class="btn-cancel" @click="cancelAdd">Cancel</button>
      </div>

      <button v-if="topSections.length && !showAddForm" class="add-section-btn" @click="showAddForm = true">
        + Add section
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTemplateStore } from '@src/stores/template'
import WorkspaceSection from './WorkspaceSection.vue'

const LEAVES = ['FlexDropdown', 'ModalSelector', 'ValidationMessage', 'StratificationToggle', 'StratificationDropdown']
const NEEDS_DIM_TYPES = ['FlexDropdown', 'ModalSelector', 'StratificationToggle', 'StratificationDropdown']

const store = useTemplateStore()

const layout = computed(() => store.template?.layout ?? {})
const leftPanel = computed(() => layout.value?.viz?.['left-panel'] ?? {})
const tabKey = computed(() => leftPanel.value?.tabs?.[0] ?? 'tab-one')
const tabContent = computed(() => leftPanel.value[tabKey.value] ?? {})
const monitorPanelIndex = computed(() =>
  (tabContent.value.contents ?? []).findIndex(c => c.component === 'MonitorPanel')
)
const monitorPanel = computed(() =>
  monitorPanelIndex.value >= 0
    ? tabContent.value.contents[monitorPanelIndex.value]
    : null
)
const monitorContentsPath = computed(() =>
  ['viz', 'left-panel', tabKey.value, 'contents', monitorPanelIndex.value, 'contents']
)
const topSections = computed(() => monitorPanel.value?.contents ?? [])

// Add-section form state
const showAddForm = ref(false)
const newSectionType = ref('LayoutSection')
const newSectionName = ref('')
const newSectionDim  = ref('')

const isLeaf   = computed(() => LEAVES.includes(newSectionType.value))
const needsDim = computed(() => NEEDS_DIM_TYPES.includes(newSectionType.value))

function buildConfig(type, name, dim) {
  const label = name.trim() || 'New Item'
  const d = dim.trim()
  const templates = {
    LayoutSection:         { component: 'LayoutSection',    displayName: label,  collapsed: false, collapsible: true, contents: [] },
    AccordionGroup:        { component: 'AccordionGroup',   groupName: label,    collapsedByDefault: false, contents: [] },
    AggregationAccordion:  { component: 'AggregationAccordion', displayName: label, contents: [] },
    FlexDropdown:          { component: 'FlexDropdown',     label,               dim: d, options: [] },
    ModalSelector:         { component: 'ModalSelector',    label,               dim: d },
    ValidationMessage:     { component: 'ValidationMessage', ruleName: name.trim() || '' },
  }
  return templates[type] ?? { component: type }
}

function addSection() {
  const newIdx = topSections.value.length
  const config = buildConfig(newSectionType.value, newSectionName.value, newSectionDim.value)

  // Ensure MonitorPanel exists; if monitorPanel is missing, abort
  if (monitorPanelIndex.value < 0) return

  store.addChild(monitorContentsPath.value, null, 'object')
  store.setValue([...monitorContentsPath.value, newIdx], config)
  cancelAdd()
}

function cancelAdd() {
  showAddForm.value = false
  newSectionType.value = 'LayoutSection'
  newSectionName.value = ''
  newSectionDim.value  = ''
}
</script>

<style scoped>
.panel { padding: 28px 32px; max-width: 860px; }
.panel-header { margin-bottom: 24px; }
.panel-title  { font-size: 18px; font-weight: 700; color: #111; }
.panel-subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; line-height: 1.5; }

.sections-list { display: flex; flex-direction: column; gap: 12px; }

.add-section-btn {
  align-self: flex-start;
  background: none;
  border: 2px dashed #d1d5db;
  color: #6b7280;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 13px;
  width: 100%;
  transition: all 0.15s;
}
.add-section-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

.add-section-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  border-radius: 8px;
}

.add-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.add-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  background: #fff;
  min-width: 160px;
  flex: 1;
}
.add-input--dim { min-width: 120px; flex: 0 0 auto; font-family: monospace; font-size: 12px; }
.add-input:focus { border-color: #6366f1; outline: none; }

.btn-confirm { background: #4f46e5; color: #fff; padding: 6px 16px; border-radius: 6px; font-size: 13px; }
.btn-confirm:hover { background: #4338ca; }
.btn-cancel { background: none; color: #6b7280; padding: 6px 10px; font-size: 13px; }

.empty-state {
  color: #9ca3af;
  padding: 40px;
  text-align: center;
  line-height: 2;
}
</style>
