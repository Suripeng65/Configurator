<script setup lang='ts'>
import { useRoute, useRouter } from 'vue-router'
import {inject, computed} from "vue";
import {get} from "lodash";
const route  = useRoute()
const router = useRouter()

const id = route.params.id
const meta = inject('meta')

const LABELS: Record<string,string> = {
  UiTemplate: 'UI Template',
  Variable:'Variables',
  Dataset: 'Datasets',
  Deployment: 'Deployments'
}

const viewName = computed(()=> {
    const routeName = route.name as string
    const viewName = routeName.split(" ")[0]
    return viewName ? LABELS[viewName] : ''
})

const isCreate = computed(()=>{
  const routeName = route.name as string
  return routeName.includes('Create') || route.fullPath.includes('create')
})

const prefix = computed(()=>{
  if(route.meta.action === 'Create') return route.meta.action || route.meta.breadcrumb || route.name
  return route.meta.breadcrumb || route.name
})
</script>

<template>
<div class="page-header">
    <div>
        <h1 class="page-title">{{prefix}}
          <span v-if="meta && !isCreate" class="ds-label">: {{ get(meta, "name", id) }}</span>
          <span v-else-if="isCreate && !id" class="ds-label">: {{ viewName }}</span>
          <span v-else-if="id" class="ds-label">{{ id }}</span>
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
