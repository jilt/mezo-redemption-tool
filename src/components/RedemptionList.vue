<template>
  <div class="p-8 max-w-6xl mx-auto bg-gradient-to-br from-gray-900 via-purple-900/20 to-black min-h-screen">
    <div class="flex justify-between items-center mb-12">
      <div>
        <h1 class="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text">
          MUSD Redemption
        </h1>
        <p class="text-xl text-gray-400 mt-2">Live trove monitoring (ALL ICR levels)</p>
      </div>
      <div class="menu flex gap-4 items-center">
        <!-- Network Indicator -->
        <div class="px-4 py-2 bg-gray-800/50 backdrop-blur-sm text-white text-sm rounded-xl font-mono">
          {{ publicClient.chain?.name }}
        </div>
        
        <!-- Open Trove Button -->
        <button 
          @click="showModal = true"
          :disabled="!walletConnected"
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-purple-500/25"
        >
          Open Trove
        </button>

        <!-- Wallet Button -->
        <button 
          @click="toggleWallet" 
          :disabled="connecting"
          :class="[
            'px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 flex items-center gap-3 group hover:scale-[1.02]',
            walletConnected 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
          ]"
        >
          <span v-if="connecting" class="animate-spin rounded-full w-6 h-6 border-t-transparent"></span>
          {{ walletConnected ? `${address?.slice(0,8)}...${address?.slice(-6)}` : 'Connect Wallet' }}
        </button>
        <!-- Targets Counter -->
        <div class="px-6 py-3 bg-emerald-500/20 backdrop-blur-sm text-emerald-300 text-lg font-bold rounded-2xl">
          {{ troves.data?.value?.length || 0 }}  redeemable troves
          <span v-if="redeemableCount" class="ml-2 text-sm bg-orange-500/30 px-2 py-1 rounded-full">
            {{ redeemableCount }} redeemable
          </span>
        </div>
      </div>
    </div>

    <!-- Open Trove Modal Component -->
    <OpenTroveModal 
      v-if="showModal" 
      :address="address"
      :btc-price="btcPrice"
      @close="showModal = false" 
      @success="troves.refetch()" 
    />

    <!-- Debug Info (remove in production) -->
    <div v-if="showDebug" class="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-4 mb-8 backdrop-blur-sm">
      <div class="text-sm text-gray-400 font-mono">
        <div>Chain ID: {{ publicClient.chain?.id }}</div>
        <div>
          BTC Price: ${{ btcPrice?.toLocaleString() || 'Loading...' }}
          <span v-if="isFallbackPrice" class="text-red-400 ml-2 font-bold">(fallback)</span>
        </div>
        <div>Contracts: {{ contractsLoaded ? '✅' : '⏳' }}</div>
        <div>Redeemable (110-150%): {{ redeemableCount }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="troves.isPending" class="text-center py-24">
      <div class="animate-spin rounded-full h-20 w-20 mx-auto mb-8"></div>
      <h2 class="text-3xl font-bold mb-4 text-white">Scanning All Troves...</h2>
      <p class="text-xl text-gray-400">Live data from {{ publicClient.chain?.name }} (all ICR levels)</p>

      <div v-if="skippedTroves.length" class="mt-8 max-w-md mx-auto bg-gray-900/50 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
        <div class="text-xs font-mono text-gray-500 h-32 overflow-y-auto text-left space-y-1">
          <div v-for="addr in skippedTroves" :key="addr" class="truncate">
            Skipped: {{ addr }}
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="troves.error?.value" class="bg-red-500/10 border-2 border-red-500/30 text-red-200 p-10 rounded-3xl backdrop-blur-sm max-w-4xl mx-auto">
      <div class="text-4xl mb-6">⚠️</div>
      <h3 class="text-2xl font-bold mb-4">Failed to load troves</h3>
      <p class="text-lg mb-8">{{ troves.error.value.message }}</p>
      <button 
        @click="() => troves.refetch()" 
        class="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-2xl font-bold text-xl text-white transition-all shadow-xl hover:shadow-red-500/25"
      >
        🔄 Retry Fetch
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="!troves.data?.value?.length" class="text-center py-32">
      <div class="text-8xl mb-8">🎯</div>
      <h2 class="text-4xl font-bold mb-6 text-white">No Troves Found</h2>
      <p class="text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">Market appears empty. Check back soon!</p>
      <div class="text-lg text-gray-500 space-y-2">
        <p>• Connect wallet to monitor live</p>
        <p>• Shows ALL troves regardless of ICR</p>
      </div>
    </div>

    <!-- ✅ ENHANCED TROVES TABLE - FULLY REACTIVE -->
    <div v-else class="bg-white/5 overflow-hidden shadow-2xl">
      <table class="w-full">
        <thead class="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm">
          <tr>
            <th class="p-6 text-left font-bold text-xl text-white border-b border-white/10">Owner</th>
            <th class="p-6 text-left font-bold text-xl text-white border-b border-white/10">ICR</th>
            <th class="p-6 text-left font-bold text-xl text-white border-b border-white/10">Debt</th>
            <th class="p-6 text-right font-bold text-xl text-white border-b border-white/10">Collateral</th>
            <th class="p-6 text-right font-bold text-xl text-white border-b border-white/10">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="trove in troves.data.value!" 
            :key="trove.owner" 
            class="group hover:bg-white/10 transition-all border-b border-white/5"
          >
            <td class="p-6 font-mono text-lg group-hover:text-white">
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
                    v-model="customRedemptionAmounts[trove.owner]" 
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
                  @click="redeemTrove(trove)" 
                  :disabled="!walletConnected || redeeming || !isRedeemable(trove)"
                  :class="[
                    'px-6 py-3 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform hover:-translate-y-1 group/button w-full',
                    walletConnected && !redeeming && isRedeemable(trove)
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-purple-500/50 hover:shadow-purple-500/75'
                      : 'bg-gray-700/50 text-gray-500 border-2 border-gray-600 cursor-not-allowed hover:scale-100 shadow-none'
                  ]"
                >
                  <span v-if="redeeming" class="animate-spin mr-2">⚡</span>
                  {{ redeeming ? 'Processing...' : isRedeemable(trove) ? 'Redeem Custom' : '✅ Healthy' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Redeem Riskiest Action -->
    <br/>
    <div class="flex justify-center mt-12 mb-4">
      <button 
        @click="redeemRiskiest"
        :disabled="!walletConnected || !redeemableCount"
        class="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-2xl font-bold text-xl transition-all shadow-2xl hover:shadow-red-500/25 flex items-center gap-3 transform hover:scale-105"
      >
        <span class="text-2xl">⚡</span>
        <span>Redeem Riskiest Trove (10%)</span>
      </button>
    </div>

    <!-- Info Section -->
    <div class="mt-16 bg-gray-900/50 p-8 backdrop-blur-sm">
      <h3 class="text-2xl font-bold text-white mb-6">Liquidation vs Redemption</h3>
      <p class="text-gray-400 text-sm mb-8">You only redeem when MUSD is trading below $1 on the market:<br/>
      Example: MUSD trades at $0.95 on an exchange.<br/>
      You buy 1,000 MUSD for $950.<br/>
      You redeem 1,000 MUSD in Mezo and receive $992.50 of BTC (after the 0.75% redemption fee).<br/>
      You can then sell that BTC back for roughly $1,000, netting about $42.50 risk‑free (minus gas).<br/>
      So the incentive is off‑chain arbitrage profit, not extra on‑chain collateral from the trove. Redemptions are how the protocol lets traders close the gap when MUSD < $1.<br/>
      The trove owner tolerates it because when your trove is redeemed against:<br/>
      Debt goes down by the redeemed MUSD amount.<br/>
      Collateral goes down by the same dollar value.<br/>
      ICR increases, so your position becomes safer.<br/>
      If a redemption completely clears your debt, you keep the surplus BTC and can claim it. This is “neutral or even positive” for the borrower; it’s not a liquidation.
      </p>
      <br/><br/>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
              <th class="p-4">Mechanism</th>
              <th class="p-4">Trigger</th>
              <th class="p-4">Who gets collateral?</th>
              <th class="p-4">Your ICR after</th>
            </tr>
          </thead>
          <tbody class="text-gray-300">
            <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
              <td class="p-4 font-bold text-red-400">Liquidation</td>
              <td class="p-4">Your ICR &lt; 110% (unsafe)</td>
              <td class="p-4">Stability Pool + liquidator bonus</td>
              <td class="p-4 text-gray-500 italic">You lose trove</td>
            </tr>
            <tr class="hover:bg-white/5 transition-colors">
              <td class="p-4 font-bold text-emerald-400">Redemption</td>
              <td class="p-4">MUSD &lt; $1, your trove is lowest ≥110%</td>
              <td class="p-4">Redeemer gets BTC, you lose debt</td>
              <td class="p-4 text-emerald-300 font-bold">ICR goes up ↗</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
import OpenTroveModal from './OpenTroveModal.vue'

const { troves, skippedTroves } = useTroves()
const walletConnected = ref(false)
const address = ref<Address | null>(null)
const connecting = ref(false)
const redeeming = ref(false)
const btcPrice = ref(0)
const isFallbackPrice = ref(false)
const contracts = ref<any>(null)
const showDebug = ref(true) // Set to false in production

// Modal & New Trove State
const showModal = ref(false)
const customRedemptionAmounts = ref<Record<string, string>>({})

// ✅ REACTIVE NETWORK STATUS
const networkStatus = computed(() => {
  if (!publicClient.chain) return 'Disconnected'
  const chainId = publicClient.chain.id.toString(16).toUpperCase()
  return `Chain ${chainId}`
})

// ✅ REACTIVE REDEEMABLE COUNT
const redeemableCount = computed(() => {
  return troves.data?.value?.filter((trove: TroveInfo) => 
    trove.icr >= 110 && trove.icr < 150
  ).length || 0
})

// ✅ REACTIVE CONTRACTS STATUS
const contractsLoaded = computed(() => !!contracts.value)

// ✅ REDEEMABLE CHECK (110-150% ICR only)
const isRedeemable = (trove: TroveInfo) => trove.icr >= 110 && trove.icr < 150

// Formatters ✅ FULLY REACTIVE
const formatDebt = (debt: bigint): string => {
  return (Number(debt) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const formatCollateral = (collateral: bigint, price: number): string => {
  return (Number(collateral) * price / 1e18).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ✅ GET NETWORK CONTRACTS (cached + reactive)
async function getContracts() {
  if (!contracts.value) {
    contracts.value = await getNetworkContracts()
    console.log('📍 Network contracts loaded:', contracts.value)
  }
  return contracts.value
}

// ✅ NETWORK-AWARE WALLET CONNECTION
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

    // ✅ PROPER 0x CHAIN ID
    const chainId = `0x${publicClient.chain!.id.toString(16)}`
    console.log('🔗 Switching to chain:', chainId)
    
    try {
      await (window.ethereum as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const chainConfig = getChainConfig(chainId)
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

function getChainConfig(chainId: string) {
  const configs: Record<string, any> = {
    //'31612': {
    //  chainId: '31612',
    //  chainName: 'Mezo Mainnet',
    //  rpcUrls: ['https://rpc-http.mezo.boar.network'],
    //  nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
    //  blockExplorerUrls: ['https://explorer.mezo.org']
    //},
    '31612': {
      chainId: '31612',
      chainName: 'Mezo Fork',
      rpcUrls: ['http://127.0.0.1:8545'],
      nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
      blockExplorerUrls: []
    },
  }
  return configs[chainId.toLowerCase()]
}

// ✅ AUTOMAGICAL REDEMPTION (Targets lowest ICR)
async function redeemRiskiest() {
  if (!troves.data.value?.length) return
  
  // 1. Find lowest ICR < 150%
  // Data is already sorted by ICR ascending in useTroves
  const riskiest = troves.data.value[0]
  
  if (!riskiest || riskiest.icr >= 150) {
    alert('No risky troves found (< 150% ICR)')
    return
  }

  // 2. Trigger redemption (Protocol will target this trove anyway)
  await redeemTrove(riskiest)
}

// ✅ PRODUCTION REDEMPTION - FULLY REACTIVE
async function redeemTrove(trove: TroveInfo) {
  if (!walletConnected.value || !address.value || !isRedeemable(trove)) {
    alert('Only troves with 110-150% ICR are redeemable')
    return
  }

  redeeming.value = true
  
  try {
    console.log('🚀 Starting redemption for:', trove.owner, `ICR: ${trove.icr.toFixed(2)}%`)
    
    const networkContracts = await getContracts()
    
    // 1. Get BTC price (UPDATES UI!)
    let price: bigint
    try {
      price = await publicClient.readContract({
        address: networkContracts.PRICE_FEED,
        abi: priceFeedAbi,
        functionName: 'fetchPrice'
      }) as bigint
      isFallbackPrice.value = false
    } catch (e) {
      console.warn('⚠️ Price fetch failed. Using fallback $100,000')
      price = parseEther('100000')
      isFallbackPrice.value = true
    }
    btcPrice.value = Number(price) / 1e18  // ✅ UI UPDATES!

    // 2. Calculate redemption amount
    const customAmount = customRedemptionAmounts.value[trove.owner]
    const redemptionAmount = customAmount && Number(customAmount) > 0
      ? parseEther(customAmount)
      : (trove.debt / 10n) // Default to 10% if no input

    // 3. Get redemption hints
    const hints = await publicClient.readContract({
      address: networkContracts.HINT_HELPERS,
      abi: hintHelpersAbi,
      functionName: 'getRedemptionHints',
      args: [redemptionAmount, price, 10n]
    }) as [Address, bigint, bigint]

    // 4. Execute redemption
    const walletClient = getWalletClient()
    const hash = await walletClient.writeContract({
      address: networkContracts.TROVE_MANAGER,
      abi: troveManagerAbi,
      functionName: 'redeemCollateral',
      account: address.value!,
      args: [
        redemptionAmount,
        hints[0],
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        hints[1],
        10n,
        parseEther('0.005')
      ]
    }) as `0x${string}`

    // 5. Wait for confirmation + REFETCH
    await publicClient.waitForTransactionReceipt({ hash })
    console.log('✅ Redemption successful!', `https://explorer.mezo.org/tx/${hash}`)
    
    alert(
      `✅ SUCCESS!\n` +
      `Redeemed: ${formatDebt(redemptionAmount)} MUSD\n` +
      `ICR: ${trove.icr.toFixed(2)}%\n` +
      `Tx: https://explorer.mezo.org/tx/${hash}`
    )
    await troves.refetch()  // ✅ FULL UI REFRESH!
    
  } catch (error) {
    console.error('Redemption failed:', error)
    alert(`❌ Redemption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    redeeming.value = false
  }
}

// ✅ FULLY REACTIVE INITIALIZATION
onMounted(async () => {
  // 1. Load contracts (UI updates)
  try {
    await getContracts()
  } catch (error) {
    console.error('Failed to load network contracts:', error)
  }

  // 2. Auto-connect wallet
  if ((window.ethereum as any)?.selectedAddress) {
    await toggleWallet()
  }
  
  // 3. Fetch initial price (UI updates)
  try {
    const networkContracts = await getContracts()
    const price = await publicClient.readContract({
      address: networkContracts.PRICE_FEED,
      abi: priceFeedAbi,
      functionName: 'fetchPrice'
    }) as bigint
    btcPrice.value = Number(price) / 1e18  // ✅ COLLATERAL COLUMN UPDATES!
    isFallbackPrice.value = false
  } catch (error) {
    console.warn('Initial price fetch failed:', error)
    btcPrice.value = 100000
    isFallbackPrice.value = true
  }
})
</script>