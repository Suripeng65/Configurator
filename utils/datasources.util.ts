import {get} from "lodash";

export function getScope(meta, path = []) {
    if (path[0] === 'viz' && path[1] === 'main-panel' && path[2] === 'datasources') {
        return "Global"
    }
    const idx = path.indexOf("datasources")
    const subPath = path.slice(0, idx)
    subPath.push("title")
    return get(meta.layout, subPath, idx)
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