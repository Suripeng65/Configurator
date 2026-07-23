<template>
  <div class="cn-node" :class="`depth-${depth}`">

    <!-- Header -->
    <div class="cn-header" @click="expanded = !expanded">
      <span class="cn-arrow" :class="{ expanded }">▶</span>

      <input
        v-if="editingName"
        ref="nameInputEl"
        v-model="nameDraft"
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

      <button class="cn-del" title="Remove" @click.stop="removeNode">✕</button>
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
          <label v-if="typeof item[key] === 'boolean'" class="cn-bool">
            <input type="checkbox" :checked="item[key]" @change="setField(key, $event.target.checked)" />
            {{ item[key] ? 'true' : 'false' }}
          </label>

          <!-- number -->
          <input
            v-else-if="typeof item[key] === 'number'"
            type="number"
            class="cn-finput"
            :value="item[key]"
            @change="setField(key, Number($event.target.value))"
          />

          <!-- flat array (strings / numbers) -->
          <textarea
            v-else-if="isFlatArray(item[key])"
            class="cn-ftextarea"
            :value="item[key].join('\n')"
            rows="3"
            @change="setField(key, $event.target.value.split('\n').map(s => s.trim()).filter(Boolean))"
          />

          <!-- object or array-of-objects → JSON -->
          <textarea
            v-else-if="item[key] !== null && typeof item[key] === 'object'"
            class="cn-ftextarea cn-ftextarea--json"
            :value="JSON.stringify(item[key], null, 2)"
            rows="3"
            @change="setFieldJson(key, $event.target.value)"
          />

          <!-- string (default) -->
          <input
            v-else
            class="cn-finput"
            :class="{ 'cn-finput--mono': MONO_KEYS.has(key) }"
            :value="item[key] ?? ''"
            @change="setField(key, $event.target.value)"
          />

          <button class="cn-fremove" title="Remove field" @click="removeField(key)">×</button>
        </div>
      </div>

      <!-- Add field form -->
      <div v-if="showAddField" class="cn-add-row">
        <input
          v-model="newFieldKey"
          class="cn-af-key"
          placeholder="key"
          @keyup.enter="commitAddField"
          @keyup.escape="cancelAddField"
        />
        <span class="cn-af-sep">:</span>
        <input
          v-model="newFieldValue"
          class="cn-af-val"
          placeholder="value"
          @keyup.enter="commitAddField"
          @keyup.escape="cancelAddField"
        />
        <select v-model="newFieldType" class="cn-af-type">
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">bool</option>
          <option value="array">string[]</option>
        </select>
        <button class="cn-ok" @click="commitAddField">Add</button>
        <button class="cn-cancel" @click="cancelAddField">✕</button>
      </div>
      <button v-else class="cn-add-field-btn" @click="showAddField = true">+ field</button>

      <!-- Recursive children -->
      <div v-if="isContainer" class="cn-children">
        <ComponentNode
          v-for="(child, idx) in (item.contents || [])"
          :key="idx"
          :item="child"
          :path="[...path, 'contents', idx]"
          :depth="depth + 1"
        />

        <div v-if="showAddChild" class="cn-add-row cn-add-row--child">
          <select v-model="newChildType" class="cn-af-select">
            <option value="" disabled>Select component...</option>
            <optgroup v-for="g in componentsByGroup" :key="g.group" :label="GROUP_LABELS[g.group]">
              <option v-for="c in g.items" :key="c.key" :value="c.key">{{ c.label }}</option>
            </optgroup>
          </select>
          <input
            v-if="selectedChildDef?.nameKey"
            v-model="newChildName"
            class="cn-af-val"
            :placeholder="selectedChildDef.nameKey"
            @keyup.enter="commitAddChild"
            @keyup.escape="cancelAddChild"
          />
          <button class="cn-ok" :disabled="!newChildType" @click="commitAddChild">Add</button>
          <button class="cn-cancel" @click="cancelAddChild">✕</button>
        </div>
        <button v-else class="cn-add-child-btn" @click="showAddChild = true">+ Add child</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, inject } from 'vue'
