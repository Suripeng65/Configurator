<template>
  <div class="cn-node" :class="`depth-${depth}`">

    <!-- Header -->
    <div class="cn-header" @click="expanded = !expanded">
      <span class="cn-arrow" :class="{ expanded }">▶</span>

      <BFormInput
        v-if="editingName"
        ref="nameInputEl"
        v-model="nameDraft"
        size="sm"
        class="cn-name-input"
        @blur="commitName"
        @keyup.enter="commitName"
        @keyup.escape="editingName = false"
        @click.stop
        @mousedown.stop
      />
      <span
        v-else
        class="cn-name"
        :title="nameKey ? 'Double-click to rename' : ''"
        @dblclick.stop="startEditName"
      >{{ displayName }}</span>

      <span class="cn-pill">{{ item.component }}</span>

      <BButton variant="link" size="sm" class="cn-del p-0 ms-auto" title="Remove" @click.stop="removeNode">✕</BButton>
    </div>

    <!-- Body -->
    <div v-if="expanded" class="cn-body">

      <!-- Key/value fields -->
      <div class="cn-fields">
        <div
          v-for="key in fieldKeys"
          :key="key"
          class="cn-frow"
          :class="{ 'cn-frow--top': isMultiline(item[key]) }"
        >
          <span class="cn-flabel" :title="key">{{ key }}</span>

          <!-- boolean -->
          <BFormCheckbox
            v-if="typeof item[key] === 'boolean'"
            class="cn-bool mb-0"
            :model-value="item[key]"
            @update:model-value="setField(key, $event)"
          >{{ item[key] ? 'true' : 'false' }}</BFormCheckbox>

          <!-- number -->
          <BFormInput
            v-else-if="typeof item[key] === 'number'"
            size="sm"
            type="number"
            :model-value="item[key]"
            @update:model-value="setField(key, Number($event))"
          />

          <!-- flat array (strings / numbers) -->
          <BFormTextarea
            v-else-if="isFlatArray(item[key])"
            size="sm"
            :model-value="item[key].join('\n')"
            rows="3"
            @update:model-value="setField(key, $event.split('\n').map(s => s.trim()).filter(Boolean))"
          />

          <!-- object / array-of-objects → JSON -->
          <BFormTextarea
            v-else-if="item[key] !== null && typeof item[key] === 'object'"
            size="sm"
            class="cn-ftextarea--json"
            :model-value="JSON.stringify(item[key], null, 2)"
            rows="3"
            @update:model-value="setFieldJson(key, $event)"
          />

          <!-- string (default) -->
          <BFormInput
            v-else
            size="sm"
            :class="{ 'font-monospace': MONO_KEYS.has(key) }"
            :model-value="item[key] ?? ''"
            @update:model-value="setField(key, $event)"
          />

          <BButton variant="link" size="sm" class="cn-fremove p-0" title="Remove field" @click="removeField(key)">×</BButton>
        </div>
      </div>

      <!-- Add field form -->
      <div v-if="showAddField" class="cn-add-row">
        <BFormInput
          v-model="newFieldKey"
          size="sm"
          placeholder="key"
          class="font-monospace cn-af-key"
          @keyup.enter="commitAddField"
          @keyup.escape="cancelAddField"
        />
        <span class="cn-af-sep">:</span>
        <BFormInput
          v-model="newFieldValue"
          size="sm"
          placeholder="value"
          class="cn-af-flex"
          @keyup.enter="commitAddField"
          @keyup.escape="cancelAddField"
        />
        <BFormSelect v-model="newFieldType" size="sm" class="cn-af-type">
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">bool</option>
          <option value="array">string[]</option>
        </BFormSelect>
        <BButton variant="primary" size="sm" @click="commitAddField">Add</BButton>
        <BButton variant="link" size="sm" class="text-secondary p-0" @click="cancelAddField">✕</BButton>
      </div>
      <BButton v-else variant="outline-secondary" size="sm" class="cn-dashed-btn" @click="showAddField = true">+ field</BButton>

      <!-- Recursive children -->
      <div class="cn-children">
        <ComponentNode
          v-for="(child, idx) in (item.contents || [])"
          :key="idx"
          :item="child"
          :path="[...path, 'contents', idx]"
          :depth="depth + 1"
        />

        <div v-if="showAddChild" class="cn-add-row cn-add-row--child">
          <BFormSelect v-model="newChildType" size="sm" class="cn-af-select">
            <option value="" disabled>Select component...</option>
            <optgroup v-for="g in componentsByGroup" :key="g.group" :label="GROUP_LABELS[g.group]">
              <option v-for="c in g.items" :key="c.key" :value="c.key">{{ c.label }}</option>
            </optgroup>
          </BFormSelect>
          <BFormInput
            v-if="selectedChildDef?.nameKey"
            v-model="newChildName"
            size="sm"
            :placeholder="selectedChildDef.nameKey"
            class="cn-af-flex"
            @keyup.enter="commitAddChild"
            @keyup.escape="cancelAddChild"
          />
          <BButton variant="primary" size="sm" :disabled="!newChildType" @click="commitAddChild">Add</BButton>
          <BButton variant="link" size="sm" class="text-secondary p-0" @click="cancelAddChild">✕</BButton>
        </div>
        <BButton v-else variant="outline-secondary" size="sm" class="cn-dashed-btn w-100 text-start" @click="showAddChild = true">+ Add child</BButton>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, inject } from 'vue'
