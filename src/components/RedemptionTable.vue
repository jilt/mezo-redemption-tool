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
          <th class="p-6 text-right font-bold text-xl text-white border-b border-white/10">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="trove in troves" 
          :key="trove.owner" 
          class="group hover:bg-white/10 transition-all border-b border-white/5"
        >
          <td class="p-6 font-mono text-lg text-gray-400 group-hover:text-white">
            {{ trove.owner.slice(0,10) }}...{{ trove.owner.slice(-8) }}
          </td>
          <td class="p-6">
            <span :class="[
              'px-6 py-3 rounded-2xl text-lg font-bold border-2 shadow-lg transition-all',
              trove.icr < 110 
                ? 'bg-red-500/20 text-red-300 border-red-400 shadow-red-500/20 animate-pulse ring-2 ring-red-400/30' 
                : trove.icr < 150 
                ? 'bg-orange-500/20 text-orange-300 border-orange-400 shadow-orange-500/20 ring-2 ring-orange-400/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-emerald-500/20'
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
          <td class="p-6 text-right">
            <div class="flex flex-col items-end gap-3">
              <div v-if="isRedeemable(trove)" class="flex items-center gap-2 bg-gray-800/80 p-1 rounded-xl border border-gray-600">
                <input 
                  :value="customRedemptionAmounts[trove.owner]"
                  @input="$emit('updateAmount', trove.owner, ($event.target as HTMLInputElement).value)"
                  type="number" 
                  placeholder="Amount" 
                  class="bg-transparent text-white w-24 px-2 py-1 outline-none text-right font-mono text-sm"
                />
                <span class="text-gray-500 text-xs pr-2">MUSD</span>
              </div>
              <div v-if="isRedeemable(trove) && customRedemptionAmounts[trove.owner]" class="text-xs text-emerald-400 font-mono">
                Est. Return: {{ ((Number(customRedemptionAmounts[trove.owner]) / btcPrice) || 0).toFixed(4) }} BTC
              </div>
              <button 
                @click="$emit('redeemTrove', trove)" 
                :disabled="!walletConnected || redeeming || !isRedeemable(trove)"
                :class="[
                  'px-6 py-3 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform hover:-translate-y-1 group/button w-full',
                  walletConnected && !redeeming && isRedeemable(trove)
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-purple-500/50 hover:shadow-purple-500/75'
                    : 'bg-gray-700/50 text-gray-500 border-2 border-gray-600 cursor-not-allowed hover:scale-100 shadow-none'
                ]"
              >
                <span v-if="redeeming" class="animate-spin mr-2">⚡</span>
                {{ redeeming ? 'Processing...' : isRedeemable(trove) ? 'Redeem Custom' : trove.icr < 110 ? '⚠️ Liquidatable' : '✅ Healthy' }}
              </button>
            </div>
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

const isRedeemable = (trove: TroveInfo) => trove.redeemable

const formatDebt = (debt: bigint): string => {
  return (Number(debt) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const formatCollateral = (collateral: bigint, price: number): string => {
  return (Number(collateral) * price / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
</script>