<script setup lang="ts">
import {computed, inject, provide} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {findComponents, getScope, removeDatasource} from "@src/utils/datasources.util.ts"

const route = useRoute()
const router = useRouter()

const fields = [
  { key: 'path',        label: 'Scope', thStyle: 'min-width:100px' },
  { key: 'name',        label: 'Datasource Name', thStyle: 'min-width:180px' },
  { key: 'type',        label: 'Type',         thStyle: 'min-width:140px' },
  { key: 'api',    label: 'API',     thStyle: 'min-width:100px' },
  { key: 'table',    label: 'Table',     thStyle: 'min-width:100px' },
  { key: 'actions',    label: '',     thStyle: 'min-width:140px' },
]

const meta = inject('meta')
const datasources = computed({
  get: () => {
    return findComponents(meta.value.layout, "Datasource");
  },
  set: (newValue, oldValue) => {
  }
})
const tabs = computed({
  get: () :any[] => findComponents(meta.value.layout, "TabWrapper"),
  set: (newValue, oldValue) => {
  }
})

// Derived from the datasource's own path (via ?ds= query), not an array
// index — an index is a *position*, and any insert/remove anywhere in the
// tree rebuilds `datasources` and can shift what a fixed index points at.
// The path string is a stable identifier for a specific datasource node.
const activeDsPath = computed(() => (route.query.ds as string) ?? null)
const path = computed(() =>
  datasources.value.find(d => d.path === activeDsPath.value)?.fullPathArray ?? ["viz", "main-panel"]
)

provide("tabs", tabs)
provide("datasources", datasources)
provide("path", path)

function goToEditor(item) {
  router.push({name: route.name + " Edit", params: {id: meta.value.id}, query: {ds: item.path}})
}

function goToCreate() {
  router.push({name: route.name + " Create", params: {id: meta.value.id}})
}

function duplicateDatasource(item, event) {
  event.stopPropagation()
  router.push({name: route.name + " Create", params: {id: meta.value.id}, query: {duplicate: item.path}})
}

function removeDatasourceRow(item, event) {
  event.stopPropagation()
  if (!confirm(`Remove datasource "${item.matchedObject.name}"?`)) return
  removeDatasource(meta, item.fullPathArray)
}
</script>

<template>
  <BButton
      v-if="route.name === 'UiTemplate Edit Datasource' || route.name === 'UiTemplate Create Datasource'"
      variant="primary"
      size="sm"
      class="mb-2"
      @click="goToCreate"
  >+ Add Datasource</BButton>
  <BTable
      v-if="route.name === 'UiTemplate Edit Datasource' || route.name === 'UiTemplate Create Datasource'"
      :items="datasources"
      :fields="fields"
      bordered
      hover
      responsive
      class="dataset-table"
      @row-clicked="goToEditor"
  >
    <template #cell(path)="{ item }">
      <span class="date-cell">{{ getScope(meta, item.fullPathArray) }}</span>
    </template>
    <template #cell(name)="{ item }">
      <span class="date-cell">{{ item.matchedObject.name }}</span>
    </template>
    <template #cell(table)="{ item }">
      <span class="date-cell">{{ item.matchedObject["flat-table-target"] || item.matchedObject["option-target"] }}</span>
    </template>
    <template #cell(type)="{ item }">
      <span class="date-cell">{{ (item.matchedObject.dqlSupport || !item.matchedObject.api) ? "DQL" : "External API" }}</span>
    </template>
    <template #cell(api)="{ item }">
      <span class="date-cell">{{ item.matchedObject.api || "adapt-core-api"}}</span>
    </template>
    <template #cell(actions)="{ item }">
      <BButton variant="link" size="sm" @click="(e) => duplicateDatasource(item, e)">Duplicate</BButton>
      <BButton variant="link" size="sm" class="text-danger" @click="(e) => removeDatasourceRow(item, e)">Remove</BButton>
    </template>
  </BTable>
  <!-- :key forces a full remount on every navigation within this section
       (not just a param/query update) — DatasourceEditor and its sub-editors
       derive `dsPath` as a one-time const at setup, which would go stale if
       Vue Router reused the instance across same-route-record navigations
       (e.g. setScope's redirect to a new ?ds=). -->
  <router-view :key="route.fullPath"></router-view>
</template>

<style scoped>
.editor-wrap {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-direction: column;
}

.state-msg { padding: 40px; text-align: center; color: #6b7280; font-size: 14px; }

.error-state {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #dc2626;
  text-align: center;
}
.error-state pre {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  color: #7f1d1d;
  white-space: pre-wrap;
  max-width: 480px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px 48px;
  text-align: center;
}
.empty-icon { font-size: 40px; }
.empty-card h3 { font-size: 16px; font-weight: 700; color: #111; margin: 0; }
.empty-card p  { font-size: 13px; color: #6b7280; margin: 0; }

/* Split pane (same as old ConfigEditor) */
.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.split-container.is-dragging { cursor: col-resize; user-select: none; }

.tree-pane {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  min-width: 200px;
}
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 160px;
}
.splitter {
  flex: 0 0 6px;
  background: #e5e7eb;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.splitter:hover, .split-container.is-dragging .splitter { background: #c7d2fe; }
.splitter-dots {
  width: 2px;
  height: 32px;
  border-radius: 2px;
  background: repeating-linear-gradient(to bottom, #9ca3af 0px, #9ca3af 3px, transparent 3px, transparent 6px);
}
.pane-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.copy-icon-btn { background: none; color: #9ca3af; font-size: 14px; padding: 0; line-height: 1; }
.copy-icon-btn:hover { color: #374151; }
.tree-scroll { flex: 1; overflow: auto; padding: 8px 4px 24px 8px; }

.coming-soon {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}
</style>
