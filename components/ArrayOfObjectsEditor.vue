<script setup lang="ts">
import { computed } from 'vue'

interface ObjectField {
  key: string
  type: 'string' | 'number' | 'boolean'
  placeholder?: string,
  dim?:string
}

interface Props {
  modelValue: Record<string, any>[]
  objectSchema: ObjectField[]
  label: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const items = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val),
})

function addItem() {
  const newItem: Record<string, any> = {}
  props.objectSchema.forEach((field) => {
    if (field.type === 'number') {
      newItem[field.key] = 0
    } else if (field.type === 'boolean') {
      newItem[field.key] = false
    } else {
      newItem[field.key] = ''
    }
  })
  items.value = [...items.value, newItem]
}

function removeItem(index: number) {
  items.value = items.value.filter((_, i) => i !== index)
}

function updateField(itemIndex: number, fieldKey: string, value: any) {
  const updated = [...items.value]
  updated[itemIndex] = { ...updated[itemIndex], [fieldKey]: value }
  items.value = updated
}
</script>

<template>
  <div class="array-of-objects-editor">
    <div class="editor-header">
      <!-- <label class="form-label mb-0">{{ label }}</label> -->
      <BButton size="sm" variant="outline-primary" @click="addItem">+ Add</BButton>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <p class="text-muted small">No items added yet</p>
    </div>

    <div v-else class="items-list">
      <div v-for="(item, itemIndex) in items" :key="itemIndex" class="item-card">
        <div class="item-header">
          <span class="item-index">Item {{ itemIndex + 1 }}</span>
          <BButton
            size="sm"
            variant="link"
            class="text-danger p-0"
            @click="removeItem(itemIndex)"
            title="Remove item"
          >
            ✕
          </BButton>
        </div>

        <div class="item-fields">
          <BFormGroup
            v-for="field in objectSchema"
            :key="field.key"
            :label="field.key"
            label-class="small"
          >
            <!-- String field -->
            <BFormInput
              v-if="field.type === 'string'"
              :model-value="item[field.key]"
              size="sm"
              :placeholder="field.placeholder ?? ''"
              @update:model-value="updateField(itemIndex, field.key, $event)"
            />

            <!-- Number field -->
            <BFormInput
              v-else-if="field.type === 'number'"
              :model-value="item[field.key]"
              type="number"
              size="sm"
              :placeholder="field.placeholder ?? ''"
              @update:model-value="updateField(itemIndex, field.key, Number($event))"
            />

            <!-- Boolean field -->
            <BFormRadioGroup
              v-else-if="field.type === 'boolean'"
              :model-value="item[field.key]"
              :options="[
                { text: 'True', value: true },
                { text: 'False', value: false },
              ]"
              @update:model-value="updateField(itemIndex, field.key, $event)"
            />
          </BFormGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.array-of-objects-editor {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background: #fafbfc;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.empty-state {
  padding: 16px;
  text-align: center;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 10px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.item-index {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.item-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-fields :deep(.form-group) {
  margin-bottom: 0;
}

.item-fields :deep(.form-label) {
  font-size: 12px;
  margin-bottom: 4px;
}

.b-form-group{
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
