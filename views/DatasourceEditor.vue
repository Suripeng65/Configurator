<script setup lang="ts">
import {inject, computed, ref, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import {get, set, unset, cloneDeep} from "lodash";
import {getScopes, existingNamesAt, insertDatasource, uniqueDatasourceName} from "@src/utils/datasources.util.ts";
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
const pagination = ref<{}>({})

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
    const name = uniqueDatasourceName(existingNames, sourceItem?.matchedObject.name)
    const newDs = sourceItem
      ? { ...cloneDeep(sourceItem.matchedObject), name }
      : { component: "Datasource", name, "dql-metrics": [], "flat-table-target": "" }

    const insertedPath = insertDatasource(meta, scopeArray, newDs)
    const newIndex = datasources.value.findIndex(d => d.path === insertedPath.join('.'))

    router.replace({
      name: (route.name as string).replace(/ Create$/, ' Edit'),
      params: { index: newIndex, id: route.params.id },
    })
  })
}

const workflow = computed({get: () => {
    if (datasourceInfo.value["flat-table-target"]) return "Flat"
    if (datasourceInfo.value["option-target"]) return "Options"
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

const addRule = () => {
  const empty = {
    message: "",
    rule: "",
    ruleName: "",
    visible: true
  }
  if (!meta.value.rules) meta.value.rules = []
  meta.value.rules.push(empty)
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
          disabled
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
          <BFormInput id="input-max" type="number" v-model="pagination.max" />
        </BFormGroup>

        <BFormGroup id="input-group-offset" label="Offset" label-for="input-offset">
          <BFormInput id="input-offset" type="number" v-model="pagination.offset" />
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
  </div>
</template>

<style scoped>
.editor-panel {
  padding: 20px 28px 32px;
  overflow: auto;
  height: 100%;
}

.back-link {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  margin-bottom: 16px;
}
.back-link:hover { color: #4f46e5; }

form { overflow: visible; }
</style>