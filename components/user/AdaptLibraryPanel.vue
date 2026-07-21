<template>
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">Adapt Library Components</h2>
      <p class="panel-subtitle">
        Define reusable component types. Use them in Visualization Tabs and Monitor Parameters.
      </p>
    </div>

    <!-- Empty state (only shown if all components are deleted) -->
    <div v-if="!componentNames.length" class="empty-state">
      <div class="empty-icon">🧩</div>
      <p>No components defined.</p>
      <button class="seed-cta-btn" @click="openAdd">+ Create a component</button>
    </div>

    <div v-else class="panel-body">

      <!-- Left: component list -->
      <aside class="comp-list">
        <div class="list-label">Components</div>

        <button
          v-for="name in componentNames"
          :key="name"
          :class="['comp-item', { active: selected === name }]"
          @click="selected = name"
        >
          <span class="comp-name">{{ name }}</span>
          <span class="comp-sub">{{ adaptLibrary[name]?.label }}</span>
        </button>

        <button class="add-comp-btn" @click="openAdd">+ New Component</button>
      </aside>

      <!-- Right: editor -->
      <div class="comp-editor" v-if="selected && currentDef">

        <div class="editor-block">
          <label class="block-label">Component Name</label>
          <code class="comp-key">{{ selected }}</code>
        </div>

        <div class="editor-block">
          <label class="block-label">Display Label</label>
          <input
            :value="currentDef.label"
            class="text-input"
            placeholder="e.g. Bar Chart"
            @change="setLabel($event.target.value)"
          />
        </div>

        <div class="editor-block">
          <div class="block-header">
            <label class="block-label">Config Fields</label>
            <button class="add-field-btn" @click="addField">+ Add Field</button>
          </div>
          <p class="block-hint">
            Fields available for each instance of this component.
            <code>datasource</code> type renders a dropdown of tab datasource names at use time.
          </p>

          <div class="fields-table" v-if="currentDef.fields?.length">
            <div class="fields-head">
              <span>Key</span><span>Type</span><span>Default</span><span></span>
            </div>
            <div
              v-for="(f, i) in currentDef.fields"
              :key="i"
              class="field-row"
              :class="{ 'field-row--ds': f.type === 'datasource' }"
            >
              <input
                :value="f.key"
                class="field-key-input"
                placeholder="fieldName"
                @change="setFieldProp(i, 'key', $event.target.value)"
              />
              <select
                :value="f.type"
                class="field-type-select"
                @change="setFieldProp(i, 'type', $event.target.value)"
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="array">array</option>
                <option value="object">object</option>
                <option value="datasource">datasource ↗</option>
              </select>
              <div class="field-default-cell">
                <input
                  v-if="f.type === 'number'"
                  type="number"
                  :value="f.default ?? 0"
                  class="field-default-input"
                  @change="setFieldProp(i, 'default', Number($event.target.value))"
                />
                <input
                  v-else-if="f.type === 'boolean'"
                  type="checkbox"
                  :checked="f.default ?? false"
                  class="field-default-check"
                  @change="setFieldProp(i, 'default', $event.target.checked)"
                />
                <input
                  v-else-if="f.type === 'string' || f.type === 'datasource'"
                  type="text"
                  :value="f.default ?? ''"
                  class="field-default-input"
                  placeholder="—"
                  @change="setFieldProp(i, 'default', $event.target.value)"
                />
                <span v-else class="field-default-na">—</span>
              </div>
              <button class="remove-field-btn" @click="removeField(i)" title="Remove field">✕</button>
            </div>
          </div>

          <div v-else class="fields-empty">No fields defined. Add one above.</div>

          <!-- datasource names hint -->
          <div v-if="hasDatasourceField && availableDatasources.length" class="ds-hint">
            <span class="ds-hint-label">Available datasource names in this template:</span>
            <span v-for="n in availableDatasources" :key="n" class="ds-chip">{{ n }}</span>
          </div>
        </div>

        <div class="editor-footer">
          <button class="delete-btn" @click="deleteComponent">Delete Component</button>
        </div>
      </div>

      <div class="editor-placeholder" v-else>
        <div class="placeholder-inner">
          <div class="placeholder-icon">🧩</div>
          <p>Select a component to edit<br />or create a new one.</p>
        </div>
      </div>

    </div>

    <!-- New component modal -->
    <BModal
      v-model="showAdd"
      title="New Component"
      ok-title="Create"
      ok-variant="primary"
      cancel-variant="outline-secondary"
      @ok.prevent="confirmAdd"
    >
      <div class="modal-fields">
        <div class="modal-row">
          <label>Component Name <span class="hint">(no spaces, e.g. BarChart)</span></label>
          <BFormInput v-model="newName" placeholder="MyComponent" @keyup.enter="confirmAdd" />
        </div>
        <div class="modal-row">
          <label>Display Label</label>
          <BFormInput v-model="newLabel" placeholder="e.g. My Component" @keyup.enter="confirmAdd" />
        </div>
        <p v-if="addError" class="add-error">{{ addError }}</p>
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTemplateStore } from '@src/stores/template'
import { BModal, BFormInput } from 'bootstrap-vue-next'
import { ADAPT_COMPONENTS } from '../AdaptComponents/index.js'

