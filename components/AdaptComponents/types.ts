
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
