<template>
  <div class="user-editor">
    <nav class="user-nav">
      <div class="nav-brand">User Mode</div>
      <button
        v-for="s in sections"
        :key="s.key"
        :class="['nav-item', { active: active === s.key }]"
        @click="active = s.key"
      >
        <span class="nav-icon">{{ s.icon }}</span>
        <span>{{ s.label }}</span>
        <span class="nav-desc">{{ s.desc }}</span>
      </button>
    </nav>

    <div class="user-content">
      <MainTabsPanel v-if="active === 'tabs'" />
      <WorkspacePanel v-else-if="active === 'workspace'" />
      <DatasourcesPanel v-else-if="active === 'datasources'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MainTabsPanel from '@/components/user/MainTabsPanel.vue'
import WorkspacePanel from '@/components/user/WorkspacePanel.vue'
import DatasourcesPanel from '@/components/user/DatasourcesPanel.vue'

const active = ref('tabs')

const sections = [
  { key: 'tabs',        icon: '📊', label: 'Visualization Tabs',  desc: 'Add, remove, reorder chart tabs' },
  { key: 'workspace',   icon: '🔧', label: 'Monitor Parameters',   desc: 'Edit filter sections & options' },
  { key: 'datasources', icon: '🗄️', label: 'Datasources',          desc: 'Metrics, rules, data sources' },
]
</script>

<style scoped>
.user-editor {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.user-nav {
  width: 200px;
  flex-shrink: 0;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  gap: 2px;
  overflow-y: auto;
}

.nav-brand {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  padding: 0 8px 10px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: 10px;
  border-radius: 6px;
  background: none;
  color: #374151;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.1s;
}
.nav-item:hover:not(.active) { background: #f0f0f0; }
.nav-item.active { background: #eff6ff; color: #1d4ed8; }

.nav-icon { font-size: 16px; }

.nav-desc {
  font-size: 10px;
  font-weight: 400;
  color: #9ca3af;
  margin-top: 1px;
}
.nav-item.active .nav-desc { color: #93c5fd; }

.user-content {
  flex: 1;
  overflow: auto;
  background: #f8f9fb;
}
</style>
