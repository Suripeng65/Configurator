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
  // { key: 'id', label: 'ID' },
  { key: 'name', label: 'Column Template Name' },
  { key: 'description', label: 'Description' },
  { key: 'created', label: 'Created' },
  { key: 'modified', label: 'Modified' },
  { key: 'modifiedBy', label: 'Modified By' },
]

function goToEditor(event) {
  const row = event?.item ?? event
  router.push({name: "Variable Edit", params: {id: row.id}})
}
</script>
<template>
  <BTable
      :items="rows"
      :fields="fields"
      hover
      responsive
      class="vars-table"
      @row-clicked="goToEditor"
  >
    <template #cell(dsid)="{ item }">
      <span class="ds-id-badge">{{ item.dsid }}</span>
    </template>
    <template #cell(description)="{ item }">
      <span class="mono-badge">{{ item.description }}</span>
    </template>
    <template #cell(created)="{ item }">
      <span class="date-cell">{{ formatDate(item.created) }}</span>
    </template>
    <template #cell(modified)="{ item }">
      <span class="date-cell">{{ formatDate(item.modified) }}</span>
    </template>
    <template #cell(modifiedBy)="{ item }">
      <span class="mono-badge">{{ item.modifiedBy }}</span>
    </template>
  </BTable>
</template>