import {ref} from 'vue'

export function useCreateWithOverwriteConfirm(
    checkExists: ((name:string)=>Promise<boolean>) | undefined,
    rawCreate: (payload: any) => void
){
    const checkingExists = ref(false)
    const pendingPayload = ref(null)
    const pendingName = ref('')
    const showOverwriteConfirm = ref(false)

    async function create(payload:any){
        const name = payload?.name ?? ''
        if(!checkExists || !name){
            rawCreate(payload)
            return
        }

        checkingExists.value = true
        let exists = false
        try{
            exists = await checkExists(name)
        }catch{
            exists = false
        }finally{
            checkingExists.value = false
        }
        console.log("find exist", exists)
        if(exists){
            pendingPayload.value = payload
            pendingName.value = name
            showOverwriteConfirm.value = true
            return
        }
        rawCreate(payload)
    } 

    function confirmOverwrite(){
        if(pendingPayload.value === null) return
        showOverwriteConfirm.value = false
        rawCreate(pendingPayload.value)
        pendingPayload.value = null
        pendingName.value = ''
    }

    function cancelOverwrite(){
        showOverwriteConfirm.value = false
        pendingPayload.value = null
    }

    return {
        create, showOverwriteConfirm, pendingName, confirmOverwrite, cancelOverwrite
    }
}