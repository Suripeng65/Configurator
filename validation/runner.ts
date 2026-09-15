export interface Violation {
  rule: string
  message: string
}

export type Rule = (entity: any) => string | void

// Runs a list of rule functions against an entity and collects violations.
// A rule is a function (entity) => string | void — it returns a human
// -readable message when it fails, or returns nothing when it passes.
// The rule's own function name is used to identify which rule fired, so
// name your rule functions descriptively (e.g. `requiresName`, not `rule1`).
export function runRules(rules: Rule[], entity: any): Violation[] {
  const violations: Violation[] = []
  for (const rule of rules) {
    let result: string | void
    try {
      result = rule(entity)
    } catch (e: any) {
      result = `Rule "${rule.name || 'unnamed'}" threw an error: ${e.message}`
    }
    if (result) {
      violations.push({ rule: rule.name || 'unnamed', message: result })
    }
  }
  return violations
}
