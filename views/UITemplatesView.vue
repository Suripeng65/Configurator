
<script setup>
import { ref, onMounted, computed } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import axios from 'axios'
import { BTable, BButton } from 'bootstrap-vue-next'
import { useTemplateStore } from '@src/stores/template'
import Banner from '@src/components/Banner.vue'
import { formatDate } from '@src/utils/date-util'
import { uiTemplatesQueries } from '@src/queries'
import UiTemplatesTable from "@src/components/UiTemplatesTable.vue";

const store = useTemplateStore()
const router = useRouter()
const route = useRoute()

const fields = [
  // { key: 'id',        label: 'ID' },
  { key: 'name',        label: 'Name' },
  { key: 'description',        label: 'Description' },
  { key: 'created',    label: 'Created',     thStyle: 'width:140px' },
  { key: 'modified',    label: 'Modified',     thStyle: 'width:140px' },
  { key: 'modifiedBy',    label: 'Modified By',     thStyle: 'width:140px' },
  { key: 'actions',     label: '',             thStyle: 'width:90px' },
]

const { data, isLoading: loading, error } = uiTemplatesQueries.useList()
const { mutate: create, isLoading: creating } = uiTemplatesQueries.useCreate()
const { mutate: remove } = uiTemplatesQueries.useRemove()
const rows = computed(() => data.value ?? [])

function goToEditor(event) {
  const item = event?.item ?? event
  store.template = item
  router.push({
    name: 'UiTemplate Edit',
    params: { id: item.id }
  })
}

</script>
<template>
  <router-view />
  <div class="view-wrap" v-show="route.name === 'UiTemplate'">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <RouterLink :to="{ name: 'UiTemplate Create' }" class="btn btn-primary">Create</RouterLink>
        </BButtonGroup>
      </template>
    </Banner>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <UiTemplatesTable :rows="rows"></UiTemplatesTable>
      <p v-if="!rows.length" class="empty-msg">No UI templates found.</p>
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
