<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {ref, Ref, watch, computed} from "vue";
import useEditorWorkflow from "@src/composables/EditorWorkflow.ts";
import {uiTemplatesQueries} from "@src/queries";
import Banner from "@src/components/Banner.vue";
import EditorWarnings from "@src/components/EditorWarnings.vue";
import ArchiveModal from "@src/components/ArchiveModal.vue";
import { useResourceUsageCheck } from "@src/composables/ResourceUsageCheck";
import { useAppInfoStore } from "@src/stores/appInfo";
import { useQueryCache } from "@pinia/colada";
 import { validateUiTemplate } from '@src/validation';
import ExportJsonModal from '@src/components/ImportExport/ExportJsonModal.vue';
import ConfirmOverwriteModal from '@src/components/ConfirmOverwrite/ConfirmOverwriteModal.vue';

const route  = useRoute()
const router = useRouter()

const id = route.params.id ? parseInt(<string>route.params.id) : null
const sourceId = !id && history.state?.sourceId ? history.state.sourceId : null

const meta: Ref<Record<string, any>> = ref({
  id: id,
  name: history.state?.name ?? '',
  description: history.state?.description ?? '',
  layout: {}
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
  resetModel,
  violations,
  showOverwriteConfirm,
  pendingOverwriteName,
  confirmOverwrite,
  cancelOverwrite
} = useEditorWorkflow(uiTemplatesQueries, meta, validateUiTemplate)

const queryCache = useQueryCache()
const appInfoData = queryCache.getQueryData(['app-info'])

if(sourceId){
  const {data:sourceData} = uiTemplatesQueries.useById(sourceId)
  watch(sourceData, (data)=>{
    if (data) {
      meta.id = null
      meta.value.name = `Copy of ${data.name}`
      meta.value.description =  data.description ?? ''
      meta.value.layout = data.layout ? { ...data.layout } : {}
    }
  }, {immediate:true})
}

function updateTemplate(meta){
  const version = appInfoData?.applicationInfo?.version ?? 'Beta_v1.0.0'
  if(!meta.attributes) meta.attributes = {}
  if(typeof meta.attributes === 'string') {
    meta.attributes = JSON.parse(meta.attributes)
    meta.attributes.version = version
  }else if(typeof meta.attributes === 'object'){
    meta.attributes.version = version
  }else{
    meta.attributes = {version: version}
  }
  console.log(meta)
  meta.attributes = JSON.stringify(meta.attributes)
 
  update(meta)
}

function cancel(){
  resetModel()
  router.push({path: '/uitemplate'})
}
const showExport=ref(false)
const exportJson = computed(()=>JSON.stringify(meta.value, null, 2))

const archiveModalMsg = 'Are you sure you want to archive the UI template?'
const archiveModalTitle = 'Archive UI Template'
const showArchiveModal = ref(false)
const { isResourceInUse } = useResourceUsageCheck()
const isUiTemplateInUse = computed(() => {
  if (!meta.value.id) return false
  return isResourceInUse({ resourceType: 'uiTemplate', resourceId: meta.value.id })
})

function archiveBtnClick(meta:any){
  showArchiveModal.value = true
}

function archiveConfirm() {
  remove(meta.value)
  showArchiveModal.value = false
  router.push({ path: '/uitemplate'})
}

function archiveCancel() {
  showArchiveModal.value = false
}

</script>
<template>
  <Banner>
    <template #buttons>
      <BButtonGroup>
          <BButton variant="light" size="sm" @click="showExport = true" v-if="meta.id">Export</BButton>
          <BButton variant="warning" size="sm" @click="resetModel" v-if="meta.id">Reset</BButton>
          <BButton variant="primary" size="sm" @click="updateTemplate(meta)" v-if="meta.id">Save</BButton>
          <BButton variant="danger" size="sm"  @click="archiveBtnClick" v-if="meta.id && isUiTemplateInUse === false">Archive</BButton>
          <BButton variant="primary" size="sm" @click="create(meta)" v-else>Create</BButton>
          <BButton size="sm" @click="cancel()" >Cancel</BButton>
        </BButtonGroup>
    </template>
  </Banner>
  <ExportJsonModal
    v-model="showExport"
    title="Export UI Template"
    body-text="Copy the UI Template JSON below."
    :json="exportJson"
    />
  <ConfirmOverwriteModal 
    v-model="showOverwriteConfirm"
    :name="pendingOverwriteName"
    entity-label="UI Template"
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
  <EditorWarnings/>

  <router-view/>
</template>
<style scoped>

</style>