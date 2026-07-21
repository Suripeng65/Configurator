import {DatasetMetadata} from "@src/types/dataset.interface.ts";
import {ColumnTemplate} from "@src/types/variable.interface.ts";
import {UiTemplate} from "@src/types/ui-template.interface.ts";

export declare type DSID = string
export declare type ContainerId = string
export declare type SiteCode = string

export interface TemplateConfig {
    id: bigint
    uiTemplate: UiTemplate
    columnTemplate: ColumnTemplate
}

export interface Deployment {
    id: bigint
    site: SiteCode
    containerId: ContainerId
    datasetMetadata?: DatasetMetadata
    templateConfig: TemplateConfig
}