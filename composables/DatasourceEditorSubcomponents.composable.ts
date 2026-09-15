import {computed, inject, ref} from "vue";
import {Ref} from "vue";
import {useRoute} from "vue-router";
import {get} from "lodash";

export default function useDatasourceEditor() {
    const path = inject<Ref<string>>("path")
    const meta = inject<Ref<object>>("meta")
    const datasources = inject<Ref<object[]>>("datasources", ref<object[]>([]))
    const datasourceNames = computed<string[]>(() => Array.from(new Set(datasources.value.map(source => source.matchedObject.name).concat('monitor'))))
    const route  = useRoute()
    const index = route.params.index ? parseInt(<string>route.params.index) : (datasources.value.findIndex(_data => get(_data, "matchedObject.name") === "/NewDatasource"))
    const datasourceInfo = computed(() => get(datasources.value,[index,"matchedObject"], {}))

    return {
        index,
        path,
        meta,
        datasources,
        datasourceNames,
        datasourceInfo,
    }
}