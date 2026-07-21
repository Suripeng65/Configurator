<template>
  <div class="layout-editor">

    <!-- Left: monitor parameters -->
    <aside class="left-pane">
      <WorkspacePanel />
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
          <span
            v-else
            @dblclick.stop="startEdit(tab.key, tab.title)"
          >{{ tab.title }}</span>
          <span
            v-if="activeTabIndex === i && editingTab !== tab.key"
            class="tab-close ms-2"
            @click.stop="deleteTab(tab.key)"
            title="Delete tab"
          >×</span>
        </template>

        <TabContent :key="tab.key" :tabKey="tab.key" />
      </BTab>

      <template #tabs-end>
        <li class="nav-item d-flex align-items-center">
          <button class="add-tab-btn" @click="showNewModal = true">+ Tab</button>
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
import { BTabs, BTab, BModal, BForm, BFormGroup, BFormInput } from 'bootstrap-vue-next'
import { useLayoutEditor } from '@src/composables/useLayoutEditor.js'
import WorkspacePanel from '@src/components/user/WorkspacePanel.vue'
import TabContent from '@src/components/user/TabContent.vue'

const vFocus = { mounted: (el) => el.focus() }

const meta = inject('meta')
const { setValue, deleteNode, addChild } = useLayoutEditor(meta)

const mainPanel = computed(() => meta?.value?.layout?.viz?.['main-panel'] ?? null)

const tabList = computed(() => {
  if (!mainPanel.value) return []
  return (mainPanel.value['tab-array'] ?? [])
    .filter(k => mainPanel.value[k] != null)
    .map(k => ({ key: k, title: mainPanel.value[k]?.title ?? k }))
})

// ── Active tab (index-based for BTabs) ───────────────────────────────────────
const activeTabIndex = ref(0)

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

/* ── Tab title slot content ── */
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

/* ── Add tab button ── */
.add-tab-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #9ca3af;
  padding: 0 14px;
  height: 100%;
  cursor: pointer;
  white-space: nowrap;
}
.add-tab-btn:hover { color: #4f46e5; background: #f5f3ff; }
</style>
