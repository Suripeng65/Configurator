<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@src/stores/template'
import { useAppInfoStore } from '@src/stores/appInfo'
import { BBreadcrumb } from "bootstrap-vue-next";

const route = useRoute()
const router = useRouter()
const appInfoStore = useAppInfoStore()
const {currentUser} = storeToRefs(appInfoStore)

const store = useTemplateStore()
const { template, isDirty, saveStatus, mode } = storeToRefs(store)

const showImport = ref(false)
const importText = ref('')
const importError = ref('')

const isEditorRoute = computed(() =>
  route.path.startsWith('/uitemplate/') && !!route.params.id
)

const isUITemplateRoute = computed(() =>
  route.path.startsWith('/uitemplate')
)

function copyJson() {
  if (!template.value) return
  const json = JSON.stringify(template.value.layout, null, 2)
  navigator.clipboard.writeText(json).catch(() => alert(json))
}

const breadcrumbItems = computed<[]>(() => {
  return route.matched
      .filter(r => r.meta && r.meta.breadcrumb)
      .map((r, index, array) => {
        const isLast = index === array.length - 1

        // If the path contains a parameter placeholder like ':id',
        // replace it with the actual route param value
        let resolvedPath = r.path
        Object.keys(route.params).forEach(key => {
          resolvedPath = resolvedPath.replace(`:${key}`, String(route.params[key]))
        })

        return {
          // Fallback to specific data name if needed, else use static meta text
          text: (r.meta.breadcrumb as string),
          class: "btn btn-sm text-white",
          to: isLast ? undefined : resolvedPath,
          active: isLast
        }
      })
})

function closeImport() {
  showImport.value = false
  importText.value = ''
  importError.value = ''
}

function doImport() {
  importError.value = ''
  try {
    let parsed = JSON.parse(importText.value)
    if (parsed && typeof parsed.layout === 'object') parsed = parsed.layout
    store.replaceLayout(parsed)
    closeImport()
  } catch (e) {
    importError.value = 'Invalid JSON: ' + e.message
  }
}
onMounted(()=>{
  appInfoStore.fetchCurrentUser()
})
</script>
<template>
  <div class="app-shell">

    <!-- Top bar -->
    <header class="top-bar">
      <span class="brand">ADAPT Configuration Manager</span>
      <span class="sep">|</span>
      <BBreadcrumb :items="breadcrumbItems" />

      <div class="top-right">
        <!-- Editor controls (only when a template is loaded on an editor route) -->
        <template v-if="isEditorRoute && template">
          <div class="mode-toggle">
            <button :class="['mode-btn', { active: mode === 'user' }]" @click="store.setMode('user')">User</button>
            <button :class="['mode-btn', { active: mode === 'dev' }]"  @click="store.setMode('dev')">Dev</button>
          </div>
          <Transition name="fade">
            <span v-if="saveStatus === 'saved'" class="status-msg saved">Saved ✓</span>
            <span v-else-if="saveStatus === 'error'" class="status-msg error">Save failed</span>
          </Transition>
          <button class="btn-save" :disabled="!isDirty || saveStatus === 'saving'" @click="store.saveTemplate()">
            {{ saveStatus === 'saving' ? 'Saving…' : 'Save' }}
          </button>
          <button class="btn-ghost" @click="showImport = true">Import JSON</button>
          <button class="btn-ghost" @click="copyJson">Copy JSON</button>
        </template>
        <span class="user-name">{{ currentUser.name }}</span>
      </div>
    </header>

    <div class="app-body">

      <!-- Left nav -->
      <aside class="left-nav">
        <RouterLink to="/dataset"    class="nav-item" active-class="nav-active">Datasets</RouterLink>
        <RouterLink to="/variable"   class="nav-item" active-class="nav-active">Variables</RouterLink>
        <RouterLink to="/uitemplate" class="nav-item" active-class="nav-active"
          :class="{ 'nav-active': isUITemplateRoute }">UI Templates</RouterLink>

        <!-- Sub-nav shown when inside a specific UI template -->
        <template v-if="isUITemplateRoute && route.params.id">
          <RouterLink :to="`/uitemplate/${route.params.id}/details`"     class="nav-sub" active-class="nav-sub-active">- Details</RouterLink>
          <RouterLink :to="`/uitemplate/${route.params.id}/layout`"      class="nav-sub" active-class="nav-sub-active">- Layout</RouterLink>
          <RouterLink :to="`/uitemplate/${route.params.id}/datasource`" class="nav-sub" active-class="nav-sub-active">- Datasources</RouterLink>
          <RouterLink :to="`/uitemplate/${route.params.id}/adaptlibrary`" class="nav-sub" active-class="nav-sub-active">- Adapt Library</RouterLink>
