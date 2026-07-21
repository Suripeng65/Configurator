<template>
  <span class="value-editor">
    <button
      v-if="valueType === 'boolean'"
      :class="['bool-btn', props.value ? 'bool-true' : 'bool-false']"
      @click="emit('change', !props.value)"
    >{{ props.value ? 'true' : 'false' }}</button>

    <span v-else-if="valueType === 'null'" class="null-val">null</span>

    <input
      v-else-if="editing"
      ref="inputEl"
      v-model="draft"
      :type="valueType === 'number' ? 'number' : 'text'"
      class="value-input"
      :style="{ width: Math.max(60, draft.length * 7.5 + 16) + 'px' }"
      @blur="commit"
      @keyup.enter="commit"
      @keyup.escape="cancel"
    />

    <span
      v-else
      :class="['value-display', `val-${valueType}`]"
      :title="String(props.value)"
      @click="startEdit"
    >
      <template v-if="valueType === 'string'">"{{ truncated }}"</template>
      <template v-else>{{ props.value }}</template>
    </span>
  </span>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  value: { default: null },
})

const emit = defineEmits(['change'])

const editing = ref(false)
const draft = ref('')
const inputEl = ref(null)

const valueType = computed(() => {
  if (props.value === null || props.value === undefined) return 'null'
  if (Array.isArray(props.value)) return 'array'
  return typeof props.value
})

const truncated = computed(() => {
  const s = String(props.value)
  return s.length > 80 ? s.slice(0, 80) + '…' : s
})

async function startEdit() {
  draft.value = String(props.value)
  editing.value = true
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select()
}

function commit() {
  let newVal = draft.value
  if (valueType.value === 'number') {
    const n = parseFloat(draft.value)
    newVal = isNaN(n) ? draft.value : n
  }
  emit('change', newVal)
  editing.value = false
}

function cancel() { editing.value = false }
</script>

<style scoped>
.value-editor { display: inline-flex; align-items: center; }

.value-display {
  cursor: text;
  border-radius: 2px;
  padding: 1px 3px;
}
.value-display:hover { background: #e8f0fe; text-decoration: underline dotted; }

.val-string { color: #a31515; }
.val-number { color: #098658; }

.value-input {
  border: 1px solid #0066cc;
  background: #fff;
  padding: 1px 4px;
  min-width: 60px;
  max-width: 480px;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 12px;
}

.bool-btn { font-size: 11px; padding: 1px 6px; border-radius: 10px; font-weight: 600; }
.bool-true  { background: #d1fae5; color: #065f46; }
.bool-false { background: #fee2e2; color: #7f1d1d; }
.bool-btn:hover { opacity: 0.8; }

.null-val { color: #6b7280; font-style: italic; font-size: 11px; }
</style>
