<template>
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">Datasources</h2>
      <p class="panel-subtitle">Configure lookup tables, metrics available to charts, and validation rules.</p>
    </div>

    <!-- ── Lookup Datasources ── -->
    <section class="ds-section">
      <h3 class="section-title">Lookup Datasources</h3>
      <p class="section-desc">These feed the filter dropdowns (Diagnosis codes, HCPCS codes, etc.)</p>

      <div class="ds-cards">
        <div v-for="(ds, idx) in sharedDs" :key="ds.name + idx" class="ds-card">
          <!-- Card header -->
          <div class="ds-card-header">
            <code class="ds-name">{{ ds.name }}</code>
            <div class="card-header-actions">
              <label class="toggle-label">
                <input type="checkbox" :checked="ds['auto-load']" @change="setSharedDsField(idx, 'auto-load', $event.target.checked)" />
                Auto-load
              </label>
              <button class="icon-btn delete-card-btn" title="Remove datasource" @click="removeDatasource(idx)">✕</button>
            </div>
          </div>

          <!-- Known fields -->
          <div class="ds-card-body">
            <div class="field-row">
              <span class="field-key">Name</span>
              <input :value="ds.name" class="field-input" @change="setSharedDsField(idx, 'name', $event.target.value)" />
            </div>
            <div class="field-row">
              <span class="field-key">Flat Table</span>
              <input :value="ds['flat-table-target']" class="field-input" @change="setSharedDsField(idx, 'flat-table-target', $event.target.value)" />
            </div>
            <div v-if="'select-multiple-items' in ds" class="field-row">
              <span class="field-key">Max items</span>
              <input :value="ds['select-multiple-items']" type="number" class="field-input field-input--sm" @change="setSharedDsField(idx, 'select-multiple-items', Number($event.target.value))" />
            </div>
            <div v-if="ds['on-select-item']" class="field-row">
              <span class="field-key">Maps to dim</span>
              <code class="field-code">{{ Object.values(ds['on-select-item'].monitor || {})[0] }}</code>
            </div>

            <!-- Extra / unknown fields -->
            <template v-for="key in extraKeys(ds)" :key="key">
              <div class="field-row field-row--extra">
                <span class="field-key extra-key" :title="key">{{ key }}</span>
                <input
                  :value="stringified(ds[key])"
                  class="field-input field-input--mono"
                  @change="setSharedDsField(idx, key, parseFieldValue($event.target.value))"
                />
                <button class="remove-field-btn" title="Remove field" @click="removeSharedDsField(idx, key)">×</button>
              </div>
            </template>
          </div>

          <!-- Add field form (per-card) -->
          <div v-if="addFieldCardIdx === idx" class="add-field-form">
            <input
              v-model="newFieldKey"
              class="add-field-input add-field-input--key"
              placeholder="key"
              @keyup.enter="commitAddField(idx)"
              @keyup.escape="cancelAddField"
            />
            <span class="add-field-sep">:</span>
            <input
              v-model="newFieldValue"
              class="add-field-input"
              placeholder="value"
              @keyup.enter="commitAddField(idx)"
              @keyup.escape="cancelAddField"
            />
            <select v-model="newFieldType" class="add-field-select">
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">bool</option>
            </select>
            <button class="btn-confirm-sm" @click="commitAddField(idx)">Add</button>
            <button class="btn-cancel-sm" @click="cancelAddField">✕</button>
          </div>
          <button v-else class="add-field-btn" @click="openAddField(idx)">+ Add field</button>
        </div>

        <!-- Add new datasource card -->
        <div v-if="addingDatasource" class="ds-card ds-card--new">
          <div class="ds-card-header">
            <span class="ds-name new-ds-label">New Datasource</span>
          </div>
          <div class="ds-card-body">
            <div class="field-row">
              <span class="field-key">Name <span class="required">*</span></span>
              <input v-model="newDsName" class="field-input" placeholder="e.g. MyLookup" @keyup.escape="cancelAddDs" />
            </div>
            <div class="field-row">
              <span class="field-key">Flat Table</span>
              <input v-model="newDsFlatTable" class="field-input" placeholder="target table" @keyup.escape="cancelAddDs" />
            </div>
            <div class="field-row">
              <span class="field-key">Auto-load</span>
              <input v-model="newDsAutoLoad" type="checkbox" style="width:auto" />
            </div>
          </div>
          <p v-if="newDsError" class="add-ds-error">{{ newDsError }}</p>
          <div class="new-ds-actions">
            <button class="btn-confirm-sm" @click="commitAddDatasource">Add Datasource</button>
            <button class="btn-cancel-sm" @click="cancelAddDs">Cancel</button>
          </div>
        </div>
      </div>

      <button class="add-ds-btn" @click="addingDatasource = true">+ Add Datasource</button>
    </section>

    <!-- ── Tab Datasources ── -->
    <section class="ds-section">
      <h3 class="section-title">Tab Datasources</h3>
      <p class="section-desc">
        Datasources scoped to each chart tab — the query target, linked lookups, and query settings.
        Each tab typically has a <code>/</code> datasource; you can add more (e.g. <code>/line</code>) for tabs with multiple charts.
      </p>

      <div class="tab-selector">
        <label class="field-key">Tab</label>
        <select v-model="selectedTabDsTab" class="field-input field-input--select">
          <option v-for="t in metricsTabOptions" :key="t.key" :value="t.key">{{ t.title }}</option>
        </select>
      </div>

      <div class="ds-cards" v-if="tabDsList.length">
        <div v-for="(ds, dsIdx) in tabDsList" :key="ds.name + dsIdx" class="ds-card ds-card--tab">
          <div class="ds-card-header">
            <code class="ds-name">{{ ds.name }}</code>
            <div class="card-header-actions">
              <button class="icon-btn delete-card-btn" title="Remove datasource" @click="removeTabDs(dsIdx)">✕</button>
            </div>
          </div>

          <div class="ds-card-body">
            <div class="field-row">
              <span class="field-key">Name</span>
              <input :value="ds.name" class="field-input field-input--mono" @change="setTabDsField(dsIdx, 'name', $event.target.value)" />
            </div>
            <div class="field-row">
              <span class="field-key">Flat Table</span>
              <input :value="ds['flat-table-target']" class="field-input" placeholder="(none)" @change="setTabDsField(dsIdx, 'flat-table-target', $event.target.value)" />
            </div>
            <div class="field-row">
              <span class="field-key">DQL support</span>
              <label class="toggle-label" style="width:auto">
                <input type="checkbox" :checked="ds['dql-support']" @change="setTabDsField(dsIdx, 'dql-support', $event.target.checked)" />
                enabled
              </label>
            </div>
            <div v-if="'max-threshold' in ds" class="field-row">
              <span class="field-key">Max rows</span>
              <input :value="ds['max-threshold']" type="number" class="field-input field-input--sm" @change="setTabDsField(dsIdx, 'max-threshold', Number($event.target.value))" />
            </div>

            <!-- linked datasources -->
            <div v-if="ds.linked" class="field-row field-row--top">
              <span class="field-key">Linked</span>
              <div class="tag-editor">
                <span v-for="(lnk, li) in ds.linked" :key="li" class="linked-chip">
                  <code>{{ lnk }}</code>
                  <button class="remove-chip" @click="removeLinked(dsIdx, li)">×</button>
                </span>
                <input
                  v-model="newLinkedInput[dsIdx]"
                  class="metric-input"
                  placeholder="add linked…"
                  @keyup.enter="addLinked(dsIdx)"
                />
              </div>
            </div>
            <div v-else class="field-row">
              <span class="field-key">Linked</span>
              <button class="add-linked-btn" @click="setTabDsField(dsIdx, 'linked', [])">+ add linked datasources</button>
            </div>

            <!-- Extra / unknown fields -->
            <template v-for="key in tabDsExtraKeys(ds)" :key="key">
              <div class="field-row field-row--extra">
                <span class="field-key extra-key" :title="key">{{ key }}</span>
                <input
                  :value="stringified(ds[key])"
                  class="field-input field-input--mono"
                  @change="setTabDsField(dsIdx, key, parseFieldValue($event.target.value))"
                />
                <button class="remove-field-btn" @click="removeTabDsField(dsIdx, key)">×</button>
              </div>
            </template>
          </div>

          <!-- Per-card add field -->
          <div v-if="tabDsAddFieldIdx === dsIdx" class="add-field-form">
            <input v-model="newFieldKey" class="add-field-input add-field-input--key" placeholder="key" @keyup.enter="commitTabDsField(dsIdx)" @keyup.escape="cancelAddField" />
            <span class="add-field-sep">:</span>
            <input v-model="newFieldValue" class="add-field-input" placeholder="value" @keyup.enter="commitTabDsField(dsIdx)" @keyup.escape="cancelAddField" />
            <select v-model="newFieldType" class="add-field-select">
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">bool</option>
            </select>
            <button class="btn-confirm-sm" @click="commitTabDsField(dsIdx)">Add</button>
            <button class="btn-cancel-sm" @click="cancelAddField">✕</button>
          </div>
          <button v-else class="add-field-btn" @click="openTabDsAddField(dsIdx)">+ Add field</button>
        </div>
      </div>
      <div v-else class="empty-state">No datasources configured for this tab.</div>

      <!-- Add new tab datasource -->
      <div v-if="addingTabDs" class="add-tab-ds-form">
        <div class="field-row">
          <span class="field-key">Name <span class="required">*</span></span>
          <input v-model="newTabDsName" class="field-input field-input--mono" placeholder="e.g. /line" @keyup.escape="addingTabDs = false" />
        </div>
        <div class="field-row">
          <span class="field-key">Flat Table</span>
          <input v-model="newTabDsFlatTable" class="field-input" placeholder="target table" @keyup.escape="addingTabDs = false" />
        </div>
        <p v-if="newTabDsError" class="add-ds-error">{{ newTabDsError }}</p>
        <div class="new-ds-actions">
          <button class="btn-confirm-sm" @click="commitAddTabDs">Add Datasource</button>
          <button class="btn-cancel-sm" @click="addingTabDs = false">Cancel</button>
        </div>
      </div>
      <button v-else class="add-ds-btn" @click="addingTabDs = true">+ Add Datasource to Tab</button>
    </section>

    <!-- ── DQL Metrics ── -->
    <section class="ds-section">
      <h3 class="section-title">DQL Metrics</h3>
      <p class="section-desc">Metrics available in chart tabs. Select a tab to edit its metric list.</p>

      <div class="tab-selector">
        <label class="field-key">Tab</label>
        <select v-model="selectedMetricTab" class="field-input field-input--select">
          <option v-for="t in metricsTabOptions" :key="t.key" :value="t.key">{{ t.title }}</option>
        </select>
      </div>

      <div v-if="selectedMetricsDsPath" class="metrics-editor">
        <div class="metrics-chips">
          <span v-for="(m, idx) in currentMetrics" :key="m + idx" class="metric-chip">
            {{ m }}
            <button class="remove-chip" @click="removeMetric(idx)">×</button>
          </span>
          <input v-model="newMetric" class="metric-input" placeholder="add metric…" @keyup.enter="addMetric" />
        </div>
        <button class="add-metric-btn" @click="addMetric">+ Add</button>
      </div>
    </section>

    <!-- ── Validation Rules ── -->
    <section class="ds-section">
      <h3 class="section-title">Validation Rules</h3>
      <p class="section-desc">Rules that must pass before the chart loads data. Shown to users as messages.</p>

      <div class="tab-selector">
        <label class="field-key">Tab</label>
        <select v-model="selectedRulesTab" class="field-input field-input--select">
          <option v-for="t in rulesTabOptions" :key="t.key" :value="t.key">{{ t.title }}</option>
        </select>
        <span v-if="rulesDsName" class="ds-source-hint">datasource: <code>{{ rulesDsName }}</code></span>
      </div>

      <div v-if="!rulesDsPath" class="empty-state">
        No datasource with a <code>rules</code> array found in this tab.
      </div>
      <template v-else>
        <table class="rules-table">
          <thead>
            <tr>
              <th>Rule Name</th>
              <th>Expression</th>
              <th>User Message</th>
              <th class="center">Visible</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rule, idx) in validationRules" :key="idx">
              <td>
                <input :value="rule.ruleName" class="field-input field-input--mono" placeholder="rule name" @change="setRule(idx, 'ruleName', $event.target.value)" />
              </td>
              <td>
                <textarea :value="rule.rule" class="rule-expr-input" rows="2" placeholder="expression" @change="setRule(idx, 'rule', $event.target.value)" />
              </td>
              <td>
                <input :value="rule.message" class="field-input" placeholder="message shown to user" @change="setRule(idx, 'message', $event.target.value)" />
              </td>
              <td class="center">
                <input type="checkbox" :checked="rule.visible" @change="setRule(idx, 'visible', $event.target.checked)" />
              </td>
              <td class="center">
                <button class="remove-rule-btn" title="Remove rule" @click="removeRule(idx)">✕</button>
              </td>
            </tr>

            <!-- Add rule inline form -->
            <tr v-if="addingRule">
              <td><input v-model="newRule.ruleName" class="field-input field-input--mono" placeholder="rule name" @keyup.escape="addingRule = false" /></td>
              <td><textarea v-model="newRule.rule" class="rule-expr-input" rows="2" placeholder="expression" /></td>
              <td><input v-model="newRule.message" class="field-input" placeholder="message" @keyup.escape="addingRule = false" /></td>
              <td class="center"><input type="checkbox" v-model="newRule.visible" /></td>
              <td class="center">
                <button class="btn-confirm-sm" @click="commitAddRule">✓</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="rules-footer">
          <button v-if="!addingRule" class="add-rule-btn" @click="startAddRule">+ Add Rule</button>
          <button v-else class="btn-cancel-sm" @click="addingRule = false">Cancel</button>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTemplateStore } from '@src/stores/template'

