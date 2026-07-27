<script lang="ts" setup>
import {defineProps} from "vue"
import {formatDate} from "@src/utils/date-util.ts";
import {useRouter} from "vue-router";
import {BTable} from "bootstrap-vue-next";

const router = useRouter()

const {rows} = defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

const fields = [
  // { key: 'id', label: 'ID',  thStyle: 'min-width:60px' },
  { key: 'siteCode',        label: 'Site Code', thStyle: 'min-width:100px' },
  { key: 'containerId',        label: 'Container ID', thStyle: 'min-width:100px' },
  { key: 'datasetMetadata.name',        label: 'Dataset Name', thStyle: 'min-width:180px' },
  { key: 'datasetMetadata.dsid',        label: 'DSID',         thStyle: 'min-width:140px' },
  { key: 'templateConfig.columnTemplate.name',        label: 'Variables',         thStyle: 'min-width:140px' },
  { key: 'templateConfig.uiTemplate.name',        label: 'UI Template',         thStyle: 'min-width:140px' },
  { key: 'created',    label: 'Created Date',     thStyle: 'min-width:100px' },
  { key: 'createdBy',  label: 'Created By',     thStyle: 'min-width:100px' },
  { key: 'modified',    label: 'Modified Date',     thStyle: 'min-width:100px' },
  { key: 'modifiedBy',  label: 'Modified By',     thStyle: 'min-width:100px' },
]

function goToEditor(event) {
  const row = event?.item ?? event
  router.push({name: "Deployment Edit", params: {id: row.id}})
}
</script>
<template>
  <BTable
      :items="rows"
      :fields="fields"
      bordered
      hover
      responsive
      class="dataset-table"
      @row-clicked="goToEditor"
  >
    <template #cell(created)="{ item }">
      <span class="date-cell">{{ formatDate(item.created) }}</span>
    </template>
    <template #cell(modified)="{ item }">
      <span class="date-cell">{{ formatDate(item.modified) }}</span>
    </template>
  </BTable>
</template>