<template>
  <div class="tree-node">
    <div
      class="node-row"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      <!-- Expand / collapse toggle -->
      <button
        v-if="isExpandable"
        class="toggle-btn"
        @click="expanded = !expanded"
        :aria-label="expanded ? 'Collapse' : 'Expand'"
      >
        <span :class="['arrow', { expanded }]">▶</span>
      </button>
      <span v-else class="toggle-placeholder" />

      <!-- Key label -->
      <span v-if="!isRoot" class="key-area">
        <span v-if="isArrayItem" class="array-index">[{{ nodeKey }}]</span>
        <template v-else>
          <input
            v-if="editingKey"
            ref="keyInput"
            v-model="pendingKey"
            class="key-input"
            @blur="commitKeyRename"
            @keyup.enter="commitKeyRename"
            @keyup.escape="cancelKeyRename"
          />
          <span
            v-else
            class="key-label"
            title="Double-click to rename"
            @dblclick="startKeyEdit"
          >{{ nodeKey }}</span>
        </template>
        <span v-if="!isExpandable" class="colon">:&thinsp;</span>
      </span>

      <!-- Primitive value -->
      <ValueEditor v-if="!isExpandable" :value="nodeValue" @change="setValue" />

      <!-- Object / array summary badge -->
      <span
        v-else
        :class="['type-badge', isArray ? 'badge-array' : 'badge-object']"
        @click="expanded = !expanded"
      >
        {{ isArray ? `[ ${nodeValue.length} ]` : `{ ${keyCount} }` }}
      </span>

      <!-- Action buttons -->
      <span class="node-actions" :class="{ visible: hovered }">
        <button v-if="isExpandable" class="action-btn" title="Add child field" @click.stop="showAddChild = !showAddChild">+</button>
        <button v-if="isExpandable && !isRoot" class="action-btn copy-btn" title="Duplicate node" @click.stop="startCopy">⎘</button>
        <template v-if="isArrayItem">
          <button v-if="nodeKey > 0" class="action-btn" title="Move up" @click.stop="moveUp">↑</button>
          <button v-if="!isLastItem" class="action-btn" title="Move down" @click.stop="moveDown">↓</button>
        </template>
        <button v-if="!isRoot" class="action-btn delete-btn" title="Delete" @click.stop="deleteNode">✕</button>
      </span>
    </div>

    <!-- Copy-as form (object nodes only — array items duplicate immediately) -->
    <div v-if="showCopyForm" class="copy-form">
      <span class="copy-label">Copy as:</span>
      <input
        ref="copyInput"
        v-model="copyDestKey"
        placeholder="new key name"
        class="input-sm"
        @keyup.enter="confirmCopy"
        @keyup.escape="cancelCopy"
      />
      <button class="btn-add" @click="confirmCopy">Duplicate</button>
      <button class="btn-cancel" @click="cancelCopy">Cancel</button>
    </div>

    <!-- Add-child form -->
    <div v-if="showAddChild" class="add-child-form">
      <input
        v-if="!isArray"
        v-model="newChildKey"
        placeholder="key name"
        class="input-sm"
        @keyup.enter="addChild"
        @keyup.escape="cancelAddChild"
      />
      <select v-model="newChildType" class="input-sm select-sm">
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="null">null</option>
        <option value="object">object {}</option>
        <option value="array">array []</option>
      </select>
      <button class="btn-add" @click="addChild">Add</button>
      <button class="btn-cancel" @click="cancelAddChild">Cancel</button>
    </div>

    <!-- Children — self-reference works via filename in Vue 3 SFC -->
    <div v-if="expanded && isExpandable" class="children">
      <template v-if="isArray">
        <TreeNode
          v-for="(item, index) in nodeValue"
          :key="index"
          :node-key="index"
          :node-value="item"
          :node-path="childPath(index)"
          :is-array-item="true"
          :is-last-item="index === nodeValue.length - 1"
        />
      </template>
      <template v-else>
        <TreeNode
          v-for="key in Object.keys(nodeValue)"
          :key="key"
          :node-key="key"
          :node-value="nodeValue[key]"
          :node-path="childPath(key)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useTemplateStore } from '@src/stores/template'
import ValueEditor from './ValueEditor.vue'

const props = defineProps({
  nodeKey:     { type: [String, Number], default: null },
  nodeValue:   { default: null },
  nodePath:    { type: Array, default: () => [] },
  isRoot:      { type: Boolean, default: false },
  isArrayItem: { type: Boolean, default: false },
  isLastItem:  { type: Boolean, default: false },
})

const store = useTemplateStore()

const expanded = ref(props.isRoot)
const hovered = ref(false)
const editingKey = ref(false)
const pendingKey = ref('')
const showAddChild = ref(false)
const newChildKey = ref('')
const newChildType = ref('string')
const keyInput = ref(null)
const showCopyForm = ref(false)
const copyDestKey = ref('')
const copyInput = ref(null)