const store = useTemplateStore()

const selected = ref(null)
const showAdd  = ref(false)
const newName  = ref('')
const newLabel = ref('')
const addError = ref('')

// ── Computed ──────────────────────────────────────────────────────────────────

const adaptLibrary   = computed(() => store.template?.layout?.adaptLibrary ?? {})
const componentNames = computed(() => Object.keys(adaptLibrary.value))
const currentDef     = computed(() => selected.value ? adaptLibrary.value[selected.value] ?? null : null)

const hasDatasourceField = computed(() =>
  currentDef.value?.fields?.some(f => f.type === 'datasource') ?? false
)

const availableDatasources = computed(() => {
  const mainPanel = store.template?.layout?.viz?.['main-panel'] ?? {}
  const tabArray  = mainPanel['tab-array'] ?? []
  const names = new Set()
  for (const tabKey of tabArray) {
    for (const ds of mainPanel[tabKey]?.datasources ?? []) {
      if (ds.name) names.add(ds.name)
    }
  }
  for (const ds of mainPanel.datasources ?? []) {
    if (ds.name) names.add(ds.name)
  }
  return [...names]
})

// Seed defaults when template loads
onMounted(() => { if (store.template?.layout) seedBuiltins() })
watch(() => store.template?.layout, (layout) => { if (layout) seedBuiltins() })

// ── Actions ───────────────────────────────────────────────────────────────────

function seedBuiltins() {
  if (!store.template?.layout) return
  if (!store.template.layout.adaptLibrary) {
    store.setValue(['adaptLibrary'], {})
  }
  for (const [name, def] of Object.entries(ADAPT_COMPONENTS)) {
    if (!adaptLibrary.value[name]) {
      store.setValue(['adaptLibrary', name], {
        label: def.label,
        fields: def.fields.map(f => ({ ...f })),
      })
    }
  }
  if (!selected.value) selected.value = componentNames.value[0] ?? null
}

function openAdd() {
  newName.value  = ''
  newLabel.value = ''
  addError.value = ''
  showAdd.value  = true
}

function confirmAdd() {
  const name  = newName.value.trim()
  const label = newLabel.value.trim() || name
  if (!name)                    { addError.value = 'Component name is required.'; return }
  if (/\s/.test(name))          { addError.value = 'Name cannot contain spaces.'; return }
  if (adaptLibrary.value[name]) { addError.value = `"${name}" already exists.`; return }

  if (!store.template?.layout?.adaptLibrary) {
    store.setValue(['adaptLibrary'], {})
  }
  store.setValue(['adaptLibrary', name], { label, fields: [] })
  selected.value = name
  showAdd.value  = false
}

function setLabel(label) {
  store.setValue(['adaptLibrary', selected.value, 'label'], label)
}

const TYPE_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }

function propagateFieldToUsages(componentName, field) {
  const mainPanel = store.template?.layout?.viz?.['main-panel'] ?? {}
  const tabArray = mainPanel['tab-array'] ?? []
  for (const tabKey of tabArray) {
    const tab = mainPanel[tabKey]
    if (!tab?.contents) continue
    const gcIndex = tab.contents.findIndex(c => c.component === 'GridContainer')
    if (gcIndex < 0) continue
    const cells = tab.contents[gcIndex].contents ?? []
    for (let ci = 0; ci < cells.length; ci++) {
      const cell = cells[ci]
      if (cell.component !== componentName) continue
      if (cell[field.key] !== undefined) continue
      const defaultVal = field.default !== undefined ? field.default : (TYPE_DEFAULTS[field.type] ?? '')
      store.setValue(['viz', 'main-panel', tabKey, 'contents', gcIndex, 'contents', ci, field.key], defaultVal)
    }
  }
}

function addField() {
  const fields = [...(currentDef.value.fields ?? [])]
  const newField = { key: `field${fields.length + 1}`, type: 'string' }
  fields.push(newField)
  store.setValue(['adaptLibrary', selected.value, 'fields'], fields)
  propagateFieldToUsages(selected.value, newField)
}

function setFieldProp(i, prop, value) {
  const fields = (currentDef.value.fields ?? []).map((f, idx) =>
    idx === i ? { ...f, [prop]: value } : f
  )
  store.setValue(['adaptLibrary', selected.value, 'fields'], fields)
}

function removeField(i) {
  const fields = (currentDef.value.fields ?? []).filter((_, idx) => idx !== i)
  store.setValue(['adaptLibrary', selected.value, 'fields'], fields)
}

function deleteComponent() {
  if (!confirm(`Delete component "${selected.value}"?`)) return
  store.deleteNode(['adaptLibrary', selected.value])
  selected.value = null
}
</script>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.panel-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: #fff;
}
.panel-title    { font-size: 17px; font-weight: 700; color: #111; margin: 0 0 4px; }
.panel-subtitle { font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5; }

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #6b7280;
  padding: 40px;
}
.empty-icon { font-size: 40px; }
.empty-state p { font-size: 13px; margin: 0; }

