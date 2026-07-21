<script setup lang='ts'>
import { useRoute } from 'vue-router'
import {inject} from "vue";
import {BButton} from "bootstrap-vue-next";
const route  = useRoute()

const id = route.params.id
const meta = inject('meta')
const resetModel: Function = inject('resetModel') as Function
const create: Function = inject('create') as Function
const update: Function = inject('update') as Function
const remove: Function = inject('remove') as Function
</script>

<template>
  <BButtonGroup>
    <BButton variant="warning" size="sm" @click="resetModel">Reset</BButton>
    <BButton v-if="!id" variant="primary" size="sm" @click="create(meta)">Save</BButton>
    <BButton v-if="id" variant="primary" size="sm" @click="update(meta)">Save</BButton>
    <BButton v-if="id" variant="danger" size="sm" @click="remove(id)">Delete</BButton>
  </BButtonGroup>
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
