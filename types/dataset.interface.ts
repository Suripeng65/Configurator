export declare type DSID = string
export declare type ContainerId = string
export declare type SiteCode = string

export interface DataRelease {
  name: string
  description?: string
  schemaName: string
  isDefault?: boolean
}

export interface DatasetMetadata {
  name: string
  description?: string
  dsid: DSID
  releases: DataRelease[],
  id: number | null
  uuid: string | null
  created: string
  modified: string
  createdBy: string
  modifiedBy: string,
  attributes?: Record<string, object>
}