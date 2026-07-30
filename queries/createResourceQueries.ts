// queries/createResourceQueries.ts
import { defineQueryOptions, useQuery, useMutation, useQueryCache } from '@pinia/colada'
import type { AxiosInstance } from 'axios'
import {MaybeRefOrGetter, toValue, computed} from "vue";

export function createResourceQueries<T extends { id: string }>(
    resource: string,
    api: AxiosInstance,
) {
    const KEYS = {
        root: [resource] as const,
        list: () => [...KEYS.root, 'list'] as const,
        byId: (id: string) => [...KEYS.root, id] as const,
    }

    const listQuery = defineQueryOptions({
        key: KEYS.list(),
        query: () => {
            if (resource === 'dataset-metadata-config') {
                return api.get<T[]>(`/${resource}/all`, { params: { dto: 'full' } }).then((r) => r.data)
            }
            return api.get<T[]>(`/${resource}/all`).then((r) => r.data)
        },
        staleTime: 0, // Always consider data stale, refetch on mount
    })

    const byIdQuery = defineQueryOptions((id: string) => ({
        key: KEYS.byId(id),
        query: () => {
            console.log(resource, id)
            if (id) return api.get<T>(`/${resource}/${id}`, {params: {dto: "full"}}).then((r) => r.data)
            return Promise.resolve({})
        },
    }))

    function useList() {
        return useQuery(listQuery)
    }

    function useById(id: MaybeRefOrGetter<string | number | null>) {
        return useQuery(() => {
            const idValue = toValue(id)
            console.log('useById called with id:', idValue)
            if (!idValue) {
                return defineQueryOptions({
                    key: [...KEYS.root, 'null'],
                    query: () => Promise.resolve(null)
                })
            }
            console.log('Fetching', resource, 'with id:', idValue)
            return byIdQuery(String(idValue))
        })
    }

    function useCreate() {
        const cache = useQueryCache()
        return useMutation({
            mutation: (payload: Partial<T>) => {
                const body = { ...payload }
                if ((body as any).id == null) delete (body as any).id
                return api.post<T>(`/${resource}`, body).then((r) => r.data)
            },
            onSettled() {
                cache.invalidateQueries({ key: KEYS.list() })
            },
        })
    }

    function useUpdate() {
        const cache = useQueryCache()
        return useMutation({
            mutation: (payload: T) => api.put<T>(`/${resource}/${payload.id}`, payload).then((r) => r.data),
            onSettled(updated) {
                cache.invalidateQueries({ key: KEYS.list() })
                if (updated) cache.invalidateQueries({ key: KEYS.byId(updated.id) })
            },
        })
    }

    function useRemove() {
        const cache = useQueryCache()
        return useMutation({
            mutation: (id: string) => {
                console.log("Removing " + resource + `(${id})`)
                return api.delete(`/${resource}/${id}`)
            },
            onSettled(_data, _error, id) {
                cache.invalidateQueries({ key: KEYS.list() })
                cache.invalidateQueries({ key: KEYS.byId(id) })
            },
        })
    }

    return { KEYS, useList, useById, useCreate, useUpdate, useRemove }
}