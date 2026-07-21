<script setup lang="ts">
import DatasourcesPanel from '@src/components/user/DatasourcesPanel.vue'
</script>

<template>
  <DatasourcesPanel />
</template>

<style scoped>
.editor-wrap {
  display: flex;
  flex: 1;
  overflow: hidden;
  flex-direction: column;
}

.state-msg { padding: 40px; text-align: center; color: #6b7280; font-size: 14px; }

.error-state {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #dc2626;
  text-align: center;
}
.error-state pre {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  color: #7f1d1d;
  white-space: pre-wrap;
  max-width: 480px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px 48px;
  text-align: center;
}
.empty-icon { font-size: 40px; }
.empty-card h3 { font-size: 16px; font-weight: 700; color: #111; margin: 0; }
.empty-card p  { font-size: 13px; color: #6b7280; margin: 0; }

/* Split pane (same as old ConfigEditor) */
.split-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.split-container.is-dragging { cursor: col-resize; user-select: none; }

.tree-pane {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  min-width: 200px;
}
.preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 160px;
}
.splitter {
  flex: 0 0 6px;
  background: #e5e7eb;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.splitter:hover, .split-container.is-dragging .splitter { background: #c7d2fe; }
.splitter-dots {
  width: 2px;
  height: 32px;
  border-radius: 2px;
  background: repeating-linear-gradient(to bottom, #9ca3af 0px, #9ca3af 3px, transparent 3px, transparent 6px);
}
.pane-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.copy-icon-btn { background: none; color: #9ca3af; font-size: 14px; padding: 0; line-height: 1; }
.copy-icon-btn:hover { color: #374151; }
.tree-scroll { flex: 1; overflow: auto; padding: 8px 4px 24px 8px; }

.coming-soon {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}
</style>
