<script lang="ts" setup>
import {defineProps} from "vue"
import {formatDate} from "@src/utils/date-util.ts";
import {useRouter} from "vue-router";

const router = useRouter()

const {rows} = defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

const fields = [
  // { key: 'id', label: 'ID',  thStyle: 'min-width:120px' },
  { key: 'name',        label: 'Dataset Name', thStyle: 'min-width:180px' },
  { key: 'dsid',        label: 'DSID',         thStyle: 'min-width:140px' },
  { key: 'created',    label: 'Created Date',     thStyle: 'min-width:100px' },
  { key: 'modified',    label: 'Modified Date',     thStyle: 'min-width:100px' },
  { key: 'modifiedBy',  label: 'Modified By',     thStyle: 'min-width:100px' },
]

function goToEditor(event) {
  const row = event?.item ?? event
  router.push({name: "Dataset Edit", params: {id: row.id}})
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