<template>
  <div class="layout-editor">

    <!-- Left: monitor parameters -->
    <aside class="left-pane">
      <WorkspacePanel />
    </aside>

    <div class="pane-divider" />

    <!-- Right: visualization tabs -->
    <div class="right-pane">

      <!-- Horizontal tab bar -->
      <div class="tab-bar">
        <button
          v-for="tab in tabList"
          :key="tab.key"
          class="tab-pill"
          :class="{ active: activeTab === tab.key }"
          @click="selectTab(tab.key)"
        >
          <input
            v-if="editingTab === tab.key"
            v-model="editTitle"
            v-focus
            class="tab-title-input"
            @blur="commitEdit"
            @keyup.enter="commitEdit"
            @keyup.escape="cancelEdit"
            @mousedown.stop
            @click.stop
          />
          <span
            v-else
            class="tab-label"
            :title="activeTab === tab.key ? 'Double-click to rename' : ''"
            @dblclick.stop="startEdit(tab.key, tab.title)"
          >{{ tab.title }}</span>
          <span
            v-if="activeTab === tab.key && editingTab !== tab.key"
            class="tab-close"
            @click.stop="deleteTab(tab.key)"
            title="Delete tab"
          >×</span>
        </button>
        <button class="add-tab-pill" @click="openNewForm">+ Tab</button>
      </div>

      <!-- Content area -->
      <div class="tab-content">

        <!-- New tab form -->
        <div v-if="showNewForm" class="new-tab-form">
          <h3 class="new-tab-heading">New Tab</h3>
          <div class="new-tab-row">
            <label class="new-tab-label">Title</label>
            <input
              v-model="newTitle"
              class="new-tab-input"
              placeholder="e.g. Claims Overview"
              @input="syncKey"
              @keyup.enter="createTab"
            />
          </div>
          <div class="new-tab-row">
            <label class="new-tab-label">Key <span class="new-tab-hint">(no spaces)</span></label>
            <input
              v-model="newKey"
              class="new-tab-input"
              style="font-family: monospace"
              placeholder="e.g. claims_overview"
              @input="keyManuallyEdited = true"
              @keyup.enter="createTab"
            />
          </div>
          <p v-if="newError" class="new-tab-error">{{ newError }}</p>
          <div class="new-tab-actions">
            <button class="btn-create" @click="createTab">Create Tab</button>
            <button class="btn-cancel-new" @click="cancelNew">Cancel</button>
          </div>
        </div>

        <!-- Active tab content -->
        <TabContent
          v-else-if="activeTab"
          :key="activeTab"
          :tabKey="activeTab"
        />

        <div v-else class="empty-hint">
          No tabs yet — click <strong>+ Tab</strong> to create one.
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
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

// Auto-select first tab when data loads
const activeTab = ref(null)
watch(tabList, (list) => {
  if (!activeTab.value && list.length) activeTab.value = list[0].key
}, { immediate: true })

function selectTab(key) {
  cancelEdit()
  showNewForm.value = false
  activeTab.value = key
}

// ── Inline title editing ──────────────────────────────────────────────────────
const editingTab = ref(null)
const editTitle  = ref('')

function startEdit(key, title) {
  activeTab.value  = key
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
  if (activeTab.value === key) {
    activeTab.value = tabList.value.find(t => t.key !== key)?.key ?? null
  }
}

// ── New tab ───────────────────────────────────────────────────────────────────
const showNewForm       = ref(false)
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

function openNewForm() {
  showNewForm.value = true
  activeTab.value = null
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

  activeTab.value = key
  cancelNew()
}

function cancelNew() {
  showNewForm.value       = false
  newTitle.value          = ''
  newKey.value            = ''
  newError.value          = ''
  keyManuallyEdited.value = false
  if (!activeTab.value && tabList.value.length) activeTab.value = tabList.value[0].key
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

/* ── Right pane ── */
.right-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── Tab bar ── */
.tab-bar {
  display: flex;
  align-items: stretch;
  background: #fff;
  border-bottom: 2px solid #e5e7eb;
  flex-shrink: 0;
  overflow-x: auto;
}

.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 18px;
  min-height: 42px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.12s, border-color 0.12s, background 0.1s;
}
.tab-pill:hover:not(.active) { color: #374151; background: #f9fafb; }
.tab-pill.active { color: #4f46e5; border-bottom-color: #4f46e5; }

.tab-label { user-select: none; }

.tab-title-input {
  border: 1px solid #c4b5fd;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 13px;
  font-weight: 500;
  color: #4f46e5;
  background: #f5f3ff;
  outline: none;
  width: 130px;
}

.tab-close {
  font-size: 15px;
  color: #d1d5db;
  line-height: 1;
  padding: 1px 3px;
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.1s, background 0.1s;
}
.tab-close:hover { color: #dc2626; background: #fee2e2; }

.add-tab-pill {
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  min-height: 42px;
  font-size: 12px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  margin-bottom: -2px;
  border-bottom: 2px solid transparent;
}
.add-tab-pill:hover { color: #4f46e5; background: #f5f3ff; }

/* ── Content area ── */
.tab-content {
  flex: 1;
  overflow: auto;
  background: #f8f9fb;
}

/* ── New tab form ── */
.new-tab-form {
  max-width: 440px;
  margin: 40px auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.new-tab-heading { font-size: 15px; font-weight: 700; color: #111; margin: 0; }

.new-tab-row { display: flex; flex-direction: column; gap: 5px; }

.new-tab-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}
.new-tab-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: #9ca3af; }

.new-tab-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  background: #fff;
}
.new-tab-input:focus { border-color: #6366f1; outline: none; }

.new-tab-error { color: #dc2626; font-size: 12px; margin: 0; }

.new-tab-actions { display: flex; gap: 8px; padding-top: 4px; }
.btn-create { background: #4f46e5; color: #fff; font-size: 13px; font-weight: 500; padding: 8px 20px; border-radius: 6px; }
.btn-create:hover { background: #4338ca; }
.btn-cancel-new { background: none; color: #6b7280; font-size: 13px; padding: 8px 14px; border-radius: 6px; border: 1px solid #e5e7eb; }
.btn-cancel-new:hover { background: #f3f4f6; }

.empty-hint {
  padding: 60px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.8;
}
</style>
