<template>
  <div class="flex items-center justify-between p-4 max-w-7xl mx-auto w-full">
    <div class="flex items-center gap-4">
      <!-- Logo Area -->
      <div class="terminal-text text-4xl md:text-6xl font-bold mb-2 glitch">░M░E░Z░O░-░D░A░S░H</div>
      <br />
    </div>

    <div class="flex items-center gap-3">
      <!-- Wallet Connect Button -->
      <button 
        @click="$emit('toggleWallet')" 
        :disabled="connecting"
        class="retro-button bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-2xl font-medium transition shadow-lg shadow-pink-900/20 flex items-center gap-2"
      >
        <span v-if="connecting" class="animate-spin rounded-full w-6 h-6 border-t-transparent"></span>
        <span>{{ walletConnected ? `${address?.slice(0,6)}...${address?.slice(-4)}` : 'Connect Wallet' }}</span>
      </button>
    </div>
  </div>
  <div class="terminal-text text-lg md:text-2xl text-primary/80 mb-8 animate-pulse">&gt;&gt; manage, redeem or liquidate &lt;&lt;</div>
  <br/>
  <br/>
</template>

<script setup lang="ts">
import { type Address } from 'viem'

defineProps<{
  walletConnected: boolean
  address: Address | null
  connecting: boolean
}>()

defineEmits(['toggleWallet'])
</script>
