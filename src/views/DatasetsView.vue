<template>
  <div class="view-wrap">

    <!-- Page header -->
    <div class="page-header">
      <h2 class="page-title">Datasets</h2>
      <BButton variant="primary" size="sm" @click="openCreate">+ Create</BButton>
    </div>

    <!-- Loading / error -->
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <!-- Inline editable table -->
    <div v-else class="table-wrap">
      <BTable
        :items="rows"
        :fields="fields"
        bordered
        hover
        responsive
        class="dataset-table"
      >
        <template #cell(name)="{ item, index }">
          <input
            v-model="rows[index].name"
            class="cell-input"
            @input="markDirty(index)"
          />
        </template>
        <template #cell(dsId)="{ item, index }">
          <input
            v-model="rows[index].dsId"
            class="cell-input"
            @input="markDirty(index)"
          />
        </template>
        <template #cell(containerId)="{ item, index }">
          <input
            v-model="rows[index].containerId"
            class="cell-input"
            @input="markDirty(index)"
          />
        </template>
        <template #cell(siteCode)="{ item, index }">
          <input
            v-model="rows[index].siteCode"
            class="cell-input"
            @input="markDirty(index)"
          />
        </template>
        <template #cell(actions)="{ item, index }">
          <div class="row-actions">
            <template v-if="dirtyRows.has(index)">
              <BButton
                size="sm"
                variant="success"
                :disabled="saving === index"
                @click="saveRow(index)"
              >{{ saving === index ? 'Saving…' : 'Save' }}</BButton>
              <BButton
                size="sm"
                variant="outline-secondary"
                :disabled="saving === index"
                @click="cancelRow(index)"
              >Cancel</BButton>
            </template>
            <BButton
              v-else
              size="sm"
              variant="outline-danger"
              @click="deleteRow(item)"
            >✕</BButton>
          </div>
        </template>
      </BTable>
    </div>

    <!-- Create modal -->
    <BModal
      v-model="showCreate"
      title="Create Dataset"
      ok-title="Save"
      ok-variant="primary"
      cancel-variant="outline-secondary"
      @ok.prevent="submitCreate"
      @hide="resetCreate"
    >
      <div class="form-fields">
        <div class="form-row">
          <label>Name</label>
          <BFormInput v-model="createForm.name" placeholder="Dataset name" />
        </div>
        <div class="form-row">
          <label>DSID</label>
          <BFormInput v-model="createForm.dsId" placeholder="e.g. FDA_CLAIMS_2" />
        </div>
        <div class="form-row">
          <label>Container ID</label>
          <BFormInput v-model="createForm.containerId" placeholder="Container ID" />
        </div>
        <div class="form-row">
          <label>Site Code</label>
          <BFormInput v-model="createForm.siteCode" placeholder="Site code" />
        </div>
        <div class="form-row">
          <label>Description</label>
          <BFormInput v-model="createForm.description" placeholder="Description (optional)" />
        </div>
        <p v-if="createError" class="create-error">{{ createError }}</p>
      </div>
    </BModal>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { BTable, BButton, BModal, BFormInput } from 'bootstrap-vue-next'

const API = 'http://localhost:8000'

const rows      = ref([])
const originals = ref([])   // snapshot of server state for cancel
const loading   = ref(false)
const error     = ref('')
const dirtyRows = ref(new Set())
const saving    = ref(null)

const showCreate  = ref(false)
const createError = ref('')
const createForm  = ref({ name: '', dsId: '', containerId: '', siteCode: '', description: '' })

const fields = [
  { key: 'name',        label: 'Dataset Name', thStyle: 'min-width:180px' },
  { key: 'dsId',        label: 'DSID',         thStyle: 'min-width:140px' },
  { key: 'containerId', label: 'Container ID',  thStyle: 'min-width:120px' },
  { key: 'siteCode',    label: 'Site Code',     thStyle: 'min-width:100px' },
  { key: 'actions',     label: '',              thStyle: 'width:160px' },
]

async function fetchAll() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${API}/dataset-metadata/all`)
    rows.value = res.data.map(d => ({ ...d }))
    originals.value = res.data.map(d => ({ ...d }))
    dirtyRows.value = new Set()
  } catch (e) {
    error.value = 'Failed to load datasets. Is the backend running?'
  } finally {
    loading.value = false
  }
}

function markDirty(index) {
  dirtyRows.value = new Set([...dirtyRows.value, index])
}

async function saveRow(index) {
  saving.value = index
  const row = rows.value[index]
  try {
    await axios.put(`${API}/dataset-metadata/${row.dsId}`, {
      ds_id: row.dsId,
      name: row.name,
      container_id: row.containerId,
      site_code: row.siteCode,
      description: row.description,
    })
    originals.value[index] = { ...rows.value[index] }
    const next = new Set(dirtyRows.value)
    next.delete(index)
    dirtyRows.value = next
  } catch (e) {
    alert('Save failed: ' + (e.response?.data?.detail ?? e.message))
  } finally {
    saving.value = null
  }
}

function cancelRow(index) {
  rows.value[index] = { ...originals.value[index] }
  const next = new Set(dirtyRows.value)
  next.delete(index)
  dirtyRows.value = next
}

async function deleteRow(item) {
  if (!confirm(`Delete "${item.name}"?`)) return
  try {
    await axios.delete(`${API}/dataset-metadata/${item.dsId}`)
    await fetchAll()
  } catch (e) {
    alert('Delete failed: ' + (e.response?.data?.detail ?? e.message))
  }
}

function openCreate() {
  createForm.value = { name: '', dsId: '', containerId: '', siteCode: '', description: '' }
  createError.value = ''
  showCreate.value = true
}

function resetCreate() {
  createError.value = ''
}

async function submitCreate() {
  createError.value = ''
  const f = createForm.value
  if (!f.name.trim() || !f.dsId.trim()) {
    createError.value = 'Name and DSID are required.'
    return
  }
  try {
    await axios.post(`${API}/dataset-metadata`, {
      ds_id: f.dsId.trim(),
      name: f.name.trim(),
      container_id: f.containerId.trim() || null,
      site_code: f.siteCode.trim() || null,
      description: f.description.trim() || null,
    })
    showCreate.value = false
    await fetchAll()
  } catch (e) {
    createError.value = e.response?.data?.detail ?? 'Create failed.'
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.view-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #3b82f6;
  color: #fff;
  flex-shrink: 0;
}
.page-title { font-size: 16px; font-weight: 700; margin: 0; color: #fff; }

.table-wrap {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.dataset-table :deep(td) { vertical-align: middle; padding: 6px 10px; }
.dataset-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }

.cell-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 13px;
  background: transparent;
  transition: border-color 0.15s, background 0.15s;
}
.cell-input:hover { border-color: #d1d5db; background: #fff; }
.cell-input:focus { border-color: #3b82f6; background: #fff; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }

.row-actions { display: flex; gap: 6px; align-items: center; justify-content: flex-end; }

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }

.form-fields { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: 12px; font-weight: 600; color: #374151; }
.create-error { color: #dc2626; font-size: 12px; margin: 0; }
</style>
