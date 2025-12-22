import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { MEZO_TESTNET, MEZO_MAINNET, getContracts } from './mezo'

export const publicClient = createPublicClient({
  chain: import.meta.env.DEV ? MEZO_TESTNET : MEZO_MAINNET,
  transport: http()
})

export function getWalletClient() {
  if (typeof window === 'undefined') throw new Error('Browser only')
  if (!window.ethereum) throw new Error('No wallet detected')
  
  return createWalletClient({
    chain: import.meta.env.DEV ? MEZO_TESTNET : MEZO_MAINNET,
    transport: custom(window.ethereum)
  })
}

// ✅ EXPOSE NETWORK-CONTRACTS
export const getNetworkContracts = async () => {
  const chainId = await publicClient.getChainId()
  return getContracts(chainId)
}