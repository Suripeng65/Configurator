<script setup lang='ts'>
import { useRoute } from 'vue-router'
import {inject, ref, computed} from "vue";
import {BButton} from "bootstrap-vue-next";
import ExportJsonModal from "@src/components/ExportJsonModal.vue";
import ConfirmOverwriteModal from "@src/components/ConfirmOverwriteModal.vue";
const route  = useRoute()

const id = route.params.id
const meta = inject('meta') as any
const resetModel: Function = inject('resetModel') as Function
const create: Function = inject('create') as Function
const update: Function = inject('update') as Function
const remove: Function = inject('remove') as Function
const showOverwriteConfirm = inject('showOverwriteConfirm') as any
const pendingOverwriteName = inject('pendingOverwriteName') as any
const confirmOverwrite: Function = inject('confirmOverwrite') as Function
const cancelOverwrite: Function = inject('cancelOverwrite') as Function

const showExport = ref(false)
const exportJson = computed(() => JSON.stringify(meta?.value ?? {}, null, 2))
</script>

<template>
  <BButtonGroup>
    <BButton variant="outline-primary" size="sm" @click="showExport = true">Export</BButton>
    <BButton variant="warning" size="sm" @click="resetModel">Reset</BButton>
    <BButton v-if="!id" variant="primary" size="sm" @click="create(meta)">Save</BButton>
    <BButton v-if="id" variant="primary" size="sm" @click="update(meta)">Save</BButton>
    <BButton v-if="id" variant="danger" size="sm" @click="remove(id)">Delete</BButton>
  </BButtonGroup>

  <ExportJsonModal
    v-model="showExport"
    title="Export UI Template"
    body-text="Copy the UI Template JSON below."
    :json="exportJson"
  />

  <ConfirmOverwriteModal
    v-model="showOverwriteConfirm"
    :name="pendingOverwriteName"
    entity-label="UI template"
    @confirm="confirmOverwrite"
    @cancel="cancelOverwrite"
  />
</template>
<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 12px;
  background: #3b82f6;
  flex-shrink: 0;
}
.page-title { font-size: 20px; font-weight: 700; margin: 0; color: #fff; }
</style>
