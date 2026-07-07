import { defineStore } from 'pinia'
import axios from 'axios'

const API = 'http://localhost:8000/api'

function getAtPath(obj, path) {
  return path.reduce((acc, k) => (acc != null ? acc[k] : undefined), obj)
}

function defaultForType(type) {
  const map = { string: '', number: 0, boolean: false, null: null, object: {}, array: [] }
  return map[type] ?? ''
}

export const useTemplateStore = defineStore('template', {
  state: () => ({
    template: null,
    templateList: [],
    isDirty: false,
    saveStatus: null,   // null | 'saving' | 'saved' | 'error'
    fetchError: null,
    mode: 'dev',        // 'dev' | 'user'
  }),

  actions: {
    setMode(mode) {
      this.mode = mode
    },

    setTemplateMeta({ name }) {
      if (!this.template) return
      if (name !== undefined) this.template.name = name
      this.isDirty = true
    },

    // Vue 3 Proxy reactivity: direct assignment triggers updates, no Vue.set needed
    setValue(path, value) {
      if (!this.template) return
      if (path.length === 0) {
        this.template.layout = value
      } else {
        const parent = getAtPath(this.template.layout, path.slice(0, -1))
        parent[path[path.length - 1]] = value
      }
      this.isDirty = true
    },

    // Rebuilds the parent object to preserve key insertion order after a rename
    renameKey(path, newKey) {
      if (!this.template) return
      const oldKey = path[path.length - 1]
      const parentPath = path.slice(0, -1)
      const parent = parentPath.length === 0
        ? this.template.layout
        : getAtPath(this.template.layout, parentPath)

      const rebuilt = {}
      for (const k of Object.keys(parent)) {
        rebuilt[k === oldKey ? newKey : k] = parent[k]
      }

      if (parentPath.length === 0) {
        this.template.layout = rebuilt
      } else {
        const grandparent = parentPath.length === 1
          ? this.template.layout
          : getAtPath(this.template.layout, parentPath.slice(0, -1))
        grandparent[parentPath[parentPath.length - 1]] = rebuilt
      }
      this.isDirty = true
    },

    deleteNode(path) {
      if (!this.template) return
      const parentPath = path.slice(0, -1)
      const parent = parentPath.length === 0
        ? this.template.layout
        : getAtPath(this.template.layout, parentPath)
      const key = path[path.length - 1]
      if (Array.isArray(parent)) {
        parent.splice(key, 1)
      } else {
        delete parent[key]
      }
      this.isDirty = true
    },

    addChild(path, key, type) {
      if (!this.template) return
      const target = path.length === 0
        ? this.template.layout
        : getAtPath(this.template.layout, path)
      const value = defaultForType(type)
      if (Array.isArray(target)) {
        target.push(value)
      } else {
        target[key] = value
      }
      this.isDirty = true
    },

    moveItem(parentPath, fromIndex, toIndex) {
      if (!this.template) return
      const arr = parentPath.length === 0
        ? this.template.layout
        : getAtPath(this.template.layout, parentPath)
      const [item] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, item)
      this.isDirty = true
    },

    copyNode(sourcePath, destKey) {
      if (!this.template) return
      const value = JSON.parse(JSON.stringify(getAtPath(this.template.layout, sourcePath)))
      const parentPath = sourcePath.slice(0, -1)
      const parent = parentPath.length === 0
        ? this.template.layout
        : getAtPath(this.template.layout, parentPath)

      if (Array.isArray(parent)) {
        const index = sourcePath[sourcePath.length - 1]
        parent.splice(index + 1, 0, value)
      } else {
        parent[destKey] = value
      }
      this.isDirty = true
    },

    replaceLayout(layout) {
      if (!this.template) return
      this.template.layout = layout
      this.isDirty = true
    },

    async fetchTemplateList() {
      try {
        const res = await axios.get(`${API}/templates`)
        this.templateList = res.data
      } catch {
        // best-effort, don't surface errors
      }
    },

    async fetchTemplate(id = 1) {
      try {
        const res = await axios.get(`${API}/templates/${id}`)
        this.template = res.data
        this.isDirty = false
        this.saveStatus = null
        this.fetchError = null
        this.fetchTemplateList()
      } catch {
        this.fetchError =
          'Cannot connect to the backend. Make sure the Python server is running:\n  cd backend && uvicorn main:app --reload'
      }
    },

    async saveTemplate() {
      if (!this.template) return
      this.saveStatus = 'saving'
      try {
        const t = this.template
        const res = await axios.put(`${API}/templates/${t.id}`, {
          name: t.name,
          description: t.description,
          layout: t.layout,
          modified_by: t.modifiedBy,
          attributes: t.attributes,
        })
        this.template = res.data
        this.isDirty = false
        this.saveStatus = 'saved'
        setTimeout(() => { this.saveStatus = null }, 2000)
        this.fetchTemplateList()
      } catch {
        this.saveStatus = 'error'
      }
    },

    async createTemplate({ name, description, layout }) {
      const res = await axios.post(`${API}/templates`, { name, description, layout })
      this.template = res.data
      this.isDirty = false
      this.saveStatus = null
      this.fetchError = null
      this.fetchTemplateList()
    },

    async deleteTemplate(id) {
      await axios.delete(`${API}/templates/${id}`)
      const remaining = this.templateList.filter(t => t.id !== id)
      this.templateList = remaining
      if (this.template && this.template.id === id) {
        if (remaining.length > 0) {
          await this.fetchTemplate(remaining[0].id)
        } else {
          this.template = null
        }
      }
    },
  },
})
