<script setup lang="ts">
import {computed, inject, ref, provide} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {get, set, cloneDeep} from "lodash";
import {findComponents, getScope, getScopes, uniqueDatasourceName} from "@src/utils/datasources.util.ts"

const route = useRoute()
const router = useRouter()

const fields = [
  { key: 'path',    label: 'Scope',           thStyle: 'min-width:120px' },
  { key: 'name',    label: 'Datasource Name', thStyle: 'min-width:180px' },
  { key: 'type',    label: 'Type',            thStyle: 'min-width:120px' },
  { key: 'api',     label: 'API',             thStyle: 'min-width:120px' },
  { key: 'table',   label: 'Table',           thStyle: 'min-width:120px' },
  { key: 'actions', label: '',                thStyle: 'width:90px' },
]

const meta = inject('meta')
const datasources = computed(() => findComponents(meta.value.layout, "Datasource"))
const tabs = computed(() => findComponents(meta.value.layout, "TabWrapper"))
const scopes = computed(() => getScopes(tabs.value))

// The datasource currently open in the editor route (if any). Derived
// straight from the route param + the live `datasources` list, instead of a
// separately-tracked ref that only gets set when navigating via a row click —
// that was the root cause of Scope showing stale/wrong data on refresh or
// direct navigation to an edit URL.
const activeIndex = computed(() => {
  const raw = route.params.index
  return raw !== undefined ? parseInt(raw as string) : null
})
const path = computed(() => datasources.value[activeIndex.value]?.fullPathArray ?? ["viz", "main-panel"])

provide("tabs", tabs)
provide("datasources", datasources)
provide("path", path)

function navigateToDatasource(pathStr: string) {
  const index = datasources.value.findIndex((candidate) => candidate.path === pathStr)
  if (index < 0) return
  router.push({name: route.name + " Edit", params: {index, id: meta.value.id}})
}

function goToEditor(item, _index, event) {
  if ((event?.target as HTMLElement)?.closest?.('.row-action')) return
  navigateToDatasource(item.path)
}

// ── Create ────────────────────────────────────────────────────────────────

function existingNamesAt(scopeArray: string[]) {
  const container = get(meta.value.layout, [...scopeArray, "datasources"]) ?? {}
  return Object.values(container).map((d: any) => d?.name).filter(Boolean)
}

// Inserts into whatever shape the target scope's `datasources` already uses
// (array or dict) so we never turn one scope's container into a mixed shape;
// a scope with no `datasources` yet gets a fresh dict (the current schema).
function insertDatasource(scopeArray: string[], datasourceObj: Record<string, any>) {
  const container = get(meta.value.layout, [...scopeArray, "datasources"])
  if (Array.isArray(container)) {
    container.push(datasourceObj)
    return [...scopeArray, "datasources", container.length - 1]
  }
  set(meta.value.layout, [...scopeArray, "datasources", datasourceObj.name], datasourceObj)
  return [...scopeArray, "datasources", datasourceObj.name]
}

const showAdd  = ref(false)
const newScope = ref('viz.main-panel')
const newName  = ref('')
const addError = ref('')

function openAdd() {
  newScope.value = 'viz.main-panel'
  newName.value  = ''
  addError.value = ''
  showAdd.value  = true
}

function confirmAdd() {
  const scopeArray    = newScope.value.split('.')
  const existingNames = existingNamesAt(scopeArray)
  const trimmed       = newName.value.trim()

  if (trimmed && existingNames.includes(trimmed)) {
    addError.value = `"${trimmed}" already exists in this scope.`
    return
  }
  const name = trimmed || uniqueDatasourceName(existingNames)
  const newDs = { component: 'Datasource', name, 'dql-metrics': [], 'flat-table-target': '' }
  const insertedPath = insertDatasource(scopeArray, newDs)
  showAdd.value = false
  navigateToDatasource(insertedPath.join('.'))
}

// ── Duplicate ─────────────────────────────────────────────────────────────