import { BButton, BFormInput, BFormSelect, BFormCheckbox, BFormTextarea } from 'bootstrap-vue-next'
import { useLayoutEditor } from '../../composables/useLayoutEditor.js'
import { ADAPT_COMPONENTS } from '../AdaptComponents/index.js'

const MONO_KEYS = new Set(['dim', 'datasourceName', 'ruleName', 'id', 'cell'])
const NAME_KEYS = ['displayName', 'groupName', 'label', 'title']
const SKIP_KEYS = new Set(['component', 'contents'])

const FIELD_TYPE_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }
const GROUP_LABELS = { container: 'Containers', filter: 'Filters', other: 'Other', chart: 'Charts' }
const GROUP_ORDER  = ['container', 'filter', 'other', 'chart']

const props = defineProps({
  item:  { type: Object, required: true },
  path:  { type: Array,  required: true },
  depth: { type: Number, default: 0 },
})

const meta = inject('meta')
const { setValue, deleteNode, addChild } = useLayoutEditor(meta)

const expanded = ref(props.depth < 2)

const nameKey = computed(() => NAME_KEYS.find(k => k in props.item) ?? null)
const displayName = computed(() =>
  (nameKey.value ? props.item[nameKey.value] : null) || props.item.component || '?'
)

const isContainer = computed(() => Array.isArray(props.item.contents))
const fieldKeys   = computed(() =>
  Object.keys(props.item).filter(k => !SKIP_KEYS.has(k) && k !== nameKey.value)
)

function isFlatArray(v) {
  return Array.isArray(v) && v.every(x => x === null || typeof x !== 'object')
}
function isMultiline(v) {
  return Array.isArray(v) || (v !== null && typeof v === 'object')
}

// ── Field edits ───────────────────────────────────────────────────────────────
function setField(key, value)   { setValue([...props.path, key], value) }
function setFieldJson(key, raw) { try { setValue([...props.path, key], JSON.parse(raw)) } catch { /* ignore */ } }
function removeField(key)       { deleteNode([...props.path, key]) }

function removeNode() {
  const hasChildren = isContainer.value && (props.item.contents ?? []).length > 0
  const msg = hasChildren
    ? `Remove "${displayName.value}" and all its children?`
    : `Remove "${displayName.value}"?`
  if (!confirm(msg)) return
  deleteNode(props.path)
}

// ── Inline name edit ──────────────────────────────────────────────────────────
const editingName = ref(false)
const nameDraft   = ref('')
const nameInputEl = ref(null)

async function startEditName() {
  if (!nameKey.value) return
  nameDraft.value   = props.item[nameKey.value] ?? ''
  editingName.value = true
  await nextTick()
  nameInputEl.value?.focus()
}
function commitName() {
  const trimmed = nameDraft.value.trim()
  if (trimmed && nameKey.value) setField(nameKey.value, trimmed)
  editingName.value = false
}

// ── Add field ─────────────────────────────────────────────────────────────────
const showAddField  = ref(false)
const newFieldKey   = ref('')
const newFieldValue = ref('')
const newFieldType  = ref('string')

function commitAddField() {
  const key = newFieldKey.value.trim()
  if (!key) return
  let value
  if (newFieldType.value === 'number')       value = Number(newFieldValue.value)
  else if (newFieldType.value === 'boolean') value = newFieldValue.value === 'true' || newFieldValue.value === '1'
  else if (newFieldType.value === 'array')   value = newFieldValue.value ? newFieldValue.value.split(',').map(s => s.trim()) : []
  else                                       value = newFieldValue.value
  setValue([...props.path, key], value)
  cancelAddField()
}
function cancelAddField() {
  showAddField.value  = false
  newFieldKey.value   = ''
  newFieldValue.value = ''
  newFieldType.value  = 'string'
}

// ── Add child ─────────────────────────────────────────────────────────────────
const showAddChild = ref(false)
const newChildType = ref('')
const newChildName = ref('')

