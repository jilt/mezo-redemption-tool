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
  },
  {
    "inputs": [],
    "name": "getSize",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFirst",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLast",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_id", "type": "address"}
    ],
    "name": "getPrev",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_id", "type": "address"}
    ],
    "name": "getNext",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const
