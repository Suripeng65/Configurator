<template>
  <div class="panel">

    <!-- ── Detail view (create or edit) ── -->
    <TabForm
      v-if="selectedTab !== null"
      :tabKey="selectedTab === '__new__' ? null : selectedTab"
      @saved="onSaved"
      @cancelled="selectedTab = null"
      @deleted="selectedTab = null"
    />

    <!-- ── List view ── -->
    <template v-else>
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Visualization Tabs</h2>
          <p class="panel-subtitle">Manage chart tabs. The ★ tab loads by default. Click a tab to edit its layout.</p>
        </div>
      </div>

      <div v-if="!mainPanel" class="empty-state">No main panel configuration found.</div>

      <div v-else class="tab-list">
        <!-- Registered tabs -->
        <div
          v-for="(tab, index) in tabList"
          :key="tab.key"
          class="tab-card"
          :class="{ 'is-default': tab.key === defaultTab }"
          @click="selectedTab = tab.key"
        >
          <button
            class="star-btn"
            :class="{ active: tab.key === defaultTab }"
            :title="tab.key === defaultTab ? 'Default tab' : 'Set as default'"
            @click.stop="setDefault(tab.key)"
          >★</button>

          <div class="tab-info">
            <span class="tab-title">{{ tab.title }}</span>
            <span class="tab-key">{{ tab.key }}</span>
          </div>

          <span class="chart-badge">{{ chartTypeLabel(tab.key) }}</span>

          <div class="tab-actions" @click.stop>
            <button :disabled="index === 0" class="icon-btn" @click="moveTab(index, index - 1)" title="Move up">↑</button>
            <button :disabled="index === tabList.length - 1" class="icon-btn" @click="moveTab(index, index + 1)" title="Move down">↓</button>
          </div>

          <span class="card-arrow">›</span>
        </div>

        <!-- Orphan tabs -->
        <div
          v-for="key in orphanTabKeys"
          :key="'orphan-' + key"
          class="tab-card tab-card--orphan"
        >
          <div class="orphan-badge">⚠ Unregistered</div>
          <div class="tab-info">
            <span class="tab-title-orphan">{{ mainPanel[key]?.title ?? key }}</span>
            <span class="tab-key">{{ key }}</span>
          </div>
          <button class="register-btn" @click="registerTab(key)">Register Tab →</button>
        </div>

        <button class="add-tab-btn" @click="selectedTab = '__new__'">+ Add Tab</button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useLayoutEditor } from '../../composables/useLayoutEditor.js'
import TabForm from './TabForm.vue'

const MAIN_PANEL_META_KEYS = new Set(['tab-array', 'tabs', 'defaultTab', 'datasources', 'component'])

const CHART_LABELS = {
  BarChart: 'Bar Chart', PieChart: 'Pie Chart', LineChart: 'Line Chart',
  StackedBarChart: 'Stacked Bar', StackedAreaChart: 'Stacked Area',
  DonutChart: 'Donut', ScatterplotChart: 'Scatterplot', TreemapChart: 'Treemap',
  DataTable: 'Data Table',
}

const meta = inject('meta')
const { setValue, deleteNode, addChild, moveItem } = useLayoutEditor(meta)

const selectedTab = ref(null)

const adaptLibrary = computed(() => meta?.value?.layout?.adaptLibrary ?? {})
const mainPanel    = computed(() => meta?.value?.layout?.viz?.['main-panel'] ?? null)

const tabList = computed(() => {
  if (!mainPanel.value) return []
  return (mainPanel.value['tab-array'] ?? [])
    .filter(key => mainPanel.value[key] != null)
    .map(key => ({ key, title: mainPanel.value[key]?.title ?? key }))
})

const defaultTab = computed(() => mainPanel.value?.defaultTab ?? null)

const orphanTabKeys = computed(() => {
  if (!mainPanel.value) return []
  const registered = new Set(mainPanel.value['tab-array'] ?? [])
  return Object.keys(mainPanel.value).filter(k =>
    !registered.has(k) &&
    !MAIN_PANEL_META_KEYS.has(k) &&
    mainPanel.value[k] !== null &&
    typeof mainPanel.value[k] === 'object' &&
    'title' in mainPanel.value[k]
  )
})

