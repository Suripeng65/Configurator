<script setup lang="ts">
import {computed} from "vue";
import {set} from "lodash";
import useDatasourceEditor from "@src/composables/DatasourceEditorSubcomponents.composable.ts";

const {
  path,
  meta,
  datasourceNames,
  datasourceInfo
} = useDatasourceEditor()

const target = "monitor-overrides"

interface IOnLoadComplete {
  targetDatasource: string,
  action: string | boolean,
}
const fields = [
  { key: 'variable', thStyle: 'min-width:100px' },
  { key: 'value', thStyle: 'min-width:180px' },
  { key: 'remove',     thStyle: 'min-width:100px' },
]

const items = computed<IOnLoadComplete[]>({get: () => {
    return Object.entries(datasourceInfo.value[target] || {}).reduce((acc: IOnLoadComplete[], [targetDatasource, action]: [string, string | boolean]) => {
      acc.push(({targetDatasource, action}))
      return acc
    }, [])
  }, set: newValue => {
    console.log("setting value!", newValue)
  }
})

function doUpdate(onSelect: IOnLoadComplete[]) {
  const value = items.value.reduce((acc: {}, curr) => {
    acc[curr.targetDatasource] = curr.action
    return acc
  }, {})

  set(meta.value.layout, [...path.value, target], value)
}

const updateItem = (index: number, item: IOnLoadComplete) => {
  items.value[index] = item
  doUpdate(items.value)
}

const addItem = () => set(meta.value.layout, [...path.value, target, ""], "")
const removeItem = (index: number) => {
  items.value.splice(index, 1)
  doUpdate(items.value)
}
</script>

<template>
  <BFormGroup id="input-group-monitor-overrides" label="Monitor Overrides">
    <BTable :items="items" :fields="fields">
      <template #cell(variable)="{ item, index, field: {key} }">
        <BFormInput
            :id="`${target}-${key}-${index}`"
            v-model="item[key]"
            @change="updateItem(index, item)"
        ></BFormInput>
      </template>
      <template #cell(value)="{ item, index, field: {key} }">
        <BFormInput
            :id="`${target}-${key}-${index}`"
            v-model="item[key]"
            @change="updateItem(index, item)"
        ></BFormInput>
      </template>
      <template #cell(remove)="{ index }">
        <BButton class="btn btn-danger" @click="removeItem(index)">Remove</BButton>
      </template>
    </BTable>
    <BButton @click="addItem">Add</BButton>
  </BFormGroup>
</template>

<style scoped>
form {
  overflow: scroll;
}
</style>