<template>
  <div class="ws-node" :class="`depth-${depth}`">

    <!-- === CONTAINER === -->
    <template v-if="isContainer">
      <div class="section-header" :class="[`type-${item.component}`]" @click="expanded = !expanded">
        <span class="toggle-arrow" :class="{ expanded }">▶</span>

        <input
          v-if="editingName"
          ref="nameInput"
          v-model="nameDraft"
          class="name-edit-input"
          @blur="commitName"
          @keyup.enter="commitName"
          @keyup.escape="editingName = false"
          @click.stop
        />
        <span
          v-else
          class="section-name"
          :title="hasDisplayName ? 'Double-click to rename' : ''"
          @dblclick.stop="startEditName"
        >{{ sectionLabel }}</span>

        <span class="component-pill">{{ item.component }}</span>

        <div class="section-toggles" @click.stop>
          <label v-if="'collapsed' in item" class="toggle-label">
            <input type="checkbox" :checked="item.collapsed" @change="setField('collapsed', $event.target.checked)" />
            starts collapsed
          </label>
          <label v-if="'collapsible' in item" class="toggle-label">
            <input type="checkbox" :checked="item.collapsible" @change="setField('collapsible', $event.target.checked)" />
            collapsible
          </label>
          <label v-if="'collapsedByDefault' in item" class="toggle-label">
            <input type="checkbox" :checked="item.collapsedByDefault" @change="setField('collapsedByDefault', $event.target.checked)" />
            collapsed by default
          </label>
          <button class="header-delete-btn" title="Remove section" @click.stop="deleteNode">✕</button>
        </div>
      </div>

      <div v-if="expanded" class="section-children">
        <WorkspaceSection
          v-for="(child, idx) in (item.contents || [])"
          :key="idx"
          :item="child"
          :path="[...path, 'contents', idx]"
          :depth="depth + 1"
        />

        <!-- Add child form -->
        <div v-if="showAddForm" class="add-item-form">
          <div class="add-item-row">
            <select v-model="newItemType" class="add-select" @change="copyFromIdx = null">
              <optgroup label="Containers">
                <option value="LayoutSection">Layout Section</option>
                <option value="AccordionGroup">Accordion Group</option>
                <option value="AggregationAccordion">Aggregation Accordion</option>
              </optgroup>
              <optgroup label="Filters">
                <option value="FlexDropdown">Dropdown Filter</option>
                <option value="ModalSelector">Modal Selector</option>
              </optgroup>
              <optgroup label="Other">
                <option value="ValidationMessage">Validation Message</option>
                <option value="StratificationToggle">Stratification Toggle</option>
                <option value="StratificationDropdown">Stratification Dropdown</option>
              </optgroup>
            </select>
            <input
              v-model="newItemName"
              class="add-input"
              :placeholder="namePlaceholder"
              @keyup.enter="addItem"
              @keyup.escape="cancelAdd"
            />
            <input
              v-if="needsDim && copyFromIdx === null"
              v-model="newItemDim"
              class="add-input add-input--dim"
              placeholder="dimension key"
              @keyup.enter="addItem"
              @keyup.escape="cancelAdd"
            />
            <button class="add-confirm-btn" @click="addItem">Add</button>
            <button class="add-cancel-btn" @click="cancelAdd">✕</button>
          </div>

          <!-- Copy-from-existing row — shown when matching instances exist in the layout -->
          <div v-if="existingInstances.length" class="copy-from-row">
            <span class="copy-from-label">Copy from existing:</span>
            <select v-model="copyFromIdx" class="add-select copy-from-select">
              <option :value="null">— start fresh —</option>
              <option v-for="(inst, i) in existingInstances" :key="i" :value="i">
                {{ inst.label || inst.displayName || inst.groupName || `#${i + 1}` }}
              </option>
            </select>
            <span v-if="copyFromIdx !== null" class="copy-hint">will clone full structure</span>
          </div>
        </div>
        <button v-else class="add-child-btn" @click="showAddForm = true">+ Add item</button>
      </div>
    </template>

    <!-- === LEAF === -->
    <template v-else>
      <div class="leaf-row" :class="`leaf-${item.component}`">
        <button class="leaf-delete-btn" title="Remove" @click.stop="deleteNode">✕</button>

        <template v-if="item.component === 'ValidationMessage'">
          <span class="leaf-badge validation">⚠ Validation</span>
          <div class="leaf-fields">
            <div class="field-row">
              <span class="field-key">Rule name</span>
              <input :value="item.ruleName" class="field-input field-input--mono" @change="setField('ruleName', $event.target.value)" />
            </div>
            <template v-for="key in extraLeafKeys" :key="key"><GenericFieldRow :k="key" :val="item[key]" @set="setField(key, $event)" @remove="setField(key, undefined)" @set-json="setFieldJson(key, $event)" /></template>
          </div>
        </template>

        <template v-else-if="item.component === 'FlexDropdown'">
          <span class="leaf-badge dropdown">⬇ Dropdown</span>
          <div class="leaf-fields">
            <div class="field-row">
              <span class="field-key">Label</span>
              <input :value="item.label" class="field-input" placeholder="(none)" @change="setField('label', $event.target.value)" />
            </div>
            <div class="field-row">
              <span class="field-key">Dimension</span>
              <input :value="item.dim" class="field-input field-input--mono" placeholder="dim key" @change="setField('dim', $event.target.value)" />
            </div>
            <div class="field-row field-row--top">
              <span class="field-key">Options<br /><small>(one per line)</small></span>
              <textarea :value="(item.options || []).join('\n')" class="options-textarea" rows="4" @change="setOptions($event.target.value)" />
            </div>
            <template v-for="key in extraLeafKeys" :key="key"><GenericFieldRow :k="key" :val="item[key]" @set="setField(key, $event)" @remove="setField(key, undefined)" @set-json="setFieldJson(key, $event)" /></template>
          </div>
        </template>

        <template v-else-if="item.component === 'ModalSelector'">
          <span class="leaf-badge modal">◉ Modal Selector</span>
          <div class="leaf-fields">
            <div class="field-row">
              <span class="field-key">Label</span>
              <input :value="item.label" class="field-input" placeholder="(none)" @change="setField('label', $event.target.value)" />
            </div>
            <div class="field-row">
              <span class="field-key">Dimension</span>
              <input :value="item.dim" class="field-input field-input--mono" placeholder="dim key" @change="setField('dim', $event.target.value)" />
            </div>
            <template v-for="key in extraLeafKeys" :key="key"><GenericFieldRow :k="key" :val="item[key]" @set="setField(key, $event)" @remove="setField(key, undefined)" @set-json="setFieldJson(key, $event)" /></template>
          </div>
        </template>

        <template v-else-if="item.component === 'StratificationToggle'">
          <span class="leaf-badge strat">⇄ Strat Toggle</span>
          <div class="leaf-fields">
            <div class="field-row">
              <span class="field-key">Dimension</span>
              <input :value="item.dim" class="field-input field-input--mono" placeholder="dim key" @change="setField('dim', $event.target.value)" />
            </div>
            <div v-if="'hide' in item" class="field-row">
              <span class="field-key">Hide when</span>
              <input :value="item.hide" class="field-input field-input--mono" @change="setField('hide', $event.target.value)" />
            </div>
            <template v-for="key in extraLeafKeys" :key="key"><GenericFieldRow :k="key" :val="item[key]" @set="setField(key, $event)" @remove="setField(key, undefined)" @set-json="setFieldJson(key, $event)" /></template>
          </div>
        </template>

        <template v-else-if="item.component === 'StratificationDropdown'">
          <span class="leaf-badge strat">⬇ Strat Dropdown</span>
          <div class="leaf-fields">
            <div class="field-row">
              <span class="field-key">Display Name</span>
              <input :value="item.displayName" class="field-input" @change="setField('displayName', $event.target.value)" />
            </div>
            <div v-if="'options' in item" class="field-row field-row--top">
              <span class="field-key">Options<br /><small>(one per line)</small></span>
              <textarea :value="(item.options || []).join('\n')" class="options-textarea" rows="3" @change="setOptions($event.target.value)" />
            </div>
            <template v-for="key in extraLeafKeys" :key="key"><GenericFieldRow :k="key" :val="item[key]" @set="setField(key, $event)" @remove="setField(key, undefined)" @set-json="setFieldJson(key, $event)" /></template>
          </div>
        </template>

        <!-- Generic fallback: editable property editor for any unknown component -->
        <template v-else>
          <div class="generic-leaf">
            <div class="generic-leaf-header">
              <span class="leaf-badge generic">{{ item.component || '?' }}</span>
              <span class="unknown-hint">all fields editable</span>
            </div>
            <div class="leaf-fields">
              <template v-for="key in genericLeafKeys" :key="key">
                <GenericFieldRow :k="key" :val="item[key]" @set="setField(key, $event)" @remove="setField(key, undefined)" @set-json="setFieldJson(key, $event)" />
              </template>
            </div>
            <div v-if="showGenericAddField" class="add-generic-field-form">
              <input v-model="genericNewKey" class="add-field-input add-field-input--key" placeholder="key" @keyup.enter="commitGenericField" @keyup.escape="showGenericAddField = false" />
              <span class="add-field-sep">:</span>
              <input v-model="genericNewValue" class="add-field-input" placeholder="value" @keyup.enter="commitGenericField" @keyup.escape="showGenericAddField = false" />
              <select v-model="genericNewType" class="add-field-select">
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">bool</option>
                <option value="array">string[ ]</option>
              </select>
              <button class="add-confirm-btn" style="font-size:11px;padding:3px 10px" @click="commitGenericField">Add</button>
              <button class="add-cancel-btn" @click="showGenericAddField = false">✕</button>
            </div>
            <button v-else class="add-generic-field-btn" @click="showGenericAddField = true">+ Add field</button>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, defineComponent, h } from 'vue'
