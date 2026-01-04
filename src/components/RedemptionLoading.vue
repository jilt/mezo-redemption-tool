<template>
  <div class="text-center py-24">
    <h2 class="text-3xl font-bold mb-4 text-white">Scanning All Troves...</h2>
    <p class="text-xl text-gray-400">Live data from {{ chainName }} (all ICR levels)</p>

    <div v-if="liveTroves.length" class="mt-8 max-w-4xl mx-auto bg-gray-900/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
      <div class="flex justify-between text-xs text-gray-400 mb-2 px-4">
        <span>Found {{ liveTroves.length }} troves...</span>
      </div>
      <div class="h-64 overflow-y-auto space-y-1 pr-2">
        <div v-for="trove in liveTroves" :key="trove.owner" class="grid grid-cols-4 gap-4 text-xs font-mono p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
          <div class="truncate text-left text-gray-400">{{ trove.owner }}</div>
          <div class="text-right" :class="trove.icr < 110 ? 'text-red-400' : trove.icr < 150 ? 'text-orange-400' : 'text-emerald-400'">
            ICR: {{ trove.icr.toFixed(2) }}%
          </div>
          <div class="text-right text-gray-300">{{ formatDebt(trove.debt) }} MUSD</div>
          <div class="text-right text-gray-300">${{ formatCollateral(trove.collateral, btcPrice) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TroveInfo } from '../abis/TroveManager'

defineProps<{
  chainName?: string
  liveTroves: TroveInfo[]
  btcPrice: number
}>()

const formatDebt = (debt: bigint): string => {
  return (Number(debt) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const formatCollateral = (collateral: bigint, price: number): string => {
  return (Number(collateral) * price / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
</script>