<script setup lang="ts">
import { ref, computed } from 'vue'

interface RadioOption {
  text: string
  value: string
}

interface Props {
  modelValue: string[] | Record<string, any> | null
  label?: string
  radioOptions?: RadioOption[]  // Custom radio options
  arrayLabel?: string           // Label for array input section
  objectLabel?: string          // Label for object input section
  arrayPlaceholder?: string     // Placeholder for array textarea
  objectPlaceholder?: string    // Placeholder for object textarea
}

interface Emits {
  (e: 'update:modelValue', value: string[] | Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Input Type',
  radioOptions: () => [
    { text: 'List of Strings', value: 'array' },
    { text: 'Object', value: 'object' }
  ],
  arrayLabel: 'Enter one string per line:',
  objectLabel: 'Enter JSON object:',
  arrayPlaceholder: 'Enter strings, one per line\nExample:\noption1\noption2\noption3',
  objectPlaceholder: 'Enter valid JSON\nExample:\n{\n  "key1": "value1",\n  "key2": "value2"\n}'
})

const emit = defineEmits<Emits>()

// Determine initial mode based on modelValue
const getInitialMode = (): string => {
  if (Array.isArray(props.modelValue)) return 'array'
  if (props.modelValue && typeof props.modelValue === 'object' && 'hierarchy' in props.modelValue) return 'array'
  if (props.modelValue && typeof props.modelValue === 'object') return 'object'
  // Return first radio option value as default
  return props.radioOptions[0]?.value || 'array'
}

const inputMode = ref<string>(getInitialMode())

// Local state for array input
const stringArray = computed({
  get: () => {
    if (Array.isArray(props.modelValue)) {
      return props.modelValue.join('\n')
    }
    if (props.modelValue && typeof props.modelValue === 'object' && 'hierarchy' in props.modelValue) {
      const hierarchy = (props.modelValue as any).hierarchy
      if (Array.isArray(hierarchy)) {
        return hierarchy.join('\n')
      }
    }
    return ''
  },
  set: (val: string) => {
    const strings = val
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    emit('update:modelValue', {hierarchy: strings})
  }
})

// Local state for object input fields
const idColumn = computed({
  get: () => {
    if (props.modelValue && typeof props.modelValue === 'object' && !Array.isArray(props.modelValue)) {
      return props.modelValue['id-column'] ?? ''
    }
    return ''
  },
  set: (val: string) => {
    const parentCol = (props.modelValue as any)?.['parent-column'] ?? ''
    emit('update:modelValue', {
      'id-column': val,
      'parent-column': parentCol
    })
  }
})

const parentColumn = computed({
  get: () => {
    if (props.modelValue && typeof props.modelValue === 'object' && !Array.isArray(props.modelValue)) {
      return props.modelValue['parent-column'] ?? ''
    }
    return ''
  },
  set: (val: string) => {
    const idCol = (props.modelValue as any)?.['id-column'] ?? ''
    emit('update:modelValue', {
      'id-column': idCol,
      'parent-column': val
    })
  }
})

// Handle mode change
const handleModeChange = (mode: string) => {
  inputMode.value = mode
  // Reset to appropriate default when switching modes
  if (mode === 'array') {
    emit('update:modelValue', [])
  } else if (mode === 'object') {
    emit('update:modelValue', {})
  }
}
</script>

<template>
  <BFormGroup :label="label">
    <!-- Radio selection for input type -->
    <BFormRadioGroup
      v-model="inputMode"
      :options="radioOptions"
      @update:model-value="handleModeChange"
      class="mb-3"
    />

    <!-- String array input -->
    <div v-if="inputMode === 'array'" class="input-section">
      <label class="form-label small text-muted">{{ arrayLabel }}</label>
      <BFormTextarea
        v-model="stringArray"
        rows="6"
        :placeholder="arrayPlaceholder"
        size="sm"
      />
      <small class="text-muted d-block mt-2">
        {{ stringArray.split('\n').filter(s => s.trim()).length }} item(s)
      </small>
    </div>

    <!-- Object input with dedicated fields -->
    <div v-else-if="inputMode === 'object'" class="input-section">
      <label class="form-label small text-muted">{{ objectLabel }}</label>
      <BFormGroup label="Child Column" label-for="id-column-input" class="mb-2">
        <BFormInput
          id="id-column-input"
          v-model="idColumn"
          size="sm"
          placeholder="e.g., id"
        />
      </BFormGroup>
      <BFormGroup label="Parent Column" label-for="parent-column-input" class="mb-0">
        <BFormInput
          id="parent-column-input"
          v-model="parentColumn"
          size="sm"
          placeholder="e.g., parent_id"
        />
      </BFormGroup>
    </div>
  </BFormGroup>
</template>

<style scoped>
.input-section {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-top: 8px;
}

.form-label {
  margin-bottom: 6px;
  display: block;
  font-weight: 500;
}
</style>
