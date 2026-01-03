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
            <input 
              v-model="newTroveCol" 
              type="number" 
              step="0.001" 
              class="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white text-xl focus:border-purple-500 outline-none transition-colors" 
            />
          </div>
          
          <div>
            <label class="block text-gray-400 mb-2 text-sm">Debt (MUSD)</label>
            <input 
              v-model="newTroveDebt" 
              type="number" 
              step="100" 
              class="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-white text-xl focus:border-purple-500 outline-none transition-colors" 
            />
          </div>

          <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div class="flex justify-between items-center mb-2">
              <span class="text-gray-400">Projected ICR</span>
              <span :class="[
                'font-bold text-xl', 
                newTroveICR < 110 ? 'text-red-500' : newTroveICR < 150 ? 'text-orange-400' : 'text-emerald-400'
              ]">
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
import { type Address, parseEther, formatEther } from 'viem'
import { getWalletClient, publicClient, getNetworkContracts } from '../config/clients'
import { borrowerOperationsAbi } from '../abis/BorrowerOperations'
import { hintHelpersAbi } from '../abis/HintHelpers'
import { sortedTrovesAbi } from '../abis/SortedTroves'
import { troveManagerAbi } from '../abis/TroveManager'

const props = defineProps<{
  address: Address | null
  btcPrice: number
}>()

const emit = defineEmits(['close', 'success'])

const openingTrove = ref(false)
const newTroveCol = ref('0.025')
const newTroveDebt = ref('2000')

const newTroveICR = computed(() => {
  if (!props.btcPrice || !newTroveDebt.value || Number(newTroveDebt.value) === 0) return 0
  
  const coll = Number(newTroveCol.value)
  const debt = Number(newTroveDebt.value)
  const totalDebt = debt + 200 + (debt * 0.01)
  
  return (coll * props.btcPrice / totalDebt) * 100
})

