<script lang="ts" setup>
import {formatDate} from "@src/utils/date-util.ts";
import {useRouter} from "vue-router";
import {fields} from '@src/config/base-table-schema'

const router = useRouter()

const {rows} = defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

function goToEditor(event) {
  const row = event?.item ?? event
  router.push({name: "UiTemplate Edit", params: {id: row.id}})
}

function duplicate(item: any){
  router.push({name:'UiTemplate Create', state:{ sourceId:item.id }})
}
</script>
<template>
  <BTable
      :items="rows"
      :fields="fields"
      hover
      responsive
      class="ui-table"
      @row-clicked="goToEditor"
  >
    <template #cell(id)="{ item }">
      <span class="mono-badge">{{ item.id || '—' }}</span>
    </template>
    <template #cell(description)="{ item }">
      <span class="mono-badge">{{ item.description || '—' }}</span>
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
    <template #cell(actions)="{ item }">
      <!-- <BButton size="sm" variant="primary" @click.stop="goToEditor(item)">Open →</BButton> -->
      <BButton size="sm" variant="outline-secondary" @click.stop="duplicate(item)">Duplicate</BButton>

    </template>
  </BTable>
</template>