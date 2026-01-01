import { type Address } from 'viem'
import { getNetworkContracts } from '../config/clients'

// ✅ MINIMAL ABI - Production optimized
export const troveManagerAbi = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_MUSDamount", "type": "uint256"},
      {"internalType": "address", "name": "firstRedemptionHint", "type": "address"},
      {"internalType": "address", "name": "upperPartialRedemptionHint", "type": "address"},
      {"internalType": "address", "name": "lowerPartialRedemptionHint", "type": "address"},
      {"internalType": "uint256", "name": "partialRedemptionHintNICR", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxIterations", "type": "uint256"},
      {"internalType": "uint256", "name": "_maxFeePercentage", "type": "uint256"}
    ],
    "name": "redeemCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_borrower", "type": "address"}],
    "name": "getCurrentICR",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_borrower", "type": "address"}],
    "name": "getEntireDebtAndColl",
    "outputs": [
      {"internalType": "uint256", "name": "debt", "type": "uint256"},
      {"internalType": "uint256", "name": "coll", "type": "uint256"},
      {"internalType": "uint256", "name": "pendingDebtReward", "type": "uint256"},
      {"internalType": "uint256", "name": "pendingCollReward", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MUSD_GAS_COMPENSATION",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_borrower", "type": "address"}],
    "name": "getTroveStatus",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTroveOwnersCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export interface TroveInfo {
  owner: Address
  icr: number
  debt: bigint
  collateral: bigint
  atRisk: boolean
  redeemable: boolean
}

// ✅ DYNAMIC - Testnet ↔ Mainnet automatic
export const getTroveManagerAddress = async (): Promise<Address> => {
  const contracts = await getNetworkContracts()
  return contracts.TROVE_MANAGER
}

// ✅ READY-TO-USE CONTRACT OBJECT
export const getTroveManagerContract = async () => {
  const address = await getTroveManagerAddress()
  return {
    address,
    abi: troveManagerAbi
  } as const
}