const componentsByGroup = computed(() => {
  const groups = {}
  for (const [key, def] of Object.entries(ADAPT_COMPONENTS)) {
    const g = def.group || 'other'
    if (!groups[g]) groups[g] = []
    groups[g].push({ key, label: def.label || key })
  }
  return GROUP_ORDER.filter(g => groups[g]).map(g => ({ group: g, items: groups[g] }))
})

const selectedChildDef = computed(() => ADAPT_COMPONENTS[newChildType.value] ?? null)

function buildFromDef(type, name) {
  const def = ADAPT_COMPONENTS[type]
  if (!def) return { component: type }
  const config = { component: type }
  for (const field of def.fields ?? []) {
    config[field.key] = field.default !== undefined ? field.default : (FIELD_TYPE_DEFAULTS[field.type] ?? '')
  }
  if (name && def.nameKey) config[def.nameKey] = name
  if (def.container) config.contents = []
  return config
}

function commitAddChild() {
  const type = newChildType.value
  if (!type) return
  if (!Array.isArray(props.item.contents)) setValue([...props.path, 'contents'], [])
  const newIdx = props.item.contents.length
  const config = buildFromDef(type, newChildName.value.trim())
  addChild([...props.path, 'contents'], null, 'object')
  setValue([...props.path, 'contents', newIdx], config)
  expanded.value = true
  cancelAddChild()
}
function cancelAddChild() {
  showAddChild.value = false
  newChildType.value = ''
  newChildName.value = ''
}
</script>

<style scoped>
.cn-node { font-size: 13px; }

/* ── Header ── */
.cn-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}
.depth-0 > .cn-header {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 4px;
  font-weight: 600;
  font-size: 14px;
}
.depth-0 > .cn-header:hover { border-color: #c7d2fe; }
.depth-1 > .cn-header { background: #f9fafb; border: 1px solid #f0f0f0; margin: 2px 0; }
.depth-1 > .cn-header:hover { background: #f0f4ff; }
.depth-2 > .cn-header,
.depth-3 > .cn-header { background: #f9f9f9; padding: 6px 10px; }
.depth-2 > .cn-header:hover,
.depth-3 > .cn-header:hover { background: #eff6ff; }

.cn-arrow { font-size: 9px; color: #9ca3af; transition: transform 0.15s; flex-shrink: 0; }
.cn-arrow.expanded { transform: rotate(90deg); }

.cn-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cn-name[title] { cursor: text; }

.cn-name-input { flex: 1; font-size: inherit; font-weight: inherit; }

.cn-pill {
  font-size: 10px;
  background: #f3f4f6;
  color: #6b7280;
  padding: 2px 7px;
  border-radius: 10px;
  font-family: monospace;
  flex-shrink: 0;
  white-space: nowrap;
}

.cn-del { color: #d1d5db !important; }
.cn-del:hover { color: #dc2626 !important; background: #fee2e2 !important; border-radius: 4px; }

/* ── Body ── */
.cn-body {
  padding-left: 20px;
  border-left: 2px solid #f0f0f0;
  margin-left: 9px;
  margin-bottom: 4px;
  padding-top: 4px;
  padding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── Fields ── */
.cn-fields { display: flex; flex-direction: column; gap: 4px; }

.cn-frow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  background: #fafafa;
  border-radius: 4px;
  padding: 3px 6px;
}
.cn-frow--top { align-items: flex-start; }

.cn-flabel {
  width: 88px;
  flex-shrink: 0;
  color: #6b7280;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

.cn-bool { flex: 1; }

.cn-fremove { color: #d1d5db !important; font-size: 15px; line-height: 1; }
.cn-fremove:hover { color: #dc2626 !important; }

/* ── JSON textarea ── */
.cn-ftextarea--json { background: #1e1e2e !important; color: #cdd6f4 !important; font-size: 10px; font-family: monospace; }

/* ── Add rows ── */
.cn-add-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  border-radius: 6px;
}
.cn-add-row--child { background: #eff6ff; border-color: #bfdbfe; }

.cn-af-sep { color: #6b7280; flex-shrink: 0; font-size: 12px; }
.cn-af-key  { width: 80px !important; flex-shrink: 0 !important; }
.cn-af-flex { flex: 1; min-width: 80px; }
.cn-af-type { width: auto !important; flex-shrink: 0 !important; }
.cn-af-select { max-width: 180px; flex-shrink: 0; }

/* ── Dashed outline buttons ── */
.cn-dashed-btn { border-style: dashed !important; font-size: 11px; }
.cn-dashed-btn.w-100 { font-size: 12px; text-align: left; }

/* ── Children ── */
.cn-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
}
</style>
