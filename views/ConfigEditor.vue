<template>
  <div class="config-editor">
    <!-- Header -->
    <header class="editor-header">
      <div class="header-left">
        <span class="app-title">Configurator</span>
        <TemplateSelector v-model:show="showDatasetModal" />
        <input
          v-if="template"
          v-model="templateName"
          class="name-input"
          placeholder="Rename dataset…"
          @change="updateMeta"
        />
      </div>
      <div class="header-right">
        <div class="mode-toggle">
          <button :class="['mode-btn', { active: mode === 'user' }]" @click="store.setMode('user')">User Mode</button>
          <button :class="['mode-btn', { active: mode === 'dev' }]" @click="store.setMode('dev')">Dev Mode</button>
        </div>
        <div class="header-divider" />
        <Transition name="fade">
          <span v-if="saveStatus === 'saved'" class="status-msg saved">Saved ✓</span>
          <span v-else-if="saveStatus === 'error'" class="status-msg error">Save failed</span>
        </Transition>
        <button
          class="btn-primary"
          :disabled="!isDirty || saveStatus === 'saving'"
          @click="store.saveTemplate()"
        >{{ saveStatus === 'saving' ? 'Saving…' : 'Save' }}</button>
        <button class="btn-secondary" @click="showImport = true">Import JSON</button>
        <button class="btn-secondary" @click="copyJson">Copy JSON</button>
      </div>
    </header>

    <!-- Error state -->
    <div v-if="fetchError" class="fetch-error">
      <strong>Backend not reachable</strong>
      <pre>{{ fetchError }}</pre>
    </div>

    <!-- Welcome / empty state -->
    <div v-else-if="!template" class="welcome">
      <div class="welcome-card">
        <div class="welcome-icon">🗂</div>
        <h2 class="welcome-title">No dataset selected</h2>
        <p class="welcome-hint">Pick a dataset from the list to start editing its configuration.</p>
        <button class="welcome-btn" @click="showDatasetModal = true">Select Dataset →</button>
      </div>
    </div>

    <!-- Editor body -->
    <div v-else class="editor-body">
      <LayoutEditor v-if="mode === 'user'" />

      <template v-else>
        <div
          class="split-container"
          ref="splitContainer"
          :class="{ 'is-dragging': isDragging }"
        >
          <div class="tree-pane" :style="{ width: treePaneWidth + '%' }">
            <div class="pane-title">Configuration Tree</div>
            <div class="tree-scroll">
              <TreeNode :node-value="template.layout" :node-path="[]" :is-root="true" />
            </div>
          </div>
          <div class="splitter" @mousedown.prevent="startDrag">
            <div class="splitter-dots" />
          </div>
          <div class="preview-pane">
            <div class="pane-title">
              JSON Preview
              <button class="copy-icon-btn" title="Copy to clipboard" @click="copyJson">⎘</button>
            </div>
            <JsonPreview :value="template.layout" />
          </div>
        </div>
      </template>
    </div>

    <!-- Import modal -->
    <div v-if="showImport" class="modal-overlay" @click.self="closeImport">
      <div class="modal">
        <h3 class="modal-title">Import JSON</h3>
        <p class="modal-hint">
          Paste a full template object <code>{"layout": {...}}</code> or just the layout object.
          This replaces the current layout.
        </p>
        <textarea
          v-model="importText"
          class="import-textarea"
          placeholder="Paste JSON here…"
          spellcheck="false"
        />
        <p v-if="importError" class="import-error">{{ importError }}</p>
        <div class="modal-actions">
          <button class="btn-primary" @click="doImport">Import</button>
          <button class="btn-secondary" @click="closeImport">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@src/stores/template'
import TreeNode from '@src/components/TreeNode.vue'
import JsonPreview from '@src/components/JsonPreview.vue'
import LayoutEditor from '@src/views/LayoutEditor.vue'
import TemplateSelector from '@src/components/TemplateSelector.vue'

const store = useTemplateStore()
const { template, isDirty, saveStatus, fetchError, mode } = storeToRefs(store)

const templateName = ref('')
const showImport = ref(false)
const showDatasetModal = ref(false)
const importText = ref('')
const importError = ref('')

// Resizable split pane
const splitContainer = ref(null)
const treePaneWidth = ref(60)   // percentage
const isDragging = ref(false)

