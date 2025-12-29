import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { MEZO_TESTNET, MEZO_MAINNET, MEZO_LOCAL, getContracts } from './mezo'

const getChain = () => {
  if (import.meta.env.MODE === 'fork') return MEZO_LOCAL
  if (import.meta.env.DEV) return MEZO_TESTNET
  return MEZO_MAINNET
}

export const publicClient = createPublicClient({
  chain: getChain(),
  transport: http()
})

export function getWalletClient() {
  if (typeof window === 'undefined') throw new Error('Browser only')
  if (!window.ethereum) throw new Error('No wallet detected')
  
  return createWalletClient({
    chain: getChain(),
    transport: custom(window.ethereum)
  })
}

// ✅ EXPOSE NETWORK-CONTRACTS
export const getNetworkContracts = async () => {
  const chainId = await publicClient.getChainId()
  return getContracts(chainId)
}