import { useLayoutEditor } from '../../composables/useLayoutEditor.js'
import { ADAPT_COMPONENTS } from '../AdaptComponents/index.js'

// Keys whose values should render in a monospace input
const MONO_KEYS = new Set(['dim', 'datasourceName', 'ruleName', 'id', 'cell'])
// Priority order for picking the "display name" key
const NAME_KEYS = ['displayName', 'groupName', 'label', 'title']
// Keys rendered structurally, not as editable fields
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

// ── Expand / collapse ─────────────────────────────────────────────────────────
const expanded = ref(props.depth < 2)

// ── Name ──────────────────────────────────────────────────────────────────────
const nameKey = computed(() => NAME_KEYS.find(k => k in props.item) ?? null)
const displayName = computed(() =>
  (nameKey.value ? props.item[nameKey.value] : null) || props.item.component || '?'
)

// ── Field list ────────────────────────────────────────────────────────────────
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
  const newIdx = (props.item.contents ?? []).length
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

.cn-name-input {
  flex: 1;
  border: 1px solid #6366f1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: inherit;
  font-weight: inherit;
  background: #fff;
  outline: none;
}

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

.cn-del {
  width: 20px;
  height: 20px;
  background: none;
  color: #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
}
.cn-del:hover { background: #fee2e2; color: #dc2626; }

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

.cn-bool { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #374151; flex: 1; }

.cn-finput {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 12px;
  background: #fff;
  min-width: 0;
}
.cn-finput:focus { border-color: #6366f1; outline: none; }
.cn-finput--mono { font-family: monospace; font-size: 11px; }

.cn-ftextarea {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 11px;
  font-family: monospace;
  resize: vertical;
  background: #fff;
  min-height: 52px;
  min-width: 0;
}
.cn-ftextarea:focus { border-color: #6366f1; outline: none; }
.cn-ftextarea--json { background: #1e1e2e; color: #cdd6f4; font-size: 10px; }

.cn-fremove {
  background: none;
  color: #d1d5db;
  font-size: 15px;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}
.cn-fremove:hover { color: #dc2626; }

/* ── Add field / child inline rows ── */
.cn-add-field-btn {
  align-self: flex-start;
  background: none;
  border: 1px dashed #e5e7eb;
  color: #9ca3af;
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
  transition: all 0.12s;
}
.cn-add-field-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

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

.cn-af-select {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
  max-width: 180px;
}
.cn-af-select:focus { border-color: #6366f1; outline: none; }

.cn-af-key {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
  background: #fff;
  font-family: monospace;
  width: 80px;
  flex-shrink: 0;
}
.cn-af-key--wide { width: 160px; }
.cn-af-key:focus { border-color: #6366f1; outline: none; }

.cn-af-sep { color: #6b7280; flex-shrink: 0; font-size: 12px; }

.cn-af-val {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
  background: #fff;
  flex: 1;
  min-width: 80px;
}
.cn-af-val:focus { border-color: #6366f1; outline: none; }

.cn-af-type {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 11px;
  background: #fff;
  flex-shrink: 0;
  cursor: pointer;
}

.cn-ok {
  background: #4f46e5;
  color: #fff;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 4px;
  flex-shrink: 0;
}
.cn-ok:hover { background: #4338ca; }

.cn-cancel {
  background: none;
  color: #9ca3af;
  font-size: 13px;
  padding: 2px 5px;
}
.cn-cancel:hover { color: #374151; }

/* ── Children ── */
.cn-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
}

.cn-add-child-btn {
  align-self: flex-start;
  background: none;
  border: 1px dashed #d1d5db;
  color: #9ca3af;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  width: 100%;
  text-align: left;
  transition: all 0.12s;
}
.cn-add-child-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }
</style>
