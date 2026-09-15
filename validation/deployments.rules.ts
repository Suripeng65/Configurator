import {get, isEmpty} from 'lodash'

export function requiredSiteCode(meta){
    if(!meta?.siteCode) return 'siteCode is required.'
}

export function requiredContainerId(meta){
    if(!meta?.containerId) return 'ContainerId is required.'
}

export function requiredDataset(meta){
    if(!get(meta, ['datasetMetadata'], null) || isEmpty(meta.datasetMetadata)) return 'Dataset is required.'
}

export function requireUITemplate(meta){
    console.log(meta)
    if(!get(meta, ['templateConfig', 'uiTemplate', 'id'], null)) return 'UI Template is required.'
}

export function requireVariables(meta){
    if(!get(meta, ['templateConfig', 'columnTemplate', 'id'], null)) return 'Variables is required.'
}
