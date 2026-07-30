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
      <BButton variant="primary" @click="openAdd">+ Create a component</BButton>
    </div>

    <div v-else class="panel-body">

      <!-- Left: component list -->
      <aside class="comp-list">
        <div class="list-label">Components</div>

        <BListGroup class="comp-listgroup">
          <BListGroupItem
            v-for="name in componentNames"
            :key="name"
            button
            :active="selected === name"
            class="comp-item"
            @click="selected = name"
          >
            <span class="comp-name">{{ name }}</span>
            <span class="comp-sub">{{ adaptLibrary[name]?.label }}</span>
          </BListGroupItem>
        </BListGroup>

        <BButton variant="outline-secondary" size="sm" class="add-comp-btn" @click="openAdd">+ New Component</BButton>
      </aside>

      <!-- Right: editor -->
      <div class="comp-editor" v-if="selected && currentDef">

        <BFormGroup label="Component Name" label-class="block-label">
          <code class="comp-key">{{ selected }}</code>
        </BFormGroup>

        <BFormGroup label="Display Label" label-class="block-label">
          <BFormInput
            :model-value="currentDef.label"
            placeholder="e.g. Bar Chart"
            style="max-width:320px"
            @change="setLabel($event.target.value)"
          />
        </BFormGroup>

        <div class="editor-block">
          <div class="block-header">
            <span class="block-label">Config Fields</span>
            <BButton variant="outline-primary" size="sm" @click="addField">+ Add Field</BButton>
          </div>
          <p class="block-hint">
            Fields available for each instance of this component.
            <code>datasource</code> type renders a dropdown of tab datasource names at use time.
          </p>

          <BTable
            v-if="currentDef.fields?.length"
            :items="currentDef.fields"
            :fields="fieldColumns"
            small
            class="fields-table"
          >
            <template #cell(key)="{ item, index }">
              <BFormInput
                size="sm"
                :model-value="item.key"
                class="font-monospace"
                placeholder="fieldName"
                @change="setFieldProp(index, 'key', $event.target.value)"
              />
            </template>

            <template #cell(type)="{ item, index }">
              <BFormSelect
                size="sm"
                :model-value="item.type"
                @change="setFieldProp(index, 'type', $event.target.value)"
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="array">array</option>
                <option value="object">object</option>
                <option value="datasource">datasource ↗</option>
              </BFormSelect>
            </template>

            <template #cell(default)="{ item, index }">
              <BFormInput
                v-if="item.type === 'number'"
                size="sm"
                type="number"
                :model-value="item.default ?? 0"
                @change="setFieldProp(index, 'default', Number($event.target.value))"
              />
              <BFormCheckbox
                v-else-if="item.type === 'boolean'"
                :model-value="item.default ?? false"
                @update:model-value="setFieldProp(index, 'default', $event)"
              />
              <BFormInput
                v-else-if="item.type === 'string' || item.type === 'datasource'"
                size="sm"
                :model-value="item.default ?? ''"
                placeholder="—"
                @change="setFieldProp(index, 'default', $event.target.value)"
              />
              <span v-else class="field-default-na">—</span>
            </template>

            <template #cell(remove)="{ index }">
              <BButton variant="link" size="sm" class="remove-field-btn p-0" title="Remove field" @click="removeField(index)">✕</BButton>
            </template>
          </BTable>

          <p v-else class="fields-empty">No fields defined. Add one above.</p>

          <!-- datasource names hint -->
          <div v-if="hasDatasourceField && availableDatasources.length" class="ds-hint">
            <span class="ds-hint-label">Available datasource names in this template:</span>
            <BBadge v-for="n in availableDatasources" :key="n" pill variant="light" class="ds-chip">{{ n }}</BBadge>
          </div>
        </div>

        <div class="editor-footer">
          <BButton variant="outline-danger" size="sm" @click="deleteComponent">Delete Component</BButton>
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
      <BFormGroup label="Component Name" description="No spaces, e.g. BarChart">
        <BFormInput v-model="newName" placeholder="MyComponent" @keyup.enter="confirmAdd" />
      </BFormGroup>
      <BFormGroup label="Display Label" class="mt-3">
        <BFormInput v-model="newLabel" placeholder="e.g. My Component" @keyup.enter="confirmAdd" />
      </BFormGroup>
      <BAlert v-model="addError" variant="danger" class="mt-3 mb-0">{{ addError }}</BAlert>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { BModal, BFormInput, BFormSelect, BFormCheckbox, BButton, BFormGroup, BListGroup, BListGroupItem, BTable, BBadge, BAlert } from 'bootstrap-vue-next'
import { ADAPT_COMPONENTS } from '../AdaptComponents/index.js'
import { useLayoutEditor } from '../../composables/useLayoutEditor.js'

const meta = inject('meta')
const { setValue, deleteNode } = useLayoutEditor(meta)

const selected = ref(null)
const showAdd  = ref(false)
const newName  = ref('')
const newLabel = ref('')
const addError = ref('')

