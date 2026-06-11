import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 根据环境变量启用Mock（支持开发和生产环境）
if (import.meta.env.VITE_USE_MOCK === 'true') {
  import('./mock/index.js')
  console.log('[Mock] Mock服务已启用')
}

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')