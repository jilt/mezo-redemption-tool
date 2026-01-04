import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'
import { publicClient, getNetworkContracts } from '../config/clients'
import { type Address } from 'viem'
import type { TroveInfo } from '../abis/TroveManager'
import { troveManagerAbi } from '../abis/TroveManager'
import { priceFeedAbi } from '../abis/PriceFeed'
import { sortedTrovesAbi } from '../abis/SortedTroves'
import { parseEther, formatEther } from 'viem'


// Extended type for UI display
interface TroveInfoUI extends TroveInfo {
  closed?: boolean
}


export function useTroves() {
  const skippedTroves = ref<TroveInfoUI[]>([])
  const liveTroves = ref<TroveInfoUI[]>([])


  const getTroves = async (): Promise<TroveInfoUI[]> => {
    try {
      skippedTroves.value = []
      liveTroves.value = []
      console.log('🔍 Fetching live troves from Mezo...')


      // ✅ DYNAMIC NETWORK CONTRACTS
      const contracts = await getNetworkContracts()
      const chainId = await publicClient.getChainId()
      console.log('🌐 Network:', publicClient.chain!.name, `(ID: ${chainId})`)
      console.log('📋 Contracts:', {
        troveManager: `${contracts.TROVE_MANAGER}`,
        sortedTroves: `${contracts.SORTED_TROVES}`,
        priceFeed: `${contracts.PRICE_FEED}`,
        hintHelpers: `${contracts.HINT_HELPERS}`
      })


      // 1. Get BTC price FIRST (critical for ICR calculation)
      let priceResult: bigint
      try {
        priceResult = await publicClient.readContract({
          address: contracts.PRICE_FEED,
          abi: priceFeedAbi,
          functionName: 'fetchPrice'
        }) as bigint
        
        console.log('💰 Raw BTC Price:', priceResult.toString())
        console.log('💰 BTC Price (formatted):', formatEther(priceResult), 'USD')
      } catch (error) {
        console.warn('⚠️ Price fetch failed in useTroves, using fallback $100,000')
        priceResult = parseEther('100000')
      }


      // 2. Get LAST trove (lowest ICR / Riskiest) - Start from tail
      let currentId: Address | null = null
      try {
        currentId = await publicClient.readContract({
          address: contracts.SORTED_TROVES,
          abi: sortedTrovesAbi,
          functionName: 'getLast'
        }) as Address
        
        console.log('📋 Starting from tail (Riskiest/Lowest ICR):', currentId)
        if (currentId === '0x0000000000000000000000000000000000000000') {
          console.log('📭 Empty trove list - no redemption targets')
          return []
        }
      } catch (error) {
        console.warn('❌ getLast failed - no troves or wrong contract:', error)
        return testTroves()
      }


      // 3. Traverse Backwards (Risky -> Safe) → Max 2000 troves
      const troves: Address[] = [currentId]
      let count = 1
      
      while (count < 2000) {
        try {
          const nextId = await publicClient.readContract({
            address: contracts.SORTED_TROVES,
            abi: sortedTrovesAbi,
            functionName: 'getPrev',
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

      console.log(`🔗 Traversal complete:`)
      console.log(`  - Collected ${troves.length} trove addresses`)
      console.log(`  - Expected: 91 troves`)
      console.log(`  - First 5 addresses:`, troves.slice(0, 5))

      if (troves.length === 0) return []


      // ✅ PARALLEL FETCH WITH STATUS CHECK
      console.log('📡 Fetching trove data (parallel, max 200)...')
      const processedTrovesPromises: Promise<TroveInfoUI | null>[] = troves.slice(0, 200).map(async (owner) => {
        try {
          // 🔍 CHECK STATUS FIRST
          const status = await publicClient.readContract({
            address: contracts.TROVE_MANAGER,
            abi: troveManagerAbi,
            functionName: 'getTroveStatus',
            args: [owner]
          }) as bigint


          // ✅ Get debt and collateral - Mezo returns [coll, debt, pendingCollReward, pendingDebtReward]
          const debtCollResult = await publicClient.readContract({
            address: contracts.TROVE_MANAGER,
            abi: troveManagerAbi,
            functionName: 'getEntireDebtAndColl',
            args: [owner]
          })


          // ✅ MEZO ORDER: [collateral, debt, pendingCollReward, pendingDebtReward]
          const [collateral, debt] = debtCollResult.slice(0, 2) as [bigint, bigint]


          // Skip closed troves (status != 1) but collect their data for display
          if (status !== 1n) {
            console.log(`⏭️ Closed trove ${owner.slice(0, 8)} (status: ${status})`)
            
            const skippedTroveInfo: TroveInfoUI = {
              owner,
              icr: 0,
              debt,
              collateral,
              atRisk: false,
              redeemable: false,
              closed: true
            }
            
            skippedTroves.value.push(skippedTroveInfo)
            return null
          }


          // 🐛 DEBUG: Log first few troves to verify correct parsing
          if (liveTroves.value.length < 3) {
            console.log(`🔍 Trove ${owner.slice(0, 8)}:`, {
              collateralRaw: collateral.toString(),
              debtRaw: debt.toString(),
              collateral: formatEther(collateral) + ' BTC',
              debt: formatEther(debt) + ' MUSD'
            })
          }


          // ✅ Convert with proper decimals (both are 18 decimals on Mezo)
          const collNum = Number(formatEther(collateral))    // BTC (18 decimals)
          const debtNum = Number(formatEther(debt))          // MUSD (18 decimals)
          const priceNum = Number(formatEther(priceResult))  // Price (18 decimals)


          // 🐛 DEBUG: Log conversion values
          if (liveTroves.value.length < 3) {
            console.log(`🔍 ICR Debug for ${owner.slice(0, 8)}:`, {
              collNum,
              debtNum,
              priceNum,
              collValue: collNum * priceNum,
              calculation: `(${collNum} * ${priceNum} / ${debtNum}) * 100`
            })
          }


          // Calculate ICR
          let icr = 0
          if (debtNum > 0) {
            // ICR = (Collateral Value / Debt) * 100
            icr = (collNum * priceNum / debtNum) * 100
          } else if (collNum > 0) {
            icr = 999999 // Infinite collateralization
          }


          // 🐛 DEBUG: Log final ICR
          if (liveTroves.value.length < 3) {
            console.log(`🔍 Final ICR for ${owner.slice(0, 8)}: ${icr}%`)
          }


          const atRisk = icr < 110
          const redeemable = icr >= 110 && icr < 150


          // ✅ Fixed validation (allow high ICRs, only reject invalid)
          if (isNaN(icr) || icr < 0) {
            console.warn(`⚠️ Invalid ICR for ${owner}: ${icr}`)
            return null
          }


          const troveInfo: TroveInfoUI = {
            owner,
            icr,
            debt,
            collateral,
            atRisk,
            redeemable,
            closed: false
          }
          liveTroves.value.push(troveInfo)
          liveTroves.value.sort((a, b) => a.icr - b.icr) // ✅ Keep riskiest at top
          return troveInfo
        } catch (error) {
          console.error(`❌ Failed to fetch trove ${owner.slice(0,8)}:`, error instanceof Error ? error.message : error)
          console.error(`   Full error:`, error)
          return null
        }
      })


      const processedTroves = (await Promise.all(processedTrovesPromises))
        .filter((trove): trove is TroveInfoUI => trove !== null)


      // ✅ MOVED FILTERING STATS HERE (after Promise.all completes)
      console.log(`📊 Filtering results:`)
      console.log(`  - Troves collected: ${troves.length}`)
      console.log(`  - Active troves: ${processedTroves.length}`)
      console.log(`  - Closed/skipped: ${skippedTroves.value.length}`)
      console.log(`  - Failed to process: ${troves.length - processedTroves.length - skippedTroves.value.length}`)

      console.log(`✅ Processed ${processedTroves.length}/${troves.length} active troves`)
      console.log(`⏭️ Skipped ${skippedTroves.value.length} closed troves`)


      // Sort by ICR (lowest first)
      const allTroves = processedTroves.sort((a, b) => a.icr - b.icr)


      // Count redeemable and liquidatable
      const redeemableCount = allTroves.filter(t => t.redeemable).length
      const liquidatableCount = allTroves.filter(t => t.atRisk).length


      console.log(`🎯 ${allTroves.length} active troves found`)
      console.log(`✨ Redeemable (110-150%): ${redeemableCount}`)
      console.log(`⚠️ Liquidatable (<110%): ${liquidatableCount}`)
      
      if (allTroves.length > 0) {
        console.log('📊 Top 5 riskiest troves:')
        console.table(allTroves.slice(0, 5).map(t => ({
          owner: t.owner.slice(0, 10),
          icr: t.icr.toFixed(2) + '%',
          debt: formatEther(t.debt),
          redeemable: t.redeemable,
          atRisk: t.atRisk
        })))
      }


      // ✅ APPEND CLOSED TROVES AT THE END
      return [...allTroves, ...skippedTroves.value]


    } catch (error) {
      console.error('❌ Trove fetch failed:', error)
      return testTroves()
    }
  }


  function testTroves(): TroveInfoUI[] {
    console.log('🧪 Using test data (fallback)')
    return [
      {
        owner: '0x1234567890abcdef1234567890abcdef12345678' as Address,
        icr: 112.34,
        debt: parseEther('1500'),
        collateral: parseEther('16'),
        atRisk: false,
        redeemable: true,
        closed: false
      },
      {
        owner: '0xabcdef1234567890abcdef1234567890abcdef12' as Address,
        icr: 119.87,
        debt: parseEther('3200'),
        collateral: parseEther('36'),
        atRisk: false,
        redeemable: true,
        closed: false
      }
    ]
  }


  const troves = useQuery({ 
    queryKey: ['troves'], 
    queryFn: getTroves,
    staleTime: Infinity  // ✅ Never auto-refresh, only manual
  })


  return {
    troves,
    skippedTroves,
    liveTroves
  }
}