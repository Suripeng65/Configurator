<script setup lang='ts'>
import { ref, computed } from 'vue'
import Banner from '@src/components/Banner.vue'
import { useRoute } from 'vue-router'
import { datasetsQueries } from '@src/queries'
import DatasetTable from "@src/components/DatasetTable.vue";

const route  = useRoute()

const { data, isLoading: loading, error } = datasetsQueries.useList()
const { mutate: create } = datasetsQueries.useCreate()

const rows = computed(() => data.value ?? [])
</script>
<template>
  <div class="view-wrap" v-if="route.name === 'Dataset'">
    <!-- Page header -->
    <Banner>
      <template #buttons>
        <BButtonGroup>
          <RouterLink to="/dataset/create" class="btn btn-primary">Create</RouterLink>
        </BButtonGroup>
      </template>
    </Banner>

    <!-- Loading / error -->
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>

    <div v-else class="table-wrap">
      <DatasetTable :rows="rows"></DatasetTable>
    </div>
  </div>
  <RouterView />
</template>

<style scoped>
.view-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f9fafb;
}

.table-wrap {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.dataset-table :deep(td) { vertical-align: middle; padding: 6px 10px; }
.dataset-table :deep(th) { background: #f3f4f6; font-size: 12px; font-weight: 600; color: #374151; }
.date-cell { font-size: 12px; color: #6b7280; }

.cell-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 13px;
  background: transparent;
  transition: border-color 0.15s, background 0.15s;
}
.cell-input:hover { border-color: #d1d5db; background: #fff; }
.cell-input:focus { border-color: #3b82f6; background: #fff; outline: none; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }

.row-actions { display: flex; gap: 6px; align-items: center; justify-content: flex-end; }

.state-msg { padding: 40px; text-align: center; color: #6b7280; }
.error-msg { color: #dc2626; }

.form-fields { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: 12px; font-weight: 600; color: #374151; }
.create-error { color: #dc2626; font-size: 12px; margin: 0; }
</style>
