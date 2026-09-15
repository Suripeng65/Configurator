<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <div class="aa-groups">
      <div v-for="(group, gi) in (control.data || [])" :key="gi" class="aa-groups-row">
        <input
          :id="control.id + '-group-' + gi"
          class="aa-input"
          :value="(group || []).join(', ')"
          :disabled="!control.enabled"
          @change="setGroup(gi, $event.target.value)"
        />
        <button type="button" class="aa-remove" title="Remove group" @click="removeGroup(gi)">×</button>
      </div>
      <button type="button" class="aa-add" :disabled="!control.enabled" @click="addGroup">+ group</button>
    </div>
  </control-wrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { rankWith, and, isControl, schemaMatches } from '@jsonforms/core'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { ControlWrapper, useVanillaControl } from '@jsonforms/vue-vanilla'

// Renders `{ type: 'array', items: { type: 'array', items: { type: 'string' } } }`
// (e.g. BracketList's `values`) as one row per group, edited as a
// comma-separated string — vue-vanilla's built-in array renderer only
// handles `items.type === 'object'` (a table of properties), so an array of
// primitive-arrays has no good default.
const renderer = defineComponent({
  name: 'ArrayOfArraysRenderer',
  components: { ControlWrapper },
  props: { ...rendererProps() },
  setup(props) {
    const input = useVanillaControl(useJsonFormsControl(props), (v: any) => v.value)

    function currentArray(): string[][] {
      const data = input.control.value.data
      return Array.isArray(data) ? data.map((g: any) => (Array.isArray(g) ? [...g] : [])) : []
    }
    function commit(arr: string[][]) {
      input.handleChange(input.control.value.path, arr)
    }
    function setGroup(idx: number, raw: string) {
      const arr = currentArray()
      arr[idx] = raw.split(',').map((s) => s.trim()).filter(Boolean)
      commit(arr)
    }
    function addGroup() {
      const arr = currentArray()
      arr.push([])
      commit(arr)
    }
    function removeGroup(idx: number) {
      const arr = currentArray()
      arr.splice(idx, 1)
      commit(arr)
    }

    return { ...input, setGroup, addGroup, removeGroup }
  },
})

export default renderer

export const arrayOfArraysTester = rankWith(
  5,
  and(
    isControl,
    schemaMatches((schema) => schema.type === 'array' && (schema.items as any)?.type === 'array')
  )
)
</script>

<style scoped>
.aa-groups { display: flex; flex-direction: column; gap: 4px; }
.aa-groups-row { display: flex; align-items: center; gap: 5px; }
.aa-input {
  flex: 1;
  font-size: 12px;
  padding: 3px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
.aa-remove {
  color: #d1d5db;
  background: none;
  border: none;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.aa-remove:hover { color: #dc2626; }
.aa-add {
  align-self: flex-start;
  font-size: 11px;
  border: 1px dashed #9ca3af;
  background: none;
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
  color: #6b7280;
}
.aa-add:hover { border-color: #6366f1; color: #6366f1; }
</style>
