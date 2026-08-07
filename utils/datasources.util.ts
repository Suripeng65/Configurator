import {get} from "lodash";

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

export function findComponents(layout: object, componentType: any, path: string[] = [], results: object[] = []): [{
    path: string,
    fullPathArray: string[]
    matchedObject: Record<string, any>
}] {
    // Return if the current target is not an object/array or is null
    if (typeof layout !== 'object' || layout === null) {
        return results;
    }

    // Iterate through all properties of the object/array
    for (const key: string | number in layout) {
        if (layout.hasOwnProperty(key)) {
            const currentPath: string[] = [...path, key];
            const currentValue: any = layout[key];

            // Check if this key/value pair matches the target
            if (key === "component" && currentValue === componentType) {
                results.push({
                    path: path.join('.'), // Creates a dot-notation path string
                    fullPathArray: path,
                    matchedObject: layout
                });
            }

            // Recursively search nested objects or arrays
            if (typeof currentValue === 'object' && currentValue !== null) {
                findComponents(currentValue, componentType, currentPath, results);
            }
        }
    }

    return results;
}