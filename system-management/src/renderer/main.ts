import {createApp} from 'vue'
import './style.css'
import App from './App.vue'

console.log(process.env.NODE_ENV === "development")
createApp(App).mount('#app')
