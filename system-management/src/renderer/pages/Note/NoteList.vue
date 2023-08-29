<template lang="pug">
  .contain-note-list
    .item-note-list(v-for="note in noteList")
      .item-note
        .title {{note.title}}
        .cotent {{note.content}}
    button.button {{props.buttonTitle}}
</template>
<script lang="ts" setup>
import {ref, reactive} from "vue"

interface Props {
  buttonTitle: string
}

interface Note {
  title: string
  content: string
}

const props = withDefaults(defineProps<Props>(), {
  buttonTitle: "下一页"
})

let noteFilter = reactive({
  pageIndex: 0
})
let noteList = reactive<Note[]>([])

function getNextNotePage() {
  noteFilter.pageIndex++

}
</script>
<script lang="ts">
export default {
  name: "NoteList"
}
</script>

<style scoped>

</style>
