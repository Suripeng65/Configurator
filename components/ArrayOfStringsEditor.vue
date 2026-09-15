<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string[]
  label: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  placeholder: 'Enter value',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const items = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val),
})

function addItem() {
  items.value.push('')
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function updateItem(index: number, value: string) {
  const updated = [...items.value]
  updated[index] = value
  items.value = updated
}
</script>

<template>
  <div class="array-of-strings-editor">
    <div class="editor-header">
      <label class="form-label mb-0">{{ label }}</label>
      <BButton size="sm" variant="outline-primary" @click="addItem">+ Add</BButton>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <p class="text-muted small">No items added yet</p>
    </div>

    <div v-else class="items-list">
      <div v-for="(item, index) in items" :key="index" class="item-card">
        <div class="item-header">
          <span class="item-index">Item {{ index + 1 }}</span>
          <BButton
            size="sm"
            variant="link"
            class="text-danger p-0"
            @click="removeItem(index)"
            title="Remove item"
          >
            ✕
          </BButton>
        </div>

        <div class="item-fields">
          <BFormInput
            :model-value="item"
            size="sm"
            :placeholder="placeholder"
            @update:model-value="updateItem(index, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.array-of-strings-editor {
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
</style>
