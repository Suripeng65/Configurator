<script setup lang="ts">
import {ref, onMounted, computed, Ref, watch} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { BTable, BButton, BModal, BFormInput, BAlert } from 'bootstrap-vue-next'
import Banner from '@src/components/Banner.vue'
import HistoryFormGroup from "@src/components/HistoryFormGroup.vue";
import IdentifierFormGroup from "@src/components/IdentifierFormGroup.vue";
import useEditorWorkflow from "@src/composables/EditorWorkflow.ts";
import {variablesQueries} from "@src/queries";
import {cloneDeep} from "lodash";

const showCreate = ref(false)

const router = useRouter()
const route  = useRoute()
const id = route.params.id ? parseInt(<string>route.params.id) : null

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
} = useEditorWorkflow(variablesQueries, meta)

function resetModel() {
  meta.value = cloneDeep(data.value)
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
  { key: 'columnName',        label: 'Column Name',         thStyle: 'min-width:150px' },
  { key: 'displayName', label: 'Display Name',        thStyle: 'min-width:150px' },
  { key: 'role',            label: 'Role',              thStyle: 'min-width:100px' },
  { key: 'type',            label: 'Type',              thStyle: 'min-width:100px' },
  { key: 'format',            label: 'Format',              thStyle: 'min-width:100px' },
  { key: 'visible',        label: 'Visible',             thStyle: 'width:80px' },
  { key: 'actions',           label: '',                    thStyle: 'width:120px' },
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
</script>
<template>
  <div class="view-wrap">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <BButton variant="warning" size="sm" @click="resetModel">Reset</BButton>
          <BButton variant="primary" size="sm" @click="update(meta)">Save</BButton>
          <BButton v-if="id" variant="danger" size="sm" @click="remove(id)">Delete</BButton>
        </BButtonGroup>
      </template>
    </Banner>

    <BAlert v-model="error" variant="danger" dismissible>{{ error }}</BAlert>
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="creating" class="state-msg error-msg">Creating…</div>
    <div v-else-if="updating" class="state-msg error-msg">Updating…</div>
    <BForm v-else>
      <IdentifierFormGroup :meta="meta"/>

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
            <template #cell(format)="{ item, index }">
              <input v-model="item.format" class="cell-input" @input="markDirty(index)" />
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
          <BButton variant="primary" size="sm" @click="meta.columns.push({})">Add Variable</BButton>
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
