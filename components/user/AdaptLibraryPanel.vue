<template>
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">Adapt Library Components</h2>
      <p class="panel-subtitle">
        Bulk-edit config fields for a component type. Save applies the change to every place
        that type is used in this template's layout — nothing is stored separately.
      </p>
    </div>

    <div class="panel-body">

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
            @click="selectComponent(name)"
          >
            <span class="comp-name">{{ name }}<span v-if="selected === name && isDirty" class="dirty-dot" title="Unsaved changes">●</span></span>
            <span class="comp-sub">{{ ADAPT_COMPONENTS[name].label }} · {{ usageCountFor(name) }} use{{ usageCountFor(name) === 1 ? '' : 's' }}</span>
          </BListGroupItem>
        </BListGroup>
      </aside>

      <!-- Right: editor -->
      <div class="comp-editor" v-if="selected">

        <BFormGroup label="Component Name" label-class="block-label">
          <code class="comp-key">{{ selected }}</code>
          <span class="usage-note">used in {{ usageCount }} place{{ usageCount === 1 ? '' : 's' }} in this template</span>
        </BFormGroup>

        <div class="editor-block">
          <div class="block-header">
            <span class="block-label">Config Fields</span>
            <BButton variant="outline-primary" size="sm" @click="addField">+ Add Field</BButton>
          </div>
          <p class="block-hint">
            Renaming or removing a field here updates every existing "{{ selected }}" usage on Save.
            <code>datasource</code> type renders a dropdown of tab datasource names at use time.
          </p>

          <BTable
            v-if="draft.fields.length"
            :items="draft.fields"
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
          <BButton variant="primary" size="sm" :disabled="!isDirty || !usageCount" @click="saveComponent">Save Component</BButton>
          <BButton v-if="isDirty" variant="outline-secondary" size="sm" @click="loadDraft(selected)">Discard</BButton>
          <span v-if="isDirty" class="dirty-msg">Unsaved changes</span>
          <span v-else-if="!usageCount" class="dirty-msg">Not used anywhere yet — nothing to save</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { BFormInput, BFormSelect, BFormCheckbox, BButton, BFormGroup, BListGroup, BListGroupItem, BTable, BBadge } from 'bootstrap-vue-next'
import { ADAPT_COMPONENTS } from '../AdaptComponents/index.js'
import { useLayoutEditor, getAtPath } from '../../composables/useLayoutEditor.js'

const meta = inject('meta')
const { setValue, deleteNode } = useLayoutEditor(meta)

const componentNames = computed(() => Object.keys(ADAPT_COMPONENTS))

const fieldColumns = [
  { key: 'key',     label: 'Key' },
  { key: 'type',    label: 'Type',    thStyle: 'width:130px' },
  { key: 'default', label: 'Default', thStyle: 'width:110px' },
  { key: 'remove',  label: '',        thStyle: 'width:36px' },
]

const TYPE_DEFAULTS = { string: '', number: 0, boolean: false, array: [], object: {}, datasource: '/' }

// ── Usage index ───────────────────────────────────────────────────────────────
// Single walk of layout.viz, built once and kept in sync reactively, mapping
// component name -> every path where a node with that `component` lives.
// saveComponent() looks paths up here instead of re-walking the tree.
const usageIndex = computed(() => {
  const index = {}
  function walk(node, path) {
    if (Array.isArray(node)) { node.forEach((child, i) => walk(child, [...path, i])); return }
    if (!node || typeof node !== 'object') return
    if (typeof node.component === 'string') {
      (index[node.component] ??= []).push(path)
    }
    for (const key of Object.keys(node)) {
      const value = node[key]
      if (value && typeof value === 'object') walk(value, [...path, key])
    }
  }
  if (meta?.value?.layout?.viz) walk(meta.value.layout.viz, ['viz'])
  return index
})

function usageCountFor(name) { return (usageIndex.value[name] ?? []).length }