const store = useTemplateStore()

const selectedMetricTab = ref(null)
const newMetric = ref('')

// Per-card "add field" state
const addFieldCardIdx = ref(null)
const newFieldKey   = ref('')
const newFieldValue = ref('')
const newFieldType  = ref('string')

// Add new datasource state
const addingDatasource = ref(false)
const newDsName      = ref('')
const newDsFlatTable = ref('')
const newDsAutoLoad  = ref(false)
const newDsError     = ref('')

// Known fields that we render as dedicated rows; everything else goes in "extra"
const KNOWN_KEYS = new Set([
  'name', 'component', 'auto-load', 'flat-table-target', 'select-multiple-items', 'on-select-item',
])

const layout    = computed(() => store.template?.layout ?? {})
const mainPanel = computed(() => layout.value?.viz?.['main-panel'] ?? {})
const sharedDs  = computed(() => mainPanel.value?.datasources ?? [])
const tabArray  = computed(() => mainPanel.value?.['tab-array'] ?? [])

const metricsTabOptions = computed(() =>
  tabArray.value.map(key => ({ key, title: mainPanel.value[key]?.title ?? key }))
)
const activeMetricTab = computed(() => selectedMetricTab.value ?? tabArray.value[0] ?? null)

const selectedMetricsDsPath = computed(() => {
  if (!activeMetricTab.value) return null
  const tabDs = mainPanel.value[activeMetricTab.value]?.datasources ?? []
  const idx = tabDs.findIndex(d => d.name === '/')
  if (idx < 0) return null
  return ['viz', 'main-panel', activeMetricTab.value, 'datasources', idx, 'dql-metrics']
})

