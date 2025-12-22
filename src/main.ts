import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPublicClient, http } from 'viem'
import { MEZO_TESTNET } from './config/mezo'
import App from './App.vue'
import './style.css'

const queryClient = new QueryClient()
const app = createApp(App)
const pinia = createPinia()

const publicClient = createPublicClient({
  chain: MEZO_TESTNET, // Switch to MAINNET for prod
  transport: http()
})

app.use(pinia)
app.use(VueQueryPlugin, { queryClient })
app.provide('publicClient', publicClient)
app.mount('#app')
