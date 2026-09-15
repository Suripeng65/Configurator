// Heuristic content scanner shared by uiTemplate.rules.ts and variables.rules.ts.
// This is a pattern/blocklist check — it catches obviously-malicious-looking
// content, but it is NOT a substitute for proper output encoding wherever
// this data eventually gets rendered, or for parameterized queries wherever
// it's persisted (the backend already uses parameterized queries throughout).
// Treat this as one layer of defense, not the only one.

interface PatternDef {
  name: string
  regex: RegExp
}

interface SuspiciousHit {
  path: string
  pattern: string
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

// Linked-list path node used by scanForPatterns' iterative walk — O(1) to
// push, materialized into a plain array only when a pattern actually
// matches (rare), not on every node visited (see materializePath).
type PathNode = { key: string | number, parent: PathNode } | null

function materializePath(node: PathNode): (string | number)[] {
  const parts: (string | number)[] = []
  let cur = node
  while (cur) {
    parts.push(cur.key)
    cur = cur.parent
  }
  return parts.reverse()
}

// Iterative (explicit stack, not recursion): a deeply nested meta object can
// blow the call stack in a recursive walk before the "too large" size check
// ever gets a chance to reject it. This has no such depth limit. The path is
// tracked as a linked list rather than an array rebuilt (via spread) at
// every node — that would make a single deep chain cost O(depth^2).
function scanForPatterns(value: unknown, patterns: PatternDef[], path: (string | number)[] = []): SuspiciousHit[] {
  const hits: SuspiciousHit[] = []
  let rootPathNode: PathNode = null
  for (const key of path) rootPathNode = { key, parent: rootPathNode }

  // Tracks visited objects/arrays so a circular reference gets skipped
  // instead of being pushed onto the stack forever (unbounded memory
  // growth, not a stack overflow, but just as much a hang/crash).
  const visited = new Set<unknown>()
  const stack: Array<{ node: unknown, pathNode: PathNode }> = [{ node: value, pathNode: rootPathNode }]

  while (stack.length) {
    const { node, pathNode } = stack.pop()!

    if (typeof node === 'string') {
      for (const { name, regex } of patterns) {
        if (regex.test(node)) {
          const fullPath = materializePath(pathNode)
          hits.push({ path: fullPath.join('.') || '(root)', pattern: name, value: node })
        }
      }
      continue
    }
    if (node && typeof node === 'object') {
      if (visited.has(node)) continue
      visited.add(node)

      if (Array.isArray(node)) {
        node.forEach((v, i) => stack.push({ node: v, pathNode: { key: i, parent: pathNode } }))
      } else {
        for (const [k, v] of Object.entries(node)) {
          stack.push({ node: v, pathNode: { key: k, parent: pathNode } })
        }
      }
    }
  }

  return hits
}

export function findSuspiciousScriptStrings(value: unknown, path: (string | number)[] = []): SuspiciousHit[] {
  return scanForPatterns(value, SCRIPT_PATTERNS, path)
}

export function findSuspiciousSqlStrings(value: unknown, path: (string | number)[] = []): SuspiciousHit[] {
  return scanForPatterns(value, SQL_PATTERNS, path)
}

// Formats hits into a single rule-violation message (used by both rule files).
export function describeSuspiciousStrings(hits: SuspiciousHit[], label = 'malicious'): string {
  const examples = hits.slice(0, 3).map(h => `${h.path} (${h.pattern})`).join('; '    )
  const more = hits.length > 3 ? `, and ${hits.length - 3} more` : ''
  return `Potentially ${label} content detected in ${hits.length} field(s): ${examples}${more}.`
}
