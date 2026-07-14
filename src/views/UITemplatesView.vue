<template>
  <div class="view-wrap">
    <div class="page-header">
      <h2 class="page-title">UI Templates</h2>
    </div>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <BTable
        :items="templates"
        :fields="fields"
        hover
        responsive
        class="ui-table"
        @row-clicked="goToEditor"
      >
        <template #cell(dsId)="{ item }">
          <span class="mono-badge">{{ item.dsId || '—' }}</span>
        </template>
        <template #cell(siteCode)="{ item }">
          <span>{{ item.siteCode || '—' }}</span>
        </template>
        <template #cell(containerId)="{ item }">
          <span>{{ item.containerId || '—' }}</span>
        </template>
        <template #cell(modified)="{ item }">
          <span class="date-cell">{{ formatDate(item.modified) }}</span>
        </template>
        <template #cell(actions)="{ item }">
          <BButton size="sm" variant="primary" @click.stop="goToEditor(item)">Open →</BButton>
        </template>
      </BTable>
      <p v-if="!templates.length" class="empty-msg">No UI templates found.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { BTable, BButton } from 'bootstrap-vue-next'

const API = 'http://localhost:8000'
const router = useRouter()

const templates = ref([])
const loading   = ref(false)
const error     = ref('')

const fields = [
  { key: 'name',        label: 'Name' },
  { key: 'dsId',        label: 'DSID' },
  { key: 'siteCode',    label: 'Site Code',    thStyle: 'width:110px' },
  { key: 'containerId', label: 'Container ID', thStyle: 'width:130px' },
  { key: 'modified',    label: 'Modified',     thStyle: 'width:140px' },
  { key: 'actions',     label: '',             thStyle: 'width:90px' },
]

async function fetchTemplates() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${API}/getuiTemplates`)
    templates.value = res.data
  } catch {
    error.value = 'Failed to load UI templates.'
  } finally {
    loading.value = false
  }
}

function goToEditor(event) {
  const item = event?.item ?? event
  const param = item.dsId || item.id
  router.push(`/uitemplates/${param}/layout`)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(fetchTemplates)
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
.ui-table :deep(tbody tr) { cursor: pointer; }
.ui-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }

.mono-badge { font-family: monospace; font-size: 12px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
.date-cell { font-size: 12px; color: #6b7280; }

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }
.empty-msg { text-align: center; color: #9ca3af; padding: 24px; font-size: 13px; }
</style>
