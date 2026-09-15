
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
import ImportJsonModal from '@src/components/ImportJsonModal.vue'
import ConfirmOverwriteModal from '@src/components/ConfirmOverwriteModal.vue'
import { validateUiTemplate } from '@src/validation/index'
import { useCreateWithOverwriteConfirm } from '@src/composables/useCreateWithOverwriteConfirm'

const store = useTemplateStore()
const router = useRouter()
const route = useRoute()

const showImport = ref(false)

function handleImport(parsed) {
  const { id, ...payload } = parsed
  createWithOverwriteConfirm(payload)
}

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

const {
  create: createWithOverwriteConfirm,
  showOverwriteConfirm,
  pendingName: pendingOverwriteName,
  confirmOverwrite,
  cancelOverwrite,
} = useCreateWithOverwriteConfirm(uiTemplatesQueries.checkExists, create)

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
          <BButton variant="outline-primary" size="sm" @click="showImport = true">Import</BButton>
        </BButtonGroup>
      </template>
    </Banner>

    <ImportJsonModal
      v-model="showImport"
      title="Import UI Template"
      body-text="Paste the UI Template JSON in the field below."
      parse-error-message="UI Template must be provided in JSON format."
      :validate="validateUiTemplate"
      @import="handleImport"
    />

    <ConfirmOverwriteModal
      v-model="showOverwriteConfirm"
      :name="pendingOverwriteName"
      entity-label="UI template"
      @confirm="confirmOverwrite"
      @cancel="cancelOverwrite"
    />

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <UiTemplatesTable :rows="rows"></UiTemplatesTable>
      <p v-if="!rows.length" class="empty-msg">No UI templates found.</p>
    </div>
  </div>
</template>

<style scoped>
.view-wrap { display: flex; flex-direction: column; height: 100%; min-width: 0; overflow: hidden; background: #f9fafb; }

.page-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #3b82f6;
  flex-shrink: 0;
}
.page-title { font-size: 16px; font-weight: 700; margin: 0; color: #fff; }

.table-wrap { flex: 1; overflow: auto; padding: 16px; min-width: 0; }

/* Force a visible, always-drawn scrollbar instead of the OS's auto-hiding
   overlay style, so it's obvious the table can scroll horizontally. */
.table-wrap :deep(.table-responsive) { scrollbar-width: auto; }
.table-wrap :deep(.table-responsive)::-webkit-scrollbar { height: 10px; }
.table-wrap :deep(.table-responsive)::-webkit-scrollbar-track { background: #f3f4f6; }
.table-wrap :deep(.table-responsive)::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 5px; }
.table-wrap :deep(.table-responsive)::-webkit-scrollbar-thumb:hover { background: #6b7280; }

.ui-table :deep(tbody tr) { cursor: pointer; }
.ui-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }

.date-cell { font-size: 12px; color: #6b7280; }

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }
.empty-msg { text-align: center; color: #9ca3af; padding: 24px; font-size: 13px; }
</style>