function duplicateDatasource(item) {
  const scopeArray   = item.fullPathArray.slice(0, -2) // drop name/index + 'datasources'
  const existingNames = existingNamesAt(scopeArray)
  const name  = uniqueDatasourceName(existingNames, item.matchedObject.name)
  const clone = { ...cloneDeep(item.matchedObject), name }
  const insertedPath = insertDatasource(scopeArray, clone)
  navigateToDatasource(insertedPath.join('.'))
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h2 class="panel-title">Datasources</h2>
      <p class="panel-subtitle">
        Datasources defined in this template, across every scope (Global and per-tab).
      </p>
      <BButton variant="primary" size="sm" @click="openAdd">+ Add Datasource</BButton>
    </div>

    <div class="panel-body" v-if="route.name === 'UiTemplate Edit Datasource' || route.name === 'UiTemplate Create Datasource'">
      <BTable
          :items="datasources"
          :fields="fields"
          hover
          responsive
          class="ds-table"
          @row-clicked="goToEditor"
      >
        <template #cell(path)="{ item }">
          <BBadge pill variant="light" class="scope-chip">{{ getScope(meta, item.fullPathArray) }}</BBadge>
        </template>
        <template #cell(name)="{ item }">
          <span class="font-monospace">{{ item.matchedObject.name }}</span>
        </template>
        <template #cell(table)="{ item }">
          <span class="text-muted small">{{ item.matchedObject["flat-table-target"] || item.matchedObject["option-target"] || '—' }}</span>
        </template>
        <template #cell(type)="{ item }">
          <span class="text-muted small">{{ (item.matchedObject.dqlSupport || !item.matchedObject.api) ? "DQL" : "External API" }}</span>
        </template>
        <template #cell(api)="{ item }">
          <span class="text-muted small">{{ item.matchedObject.api || "adapt-core-api" }}</span>
        </template>
        <template #cell(actions)="{ item }">
          <BButton
            variant="link"
            size="sm"
            class="row-action p-0"
            title="Duplicate"
            @click.stop="duplicateDatasource(item)"
          >⧉ Duplicate</BButton>
        </template>
      </BTable>
      <p v-if="!datasources.length" class="empty-msg">No datasources defined yet.</p>
    </div>

    <router-view></router-view>

    <!-- New datasource modal -->
    <BModal
      v-model="showAdd"
      title="New Datasource"
      ok-title="Create"
      ok-variant="primary"
      cancel-variant="outline-secondary"
      @ok.prevent="confirmAdd"
    >
      <BFormGroup label="Scope">
        <BFormSelect v-model="newScope" :options="scopes" text-field="matchedObject.title" value-field="path" />
      </BFormGroup>
      <BFormGroup label="Name" class="mt-3" description="Leave blank to auto-generate.">
        <BFormInput v-model="newName" placeholder="/NewDatasource" @keyup.enter="confirmAdd" />
      </BFormGroup>
      <BAlert v-model="addError" variant="danger" class="mt-3 mb-0">{{ addError }}</BAlert>
    </BModal>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.panel-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: #fff;
}
.panel-title    { font-size: 17px; font-weight: 700; color: #111; margin: 0; flex-basis: 100%; }
.panel-subtitle { font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5; flex: 1; }

.panel-body { flex: 1; overflow: auto; padding: 16px 24px; }

.ds-table { cursor: pointer; }
.ds-table :deep(th) { background: #f9fafb; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
.ds-table :deep(td) { vertical-align: middle; font-size: 13px; }
.ds-table :deep(tbody tr:hover) { background: #f5f3ff; }

.scope-chip { color: #4338ca !important; background: #eef2ff !important; font-weight: 500; }

.row-action { color: #9ca3af !important; font-size: 12px; white-space: nowrap; }
.row-action:hover { color: #4f46e5 !important; }

.empty-msg { text-align: center; color: #9ca3af; padding: 32px; font-size: 13px; }
</style>
