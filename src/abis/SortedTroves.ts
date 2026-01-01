export const sortedTrovesAbi = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_NICR", "type": "uint256"},
      {"internalType": "address", "name": "_prevId", "type": "address"},
      {"internalType": "address", "name": "_nextId", "type": "address"}
    ],
    "name": "findInsertPosition",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const