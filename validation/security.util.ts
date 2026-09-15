import { values } from "lodash";

interface PatternDef{
    name:string,
    regex:RegExp,
}
interface IdentifiedInjection{
    path:string,
    pattern: string,
    value: string
}
const SCRIPT_PATTERNS: PatternDef[] = [
  { name: 'script tag',              regex: /<script\b[^>]*>/i },
  { name: 'javascript: URI',         regex: /javascript:/i },
  { name: 'inline event handler',    regex: /\bon[a-z]+\s*=\s*['"]/i },
  { name: 'iframe tag',              regex: /<iframe\b[^>]*>/i },
  { name: 'embedded object/embed tag', regex: /<\s*(object|embed)\b[^>]*>/i },
]

const SQL_PATTERNS: PatternDef[] = [
  { name: 'SQL statement keyword',   regex: /\b(select\s+.+\s+from|insert\s+into|update\s+\S+\s+set|delete\s+from|drop\s+table|alter\s+table|union\s+select|exec(ute)?\s*\()\b/i },
  { name: 'SQL comment/terminator injection', regex: /(--|\/\*|;)\s*(drop|delete|update|insert|select)\b/i },
  { name: 'tautology injection',     regex: /\bor\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i },
]

function scanForPatterns(value: unknown, patterns: PatternDef[], path: (string | number)[] = []): SuspiciousHit[] {
  const identified: IdentifiedInjection[] = []
  const stack: Array<{ node: unknown, nodePath: (string | number)[] }> = [{ node: value, nodePath: path }]

  while (stack.length) {
    const { node, nodePath } = stack.pop()!

    if (typeof node === 'string') {
      for (const { name, regex } of patterns) {
        if (regex.test(node)) {
          identified.push({ path: nodePath.join('.') || '(root)', pattern: name, value: node })
        }
      }
      continue
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => stack.push({ node: v, nodePath: [...nodePath, i] }))
      continue
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        stack.push({ node: v, nodePath: [...nodePath, k] })
      }
    }
  }

  return identified
}
// function scanForPatterns(value:any, patterns: PatternDef[], path: (string | number)[]): IdentifiedInjection[]{
//     const identified=[]
//     if(typeof value === 'string'){
//         for (const pattern of patterns) {
//             if (pattern.regex.test(value)) {
//                 identified.push({
//                     pattern: pattern.name,
//                     path: path.join('.'),
//                     value
//                 });
//             }
//         }
//     }
//     if(Array.isArray(value)){
//         value.forEach((v, i)=>{
//             identified.push(...scanForPatterns(v, patterns, [...path, i]));
//         });
//     } else if (typeof value === 'object' && value !== null) {
//         for (const key in value) {
//             identified.push(...scanForPatterns(value[key], patterns, [...path, key]));
//         }
//     }
//     return identified;
// }
export function findSuspiciousSqlInjection(value:any, path: (string | number)[]):IdentifiedInjection[]{
  return scanForPatterns(value, SQL_PATTERNS, path)
    
}

export function findSuspiciousScriptInjection(value:any, path: (string | number)[]):IdentifiedInjection[]{
    return scanForPatterns(value, SCRIPT_PATTERNS, path)
}

export function generateMessage( identified: IdentifiedInjection[]){
    if (!identified.length) return '';
    return identified
        .map(i => `Suspicious ${i.pattern} detected at "${i.path}": ${i.value}`)
        .join('\n');
}