<!--          <RouterLink :to="`/uitemplates/${route.params.id}/apis`"        class="nav-sub" active-class="nav-sub-active">- APIs</RouterLink>-->
<!--          <RouterLink :to="`/uitemplates/${route.params.id}/instances`"   class="nav-sub" active-class="nav-sub-active">Instances</RouterLink>-->
        </template>
        <RouterLink to="/deployment"   class="nav-item" active-class="nav-active">Deployments</RouterLink>
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <RouterView />
      </main>
    </div>

    <!-- Import JSON modal (shared, only relevant in editor context) -->
    <Teleport to="body">
      <div v-if="showImport" class="modal-overlay" @click.self="closeImport">
        <div class="import-modal">
          <h3 class="import-title">Import JSON</h3>
          <p class="import-hint">
            Paste a full template object <code>{"layout": {...}}</code> or just the layout object.
          </p>
          <textarea v-model="importText" class="import-textarea" placeholder="Paste JSON here…" spellcheck="false" />
          <p v-if="importError" class="import-error">{{ importError }}</p>
          <div class="import-actions">
            <button class="btn-save" @click="doImport">Import</button>
            <button class="btn-ghost" @click="closeImport">Cancel</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Top bar ── */
.top-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  height: 44px;
  background: #1e2a3a;
  color: #fff;
  flex-shrink: 0;
}

.brand {
  font-size: 18px;
  font-weight: 700;
  color: #7dd3fc;
  white-space: nowrap;
}

.sep { color: rgba(255,255,255,0.3); }

:deep(.breadcrumb) {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  margin: 0;
}

:deep(.breadcrumb-item) {
  border: none !important;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.user-name {
  font-size: 12px;
  color: rgba(255,255,255,0.55);
  padding-left: 8px;
  border-left: 1px solid rgba(255,255,255,0.2);
}

.mode-toggle {
  display: flex;
  background: rgba(255,255,255,0.1);
  border-radius: 5px;
  padding: 2px;
  gap: 2px;
}
.mode-btn {
  background: transparent;
  color: rgba(255,255,255,0.6);
  padding: 3px 10px;
  font-size: 11px;
  border-radius: 3px;
  font-weight: 500;
}
.mode-btn.active { background: #fff; color: #1e2a3a; }
.mode-btn:hover:not(.active) { color: #fff; }

.btn-save {
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 5px;
}
.btn-save:hover:not(:disabled) { background: #1d4ed8; }
.btn-save:disabled { opacity: 0.4; cursor: default; }

.btn-ghost {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 5px;
}
.btn-ghost:hover { background: rgba(255,255,255,0.2); }

.status-msg {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
}
.saved { background: #d1fae5; color: #065f46; }
.error { background: #fee2e2; color: #dc2626; }

/* ── App body ── */
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Left nav ── */
.left-nav {
  width: 140px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-item {
  display: block;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  transition: background 0.1s;
}
.nav-item:hover { background: #f3f4f6; }
.nav-active { color: #2563eb; background: #eff6ff; }

.nav-sub {
  display: block;
  padding: 5px 16px 5px 24px;
  font-size: 12px;
  color: #6b7280;
  text-decoration: none;
  transition: background 0.1s;
}
.nav-sub:hover { background: #f9fafb; color: #374151; }
.nav-sub-active { color: #dc2626; font-weight: 500; }

/* ── Main content ── */
.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Import modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.import-modal {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 640px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.import-title { font-size: 15px; font-weight: 600; color: #111; }
.import-hint { font-size: 12px; color: #6b7280; line-height: 1.5; }
.import-hint code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 11px; font-family: monospace; }
.import-textarea {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 10px;
  height: 300px;
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
  background: #1e1e1e;
  color: #d4d4d4;
}
.import-error { color: #dc2626; font-size: 12px; }
.import-actions { display: flex; gap: 8px; justify-content: flex-end; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
