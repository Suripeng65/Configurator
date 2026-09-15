export function getAtPath(obj: any, path: Array<string | number>) {
  return path.reduce((acc, k) => (acc != null ? acc[k] : undefined), obj)
}

function defaultForType(type: string) {
  const map = { string: '', number: 0, boolean: false, null: null, object: {}, array: [] }
  return map[type] ?? ''
}

export function useLayoutEditor(meta) {
  function setValue(path: Array<string | number>, value: any) {
    if (!meta?.value?.layout) return
    if (path.length === 0) {
      meta.value.layout = value
    } else {
      const parent = getAtPath(meta.value.layout, path.slice(0, -1))
      parent[path[path.length - 1]] = value
    }
  }

  function deleteNode(path: Array<string | number>) {
    if (!meta?.value?.layout) return
    const parentPath = path.slice(0, -1)
    const parent = parentPath.length === 0
      ? meta.value.layout
      : getAtPath(meta.value.layout, parentPath)
    const key = path[path.length - 1]
    if (Array.isArray(parent)) {
      parent.splice(key as number, 1)
    } else {
      delete parent[key]
    }
  }

  function addChild(path: Array<string | number>, key: string | number | null, type: string) {
    if (!meta?.value?.layout) return
    const target = path.length === 0
      ? meta.value.layout
      : getAtPath(meta.value.layout, path)
    const value = defaultForType(type)
    if (Array.isArray(target)) {
      target.push(value)
    } else {
      target[key as string] = value
    }
  }

  function moveItem(parentPath: Array<string | number>, fromIndex: number, toIndex: number) {
    if (!meta?.value?.layout) return
    const arr = parentPath.length === 0
      ? meta.value.layout
      : getAtPath(meta.value.layout, parentPath)
    const [item] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, item)
  }

  return { setValue, deleteNode, addChild, moveItem }
}
