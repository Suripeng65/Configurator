import type { AdaptComponentFieldSchema, AdaptComponentSchema } from './types'

const SKIP_KEYS = new Set(['component', 'contents'])
const TYPE_DEFAULTS: Record<string, any> = { string: '', number: 0, boolean: false, array: [], object: {} }

// Property keys that belong to this component's own config, i.e. everything
// in `properties` except the structural `component`/`contents` keys.
export function getOwnFieldKeys(schema: AdaptComponentSchema | null | undefined): string[] {
  return Object.keys(schema?.properties ?? {}).filter(k => !SKIP_KEYS.has(k))
}

export function fieldSchema(schema: AdaptComponentSchema | null | undefined, key: string): AdaptComponentFieldSchema | null {
  return schema?.properties?.[key] ?? null
}

export function defaultForFieldSchema(fs: AdaptComponentFieldSchema | null | undefined): any {
  if (!fs) return ''
  if (fs.default !== undefined) return fs.default
  return TYPE_DEFAULTS[fs.type ?? 'string'] ?? ''
}

// Same dispatch ComponentNode.vue used to do against the old `field.type`
// enum, now reading standard JSON Schema `type`/`items.type` instead.
export function widgetKindFor(fs: AdaptComponentFieldSchema | null | undefined): string {
  if (!fs) return 'string'
  if (fs.type === 'boolean') return 'boolean'
  if (fs.type === 'number') return 'number'
  if (fs.type === 'array') {
    const itemType = fs.items?.type
    if (itemType === 'array') return 'array-of-arrays'
    if (itemType === 'object') return 'array-of-objects'
    return 'array-flat'
  }
  if (fs.type === 'object') return 'object-json'
  return 'string'
}

// Builds a brand-new layout-tree node from a component's schema: fills every
// own field with its default, adds the display-name key if the component
// declares one, and adds an empty `contents` array if this component is a
// container (i.e. its schema has a `contents` property).
export function buildNodeFromSchema(name: string, schema: AdaptComponentSchema | null | undefined, displayName?: string) {
  if (!schema) return { component: name }
  const config: Record<string, any> = { component: name }
  for (const key of getOwnFieldKeys(schema)) {
    config[key] = defaultForFieldSchema(fieldSchema(schema, key))
  }
  const nameKey = schema['x-catalog']?.nameKey
  if (displayName && nameKey) config[nameKey] = displayName
  if (schema.properties?.contents) config.contents = []
  return config
}

// Groups the registry by `x-catalog.group` for the "add child" picker UI.
export function groupedComponents(registry: Record<string, AdaptComponentSchema>) {
  const groups: Record<string, Array<{ key: string; label: string }>> = {}
  for (const [key, schema] of Object.entries(registry)) {
    const g = schema['x-catalog']?.group || 'other'
    ;(groups[g] ??= []).push({ key, label: schema.title || key })
  }
  return groups
}

// Generic recursive walk over the layout tree, visiting every node that has
// a `component` key. `path` is the array-of-keys/indices from `root`.
export function walkLayoutNodes(root: any, visit: (node: any, path: Array<string | number>) => void, path: Array<string | number> = []) {
  if (Array.isArray(root)) {
    root.forEach((child, i) => walkLayoutNodes(child, visit, [...path, i]))
    return
  }
  if (!root || typeof root !== 'object') return
  if (typeof root.component === 'string') visit(root, path)
  for (const key of Object.keys(root)) {
    const value = root[key]
    if (value && typeof value === 'object') walkLayoutNodes(value, visit, [...path, key])
  }
}
