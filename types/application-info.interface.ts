export type Username = string
export type Zonename = string
export type UUID = string
export type Email = string

export interface UserInfo {
    qualifiedUsername: Username
    delegatedZoneName: Zonename
    username: Username
    name: Username
    uuid: UUID
    authorities: string[]
}

export interface AdaptInfo {
    name: string
    uuid: UUID
    appName: string
    allowedApis: string
    zoneName: Zonename
    siteCode: SiteCode
    containerId: ContainerId
    disclaimerURL: URL
    appendicesSubtext: string
    csvDownloadLink: string
    appColor: string | null,
    timeoutUrl: URL
    sessionTimeOutWarningInSeconds: number
    supportNewRequestUrl: URL
    sessionTimeOutInSeconds: number
    paginationPageSize: number
    appComponent: string
    appFullName: string
    datasetStyle: string
    userSetting: true
    userName: Username
    appDownloadPath: string
    version: string
    clientAbbr: string
    gatewayAuthStrategy: string
    supportEmail: Email
    appendicesLink: URL
    appDeployDate: string | Date | null
    supportMyRequestURL: URL
    logoutUrl: URL
}