const isExpandable = computed(() =>
  props.nodeValue !== null && props.nodeValue !== undefined && typeof props.nodeValue === 'object'
)
const isArray = computed(() => Array.isArray(props.nodeValue))
const keyCount = computed(() =>
  isExpandable.value && !isArray.value ? Object.keys(props.nodeValue).length : 0
)

function childPath(key) { return [...props.nodePath, key] }

function setValue(newValue) {
  store.setValue(props.nodePath, newValue)
}

async function startKeyEdit() {
  pendingKey.value = String(props.nodeKey)
  editingKey.value = true
  await nextTick()
  keyInput.value?.focus()
  keyInput.value?.select()
}

function commitKeyRename() {
  const trimmed = pendingKey.value.trim()
  if (trimmed && trimmed !== String(props.nodeKey)) {
    store.renameKey(props.nodePath, trimmed)
  }
  editingKey.value = false
}

function cancelKeyRename() { editingKey.value = false }

function deleteNode() {
  if (window.confirm(`Delete "${props.nodeKey}"?`)) {
    store.deleteNode(props.nodePath)
  }
}

function moveUp() {
  store.moveItem(props.nodePath.slice(0, -1), props.nodeKey, props.nodeKey - 1)
}

function moveDown() {
  store.moveItem(props.nodePath.slice(0, -1), props.nodeKey, props.nodeKey + 1)
}

function addChild() {
  if (!isArray.value && !newChildKey.value.trim()) return
  store.addChild(props.nodePath, newChildKey.value.trim(), newChildType.value)
  expanded.value = true
  cancelAddChild()
}

function cancelAddChild() {
  showAddChild.value = false
  newChildKey.value = ''
  newChildType.value = 'string'
}

async function startCopy() {
  if (props.isArrayItem) {
    // Array items: duplicate immediately, no key needed
    store.copyNode(props.nodePath, null)
    return
  }
  copyDestKey.value = String(props.nodeKey) + '_copy'
  showCopyForm.value = true
  await nextTick()
  copyInput.value?.focus()
  copyInput.value?.select()
}

function confirmCopy() {
  const key = copyDestKey.value.trim()
  if (!key) return
  store.copyNode(props.nodePath, key)
  cancelCopy()
}

function cancelCopy() {
  showCopyForm.value = false
  copyDestKey.value = ''
}
</script>

<style scoped>
.tree-node {
  font-family: "Fira Code", "Consolas", "Courier New", monospace;
  font-size: 12px;
}

.node-row {
  display: flex;
  align-items: center;
  padding: 2px 6px 2px 0;
  border-radius: 3px;
  min-height: 24px;
  gap: 2px;
}
.node-row:hover { background: #f0f4ff; }

.toggle-btn {
  background: none;
  width: 18px;
  height: 18px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #555;
}
.toggle-btn:hover { color: #000; }

.toggle-placeholder { width: 18px; flex-shrink: 0; display: inline-block; }

.arrow {
  display: inline-block;
  font-size: 9px;
  transition: transform 0.15s;
  line-height: 1;
}
.arrow.expanded { transform: rotate(90deg); }

.key-area { display: inline-flex; align-items: center; flex-shrink: 0; }

.key-label {
  color: #0550ae;
  font-weight: 600;
  cursor: default;
  border-radius: 2px;
  padding: 0 2px;
}
.key-label:hover { background: #dbeafe; cursor: text; }

.array-index { color: #6b7280; font-size: 11px; margin-right: 2px; }

.key-input {
  border: 1px solid #0066cc;
  padding: 0 4px;
  width: 120px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #0550ae;
  background: #fff;
}

.colon { color: #888; }

.type-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  font-family: -apple-system, sans-serif;
}
.badge-object { background: #e8f0fe; color: #1a56db; }
.badge-array  { background: #fef3c7; color: #92400e; }

.node-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 6px;
  opacity: 0;
  transition: opacity 0.1s;
}
.node-actions.visible { opacity: 1; }

.action-btn {
  background: #e8eaed;
  color: #333;
  width: 20px;
  height: 20px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}
.action-btn:hover { background: #d0d0d0; }
.delete-btn:hover { background: #fee2e2; color: #dc2626; }
.copy-btn:hover   { background: #d1fae5; color: #065f46; }

.copy-form {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 26px;
  background: #f0fdf4;
  border-left: 2px solid #86efac;
  margin: 2px 0;
}

.copy-label {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  font-family: -apple-system, sans-serif;
}

.add-child-form {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 26px;
  background: #f8faff;
  border-left: 2px solid #bfdbfe;
  margin: 2px 0;
}

.input-sm { border: 1px solid #ccc; padding: 3px 6px; font-size: 12px; background: #fff; }
.select-sm { cursor: pointer; }

.btn-add { background: #0066cc; color: #fff; padding: 3px 10px; font-size: 11px; }
.btn-add:hover { background: #0052a3; }
.btn-cancel { background: transparent; color: #666; padding: 3px 8px; font-size: 11px; }
.btn-cancel:hover { color: #333; }

.children {
  padding-left: 18px;
  border-left: 1px solid #e5e7eb;
  margin-left: 9px;
}
</style>
