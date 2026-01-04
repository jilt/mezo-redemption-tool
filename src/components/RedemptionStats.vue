<template>
  <div class="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-4 mb-8 backdrop-blur-sm">
    <div class="text-sm text-gray-400 font-mono">
      <div>Chain ID: {{ chainId }}</div>
      <div>
        BTC Price: ${{ btcPrice?.toLocaleString() || 'Loading...' }}
        <span v-if="isFallbackPrice" class="text-orange-400 ml-2 font-bold">(fallback $100k - fork workaround)</span>
      </div>
      <div>Contracts: {{ contractsLoaded ? '✅' : '⏳' }}</div>
      <div>Redeemable (110-150%): {{ redeemableCount }}</div>
      <div>Liquidatable (&lt;110%): {{ liquidatableCount }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  chainId: number
  btcPrice: number
  isFallbackPrice: boolean
  contractsLoaded: boolean
  redeemableCount: number
  liquidatableCount: number
}>()
</script>