
<script setup lang="ts">
import {ref, onMounted, reactive, Ref, watch} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { BTable, BButton, BFormInput } from 'bootstrap-vue-next'
import Banner from '@src/components/Banner.vue'
import HistoryFormGroup from "@src/components/HistoryFormGroup.vue";
import useEditorWorkflow from "@src/composables/EditorWorkflow";
import {datasetsQueries} from "@src/queries";
import {cloneDeep} from "lodash";

const router = useRouter()
const route  = useRoute()
const id = route.params.id ? parseInt(<string>route.params.id) : null

const meta: Ref<Record<string, any>>       = ref({
  id: id,
  name: history.state?.name ?? '',
  description: history.state?.description ?? '',
  releases: []
})

const {
  data,
  loading,
  error,
  create,
  creating,
  update,
  updating,
  remove,
} = useEditorWorkflow(datasetsQueries, meta)

function resetModel() {
  meta.value = cloneDeep(data.value)
  if (!meta.value.releases) meta.value.releases = []
  meta.value.releases.forEach(release => {
    delete release.id
  })
}


const columns   = ref([])
const showCreate = ref(false)
const newCol     = ref({ columnName: '', columnDisplayName: '', format: '', visibility: true })

const fields = [
  { key: 'id', label: 'ID',  thStyle: 'min-width:120px' },
  { key: 'name',        label: 'Release Name', thStyle: 'min-width:180px' },
  { key: 'schemaName',        label: 'Schema Name',         thStyle: 'min-width:140px' },
  { key: 'isDefault',        label: 'Is Default',         thStyle: 'min-width:140px' },
  { key: 'created',        label: 'Created',         thStyle: 'min-width:140px' },
  { key: 'createdBy',        label: 'Created By',         thStyle: 'min-width:140px' },
  { key: 'modified',        label: 'Modified',         thStyle: 'min-width:140px' },
  { key: 'modifiedBy',        label: 'Modified By',         thStyle: 'min-width:140px' },
]

const show = ref(true)

const onSubmit = (event) => {
//   event.preventDefault()

//   alert(JSON.stringify(form))
}

function markDirty(i) {
  // Track dirty rows if needed
}
</script>
<template>
  <div class="view-wrap">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <BButton variant="warning" size="sm" @click="resetModel">Reset</BButton>
          <BButton variant="primary" size="sm" @click="update(meta)">Save</BButton>
          <BButton variant="danger" size="sm" @click="remove(id)">Delete</BButton>
        </BButtonGroup>
      </template>
    </Banner>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <BForm v-if="show" @submit="onSubmit" @reset="onReset">

      <BFormGroup id="input-group-1" label="DSID:" label-for="input-1">
        <BFormInput id="input-1" v-model="meta.dsid" placeholder="Enter dsid" required />
      </BFormGroup>

      <BFormGroup id="input-group-2" label="Name:" label-for="input-2">
        <BFormInput id="input-2" v-model="meta.name" placeholder="Enter name" required />
      </BFormGroup>

      <BFormGroup id="input-group-3" label="Description:" label-for="input-3">
        <BFormTextarea id="input-3" v-model="meta.description" placeholder="Enter description" />
      </BFormGroup>

      <HistoryFormGroup :meta="meta"/>

      <BFormGroup id="input-group-4" label="Releases:" label-for="input-3" v-if="meta.releases">
        <BTable
            :items="meta.releases"
            :fields="fields"
            bordered
            hover
            responsive
            class="col-table"
        >
          <template #cell(columnName)="{ item, index }">
            <input v-model="item.displayName" class="cell-input" @input="markDirty(index)" />
          </template>
          <template #cell(displayName)="{ item, index }">
            <input v-model="item.schemaName" class="cell-input" @input="markDirty(index)" />
          </template>
          <template #cell(format)="{ item, index }">
            <input v-model="item.isDefault" class="cell-input" @input="markDirty(index)" />
          </template>
        </BTable>
        <BButton variant="primary" size="sm" @click="meta.releases.push({})">Add Release</BButton>
      </BFormGroup>
  </BForm>

  </div>
</template>

<style scoped>
.view-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f9fafb; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 12px;
  background: #3b82f6;
  flex-shrink: 0;
}
.page-back { font-size: 12px; color: rgba(255,255,255,0.75); cursor: pointer; margin-bottom: 2px; }
.page-back:hover { color: #fff; }
.page-title { font-size: 15px; font-weight: 700; margin: 0; color: #fff; }
.ds-label { font-family: monospace; font-weight: 400; font-size: 13px; }

.table-wrap { flex: 1; overflow: auto; padding: 16px; }
.col-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }
.col-table :deep(td) { vertical-align: middle; padding: 6px 10px; }

.cell-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 13px;
  background: transparent;
}
.cell-input:hover { border-color: #d1d5db; background: #fff; }
.cell-input:focus { border-color: #3b82f6; background: #fff; outline: none; }

.row-actions { display: flex; gap: 6px; justify-content: flex-end; }

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }
.empty-msg { text-align: center; color: #9ca3af; padding: 24px; font-size: 13px; }

.form-fields { display: flex; flex-direction: column; gap: 12px; }
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: 12px; font-weight: 600; color: #374151; }
.form-row-check { flex-direction: row; align-items: center; gap: 10px; }
</style>
