<template>
  <div class="template-selector" ref="root">
    <button class="selector-trigger" @click="toggle" :title="currentName">
      <span class="selector-icon">🗂</span>
      <span class="selector-label">{{ currentName }}</span>
      <span class="chevron" :class="{ open }">▾</span>
    </button>

    <div v-if="open" class="selector-dropdown">
      <div class="dropdown-header">Datasets</div>

      <div class="template-list">
        <div
          v-for="t in templateList"
          :key="t.id"
          class="template-item"
          :class="{ active: current && t.id === current.id }"
        >
          <button class="item-select" @click="select(t)">
            <span class="item-dot">{{ current && t.id === current.id ? '●' : '○' }}</span>
            <span class="item-name">{{ t.name }}</span>
            <span class="item-date">{{ formatDate(t.modified) }}</span>
          </button>
          <button
            class="item-delete"
            title="Delete dataset"
            :disabled="templateList.length === 1"
            @click.stop="handleDelete(t)"
          >🗑</button>
        </div>
        <div v-if="!templateList.length" class="empty-list">No datasets yet.</div>
      </div>

      <div class="dropdown-footer">
        <div v-if="creatingMode === 'blank'" class="create-form">
          <input
            ref="newInput"
            v-model="newName"
            class="create-input"
            placeholder="Dataset name…"
            @keyup.enter="confirmCreate(false)"
            @keyup.escape="cancelCreate"
          />
          <button class="create-btn" @click="confirmCreate(false)">Create</button>
          <button class="create-cancel" @click="cancelCreate">✕</button>
        </div>
        <div v-else-if="creatingMode === 'duplicate'" class="create-form">
          <input
            ref="dupInput"
            v-model="newName"
            class="create-input"
            placeholder="New dataset name…"
            @keyup.enter="confirmCreate(true)"
            @keyup.escape="cancelCreate"
          />
          <button class="create-btn" @click="confirmCreate(true)">Duplicate</button>
          <button class="create-cancel" @click="cancelCreate">✕</button>
        </div>
        <template v-else>
          <button class="footer-btn" @click="startCreate('blank')">+ New blank</button>
          <button class="footer-btn" :disabled="!current" @click="startCreate('duplicate')">⎘ Duplicate current</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@/stores/template'

const store = useTemplateStore()
const { templateList, isDirty } = storeToRefs(store)

const root = ref(null)
const open = ref(false)
const creatingMode = ref(null)   // null | 'blank' | 'duplicate'
const newName = ref('')
const newInput = ref(null)
const dupInput = ref(null)

const current = computed(() => store.template)
const currentName = computed(() => current.value ? current.value.name : 'No dataset')

function toggle() {
  open.value = !open.value
  if (!open.value) cancelCreate()
}

function select(t) {
  if (current.value && t.id === current.value.id) { open.value = false; return }
  if (isDirty.value && !confirm('You have unsaved changes. Switch anyway?')) return
  store.fetchTemplate(t.id)
  open.value = false
}

function handleDelete(t) {
  if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return
  store.deleteTemplate(t.id)
}

async function startCreate(mode) {
  creatingMode.value = mode
  newName.value = (mode === 'duplicate' && current.value) ? current.value.name + ' (copy)' : ''
  await nextTick()
  const inputEl = mode === 'duplicate' ? dupInput.value : newInput.value
  inputEl?.focus()
}

function cancelCreate() {
  creatingMode.value = null
  newName.value = ''
}

async function confirmCreate(duplicate) {
  const name = newName.value.trim()
  if (!name) return
  const layout = (duplicate && current.value)
    ? JSON.parse(JSON.stringify(current.value.layout))
    : {}
  await store.createTemplate({ name, layout })
  cancelCreate()
  open.value = false
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const outsideClick = (e) => {
  if (open.value && !root.value?.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', outsideClick, true))
onBeforeUnmount(() => document.removeEventListener('click', outsideClick, true))
</script>

<style scoped>
.template-selector { position: relative; }

.selector-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 13px;
  max-width: 220px;
  transition: background 0.15s;
}
.selector-trigger:hover { background: rgba(255,255,255,0.2); }

.selector-icon { font-size: 14px; flex-shrink: 0; }

.selector-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-weight: 500;
}

.chevron { font-size: 12px; opacity: 0.7; transition: transform 0.15s; flex-shrink: 0; }
.chevron.open { transform: rotate(180deg); }

.selector-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 300px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 200;
  overflow: hidden;
}

.dropdown-header {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  padding: 10px 14px 6px;
}

.template-list { max-height: 240px; overflow-y: auto; }

.template-item {
  display: flex;
  align-items: center;
  padding: 0 6px 0 4px;
  border-radius: 6px;
  margin: 1px 6px;
  transition: background 0.1s;
}
.template-item:hover { background: #f3f4f6; }
.template-item.active { background: #eff6ff; }

.item-select {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 6px;
  background: none;
  text-align: left;
  min-width: 0;
}

.item-dot { font-size: 9px; color: #9ca3af; flex-shrink: 0; }
.template-item.active .item-dot { color: #3b82f6; }

.item-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: #111;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.template-item.active .item-name { color: #1d4ed8; }

.item-date { font-size: 10px; color: #9ca3af; flex-shrink: 0; }

.item-delete {
  background: none;
  font-size: 13px;
  opacity: 0;
  padding: 4px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: opacity 0.1s;
}
.template-item:hover .item-delete { opacity: 0.5; }
.item-delete:hover:not(:disabled) { opacity: 1; background: #fee2e2; }
.item-delete:disabled { cursor: default; }

.empty-list { padding: 12px 14px; font-size: 12px; color: #9ca3af; }

.dropdown-footer {
  border-top: 1px solid #f3f4f6;
  padding: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.footer-btn {
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  flex: 1;
}
.footer-btn:hover:not(:disabled) { background: #e5e7eb; }
.footer-btn:disabled { opacity: 0.4; cursor: default; }

.create-form { display: flex; align-items: center; gap: 6px; width: 100%; }

.create-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
  background: #fff;
}
.create-input:focus { border-color: #6366f1; outline: none; }

.create-btn {
  background: #4f46e5;
  color: #fff;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
.create-btn:hover { background: #4338ca; }

.create-cancel { background: none; color: #9ca3af; font-size: 14px; padding: 4px 6px; }
.create-cancel:hover { color: #374151; }
</style>
