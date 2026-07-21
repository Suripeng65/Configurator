import {watch, provide} from "vue";
import {useRoute} from "vue-router";
import {cloneDeep} from "lodash";

export default function useEditorWorkflow(query, meta) {
    const route  = useRoute()
    const id = route.params.id ? parseInt(<string>route.params.id) : null

    const { state, data, isLoading: loading, error } = query.useById(id)
    const { mutate: create, isLoading: creating, error: createError} = query.useCreate()
    const { mutate: update, isLoading: updating, error: updateError} = query.useUpdate()
    const { mutate: remove, isLoading: removing, error: removeError } = query.useRemove()

    function resetModel() {
        meta.value = cloneDeep(data.value)
    }

    watch(state, (newValue) => { if (newValue.data) resetModel(); })
    provide("meta", meta);
    provide("resetModel", resetModel);
    provide("loading",loading);
    provide("error",error);
    provide("create",create);
    provide("creating",creating);
    provide("createError",createError);
    provide("update",update);
    provide("updating",updating);
    provide("updateError",updateError);
    provide("remove",remove);
    provide("removing",removing);
    provide("removeError",removeError);

    return {
        id,
        meta,
        data,
        loading,
        error,
        create,
        creating,
        createError,
        update,
        updating,
        updateError,
        remove,
        removing,
        removeError,
        resetModel,
    }
}