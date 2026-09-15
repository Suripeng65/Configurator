<script setup lang="ts">

  const props = defineProps<{
    showModal: boolean
    modalMsg: string
    modalTitle: string
  }>()

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  function handleConfirm() {
    console.log("CONFIRM")
    emit('confirm')
  }
  function handleCancel() {
    console.log("CANCEL")
    emit('cancel')
  }
</script>

<template>
  <BModal
    id="resource-in-use-modal"
    v-model="props.showModal"
    :title="modalTitle"
    @ok="handleConfirm"
    @cancel="handleCancel"
    ok-title="Confirm"
    cancel-title="Cancel"
  >
    <p>{{ modalMsg }}</p>
  </BModal>
</template>