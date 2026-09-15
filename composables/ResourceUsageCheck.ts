import { deploymentsQueries } from '@src/queries'

export function useResourceUsageCheck() {
  const { data: deployments } = deploymentsQueries.useList()

  type ResourceType = 'uiTemplate' | 'dataset' | 'variables'
  interface IsResourceInUseParams {
    resourceType: ResourceType,
    resourceId: string
  }

  function isResourceInUse({resourceType, resourceId}: IsResourceInUseParams) {
    if (!deployments.value) return false
    let matched
    switch (resourceType) {
      case 'uiTemplate':
        matched = deployments.value.find((deployment) => {
          return deployment?.templateConfig?.uiTemplate?.id === resourceId && 
                deployment?.templateConfig?.uiTemplate?.id !== undefined
        })
        return deployments.value.some((deployment) => {
          return deployment?.templateConfig?.uiTemplate?.id === resourceId && 
                deployment?.templateConfig?.uiTemplate?.id !== undefined
        })
      case 'dataset':
        matched = deployments.value.find((deployment) => {
          return deployment?.datasetMetadata?.dsid === resourceId && 
                deployment?.datasetMetadata?.dsid !== undefined
        })
        return deployments.value.some((deployment) => {
          return deployment?.datasetMetadata?.dsid === resourceId && 
                deployment?.datasetMetadata?.dsid !== undefined
        })
      case 'variables':
        matched = deployments.value.find((deployment) => {
          return deployment?.templateConfig?.columnTemplate?.id === resourceId && 
                deployment?.templateConfig?.columnTemplate?.id !== undefined
        })
        return deployments.value.some((deployment) => {
          return deployment?.templateConfig?.columnTemplate?.id === resourceId && 
                deployment?.templateConfig?.columnTemplate?.id !== undefined
        })
      default: 
        return false
    }
  }

  return {
    isResourceInUse
  }
}