// ── Selection + draft ────────────────────────────────────────────────────────
// The field list being edited is local/session-only: there's no persisted
// "component schema" anywhere in meta, so `savedSnapshot` (not meta) is the
// baseline `isDirty` compares against, seeded from the static ADAPT_COMPONENTS
// definition and rebased to the draft after every successful save.
const selected      = ref(componentNames.value[0] ?? null)
const draft         = ref({ fields: [] })
const savedSnapshot = ref([])

function loadDraft(name) {
  const fields = (ADAPT_COMPONENTS[name]?.fields ?? []).map(f => ({ ...f }))
  savedSnapshot.value = fields
  draft.value = { fields: fields.map(f => ({ ...f, _originalKey: f.key })) }
}
if (selected.value) loadDraft(selected.value)

const usageCount = computed(() => usageCountFor(selected.value))

const isDirty = computed(() => {
  const committed = savedSnapshot.value
  if (draft.value.fields.length !== committed.length) return true
  return draft.value.fields.some((f, i) =>
    f.key !== committed[i]?.key || f.type !== committed[i]?.type || f.default !== committed[i]?.default
  )
})

const hasDatasourceField = computed(() => draft.value.fields.some(f => f.type === 'datasource'))

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

// ── Actions ───────────────────────────────────────────────────────────────────

function selectComponent(name) {
  if (name === selected.value) return
  if (isDirty.value && !confirm(`Discard unsaved changes to "${selected.value}"?`)) return
  selected.value = name
  loadDraft(name)
}

function addField() {
  draft.value.fields.push({ key: `field${draft.value.fields.length + 1}`, type: 'string', _originalKey: null })
}

function setFieldProp(i, prop, value) {
  draft.value.fields[i][prop] = value
}

function removeField(i) {
  draft.value.fields.splice(i, 1)
}

// Applies every field add/rename/remove directly to each real usage path in
// layout.viz via setValue/deleteNode — no separate library node is written.
function saveComponent() {
  const name  = selected.value
  const paths = usageIndex.value[name] ?? []
  if (!name || !paths.length) return

  const committedKeys     = new Set(savedSnapshot.value.map(f => f.key))
  const draftOriginalKeys = new Set(draft.value.fields.map(f => f._originalKey).filter(Boolean))

  for (const f of draft.value.fields) {
    if (!f._originalKey) {
      const defaultVal = f.default !== undefined ? f.default : (TYPE_DEFAULTS[f.type] ?? '')
      for (const path of paths) {
        const node = getAtPath(meta.value.layout, path)
        if (!(f.key in node)) setValue([...path, f.key], defaultVal)
      }
    } else if (f._originalKey !== f.key) {
      for (const path of paths) {
        const node = getAtPath(meta.value.layout, path)
        if (f._originalKey in node) {
          setValue([...path, f.key], node[f._originalKey])
          deleteNode([...path, f._originalKey])
        }
      }
    }
  }

  for (const key of committedKeys) {
    if (!draftOriginalKeys.has(key)) {
      for (const path of paths) {
        const node = getAtPath(meta.value.layout, path)
        if (key in node) deleteNode([...path, key])
      }
    }
  }

  savedSnapshot.value  = draft.value.fields.map(({ _originalKey, ...f }) => f)
  draft.value.fields   = draft.value.fields.map(f => ({ ...f, _originalKey: f.key }))
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

/* Body */
.panel-body { display: flex; flex: 1; overflow: hidden; }

/* ── Component list ── */
.comp-list {
  width: 230px;
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
.dirty-dot { color: #f59e0b; font-size: 8px; margin-left: 5px; vertical-align: middle; }
.comp-sub { font-size: 11px; opacity: 0.65; }

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
.usage-note { font-size: 11px; color: #9ca3af; margin-left: 10px; }

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

.editor-footer { display: flex; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0; }
.dirty-msg { font-size: 11px; color: #b45309; }
</style>