.seed-cta-btn {
  background: #4f46e5;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 20px;
  border-radius: 7px;
}
.seed-cta-btn:hover { background: #4338ca; }

/* Body */
.panel-body { display: flex; flex: 1; overflow: hidden; }

/* ── Component list ── */
.comp-list {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 10px 8px;
  overflow-y: auto;
  background: #fff;
}

.list-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  padding: 0 6px 8px;
}

.comp-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 7px 10px;
  border-radius: 6px;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}
.comp-item:hover:not(.active) { background: #f3f4f6; }
.comp-item.active { background: #eff6ff; }

.comp-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  font-family: monospace;
}
.comp-item.active .comp-name { color: #1d4ed8; }

.comp-sub { font-size: 11px; color: #9ca3af; }

.add-comp-btn {
  margin-top: 8px;
  font-size: 12px;
  color: #4f46e5;
  background: none;
  text-align: left;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px dashed #c4b5fd;
  width: 100%;
}
.add-comp-btn:hover { background: #f5f3ff; }

/* ── Editor ── */
.comp-editor {
  flex: 1;
  overflow-y: auto;
  padding: 22px 26px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-block { display: flex; flex-direction: column; gap: 6px; }

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.block-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.block-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
}
.block-hint code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: 11px; font-family: monospace; }

.comp-key {
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 5px;
}

.text-input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 13px;
  max-width: 320px;
  background: #fff;
}
.text-input:focus { border-color: #6366f1; outline: none; }

.add-field-btn {
  font-size: 12px;
  color: #4f46e5;
  background: none;
  padding: 4px 10px;
  border: 1px solid #c4b5fd;
  border-radius: 5px;
}
.add-field-btn:hover { background: #f5f3ff; }

/* Fields table */
.fields-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  max-width: 600px;
}

.fields-head {
  display: grid;
  grid-template-columns: 1fr 120px 100px 32px;
  background: #f3f4f6;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 120px 100px 32px;
  border-top: 1px solid #f0f0f0;
  padding: 4px 6px;
  align-items: center;
  background: #fff;
}
.field-row--ds { background: #faf5ff; }

.field-key-input {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 12px;
  font-family: monospace;
  width: 100%;
  background: transparent;
}
.field-key-input:hover { border-color: #d1d5db; background: #fff; }
.field-key-input:focus { border-color: #6366f1; background: #fff; outline: none; }

.field-type-select {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 5px 6px;
  font-size: 12px;
  background: transparent;
  color: #374151;
  cursor: pointer;
  width: 100%;
}
.field-type-select:hover { border-color: #d1d5db; background: #fff; }
.field-type-select:focus { border-color: #6366f1; outline: none; background: #fff; }
.field-row--ds .field-type-select { color: #7c3aed; }

.field-default-cell { display: flex; align-items: center; padding: 0 4px; }
.field-default-input {
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 5px 6px;
  font-size: 12px;
  width: 100%;
  background: transparent;
}
.field-default-input:hover { border-color: #d1d5db; background: #fff; }
.field-default-input:focus { border-color: #6366f1; background: #fff; outline: none; }
.field-default-check { width: 14px; height: 14px; cursor: pointer; accent-color: #4f46e5; }
.field-default-na { font-size: 12px; color: #d1d5db; padding: 0 4px; }

.remove-field-btn {
  background: none;
  color: #d1d5db;
  font-size: 12px;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-field-btn:hover { background: #fee2e2; color: #dc2626; }

.fields-empty {
  font-size: 12px;
  color: #9ca3af;
  padding: 20px;
  text-align: center;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  max-width: 600px;
}

/* Datasource hint */
.ds-hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 6px;
  max-width: 600px;
}
.ds-hint-label { font-size: 11px; color: #7c3aed; font-weight: 600; }
.ds-chip {
  font-family: monospace;
  font-size: 11px;
  background: #ede9fe;
  color: #5b21b6;
  padding: 2px 7px;
  border-radius: 10px;
}

.editor-footer { padding-top: 8px; border-top: 1px solid #f0f0f0; }

.delete-btn {
  background: none;
  color: #dc2626;
  font-size: 12px;
  padding: 6px 12px;
  border: 1px solid #fecaca;
  border-radius: 6px;
}
.delete-btn:hover { background: #fef2f2; }

/* Placeholder */
.editor-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}
.placeholder-inner { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.placeholder-icon { font-size: 36px; }
.placeholder-inner p { font-size: 13px; line-height: 1.6; margin: 0; }

/* Modal */
.modal-fields { display: flex; flex-direction: column; gap: 14px; }
.modal-row { display: flex; flex-direction: column; gap: 4px; }
.modal-row label { font-size: 12px; font-weight: 600; color: #374151; }
.hint { font-weight: 400; color: #9ca3af; }
.add-error { color: #dc2626; font-size: 12px; margin: 0; }
</style>
