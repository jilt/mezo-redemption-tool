<template>
  <div class="flex items-center justify-between flex-wrap">
    <!-- Left side buttons -->
    <div class="flex items-center space-x-4 gap-4">
      <button
        @click="$emit('refresh')"
        :disabled="isFetching"
        class="mr-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
      >
        <span v-if="isFetching">🔄</span>
        <span v-else>🔃</span>
        Refresh
      </button>

      <button
        v-if="walletConnected && redeemableCount > 0"
        @click="$emit('redeem-riskiest')"
        class="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg transition-colors"
      >
        ⚡ Redeem Riskiests
      </button>
    </div>

    <!-- Right side - User Trove Actions -->
    <div v-if="userOwnsTrove" class="flex items-center space-x-4">
      <div class="text-sm text-gray-300 bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/30 gap-4">
        <span class="text-purple-400">Your Trove:</span>
        <span class="ml-2 font-mono text-white">
          ICR {{ userTrove?.icr.toFixed(2) }}%
        </span>
        <span class="mx-2 text-gray-500">|</span>
        <span class="text-gray-300">
          {{ formatDebt(userTrove?.debt || 0n) }} MUSD
        </span>
      </div>

      <button
        @click="$emit('add-collateral')"
        class="mr-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
      >
        <span>➕</span>
        Add Collateral
      </button>

      <button
        @click="$emit('close-trove')"
        class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
      >
        <span>🔒</span>
        Close Trove
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { TroveInfo } from '../abis/TroveManager'

const props = defineProps<{
  isFetching: boolean
  walletConnected: boolean
  redeemableCount: number
  userOwnsTrove: boolean
  userTrove: TroveInfo | null
}>()

const emit = defineEmits<{
  refresh: []
  'redeem-riskiest': []
  'close-trove': []
  'add-collateral': []
}>()

const formatDebt = (debt: bigint): string => {
  return (Number(debt) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}
</script>
