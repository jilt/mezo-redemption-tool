import { defineChain } from 'viem'

export const MEZO_TESTNET = defineChain({
  id: 31611,
  name: 'Mezo Testnet',
  nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.test.mezo.org'] } },
  blockExplorers: { default: { name: 'Mezo Explorer', url: 'https://explorer.test.mezo.org' } }
})

export const MEZO_MAINNET = defineChain({
  id: 31612,
  name: 'Mezo Mainnet',
  nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-http.mezo.boar.network'] } },
  blockExplorers: { default: { name: 'Mezo Explorer', url: 'https://explorer.mezo.org' } }
})

export const MEZO_LOCAL = defineChain({
  id: 31337,
  name: 'Mezo Fork',
  nativeCurrency: { name: 'BTC', symbol: 'BTC', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
})

// ✅ MAINNET ADDRESSES (verified)
export const MAINNET_CONTRACTS = {
  TROVE_MANAGER: '0x94AfB503dBca74aC3E4929BACEeDfCe19B93c193' as `0x${string}`,
  PRICE_FEED: '0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88' as `0x${string}`,
  SORTED_TROVES: '0x8C5DB4C62BF29c1C4564390d10c20a47E0b2749f' as `0x${string}`,
  HINT_HELPERS: '0xD267b3bE2514375A075fd03C3D9CBa6b95317DC3' as `0x${string}`
} as const

// ✅ TESTNET ADDRESSES (verified)
export const TESTNET_CONTRACTS = {
  TROVE_MANAGER: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0' as `0x${string}`,
  PRICE_FEED: '0x86bCF0841622a5dAC14A313a15f96A95421b9366' as `0x${string}`,
  SORTED_TROVES: '0x722E4D24FD6Ff8b0AC679450F3D91294607268fA' as `0x${string}`,
  HINT_HELPERS: '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6' as `0x${string}`
} as const

// ✅ Auto-detect contracts by chain
export const getContracts = (chainId: number) => 
  chainId === 31611 ? TESTNET_CONTRACTS : MAINNET_CONTRACTS

export const ACTIVE_CHAIN = import.meta.env.MODE === 'fork' ? MEZO_LOCAL 
  : (import.meta.env.DEV ? MEZO_TESTNET : MEZO_MAINNET)
