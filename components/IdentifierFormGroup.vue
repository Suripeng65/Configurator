<script setup lang='ts'>
import {BFormGroup, BFormInput} from "bootstrap-vue-next";
import { defineProps } from 'vue'

const {meta} = defineProps({
  meta: {
    required: true,
    type: Object,
    default: {},
  }
})

</script>

<template>
  <template v-for="field in ['id', 'uuid']">
    <BFormGroup v-if="meta[field]" :id="`input-group-${field}`" :label="field.toUpperCase()" :label-for="`input-model-${field}`">
      <BFormInput :id="`input-model-${field}`" v-model="meta[field]" disabled />
    </BFormGroup>
  </template>
</template>
<style scoped>
</style>
