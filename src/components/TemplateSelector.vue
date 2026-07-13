<template>
  <!-- Trigger button in header -->
  <button class="selector-trigger" @click="$emit('update:show', true)">
    <span class="selector-icon">🗂</span>
    <span class="selector-label">{{ triggerLabel }}</span>
    <span class="chevron">▾</span>
  </button>

  <!-- Dataset modal -->
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="close">
      <div class="modal">

        <!-- Modal header -->
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Datasets</h2>
            <p class="modal-subtitle">Select a dataset to open it in the editor.</p>
          </div>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <!-- Dataset table -->
        <div class="table-wrap">
          <table class="ds-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Last Modified</th>
                <th>Modified By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in templateList"
                :key="t.id"
                class="ds-row"
                :class="{ 'ds-row--active': current && t.id === current.id }"
                @click="select(t)"
              >
                <td class="col-dot">
                  <span v-if="current && t.id === current.id" class="active-dot">●</span>
                  <span v-else class="inactive-dot">○</span>
                </td>
                <td class="col-name">
                  <span class="ds-name">{{ t.name }}</span>
                  <span v-if="t.description" class="ds-desc">{{ t.description }}</span>
                </td>
                <td class="col-date">{{ formatDate(t.modified) }}</td>
                <td class="col-by">{{ t.modifiedBy || '—' }}</td>
                <td class="col-actions" @click.stop>
                  <button
                    v-if="!(current && t.id === current.id)"
                    class="select-btn"
                    @click="select(t)"
                  >Open →</button>
                  <span v-else class="current-badge">Current</span>
                  <button
                    class="delete-btn"
                    title="Delete dataset"
                    :disabled="templateList.length === 1"
                    @click="handleDelete(t)"
                  >🗑</button>
                </td>
              </tr>

              <tr v-if="!templateList.length">
                <td colspan="5" class="empty-row">No datasets yet. Create one below.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer actions -->
        <div class="modal-footer">
          <div v-if="creatingMode === 'blank'" class="create-form">
            <input ref="newInput" v-model="newName" class="create-input" placeholder="Dataset name…"
              @keyup.enter="confirmCreate(false)" @keyup.escape="cancelCreate" />
            <button class="footer-confirm-btn" @click="confirmCreate(false)">Create</button>
            <button class="footer-cancel-btn" @click="cancelCreate">Cancel</button>
          </div>
          <div v-else-if="creatingMode === 'duplicate'" class="create-form">
            <input ref="dupInput" v-model="newName" class="create-input" placeholder="New dataset name…"
              @keyup.enter="confirmCreate(true)" @keyup.escape="cancelCreate" />
            <button class="footer-confirm-btn" @click="confirmCreate(true)">Duplicate</button>
            <button class="footer-cancel-btn" @click="cancelCreate">Cancel</button>
          </div>
          <template v-else>
            <button class="footer-btn" @click="startCreate('blank')">+ New blank</button>
            <button class="footer-btn" :disabled="!current" @click="startCreate('duplicate')">⎘ Duplicate current</button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@/stores/template'

const props = defineProps({
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['update:show'])

const store = useTemplateStore()
const { templateList, isDirty } = storeToRefs(store)

const creatingMode = ref(null)
const newName = ref('')
const newInput = ref(null)
const dupInput = ref(null)

const current = computed(() => store.template)
const triggerLabel = computed(() =>
  current.value ? current.value.name : 'Select Dataset'
)

function close() {
  emit('update:show', false)
  cancelCreate()
}

function select(t) {
  if (current.value && t.id === current.value.id) { close(); return }
  if (isDirty.value && !confirm('You have unsaved changes. Switch anyway?')) return
  store.fetchTemplate(t.id)
  close()
}

function handleDelete(t) {
  if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return
  store.deleteTemplate(t.id)
}

async function startCreate(mode) {
  creatingMode.value = mode
  newName.value = (mode === 'duplicate' && current.value) ? current.value.name + ' (copy)' : ''
  await nextTick()
  const el = mode === 'duplicate' ? dupInput.value : newInput.value
  el?.focus()
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
  close()
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
/* ── Trigger button ── */
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
  max-width: 240px;
  transition: background 0.15s;
  cursor: pointer;
}
.selector-trigger:hover { background: rgba(255,255,255,0.22); }
.selector-icon { font-size: 14px; flex-shrink: 0; }
.selector-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.chevron { font-size: 12px; opacity: 0.7; flex-shrink: 0; }

/* ── Modal overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 24px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25);
  overflow: hidden;
}

/* ── Modal header ── */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.modal-title { font-size: 18px; font-weight: 700; color: #111; margin: 0 0 2px; }
.modal-subtitle { font-size: 13px; color: #6b7280; margin: 0; }
.close-btn {
  background: none;
  color: #9ca3af;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
  flex-shrink: 0;
}
.close-btn:hover { background: #f3f4f6; color: #374151; }

/* ── Table ── */
.table-wrap { flex: 1; overflow-y: auto; }

.ds-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.ds-table thead th {
  background: #f9fafb;
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1;
}

.ds-row {
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid #f3f4f6;
}
.ds-row:hover { background: #f9fafb; }
.ds-row--active { background: #eff6ff; }
.ds-row--active:hover { background: #dbeafe; }

.ds-table td { padding: 12px 14px; vertical-align: middle; }

.col-dot { width: 32px; text-align: center; }
.active-dot   { color: #3b82f6; font-size: 10px; }
.inactive-dot { color: #d1d5db; font-size: 10px; }

.col-name { min-width: 200px; }
.ds-name { font-weight: 600; color: #111; display: block; }
.ds-row--active .ds-name { color: #1d4ed8; }
.ds-desc { font-size: 11px; color: #9ca3af; display: block; margin-top: 1px; }

.col-date { color: #6b7280; white-space: nowrap; font-size: 12px; }
.col-by   { color: #9ca3af; font-size: 12px; white-space: nowrap; }

.col-actions {
  text-align: right;
  white-space: nowrap;
}

.select-btn {
  background: #4f46e5;
  color: #fff;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  margin-right: 6px;
}
.select-btn:hover { background: #4338ca; }

.current-badge {
  font-size: 11px;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 3px 8px;
  border-radius: 10px;
  margin-right: 6px;
  font-weight: 600;
}

.delete-btn {
  background: none;
  font-size: 14px;
  opacity: 0.35;
  padding: 4px 6px;
  border-radius: 4px;
}
.delete-btn:hover:not(:disabled) { opacity: 1; background: #fee2e2; }
.delete-btn:disabled { cursor: default; opacity: 0.15; }

.empty-row {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
  font-size: 13px;
}

/* ── Footer ── */
.modal-footer {
  border-top: 1px solid #f3f4f6;
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background: #fafafa;
}

.footer-btn {
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  padding: 7px 14px;
  border-radius: 6px;
}
.footer-btn:hover:not(:disabled) { background: #e5e7eb; }
.footer-btn:disabled { opacity: 0.4; cursor: default; }

.create-form { display: flex; align-items: center; gap: 8px; flex: 1; }
.create-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
}
.create-input:focus { border-color: #6366f1; outline: none; }
.footer-confirm-btn { background: #4f46e5; color: #fff; font-size: 12px; padding: 6px 14px; border-radius: 6px; }
.footer-confirm-btn:hover { background: #4338ca; }
.footer-cancel-btn { background: none; color: #6b7280; font-size: 12px; padding: 6px 10px; }
</style>
