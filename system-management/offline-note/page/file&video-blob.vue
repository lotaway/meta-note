<template>
  <div class="contain">
    <p>Upload Image</p>
    <img :src="imageFile" alt="temp image blob"/>
    <input type="file" @change="onFileChange"/>
  </div>
</template>
<script>
export default {
  data() {
    return {
      imageFile: ""
    }
  },
  methods: {
    onFileChange(event) {
      //  image show with blob to url api
      const file = event.target.file;
      const urlToBlobImage = URL.createObjectURL(file);
      this.imageFile = urlToBlobImage;
      URL.revokeObjectURL(urlToBlobImage);
    },
    // [Video Stream](https://blog.csdn.net/qq_42374676/article/details/121031358)
    // [MediaS]https://developer.mozilla.org/zh-CN/docs/Web/API/MediaSource
    showVideoWithSteam() {
      if ("mediaSource" in window) {
        //  just create an empty sourceBuffer[]
        const mediaSource = new MediaSource();
        //  add a new sourceBuffer with encode, webm means steam flow, 'video/mp4' means normal video with type mp4
        mediaSource.addSourceBuffer = 'video/webm; codecs="vorbis,vp8"';
      }
    }
  }
};
</script>
