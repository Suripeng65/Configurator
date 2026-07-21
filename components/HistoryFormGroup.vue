<script setup lang='ts'>
import { defineProps } from 'vue'
import { formatDate } from '@src/utils/date-util'

const {meta} = defineProps({
  meta: {
    required: true,
    type: Object,
    default: {},
  }
})

const fields = [
  {field: 'created', label: 'Created'},
  {field: 'createdBy', label: 'Created By'},
  {field: 'modified', label: 'Modified'},
  {field: 'modifiedBy', label: 'Modified By'},
]

function formatValue(field, value) {
  if (field === 'created' || field === 'modified') {
    return formatDate(value)
  }
  return value
}

</script>

<template>
  <template v-for="field in fields">
    <div v-if="meta[field.field]">{{ field.label }}: {{ formatValue(field.field, meta[field.field]) }}</div>
  </template>
</template>
<style scoped>
</style>
