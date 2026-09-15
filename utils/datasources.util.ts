import {get, set} from "lodash";

// Linked-list path node used by findComponents' iterative walk — O(1) to
// push, materialized into a plain array only when needed (see materializePath).
type PathNode = { key: string | number, parent: PathNode } | null

function materializePath(node: PathNode): string[] {
    const parts: string[] = []
    let cur = node
    while (cur) {
        parts.push(String(cur.key))
        cur = cur.parent
    }
    return parts.reverse()
}

export function getScope(meta, path = []) {
    if (path[0] === 'viz' && path[1] === 'main-panel' && path[2] === 'datasources') {
        return "Global"
    }
    const idx = path.indexOf("datasources")
    if (idx < 0) return "Unknown"
    const subPath = path.slice(0, idx)
    const fallback = subPath[subPath.length - 1] ?? "Unknown"
    subPath.push("title")
    return get(meta.layout, subPath, fallback)
}

// Scope options shared by the Scope display (DatasourceEditor) and the
// scope picker when creating a new datasource (DatasourcesList): Global
// (viz.main-panel) plus every TabWrapper found in the layout.
export function getScopes(tabs: any[]) {
    return [{
        matchedObject: {title: "Global"},
        path: "viz.main-panel",
    }, ...tabs]
}

// Generates a datasource name that doesn't collide with `existingNames`,
// e.g. "/NewDatasource", then "/NewDatasource-2", "/NewDatasource-3", ...
export function uniqueDatasourceName(existingNames: string[], base = "/NewDatasource") {
    if (!existingNames.includes(base)) return base
    let n = 2
    while (existingNames.includes(`${base}-${n}`)) n++
    return `${base}-${n}`
}

export function existingNamesAt(meta, scopeArray: string[]) {
    const container = get(meta.value.layout, [...scopeArray, "datasources"]) ?? {}
    return Object.values(container).map((d: any) => d?.name).filter(Boolean)
}

// Inserts into whatever shape the target scope's `datasources` already uses
// (array or dict) so we never turn one scope's container into a mixed shape;
// a scope with no `datasources` yet gets a fresh dict (the current schema).
export function insertDatasource(meta, scopeArray: string[], datasourceObj: Record<string, any>) {
    // Last-resort guard: a dict-shaped container keys on `name`, so a missing
    // name would silently write the literal key "undefined" instead of
    // failing loudly. Refuse rather than corrupt the tree.
    if (!datasourceObj?.name) {
        console.error('insertDatasource: refusing to insert a datasource without a name', datasourceObj)
        return null
    }
    const container = get(meta.value.layout, [...scopeArray, "datasources"])
    if (Array.isArray(container)) {
        container.push(datasourceObj)
        return [...scopeArray, "datasources", container.length - 1]
    }
    set(meta.value.layout, [...scopeArray, "datasources", datasourceObj.name], datasourceObj)
    return [...scopeArray, "datasources", datasourceObj.name]
}

// Removes a datasource at `fullPathArray` (as returned by findComponents),
// splicing if the container is an array or deleting the key if it's a dict.
export function removeDatasource(meta, fullPathArray: (string | number)[]) {
    const key = fullPathArray[fullPathArray.length - 1]
    const parentPath = fullPathArray.slice(0, -1)
    const parent = get(meta.value.layout, parentPath)
    if (!parent) return
    if (Array.isArray(parent)) {
        parent.splice(key as number, 1)
    } else {
        delete parent[key]
    }
}

export function findComponents(layout: object, componentType: any, path: string[] = [], results: object[] = []): [{
    path: string,
    fullPathArray: string[]
    matchedObject: Record<string, any>
}] {
    // Iterative (explicit stack, not recursion): a deeply nested layout —
    // exactly the kind of thing the "too large" meta-size check is meant to
    // catch — can blow the call stack in a recursive walk before that check
    // ever gets a chance to run. This has no such depth limit.
    //
    // The path is tracked as a linked list, not an array rebuilt (via spread)
    // at every node — that would make a single deep chain cost O(depth^2)
    // instead of O(depth). The array is only materialized on an actual match,
    // which is rare relative to the total number of nodes visited.
    let rootPathNode: PathNode = null
    for (const key of path) rootPathNode = { key, parent: rootPathNode }

    // Tracks visited nodes so a circular reference gets skipped instead of
    // being pushed onto the stack forever (unbounded memory growth, not a
    // stack overflow, but just as much a hang/crash).
    const visited = new Set<any>()
    const stack: Array<{ node: any, pathNode: PathNode }> = [{ node: layout, pathNode: rootPathNode }]

    while (stack.length) {
        const { node, pathNode } = stack.pop()
        if (typeof node !== 'object' || node === null) continue
        if (visited.has(node)) continue
        visited.add(node)

        if (!Array.isArray(node) && node.component === componentType) {
            const fullPathArray = materializePath(pathNode)
            results.push({
                path: fullPathArray.join('.'), // Creates a dot-notation path string
                fullPathArray,
                matchedObject: node
            })
        }

        for (const key of Object.keys(node)) {
            const value = node[key]
            if (typeof value === 'object' && value !== null) {
                stack.push({ node: value, pathNode: { key, parent: pathNode } })
            }
        }
    }

    return results;
}