import { useTemplateStore } from '@/stores/template'

// ── Known keys per component type (everything else → extra fields) ────────────
const KNOWN_KEYS_BY_TYPE = {
  FlexDropdown:          new Set(['component', 'label', 'dim', 'options']),
  ModalSelector:         new Set(['component', 'label', 'dim']),
  StratificationToggle:  new Set(['component', 'dim', 'hide']),
  StratificationDropdown: new Set(['component', 'displayName', 'options', 'dim']),
  ValidationMessage:     new Set(['component', 'ruleName']),
}

const NEEDS_DIM = ['FlexDropdown', 'ModalSelector', 'StratificationToggle', 'StratificationDropdown']
const GENERIC_SKIP_KEYS = new Set(['component'])

// ── GenericFieldRow: inline renderless sub-component ─────────────────────────
// Renders one field row: detects type (array/bool/object/number/string) and
// emits set(value), remove(), set-json(raw) back to the parent.
const GenericFieldRow = defineComponent({
  props: { k: String, val: {} },
  emits: ['set', 'remove', 'set-json'],
  setup(props, { emit }) {
    return () => {
      const { k, val } = props
      const isArr  = Array.isArray(val) && val.every(v => typeof v !== 'object')
      const isBool = !isArr && typeof val === 'boolean'
      const isObj  = !isArr && !isBool && val !== null && typeof val === 'object'
      const isNum  = !isArr && !isBool && !isObj && typeof val === 'number'

      const label = h('span', { class: 'field-key extra-key', title: k }, k)
      const removeBtn = h('button', {
        class: 'remove-field-btn',
        title: 'Remove field',
        onClick: () => emit('remove'),
      }, '×')

      if (isArr) {
        return h('div', { class: 'field-row field-row--top field-row--extra' }, [
          h('span', { class: 'field-key extra-key', title: k }, [k, h('br'), h('small', '(one per line)')]),
          h('textarea', {
            value: val.join('\n'),
            class: 'options-textarea',
            rows: 3,
            onChange: (e) => emit('set', e.target.value.split('\n').map(s => s.trim()).filter(Boolean)),
          }),
          removeBtn,
        ])
      }
      if (isBool) {
        return h('div', { class: 'field-row field-row--extra' }, [
          h('label', { class: 'field-key extra-key toggle-label', title: k }, [
            h('input', { type: 'checkbox', checked: val, onChange: (e) => emit('set', e.target.checked) }),
            ' ' + k,
          ]),
          removeBtn,
        ])
      }
      if (isObj) {
        return h('div', { class: 'field-row field-row--top field-row--extra' }, [
          h('span', { class: 'field-key extra-key', title: k }, [k, h('br'), h('small', '(JSON)')]),
          h('textarea', {
            value: JSON.stringify(val, null, 2),
            class: 'options-textarea options-textarea--json',
            rows: 3,
            onChange: (e) => emit('set-json', e.target.value),
          }),
          removeBtn,
        ])
      }
      return h('div', { class: 'field-row field-row--extra' }, [
        label,
        h('input', {
          value: String(val ?? ''),
          class: ['field-input', isNum ? '' : (k === 'dim' || k === 'datasourceName' ? 'field-input--mono' : '')].join(' '),
          type: isNum ? 'number' : 'text',
          onChange: (e) => emit('set', isNum ? Number(e.target.value) : e.target.value),
        }),
        removeBtn,
      ])
    }
  },
})

