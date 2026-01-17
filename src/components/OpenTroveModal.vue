<template>
  <div class="modal fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all">
    <div class="modal-dialog relative w-full max-w-lg p-4">
      <div class="modal-content flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="modal-header flex justify-between items-center p-6">
          <h2 class="text-3xl font-bold text-accent">Open Risky Trove</h2>
          <button @click="$emit('close')" class="retro-button close">✕</button>
        </div>

        <!-- Body -->
        <div class="modal-body p-6 space-y-6 overflow-y-auto">
          <div>
            <label class="block text-gray-400 mb-2 text-sm">Collateral (BTC)</label>
            <input 
              v-model="newTroveCol" 
              type="number" 
              step="0.001" 
              class="w-[180px] p-4 mt-[5px] bg-transparent border border-[hsl(var(--primary))] text-[hsl(var(--terminal))] outline-none transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 retro-input"
            />
          </div>
          <br />
          <div>
            <label class="block text-gray-400 mb-2 text-sm">Debt (MUSD)</label>
            <input 
              v-model="newTroveDebt" 
              type="number" 
              step="100" 
              class="w-[180px] p-4 mt-[5px] bg-transparent border border-[hsl(var(--primary))] text-[hsl(var(--terminal))] outline-none transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 retro-input" 
            />
          </div>
          <br/>
          <div class="w-full">
            <div class="flex justify-between items-center mb-2">
              <span class="text-accent">Projected ICR</span>
              <span :class="[
                'text-terminal', 
                newTroveICR < 110 ? 'text-terminal' : newTroveICR < 150 ? 'text-terminal' : 'text-terminal'
              ]">
                {{ newTroveICR.toFixed(2) }}%
              </span>
            </div>
            <br />
            <div class="flex items-center justify-center gap-2 text-terminal">
              <template v-if="newTroveICR < 110">
                <svg class="w-[20px] h-[20px] text-[hsl(var(--primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                   Liquidation Risk
              </template>
              <template v-else-if="newTroveICR < 150">
                <svg class="w-[20px] h-[20px] text-[hsl(var(--primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>
                  Redemption Risk
              </template>
              <template v-else>
                <svg class="w-[20px] h-[20px] text-[hsl(var(--primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Safe Zone
              </template>
            </div>
          </div>
        </div>
        <br />
        <!-- Footer -->
        <div class="modal-footer p-6 border-t border-gray-800 bg-gray-900/50 rounded-b-3xl">
          <button 
            @click="openRiskyTrove"
            :disabled="openingTrove || newTroveICR < 110"
            class="retro-button bg-accent w-full flex items-center justify-center gap-2"
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
    
    const chainId = await publicClient.getChainId()
    const isFork = chainId === 31337
    
    console.log(`🌐 Opening trove on ${isFork ? 'Fork (31337)' : `Chain ${chainId}`}`)
    
    // ✅ USE USER INPUT
    const coll = parseEther(newTroveCol.value.toString())
    const debt = parseEther(newTroveDebt.value.toString())
    
    console.log('📝 User inputs:', {
      coll: formatEther(coll) + ' BTC',
      debt: formatEther(debt) + ' MUSD'
    })
    
    // ✅ CONDITIONAL GAS COMPENSATION
    let gasComp: bigint
    if (isFork) {
      gasComp = parseEther('200')  // Stub for corrupted fork
      console.log('🔧 Using stub gas compensation (fork): 200 MUSD')
    } else {
      gasComp = await publicClient.readContract({
        address: networkContracts.TROVE_MANAGER,
        abi: troveManagerAbi,
        functionName: 'MUSD_GAS_COMPENSATION'
      }) as bigint
      console.log('✅ Using real gas compensation:', formatEther(gasComp))
    }
    
    // ✅ CONDITIONAL BORROWING FEE
    let borrowingFee: bigint
    if (isFork) {
      borrowingFee = parseEther('0.01')  // Stub fee matching script
      console.log('🔧 Using stub borrowing fee (fork): 0.01 MUSD')
    } else {
      try {
        borrowingFee = await publicClient.readContract({
          address: networkContracts.BORROWER_OPERATIONS,
          abi: borrowerOperationsAbi,
          functionName: 'getBorrowingFee',
          args: [debt]
        }) as bigint
        console.log('✅ Using real borrowing fee:', formatEther(borrowingFee))
      } catch (error) {
        console.warn('⚠️ getBorrowingFee failed, using 0.5% estimate')
        borrowingFee = (debt * 5n) / 1000n
      }
    }

    const totalDebt = debt + borrowingFee + gasComp
    const nicr = (coll * 100000000000000000000n) / totalDebt

    console.log('📊 Trove Params:', {
      coll: formatEther(coll) + ' BTC',
      debt: formatEther(debt) + ' MUSD',
      gasComp: formatEther(gasComp),
      fee: formatEther(borrowingFee),
      totalDebt: formatEther(totalDebt),
      nicr: nicr.toString(),
      icrPercent: newTroveICR.value.toFixed(2) + '%'
    })

    console.log('🔍 Fetching hints...')

    const [approxHint] = await publicClient.readContract({
      address: networkContracts.HINT_HELPERS,
      abi: hintHelpersAbi,
      functionName: 'getApproxHint',
      args: [nicr, 15n, 42n]
    }) as [Address, bigint, bigint]

    console.log('  ✅ getApproxHint:', approxHint)

    let [upperHint, lowerHint] = await publicClient.readContract({
      address: networkContracts.SORTED_TROVES,
      abi: sortedTrovesAbi,
      functionName: 'findInsertPosition',
      args: [nicr, approxHint, approxHint]
    }) as [Address, Address]

    console.log('  ✅ findInsertPosition:', { upperHint, lowerHint })

    // 🔧 Handle edge case: lowerHint=0x0
    if (lowerHint === '0x0000000000000000000000000000000000000000' && 
        upperHint !== '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️ lowerHint is 0x0, using upperHint')
      lowerHint = upperHint
    }

    console.log('📤 Submitting openTrove...')

    // ✅ CONDITIONAL GAS (fixed gas for fork, auto-estimate for mainnet)
    const txOptions: any = {
      address: networkContracts.BORROWER_OPERATIONS,
      abi: borrowerOperationsAbi,
      functionName: 'openTrove',
      args: [debt, upperHint, lowerHint],
      account: props.address,
      value: coll,
    }
    
    if (isFork) {
      txOptions.gas = 3_000_000n
      console.log('🔧 Using fixed gas (fork): 3M')
    } else {
      console.log('🔧 Using auto gas estimation (mainnet)')
    }

    const hash = await walletClient.writeContract(txOptions)
    console.log('⏳ Tx submitted:', hash)
    
    console.log('   Waiting for receipt...')
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 120_000
    })
    
    console.log('📜 Receipt:', receipt.status, 'Gas:', receipt.gasUsed?.toString())
    
    if (receipt.status === 'success') {
      alert(
        `✅ Trove Opened!\n\n` +
        `Collateral: ${newTroveCol.value} BTC\n` +
        `Debt: ${newTroveDebt.value} MUSD\n` +
        `ICR: ${newTroveICR.value.toFixed(2)}%\n\n` +
        `Tx: ${hash}`
      )
      emit('success')
      emit('close')
    } else {
      console.error('❌ Transaction Receipt Failed:', receipt)
      throw new Error('Transaction reverted')
    }
    
  } catch (error: any) {
    console.error('❌ Failed:', error)
    
    let msg = 'Unknown error'
    if (error.message?.includes('TCR')) {
      msg = 'System TCR < 110%. Protocol in recovery mode.'
    } else if (error.message?.includes('insufficient')) {
      msg = 'Insufficient balance.'
    } else if (error.message?.includes('ICR')) {
      msg = 'ICR too low.'
    } else if (error.message?.includes('rejected')) {
      msg = 'User cancelled.'
    } else {
      msg = error.shortMessage || error.message || String(error)
    }
    
    alert(`❌ Failed: ${msg}`)
  } finally {
    openingTrove.value = false
  }
}
</script>
