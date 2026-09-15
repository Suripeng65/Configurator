import { defineQueryOptions, useQuery, useMutation, useQueryCache } from '@pinia/colada'
import type { AxiosInstance } from 'axios'
import {synchronizeAppInfo} from '@src/utils/navigation.util'

export function useAppInfoQueries<T>(
    api: AxiosInstance,
) {
    const appInfoQuery = defineQueryOptions(() => ({
        key:['app-info'],
        query: () => {
            return api.get<T>('app/configuration').then((r) => {
                synchronizeAppInfo(r.data)
                return r.data
            })
        },
    }))
    const currentUserQuery = defineQueryOptions(()=>({
        key: ['current-user'],
        query: ()=>{
            return api.get<T>('app/getCurrentUser.json').then((r) => r.data)
        }
    }))

    function queryAppConfig(){
        return useQuery(appInfoQuery())
    }

    function queryCurrentUser(){
        return useQuery(currentUserQuery())
    }

    return {
        queryAppConfig,
        queryCurrentUser
    }
}