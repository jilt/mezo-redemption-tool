<template>
  <div class="modal fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all">
    <div class="modal-dialog relative w-full max-w-lg p-4">
      <div class="modal-content bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="modal-header flex justify-between items-center p-6 border-b border-gray-800">
          <h2 class="text-3xl font-bold text-white">Open Risky Trove</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white text-2xl transition-colors">✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body p-6 space-y-6 overflow-y-auto">
          <div>
            <label class="block text-gray-400 mb-2 text-sm">Collateral (BTC)</label>
            <input v-model="newTroveCol" type="number" step="0.001" class="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white text-xl focus:border-purple-500 outline-none transition-colors" />
          </div>
          
          <div>
            <label class="block text-gray-400 mb-2 text-sm">Debt (MUSD)</label>
            <input v-model="newTroveDebt" type="number" step="100" class="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white text-xl focus:border-purple-500 outline-none transition-colors" />
          </div>

          <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700 trovedata">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-400">Projected ICR</span>
              <span :class="['font-bold text-xl', newTroveICR < 110 ? 'text-red-500' : newTroveICR < 150 ? 'text-orange-400' : 'text-emerald-400']">
                {{ newTroveICR.toFixed(2) }}%
              </span>
            </div>
            <div class="text-xs text-right" :class="newTroveICR >= 110 && newTroveICR < 150 ? 'text-orange-400' : 'text-gray-500'">
              {{ newTroveICR < 110 ? '⚠️ Liquidation Risk (Invalid)' : newTroveICR < 150 ? '🎯 Target Zone (Risky)' : '🛡️ Safe Zone' }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer p-6 border-t border-gray-800 bg-gray-900/50 rounded-b-3xl">
          <button 
            @click="openRiskyTrove"
            :disabled="openingTrove || newTroveICR < 110"
            class="w-full py-4 rounded-xl font-bold text-xl shadow-lg transition-all flex justify-center items-center gap-2"
            :class="openingTrove || newTroveICR < 110 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'"
          >
            <span v-if="openingTrove" class="animate-spin rounded-full w-5 h-5 border-2 border-white/20 border-t-white"></span>
            {{ openingTrove ? 'Opening...' : 'Open Trove' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Address, parseEther } from 'viem'
import { getWalletClient, publicClient, getNetworkContracts } from '../config/clients'
import { borrowerOperationsAbi } from '../abis/BorrowerOperations'

const props = defineProps<{
  address: Address | null
  btcPrice: number
}>()

const emit = defineEmits(['close', 'success'])

const openingTrove = ref(false)
const newTroveCol = ref('0.01')
const newTroveDebt = ref('2000')

const newTroveICR = computed(() => {
  if (!props.btcPrice || !newTroveDebt.value || Number(newTroveDebt.value) === 0) return 0
  const coll = Number(newTroveCol.value)
  const debt = Number(newTroveDebt.value)
  return (coll * props.btcPrice / debt) * 100
})

async function openRiskyTrove() {
  if (!props.address) return
  
  openingTrove.value = true
  try {
    const networkContracts = await getNetworkContracts()
    const walletClient = getWalletClient()
    
    const hash = await walletClient.writeContract({
      address: networkContracts.BORROWER_OPERATIONS,
      abi: borrowerOperationsAbi,
      functionName: 'openTrove',
      account: props.address,
      value: parseEther(newTroveCol.value.toString()),
      args: [
        parseEther(newTroveDebt.value.toString()),
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000'
      ]
    })

    await publicClient.waitForTransactionReceipt({ hash })
    alert('✅ Trove Opened Successfully!')
    emit('success')
    emit('close')
    
  } catch (error) {
    console.error('Open trove failed:', error)
    alert(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    openingTrove.value = false
  }
}
</script>