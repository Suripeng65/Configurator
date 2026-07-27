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

const target = "on-load-complete"

interface IOnLoadComplete {
  targetDatasource: string,
  action: string | boolean,
}
const fields = [
  { key: 'targetDatasource', thStyle: 'min-width:100px' },
  { key: 'action', thStyle: 'min-width:180px' },
  { key: 'remove',     thStyle: 'min-width:100px' },
]

const onLoadComplete = computed<IOnLoadComplete[]>({get: () => {
    return Object.entries(datasourceInfo.value[target] || {}).reduce((acc: IOnLoadComplete[], [targetDatasource, action]: [string, string | boolean]) => {
      acc.push(({targetDatasource, action}))
      return acc
    }, [])
  }, set: newValue => {
    console.log("setting value!", newValue)
  }
})

function doUpdate(onSelect: IOnLoadComplete[]) {
  const value = onLoadComplete.value.reduce((acc: {}, curr) => {
    acc[curr.targetDatasource] = curr.action
    return acc
  }, {})

  set(meta.value.layout, [...path.value, target], value)
}

const updateItem = (event, index: number, item: IOnLoadComplete) => {
  onLoadComplete.value[index] = item
  doUpdate(onLoadComplete.value)
}

const addItem = () => set(meta.value.layout, [...path.value, target, ""], true)
const removeItem = (index: number) => {
  onLoadComplete.value.splice(index, 1)
  doUpdate(onLoadComplete.value)
}
</script>

<template>
  <BFormGroup id="input-group-on-select-item" label="On Load Complete">
    <BTable :items="onLoadComplete" :fields="fields">
      <template #cell(targetDatasource)="{ item, index, field: {key} }">
        <BFormSelect
            :id="`${target}-${key}-${index}`"
            v-model="item[key]"
            :options="datasourceNames"
            @change="updateItem(index, item)"
        ></BFormSelect>
      </template>
      <template #cell(action)="{ item, index }">
        {{item.action === true ? "refresh" : item.action}}
      </template>
      <template #cell(remove)="{ item, index }">
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