
<script setup>
import { ref, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import Banner from '@src/components/Banner.vue'
import { variablesQueries } from '@src/queries'
import VariableTable from "@src/components/VariableTable.vue";
import ImportJsonModal from '@src/components/ImportExport/ImportJsonModal.vue';
import ConfirmOverwriteModal from '@src/components/ConfirmOverwrite/ConfirmOverwriteModal.vue';
import { validateVariables } from '@src/validation/index';
import {useCreateWithOverwriteConfirm} from '@src/composables/useCreateWithOverwriteConfirm'

const router = useRouter()
const route = useRoute()

const datasets = ref([])

const { data: variablesData, isLoading: loading, error } = variablesQueries.useList()
const { mutate: createVariable } = variablesQueries.useCreate()

const rows = computed(() => variablesData.value ?? [])
const {
  create: createWithOverwriteConfirm,
  showOverwriteConfirm,
  pendingName: pendingOverwriteName,
  confirmOverwrite,
  cancelOverwrite
} = useCreateWithOverwriteConfirm(variablesQueries.checkExists , createVariable)


const showImport = ref(false)
function handleImport(parsed){
  const {id, ...payload} = parsed
  payload.columns = payload.columns.map(({id, ...rest})=> rest)
  createWithOverwriteConfirm(payload)
}

</script>
<template>
  <div class="view-wrap" v-if="route.name==='Variable'">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <RouterLink to="/variable/create" class="btn btn-primary">Create</RouterLink>
          <BButton variant="light" size="sm" @click="showImport = true"> Import</BButton>
        </BButtonGroup>
      </template>
    </Banner>
    <ImportJsonModal 
      v-model="showImport"
      title="Import Variables"
      body-text="Paste the Variables JSON in the field below."
      parse-error-message="Variables must be provided in JSON format."
      :validate="validateVariables"
      @import="handleImport"
    />
    <ConfirmOverwriteModal 
      v-model="showOverwriteConfirm"
      :name="pendingOverwriteName"
      entity-label="Variables Template"
      @cancel="cancelOverwrite"
      @confirm="confirmOverwrite"
    />
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <VariableTable :rows="rows"></VariableTable>
      <p v-if="!rows.length" class="empty-msg">No Variable Lists found.</p>
    </div>
  </div>
  <router-view />
</template>

<style scoped>
.view-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f9fafb;   min-width:0px;}
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
.vars-table {
  min-width:1200px;
}
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