// ── Deep walk: find all objects with component === type ───────────────────────
function findComponentInstances(node, type, results = []) {
  if (!node || typeof node !== 'object') return results
  if (Array.isArray(node)) {
    node.forEach(child => findComponentInstances(child, type, results))
  } else {
    if (node.component === type) results.push(node)
    Object.values(node).forEach(val => findComponentInstances(val, type, results))
  }
  return results
}

// ── Props / store ─────────────────────────────────────────────────────────────
const props = defineProps({
  item:  { type: Object, required: true },
  path:  { type: Array,  required: true },
  depth: { type: Number, default: 0 },
})

const store = useTemplateStore()

const expanded    = ref(props.depth < 2)
const editingName = ref(false)
const nameDraft   = ref('')
const nameInput   = ref(null)

// Container add-item form
const showAddForm = ref(false)
const newItemType = ref('LayoutSection')
const newItemName = ref('')
const newItemDim  = ref('')
const copyFromIdx = ref(null)   // index into existingInstances; null = start fresh

// Generic-leaf add-field form
const showGenericAddField = ref(false)
const genericNewKey   = ref('')
const genericNewValue = ref('')
const genericNewType  = ref('string')

// ── Computed ──────────────────────────────────────────────────────────────────
// Container = any object that has a `contents` array (no hardcoded type list)
const isContainer = computed(() =>
  props.item !== null &&
  typeof props.item === 'object' &&
  Array.isArray(props.item.contents)
)

