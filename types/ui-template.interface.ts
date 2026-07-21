
export declare type DSID = string
export declare type ContainerId = string
export declare type SiteCode = string
export declare type UiTemplatePath = string

export interface UiTemplate {
  component?: string
  'generate-report'?: string[] | string
  'boost-point-threshold'?: number
  'boost-series-threshold'?: number
  'layers-config'?: Array<Record<string, any>>
  'geo-level'?: string
  'valid-group-by-options'?: string[]
  contents?: UiTemplate[]
  tabs?: string[]
  [key: string]: any // Flexible to accommodate dynamic properties
}

