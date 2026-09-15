<script setup lang="ts">
import { computed } from 'vue'

interface FieldSchema {
  key: string
  type: 'string' | 'number' | 'boolean' | 'dropdown' | 'object'
  label?: string
  placeholder?: string
  options?: string[] // for dropdown
  schema?: FieldSchema[] // for nested objects
  dim?: string
}

interface Props {
  modelValue: Record<string, any>
  schema: FieldSchema[]
  label?: string
  nested?: boolean // internal flag for nested rendering
}

const props = withDefaults(defineProps<Props>(), {
  nested: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

const localValue = computed({
  get: () => props.modelValue || {},
  set: (val) => emit('update:modelValue', val),
})

function updateField(key: string, value: any) {
  localValue.value = { ...localValue.value, [key]: value }
}
</script>

<template>
  <BFormGroup v-if="!nested" >
    <div class="object-editor">
      <BFormGroup
        v-for="field in schema"
        :key="field.key"
        :label="field.label || field.key"
        label-class="small"
      >
        <!-- String field -->
        <BFormInput
          v-if="field.type === 'string'"
          :model-value="localValue[field.key]"
          size="sm"
          :placeholder="field.placeholder"
          @update:model-value="updateField(field.key, $event)"
        />

        <!-- Number field -->
        <BFormInput
          v-else-if="field.type === 'number'"
          :model-value="localValue[field.key]"
          type="number"
          size="sm"
          :placeholder="field.placeholder"
          @update:model-value="updateField(field.key, Number($event))"
        />

        <!-- Boolean field -->
        <BFormRadioGroup
          v-else-if="field.type === 'boolean'"
          :model-value="localValue[field.key]"
          :options="[
            { text: 'True', value: true },
            { text: 'False', value: false }
          ]"
          @update:model-value="updateField(field.key, $event)"
        />

        <!-- Dropdown field -->
        <BFormSelect
          v-else-if="field.type === 'dropdown'"
          :model-value="localValue[field.key]"
          size="sm"
          @update:model-value="updateField(field.key, $event)"
        >
          <option v-for="opt in field.options" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </BFormSelect>

        <!-- Nested object field -->
        <ObjectEditor
          v-else-if="field.type === 'object' && field.schema"
          :model-value="localValue[field.key] || {}"
          :schema="field.schema"
          :label="field.label || field.key"
          :nested="true"
          @update:model-value="updateField(field.key, $event)"
        />
      </BFormGroup>
    </div>
  </BFormGroup>

  <!-- Nested rendering (without outer BFormGroup wrapper) -->
  <div v-else class="object-editor nested">
    <div class="nested-header">{{ label }}</div>
    <BFormGroup
      v-for="field in schema"
      :key="field.key"
      :label="field.label || field.key"
      label-class="small"
    >
      <!-- String field -->
      <BFormInput
        v-if="field.type === 'string'"
        :model-value="localValue[field.key]"
        size="sm"
        :placeholder="field.placeholder"
        @update:model-value="updateField(field.key, $event)"
      />

      <!-- Number field -->
      <BFormInput
        v-else-if="field.type === 'number'"
        :model-value="localValue[field.key]"
        type="number"
        size="sm"
        :placeholder="field.placeholder"
        @update:model-value="updateField(field.key, Number($event))"
      />

      <!-- Boolean field -->
      <BFormRadioGroup
        v-else-if="field.type === 'boolean'"
        :model-value="localValue[field.key]"
        :options="[
          { text: 'True', value: true },
          { text: 'False', value: false }
        ]"
        @update:model-value="updateField(field.key, $event)"
      />

      <!-- Dropdown field -->
      <BFormSelect
        v-else-if="field.type === 'dropdown'"
        :model-value="localValue[field.key]"
        size="sm"
        @update:model-value="updateField(field.key, $event)"
      >
        <option v-for="opt in field.options" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </BFormSelect>

      <!-- Nested object field -->
      <ObjectEditor
        v-else-if="field.type === 'object' && field.schema"
        :model-value="localValue[field.key] || {}"
        :schema="field.schema"
        :label="field.label || field.key"
        :nested="true"
        @update:model-value="updateField(field.key, $event)"
      />
    </BFormGroup>
  </div>
</template>

<style scoped>
.object-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.object-editor.nested {
  padding: 12px;
  background: #fafbfc;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  margin-top: 4px;
}

.nested-header {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
}

.object-editor :deep(.form-group) {
  margin-bottom: 0;
}
.b-form-group{
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn-group-md{
  display:flex;
  align-items: center;
  gap:12px;
}
</style>
