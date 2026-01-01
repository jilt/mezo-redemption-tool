import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { MEZO_TESTNET, MEZO_MAINNET, MEZO_LOCAL, getContracts } from './mezo'

// Safe environment access for Node.js scripts (Hardhat)
const getEnv = () => {
  try {
    // @ts-ignore
    return import.meta.env || { MODE: 'fork', DEV: true }
  } catch {
    return { MODE: 'fork', DEV: true }
  }
}
const env = getEnv()

const getChain = () => {
  if (env.MODE === 'fork') return MEZO_LOCAL
  if (env.DEV) return MEZO_TESTNET
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