import { runRules } from "@src/validation/runner";
import * as uiTemplateRules from '@src/validation/uiTemplate.rules'
import * as variableRules from '@src/validation/variables.rules'
import * as datasetRules from '@src/validation/datasets.rules'
import * as deploymentRules from '@src/validation/deployments.rules'
export function validateUiTemplate(meta) {
    return runRules(Object.values(uiTemplateRules), meta)
}

export function validateVariables(meta) {
    return runRules(Object.values(variableRules), meta)
}

export function validateDatasets(meta) {
    return runRules(Object.values(datasetRules), meta)
}

export function validateDeployments(meta){
    return runRules(Object.values(deploymentRules), meta)
}