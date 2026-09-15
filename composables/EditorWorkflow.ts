import {watch, provide, ref} from "vue";
import {useRoute} from "vue-router";
import {cloneDeep} from "lodash";
import {useCreateWithOverwriteConfirm} from "./useCreateWithOverwriteConfirm";

// `validate` is optional: (meta) => Array<{rule, message}>, e.g. validateUiTemplate
// from '@src/validation/index'. When provided, create/update run it first and
// skip the mutation (populating `violations` instead) if anything fails. Editors
// that don't pass a validator keep today's behavior exactly — this is opt-in.
export default function useEditorWorkflow(query, meta, validate?: (meta: any) => Array<{ rule: string, message: string }>) {
    const route  = useRoute()
    const id = route.params.id ? parseInt(<string>route.params.id) : null

    const { state, data, isLoading: loading, error } = query.useById(id)
    const { mutate: rawCreate, isLoading: creating, error: createError} = query.useCreate()
    const { mutate: rawUpdate, isLoading: updating, error: updateError} = query.useUpdate()
    const { mutate: remove, isLoading: removing, error: removeError } = query.useRemove()

    const violations = ref<Array<{ rule: string, message: string }>>([])

    function runValidation(): boolean {
        violations.value = validate ? validate(meta.value) : []
        return violations.value.length === 0
    }

    const {
        create: createWithOverwriteConfirm,
        showOverwriteConfirm,
        pendingName: pendingOverwriteName,
        confirmOverwrite,
        cancelOverwrite,
    } = useCreateWithOverwriteConfirm(query.checkExists, rawCreate)

    function create(payload) {
        if (!runValidation()) return
        createWithOverwriteConfirm(payload)
    }

    function update(payload) {
        if (!runValidation()) return
        rawUpdate(payload)
    }

    function resetModel() {
        meta.value = cloneDeep(data.value)
        violations.value = []
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
    provide("violations", violations);
    provide("showOverwriteConfirm", showOverwriteConfirm);
    provide("pendingOverwriteName", pendingOverwriteName);
    provide("confirmOverwrite", confirmOverwrite);
    provide("cancelOverwrite", cancelOverwrite);

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
        violations,
        showOverwriteConfirm,
        pendingOverwriteName,
        confirmOverwrite,
        cancelOverwrite,
    }
}