<template lang="pug">
.file2video
  slot(name="title")
  ul.list.list-select
    li.item.item-select(v-for="(s, sIndex) in selectors" :key="s.title")
      directory-selector(:title="s.title" :button-title="props.buttonTitle" :placeholder="s.placeholder" @pathChange="filePaths => pathChangeHandler(sIndex, filePaths)")
  slot(name="content")
  button.btn.btn-generate(:class="hasSelected ? ' active' : ' no-active'" @click="generateVideo") GENERATE
  slot(name="footer")
</template>
<style lang="sass" scoped>
.btn.active
  background: red
</style>
<script lang="ts" setup>
import {ipcRenderer} from "electron"
import {ref, reactive, computed, onMounted} from "vue"
import DirectorySelector from "../components/DirectorySelector.vue"

interface SelectorVal {
  title: string,
  desc: string,
  placeholder?: string,
  directoryPath: string
}

type SelectorKey = "general" | "widget" | "platform"
type Selector = Record<SelectorKey, Extract<SelectorVal, { key: string }>>

// type Props = { buttonTitle?: string } & Selector
interface Props {
  buttonTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  buttonTitle: "Select"
})
let selectors = reactive<SelectorVal[]>([
  {
    title: "General Folder:",
    desc: "the files in General will be used in all videos(Intro, Closer...)",
    directoryPath: ""
  },
  {
    title: "Widgets Folder:",
    desc: "a folder with files related to a platform",
    directoryPath: ""
  },
  {
    title: "Platform Folder:",
    desc: "a folder with sub-folders, each of them related to a different widget.",
    directoryPath: ""
  }
])
let videoPaths = reactive<string[]>([])

const hasSelected = computed(() => selectors.filter(selector => selector.directoryPath).length === selectors.length)

async function pathChangeHandler(index: number, directoryPath: string) {
  selectors[index].directoryPath = directoryPath
  // window.desktop.Files2videoPathChangeHandler(directoryPath)
  const result: { names: string[], paths: string[] } = await ipcRenderer.invoke("readFileInDirectory", directoryPath)
  videoPaths = result.paths.filter(path => path.match(/.(mp4|flv)$/) !== null)
}

async function generateVideo() {
  if (videoPaths.length === 0) {
    return Promise.reject("没有视频")
  }
  selectors.forEach(selector => selector.title = 'Please ' + selector.title.toLowerCase())
  return await ipcRenderer.invoke("mergeVideo", videoPaths.map(item => String(item)))
}

onMounted(async () => {
  const defaultDirectory = localStorage.getItem("Files2video:Directory")
  if (!defaultDirectory) return false
})
</script>
<script lang="ts">
export default {
  name: "Files2video"
}
</script>
