<script setup lang="ts">
import { ref, watch } from 'vue'
import { BModal, BFormTextarea, BAlert } from 'bootstrap-vue-next'

interface Violation {
  rule?: string
  message?: string
}

// `validate` receives the parsed JSON and returns Violation[] — the same
// shape validateUiTemplate/validateVariables already produce, so this stays
// a thin, generic shell and the actual rules live in one place
// (validation/*.rules.js), shared with the regular Save flow.
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  bodyText: string
  parseErrorMessage?: string
  validate?: (parsed: any) => Violation[]
}>(), {
  parseErrorMessage: 'The pasted text must be valid JSON.',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'import', parsed: any): void
}>()

const text = ref('')
const errors = ref<string[]>([])

watch(() => props.modelValue, (open) => {
  if (open) {
    text.value = ''
    errors.value = []
  }
})

function commit() {
  let parsed: any
  try {
    parsed = JSON.parse(text.value)
  } catch {
    errors.value = [props.parseErrorMessage]
    return
  }
  const violations = props.validate?.(parsed) ?? []
  if (violations.length) {
    errors.value = violations.map(v => v.message ?? String(v))
    return
  }
  errors.value = []
  emit('import', parsed)
  emit('update:modelValue', false)
}
</script>

<template>
  <BModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    ok-title="Save"
    ok-variant="primary"
    cancel-variant="outline-secondary"
    @ok.prevent="commit"
  >
    <BAlert :model-value="errors.length > 0" variant="danger">
      <strong>The request was not completed for the following reason(s):</strong>
      <ul class="mb-0">
        <li v-for="(e, i) in errors" :key="i">{{ e }}</li>
      </ul>
    </BAlert>
    <p class="mb-2">{{ bodyText }}</p>
    <BFormTextarea v-model="text" rows="12" class="font-monospace import-textarea" placeholder="Paste JSON here…" />
  </BModal>
</template>

<style scoped>
.import-textarea { font-size: 12px; }
</style>
