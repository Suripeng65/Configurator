import { ref } from 'vue'

// Wraps a `create` mutation with a pre-flight name-existence check. If the
// name is already taken, the actual create is held until the caller confirms
// via confirmOverwrite() — the assumption is the backend upserts by name, so
// confirming just resends the same payload.
export function useCreateWithOverwriteConfirm(
  checkExists: ((name: string) => Promise<boolean>) | undefined,
  rawCreate: (payload: any) => void,
) {
  const showOverwriteConfirm = ref(false)
  const pendingPayload = ref<any>(null)
  const pendingName = ref('')
  const checkingExists = ref(false)

  async function create(payload: any) {
    const name = payload?.name ?? ''
    if (!checkExists || !name) {
      rawCreate(payload)
      return
    }

    checkingExists.value = true
    let exists = false
    try {
      exists = await checkExists(name)
    } catch {
      // Best-effort: if the exists check itself fails, don't block the save.
      exists = false
    } finally {
      checkingExists.value = false
    }

    if (exists) {
      pendingPayload.value = payload
      pendingName.value = name
      showOverwriteConfirm.value = true
      return
    }

    rawCreate(payload)
  }

  function confirmOverwrite() {
    showOverwriteConfirm.value = false
    if (pendingPayload.value) rawCreate(pendingPayload.value)
    pendingPayload.value = null
  }

  function cancelOverwrite() {
    showOverwriteConfirm.value = false
    pendingPayload.value = null
  }

  return {
    create,
    showOverwriteConfirm,
    pendingName,
    checkingExists,
    confirmOverwrite,
    cancelOverwrite,
  }
}
