<script setup lang='ts'>
import {inject} from "vue";
import {BAlert} from "bootstrap-vue-next";

const createError: string = inject('createError') as string
const updateError: string = inject('updateError') as string
const removeError: string = inject('removeError') as string
</script>

<template>
  <BAlert v-model="createError" variant="danger" dismissible>{{ createError }}</BAlert>
  <BAlert v-model="updateError" variant="danger" dismissible>{{ updateError }}</BAlert>
  <BAlert v-model="removeError" variant="danger" dismissible>{{ removeError }}</BAlert>
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
