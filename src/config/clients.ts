import { createPublicClient, http } from 'viem'
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

// ✅ EXPOSE NETWORK-CONTRACTS
export const getNetworkContracts = async () => {
  const chainId = await publicClient.getChainId()
  return getContracts(chainId)
}