const currentMetrics = computed(() => {
  if (!selectedMetricsDsPath.value || !activeMetricTab.value) return []
  const ds = (mainPanel.value[activeMetricTab.value]?.datasources ?? []).find(d => d.name === '/')
  return ds?.['dql-metrics'] ?? []
})

// ── Tab Datasources ───────────────────────────────────────
const TAB_DS_KNOWN_KEYS = new Set([
  'name', 'component', 'flat-table-target', 'dql-support', 'max-threshold',
  'linked', 'dql-metrics', 'rules', 'pagination',
])

const selectedTabDsTab = ref(null)
const tabDsAddFieldIdx = ref(null)
const newLinkedInput   = ref({})   // keyed by dsIdx

// Add-new-tab-ds form
const addingTabDs       = ref(false)
const newTabDsName      = ref('')
const newTabDsFlatTable = ref('')
const newTabDsError     = ref('')

const activeTabDsTab = computed(() => selectedTabDsTab.value ?? tabArray.value[0] ?? null)

const tabDsList = computed(() => {
  if (!activeTabDsTab.value) return []
  return mainPanel.value[activeTabDsTab.value]?.datasources ?? []
})

function tabDsPath(dsIdx) {
  return ['viz', 'main-panel', activeTabDsTab.value, 'datasources', dsIdx]
}