const sectionLabel = computed(() =>
  props.item.displayName || props.item.groupName || props.item.title || props.item.component || '?'
)
const hasDisplayName = computed(() =>
  'displayName' in props.item || 'groupName' in props.item
)

// Keys on this leaf that aren't handled by the specific renderer
const extraLeafKeys = computed(() => {
  const known = KNOWN_KEYS_BY_TYPE[props.item.component]
  if (!known) return []
  return Object.keys(props.item).filter(k => !known.has(k))
})

// All keys for the generic fallback renderer
const genericLeafKeys = computed(() =>
  Object.keys(props.item).filter(k => !GENERIC_SKIP_KEYS.has(k))
)

const needsDim = computed(() => NEEDS_DIM.includes(newItemType.value))
const namePlaceholder = computed(() => {
  if (['FlexDropdown', 'ModalSelector'].includes(newItemType.value)) return 'label'
  if (newItemType.value === 'ValidationMessage') return 'rule name'
  return 'display name'
})

// All existing instances of the selected type anywhere in the layout
const existingInstances = computed(() => {
  if (!store.template?.layout) return []
  return findComponentInstances(store.template.layout, newItemType.value)
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function deleteNode() {
  const label = sectionLabel.value || props.item.component || 'this item'
  const hasChildren = isContainer.value && (props.item.contents ?? []).length > 0
  const msg = hasChildren
    ? `Remove "${label}" and all its children?`
    : `Remove "${label}"?`
  if (!confirm(msg)) return
  store.deleteNode(props.path)
}

function setField(key, value) {
  if (value === undefined) {
    store.deleteNode([...props.path, key])
  } else {
    store.setValue([...props.path, key], value)
  }
}

function setFieldJson(key, raw) {
  try { store.setValue([...props.path, key], JSON.parse(raw)) } catch { /* ignore parse errors */ }
}

function setOptions(text) {
  setField('options', text.split('\n').map(s => s.trim()).filter(Boolean))
}

async function startEditName() {
  if (!hasDisplayName.value) return
  nameDraft.value = props.item.displayName ?? props.item.groupName ?? ''
  editingName.value = true
  await nextTick()
  nameInput.value?.focus()
}

function commitName() {
  const trimmed = nameDraft.value.trim()
  if (trimmed) {
    const key = 'displayName' in props.item ? 'displayName' : 'groupName'
    setField(key, trimmed)
  }
  editingName.value = false
}

function buildNewItem(type, name, dim) {
  const label = name.trim() || 'New Item'
  const d = dim.trim()
  const templates = {
    LayoutSection:          { component: 'LayoutSection',    displayName: label,  collapsed: false, collapsible: true, contents: [] },
    AccordionGroup:         { component: 'AccordionGroup',   groupName: label,    collapsedByDefault: false, contents: [] },
    AggregationAccordion:   { component: 'AggregationAccordion', displayName: label, contents: [] },
    FlexDropdown:           { component: 'FlexDropdown',     label,               dim: d, options: [] },
    ModalSelector:          { component: 'ModalSelector',    label,               dim: d },
    ValidationMessage:      { component: 'ValidationMessage', ruleName: name.trim() || '' },
    StratificationToggle:   { component: 'StratificationToggle',    dim: d },
    StratificationDropdown: { component: 'StratificationDropdown',  displayName: label, dim: d, options: [] },
  }
  return templates[type] ?? { component: type }
}

function addItem() {
  const contentsPath = [...props.path, 'contents']
  const newIdx = (props.item.contents ?? []).length

  let config
  const existing = existingInstances.value
  if (copyFromIdx.value !== null && existing[copyFromIdx.value]) {
    // Clone full structure from existing instance, then override the name/label if the user typed one
    config = JSON.parse(JSON.stringify(existing[copyFromIdx.value]))
    const label = newItemName.value.trim()
    if (label) {
      if ('label' in config)       config.label = label
      else if ('displayName' in config) config.displayName = label
      else if ('groupName' in config)   config.groupName = label
    }
  } else {
    config = buildNewItem(newItemType.value, newItemName.value, newItemDim.value)
  }

  store.addChild(contentsPath, null, 'object')
  store.setValue([...contentsPath, newIdx], config)
  expanded.value = true
  cancelAdd()
}

function cancelAdd() {
  showAddForm.value = false
  newItemType.value = 'LayoutSection'
  newItemName.value = ''
  newItemDim.value  = ''
  copyFromIdx.value = null
}

function commitGenericField() {
  const key = genericNewKey.value.trim()
  if (!key) return
  let value
  if (genericNewType.value === 'number')       value = Number(genericNewValue.value)
  else if (genericNewType.value === 'boolean') value = genericNewValue.value === 'true' || genericNewValue.value === '1'
  else if (genericNewType.value === 'array')   value = genericNewValue.value ? genericNewValue.value.split(',').map(s => s.trim()) : []
  else value = genericNewValue.value
  setField(key, value)
  showGenericAddField.value = false
  genericNewKey.value = ''
  genericNewValue.value = ''
  genericNewType.value = 'string'
}
</script>

<style scoped>
.ws-node { font-size: 13px; }

/* ── Section headers ── */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
}
.depth-0 > .section-header {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 4px;
  font-weight: 600;
  font-size: 14px;
}
.depth-0 > .section-header:hover { border-color: #c7d2fe; }
.depth-1 > .section-header { background: #f9fafb; border: 1px solid #f0f0f0; margin: 2px 0; }
.depth-1 > .section-header:hover { background: #f0f4ff; }
.depth-2 > .section-header,
.depth-3 > .section-header { background: #f9f9f9; padding: 7px 10px; }
.depth-2 > .section-header:hover,
.depth-3 > .section-header:hover { background: #eff6ff; }

.toggle-arrow { font-size: 9px; color: #9ca3af; transition: transform 0.15s; flex-shrink: 0; }
.toggle-arrow.expanded { transform: rotate(90deg); }

.section-name { flex: 1; min-width: 0; }
.section-name[title] { cursor: text; }

.name-edit-input {
  flex: 1;
  border: 1px solid #6366f1;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: inherit;
  font-weight: inherit;
  background: #fff;
}

.component-pill {
  font-size: 10px;
  background: #f3f4f6;
  color: #6b7280;
  padding: 2px 7px;
  border-radius: 10px;
  font-family: monospace;
  flex-shrink: 0;
}

.section-toggles { display: flex; gap: 12px; flex-shrink: 0; }
.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 400;
  cursor: pointer;
}

/* ── Children ── */
.section-children {
  padding-left: 20px;
  border-left: 2px solid #f0f0f0;
  margin-left: 9px;
  margin-bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
  padding-bottom: 4px;
}

/* ── Add item form ── */
.add-child-btn {
  align-self: flex-start;
  background: none;
  border: 1px dashed #d1d5db;
  color: #9ca3af;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-top: 2px;
  width: 100%;
  text-align: left;
  transition: all 0.15s;
}
.add-child-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

.add-item-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  border-radius: 6px;
  margin-top: 2px;
}
.add-item-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }

.copy-from-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #ddd6fe;
}
.copy-from-label { font-size: 11px; color: #7c3aed; white-space: nowrap; flex-shrink: 0; }
.copy-from-select { font-size: 11px; }
.copy-hint { font-size: 10px; color: #7c3aed; font-style: italic; }

.add-select {
  border: 1px solid #d1d5db;
  border-radius: 5px;
  padding: 4px 6px;
  font-size: 12px;
  background: #fff;
  cursor: pointer;
}

.add-input {
  border: 1px solid #d1d5db;
  border-radius: 5px;
  padding: 4px 8px;
  font-size: 12px;
  background: #fff;
  min-width: 130px;
  flex: 1;
}
.add-input--dim { min-width: 110px; flex: 0 0 auto; font-family: monospace; }
.add-input:focus { border-color: #6366f1; outline: none; }

.add-confirm-btn {
  background: #4f46e5;
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 5px;
  flex-shrink: 0;
}
.add-confirm-btn:hover { background: #4338ca; }

.add-cancel-btn {
  background: none;
  color: #9ca3af;
  font-size: 14px;
  padding: 2px 6px;
}
.add-cancel-btn:hover { color: #374151; }

/* ── Leaf ── */
.leaf-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #f3f4f6;
}
.leaf-row:hover { border-color: #e5e7eb; }

.leaf-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 1px;
}
.leaf-badge.validation { background: #fef3c7; color: #92400e; }
.leaf-badge.dropdown   { background: #ede9fe; color: #5b21b6; }
.leaf-badge.modal      { background: #d1fae5; color: #065f46; }
.leaf-badge.strat      { background: #dbeafe; color: #1e40af; }
.leaf-badge.generic    { background: #f3f4f6; color: #374151; font-family: monospace; }

.leaf-detail { font-size: 12px; color: #6b7280; }
.leaf-fields { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }

.field-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.field-row--top { align-items: flex-start; }
.field-row--extra { background: #fafafa; border-radius: 4px; padding: 2px 4px; }

.field-key { color: #6b7280; width: 90px; flex-shrink: 0; font-size: 11px; line-height: 1.4; }
.extra-key { color: #7c3aed; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.field-input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 3px 7px;
  font-size: 12px;
  background: #fff;
}
.field-input:focus { border-color: #6366f1; }
.field-input--mono { font-family: monospace; font-size: 11px; }
.field-code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #374151; }

.options-textarea {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 5px 7px;
  font-size: 11px;
  font-family: monospace;
  resize: vertical;
  background: #fff;
  min-height: 56px;
}
.options-textarea:focus { border-color: #6366f1; }
.options-textarea--json { font-family: monospace; font-size: 10px; background: #1e1e2e; color: #cdd6f4; }

.field-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tag { background: #f3f4f6; padding: 1px 6px; border-radius: 10px; font-size: 10px; color: #374151; }

.remove-field-btn {
  background: none;
  color: #d1d5db;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
}
.remove-field-btn:hover { color: #dc2626; }

/* ── Generic leaf fallback ── */
.generic-leaf { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
.generic-leaf-header { display: flex; align-items: center; gap: 8px; }
.unknown-hint { font-size: 10px; color: #9ca3af; font-style: italic; }

.add-generic-field-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  background: #f9f9ff;
  border: 1px dashed #c4b5fd;
  border-radius: 6px;
}
.add-field-input {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 3px 7px;
  font-size: 11px;
  background: #fff;
  min-width: 0;
  flex: 1;
}
.add-field-input--key { max-width: 80px; flex: 0 0 auto; font-family: monospace; }
.add-field-input:focus { border-color: #6366f1; outline: none; }
.add-field-sep { color: #6b7280; flex-shrink: 0; }
.add-field-select {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 11px;
  background: #fff;
  flex-shrink: 0;
  cursor: pointer;
}
.add-generic-field-btn {
  align-self: flex-start;
  background: none;
  border: 1px dashed #e5e7eb;
  color: #9ca3af;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  width: 100%;
  text-align: left;
}
.add-generic-field-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

/* Delete buttons */
.header-delete-btn {
  width: 22px;
  height: 22px;
  background: none;
  color: #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 4px;
}
.header-delete-btn:hover { background: #fee2e2; color: #dc2626; }

.leaf-row { position: relative; }
.leaf-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  background: none;
  color: #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.1s, background 0.1s, color 0.1s;
}
.leaf-row:hover .leaf-delete-btn { opacity: 1; }
.leaf-delete-btn:hover { background: #fee2e2; color: #dc2626; }
</style>
