<script setup lang="ts">
import { BModal } from 'bootstrap-vue-next'

withDefaults(defineProps<{
  modelValue: boolean
  name: string
  entityLabel?: string
}>(), {
  entityLabel: 'template',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function onOk() {
  emit('confirm')
}

function onCancelled() {
  emit('cancel')
}
</script>

<template>
  <BModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Name already exists"
    ok-title="Overwrite"
    ok-variant="danger"
    cancel-variant="outline-secondary"
    @ok.prevent="onOk"
    @hide="onCancelled"
  >
    <p class="mb-0">
      A {{ entityLabel }} named <strong>{{ name }}</strong> already exists. Do you want to overwrite it?
    </p>
  </BModal>
</template>
