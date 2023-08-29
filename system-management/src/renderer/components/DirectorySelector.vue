<template lang="pug">
label(:for="props.title") {{ props.title }}
input(type="text" readonly :value="directory" :id="props.title" :placeholder="props.placeholder" :title="inputTip")
button(type="button" @click="buttonHandler") {{ props.buttonTitle }}
</template>
<script setup lang="ts">
import {dialog} from "@electron/remote"
import {ref, getCurrentInstance, computed} from "vue"

const props = withDefaults(defineProps<{
  title?: string,
  buttonTitle?: string,
  dialogTitle?: string,
  placeholder?: string,
  value?: string
}>(), {
  title: "",
  buttonTitle: "选择",
  dialogTitle: "请选择文件夹",
  placeholder: "",
  value: ""
})
const directory = ref(props.value)
const inputTip = computed(() => directory.value ? `You're selected ${directory.value}` : `Please select a directory for ${props.title}`)
const emits = defineEmits(["buttonClick", "pathChange"])

async function buttonHandler() {
  emits("buttonClick")
  const openResult = await dialog.showOpenDialog({
    title: props.dialogTitle,
    defaultPath: directory.value,
    properties: ["openDirectory"]
  })
  if (openResult.canceled) return false
  directory.value = openResult.filePaths[0]
  emits("pathChange", directory.value)
}
</script>
<script lang="ts">
export default {
  name: "DirectorySelector",
  data() {
    return {}
  }
}
</script>

<style scoped>

</style>
