<script setup lang="ts">
import {ref, watch} from 'vue'
const props = defineProps({
    modelValue:{type:Boolean, default:false},
    title:{type:String, required:true},
    bodyText:{type:String, required:true},
    parseErrorMessage:{type:SVGStringList, default:"The pasted text must be valid JSON."},
    validate: {type:Function, default:()=>[]}
})
const emit = defineEmits<{
    (e:'import', parsed:any):void,
    (e:'update:modelValue', value:boolean):void
}>()

const text=ref('')
const errors=ref([])

watch(()=>props.modelValue, (open)=>{
    if(open){
        text.value=''
        errors.value=[]
    }
})

function commit(){
    let parsed:any
    try{
        parsed = JSON.parse(text.value)
    }catch{
        errors.value = [props.parseErrorMessage]
        return
    }
    const violations = props.validate(parsed) ?? []
    if(violations.length){
        errors.value = violations.map((v)=>v.message ?? String(v))
        return
    }
    errors.value = []
    emit('import', parsed)
    emit('update:modelValue', false)
}
</script>
<template>
    <BModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title"
    ok-title="Save"
    ok-variant="primary"
    cancel-variant="outline-secondary"
    @ok.prevent="commit"
    >
        <BAlert :model-value="errors.length > 0" variant="danger">
            <strong>The request was not completed for the following reason(s): </strong>
            <ul>
                <li v-for="(e, i) in errors" :key="i">
                    {{e}}
                </li>
            </ul>
        </BAlert>
        <p class="mb-2"> {{  bodyText }}</p>
        <BFormTextarea
            v-model="text" rows="12" class="font-monospace import-textarea" placeholder="Paste JSON here..."
        ></BFormTextarea>
    </BModal>
</template>
<style scoped>
.import-textarea {font-size:12px}
</style>