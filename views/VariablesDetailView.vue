<script setup lang="ts">
import {ref, Ref, watch, computed} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Banner from '@src/components/Banner.vue'
import HistoryFormGroup from "@src/components/HistoryFormGroup.vue";
import useEditorWorkflow from "@src/composables/EditorWorkflow.ts";
import {variablesQueries} from "@src/queries";
import {cloneDeep} from "lodash";
import EditorButtons from "@src/components/EditorButtons.vue";
 import { validateVariables } from '@src/validation';
import ExportJsonModal from '@src/components/ImportExport/ExportJsonModal.vue';
import ConfirmOverwriteModal from '@src/components/ConfirmOverwrite/ConfirmOverwriteModal.vue';
import {ColumnRole, ColumnType} from '@src/types/variable.interface'
import ArchiveModal from "@src/components/ArchiveModal.vue";
import { useResourceUsageCheck } from "@src/composables/ResourceUsageCheck";

const showCreate = ref(false)

const router = useRouter()
const route  = useRoute()
const id = route.params.id ? parseInt(<string>route.params.id) : null
const sourceId = !id && history.state?.sourceId ? history.state.sourceId : null

const meta: Ref<Record<string, any>>       = ref({
  id: id,
  name: history.state?.name ?? '',
  description: history.state?.description ?? '',
  columns: []
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
  violations,
  showOverwriteConfirm,
  pendingOverwriteName,
  confirmOverwrite,
  cancelOverwrite
} = useEditorWorkflow(variablesQueries, meta, validateVariables)

function resetModel() {
  meta.value = cloneDeep(data.value)
  violations.value = []
  if (!meta.value.columns) meta.value.columns = []
  meta.value.columns.forEach(column => {
    delete column.id
  })
}

function markDirty(i) {
  // Track dirty rows if needed
}

const newCol = ref({ columnName: '', columnDisplayName: '', format: '', visibility: true })

const fields = [
  { key: 'columnName',        label: 'Column Name',         thStyle: 'min-width:90px' },
  { key: 'displayName', label: 'Display Name',        thStyle: 'min-width:150px' },
  { key: 'description', label: 'Column Description',        thStyle: 'min-width:150px' },
  { key: 'role',            label: 'Role',              thStyle: 'min-width:120px' },
  { key: 'type',            label: 'Type',              thStyle: 'min-width:120px' },
  { key: 'format',            label: 'Format',              thStyle: 'min-width:70px' },
  { key: 'groupName', label: 'Group Name',        thStyle: 'min-width:100px' },
  { key: 'groupDescription', label: 'Group Description',        thStyle: 'min-width:150px' },
  { key: 'extendedType', label: 'Extended Type',        thStyle: 'min-width:150px' },
  { key: 'fkColumnName', label: 'Foreign Key Column Name',        thStyle: 'min-width:150px' },
  { key: 'unstratifiedValue', label: 'Unstratified Value',        thStyle: 'min-width:150px' },
  { key: 'collapseGroup', label: 'Collapse Group',        thStyle: 'min-width:150px' },
  { key: 'hideWhenCollapsed', label: 'Hide When Collapsed',        thStyle: 'min-width:150px' },
  { key: 'defaultFilterOperator', label: 'Default Filter Operator',        thStyle: 'min-width:150px' },
  { key: 'expression', label: 'Expression',        thStyle: 'min-width:150px' },
  { key: 'visible',        label: 'Visible',             thStyle: 'width:30px' },
  { key: 'actions',           label: 'Action',                    thStyle: 'width:50px' },
]

function deleteCol(item) {
  const idx = meta.value?.columns?.findIndex(c => c === item || c.columnName === item.columnName)
  if (idx !== -1) meta.value?.columns?.splice(idx, 1)
}

async function submitCreate() {
  const c = newCol.value
  if (!c.columnName.trim()) return
  meta.value.columns.push(cloneDeep(c))
  showCreate.value = false
  newCol.value = { columnName: '', columnDisplayName: '', format: '', visibility: true }
}
if(sourceId){
  const {data:sourceData} = variablesQueries.useById(sourceId)
  watch(sourceData, (data)=>{
    if (data) {
      meta.id = null
      meta.value.name = `Copy of ${data.name}`
      meta.value.description =  data.description ?? ''
      meta.value.columns = data.columns ? cloneDeep(data.columns) : []
    }
  }, {immediate:true})
}
function cancel(){
  if(meta.value && meta.value.name && meta?.value?.columns?.length !== 0 && meta.value.description) resetModel()
  router.push({path:"/variable"})
}
const exportJson = computed(()=>JSON.stringify(meta.value, null, 2))
const showExport = ref(false)

const showArchiveModal = ref(false)
const archiveModalMsg = 'Are you sure you want to archive the variables?'
const archiveModalTitle = 'Archive Variables'

const { isResourceInUse } = useResourceUsageCheck()
const isVariableListInUse = computed(() => {
  if (!meta.value.id) return false
  return isResourceInUse({ resourceType: 'variables', resourceId: meta.value.id })
})

function archiveBtnClick() {
  showArchiveModal.value = true
}

function archiveConfirm() {
  remove(meta.value)
  showArchiveModal.value = false
  router.push({ path: '/variable'})
}

function archiveCancel() {
  showArchiveModal.value = false
}

</script>
<template>
  <div class="view-wrap">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <BButton variant="light" size="sm" @click="showExport = true" v-if="meta.id">Export</BButton>
          <BButton variant="warning" size="sm" @click="resetModel" v-if="meta.id">Reset</BButton>
          <BButton variant="primary" size="sm" @click="update(meta)" v-if="meta.id">Save</BButton>
          <BButton variant="danger" size="sm"  @click="archiveBtnClick" v-if="meta.id && isVariableListInUse === false">Archive</BButton>
          <BButton variant="primary" size="sm" @click="create(meta)" v-else>Create</BButton>
          <BButton size="sm" @click="cancel()" >Cancel</BButton>
        </BButtonGroup>
      </template>
    </Banner>
    <ExportJsonModal
    v-model="showExport"
    title="Export Variables"
    body-text="Copy the Variables JSON below."
    :json="exportJson"
    />
    <ConfirmOverwriteModal 
      v-model="showOverwriteConfirm"
      :name="pendingOverwriteName"
      entity-label="Variables Template"
      @cancel="cancelOverwrite"
      @confirm="confirmOverwrite"
      />
    <BAlert v-model="error" variant="danger" dismissible>{{ error }}</BAlert>
    <BAlert :model-value="violations.length > 0" variant="danger">
      <strong> Fix the following before saving:</strong>
      <ul class="mb-0">
        <li v-for="v in violations" :key="v.rule">
          {{v.message}}
        </li>
      </ul>
    </BAlert>
        <ArchiveModal
      :show-modal="showArchiveModal"
      :modal-msg="archiveModalMsg"
      :modal-title="archiveModalTitle"
      @confirm="archiveConfirm"
      @cancel="archiveCancel"
    />
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="creating" class="state-msg error-msg">Creating…</div>
    <div v-else-if="updating" class="state-msg error-msg">Updating…</div>
    <BForm v-else>
      <!-- <IdentifierFormGroup :meta="meta"/> -->

      <BFormGroup id="input-group-2" label="Name" label-for="input-2">
        <BFormInput id="input-2" v-model="meta.name" placeholder="Enter name" required />
      </BFormGroup>

      <BFormGroup id="input-group-3" label="Description" label-for="input-3">
        <BFormTextarea id="input-3" v-model="meta.description" placeholder="Enter description" />
      </BFormGroup>

      <HistoryFormGroup :meta="meta"/>

      <BFormGroup id="input-group-4" label="Variables" label-for="input-3">
        <div class="table-wrap">
          <BTable
            :items="meta.columns??[]"
            :fields="fields"
            bordered
            hover
            responsive
            class="col-table"
          >
            <template #cell(columnName)="{ item, index }">
              <input v-model="item.columnName" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(displayName)="{ item, index }">
              <input v-model="item.displayName" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(description)="{ item, index }">
              <input v-model="item.description" class="cell-input" @input="markDirty(index)" />
            </template>
             <template #cell(role)="{ item, index }">
              <!-- <input v-model="item.role" class="cell-input" @input="markDirty(index)" /> -->
              <BFormSelect v-model="item.role" size="sm" class="cn-af-type"  @change="markDirty(index)">
                <option v-for="(role) in ColumnRole" :value="role">{{role}}</option>  
              </BFormSelect>
            </template>
             <template #cell(type)="{ item, index }">
              <BFormSelect v-model="item.type" size="sm" class="cn-af-type"  @change="markDirty(index)">
                <option v-for="(type) in ColumnType" :value="type">{{ type }}</option>
              </BFormSelect>
            </template>
            <template #cell(format)="{ item, index }">
              <input v-model="item.format" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(groupName)="{ item, index }">
              <input v-model="item.groupName" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(groupDescription)="{ item, index }">
              <input v-model="item.groupDescription" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(extendedType)="{ item, index }">
              <input v-model="item.extendedType" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(fkColumnName)="{ item, index }">
              <input v-model="item.fkColumnName" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(unstratifiedValue)="{ item, index }">
              <input v-model="item.unstratifiedValue" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(collapseGroup)="{ item, index }">
              <input v-model="item.collapseGroup" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(hideWhenCollapsed)="{ item, index }">
              <input v-model="item.hideWhenCollapsed" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(defaultFilterOperator)="{ item, index }">
              <input v-model="item.defaultFilterOperator" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(expression)="{ item, index }">
              <input v-model="item.expression" class="cell-input" @input="markDirty(index)" />
            </template>
            <template #cell(visible)="{ item, index }">
              <input type="checkbox" v-model="item.visible" @change="markDirty(index)" />
            </template>
            <template #cell(actions)="{ item, index }">
              <div class="row-actions">
                <BButton size="sm" variant="outline-danger" @click="deleteCol(item)">✕</BButton>
              </div>
            </template>
          </BTable>
          <p v-if="!meta?.columns?.length" class="empty-msg">No columns defined</p>
          <BButton variant="primary" size="sm" @click="meta.columns.push({tableName:'table_name'})">Add Variable</BButton>
        </div>
      </BFormGroup>
    </BForm>

    <!-- Add column modal -->
    <BModal
      v-model="showCreate"
      title="Add Column"
      ok-title="Add"
      ok-variant="primary"
      cancel-variant="outline-secondary"
      @ok.prevent="submitCreate"
    >
      <div class="form-fields">
        <div class="form-row">
          <label>Column Name</label>
          <BFormInput v-model="newCol.columnName" placeholder="e.g. patientAge" />
        </div>
        <div class="form-row">
          <label>Display Name</label>
          <BFormInput v-model="newCol.columnDisplayName" placeholder="e.g. Patient Age" />
        </div>
        <div class="form-row">
          <label>Format</label>
          <BFormInput v-model="newCol.format" placeholder="e.g. string, number, currency" />
        </div>
        <div class="form-row form-row-check">
          <label>Visible</label>
          <input type="checkbox" v-model="newCol.visibility" />
        </div>
      </div>
    </BModal>

  </div>
</template>

<style scoped>
.view-wrap { display: flex; flex-direction: column; height: 100%; overflow-x: hidden; overflow-y: scroll; background: #f9fafb; }

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
