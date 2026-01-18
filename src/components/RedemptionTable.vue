<template>
  <div class="bg-white/5 overflow-x-auto shadow-2xl rounded-3xl">
    <table class="w-full max-w-[300px]">
      <thead class="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
        <tr>
          <th class="p-2 sm:p-4 text-left font-bold text-xs sm:text-sm text-white border-b border-white/10">Owner</th>
          <th class="p-2 sm:p-4 text-left font-bold text-xs sm:text-sm text-white border-b border-white/10 cursor-pointer hover:text-blue-400 transition-colors select-none" @click="$emit('toggleSort')">
            ICR {{ sortDir === 'asc' ? '↓' : '↑' }}
          </th>
          <th class="p-2 sm:p-4 text-left font-bold text-xs sm:text-sm text-white border-b border-white/10">Debt</th>
          <th class="p-2 sm:p-4 text-right font-bold text-xs sm:text-sm text-white border-b border-white/10">Coll.</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="trove in troves" 
          :key="trove.owner" 
          class="group hover:bg-white/10 transition-all border-b border-white/5"
        >
          <td class="p-2 sm:p-4 font-mono text-xs sm:text-sm text-gray-400 group-hover:text-white whitespace-nowrap">
            {{ trove.owner.slice(0,6) }}...
          </td>
          <td class="p-2 sm:p-4">
            <span :class="[
              'px-2 py-1 rounded-lg text-xs sm:text-sm font-bold shadow-lg transition-all whitespace-nowrap',
              trove.icr < 110 
                ? 'bg-red-500/20 text-red-300 animate-pulse' 
                : trove.icr < 150 
                ? 'bg-orange-500/20 text-orange-300'
                : 'bg-emerald-500/20 text-emerald-300'
            ]">
              {{ trove.icr.toFixed(2) }}%
            </span>
          </td>
          <td class="p-2 sm:p-4 font-mono text-xs sm:text-sm text-gray-300 whitespace-nowrap">
            {{ formatDebt(trove.debt) }}
          </td>
          <td class="p-2 sm:p-4 text-right font-mono text-xs sm:text-sm text-gray-300 whitespace-nowrap">
            ${{ formatCollateral(trove.collateral, btcPrice) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { TroveInfo } from '../abis/TroveManager'

defineProps<{
  troves: TroveInfo[]
  sortDir: 'asc' | 'desc'
  btcPrice: number
  walletConnected: boolean
  redeeming: boolean
  customRedemptionAmounts: Record<string, string>
}>()

defineEmits(['toggleSort', 'redeemTrove', 'updateAmount'])

const formatDebt = (debt: bigint): string => {
  return (Number(debt) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const formatCollateral = (collateral: bigint, price: number): string => {
  return (Number(collateral) * price / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
</script>