function tabDsExtraKeys(ds) {
  return Object.keys(ds).filter(k => !TAB_DS_KNOWN_KEYS.has(k))
}

function setTabDsField(dsIdx, field, value) {
  store.setValue([...tabDsPath(dsIdx), field], value)
}

function removeTabDsField(dsIdx, key) {
  store.deleteNode([...tabDsPath(dsIdx), key])
}

function removeTabDs(dsIdx) {
  const name = tabDsList.value[dsIdx]?.name ?? dsIdx
  if (!confirm(`Remove datasource "${name}" from this tab?`)) return
  store.deleteNode(['viz', 'main-panel', activeTabDsTab.value, 'datasources', dsIdx])
}

function openTabDsAddField(dsIdx) {
  tabDsAddFieldIdx.value = dsIdx
  newFieldKey.value   = ''
  newFieldValue.value = ''
  newFieldType.value  = 'string'
}

function commitTabDsField(dsIdx) {
  const key = newFieldKey.value.trim()
  if (!key) return
  setTabDsField(dsIdx, key, parseFieldValue(newFieldValue.value))
  cancelAddField()
  tabDsAddFieldIdx.value = null
}

function addLinked(dsIdx) {
  const val = (newLinkedInput.value[dsIdx] ?? '').trim()
  if (!val) return
  const current = tabDsList.value[dsIdx]?.linked ?? []
  const newIdx  = current.length
  store.addChild([...tabDsPath(dsIdx), 'linked'], null, 'string')
  store.setValue([...tabDsPath(dsIdx), 'linked', newIdx], val)
  newLinkedInput.value[dsIdx] = ''
}

