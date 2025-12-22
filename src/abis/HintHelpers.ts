import { type Address } from 'viem'

export const HINT_HELPERS_ADDRESS = '0x...' as Address // From paste.txt #2

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
  }
] as const

export interface RedemptionHints {
  firstRedemptionHint: Address
  partialRedemptionHintNICR: bigint
  truncatedAmount: bigint
  upperPartialRedemptionHint: Address
  lowerPartialRedemptionHint: Address
}
