<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import Banner from '@src/components/Banner.vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '@src/utils/date-util'
import { datasetsQueries } from '@src/queries'

const route  = useRoute()
const router = useRouter()

const originals = ref([])   // snapshot of server state for cancel
const dirtyRows = ref(new Set())
const saving    = ref(null)

const showCreate  = ref(false)
const createError = ref('')
const createForm  = ref({ name: '', dsId: '', containerId: '', siteCode: '', description: '' })


const { data, isLoading: loading, error } = datasetsQueries.useList()
const { mutate: create, isLoading: creating } = datasetsQueries.useCreate()
const { mutate: remove } = datasetsQueries.useRemove()

const rows = computed(() => data.value ?? [])

const fields = [
  { key: 'id', label: 'ID',  thStyle: 'min-width:120px' },
  { key: 'name',        label: 'Dataset Name', thStyle: 'min-width:180px' },
  { key: 'dsid',        label: 'DSID',         thStyle: 'min-width:140px' },
  { key: 'created',    label: 'Created Date',     thStyle: 'min-width:100px' },
  { key: 'modified',    label: 'Modified Date',     thStyle: 'min-width:100px' },
  { key: 'modifiedBy',  label: 'Modified By',     thStyle: 'min-width:100px' },
]

function markDirty(index) {
  dirtyRows.value = new Set([...dirtyRows.value, index])
}

async function saveRow(index) {
  saving.value = index
  const row = rows.value[index]
  try {
    await axios.put(`dataset-metadata/${row.dsid}`, {
      ds_id: row.dsid,
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
    await axios.delete(`dataset-metadata/${item.dsid}`)
    // await fetchAll()
  } catch (e) {
    alert('Delete failed: ' + (e.response?.data?.detail ?? e.message))
  }
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
    await create({
      dsId: f.dsId.trim(),
      name: f.name.trim(),
      containerId: f.containerId.trim() || null,
      siteCode: f.siteCode.trim() || null,
      description: f.description.trim() || null,
    })
    showCreate.value = false
  } catch (e) {
    createError.value = e.response?.data?.detail ?? 'Create failed.'
  }
}

function goToEditor(event) {
  const row = event?.item ?? event
  console.log('goToEditor', row.id)
  router.push({name: "Datasets Edit", params: {id: row.id}})
}

</script>
<template>
  <div class="view-wrap" v-if="route.name === 'Datasets'">
    <!-- Page header -->
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <RouterLink to="/datasets/create" class="btn btn-primary">Create</RouterLink>
        </BButtonGroup>
      </template>
    </Banner>

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
        @row-clicked="goToEditor"
      >
        <template #cell(created)="{ item }">
          <span class="date-cell">{{ formatDate(item.created) }}</span>
        </template>
        <template #cell(modified)="{ item }">
          <span class="date-cell">{{ formatDate(item.modified) }}</span>
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
  <RouterView />
</template>

<style scoped>
.view-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.dataset-table :deep(td) { vertical-align: middle; padding: 6px 10px; }
.dataset-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }
.date-cell { font-size: 12px; color: #6b7280; }

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
