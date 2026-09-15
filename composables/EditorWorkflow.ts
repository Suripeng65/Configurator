import {watch, provide,ref} from "vue";
import {useRoute} from "vue-router";
import {cloneDeep} from "lodash";
import {useCreateWithOverwriteConfirm} from '@src/composables/useCreateWithOverwriteConfirm'

export default function useEditorWorkflow(query, meta, validate?:(meta:any)=>Array<{rule:string,message:string}>) {
    const route  = useRoute()
    const id = route.params.id ? parseInt(<string>route.params.id) : null

    const { state, data, isLoading: loading, error } = query.useById(id)
    const { mutate: rawCreate, isLoading: creating, error: createError} = query.useCreate()
    const { mutate: rawUpdate, isLoading: updating, error: updateError} = query.useUpdate()
    const { mutate: remove, isLoading: removing, error: removeError } = query.useRemove()

    interface IViolationRule{
        rule:string,
        message:string
    }
    const violations = ref<Array<IViolationRule>>([])

    function runViolation():boolean{
        violations.value = validate ? validate(meta.value):[]
        return violations.value.length === 0
    }

    function resetModel() {
        meta.value = cloneDeep(data.value)
    }

    const{ 
        create: createWithOverwirteConfirm,
        showOverwriteConfirm,
        pendingName: pendingOverwriteName,
        confirmOverwrite,
        cancelOverwrite
    } = useCreateWithOverwriteConfirm(query.checkExists, rawCreate)

    function create(){
        if(!runViolation()) return
        createWithOverwirteConfirm(meta.value)
    }
    function update() {
        if(!runViolation()) return
        const {releases, ...payload} = meta.value
        rawUpdate(payload)
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
        runViolation,
        violations,
        showOverwriteConfirm,
        pendingOverwriteName,
        confirmOverwrite,
        cancelOverwrite
    }
}