// one function per rule. each rule received the full Variable meta
// and returns a violation message string if it fails
// or nothing if it passes. 
import {Column} from '@src/types/variable.interface'
import { findSuspiciousScriptInjection, findSuspiciousSqlInjection,generateMessage } from './security.util'
import { compareMetaSize } from "./fileSize.util"

export function requiresName(meta){
    if(!meta?.name?.trim()) return "Variables name must be defined."
}

export function requiredColumns(meta){
    if(!meta?.columns || meta?.columns.length === 0) return 'Columns must be defined.'
}

export function noDuplicatedColumnNames(meta){
    const names = (meta?.columns ?? []).map(c => c?.columnName.trim()).filter(Boolean)
    const duplicates = names.filter((n, i)=> names.indexOf(n) !== i)
    if(duplicates.length) return `Duplicate column name(s): ${[...new Set(duplicates)].join(', ')}. Column name cannot be a duplicate.`
}

export function requiredFieldsForEachColumn(meta){
    const problems = []
    const columns = meta?.columns ?? []
    columns.forEach((c:Column, i:number)=>{
        const missing = []
        if(!c.columnName?.trim()) missing.push('Column Name')
        if(!c.role?.trim()) missing.push('Role')
        if(!c.type?.trim()) missing.push('Type')
        if(missing.length){
            const label = "Column " + c.columnName?.trim() + ` at row ${i+1}` || `Column row ${i+1}`
            problems.push(`${label} is missing ${missing.join(', ')}`)
        }
    })
    if(problems.length) return `Every defined column needs a Column Name, Role and Type - ${problems.join('; ')}`
}

export function noScriptContent(meta:any): string|void {
    const identified=[]
    Object.keys(meta).forEach((key)=>{
        if(meta[key]) identified.push(...findSuspiciousScriptInjection(meta[key], [key]))
    })
    if(identified.length > 0) return generateMessage(identified)
}

export function noSqlInjectionContent(meta:any): string|void {
     const identified=[]
    Object.keys(meta).forEach((key)=>{
        if(meta[key]) identified.push(...findSuspiciousSqlInjection(meta[key], [key]))
    })
    if(identified.length > 0) return generateMessage(identified)
}

export function checkMetaSize(meta:any){
    return compareMetaSize(meta)
}