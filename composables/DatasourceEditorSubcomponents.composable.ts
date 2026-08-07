import {computed, inject, ref} from "vue";
import {Ref} from "vue";
import {useRoute} from "vue-router";

export default function useDatasourceEditor() {
    const path = inject<Ref<string>>("path")
    const meta = inject<Ref<object>>("meta")
    const datasources = inject<Ref<object[]>>("datasources", ref<object[]>([]))
    const datasourceNames = computed<string[]>(() => Array.from(new Set(datasources.value.map(source => source.matchedObject.name).concat('monitor'))))
    const route  = useRoute()
    // Identified by the datasource's own path (?ds=), same as DatasourceEditor.vue —
    // not an array index, which is a position that can silently repoint after
    // any insert/remove elsewhere in the tree rebuilds `datasources`.
    const dsPath = (route.query.ds as string) ?? null
    const datasourceInfo = computed(() => datasources.value.find(d => d.path === dsPath)?.matchedObject ?? {})

    return {
        path,
        meta,
        datasources,
        datasourceNames,
        datasourceInfo,
    }
}