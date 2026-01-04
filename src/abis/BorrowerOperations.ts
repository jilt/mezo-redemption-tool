// src/abis/BorrowerOperations.ts
export const borrowerOperationsAbi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_debtAmount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_upperHint",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_lowerHint",
        "type": "address"
      }
    ],
    "name": "openTrove",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_debtAmount", "type": "uint256"}
    ],
    "name": "getBorrowingFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minNetDebt",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  // ✅ CLOSE TROVE
  {
    "inputs": [],
    "name": "closeTrove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ✅ ADD COLLATERAL
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_upperHint",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_lowerHint",
        "type": "address"
      }
    ],
    "name": "addColl",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // ✅ ADJUST TROVE (for advanced operations)
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_collWithdrawal",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_debtChange",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isDebtIncrease",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "_upperHint",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_lowerHint",
        "type": "address"
      }
    ],
    "name": "adjustTrove",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // ✅ REPAY MUSD
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_upperHint",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_lowerHint",
        "type": "address"
      }
    ],
    "name": "repayMUSD",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ✅ WITHDRAW COLLATERAL
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_upperHint",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_lowerHint",
        "type": "address"
      }
    ],
    "name": "withdrawColl",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ✅ WITHDRAW MUSD (borrow more)
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_upperHint",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_lowerHint",
        "type": "address"
      }
    ],
    "name": "withdrawMUSD",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const