function removeLinked(dsIdx, li) {
  store.deleteNode([...tabDsPath(dsIdx), 'linked', li])
}

function commitAddTabDs() {
  const name = newTabDsName.value.trim()
  if (!name) { newTabDsError.value = 'Name is required.'; return }
  if (tabDsList.value.some(d => d.name === name)) {
    newTabDsError.value = `"${name}" already exists in this tab.`; return
  }
  const config = {
    name,
    component: 'Datasource',
    'flat-table-target': newTabDsFlatTable.value.trim(),
    'dql-metrics': [],
    'dql-support': true,
  }
  const newIdx = tabDsList.value.length
  const basePath = ['viz', 'main-panel', activeTabDsTab.value, 'datasources']
  store.addChild(basePath, null, 'object')
  store.setValue([...basePath, newIdx], config)
  addingTabDs.value   = false
  newTabDsName.value  = ''
  newTabDsFlatTable.value = ''
  newTabDsError.value = ''
}

// ── Validation Rules ───────────────────────────────────────
const selectedRulesTab = ref(null)

const rulesTabOptions = computed(() =>
  tabArray.value.map(key => ({ key, title: mainPanel.value[key]?.title ?? key }))
)

const activeRulesTab = computed(() => selectedRulesTab.value ?? tabArray.value[0] ?? null)

