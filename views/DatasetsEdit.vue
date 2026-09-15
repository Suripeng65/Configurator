<script setup lang="ts">
import {ref, onMounted, reactive, Ref, watch, computed} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Banner from '@src/components/Banner.vue'
import HistoryFormGroup from "@src/components/HistoryFormGroup.vue";
import useEditorWorkflow from "@src/composables/EditorWorkflow";
import {datasetsQueries} from "@src/queries";
import ArchiveModal from "@src/components/ArchiveModal.vue";
import { useResourceUsageCheck } from "@src/composables/ResourceUsageCheck";
import { validateDatasets } from '@src/validation';


const route  = useRoute()
const router = useRouter()
const id = route.params.id ? parseInt(<string>route.params.id) : null

const meta: Ref<Record<string, any>>= ref({
  id: id,
  name: history.state?.name ?? '',
  description: history.state?.description ?? '',
  releases: [],
  attributes: {
    autoLoad: false,
    datasetLabel: '',
    datasetSelectorType: '',
    refreshDataButtonName: '',
    loadDataButtonName: '',
    rsfLabel: ''
  }
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
  resetModel: originalResetModel,
} = useEditorWorkflow(datasetsQueries, meta, validateDatasets)

// const { mutate: updateReleases, isLoading: updatingReleases } = datasetsQueries.useUpdateReleases()

function resetModel() {
  originalResetModel()
  violations.value = []
  if (meta.value.releases && !Array.isArray(meta.value.releases)) {
    meta.value.releases = Object.values(meta.value.releases)
  }
}



const columns   = ref([])
const showCreate = ref(false)
const newCol     = ref({ columnName: '', columnDisplayName: '', format: '', visibility: true })

const fields = [
  { key: 'name',        label: 'Release Name', thStyle: 'min-width:180px' },
  { key: 'schemaName',        label: 'Schema Name',         thStyle: 'min-width:140px' },
  { key: 'isDefault',        label: 'Is Default',         thStyle: 'min-width:140px' },
  { key: 'created',        label: 'Created',         thStyle: 'min-width:140px' },
  { key: 'createdBy',        label: 'Created By',         thStyle: 'min-width:140px' },
  { key: 'modified',        label: 'Modified',         thStyle: 'min-width:140px' },
  { key: 'modifiedBy',        label: 'Modified By',         thStyle: 'min-width:140px' },
  { key: 'actions',           label: 'Action',                    thStyle: 'width:50px' },
]

const show = ref(true)

const KNOWN_ATTR_KEYS = ['autoLoad', 'datasetLabel', 'dataReleaseLabel', 'autoPollingCooldown','datasetSelectorType','refreshDataButtonName','loadDataButtonName','rsfLabel']

const extraAttributeEntries = computed(() =>
  Object.entries(meta.value.attributes ?? {}).filter(([key]) => !KNOWN_ATTR_KEYS.includes(key))
)

const showAddAttributes = ref(false)
const newFieldKey   = ref('')
const newFieldValue = ref('')
const newFieldType  = ref('string')

function commitAddField(){
    const key = newFieldKey.value.trim()
  if (!key) return
  setAttribute(key, newFieldValue.value)
  cancelAddField()
}
function cancelAddField() {
  showAddAttributes.value  = false
  newFieldKey.value   = ''
  newFieldValue.value = ''
  newFieldType.value  = 'string'
}

function setAttribute(key, value) {
  if (!meta.value.attributes) meta.value.attributes = {}
  meta.value.attributes[key] = value
}
function removeAttribute(key) {
  if (!meta.value.attributes) return
  delete meta.value.attributes[key]
}

function add(data){
  const {configs, ...rest} = data
  rest.attributes = JSON.stringify(data.attributes)
  create(rest)
}
async function updatedataset(data){
  if(data.releases && data.releases.length > 0){
    const releases = data.releases.map((r) => ({
      name: r.name ?? '',
      description: r.description??'',
      schemaName: r.schemaName??'',
      isDefault: r.isDefault??false
    }))
    // updateReleases({ id: data.id, releases })
    let {data:{ releases: releaseData}} = await updateReleases({id:data.id, releases})
    meta.value.releases = [...releaseData]
  }
  update()
}

const showArchiveModal = ref(false)
const archiveModalMsg = 'Are you sure you want to archive the dataset?'
const archiveModalTitle = 'Archive Dataset'
const { isResourceInUse } = useResourceUsageCheck()
const isDatasetInUse = computed(() => {
  if (!meta.value.id) return false
  return isResourceInUse({ resourceType: 'dataset', resourceId: meta.value.dsid })
})

function archiveBtnClick() {
  showArchiveModal.value = true
}

function archiveConfirm() {
  remove(meta.value)
  showArchiveModal.value = false
  router.push({path:'/dataset'})
}

function archiveCancel() {
  showArchiveModal.value = false
}

async function updateReleases({id, releases}){
  const res = await axios.post(`/dataset-metadata/${id}/releases?dto=full`, {releases: releases})
  return res
}
function deleteRelease(item){
  const idx = meta.value?.releases?.findIndex(c => c === item)
  if (idx !== -1) meta.value?.releases?.splice(idx, 1)
}
function cancel(){
  resetModel()
  router.push({path:'/dataset'})
}
</script>
<template>
  <div class="view-wrap">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <BButton variant="warning" size="sm" @click="resetModel">Reset</BButton>
          <BButton variant="primary" size="sm" @click="updatedataset(meta)" v-if="meta.id">Save</BButton>
          <BButton variant="danger" size="sm"  @click="archiveBtnClick" v-if="meta.id && isDatasetInUse === false">Archive</BButton>
          <BButton variant="primary" size="sm" @click="add(meta)" v-else>Create</BButton>
          <BButton size="sm" @click="cancel()" >Cancel</BButton>
        </BButtonGroup>
      </template>
    </Banner>
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
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div class="form-scroll-container">
      <BForm v-if="show" >
      <div class="attribute-row">
        <label for="input-dsid" class="attribute-label">DSID:</label>
        {{ meta.dsid }}
        <!-- <BFormInput id="input-dsid" v-model="meta.dsid" placeholder="Enter name" required /> -->
      </div>
      <div class="attribute-row">
        <label for="input-dataset-name" class="attribute-label">Dataset Name:</label>
        <BFormInput id="input-dataset-name" v-model="meta.name" placeholder="Enter name" required />
      </div>
      <BFormGroup id="input-group-3" label="Description:" label-for="input-3">
        <BFormTextarea id="input-3" v-model="meta.description" placeholder="Enter description" />
      </BFormGroup>

  
      <HistoryFormGroup :meta="meta"/>
      <div class="attributes-section" >
        <label class="attributes-title">Attributes:</label>
        <div class="attributes-group" >
          <BFormGroup label="Auto Load" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormCheckbox
            :model-value="meta.attributes?.autoLoad ?? false"
            @update:model-value="setAttribute('autoLoad', $event)"
          />
        </BFormGroup>
        <BFormGroup label="Dataset Label" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormInput
            :model-value="meta.attributes?.datasetLabel ?? ''"
            placeholder="Enter dataset label"
            @change="setAttribute('datasetLabel', $event.target.value)"
          />
        </BFormGroup>
        <BFormGroup label="Data Release Label" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormInput
            :model-value="meta.attributes?.dataReleaseLabel ?? ''"
            placeholder="Enter data release label"
            @change="setAttribute('dataReleaseLabel', $event.target.value)"
          />
        </BFormGroup>
        <BFormGroup label="Dataset Selector Type" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormInput
            :model-value="meta.attributes?.datasetSelectorType ?? ''"
            placeholder="Enter Dataset Selector Type"
            @update:model-value="setAttribute('datasetSelectorType', $event)"
          />
        </BFormGroup>
        <BFormGroup label="Load Data Button Name" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormInput
            :model-value="meta.attributes?.loadDataButtonName ?? ''"
            placeholder="Enter Load Data Button Name"
            @update:model-value="setAttribute('loadDataButtonName', $event)"
          />
        </BFormGroup>
        <BFormGroup label="Auto Polling Cooldown" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormInput
            :model-value="meta.attributes?.autoPollingCooldown ?? ''"
            placeholder="Enter Load Data Button Name"
            @update:model-value="setAttribute('autoPollingCooldown', $event)"
          />
        </BFormGroup>
        <BFormGroup label="Refresh Data Button Name" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormInput
            :model-value="meta.attributes?.refreshDataButtonName ?? ''"
            placeholder="Enter Refresh Data Button Name"
            @update:model-value="setAttribute('refreshDataButtonName', $event)"
          />
        </BFormGroup>
        <BFormGroup label="RSF Label" label-cols="3" label-class="small text-muted" class="mb-2">
          <BFormInput
            :model-value="meta.attributes?.rsfLabel ?? ''"
            placeholder="Enter RSF Label"
            @update:model-value="setAttribute('rsfLabel', $event)"
          />
        </BFormGroup>
        <div v-if="extraAttributeEntries.length" class="attr-extra-list">
            <div v-for="[key, value] in extraAttributeEntries" :key="key" class="attr-row">
              <span class="attr-key">{{ key }}</span>
              <BFormInput
                size="sm"
                :model-value="value"
                @change="setAttribute(key, $event.target.value)"
              />
              <BButton variant="link" size="sm" class="text-danger" title="Remove attribute" @click="removeAttribute(key)">✕</BButton>
            </div>
          </div>
          <!-- Add Attribute button -->
          <div v-if="showAddAttributes" class="attr-add-row">
            <BFormInput v-model="newFieldKey" placeholder="key" class="attr-add-key" @keyup.enter="commitAddField" @keyup.escape="cancelAddField" />
            <BFormInput v-model="newFieldValue" size="sm" placeholder="value" @keyup.enter="commitAddField" @keyup.escape="cancelAddField" />
          </div>
          <BButton v-else variant="outline-secondary" size="sm" @click="showAddAttributes = true">+ Add Attribute</BButton>
        </div>
      </div>

      <BFormGroup id="input-group-4" label="Releases:" label-for="input-3" v-if="meta.releases">
        <BTable
            :items="meta.releases"
            :fields="fields"
            bordered
            hover
            responsive
            class="col-table"
        >
          <template #cell(name)="{ item, index }">
            <input v-model="item.name" class="cell-input" @input="markDirty(index)" />
          </template>
          <template #cell(schemaName)="{ item, index }">
            <input v-model="item.schemaName" class="cell-input" @input="markDirty(index)" />
          </template>
          <template #cell(isDefault)="{ item, index }">
            <input v-model="item.isDefault" class="cell-input" @input="markDirty(index)" />
          </template>
          <template #cell(actions)="{ item, index }">
              <div class="row-actions">
                <BButton size="sm" variant="outline-danger" @click="deleteRelease(item)">✕</BButton>
              </div>
          </template>
        </BTable>
        <BButton variant="primary" size="sm" @click="meta.releases.push({name:'', schemaName:'', isDefault:false})">Add Release</BButton>
      </BFormGroup>
  </BForm>
    </div>

  </div>
</template>

<style scoped>
.row-actions { display: flex; gap: 6px; justify-content: flex-end; }

.view-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: #f9fafb; }

.form-scroll-container { flex: 1; overflow-y: auto; padding: 16px; }

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

.attr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  border-radius: 4px;
  padding: 4px 8px;
}
.attr-key { width: 140px; flex-shrink: 0; font-size: 12px; font-family: monospace; color: #6b7280; }
.attr-remove { color: #d1d5db !important; font-size: 14px; }
.attr-remove:hover { color: #dc2626 !important; }

.attr-add-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 8px;
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  border-radius: 6px;
}
.attr-add-key { max-width: 160px; }
</style>