function chartTypeLabel(tabKey) {
  const tab = mainPanel.value?.[tabKey]
  if (!tab?.contents) return ''
  const allLabels = {
    ...CHART_LABELS,
    ...Object.fromEntries(Object.entries(adaptLibrary.value).map(([k, d]) => [k, d.label || k]))
  }
  const charts = []
  const walk = (arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach(c => {
      if (c.component && allLabels[c.component]) charts.push(allLabels[c.component])
      walk(c.contents)
    })
  }
  walk(tab.contents)
  return [...new Set(charts)].slice(0, 2).join(' + ')
}

function setDefault(tabKey) {
  setValue(['viz', 'main-panel', 'defaultTab'], tabKey)
}

function moveTab(fromIndex, toIndex) {
  moveItem(['viz', 'main-panel', 'tab-array'], fromIndex, toIndex)
  moveItem(['viz', 'main-panel', 'tabs'], fromIndex, toIndex)
}

function registerTab(key) {
  const tabArrayLen = mainPanel.value['tab-array']?.length ?? 0
  const tabsLen     = mainPanel.value['tabs']?.length ?? 0
  addChild(['viz', 'main-panel', 'tab-array'], null, 'string')
  setValue(['viz', 'main-panel', 'tab-array', tabArrayLen], key)
  addChild(['viz', 'main-panel', 'tabs'], null, 'string')
  setValue(['viz', 'main-panel', 'tabs', tabsLen], key)
}

function onSaved() { selectedTab.value = null }
</script>

<style scoped>
.panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

/* ── Header (list view) ── */
.panel-header { padding: 22px 28px 16px; border-bottom: 1px solid #e5e7eb; background: #fff; flex-shrink: 0; }
.panel-title  { font-size: 18px; font-weight: 700; color: #111; margin: 0 0 4px; }
.panel-subtitle { font-size: 13px; color: #6b7280; margin: 0; }

/* ── Tab list ── */
.tab-list { display: flex; flex-direction: column; gap: 8px; padding: 20px 28px; overflow-y: auto; flex: 1; }

.tab-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tab-card:hover { border-color: #c7d2fe; box-shadow: 0 1px 4px rgba(99,102,241,0.08); }
.tab-card.is-default { border-color: #fbbf24; background: #fffbeb; }

.star-btn { font-size: 18px; color: #d1d5db; background: none; padding: 0 2px; line-height: 1; flex-shrink: 0; }
.star-btn.active { color: #f59e0b; }
.star-btn:hover:not(.active) { color: #fbbf24; }

.tab-info { flex: 1; min-width: 0; }
.tab-title { display: block; font-size: 14px; font-weight: 600; color: #111; }
.tab-key   { display: block; font-size: 11px; color: #9ca3af; font-family: monospace; margin-top: 2px; }

.chart-badge {
  font-size: 11px;
  background: #f3f4f6;
  color: #374151;
  padding: 3px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-actions { display: flex; gap: 4px; flex-shrink: 0; }
.icon-btn {
  width: 26px; height: 26px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover:not(:disabled) { background: #e5e7eb; }
.icon-btn:disabled { opacity: 0.3; cursor: default; }

.card-arrow { font-size: 18px; color: #d1d5db; flex-shrink: 0; line-height: 1; }

.add-tab-btn {
  align-self: flex-start;
  background: none;
  border: 2px dashed #d1d5db;
  color: #6b7280;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  width: 100%;
}
.add-tab-btn:hover { border-color: #6366f1; color: #4f46e5; background: #f5f3ff; }

/* ── Orphan tabs ── */
.tab-card--orphan {
  border-color: #fcd34d;
  background: #fffbeb;
  cursor: default;
}
.tab-card--orphan:hover { border-color: #f59e0b; box-shadow: none; }

.orphan-badge {
  font-size: 10px;
  font-weight: 700;
  color: #92400e;
  background: #fde68a;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
.tab-title-orphan { display: block; font-size: 14px; font-weight: 600; color: #78350f; }
.register-btn {
  background: #f59e0b;
  color: #fff;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
}
.register-btn:hover { background: #d97706; }

.empty-state { color: #9ca3af; padding: 40px; text-align: center; }
</style>