// Find whichever datasource in this tab actually has a 'rules' array
const rulesDsIdx = computed(() => {
  if (!activeRulesTab.value) return -1
  return (mainPanel.value[activeRulesTab.value]?.datasources ?? [])
    .findIndex(d => Array.isArray(d.rules))
})

const rulesDsPath = computed(() => {
  if (!activeRulesTab.value || rulesDsIdx.value < 0) return null
  return ['viz', 'main-panel', activeRulesTab.value, 'datasources', rulesDsIdx.value]
})

const rulesDsName = computed(() => {
  if (!activeRulesTab.value || rulesDsIdx.value < 0) return null
  return mainPanel.value[activeRulesTab.value]?.datasources?.[rulesDsIdx.value]?.name ?? null
})

const validationRules = computed(() => {
  if (!activeRulesTab.value || rulesDsIdx.value < 0) return []
  return mainPanel.value[activeRulesTab.value]?.datasources?.[rulesDsIdx.value]?.rules ?? []
})

// Add-rule form
const addingRule = ref(false)
const newRule = ref({ ruleName: '', rule: '', message: '', visible: true })

onMounted(() => {
  selectedMetricTab.value  = tabArray.value[0] ?? null
  selectedRulesTab.value   = tabArray.value[0] ?? null
  selectedTabDsTab.value   = tabArray.value[0] ?? null
})

// ── helpers ──────────────────────────────────────────────
function extraKeys(ds) {
  return Object.keys(ds).filter(k => !KNOWN_KEYS.has(k))
}

