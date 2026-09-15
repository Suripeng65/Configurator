<script setup lang="ts">
import { ref, computed, watch, Ref} from 'vue'
import { useRoute,useRouter } from 'vue-router'
import {deploymentsQueries} from "@src/queries";
import {cloneDeep, set} from "lodash";
import Banner from '@src/components/Banner.vue'
import useEditorWorkflow from "@src/composables/EditorWorkflow";
import {uiTemplatesQueries, variablesQueries, datasetsQueries} from "@src/queries"
import EditorButtons from "@src/components/EditorButtons.vue";
import { validateDeployments } from '@src/validation'

const route = useRoute()
const router = useRouter()

const meta: Ref<Record<string, any>>       = ref({
  id: null,
  siteCode: null,
  containerId:null,
  datasetMetadata:{},
  templateConfig:{
    columnTemplate:{name:"", id:null}, 
    uiTemplate:{name:"", id:null}
  }
})

const {
  data: deployment,
  loading,
  error,
  create,
  creating,
  update,
  updating,
  remove,
  violations
} = useEditorWorkflow(deploymentsQueries, meta, validateDeployments)

const { data: datasets, isLoading: loadingDatasets } = datasetsQueries.useList()
const { data: variables, isLoading: loadingVariables } = variablesQueries.useList()
const { data: uiTemplates, isLoading: loadingUiTemplates } = uiTemplatesQueries.useList()

function resetModel() {
  violations.value = []
  if (deployment.value) {
    meta.value = cloneDeep(deployment.value)
    if (!meta.value.templateConfig) {
      meta.value.templateConfig = {
        columnTemplate:{name:"", id:null}, 
        uiTemplate:{name:"", id:null}
      }
    }
    if (!meta.value.templateConfig.columnTemplate) {
      meta.value.templateConfig.columnTemplate = {name:"", id:null}
    }
    if (!meta.value.templateConfig.uiTemplate) {
      meta.value.templateConfig.uiTemplate = {name:"", id:null}
    }
  }
}
function setDataset(selection){
  const dataset = datasets.value.find(d => d.name === selection)
  if(dataset){
    meta.value.datasetMetadata = cloneDeep(dataset)
  }
}

function add(data) {
  if (!data.templateConfig.id) {
    const {
      datasetMetadata: {id},
      siteCode,
      containerId
    } = data
    if(siteCode && containerId && id){
      const {name: dataset} = datasets.value.find(_dataset => _dataset.id === id )
      data.templateConfig.name = `${dataset} (${siteCode}, ${containerId})`
     }
    create(data)
  }
}

function setValue(path, value){
  if(typeof value === 'number') set(meta.value, path, Number(value))
  else set(meta.value, path, value)
}
function updateDeployment(data) {
  if(data.templateConfig.id) update(data)
  else add(data)
}
function cancel(){
  resetModel()
  router.push({path:'/deployment'})
}
</script>
<template>
  <div class="editor-wrap">
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <BButton variant="warning" size="sm" @click="resetModel">Reset</BButton>
          <BButton variant="primary" size="sm" @click="updateDeployment(meta)" v-if="meta.id">Save</BButton>
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
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <BForm v-else>
      <!-- <IdentifierFormGroup :meta="meta"/> -->

      <BFormGroup id="input-group-site-code" label="siteCode" label-for="input-site-code">
        <BFormInput id="input-site-code" v-model="meta.siteCode" placeholder="Enter name" required />
      </BFormGroup>

       <BFormGroup id="input-group-container-id" label="ContainerId" label-for="input-container-id">
        <BFormInput id="input-container-id" v-model="meta.containerId" placeholder="Enter name" required />
      </BFormGroup>
      <BFormGroup id="input-group-top-panel-order" label="Top Panel Order" label-for="input-container-id">
        <BFormInput id="input-top-panel-order" v-model="meta.topPanelOrder" placeholder="Enter order" />
      </BFormGroup>
      <BFormGroup id="dropdown-group-dataset" label="Dataset" label-for="input-dataset">
        <BFormSelect
            id="input-dataset"
            v-model="meta.datasetMetadata.id"
            :options="datasets"
            text-field="name"
            value-field="id"
        ></BFormSelect>
      </BFormGroup>

      <BFormGroup id="dropdown-group-ui-template" label="UI Template" label-for="input-ui-template">
        <BFormSelect
            id="input-ui-template"
            :model-value="meta.templateConfig?.uiTemplate?.id ?? ''"
            :options="uiTemplates"
            text-field="name"
            value-field="id"
            @change="setValue(['templateConfig', 'uiTemplate', 'id'], Number($event.target.value))"
        ></BFormSelect>
      </BFormGroup>

      <BFormGroup id="dropdown-group-variables" label="Variables" label-for="input-variables">
        <BFormSelect
            id="input-variables"
            :model-value="meta.templateConfig?.columnTemplate?.id ?? ''"
            :options="variables"
            text-field="name"
            value-field="id"
            @change="setValue(['templateConfig', 'columnTemplate', 'id'], Number($event.target.value))"
        ></BFormSelect>
      </BFormGroup>

      <HistoryFormGroup :meta="meta"/>
      </BForm>
  </div>
</template>

<style scoped>
.editor-wrap {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-direction: column;
}

.state-msg { padding: 40px; text-align: center; color: #6b7280; font-size: 14px; }

.error-state {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #dc2626;
  text-align: center;
}
.error-state pre {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  color: #7f1d1d;
  white-space: pre-wrap;
  max-width: 480px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px 48px;
  text-align: center;
}
.empty-icon { font-size: 40px; }
.empty-card h3 { font-size: 16px; font-weight: 700; color: #111; margin: 0; }
.empty-card p  { font-size: 13px; color: #6b7280; margin: 0; }

/* Split pane (same as old ConfigEditor) */
.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.split-container.is-dragging { cursor: col-resize; user-select: none; }

.tree-pane {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  min-width: 200px;
}
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 160px;
}
.splitter {
  flex: 0 0 6px;
  background: #e5e7eb;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.splitter:hover, .split-container.is-dragging .splitter { background: #c7d2fe; }
.splitter-dots {
  width: 2px;
  height: 32px;
  border-radius: 2px;
  background: repeating-linear-gradient(to bottom, #9ca3af 0px, #9ca3af 3px, transparent 3px, transparent 6px);
}
.pane-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.copy-icon-btn { background: none; color: #9ca3af; font-size: 14px; padding: 0; line-height: 1; }
.copy-icon-btn:hover { color: #374151; }
.tree-scroll { flex: 1; overflow: auto; padding: 8px 4px 24px 8px; }

.coming-soon {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}
</style>
