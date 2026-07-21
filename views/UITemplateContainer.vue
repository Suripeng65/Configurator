<script setup lang="ts">
import {useRoute} from "vue-router";
import {ref, Ref} from "vue";
import useEditorWorkflow from "@src/composables/EditorWorkflow.ts";
import {uiTemplatesQueries} from "@src/queries";
import Banner from "@src/components/Banner.vue";
import EditorButtons from "@src/components/EditorButtons.vue";
import EditorWarnings from "@src/components/EditorWarnings.vue";

const route  = useRoute()
const id = route.params.id ? parseInt(<string>route.params.id) : null

const meta: Ref<Record<string, any>> = ref({
  id: id,
  name: history.state?.name ?? '',
  description: history.state?.description ?? '',
  layout: {}
})

useEditorWorkflow(uiTemplatesQueries, meta)
</script>
<template>
  <Banner>
    <template #buttons>
      <EditorButtons/>
    </template>
  </Banner>

  <EditorWarnings/>

  <router-view/>
</template>
<style scoped>

</style>