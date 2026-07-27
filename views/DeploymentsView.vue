
<script setup>
import { ref, onMounted, computed } from 'vue'
import { BTable, BButton, BModal, BFormInput } from 'bootstrap-vue-next'
import { RouterView, useRoute } from 'vue-router'
import router from "@src/router";
import Banner from '@src/components/Banner.vue';
import { deploymentsQueries } from '@src/queries'
import DeploymentTable from "@src/components/DeploymentTable.vue";
import DatasetTable from "@src/components/DatasetTable.vue";

const route = useRoute()
const showTable = computed(() => !route.params.id)

const { data: rows, isLoading: loading, error } = deploymentsQueries.useList()
const { mutate: create, isLoading: creating } = deploymentsQueries.useCreate()
const { mutate: update, isLoading: saving } = deploymentsQueries.useUpdate()
const { mutate: remove } = deploymentsQueries.useRemove()

const originals = ref([])
const dirtyRows = ref(new Set())
const showCreate  = ref(false)
const createError = ref('')
const createForm  = ref({ name: '', dsId: '', containerId: '', siteCode: '', description: '' })

const fields = [
  // { key: 'id', label: 'ID',  thStyle: 'min-width:60px' },
  { key: 'siteCode',        label: 'Site Code', thStyle: 'min-width:100px' },
  { key: 'containerId',        label: 'Container ID', thStyle: 'min-width:100px' },
  { key: 'datasetMetadata.name',        label: 'Dataset Name', thStyle: 'min-width:180px' },
  { key: 'datasetMetadata.dsid',        label: 'DSID',         thStyle: 'min-width:140px' },
  { key: 'templateConfig.columnTemplate.name',        label: 'Variables',         thStyle: 'min-width:140px' },
  { key: 'templateConfig.uiTemplate.name',        label: 'UI Template',         thStyle: 'min-width:140px' },
  { key: 'modified',    label: 'Modified Date',     thStyle: 'min-width:100px' },
  { key: 'modifiedBy',  label: 'Modified By',     thStyle: 'min-width:100px' },
  { key: 'actions',     label: '',              thStyle: 'width:160px' },
]

function markDirty(index) {
  dirtyRows.value = new Set([...dirtyRows.value, index])
}

async function saveRow(index) {
  const row = rows.value[index]
  try {
    await update({
      id: row.id,
      containerId: row.containerId,
      siteCode: row.siteCode,
      description: row.description,
    })
    originals.value[index] = { ...rows.value[index] }
    const next = new Set(dirtyRows.value)
    next.delete(index)
    dirtyRows.value = next
  } catch (e) {
    alert('Save failed: ' + (e.response?.data?.detail ?? e.message))
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
    await remove(item.id)
  } catch (e) {
    alert('Delete failed: ' + (e.response?.data?.detail ?? e.message))
  }
}

function goToEditor(event) {
  console.log('goToEditor', event.id)
  router.push({ name: 'Deployment Details', params: { id: event.id } })
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

onMounted(() => {
  if (rows.value) {
    originals.value = rows.value.map(d => ({ ...d }))
  }
})
</script>
<template>
  <div class="view-wrap" v-if="route.name === 'Deployment'">
    <!-- Page header -->
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <RouterLink to="/deployment/create" class="btn btn-primary">Create</RouterLink>
        </BButtonGroup>
      </template>
    </Banner>

    <!-- Loading / error -->
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <DeploymentTable :rows="rows"></DeploymentTable>
    </div>
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
