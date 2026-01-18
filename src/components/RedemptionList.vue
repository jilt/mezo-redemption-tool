<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans selection:bg-pink-500 selection:text-white flex flex-col">
    <RedemptionHeader
      :wallet-connected="walletConnected"
      :address="address"
      :connecting="connecting"
      @toggle-wallet="toggleWallet"
    />

    <!-- Open Trove Modal Component -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showModal = false">
      <OpenTroveModal 
        :address="address"
        :btc-price="btcPrice"
        @close="showModal = false" 
        @success="troves.refetch()" 
      />
    </div>

    <!-- Main Content Area -->
    <main class="flex flex-col items-center justify-center p-4 mt-4 sm:mt-12 flex-grow">
      
      <!-- Central Card -->
      <div class="animated-border w-full max-w-[520px] bg-gray-800/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl">
        
        <!-- Card Header -->
        <div class="flex justify-center items-center p-4 pb-2 terminal-text text-lg text-accent">MANAGE TROVES...
          <span class="blink">█</span>
        </div>

        <!-- Stats Section (Moved from Menu) -->
        <div class="px-4 pb-2">
          <div class="bg-gray-900/40 rounded-xl p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">Chain ID</span>
              <span class="font-mono text-gray-200">{{ chainId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">BTC Price</span>
              <span class="font-mono text-gray-200">${{ btcPrice.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Contracts</span>
              <svg v-if="contractsLoaded" class="w-[20px] h-[20px] text-[hsl(var(--primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <svg v-else class="w-[20px] h-[20px] text-[hsl(var(--primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Redeemable (110-150%)</span>
              <span class="text-yellow-400 font-bold">{{ redeemableCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Liquidatable (&lt;110%)</span>
              <span class="text-red-400 font-bold">{{ liquidatableCount }}</span>
            </div>
          </div>
        </div>

        <!-- Main Action Area -->
        <div class="bg-gray-900/50 rounded-2xl p-4 mb-2 mt-4 mx-4">
          <div class="flex flex-col gap-3">
            <!-- Open Trove Button -->
            <button 
              @click="showModal = true"
              :disabled="!walletConnected"
              class="retro-button w-full"
            >
              Open New Trove
            </button>
            
            <!-- User Trove Actions (if owned) -->
            <div v-if="userOwnsTrove && userTrove" class="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 mt-2">
              <div class="flex justify-between items-center mb-2 text-sm text-gray-400">
                <span>Your Position</span>
                <span class="font-mono text-white">ICR {{ userTrove.icr.toFixed(2) }}%</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button @click="addCollateral" class="retro-button w-full .bg-destructive">
                  + Collateral
                </button>
                <button @click="closeTrove" class="retro-button bg-accent w-full">
                  Close Trove
                </button>
              </div>
            </div>

            <!-- Refresh & Redeem Buttons -->
            <div class="grid grid-cols-2 gap-6 mt-1">
               <button 
                 @click="troves.refetch()"
                 :disabled="troves.isFetching.value"
                 class="bg-accent retro-button w-full flex items-center justify-center gap-2"
               >
                 <svg :class="{ 'animate-spin': troves.isFetching.value }" class="w-[20px] h-[20px] text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Refresh
               </button>
               <button 
                 @click="redeemRiskiest"
                 :disabled="!walletConnected || redeemableCount === 0" class="bg-destructive retro-button w-full flex items-center justify-center gap-2"
               >
                 <svg class="w-[20px] h-[20px] text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                 Redeem Riskiest
               </button>
            </div>

            <!-- Liquidation Button (Only visible if liquidatable troves exist) -->
            <button 
              v-if="liquidatableCount > 0"
              @click="liquidateTroves"
              :disabled="liquidating || !walletConnected"
              class="retro-button w-full items-center justify-center gap-2 transition-all"
            >
              <span v-if="liquidating" class="animate-spin rounded-full w-5 h-5 border-2 border-white/20 border-t-white"></span>
              <svg v-else class="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Liquidate {{ liquidatableCount }} Trove{{ liquidatableCount !== 1 ? 's' : '' }}
            </button>
          </div>
        </div>

        <!-- Accordion Trigger -->
        <div class="flex justify-center h-[60px]">
          <button 
          @click="isTrovesOpen = !isTrovesOpen"
          class="retro-button flex items-center gap-2 px-4 py-2 w-full justify-center h-full m-0"
        >
          <span class="font-medium">Troves List ({{ troves.data?.value?.length || 0 }})</span>
          <svg 
            class="h-full w-auto transform transition-transform duration-300 text-black"
            :class="{ 'rotate-180': isTrovesOpen }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          </button>
        </div>

        <!-- Accordion Content (Trove List) -->
        <div 
          v-show="isTrovesOpen" class="mt-2 p-1 bg-gray-900/50 rounded-2xl max-h-[300px] overflow-y-auto custom-scrollbar  mt-[20px]"
        >
          <!-- Loading -->
          <RedemptionLoading
            v-if="troves.isPending.value"
            :chain-name="publicClient.chain?.name"
            :live-troves="liveTroves"
            :btc-price="btcPrice"
          />

          <!-- Error -->
          <RedemptionError
            v-else-if="troves.error?.value"
            :message="troves.error.value.message"
            @retry="troves.refetch()"
          />

          <!-- Empty -->
          <RedemptionEmpty v-else-if="!troves.data?.value?.length" />

          <!-- Troves Table -->
          <RedemptionTable
            v-else
            :troves="sortedTroves"
            :sort-dir="sortDir"
            :btc-price="btcPrice"
            :wallet-connected="walletConnected"
            :redeeming="redeeming"
            :custom-redemption-amounts="customRedemptionAmounts"
            @toggle-sort="toggleSort"
            @redeem-trove="redeemTrove"
            @update-amount="updateAmount"
          />
        </div>

      </div>
    </main>

    <!-- Info Section -->
    <RedemptionInfo />

    <footer class="w-full text-center p-4 text-gray-500 text-sm mt-8 mb-4 font-mono">
      created by <a href="https://jeeltcraft.com" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">jeeltcraft</a> with <svg class="w-[20px] h-[20px] text-[hsl(var(--primary))] inline-block" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> | © 2026
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTroves } from '../composables/useTroves'
import { getWalletClient, publicClient, getNetworkContracts } from '../config/clients'
import { type Address, parseEther } from 'viem'
import type { TroveInfo } from '../abis/TroveManager'
import { priceFeedAbi } from '../abis/PriceFeed'
import { troveManagerAbi } from '../abis/TroveManager'
import { hintHelpersAbi } from '../abis/HintHelpers'
import { sortedTrovesAbi } from '../abis/SortedTroves'
import { borrowerOperationsAbi } from '../abis/BorrowerOperations'
import OpenTroveModal from './OpenTroveModal.vue'
import RedemptionHeader from './RedemptionHeader.vue'
import RedemptionLoading from './RedemptionLoading.vue'
import RedemptionError from './RedemptionError.vue'
import RedemptionEmpty from './RedemptionEmpty.vue'
import RedemptionTable from './RedemptionTable.vue'
import RedemptionInfo from './RedemptionInfo.vue'

// ✅ MUSD Token ABI (for balance check and approval)
const musdTokenAbi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const

const { troves, liveTroves } = useTroves()
const walletConnected = ref(false)
const address = ref<Address | null>(null)
const connecting = ref(false)
const redeeming = ref(false)
const btcPrice = ref(0)
const isFallbackPrice = ref(false)
const liquidating = ref(false)
const contracts = ref<any>(null)
const showModal = ref(false)
const customRedemptionAmounts = ref<Record<string, string>>({})
const chainId = ref<number>(0)
const sortDir = ref<'asc' | 'desc'>('asc')
const isTrovesOpen = ref(false)

const toggleSort = () => {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

const sortedTroves = computed(() => {
  const data = troves.data.value || []
  return [...data].sort((a, b) => sortDir.value === 'asc' ? a.icr - b.icr : b.icr - a.icr)
})

const updateAmount = (owner: string, amount: string) => {
  customRedemptionAmounts.value[owner] = amount
}

// Reactive computed properties
const redeemableCount = computed(() => {
  return troves.data?.value?.filter((trove: TroveInfo) => trove.redeemable).length || 0
})

const liquidatableCount = computed(() => {
  return troves.data?.value?.filter((trove: TroveInfo) => trove.atRisk).length || 0
})

// Check if user owns a trove
const userOwnsTrove = computed(() => {
  if (!address.value || !troves.data.value) return false
  return troves.data.value.some((trove: TroveInfo) => 
    trove.owner.toLowerCase() === address.value!.toLowerCase()
  )
})

// ✅ Get user's trove if they own one
const userTrove = computed(() => {
  if (!address.value || !troves.data.value) return null
  return troves.data.value.find((trove: TroveInfo) => 
    trove.owner.toLowerCase() === address.value!.toLowerCase()
  ) || null
})

const contractsLoaded = computed(() => !!contracts.value)

// Formatters
const formatDebt = (debt: bigint): string => {
  return (Number(debt) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// Get network contracts
async function getContracts() {
  if (!contracts.value) {
    contracts.value = await getNetworkContracts()
    console.log('📍 Network contracts loaded:', contracts.value)
  }
  return contracts.value
}

// Wallet connection
async function toggleWallet() {
  if (walletConnected.value) {
    window.ethereum?.removeAllListeners()
    walletConnected.value = false
    address.value = null
    return
  }

  connecting.value = true
  try {
    const accounts = await (window.ethereum as any)?.request({ 
      method: 'eth_requestAccounts' 
    }) as string[]
    
    if (!accounts?.length) throw new Error('No accounts returned')
    
    address.value = accounts[0] as Address
    walletConnected.value = true

    const chainIdHex = `0x${publicClient.chain!.id.toString(16)}`
    console.log('🔗 Switching to chain:', chainIdHex)
    
    try {
      await (window.ethereum as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const chainConfig = getChainConfig(chainIdHex)
        if (chainConfig) {
          await (window.ethereum as any).request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig]
          })
        }
      } else {
        throw switchError
      }
    }

    window.ethereum?.on('accountsChanged', (accounts: string[]) => {
      if (!accounts.length) {
        walletConnected.value = false
        address.value = null
      } else {
        address.value = accounts[0] as Address
      }
    })

  } catch (error) {
    console.error('Wallet connection failed:', error)
    alert(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    connecting.value = false
  }
}

function getChainConfig(chainIdHex: string) {
  const configs: Record<string, any> = {
    '0x7b8c': {
      chainId: '0x7b8c',
      chainName: 'Mezo Mainnet',
      rpcUrls: ['https://rpc-http.mezo.boar.network'],
      nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
      blockExplorerUrls: ['https://explorer.mezo.org']
    },
    '0x7a69': {
      chainId: '0x7a69',
      chainName: 'Mezo Fork',
      rpcUrls: ['http://127.0.0.1:8545'],
      nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
      blockExplorerUrls: []
    },
  }
  return configs[chainIdHex.toLowerCase()]
}

async function redeemRiskiest() {
  const amount = prompt('Enter MUSD amount to redeem:', '100')
  if (!amount || Number(amount) <= 0) return
  
  await redeemAmount(amount)
}

// ✅ CLOSE TROVE
async function closeTrove() {
  if (!walletConnected.value || !address.value || !userTrove.value) {
    alert('No trove found for your address')
    return
  }

  const confirmed = confirm(
    `Close your trove?\n\n` +
    `Debt: ${formatDebt(userTrove.value.debt)} MUSD\n` +
    `Collateral: ${(Number(userTrove.value.collateral) / 1e18).toFixed(4)} BTC\n` +
    `ICR: ${userTrove.value.icr.toFixed(2)}%\n\n` +
    `You must repay all debt to close the trove.`
  )

  if (!confirmed) return

  redeeming.value = true
  
  try {
    const networkContracts = await getContracts()
    const walletClient = getWalletClient()

    console.log('🔒 Closing trove via BorrowerOperations')

    const hash = await walletClient.writeContract({
      address: networkContracts.BORROWER_OPERATIONS,
      abi: borrowerOperationsAbi,
      functionName: 'closeTrove',
      account: address.value
    }) as `0x${string}`

    console.log('⏳ Waiting for transaction:', hash)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted')
    }

    console.log('✅ Trove closed successfully!')
    
    alert(`✅ Trove Closed!\n\nYour collateral has been returned.\nTx: ${hash}`)
    
    await troves.refetch()
    
  } catch (error: any) {
    console.error('❌ Close trove failed:', error)
    alert(`❌ Failed to close trove:\n\n${error.message || error.shortMessage || 'Unknown error'}`)
  } finally {
    redeeming.value = false
  }
}

// ✅ ADD COLLATERAL
async function addCollateral() {
  if (!walletConnected.value || !address.value || !userTrove.value) {
    alert('No trove found for your address')
    return
  }

  const amount = prompt('Enter BTC amount to add as collateral:', '0.001')
  if (!amount || Number(amount) <= 0) return

  redeeming.value = true
  
  try {
    const networkContracts = await getContracts()
    const collateralAmount = parseEther(amount)

    console.log('💰 Adding', amount, 'BTC collateral to trove')

    // Get price for ICR calculation
    let price: bigint
    if (chainId.value === 31337) {
      price = parseEther('100000')
    } else {
      price = await publicClient.readContract({
        address: networkContracts.PRICE_FEED,
        abi: priceFeedAbi,
        functionName: 'fetchPrice'
      }) as bigint
    }

    // Calculate new ICR after adding collateral
    const newColl = userTrove.value.collateral + collateralAmount
    const newCollValue = Number(newColl) * Number(price) / 1e18
    const debt = Number(userTrove.value.debt)
    const newICR = (newCollValue / debt) * 100

    console.log('📊 New ICR after adding collateral:', newICR.toFixed(2) + '%')

    // Get current NICR
    const currentNICR = await publicClient.readContract({
      address: networkContracts.TROVE_MANAGER,
      abi: troveManagerAbi,
      functionName: 'getNominalICR',
      args: [address.value]
    }) as bigint

    console.log('🎯 Getting hints for position update')

    // Get hints for new position (ICR will increase)
    const approxHint = await publicClient.readContract({
      address: networkContracts.HINT_HELPERS,
      abi: hintHelpersAbi,
      functionName: 'getApproxHint',
      args: [currentNICR, 50n, 42n]
    }) as [Address, bigint, bigint]

    const hintAddress = approxHint[0]

    const insertPosition = await publicClient.readContract({
      address: networkContracts.SORTED_TROVES,
      abi: sortedTrovesAbi,
      functionName: 'findInsertPosition',
      args: [currentNICR, hintAddress, hintAddress]
    }) as [Address, Address]

    const upperHint = insertPosition[0]
    const lowerHint = insertPosition[1]

    console.log('📍 Hints:', { upperHint, lowerHint })

    // Add collateral via BorrowerOperations.addColl()
    const walletClient = getWalletClient()

    const hash = await walletClient.writeContract({
      address: networkContracts.BORROWER_OPERATIONS,
      abi: borrowerOperationsAbi,
      functionName: 'addColl',
      account: address.value,
      args: [upperHint, lowerHint],
      value: collateralAmount
    }) as `0x${string}`

    console.log('⏳ Waiting for transaction:', hash)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted')
    }

    console.log('✅ Collateral added successfully!')
    
    alert(
      `✅ Collateral Added!\n\n` +
      `Added: ${amount} BTC\n` +
      `New ICR: ${newICR.toFixed(2)}%\n` +
      `Tx: ${hash}`
    )
    
    await troves.refetch()
    
  } catch (error: any) {
    console.error('❌ Add collateral failed:', error)
    alert(`❌ Failed to add collateral:\n\n${error.message || error.shortMessage || 'Unknown error'}`)
  } finally {
    redeeming.value = false
  }
}

// ✅ MAINNET PATTERN - Fresh hints calculation right before execution
async function redeemAmount(amountMUSD: string) {
  if (!walletConnected.value || !address.value) {
    alert('Please connect wallet first')
    return
  }

  redeeming.value = true
  
  try {
    const networkContracts = await getContracts()
    const redemptionAmount = parseEther(amountMUSD)
    
    console.log('🚀 Starting redemption of', amountMUSD, 'MUSD')
    
    // Step 1: Get BTC price (FRESH)
    let price: bigint
    if (chainId.value === 31337) {
      price = parseEther('100000')
      console.log('🔧 Using fork price: $100,000')
    } else {
      price = await publicClient.readContract({
        address: networkContracts.PRICE_FEED,
        abi: priceFeedAbi,
        functionName: 'fetchPrice'
      }) as bigint
      console.log('✅ Mainnet price:', Number(price) / 1e18)
    }
    
    btcPrice.value = Number(price) / 1e18

    // Step 2: Check MUSD balance
    const musdBalance = await publicClient.readContract({
      address: networkContracts.MUSD_TOKEN,
      abi: musdTokenAbi,
      functionName: 'balanceOf',
      args: [address.value]
    }) as bigint

    console.log('💵 MUSD balance:', formatDebt(musdBalance))

    if (musdBalance < redemptionAmount) {
      alert(`Insufficient MUSD!\nHave: ${formatDebt(musdBalance)}\nNeed: ${amountMUSD}`)
      return
    }

    // Step 3: Approve if needed
    const currentAllowance = await publicClient.readContract({
      address: networkContracts.MUSD_TOKEN,
      abi: musdTokenAbi,
      functionName: 'allowance',
      args: [address.value, networkContracts.TROVE_MANAGER]
    }) as bigint

    if (currentAllowance < redemptionAmount) {
      console.log('⏳ Approving MUSD...')
      const walletClient = getWalletClient()
      
      const approveHash = await walletClient.writeContract({
        address: networkContracts.MUSD_TOKEN,
        abi: musdTokenAbi,
        functionName: 'approve',
        account: address.value,
        args: [networkContracts.TROVE_MANAGER, redemptionAmount]
      }) as `0x${string}`

      await publicClient.waitForTransactionReceipt({ hash: approveHash })
      console.log('✅ MUSD approved')
    }

    // ✅ Step 4: Get FRESH hints RIGHT before transaction
    console.log('🎯 Calculating FRESH hints...')
    
    const redemptionHints = await publicClient.readContract({
      address: networkContracts.HINT_HELPERS,
      abi: hintHelpersAbi,
      functionName: 'getRedemptionHints',
      args: [redemptionAmount, price, 50n]
    }) as [Address, bigint, bigint]

    const firstRedemptionHint = redemptionHints[0]
    const partialRedemptionHintNICR = redemptionHints[1]
    const truncatedAmount = redemptionHints[2]

    console.log('  firstRedemptionHint:', firstRedemptionHint)
    console.log('  partialRedemptionHintNICR:', partialRedemptionHintNICR.toString())
    console.log('  truncatedAmount:', formatDebt(truncatedAmount))

    // ✅ Validate we got valid hints
    if (firstRedemptionHint === '0x0000000000000000000000000000000000000000') {
      alert('❌ No redeemable troves found. Try refreshing the page.')
      return
    }

    // Step 5: Get approx hint
    console.log('🎯 getApproxHint()')
    const approxHint = await publicClient.readContract({
      address: networkContracts.HINT_HELPERS,
      abi: hintHelpersAbi,
      functionName: 'getApproxHint',
      args: [partialRedemptionHintNICR, 50n, 42n]
    }) as [Address, bigint, bigint]

    const approxHintAddress = approxHint[0]
    console.log('  approxHintAddress:', approxHintAddress)

    // Step 6: Get insertion position
    console.log('🎯 findInsertPosition()')
    const insertPosition = await publicClient.readContract({
      address: networkContracts.SORTED_TROVES,
      abi: sortedTrovesAbi,
      functionName: 'findInsertPosition',
      args: [partialRedemptionHintNICR, approxHintAddress, approxHintAddress]
    }) as [Address, Address]

    const upperPartialRedemptionHint = insertPosition[0]
    const lowerPartialRedemptionHint = insertPosition[1]

    console.log('  upperHint:', upperPartialRedemptionHint)
    console.log('  lowerHint:', lowerPartialRedemptionHint)

    // Step 7: Execute redemption IMMEDIATELY after calculating hints
    console.log('📤 Executing redeemCollateral() - mainnet pattern')
    const walletClient = getWalletClient()
    
    const txOptions: any = {
      address: networkContracts.TROVE_MANAGER,
      abi: troveManagerAbi,
      functionName: 'redeemCollateral',
      account: address.value,
      args: [
        truncatedAmount,                    // Use truncated amount from hints
        firstRedemptionHint,                
        upperPartialRedemptionHint,         
        lowerPartialRedemptionHint,         
        partialRedemptionHintNICR,          
        50n                                 // Lower iterations for faster execution
      ]
    }

    if (chainId.value === 31337) {
      txOptions.gas = 5000000n
      console.log('🔧 Fork: using 5M gas')
    }

    console.log('📋 Final params:', {
      amount: formatDebt(truncatedAmount),
      firstHint: firstRedemptionHint,
      upperHint: upperPartialRedemptionHint,
      lowerHint: lowerPartialRedemptionHint,
      NICR: partialRedemptionHintNICR.toString(),
      maxIterations: 50
    })

    const hash = await walletClient.writeContract(txOptions) as `0x${string}`

    console.log('⏳ Waiting for tx:', hash)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'reverted') {
      throw new Error('Transaction reverted on-chain')
    }

    console.log('✅ Redemption successful!')
    
    alert(
      `✅ SUCCESS!\n\n` +
      `Redeemed: ${formatDebt(truncatedAmount)} MUSD\n` +
      `Tx: ${hash}`
    )
    
    await troves.refetch()
    
  } catch (error: any) {
    console.error('❌ Redemption failed:', error)
    
    // Better error message
    let errorMsg = error.message || error.shortMessage || 'Unknown error'
    if (errorMsg.includes('Unable to redeem any amount')) {
      errorMsg = 'Unable to redeem: Trove constraints violated.\n\nTry:\n• Smaller amount (e.g., 50 MUSD)\n• Opening more troves first\n• Refreshing the page'
    }
    
    alert(`❌ Failed:\n\n${errorMsg}`)
  } finally {
    redeeming.value = false
  }
}

// ✅ LIQUIDATE TROVES
async function liquidateTroves() {
  if (!walletConnected.value || !address.value) {
    alert('Please connect wallet first')
    return
  }

  const liquidatable = troves.data.value?.filter((t: TroveInfo) => t.atRisk) || []
  if (liquidatable.length === 0) return

  const confirmed = confirm(`Are you sure you want to liquidate ${liquidatable.length} trove(s)?`)
  if (!confirmed) return

  liquidating.value = true
  try {
    const networkContracts = await getContracts()
    const walletClient = getWalletClient()
    
    const troveOwners = liquidatable.map((t: TroveInfo) => t.owner)
    console.log('🔥 Liquidating troves:', troveOwners)

    const hash = await walletClient.writeContract({
      address: networkContracts.TROVE_MANAGER,
      abi: troveManagerAbi,
      functionName: 'batchLiquidateTroves',
      account: address.value,
      args: [troveOwners]
    }) as `0x${string}`

    console.log('⏳ Liquidation tx submitted:', hash)
    await publicClient.waitForTransactionReceipt({ hash })
    
    alert(`✅ Liquidation Successful!\n\nTx: ${hash}`)
    await troves.refetch()
  } catch (error: any) {
    console.error('❌ Liquidation failed:', error)
    alert(`❌ Liquidation failed: ${error.message || 'Unknown error'}`)
  } finally {
    liquidating.value = false
  }
}

// Keep for UI compatibility
async function redeemTrove(trove: TroveInfo) {
  const amount = customRedemptionAmounts.value[trove.owner] || prompt('Enter MUSD amount to redeem:', '100')
  if (!amount || Number(amount) <= 0) return
  await redeemAmount(amount)
}

onMounted(async () => {
  chainId.value = await publicClient.getChainId()
  console.log('🌐 Chain ID:', chainId.value)
  
  await getContracts()

  if ((window.ethereum as any)?.selectedAddress) {
    await toggleWallet()
  }
  
  try {
    const networkContracts = await getContracts()
    
    if (chainId.value === 31337) {
      btcPrice.value = 100000
      isFallbackPrice.value = true
    } else {
      const price = await publicClient.readContract({
        address: networkContracts.PRICE_FEED,
        abi: priceFeedAbi,
        functionName: 'fetchPrice'
      }) as bigint
      btcPrice.value = Number(price) / 1e18
      isFallbackPrice.value = false
    }
  } catch (error) {
    btcPrice.value = 100000
    isFallbackPrice.value = true
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #374151;
  border-radius: 20px;
}
</style>
