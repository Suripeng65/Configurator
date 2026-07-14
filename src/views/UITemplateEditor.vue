<template>
  <div class="editor-wrap">

    <!-- Loading template -->
    <div v-if="loadingTemplate" class="state-msg">Loading template…</div>

    <!-- Error -->
    <div v-else-if="fetchError" class="error-state">
      <strong>Could not load template</strong>
      <pre>{{ fetchError }}</pre>
    </div>

    <!-- No template yet for this dsId -->
    <div v-else-if="!template" class="empty-state">
      <div class="empty-card">
        <div class="empty-icon">📄</div>
        <h3>No template for "{{ dsId }}"</h3>
        <p>No UI template exists for this dataset yet.</p>
        <BButton variant="primary" @click="createBlank">Create blank template</BButton>
      </div>
    </div>

    <!-- Editor body — section determined by route -->
    <template v-else>

      <!-- Layout / Dev Mode view -->
      <template v-if="section === 'layout'">
        <UserEditor v-if="mode === 'user'" />
        <div v-else class="split-container" ref="splitContainer" :class="{ 'is-dragging': isDragging }">
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
              <button class="copy-icon-btn" @click="copyJson">⎘</button>
            </div>
            <JsonPreview :value="template.layout" />
          </div>
        </div>
      </template>

      <!-- Datasources view (user editor datasources panel) -->
      <template v-else-if="section === 'datasources'">
        <UserEditor v-if="mode === 'user'" :initial-tab="'datasources'" />
        <div v-else class="coming-soon">
          <p>Datasources panel — switch to User Mode to edit.</p>
        </div>
      </template>

      <!-- Placeholder for other sections -->
      <div v-else class="coming-soon">
        <p>{{ section }} — coming soon.</p>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import axios from 'axios'
import { BButton } from 'bootstrap-vue-next'
import { useTemplateStore } from '@/stores/template'
import TreeNode from '@/components/TreeNode.vue'
import JsonPreview from '@/components/JsonPreview.vue'
import UserEditor from '@/views/UserEditor.vue'

const API = 'http://localhost:8000'
const route = useRoute()
const store = useTemplateStore()
const { template, fetchError, mode } = storeToRefs(store)

const dsId    = computed(() => route.params.dsId)
const section = computed(() => route.meta.editorSection || 'layout')

const loadingTemplate = ref(false)

// Resizable split pane
const splitContainer = ref(null)
const treePaneWidth  = ref(60)
const isDragging     = ref(false)

async function loadTemplate() {
  loadingTemplate.value = true
  try {
    // Try to load by dsId first, fall back to integer id
    const idNum = parseInt(dsId.value)
    if (!isNaN(idNum)) {
      await store.fetchTemplate(idNum)
    } else {
      await store.fetchTemplateByDsId(dsId.value)
    }
  } finally {
    loadingTemplate.value = false
  }
}

async function createBlank() {
  await store.createTemplate({ name: `Template for ${dsId.value}`, layout: {}, ds_id: dsId.value })
}

watch(dsId, loadTemplate, { immediate: true })

function copyJson() {
  if (!template.value) return
  const json = JSON.stringify(template.value.layout, null, 2)
  navigator.clipboard.writeText(json).catch(() => alert(json))
}

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
</script>

<style scoped>
.editor-wrap {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-direction: column;
}

.state-msg { padding: 40px; text-align: center; color: #6b7280; font-size: 14px; }

.error-state {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #dc2626;
  text-align: center;
}
.error-state pre {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  color: #7f1d1d;
  white-space: pre-wrap;
  max-width: 480px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px 48px;
  text-align: center;
}
.empty-icon { font-size: 40px; }
.empty-card h3 { font-size: 16px; font-weight: 700; color: #111; margin: 0; }
.empty-card p  { font-size: 13px; color: #6b7280; margin: 0; }

/* Split pane (same as old ConfigEditor) */
.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.split-container.is-dragging { cursor: col-resize; user-select: none; }

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
.splitter {
  flex: 0 0 6px;
  background: #e5e7eb;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.splitter:hover, .split-container.is-dragging .splitter { background: #c7d2fe; }
.splitter-dots {
  width: 2px;
  height: 32px;
  border-radius: 2px;
  background: repeating-linear-gradient(to bottom, #9ca3af 0px, #9ca3af 3px, transparent 3px, transparent 6px);
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
.copy-icon-btn { background: none; color: #9ca3af; font-size: 14px; padding: 0; line-height: 1; }
.copy-icon-btn:hover { color: #374151; }
.tree-scroll { flex: 1; overflow: auto; padding: 8px 4px 24px 8px; }

.coming-soon {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}
</style>
