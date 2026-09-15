export function requiresName(meta){
    if(!meta?.name?.trim()) return "Dataset Name must be defined."
}
export function requireReleases(meta){
    if(!meta?.releases || meta?.releases.length === 0) return 'At lease one release must be defined.'
}
