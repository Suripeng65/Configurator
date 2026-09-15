<script setup lang='ts'>
import { useRoute, useRouter } from 'vue-router'
import {inject, computed} from "vue";
import {get} from "lodash";
const route  = useRoute()
const router = useRouter()

const id = route.params.id
const meta = inject('meta')

const MODEL_LABELS: Record<string, string> = {
  UiTemplate: 'UI Templates',
  Variable: 'Variables',
  Dataset: 'Datasets',
  Deployment: 'Deployments',
}

// Empty string until a name is actually typed in — lodash's get() only
// falls back on `undefined`, not '', so the old template showed ": " with
// nothing after it while creating a new record.
const metaName = computed(() => (meta ? get(meta, 'name', '') : '') || null)

const isCreatingNew = computed(() => !id && route.meta.action === 'Create')

const modelLabel = computed(() => {
  const label = MODEL_LABELS[route.meta.model as string] ?? route.meta.model
  return label || null
})

// While creating: flat resources (Variable/Dataset/Deployment) have no
// sub-tab to preserve, so their own breadcrumb IS 'Create' — absorb the
// resource label directly ("Create Variables"). UI Template's nested
// Details/Layout/Datasource/Adapt Library tabs keep their own breadcrumb
// and get a "Create " prefix instead ("Create Details").
const titleText = computed(() => {
  const base = route.meta.breadcrumb || route.name
  if (!isCreatingNew.value) return base
  if (base === 'Create') {
    return !metaName.value && modelLabel.value ? `Create ${modelLabel.value}` : base
  }
  return `Create ${base}`
})

// What goes after the colon: the record's own name once typed in, else
// (while creating a nested-tab resource) the resource type as a
// placeholder, else nothing.
const suffixText = computed(() => {
  if (metaName.value) return metaName.value
  if (isCreatingNew.value && route.meta.breadcrumb !== 'Create') return modelLabel.value
  return null
})
</script>

<template>
<div class="page-header">
    <div>
        <h1 class="page-title">{{ titleText }}
          <span v-if="suffixText" class="ds-label">: {{ suffixText }}</span>
          <span v-else-if="!meta && id" class="ds-label">{{ id }}</span>
        </h1>
    </div>
    <slot name="buttons"></slot>
</div>
</template>
<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 12px;
  background: #3b82f6;
  flex-shrink: 0;
}
.page-title { font-size: 20px; font-weight: 700; margin: 0; color: #fff; }
</style>
