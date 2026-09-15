// One function per rule. Each rule receives the full Variable `meta` object
// ({id, name, description, columns}) and returns a violation message string
// if it fails, or nothing if it passes. To add a rule, add another exported
// function here — nothing else needs to change.

import { findSuspiciousScriptStrings, findSuspiciousSqlStrings, describeSuspiciousStrings } from './security.util'
import { checkMetaSize } from './size.util'

export function requiresName(meta: any): string | void {
  if (!meta?.name?.trim()) return 'Variables name must be defined.'
}

export function requiresAtLeastOneColumn(meta: any): string | void {
  if (!meta?.columns?.length) return 'Columns must be defined.'
}

export function noDuplicateColumnNames(meta: any): string | void {
  const names = (meta?.columns ?? []).map((c: any) => c.columnName?.trim()).filter(Boolean)
  const duplicates = names.filter((n: string, i: number) => names.indexOf(n) !== i)
  if (duplicates.length) return `Duplicate column name(s): ${[...new Set(duplicates)].join(', ')}.`
}

export function requiresColumnNameRoleAndType(meta: any): string | void {
  const problems: string[] = []
  const columns = meta?.columns ?? []
  columns.forEach((col: any, i: number) => {
    const missing: string[] = []
    if (!col.columnName?.trim()) missing.push('Column Name')
    if (!col.role?.trim())       missing.push('Role')
    if (!col.type?.trim())       missing.push('Type')
    if (missing.length) {
      const label = col.columnName?.trim() || `row ${i + 1}`
      problems.push(`${label} is missing ${missing.join(', ')}`)
    }
  })
  if (problems.length) return `Every column needs a Column Name, Role, and Type — ${problems.join('; ')}.`
}

export function noScriptContent(meta: any): string | void {
  const hits = [
    ...findSuspiciousScriptStrings(meta?.name, ['name']),
    ...findSuspiciousScriptStrings(meta?.description, ['description']),
    ...findSuspiciousScriptStrings(meta?.columns, ['columns']),
  ]
  if (hits.length) return describeSuspiciousStrings(hits, 'malicious script')
}

export function noSqlInjectionContent(meta: any): string | void {
  const hits = [
    ...findSuspiciousSqlStrings(meta?.name, ['name']),
    ...findSuspiciousSqlStrings(meta?.description, ['description']),
    ...findSuspiciousSqlStrings(meta?.columns, ['columns']),
  ]
  if (hits.length) return describeSuspiciousStrings(hits, 'malicious SQL')
}

export function notTooLarge(meta: any): string | void {
  return checkMetaSize(meta)
}