const fieldColumns = [
  { key: 'key',     label: 'Key' },
  { key: 'type',    label: 'Type',    thStyle: 'width:130px' },
  { key: 'default', label: 'Default', thStyle: 'width:110px' },
  { key: 'remove',  label: '',        thStyle: 'width:36px' },
]

// ── Computed ──────────────────────────────────────────────────────────────────

const adaptLibrary   = computed(() => meta?.value?.layout?.adaptLibrary ?? {})
const componentNames = computed(() => Object.keys(adaptLibrary.value))
const currentDef     = computed(() => selected.value ? adaptLibrary.value[selected.value] ?? null : null)

const hasDatasourceField = computed(() =>
  currentDef.value?.fields?.some(f => f.type === 'datasource') ?? false
)

const availableDatasources = computed(() => {
  const mainPanel = meta?.value?.layout?.viz?.['main-panel'] ?? {}
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
onMounted(() => { if (meta?.value?.layout) seedBuiltins() })
watch(() => meta?.value?.layout, (layout) => { if (layout) seedBuiltins() })

// ── Actions ───────────────────────────────────────────────────────────────────

function seedBuiltins() {
  if (!meta?.value?.layout) return
  if (!meta.value.layout.adaptLibrary) {
    setValue(['adaptLibrary'], {})
  }
  for (const [name, def] of Object.entries(ADAPT_COMPONENTS)) {
    if (!adaptLibrary.value[name]) {
      setValue(['adaptLibrary', name], {
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

  if (!meta?.value?.layout?.adaptLibrary) {
    setValue(['adaptLibrary'], {})
  }
  setValue(['adaptLibrary', name], { label, fields: [] })
  selected.value = name
  showAdd.value  = false
}

function setLabel(label) {
  setValue(['adaptLibrary', selected.value, 'label'], label)
}

const TYPE_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }

// Visits every node anywhere in the layout tree (left-panel, main-panel, nested
// containers, ...) whose `component` matches, so field edits below stay in sync
// with every instance of that component type, not just visualization-tab cells.
function forEachUsage(componentName, visit) {
  function walk(node) {
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (!node || typeof node !== 'object') return
    if (node.component === componentName) visit(node)
    for (const value of Object.values(node)) walk(value)
  }
  walk(meta?.value?.layout)
}

function addField() {
  const fields = [...(currentDef.value.fields ?? [])]
  const newField = { key: `field${fields.length + 1}`, type: 'string' }
  fields.push(newField)
  setValue(['adaptLibrary', selected.value, 'fields'], fields)

  const defaultVal = newField.default !== undefined ? newField.default : (TYPE_DEFAULTS[newField.type] ?? '')
  forEachUsage(selected.value, node => {
    if (!(newField.key in node)) node[newField.key] = defaultVal
  })
}

function setFieldProp(i, prop, value) {
  const prevKey = currentDef.value.fields[i].key
  const fields = currentDef.value.fields.map((f, idx) => idx === i ? { ...f, [prop]: value } : f)
  setValue(['adaptLibrary', selected.value, 'fields'], fields)

  if (prop === 'key' && value && value !== prevKey) {
    forEachUsage(selected.value, node => {
      if (prevKey in node) {
        node[value] = node[prevKey]
        delete node[prevKey]
      }
    })
  }
}

function removeField(i) {
  const removedKey = currentDef.value.fields[i].key
  const fields = currentDef.value.fields.filter((_, idx) => idx !== i)
  setValue(['adaptLibrary', selected.value, 'fields'], fields)
  forEachUsage(selected.value, node => { delete node[removedKey] })
}

function deleteComponent() {
  if (!confirm(`Delete component "${selected.value}"?`)) return
  deleteNode(['adaptLibrary', selected.value])
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

/* Body */
.panel-body { display: flex; flex: 1; overflow: hidden; }

/* ── Component list ── */
.comp-list {
  width: 210px;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
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

.comp-listgroup { margin-bottom: 8px; }

.comp-item { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }

.comp-name { font-size: 12px; font-weight: 600; font-family: monospace; }
.comp-sub { font-size: 11px; opacity: 0.65; }

.add-comp-btn { width: 100%; border-style: dashed; }

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

:deep(.block-label) {
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
  display: inline-block;
}

/* Fields table */
.fields-table { max-width: 600px; }

.field-default-na { font-size: 12px; color: #d1d5db; padding: 0 4px; }

.remove-field-btn { color: #d1d5db !important; }
.remove-field-btn:hover { color: #dc2626 !important; }

.fields-empty {
  font-size: 12px;
  color: #9ca3af;
  padding: 20px;
  text-align: center;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  max-width: 600px;
  margin: 0;
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
.ds-chip { font-family: monospace; color: #5b21b6 !important; background: #ede9fe !important; }

.editor-footer { padding-top: 8px; border-top: 1px solid #f0f0f0; }

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
</style>
