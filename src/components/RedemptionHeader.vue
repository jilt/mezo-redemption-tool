<template>
  <div class="flex justify-between items-center mb-12">
    <div>
      <h1 class="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text">
        MUSD Redemption
      </h1>
    </div>
    <div class="menu flex gap-4 items-center">
      <!-- Network Indicator -->
      <div class="px-4 py-2 bg-gray-800/50 backdrop-blur-sm text-white text-sm rounded-xl font-mono">
        {{ chainName }}
      </div>
      
      <!-- Open Trove Button -->
      <button 
        @click="$emit('openTrove')"
        :disabled="!walletConnected"
        class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-purple-500/25"
      >
        Open Trove
      </button>

      <!-- Wallet Button -->
      <button 
        @click="$emit('toggleWallet')" 
        :disabled="connecting"
        :class="[
          'px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 flex items-center gap-3 group hover:scale-[1.02]',
          walletConnected 
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
        ]"
      >
        <span v-if="connecting" class="animate-spin rounded-full w-6 h-6 border-t-transparent"></span>
        {{ walletConnected ? `${address?.slice(0,8)}...${address?.slice(-6)}` : 'Connect Wallet' }}
      </button>
      
      <!-- Targets Counter -->
      <div class="px-6 py-3 bg-emerald-500/20 backdrop-blur-sm text-emerald-300 text-lg font-bold rounded-2xl">
        {{ troveCount }} troves
        <span v-if="redeemableCount" class="ml-2 text-sm bg-orange-500/30 px-2 py-1 rounded-full">
          {{ redeemableCount }} redeemable
        </span>
        <span v-if="liquidatableCount" class="ml-2 text-sm bg-red-500/30 px-2 py-1 rounded-full">
          {{ liquidatableCount }} liquidatable
        </span>
        <div v-if="lastUpdated" class="text-xs text-gray-500 mt-1">
          Updated: {{ lastUpdated }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Address } from 'viem'

defineProps<{
  chainName?: string
  walletConnected: boolean
  address: Address | null
  connecting: boolean
  troveCount: number
  redeemableCount: number
  liquidatableCount: number
  lastUpdated: string | null
}>()

defineEmits(['openTrove', 'toggleWallet'])
</script>