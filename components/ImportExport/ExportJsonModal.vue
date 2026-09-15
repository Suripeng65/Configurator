<script setup lang="ts">
import {ref, watch} from 'vue'

const props = defineProps({
    modelValue:{type:Boolean, default:false},
    title:{type:String, required:true},
    bodyText:{type:String, required:true},
    json:{type:String, required:true}
})
const emit = defineEmits<{
    (e:'update:modelValue', value:boolean):void
}>()


const copied = ref(false)

watch(()=>props.modelValue, (open)=>{
    console.log('export json')
    if(open){
       copied.value = false
    }
})

async function copy(){
    try{
        await navigator.clipboard.writeText(props.json)
        copied.value=true
    } catch {
        copied.value = false
    }
}
</script>
<template>
    <BModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    ok-title="Copy"
    ok-variant="primary"
    cancel-variant="outline-secondary"
    @ok.prevent="copy"
    >
        <BAlert :model-value="copied" variant="success">
            Copied to clipboard!
        </BAlert>
        <p class="mb-2"> {{  bodyText }}</p>
        <BFormTextarea
            :model-value="json" rows="14" class="font-monospace export-textarea" readonly placeholder="Paste JSON here..." disabled
        ></BFormTextarea>
    </BModal>
</template>
<style scoped>
.export-textarea {font-size:12px}
</style>