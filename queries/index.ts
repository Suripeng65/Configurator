// queries/index.ts
import { createResourceQueries } from './createResourceQueries'
import axios from 'axios'
import type { DatasetMetadata, ColumnTemplate, UiTemplate, Deployment } from '@src/types'

export const datasetsQueries = createResourceQueries<DatasetMetadata>('dataset-metadata', axios)
export const variablesQueries = createResourceQueries<ColumnTemplate>('column-template', axios)
export const uiTemplatesQueries = createResourceQueries<UiTemplate>('ui-template', axios)
export const deploymentsQueries = createResourceQueries<Deployment>('dataset-metadata-config', axios)