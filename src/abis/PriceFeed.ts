
export const priceFeedAbi = [
  {
    "inputs": [],
    "name": "fetchPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Helper to convert price (18 decimals) to readable USD/BTC
export function formatPrice(price: bigint): number {
  return Number(price) / 1e18
}
