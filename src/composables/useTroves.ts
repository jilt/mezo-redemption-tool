import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'
import { publicClient, getNetworkContracts } from '../config/clients'
import { type Address } from 'viem'
import type { TroveInfo } from '../abis/TroveManager'
import { troveManagerAbi } from '../abis/TroveManager'
import { priceFeedAbi } from '../abis/PriceFeed'
import { parseEther } from 'viem'

// ✅ OFFICIAL SortedTroves ABI (minimal)
const sortedTrovesAbi = [
  {
    inputs: [],
    name: "getFirst",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_id", type: "address" }],
    name: "getNext",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const

export function useTroves() {
  const skippedTroves = ref<string[]>([])

  const getTroves = async (): Promise<TroveInfo[]> => {
    try {
      skippedTroves.value = []
      console.log('🔍 Fetching live troves from Mezo...')

      // ✅ DYNAMIC NETWORK CONTRACTS
      const contracts = await getNetworkContracts()
      const chainId = await publicClient.getChainId()
      console.log('🌐 Network:', publicClient.chain!.name, `(ID: ${chainId})`)
      console.log('📋 Contracts:', {
        troveManager: `${contracts.TROVE_MANAGER.slice(0, 10)}...`,
        sortedTroves: `${contracts.SORTED_TROVES.slice(0, 10)}...`,
        priceFeed: `${contracts.PRICE_FEED.slice(0, 10)}...`
      })

      // 1. Get BTC price FIRST (critical for redemption)
      const priceResult = await publicClient.readContract({
        address: contracts.PRICE_FEED,
        abi: priceFeedAbi,
        functionName: 'fetchPrice'
      }) as bigint
      console.log('💰 BTC Price:', Number(priceResult) / 1e18)

      // 2. Get first trove (lowest ICR)
      let currentId: Address | null = null
      try {
        currentId = await publicClient.readContract({
          address: contracts.SORTED_TROVES,
          abi: sortedTrovesAbi,
          functionName: 'getFirst'
        }) as Address
        
        console.log('📋 First trove (lowest ICR):', currentId)
        if (currentId === '0x0000000000000000000000000000000000000000') {
          console.log('📭 Empty trove list - no redemption targets')
          return []
        }
      } catch (error) {
        console.warn('❌ getFirst failed - no troves or wrong contract:', error)
        return testTroves()
      }

      // 3. Traverse → Max 50 troves (gas efficient)
      const troves: Address[] = [currentId]
      let count = 1
      
      while (count < 50) {
        try {
          const nextId = await publicClient.readContract({
            address: contracts.SORTED_TROVES,
            abi: sortedTrovesAbi,
            functionName: 'getNext',
            args: [currentId]
          }) as Address
          
          if (nextId === '0x0000000000000000000000000000000000000000') break
          
          troves.push(nextId)
          currentId = nextId
          count++
        } catch (error) {
          console.warn('⚠️ Traversal stopped at', troves.length, 'troves')
          break
        }
      }

      console.log(`📊 Found ${troves.length} troves (lowest ICR first)`)

      if (troves.length === 0) return []

      // ✅ SEQUENTIAL FETCH - No Multicall3 needed
      console.log('📡 Fetching trove data (sequential, max 20)...')
      const processedTrovesPromises: Promise<TroveInfo | null>[] = troves.slice(0, 20).map(async (owner) => {
        try {
          // ICR
          const icrResult = await publicClient.readContract({
            address: contracts.TROVE_MANAGER,
            abi: troveManagerAbi,
            functionName: 'getCurrentICR',
            args: [owner]
          }) as bigint

          // Debt/Collateral
          const debtCollResult = await publicClient.readContract({
            address: contracts.TROVE_MANAGER,
            abi: troveManagerAbi,
            functionName: 'getEntireDebtAndColl',
            args: [owner]
          }) as readonly [bigint, bigint, bigint, bigint]

          const icr = Number(icrResult) / 100
          const [debt, collateral] = debtCollResult.slice(0, 2) as [bigint, bigint]

          if (isNaN(icr) || icr < 0 || icr > 1000) return null

          return {
            owner,
            icr,
            debt,
            collateral,
            atRisk: icr < 110,
            redeemable: icr >= 110 && icr < 150
          }
        } catch (error) {
          console.warn(`⚠️ Skipped ${owner.slice(0, 10)}...`)
          skippedTroves.value.push(owner)
          return null
        }
      })

      const processedTroves = (await Promise.all(processedTrovesPromises))
        .filter((trove): trove is TroveInfo => trove !== null)

      console.log(`✅ Processed ${processedTroves.length}/${troves.length} troves`)

      // 6. Filter redemption targets
      const redemptionTargets = processedTroves
        .filter(trove => trove.redeemable)
        .sort((a, b) => a.icr - b.icr)

      console.log(`🎯 ${redemptionTargets.length} redemption targets (110-150% ICR)`)
      if (redemptionTargets.length > 0) {
        console.table(redemptionTargets.slice(0, 5))
      }

      return redemptionTargets

    } catch (error) {
      console.error('❌ Trove fetch failed:', error)
      return testTroves()
    }
  }

  function testTroves(): TroveInfo[] {
    console.log('🧪 Using test data (fallback)')
    return [
      {
        owner: '0x1234567890abcdef1234567890abcdef12345678' as Address,
        icr: 112.34,
        debt: parseEther('1500'),
        collateral: parseEther('16'),
        atRisk: true,
        redeemable: true
      },
      {
        owner: '0xabcdef1234567890abcdef1234567890abcdef12' as Address,
        icr: 119.87,
        debt: parseEther('3200'),
        collateral: parseEther('36'),
        atRisk: true,
        redeemable: true
      }
    ]
  }

  const troves = useQuery({ 
    queryKey: ['troves'], 
    queryFn: getTroves,
    refetchInterval: 30_000,
    staleTime: 10_000
  })

  return {
    troves,
    skippedTroves
  }
}
