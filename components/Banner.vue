<script setup lang='ts'>
import { useRoute, useRouter } from 'vue-router'
import {inject} from "vue";
import {get} from "lodash";
const route  = useRoute()
const router = useRouter()

const id = route.params.id
const meta = inject('meta')
</script>

<template>
<div class="page-header">
    <div>
        <h1 class="page-title">{{route.meta.breadcrumb || route.name}}
          <span v-if="meta" class="ds-label">: {{ get(meta, "name", id) }}</span>
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
