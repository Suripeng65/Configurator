<script setup lang="ts">
import {inject, computed, ref, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import {get, set, unset, cloneDeep} from "lodash";
import {getScopes, existingNamesAt, insertDatasource, removeDatasource, uniqueDatasourceName} from "@src/utils/datasources.util.ts";
import DatasourceOnSelectEdit from "@src/components/DatasourceEditor/DatasourceOnSelectEdit.vue";
import DatasourceOnLoadEdit from "@src/components/DatasourceEditor/DatasourceOnLoadEdit.vue";
import DatasourceMonitorOverridesEdit from "@src/components/DatasourceEditor/DatasourceMonitorOverridesEdit.vue";

const path = inject("path")
const meta = inject<any>("meta")

const datasources = inject("datasources", ref([]))
const tabs = inject("tabs", ref([]))
const route  = useRoute()
const router = useRouter()
const index = route.params.index ? parseInt(<string>route.params.index) : null
const datasourceInfo = computed(() => get(datasources.value,[index,"matchedObject"], {}))

const scopes = computed(() => getScopes(tabs.value))

// Create route (no :index param): this used to be entirely non-functional —
// nothing ever wrote the form into meta. Instead of a separate creation UI,
// insert a real datasource (or a clone, when arriving via "Duplicate" ->
// ?duplicate=<path>) right away and hand off to the normal edit route, so
// the rest of this page (already wired to `index`) just works unchanged.
if (index === null) {
  onMounted(() => {
    const duplicateSourcePath = route.query.duplicate as string | undefined
    const sourceItem = duplicateSourcePath
      ? datasources.value.find(d => d.path === duplicateSourcePath)
      : null

    const scopeArray = sourceItem
      ? sourceItem.fullPathArray.slice(0, -2) // drop name/index + 'datasources'
      : ["viz", "main-panel"]

    const existingNames = existingNamesAt(meta, scopeArray)
    const name = uniqueDatasourceName(existingNames, sourceItem?.matchedObject?.name)
    const newDs = sourceItem
      ? { ...cloneDeep(sourceItem.matchedObject), name }
      : { component: "Datasource", name, "dql-metrics": [], "flat-table-target": "" }

    const insertedPath = insertDatasource(meta, scopeArray, newDs)
    if (!insertedPath) return
    const newIndex = datasources.value.findIndex(d => d.path === insertedPath.join('.'))

    router.replace({
      name: (route.name as string).replace(/ Create$/, ' Edit'),
      params: { index: newIndex, id: route.params.id },
    })
  })
}

// Defaults to "Options" rather than leaving this undefined when neither
// target is set yet (e.g. a brand-new datasource) — table's setter below
// switches on this value, and an unmatched/undefined workflow silently
// discarded whatever was typed into Table instead of ever writing it.
const workflow = computed({get: () => {
    return datasourceInfo.value["flat-table-target"] ? "Flat" : "Options"
  }, set: (newValue) => {
    setTable(newValue, table.value)
  }})

const table = computed({get: () => {
    return datasourceInfo.value["flat-table-target"] || datasourceInfo.value["option-target"]
  }, set: (newValue) => {
    setTable(workflow.value, newValue)
  }})

function setTable(workflow, table) {
  switch (workflow) {
    case "Flat":
      set(meta.value.layout, [...path.value, "flat-table-target"], table)
      unset(meta.value.layout, [...path.value, "option-target"])
      break;
    case "Options":
      set(meta.value.layout, [...path.value, "option-target"], table)
      unset(meta.value.layout, [...path.value, "flat-table-target"])
      break;
  }
}

const scope = computed(() =>
  scopes.value.findLast(_scope => path.value.join(".").startsWith(_scope.path))?.path
    ?? scopes.value[0].path
);

// Moves the datasource to a different scope: remove from its current
// location and insert at the new one (renaming on a name collision), then
// follow it to its new index. Uses the same insert/remove helpers as
// Create/Duplicate/Remove, so array vs dict scope shapes are handled the
// same way everywhere.
function setScope(newScopePath: string) {
  if (!newScopePath || newScopePath === scope.value) return
  // Guard against acting on a not-yet-resolved datasource (e.g. right after
  // a create/duplicate redirect) — without this, a momentarily-empty
  // datasourceInfo silently corrupts the tree with a nameless entry.
  if (!datasourceInfo.value?.name) {
    console.error('setScope: no datasource currently loaded, aborting move')
    return
  }
  const oldFullPath = [...path.value]
  const scopeArray  = newScopePath.split('.')
  const existingNames = existingNamesAt(meta, scopeArray)
  const name = existingNames.includes(datasourceInfo.value.name)
    ? uniqueDatasourceName(existingNames, datasourceInfo.value.name)
    : datasourceInfo.value.name
  const clone = { ...cloneDeep(datasourceInfo.value), name }

  removeDatasource(meta, oldFullPath)
  const insertedPath = insertDatasource(meta, scopeArray, clone)
  if (!insertedPath) return
  const newIndex = datasources.value.findIndex(d => d.path === insertedPath.join('.'))

  router.replace({ name: route.name as string, params: { index: newIndex, id: route.params.id } })
}

const addRule = () => {
  const empty = {
    message: "",
    rule: "",
    ruleName: "",
    visible: true
  }
  // The Rules table below displays datasourceInfo.rules — pushing to
  // meta.value.rules (unrelated, top-level) meant "Add" never showed up here.
  if (!datasourceInfo.value.rules) datasourceInfo.value.rules = []
  datasourceInfo.value.rules.push(empty)
}

function setPagination(key, value) {
  if (!datasourceInfo.value.pagination) datasourceInfo.value.pagination = {}
  datasourceInfo.value.pagination[key] = value
}
</script>

<template>
  <BForm>
    <BFormGroup id="input-group-scope" label="Scope" label-for="input-scope">
      <BFormSelect
          id="input-scope"
          :model-value="scope"
          :options="scopes"
          text-field="matchedObject.title"
          value-field="path"
          @update:model-value="setScope"
      ></BFormSelect>
    </BFormGroup>

    <BFormGroup id="input-group-name" label="Name" label-for="input-name">
      <BFormInput id="input-name" v-model="datasourceInfo.name" placeholder="Enter Name" required />
    </BFormGroup>

    <BFormGroup id="input-group-description" label="Description" label-for="input-description">
      <BFormInput id="input-description" v-model="datasourceInfo.description" placeholder="Description" required />
    </BFormGroup>

    <BAccordion>
      <BAccordionItem title="API">
        <BFormGroup id="input-group-api" label="API" label-for="input-api">
          <BFormInput id="input-api" v-model="datasourceInfo.api" placeholder="API" required />
        </BFormGroup>
        <template v-if="datasourceInfo.api && datasourceInfo.api !== 'adapt-core-api'">
          <BFormGroup id="input-group-dql-support" label="DQL Support" label-for="input-dql-support">
            <BFormCheckbox id="input-dql-support" v-model="datasourceInfo['dql-support']" required />
          </BFormGroup>
          <BFormGroup id="input-group-table-schema" label="Table Schema" label-for="input-table-schema">
            <BFormInput id="input-table-schema" v-model="datasourceInfo['table-schema']" required />
          </BFormGroup>
          <template v-if="datasourceInfo.api && datasourceInfo['dql-support']">
            <BFormGroup id="input-group-dropdowns" label="Dropdowns" label-for="input-dropdowns">
              <BFormInput id="input-dropdowns" v-model="datasourceInfo['dropdowns']" required />
            </BFormGroup>
            <BFormGroup id="input-group-available-options" label="Available Options" label-for="input-available-options">
              <BFormInput id="input-available-options" v-model="datasourceInfo['available-options']" required />
            </BFormGroup>
            <BFormGroup id="input-group-total-count" label="Total Count" label-for="input-total-count">
              <BFormInput id="input-total-count" v-model="datasourceInfo['total-count']" required />
            </BFormGroup>
            <BFormGroup id="input-group-load-items" label="Load Items" label-for="input-load-items">
              <BFormInput id="input-load-items" v-model="datasourceInfo['load-items']" required />
            </BFormGroup>
          </template>
          <BFormGroup id="input-group-archive" label="Archive" label-for="input-archive">
            <BFormInput id="input-archive" v-model="datasourceInfo['archive']" required />
          </BFormGroup>
          <BFormGroup id="input-group-cancel" label="Cancel" label-for="input-cancel">
            <BFormInput id="input-cancel" v-model="datasourceInfo['cancel']" required />
          </BFormGroup>
        </template>
      </BAccordionItem>

      <BAccordionItem title="Workflow">
        <BFormRadioGroup id="input-workflow" label="Archive" v-model="workflow" :options="['Options', 'Flat']"></BFormRadioGroup>
        <BFormGroup id="input-group-table" label="Table" label-for="input-table">
          <BFormInput id="input-table" v-model="table" placeholder="Enter Table" required />
        </BFormGroup>

        <DatasourceOnLoadEdit/>

        <DatasourceMonitorOverridesEdit />

        <h6>Rules</h6>
        <BTable :items="datasourceInfo.rules">
          <template #cell(ruleName)="{ item, index }">
          <BFormInput
              :id="`rule-name-${index}`"
              v-model="item.ruleName"
          ></BFormInput>
          </template>
          <template #cell(rule)="{ item, index }">
          <BFormInput
              :id="`rule-rule-${index}`"
              v-model="item.rule"
          ></BFormInput>
          </template>
          <template #cell(message)="{ item, index }">
          <BFormInput
              :id="`rule-message-${index}`"
              v-model="item.message"
          ></BFormInput>
          </template>
          <template #cell(visible)="{ item, index }">
          <BFormCheckbox
              :id="`rule-visible-${index}`"
              v-model="item.visible"
          ></BFormCheckbox>
          </template>
        </BTable>
        <BButton @click="addRule">Add</BButton>

        <BFormGroup id="input-group-data-refresh" label="Data Refresh" label-for="input-data-refresh">
          <BFormInput id="input-data-refresh" type="number" v-model="datasourceInfo['data-refresh']" />
        </BFormGroup>

        <BFormGroup id="input-group-auto-load" label="Auto-Load" label-for="input-auto-load">
          <BFormCheckbox id="input-auto-load" v-model="datasourceInfo['auto-load']" />
        </BFormGroup>

        <BFormGroup id="input-group-detach-from-root" label="Detach from Root" label-for="detach-from-root">
          <BFormCheckbox id="detach-from-root" v-model="datasourceInfo['detach-from-root']" />
        </BFormGroup>
      </BAccordionItem>

      <BAccordionItem title="Schema">
        <BFormGroup id="input-group-linked-tables" label="Linked Tables" label-for="linked-tables">
          <BFormTags id="linked-tables" v-model="datasourceInfo['linked-tables']" placeholder="list table names"></BFormTags>
        </BFormGroup>

        <BFormGroup id="input-group-dql-metrics" label="DQL Metrics" label-for="dql-metrics">
          <BFormTags id="dql-metrics" v-model="datasourceInfo['dql-metrics']" placeholder="list DQL metrics"></BFormTags>
        </BFormGroup>

        <BFormGroup id="input-group-max-threshold" label="Max Threshold" label-for="input-max-threshold">
          <BFormInput id="input-max-threshold" type="number" v-model="datasourceInfo['max-threshold']" />
        </BFormGroup>

        <BFormGroup id="input-group-max" label="Max" label-for="input-max">
          <BFormInput id="input-max" type="number" :model-value="datasourceInfo.pagination?.max" @change="setPagination('max', Number($event.target.value))" />
        </BFormGroup>

        <BFormGroup id="input-group-offset" label="Offset" label-for="input-offset">
          <BFormInput id="input-offset" type="number" :model-value="datasourceInfo.pagination?.offset" @change="setPagination('offset', Number($event.target.value))" />
        </BFormGroup>
      </BAccordionItem>

      <BAccordionItem title="Selection Behaviors">
        <DatasourceOnSelectEdit></DatasourceOnSelectEdit>
        <BFormGroup id="input-group-select-multiple-items" label="Select Multiple Items" label-for="input-select-multiple-items">
          <BFormInput id="input-select-multiple-items" type="number" v-model="datasourceInfo['select-multiple-items']" />
        </BFormGroup>

        <BFormGroup id="input-group-select-multiple-columns" label="Select Multiple Columns" label-for="input-select-multiple-columns">
          <BFormInput id="input-select-multiple-columns" type="number" v-model="datasourceInfo['select-multiple-columns']" />
        </BFormGroup>
        <!--  on-filter behavior not currently defined    -->
      </BAccordionItem>
    </BAccordion>
  </BForm>
</template>

<style scoped>
form {
  overflow: scroll;
}
</style>