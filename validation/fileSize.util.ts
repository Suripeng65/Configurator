const MAX_META_BYTES = 2 * 1024 * 1024 // 2MB — generous for legitimate configs

export function compareMetaSize(meta: unknown): string | void {
  let json: string | undefined
  try {
    json = JSON.stringify(meta)
  } catch {
    // A circular reference or a structure so deep it overflows the stack
    // while stringifying is, by definition, unsafe to keep editing here.
    return 'This could not be measured — it may be too large or too deeply nested to safely edit here. Consider splitting it into smaller templates.'
  }
  if (!json) return
  const sizeBytes = json.length // close enough to byte count for a threshold guard
  if (sizeBytes <= MAX_META_BYTES) return
  const mb = (sizeBytes / 1024 / 1024).toFixed(1)
  const maxMb = MAX_META_BYTES / 1024 / 1024
  return `This is too large to safely edit here (${mb}MB, max ${maxMb}MB) — it could freeze the browser. Consider splitting it into smaller templates.`
}
