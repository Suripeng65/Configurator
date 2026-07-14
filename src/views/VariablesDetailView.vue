<template>
  <div class="view-wrap">
    <div class="page-header">
      <div>
        <div class="page-back" @click="router.back()">← Variables</div>
        <h2 class="page-title">Variables — <span class="ds-label">{{ dsId }}</span></h2>
      </div>
      <BButton variant="primary" size="sm" @click="openCreate">+ Add Column</BButton>
    </div>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <BTable
        :items="columns"
        :fields="fields"
        bordered
        hover
        responsive
        class="col-table"
      >
        <template #cell(columnName)="{ item, index }">
          <input v-model="columns[index].columnName" class="cell-input" @input="markDirty(index)" />
        </template>
        <template #cell(columnDisplayName)="{ item, index }">
          <input v-model="columns[index].columnDisplayName" class="cell-input" @input="markDirty(index)" />
        </template>
        <template #cell(format)="{ item, index }">
          <input v-model="columns[index].format" class="cell-input" @input="markDirty(index)" />
        </template>
        <template #cell(visibility)="{ item, index }">
          <input type="checkbox" v-model="columns[index].visibility" @change="markDirty(index)" />
        </template>
        <template #cell(actions)="{ item, index }">
          <div class="row-actions">
            <BButton v-if="dirtyRows.has(index)" size="sm" variant="success"
              :disabled="saving === index" @click="saveRow(index)">
              {{ saving === index ? 'Saving…' : 'Save' }}
            </BButton>
            <BButton size="sm" variant="outline-danger" @click="deleteCol(item)">✕</BButton>
          </div>
        </template>
      </BTable>
      <p v-if="!columns.length" class="empty-msg">No columns defined for this dataset.</p>
    </div>

    <!-- Add column modal -->
    <BModal
      v-model="showCreate"
      title="Add Column"
      ok-title="Add"
      ok-variant="primary"
      cancel-variant="outline-secondary"
      @ok.prevent="submitCreate"
    >
      <div class="form-fields">
        <div class="form-row">
          <label>Column Name</label>
          <BFormInput v-model="newCol.columnName" placeholder="e.g. patientAge" />
        </div>
        <div class="form-row">
          <label>Display Name</label>
          <BFormInput v-model="newCol.columnDisplayName" placeholder="e.g. Patient Age" />
        </div>
        <div class="form-row">
          <label>Format</label>
          <BFormInput v-model="newCol.format" placeholder="e.g. string, number, currency" />
        </div>
        <div class="form-row form-row-check">
          <label>Visible</label>
          <input type="checkbox" v-model="newCol.visibility" />
        </div>
      </div>
    </BModal>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { BTable, BButton, BModal, BFormInput } from 'bootstrap-vue-next'

const API = 'http://localhost:8000'
const route  = useRoute()
const router = useRouter()
const dsId   = route.params.dsId

const columns   = ref([])
const loading   = ref(false)
const error     = ref('')
const dirtyRows = ref(new Set())
const saving    = ref(null)
const showCreate = ref(false)
const newCol     = ref({ columnName: '', columnDisplayName: '', format: '', visibility: true })

const fields = [
  { key: 'columnName',        label: 'Column Name',         thStyle: 'min-width:150px' },
  { key: 'columnDisplayName', label: 'Display Name',        thStyle: 'min-width:150px' },
  { key: 'format',            label: 'Format',              thStyle: 'min-width:100px' },
  { key: 'visibility',        label: 'Visible',             thStyle: 'width:80px' },
  { key: 'actions',           label: '',                    thStyle: 'width:120px' },
]

async function fetchColumns() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${API}/columnTemplate`, { params: { dsId } })
    columns.value = res.data.map(c => ({ ...c }))
    dirtyRows.value = new Set()
  } catch {
    error.value = 'Failed to load columns.'
  } finally {
    loading.value = false
  }
}

function markDirty(i) {
  dirtyRows.value = new Set([...dirtyRows.value, i])
}

async function saveRow(i) {
  saving.value = i
  const col = columns.value[i]
  try {
    await axios.put(`${API}/columnTemplate/${col.id}`, {
      column_name: col.columnName,
      column_display_name: col.columnDisplayName,
      format: col.format,
      visibility: col.visibility,
    })
    const next = new Set(dirtyRows.value)
    next.delete(i)
    dirtyRows.value = next
  } catch (e) {
    alert('Save failed: ' + (e.response?.data?.detail ?? e.message))
  } finally {
    saving.value = null
  }
}

async function deleteCol(item) {
  if (!confirm(`Delete column "${item.columnName}"?`)) return
  try {
    await axios.delete(`${API}/columnTemplate/${item.id}`)
    await fetchColumns()
  } catch (e) {
    alert('Delete failed.')
  }
}

function openCreate() {
  newCol.value = { columnName: '', columnDisplayName: '', format: '', visibility: true }
  showCreate.value = true
}

async function submitCreate() {
  const c = newCol.value
  if (!c.columnName.trim()) return
  try {
    await axios.post(`${API}/columnTemplate`, {
      column_name: c.columnName,
      column_display_name: c.columnDisplayName,
      format: c.format,
      visibility: c.visibility,
    }, { params: { dsId } })
    showCreate.value = false
    await fetchColumns()
  } catch (e) {
    alert('Create failed: ' + (e.response?.data?.detail ?? e.message))
  }
}

onMounted(fetchColumns)
</script>

<style scoped>
.view-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f9fafb; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 12px;
  background: #3b82f6;
  flex-shrink: 0;
}
.page-back { font-size: 12px; color: rgba(255,255,255,0.75); cursor: pointer; margin-bottom: 2px; }
.page-back:hover { color: #fff; }
.page-title { font-size: 15px; font-weight: 700; margin: 0; color: #fff; }
.ds-label { font-family: monospace; font-weight: 400; font-size: 13px; }

.table-wrap { flex: 1; overflow: auto; padding: 16px; }
.col-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }
.col-table :deep(td) { vertical-align: middle; padding: 6px 10px; }

.cell-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 13px;
  background: transparent;
}
.cell-input:hover { border-color: #d1d5db; background: #fff; }
.cell-input:focus { border-color: #3b82f6; background: #fff; outline: none; }

.row-actions { display: flex; gap: 6px; justify-content: flex-end; }

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }
.empty-msg { text-align: center; color: #9ca3af; padding: 24px; font-size: 13px; }

.form-fields { display: flex; flex-direction: column; gap: 12px; }
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: 12px; font-weight: 600; color: #374151; }
.form-row-check { flex-direction: row; align-items: center; gap: 10px; }
</style>
