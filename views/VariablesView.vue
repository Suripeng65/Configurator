
<script setup>
import { ref, onMounted, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import axios from 'axios'
import { BTable } from 'bootstrap-vue-next'
import Banner from '@src/components/Banner.vue'
import { formatDate } from '@src/utils/date-util'
import { datasetsQueries } from '@src/queries'

const router = useRouter()
const route = useRoute()

const datasets = ref([])

const { data: variablesData, isLoading: loading, error } = datasetsQueries.useList()
const { mutate: createDataset, isLoading: creating } = datasetsQueries.useCreate()
const { mutate: removeDataset } = datasetsQueries.useRemove()

const rows = computed(() => variablesData.value ?? [])

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Column Template Name' },
  { key: 'description', label: 'Description' },
  { key: 'created', label: 'Created' },
  { key: 'modified', label: 'Modified' },
  { key: 'modifiedBy', label: 'Modified By' },
]

function goToDetail(event) {
  const row = event?.item ?? event
  router.push({
    name: `Variables Edit`,
    params: { id: row.id }
  })
}

</script>
<template>
  <router-view />
  <div class="view-wrap" v-if="route.name==='Variables'">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <RouterLink to="/variables/create" class="btn btn-primary">Create</RouterLink>
        </BButtonGroup>
      </template>
    </Banner>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <BTable
        :items="rows"
        :fields="fields"
        hover
        responsive
        class="vars-table"
        @row-clicked="goToDetail"
      >
        <template #cell(dsid)="{ item }">
          <span class="ds-id-badge">{{ item.dsid }}</span>
        </template>
         <template #cell(description)="{ item }">
          <span class="mono-badge">{{ item.description }}</span>
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
      </BTable>
      <p v-if="!datasets.length" class="empty-msg">No datasets found.</p>
    </div>
  </div>
</template>

<style scoped>
.view-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f9fafb; }
.date-cell { font-size: 12px; color: #6b7280; }

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
