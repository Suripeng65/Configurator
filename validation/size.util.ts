// Shared by uiTemplate.rules.ts and variables.rules.ts — a template/variable
// set that's too large can freeze the browser tab (JSON.stringify running on
// every keystroke for the Export modal, deep recursive component-tree
// rendering, etc.), independent of whether its *content* is otherwise valid.
const MAX_META_BYTES = 2 * 1024 * 1024 // 2MB — generous for legitimate configs

// Iterative (explicit stack) byte-size estimate. Deliberately avoids
// JSON.stringify, which is itself recursive and can overflow the call stack
// on a deeply nested meta object before this check ever gets a chance to
// reject it. Tracks visited objects/arrays so a circular reference gets
// skipped instead of looping forever.
export function isMetadataUnderLimit(
  root: unknown,
  maxBytes: number = MAX_META_BYTES
): { isUnder: boolean; estimatedBytes: number } {
  if (root === undefined) return { isUnder: true, estimatedBytes: 0 }

  const visited = new Set<unknown>()
  const stack: unknown[] = [root]
  let estimatedBytes = 0

  while (stack.length > 0) {
    // Early exit if limit already exceeded
    if (estimatedBytes > maxBytes) {
      return { isUnder: false, estimatedBytes }
    }

    const current = stack.pop()

    if (current === null || current === undefined) {
      estimatedBytes += 4 // "null"
      continue
    }

    const type = typeof current

    if (type === 'string') {
      // +2 for quotes, approximate 1-4 bytes per char (averages ~1 byte for ASCII)
      estimatedBytes += (current as string).length + 2
    } else if (type === 'number' || type === 'boolean') {
      estimatedBytes += String(current).length
    } else if (type === 'object') {
      if (visited.has(current)) {
        continue // Skip circular reference
      }
      visited.add(current)

      if (Array.isArray(current)) {
        estimatedBytes += 2 // "[]"
        if (current.length > 1) {
          estimatedBytes += current.length - 1 // commas
        }
        for (let i = current.length - 1; i >= 0; i--) {
          stack.push(current[i])
        }
      } else {
        estimatedBytes += 2 // "{}"
        const entries = Object.entries(current as Record<string, unknown>)
        if (entries.length > 1) {
          estimatedBytes += entries.length - 1 // commas
        }

        for (const [key, value] of entries) {
          // Key length + quotes + colon: "key":
          estimatedBytes += key.length + 3
          stack.push(value)
        }
      }
    }
  }

  return {
    isUnder: estimatedBytes <= maxBytes,
    estimatedBytes,
  }
}

export function checkMetaSize(meta: unknown): string | void {
  const { isUnder, estimatedBytes } = isMetadataUnderLimit(meta)
  if (isUnder) return
  const mb = (estimatedBytes / 1024 / 1024).toFixed(1)
  const maxMb = MAX_META_BYTES / 1024 / 1024
  return `This is too large to safely edit here (~${mb}MB, max ${maxMb}MB) — it could freeze the browser. Consider splitting it into smaller templates.`
}
