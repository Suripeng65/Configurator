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

const target = "on-select-item"

interface IOnSelectItem {
  targetDatasource: string,
  sourceProperty: string,
  targetPayloadProperty: string,
}

const fields = [
  { key: 'targetDatasource', thStyle: 'min-width:100px' },
  { key: 'sourceProperty', thStyle: 'min-width:180px' },
  { key: 'targetPayloadProperty',         thStyle: 'min-width:140px' },
  { key: 'remove',     thStyle: 'min-width:100px' },
]

const onSelect = computed({get: () => {
    return Object.entries(datasourceInfo.value[target] || {})
        .reduce((acc: IOnSelectItem[], [targetDatasource, value]) => {
      acc.push(...Object.entries(value).map(([sourceProperty, targetPayloadProperty]): IOnSelectItem => ({
        sourceProperty,
        targetDatasource,
        targetPayloadProperty
      })))
      return acc
    }, [])
  }, set: newValue => {
    console.log("setting value!", newValue)
  }
})

function doUpdate(onSelect: IOnSelectItem[]) {
  const value = onSelect.reduce((acc, curr) => {
    set(acc, [curr.targetDatasource, curr.sourceProperty], curr.targetPayloadProperty)
    return acc
  }, {})

  set(meta.value.layout, [...path.value, target], value)
}

const updateItem = (index: number, item: IOnSelectItem) => {
  onSelect.value[index] = item
  doUpdate(onSelect.value)
}

const addItem = () => set(meta.value.layout, [...path.value, target, "", ""], "")

const removeItem = (index: number) => {
  onSelect.value.splice(index, 1)
  doUpdate(onSelect.value)
}
</script>

<template>
  <BFormGroup id="input-group-on-select-item" label="On Select Item">
    <BTable :items="onSelect" :fields="fields">
      <template #cell(sourceProperty)="{ item, index, field: {key} }">
        <BFormInput
            :id="`${target}-${key}-${index}`"
            v-model="item[key]"
            @change="updateItem(index, item)"
        ></BFormInput>
      </template>
      <template #cell(targetDatasource)="{ item, index, field: {key} }">
        <BFormSelect
            :id="`${target}-${key}-${index}`"
            v-model="item[key]"
            :options="datasourceNames"
            @change="updateItem(index, item)"
        ></BFormSelect>
      </template>
      <template #cell(targetPayloadProperty)="{ item, index, field: {key} }">
        <BFormInput
            :id="`${target}-${key}-${index}`"
            v-model="item[key]"
            @change="updateItem(index, item)"
        ></BFormInput>
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