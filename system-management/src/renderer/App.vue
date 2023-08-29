<template lang="pug">
div.container
  h1 {{ name }}
  span.sec-title {{ commonData.welcomeTitle }}
  .content
    .scroll-info
      span.item-info top: {{ scrollInfo.top }},
      span.item-info left: {{ scrollInfo.left }}
    .mouse-position
      span.item-info x: {{ mousePosition.x}},
      span.item-info y: {{ mousePosition.y}}
    files2video
      template(#content) content
</template>
<script setup lang="ts">
import {ref, reactive, watch, watchEffect, onMounted} from "vue"
import Files2video from "./features/Files2video.vue"
import {useScroll, useMousePosition} from "./utils/hooks"

enum Status {
  NoInit,
  Loading,
  Loaded,
  End,
  Error
}

interface States {
  welcomeTitle: string
  status: Status
}

const name = ref<string>("VideoCron")
const commonData = reactive<States>({
  welcomeTitle: `welcome to use ${name.value}`,
  status: Status.NoInit
})
const scrollInfo = useScroll()
const mousePosition = useMousePosition()
/*const stop = watchEffect(async onCleanup => {
  console.log("commonData.status change: " + commonData.status)
  onCleanup(() => {
    console.log("do clean")
  })
})*/
watch(() => commonData.status, (newVal, oldVal, onCleanup) => {
  //  newVal === oldVal
})
onMounted(() => {
  commonData.status = Status.Loaded
  //  只需要监听一次，之后停止监听
  // stop()
})
</script>
<style scoped>
</style>
