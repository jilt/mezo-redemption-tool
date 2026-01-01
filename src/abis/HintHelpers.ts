import { type Address } from 'viem'

export const hintHelpersAbi = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_amount", "type": "uint256"},
      {"internalType": "uint256", "name": "_price", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxIterations", "type": "uint256"}
    ],
    "name": "getRedemptionHints",
    "outputs": [
      {"internalType": "address", "name": "firstRedemptionHint", "type": "address"},
      {"internalType": "uint256", "name": "partialRedemptionHintNICR", "type": "uint256"},
      {"internalType": "uint256", "name": "truncatedAmount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_CR", "type": "uint256"},
      {"internalType": "uint256", "name": "_numTrials", "type": "uint256"},
      {"internalType": "uint256", "name": "_inputRandomSeed", "type": "uint256"}
    ],
    "name": "getApproxHint",
    "outputs": [
      {"internalType": "address", "name": "hintAddress", "type": "address"},
      {"internalType": "uint256", "name": "diff", "type": "uint256"},
      {"internalType": "uint256", "name": "latestRandomSeed", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export interface RedemptionHints {
  firstRedemptionHint: Address
  partialRedemptionHintNICR: bigint
  truncatedAmount: bigint
  upperPartialRedemptionHint: Address
  lowerPartialRedemptionHint: Address
}