function startDrag(e) {
  isDragging.value = true

  const onMove = (e) => {
    if (!splitContainer.value) return
    const rect = splitContainer.value.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    treePaneWidth.value = Math.min(80, Math.max(20, pct))
  }

  const onUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

watch(template, (val) => {
  if (val) templateName.value = val.name || ''
}, { immediate: true })

store.fetchTemplateList()

function updateMeta() {
  store.setTemplateMeta({ name: templateName.value })
}

function copyJson() {
  if (!template.value) return
  const json = JSON.stringify(template.value.layout, null, 2)
  navigator.clipboard.writeText(json).catch(() => alert(json))
}

function closeImport() {
  showImport.value = false
  importText.value = ''
  importError.value = ''
}

function doImport() {
  importError.value = ''
  try {
    let parsed = JSON.parse(importText.value)
    if (parsed && typeof parsed.layout === 'object') parsed = parsed.layout
    store.replaceLayout(parsed)
    closeImport()
  } catch (e) {
    importError.value = 'Invalid JSON: ' + e.message
  }
}
</script>

<style scoped>
.config-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: #1e2a3a;
  color: #fff;
  flex-shrink: 0;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.app-title {
  font-size: 14px;
  font-weight: 700;
  color: #7dd3fc;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.name-input {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 4px 8px;
  width: 220px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
}
.name-input::placeholder { color: rgba(255,255,255,0.4); }

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.mode-toggle {
  display: flex;
  background: rgba(255,255,255,0.12);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}
.mode-btn {
  background: transparent;
  color: rgba(255,255,255,0.65);
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
}
.mode-btn.active { background: #fff; color: #1e2a3a; }
.mode-btn:hover:not(.active) { color: #fff; }

.header-divider {
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,0.2);
}

.status-msg {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 10px;
}
.saved { background: #d1fae5; color: #065f46; }
.error { background: #fee2e2; color: #dc2626; }

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Split container wraps tree + splitter + preview in dev mode */
.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.split-container.is-dragging {
  cursor: col-resize;
  user-select: none;
}

.tree-pane {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  min-width: 200px;
}

.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 160px;
}

/* Draggable splitter */
.splitter {
  flex: 0 0 6px;
  background: #e5e7eb;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  position: relative;
}
.splitter:hover,
.split-container.is-dragging .splitter { background: #c7d2fe; }

.splitter-dots {
  width: 2px;
  height: 32px;
  border-radius: 2px;
  background: repeating-linear-gradient(
    to bottom,
    #9ca3af 0px, #9ca3af 3px,
    transparent 3px, transparent 6px
  );
  pointer-events: none;
}
.splitter:hover .splitter-dots,
.split-container.is-dragging .splitter-dots { background: repeating-linear-gradient(
    to bottom,
    #6366f1 0px, #6366f1 3px,
    transparent 3px, transparent 6px
  );
}

.pane-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-icon-btn {
  background: none;
  color: #9ca3af;
  font-size: 14px;
  padding: 0;
  line-height: 1;
}
.copy-icon-btn:hover { color: #374151; }

.tree-scroll {
  flex: 1;
  overflow: auto;
  padding: 8px 4px 24px 8px;
}

.welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 48px 56px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  text-align: center;
  max-width: 400px;
}

.welcome-icon { font-size: 48px; line-height: 1; }
.welcome-title { font-size: 20px; font-weight: 700; color: #111; margin: 0; }
.welcome-hint { font-size: 14px; color: #6b7280; margin: 0; line-height: 1.5; }

.welcome-btn {
  margin-top: 8px;
  background: #4f46e5;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  transition: background 0.15s;
}
.welcome-btn:hover { background: #4338ca; }

.fetch-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #dc2626;
  text-align: center;
  padding: 24px;
}
.fetch-error pre {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 12px;
  color: #7f1d1d;
  white-space: pre-wrap;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 640px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}

.modal-title { font-size: 16px; font-weight: 600; color: #111; }
.modal-hint { font-size: 12px; color: #6b7280; line-height: 1.5; }
.modal-hint code {
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: "Fira Code", monospace;
  font-size: 11px;
}

.import-textarea {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 10px;
  height: 320px;
  font-family: "Fira Code", monospace;
  font-size: 12px;
  resize: vertical;
  background: #1e1e1e;
  color: #d4d4d4;
}

.import-error { color: #dc2626; font-size: 12px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
