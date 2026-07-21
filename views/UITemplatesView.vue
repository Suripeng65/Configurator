
<script setup>
import { ref, onMounted } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import axios from 'axios'
import { BTable, BButton } from 'bootstrap-vue-next'
import { useTemplateStore } from '@src/stores/template'
import Banner from '@src/components/Banner.vue'
import { formatDate } from '@src/utils/date-util'

const store = useTemplateStore()
const router = useRouter()
const route = useRoute()

const templates = ref([])
const loading   = ref(false)
const error     = ref('')

const fields = [
  { key: 'id',        label: 'ID' },
  { key: 'name',        label: 'Name' },
  { key: 'description',        label: 'Description' },
  { key: 'created',    label: 'Created',     thStyle: 'width:140px' },
  { key: 'modified',    label: 'Modified',     thStyle: 'width:140px' },
  { key: 'modifiedBy',    label: 'Modified By',     thStyle: 'width:140px' },
  { key: 'actions',     label: '',             thStyle: 'width:90px' },
]

async function fetchTemplates() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`/ui-template/all`)
    templates.value = res.data
  } catch {
    error.value = 'Failed to load UI templates.'
  } finally {
    loading.value = false
  }
}

function goToEditor(event) {
  const item = event?.item ?? event
  store.template = item
  router.push({
    name: 'UITemplateEdit',
    params: { id: item.id }
  })
}

onMounted(fetchTemplates)
</script>
<template>
  <router-view />
  <div class="view-wrap" v-show="route.name === 'UITemplates'">
    <Banner />

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
        <template #cell(id)="{ item }">
          <span class="mono-badge">{{ item.id || '—' }}</span>
        </template>
        <template #cell(description)="{ item }">
          <span class="mono-badge">{{ item.description || '—' }}</span>
        </template>
        <template #cell(created)="{ item }">
          <span class="date-cell">{{ formatDate(item.created) }}</span>
        </template>
        <template #cell(modified)="{ item }">
          <span class="date-cell">{{ formatDate(item.modified) }}</span>
        </template>
        <template #cell(modifiedBy)="{ item }">
          <span class="mono-badge">{{ item.modifiedBy }}</span>
        </template>
        <template #cell(actions)="{ item }">
          <BButton size="sm" variant="primary" @click.stop="goToEditor(item)">Open →</BButton>
        </template>
      </BTable>
      <p v-if="!templates.length" class="empty-msg">No UI templates found.</p>
    </div>
  </div>
</template>

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

.date-cell { font-size: 12px; color: #6b7280; }

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }
.empty-msg { text-align: center; color: #9ca3af; padding: 24px; font-size: 13px; }
</style>
