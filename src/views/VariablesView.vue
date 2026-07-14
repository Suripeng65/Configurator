<template>
  <div class="view-wrap">
    <div class="page-header">
      <h2 class="page-title">Variables</h2>
    </div>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <BTable
        :items="datasets"
        :fields="fields"
        hover
        responsive
        class="vars-table"
        @row-clicked="goToDetail"
      >
        <template #cell(dsId)="{ item }">
          <span class="ds-id-badge">{{ item.dsId }}</span>
        </template>
      </BTable>
      <p v-if="!datasets.length" class="empty-msg">No datasets found.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { BTable } from 'bootstrap-vue-next'

const API = 'http://localhost:8000'
const router = useRouter()

const datasets = ref([])
const loading  = ref(false)
const error    = ref('')

const fields = [
  { key: 'name', label: 'Dataset Name' },
  { key: 'dsId', label: 'DSID' },
]

async function fetchDatasets() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${API}/dataset-metadata/all`)
    datasets.value = res.data
  } catch {
    error.value = 'Failed to load datasets.'
  } finally {
    loading.value = false
  }
}

function goToDetail(event) {
  const row = event?.item ?? event
  router.push(`/variables/${row.dsId}`)
}

onMounted(fetchDatasets)
</script>

<style scoped>
.view-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f9fafb; }

.page-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #3b82f6;
  flex-shrink: 0;
}
.page-title { font-size: 16px; font-weight: 700; margin: 0; color: #fff; }

.table-wrap { flex: 1; overflow: auto; padding: 16px; }

.vars-table :deep(tbody tr) { cursor: pointer; }
.vars-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }

.ds-id-badge {
  font-family: monospace;
  font-size: 12px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  color: #374151;
}

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }
.empty-msg { text-align: center; color: #9ca3af; padding: 24px; font-size: 13px; }
</style>
