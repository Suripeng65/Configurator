import { runRules, Violation } from './runner'
import * as uiTemplateRules from './uiTemplate.rules'
import * as variablesRules from './variables.rules'

export function validateUiTemplate(meta: any): Violation[] {
  return runRules(Object.values(uiTemplateRules), meta)
}

export function validateVariables(meta: any): Violation[] {
  return runRules(Object.values(variablesRules), meta)
}
