<template>
  <!-- Trigger button in header -->
  <button class="selector-trigger" @click="$emit('update:show', true)">
    <span class="selector-icon">🗂</span>
    <span class="selector-label">{{ triggerLabel }}</span>
    <span class="chevron">▾</span>
  </button>

  <!-- Dataset modal using BModal -->
  <BModal
    v-model="localShow"
    size="lg"
    scrollable
    @hide="cancelCreate"
  >
    <template #title>
      <div>
        <div class="fw-bold fs-6">Datasets</div>
        <div class="text-muted" style="font-size:12px;font-weight:400">Select a dataset to open it in the editor.</div>
      </div>
    </template>

    <!-- Dataset table using BTable -->
    <BTable
      :items="templateList"
      :fields="fields"
      hover
      responsive
      class="mb-0 dataset-table"
      :tbody-tr-class="rowClass"
      @row-clicked="select"
    >
      <template #cell(indicator)="{ item }">
        <span v-if="current && item.id === current.id" class="text-primary" style="font-size:10px">●</span>
        <span v-else class="text-secondary" style="font-size:10px;opacity:0.4">○</span>
      </template>

      <template #cell(name)="{ item }">
        <div class="fw-semibold" :class="current && item.id === current.id ? 'text-primary' : ''">
          {{ item.name }}
        </div>
        <div v-if="item.description" class="text-muted" style="font-size:11px">{{ item.description }}</div>
      </template>

      <template #cell(modified)="{ item }">
        <span class="text-muted" style="font-size:12px">{{ formatDate(item.modified) }}</span>
      </template>

      <template #cell(modifiedBy)="{ item }">
        <span class="text-muted" style="font-size:12px">{{ item.modifiedBy || '—' }}</span>
      </template>

      <template #cell(actions)="{ item }">
        <div class="d-flex align-items-center justify-content-end gap-2" @click.stop>
          <BBadge
            v-if="current && item.id === current.id"
            variant="primary"
            pill
            style="font-size:11px"
          >Current</BBadge>
          <BButton
            v-else
            size="sm"
            variant="primary"
            @click="select(item)"
          >Open →</BButton>
          <BButton
            size="sm"
            variant="outline-danger"
            :disabled="templateList.length === 1"
            title="Delete dataset"
            @click="handleDelete(item)"
          >🗑</BButton>
        </div>
      </template>

      <template #empty>
        <div class="text-center text-muted py-4" style="font-size:13px">
          No datasets yet. Create one below.
        </div>
      </template>
    </BTable>

    <!-- Modal footer -->
    <template #footer>
      <div class="d-flex gap-2 w-100">
        <BButton variant="outline-secondary" size="sm" @click="startCreate('blank')">+ New blank</BButton>
        <BButton variant="outline-secondary" size="sm" :disabled="!current" @click="startCreate('duplicate')">⎘ Duplicate current</BButton>
      </div>
    </template>
  </BModal>

  <!-- Create / Duplicate modal -->
  <BModal
    v-model="showCreateForm"
    :title="creatingMode === 'duplicate' ? 'Duplicate Dataset' : 'New Blank Dataset'"
    size="sm"
    ok-title="Create"
    ok-variant="primary"
    cancel-variant="outline-secondary"
    @hide="cancelCreate"
    @ok.prevent="confirmCreate(creatingMode === 'duplicate')"
  >
    <BFormInput
      v-model="newName"
      placeholder="Dataset name…"
      autofocus
      @keyup.enter="confirmCreate(creatingMode === 'duplicate')"
    />
  </BModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@/stores/template'
import { BModal, BTable, BButton, BBadge, BFormInput } from 'bootstrap-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['update:show'])

const store = useTemplateStore()
const { templateList, isDirty } = storeToRefs(store)

const creatingMode = ref(null)
const newName = ref('')
const showCreateForm = ref(false)

const current = computed(() => store.template)
const triggerLabel = computed(() =>
  current.value ? current.value.name : 'Select Dataset'
)

const localShow = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v),
})

const fields = [
  { key: 'indicator',  label: '',              thStyle: 'width:32px' },
  { key: 'name',       label: 'Name' },
  { key: 'modified',   label: 'Last Modified', thStyle: 'width:140px' },
  { key: 'modifiedBy', label: 'Modified By',   thStyle: 'width:120px' },
  { key: 'actions',    label: '',              thStyle: 'width:150px' },
]

function rowClass(item) {
  if (current.value && item && item.id === current.value.id) return 'table-primary'
  return ''
}

function select(item) {
  if (current.value && item.id === current.value.id) { localShow.value = false; return }
  if (isDirty.value && !confirm('You have unsaved changes. Switch anyway?')) return
  store.fetchTemplate(item.id)
  localShow.value = false
}

function handleDelete(item) {
  if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
  store.deleteTemplate(item.id)
}

async function startCreate(mode) {
  creatingMode.value = mode
  newName.value = (mode === 'duplicate' && current.value) ? current.value.name + ' (copy)' : ''
  showCreateForm.value = true
}

function cancelCreate() {
  creatingMode.value = null
  newName.value = ''
  showCreateForm.value = false
}

async function confirmCreate(duplicate) {
  const name = newName.value.trim()
  if (!name) return
  const layout = (duplicate && current.value)
    ? JSON.parse(JSON.stringify(current.value.layout))
    : {}
  await store.createTemplate({ name, layout })
  cancelCreate()
  localShow.value = false
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.selector-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 13px;
  max-width: 240px;
  transition: background 0.15s;
  cursor: pointer;
}
.selector-trigger:hover { background: rgba(255,255,255,0.22); }
.selector-icon { font-size: 14px; flex-shrink: 0; }
.selector-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.chevron { font-size: 12px; opacity: 0.7; flex-shrink: 0; }

.dataset-table :deep(tbody tr) { cursor: pointer; }
</style>