function stringified(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function parseFieldValue(raw) {
  const t = newFieldType.value
  if (t === 'number') return Number(raw)
  if (t === 'boolean') return raw === 'true' || raw === '1'
  return raw
}

// ── shared ds actions ────────────────────────────────────
function setSharedDsField(dsIdx, field, value) {
  store.setValue(['viz', 'main-panel', 'datasources', dsIdx, field], value)
}

function removeSharedDsField(dsIdx, key) {
  store.deleteNode(['viz', 'main-panel', 'datasources', dsIdx, key])
}

function removeDatasource(dsIdx) {
  if (!confirm(`Remove datasource "${sharedDs.value[dsIdx]?.name}"?`)) return
  store.deleteNode(['viz', 'main-panel', 'datasources', dsIdx])
}

// ── per-card add field ───────────────────────────────────
function openAddField(idx) {
  addFieldCardIdx.value = idx
  newFieldKey.value   = ''
  newFieldValue.value = ''
  newFieldType.value  = 'string'
}

function commitAddField(dsIdx) {
  const key = newFieldKey.value.trim()
  if (!key) return
  const value = parseFieldValue(newFieldValue.value)
  setSharedDsField(dsIdx, key, value)
  cancelAddField()
}

function cancelAddField() {
  addFieldCardIdx.value = null
  newFieldKey.value = ''
  newFieldValue.value = ''
}

// ── add new datasource ───────────────────────────────────
function commitAddDatasource() {
  const name = newDsName.value.trim()
  if (!name) { newDsError.value = 'Name is required.'; return }
  if (sharedDs.value.some(d => d.name === name)) { newDsError.value = `"${name}" already exists.`; return }

  const config = {
    name,
    component: 'Datasource',
    'auto-load': newDsAutoLoad.value,
    'flat-table-target': newDsFlatTable.value.trim(),
  }
  const newIdx = sharedDs.value.length
  store.addChild(['viz', 'main-panel', 'datasources'], null, 'object')
  store.setValue(['viz', 'main-panel', 'datasources', newIdx], config)
  cancelAddDs()
}

function cancelAddDs() {
  addingDatasource.value = false
  newDsName.value = ''
  newDsFlatTable.value = ''
  newDsAutoLoad.value = false
  newDsError.value = ''
}

// ── metrics ──────────────────────────────────────────────
function removeMetric(idx) {
  store.deleteNode([...selectedMetricsDsPath.value, idx])
}

function addMetric() {
  const m = newMetric.value.trim()
  if (!m || !selectedMetricsDsPath.value) return
  const newIdx = currentMetrics.value.length
  store.addChild(selectedMetricsDsPath.value, null, 'string')
  store.setValue([...selectedMetricsDsPath.value, newIdx], m)
  newMetric.value = ''
}

// ── rules ────────────────────────────────────────────────
function setRule(ruleIdx, field, value) {
  if (!rulesDsPath.value) return
  store.setValue([...rulesDsPath.value, 'rules', ruleIdx, field], value)
}

function removeRule(ruleIdx) {
  if (!rulesDsPath.value) return
  if (!confirm('Remove this validation rule?')) return
  store.deleteNode([...rulesDsPath.value, 'rules', ruleIdx])
}

function startAddRule() {
  newRule.value = { ruleName: '', rule: '', message: '', visible: true }
  addingRule.value = true
}

function commitAddRule() {
  if (!rulesDsPath.value) return
  const idx = validationRules.value.length
  store.addChild([...rulesDsPath.value, 'rules'], null, 'object')
  store.setValue([...rulesDsPath.value, 'rules', idx], { ...newRule.value })
  addingRule.value = false
}
</script>

<style scoped>
.panel { padding: 28px 32px; max-width: 960px; }
.panel-header { margin-bottom: 28px; }
.panel-title  { font-size: 18px; font-weight: 700; color: #111; }
.panel-subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }

.ds-section { margin-bottom: 36px; }
.section-title { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 4px; }
.section-desc  { font-size: 12px; color: #9ca3af; margin-bottom: 14px; line-height: 1.5; }

.ds-cards { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }

.ds-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 16px;
  min-width: 260px;
  flex: 1;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ds-card--new { border-color: #a5b4fc; background: #fafafe; }

.ds-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-header-actions { display: flex; align-items: center; gap: 8px; }

.ds-name { font-size: 15px; font-weight: 700; color: #1d4ed8; }
.new-ds-label { color: #6366f1; font-size: 14px; }

.delete-card-btn {
  width: 22px;
  height: 22px;
  background: #f3f4f6;
  color: #9ca3af;
  border-radius: 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.delete-card-btn:hover { background: #fee2e2; color: #dc2626; }

.ds-card-body { display: flex; flex-direction: column; gap: 6px; }

.field-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.field-row--extra { background: #f9f9ff; border-radius: 4px; padding: 2px 4px; }
.field-key { color: #6b7280; width: 80px; flex-shrink: 0; font-size: 11px; }
.extra-key { color: #a78bfa; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.field-input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  background: #fff;
}
.field-input:focus { border-color: #6366f1; outline: none; }
.field-input--sm    { max-width: 100px; flex: none; }
.field-input--mono  { font-family: monospace; font-size: 11px; }
.field-input--select { flex: 1; cursor: pointer; }
.field-code { background: #f3f4f6; padding: 2px 7px; border-radius: 4px; font-size: 11px; color: #374151; }

.remove-field-btn {
  background: none;
  color: #d1d5db;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  flex-shrink: 0;
}
.remove-field-btn:hover { color: #dc2626; }

/* Per-card add-field */
.add-field-form {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 8px;
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  border-radius: 6px;
}
.add-field-input {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 7px;
  font-size: 11px;
  background: #fff;
  min-width: 0;
  flex: 1;
}
.add-field-input--key { max-width: 90px; flex: 0 0 auto; font-family: monospace; }
.add-field-input:focus { border-color: #6366f1; outline: none; }
.add-field-sep { color: #6b7280; flex-shrink: 0; }
.add-field-select {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 5px;
  font-size: 11px;
  background: #fff;
  flex-shrink: 0;
  cursor: pointer;
}
.add-field-btn {
  align-self: flex-start;
  background: none;
  border: 1px dashed #e5e7eb;
  color: #9ca3af;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  width: 100%;
  text-align: left;
}
.add-field-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

.btn-confirm-sm { background: #4f46e5; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 5px; flex-shrink: 0; }
.btn-confirm-sm:hover { background: #4338ca; }
.btn-cancel-sm { background: none; color: #9ca3af; font-size: 13px; padding: 2px 5px; flex-shrink: 0; }
.btn-cancel-sm:hover { color: #374151; }

.new-ds-actions { display: flex; gap: 8px; align-items: center; }
.add-ds-error { color: #dc2626; font-size: 11px; margin: 0; }
.required { color: #dc2626; }

/* Add-datasource button (outside cards) */
.add-ds-btn {
  background: none;
  border: 2px dashed #d1d5db;
  color: #6b7280;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 13px;
  width: 100%;
  transition: all 0.15s;
}
.add-ds-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

/* Metrics */
.tab-selector { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.metrics-editor { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
.metrics-chips  { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }

.metric-chip {
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  font-family: monospace;
  padding: 3px 6px 3px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.remove-chip { background: none; color: #93c5fd; font-size: 14px; line-height: 1; padding: 0; }
.remove-chip:hover { color: #1d4ed8; }
.metric-input {
  border: 1px dashed #bfdbfe;
  border-radius: 10px;
  padding: 3px 10px;
  font-size: 11px;
  font-family: monospace;
  width: 140px;
  background: #f0f9ff;
}
.metric-input:focus { border-color: #3b82f6; outline: none; }
.add-metric-btn { background: none; color: #3b82f6; font-size: 12px; padding: 4px 8px; }
.add-metric-btn:hover { text-decoration: underline; }

/* Rules table */
.ds-card--tab { border-color: #d1fae5; }
.ds-card--tab .ds-name { color: #065f46; }

.tag-editor { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; flex: 1; }

.linked-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #d1fae5;
  border-radius: 10px;
  padding: 2px 6px 2px 8px;
  font-size: 11px;
}
.linked-chip code { font-size: 11px; color: #065f46; }

.add-linked-btn {
  background: none;
  border: 1px dashed #d1d5db;
  color: #9ca3af;
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
}
.add-linked-btn:hover { border-color: #6366f1; color: #4f46e5; }

.add-tab-ds-form {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.ds-source-hint { font-size: 11px; color: #9ca3af; }
.ds-source-hint code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: 11px; }

.rules-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.rules-table th {
  background: #f9fafb;
  text-align: left;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.rules-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.rules-table tr:hover td { background: #f9fafb; }
.center { text-align: center; }
.rule-expr-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px 7px;
  font-size: 11px;
  font-family: monospace;
  resize: vertical;
  background: #fff;
  min-height: 42px;
}
.rule-expr-input:focus { border-color: #6366f1; outline: none; }

.remove-rule-btn {
  background: none;
  color: #d1d5db;
  font-size: 13px;
  padding: 2px 5px;
  border-radius: 4px;
}
.remove-rule-btn:hover { background: #fee2e2; color: #dc2626; }

.rules-footer { margin-top: 8px; }
.add-rule-btn {
  background: none;
  border: 1px dashed #d1d5db;
  color: #6b7280;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.15s;
}
.add-rule-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

.toggle-label { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #374151; cursor: pointer; }
.icon-btn { cursor: pointer; border: none; }
.empty-state { color: #9ca3af; padding: 20px 0; font-size: 13px; }
</style>
