// Loose typing for a per-component JSON Schema document. Deliberately not a
// strict JSONSchema7 type — these documents lean on ajv's runtime behavior
// (allOf/$ref/oneOf resolution against the assembled $defs doc in index.ts)
// more than they need compile-time schema shape checking.
export interface AdaptComponentFieldSchema {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  default?: any
  items?: AdaptComponentFieldSchema
  properties?: Record<string, AdaptComponentFieldSchema>
  'x-widget'?: string
  [key: string]: any
}

export interface AdaptComponentSchema {
  title: string
  'x-catalog': {
    group: 'container' | 'filter' | 'other' | 'chart'
    nameKey?: string
  }
  type: 'object'
  allOf?: Array<{ $ref: string }>
  properties: Record<string, AdaptComponentFieldSchema>
  required?: string[]
}
