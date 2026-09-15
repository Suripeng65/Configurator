<script setup lang="ts">

const props = defineProps({
    modelValue:{type:Boolean, default:false},
    name:{type:String, required:true},
    entityLabel:{type:String, required:false},
})
const emit = defineEmits<{
    (e:'import', parsed:any):void,
    (e:'update:confirm'):void
    (e:'update:cancel'):void
}>()

function ok(){
    emit('confirm')
}
function cancel(){
    emit('cancel')
}

</script>
<template>
    <BModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Warning"
    ok-title="Overwrite"
    ok-variant="danger"
    cancel-variant="outline-secondary"
    @ok.prevent="ok"
    @hide="cancel"
    >
        <p>
            A {{ entityLabel }} named "{{ name }}" already exists. Do you want to overwrite it?
        </p>
    </BModal>
</template>
<style scoped>
.import-textarea {font-size:12px}
</style>