<template>
  <div class="json-preview">
    <pre v-html="highlighted" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { default: null },
})

const highlighted = computed(() => {
  if (props.value == null) return ''
  const json = JSON.stringify(props.value, null, 2)
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'jn'
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'jk' : 'js'
      else if (/true|false/.test(match)) cls = 'jb'
      else if (/null/.test(match)) cls = 'jnull'
      return `<span class="${cls}">${match}</span>`
    }
  )
})
</script>

<style scoped>
.json-preview {
  background: #1e1e1e;
  height: 100%;
  overflow: auto;
  padding: 16px;
}

pre {
  margin: 0;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 11.5px;
  line-height: 1.6;
  color: #d4d4d4;
  white-space: pre;
}
</style>

<!-- Unscoped: v-html content is not reachable by scoped selectors -->
<style>
.json-preview pre .jk    { color: #9cdcfe; }
.json-preview pre .js    { color: #ce9178; }
.json-preview pre .jn    { color: #b5cea8; }
.json-preview pre .jb    { color: #569cd6; }
.json-preview pre .jnull { color: #569cd6; }
</style>
