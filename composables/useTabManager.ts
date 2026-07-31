import { ref, computed, watch, nextTick } from 'vue'

export function useTabManager(mainPanel, { setValue, deleteNode, addChild }) {
  const tabList = computed(() => {
    if (!mainPanel.value) return []
    return (mainPanel.value['tab-array'] ?? [])
      .filter(k => mainPanel.value[k] != null)
      .map(k => ({ key: k, title: mainPanel.value[k]?.title ?? k }))
  })

  const activeTabIndex = ref(0)
  const activeTabKey   = computed(() => tabList.value[activeTabIndex.value]?.key ?? null)

  // watch(tabList, (list) => {
  //   if (activeTabIndex.value >= list.length) {
  //     activeTabIndex.value = Math.max(0, list.length - 1)
  //   }
  // }, { immediate: true })

  // ── Inline title editing 
  const editingTab = ref(null)
  const editTitle  = ref('')

  // Decoupled from meta: resetModel() in EditorWorkflow can replace meta.value
  // with server data at any time. localTabTitles survives that — it only syncs
  // when the main-panel object reference changes (full server reload).
  const localTabTitles = ref({})

  watch(() => mainPanel.value, (panel) => {
    if (!panel) return
    for (const k of (panel['tab-array'] ?? [])) {
      localTabTitles.value[k] = panel[k]?.title ?? k
    }
  }, { immediate: true })

  function startEdit(key, title) {
    editingTab.value = key
    editTitle.value  = localTabTitles.value[key] ?? title
  }

  function commitEdit() {
    const key   = editingTab.value
    const title = editTitle.value.trim()
    editingTab.value = null
    if (!key || !title) return
    localTabTitles.value[key] = title
    setValue(['viz', 'main-panel', key, 'title'], title)
  }

  // Create tab
  function createTab() {
    if (!mainPanel.value) return

    const existing = mainPanel.value?.['tab-array'] ?? []
    let n = existing.length + 1
    let key = `tab-${n}`
    while (mainPanel.value?.[key]) { n++; key = `tab-${n}` }

    const tabArrayLen = existing.length
    const tabsLen     = mainPanel.value?.['tabs']?.length ?? 0

    addChild(['viz', 'main-panel'], key, 'object')
    setValue(['viz', 'main-panel', key], {
      title: 'New Tab',
      component: 'TabWrapper',
      contents: [{
        component: 'GridContainer',
        layouts: [{ id: 'layout-1', rows: [{ size: '100', cells: [{ id: 'dashboard-cell-1-1' }] }] }],
        contents: [{ cell: 'dashboard-cell-1-1', component: 'BarChart', datasourceName: '/' }],
      }],
      datasources:       [{ name: '/', component: 'Datasource', 'dql-metrics': [], 'flat-table-target': '' }],
      'right-panel':     { 'tab-array': [], defaultTab: null },
      'generate-report': [],
    })
    addChild(['viz', 'main-panel', 'tab-array'], null, 'string')
    setValue(['viz', 'main-panel', 'tab-array', tabArrayLen], key)
    addChild(['viz', 'main-panel', 'tabs'], null, 'string')
    setValue(['viz', 'main-panel', 'tabs', tabsLen], key)

    localTabTitles.value[key] = 'New Tab'

    nextTick(() => {
      activeTabIndex.value = tabList.value.length - 1
      nextTick(() => startEdit(key, 'New Tab'))
    })
  }

  function deleteTab(key){
    const label = mainPanel.value?.[key]?.title ?? key
    if (!confirm(`Delete tab "${label}"?`)) return
    const arr  = mainPanel.value?.['tab-array'] ?? []
    const idx  = arr.indexOf(key)
    if (idx >= 0) deleteNode(['viz', 'main-panel', 'tab-array', idx])
    const tabs = mainPanel.value?.['tabs'] ?? []
    const tIdx = tabs.indexOf(key)
    if (tIdx >= 0) deleteNode(['viz', 'main-panel', 'tabs', tIdx])
    deleteNode(['viz', 'main-panel', key])
    nextTick(() => {
      if (activeTabIndex.value >= tabList.value.length) {
        activeTabIndex.value = Math.max(0, tabList.value.length - 1)
      }
    })
  }
  return {
    tabList,
    activeTabIndex,
    activeTabKey,
    localTabTitles,
    editingTab,
    editTitle,
    startEdit,
    commitEdit,
    createTab,
    deleteTab
  }
}