async function openRiskyTrove() {
  if (!props.address) return
  
  if (Number(newTroveDebt.value) < 1800) {
    alert('❌ Minimum debt is 1,800 MUSD')
    return
  }
  if (newTroveICR.value < 110) {
    alert(`❌ ICR ${newTroveICR.value.toFixed(1)}% < 110% minimum`)
    return
  }
  
  openingTrove.value = true
  try {
    const networkContracts = await getNetworkContracts()
    const walletClient = getWalletClient()
    
    const coll = parseEther(newTroveCol.value.toString())
    const debt = parseEther(newTroveDebt.value.toString())
    
    const chainId = await publicClient.getChainId()
    const isFork = chainId === 31337
    
    console.log(`🌐 Opening trove on ${isFork ? 'Fork (31337)' : `Chain ${chainId}`}`)
    
    const gasComp = await publicClient.readContract({
      address: networkContracts.TROVE_MANAGER,
      abi: troveManagerAbi,
      functionName: 'MUSD_GAS_COMPENSATION'
    }) as bigint
    
    let borrowingFee: bigint
    
    if (isFork) {
      borrowingFee = debt / 100n
      console.log('🔧 Using stub borrowing fee (fork)')
    } else {
      try {
        borrowingFee = await publicClient.readContract({
          address: networkContracts.BORROWER_OPERATIONS,
          abi: borrowerOperationsAbi,
          functionName: 'getBorrowingFee',
          args: [debt]
        }) as bigint
        console.log('✅ Using real borrowing fee')
      } catch (error) {
        console.warn('⚠️ getBorrowingFee failed, using 0.5% estimate')
        borrowingFee = (debt * 5n) / 1000n
      }
    }

    const totalDebt = debt + borrowingFee + gasComp
    const nicr = (coll * 100000000000000000000n) / totalDebt

    console.log('📊 Trove Params:', {
      coll: formatEther(coll) + ' BTC',
      collWei: coll.toString(),
      debt: formatEther(debt) + ' MUSD',
      debtWei: debt.toString(),
      gasComp: formatEther(gasComp),
      gasCompWei: gasComp.toString(),
      fee: formatEther(borrowingFee),
      feeWei: borrowingFee.toString(),
      totalDebt: formatEther(totalDebt),
      totalDebtWei: totalDebt.toString(),
      nicr: nicr.toString(),
      icrPercent: newTroveICR.value.toFixed(2) + '%'
    })

    console.log('🔍 Fetching hints...')
    console.log('  HintHelpers address:', networkContracts.HINT_HELPERS)
    console.log('  SortedTroves address:', networkContracts.SORTED_TROVES)
    console.log('  NICR for hints:', nicr.toString())

    const [approxHint, diff, latestRandomSeed] = await publicClient.readContract({
      address: networkContracts.HINT_HELPERS,
      abi: hintHelpersAbi,
      functionName: 'getApproxHint',
      args: [nicr, 15n, 42n]
    }) as [Address, bigint, bigint]

    console.log('  ✅ getApproxHint result:', {
      approxHint,
      diff: diff.toString(),
      latestRandomSeed: latestRandomSeed.toString()
    })

    const [upperHint, lowerHint] = await publicClient.readContract({
      address: networkContracts.SORTED_TROVES,
      abi: sortedTrovesAbi,
      functionName: 'findInsertPosition',
      args: [nicr, approxHint, approxHint]
    }) as [Address, Address]

    console.log('  ✅ findInsertPosition result:', { 
      upperHint, 
      lowerHint,
      lowerIsZero: lowerHint === '0x0000000000000000000000000000000000000000'
    })

    if (lowerHint === '0x0000000000000000000000000000000000000000' && 
        upperHint === '0x0000000000000000000000000000000000000000') {
      console.error('❌ Both hints are address(0) - checking if list is empty...')
      
      try {
        const listSize = await publicClient.readContract({
          address: networkContracts.SORTED_TROVES,
          abi: sortedTrovesAbi,
          functionName: 'getSize',
          args: []
        }) as bigint
        
        console.log('📏 SortedTroves list size:', listSize.toString())
        
        if (listSize === 0n) {
          console.log('✅ List is empty - you will be the first trove. Hints (0x0, 0x0) are valid.')
        } else {
          throw new Error('Invalid hints received despite non-empty list. Check NICR calculation.')
        }
      } catch (sizeError) {
        console.warn('⚠️ Could not check list size:', sizeError)
      }
    }

    const txOptions: any = {
      address: networkContracts.BORROWER_OPERATIONS,
      abi: borrowerOperationsAbi,
      functionName: 'openTrove',
      args: [debt, upperHint, lowerHint],
      account: props.address,
      value: coll,
    }
    
    if (isFork) {
      txOptions.gas = 3000000n
      console.log('🔧 Using fixed gas (fork)')
    } else {
      console.log('⛽ Using auto gas estimation')
    }

    console.log('📤 Submitting transaction with args:', {
      debt: debt.toString(),
      upperHint,
      lowerHint,
      value: coll.toString()
    })

    const hash = await walletClient.writeContract(txOptions)
    console.log('⏳ Tx submitted:', hash)
    
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 120_000
    })
    
    console.log('📜 Receipt:', {
      status: receipt.status,
      blockNumber: receipt.blockNumber?.toString(),
      gasUsed: receipt.gasUsed?.toString()
    })
    
    if (receipt.status === 'success') {
      alert(`✅ Trove Opened!\n\nICR: ${newTroveICR.value.toFixed(2)}%\nDebt: ${newTroveDebt.value} MUSD\nCollateral: ${newTroveCol.value} BTC\n\nTx: ${hash}`)
      emit('success')
      emit('close')
    } else {
      throw new Error('Transaction reverted')
    }
    
  } catch (error: any) {
    console.error('❌ Full error:', error)
    
    let msg = 'Unknown error'
    if (error.message?.includes('TCR')) {
      msg = 'System TCR < 110%. Protocol in recovery mode.'
    } else if (error.message?.includes('insufficient')) {
      msg = `Need ${newTroveCol.value} BTC + gas.`
    } else if (error.message?.includes('ICR')) {
      msg = 'ICR too low. Add more collateral.'
    } else if (error.message?.includes('rejected')) {
      msg = 'User cancelled transaction.'
    } else {
      msg = error.shortMessage || error.message || String(error)
    }
    
    alert(`❌ Failed: ${msg}`)
  } finally {
    openingTrove.value = false
  }
}
</script>
