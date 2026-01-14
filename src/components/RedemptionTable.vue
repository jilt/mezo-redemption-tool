<template>
  <div class="bg-white/5 overflow-hidden shadow-2xl rounded-3xl">
    <table class="w-full">
      <thead class="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
        <tr>
          <th class="p-6 text-left font-bold text-xl text-white border-b border-white/10">Owner</th>
          <th class="p-6 text-left font-bold text-xl text-white border-b border-white/10 cursor-pointer hover:text-blue-400 transition-colors select-none" @click="$emit('toggleSort')">
            ICR {{ sortDir === 'asc' ? '↓' : '↑' }}
          </th>
          <th class="p-6 text-left font-bold text-xl text-white border-b border-white/10">Debt</th>
          <th class="p-6 text-right font-bold text-xl text-white border-b border-white/10">Collateral</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="trove in troves" 
          :key="trove.owner" 
          class="group hover:bg-white/10 transition-all border-b border-white/5"
        >
          <td class="p-6 font-mono text-lg text-gray-400 group-hover:text-white">
            {{ trove.owner.slice(0,10) }}...
          </td>
          <td class="p-6">
            <span :class="[
              'px-6 py-3 rounded-2xl text-lg font-bold shadow-lg transition-all',
              trove.icr < 110 
                ? 'bg-red-500/20 text-red-300 animate-pulse' 
                : trove.icr < 150 
                ? 'bg-orange-500/20 text-orange-300'
                : 'bg-emerald-500/20 text-emerald-300'
            ]">
              {{ trove.icr.toFixed(2) }}%
            </span>
          </td>
          <td class="p-6 font-mono text-lg text-gray-300">
            {{ formatDebt(trove.debt) }} MUSD
          </td>
          <td class="p-6 text-right font-mono text-lg text-gray-300">
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