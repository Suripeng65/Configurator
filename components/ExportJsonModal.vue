<script setup lang="ts">
import { ref, watch } from 'vue'
import { BModal, BFormTextarea, BAlert } from 'bootstrap-vue-next'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  bodyText: string
  json?: string
}>(), {
  json: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const copied = ref(false)

watch(() => props.modelValue, (open) => { if (open) copied.value = false })

async function copy() {
  try {
    await navigator.clipboard.writeText(props.json)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <BModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    ok-title="Copy"
    ok-variant="primary"
    cancel-variant="outline-secondary"
    @ok.prevent="copy"
  >
    <BAlert :model-value="copied" variant="success">Copied to clipboard</BAlert>
    <p class="mb-2">{{ bodyText }}</p>
    <BFormTextarea :model-value="json" rows="14" class="font-monospace export-textarea" disabled />
  </BModal>
</template>

<style scoped>
.export-textarea { font-size: 12px; }
</style>
