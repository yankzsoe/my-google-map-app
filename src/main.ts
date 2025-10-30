import { createApp } from 'vue'
import { createPinia } from 'pinia'

// @ts-ignore: No declaration file for .vue modules
import App from './App.vue'
import router from './router'
import 'leaflet/dist/leaflet.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
