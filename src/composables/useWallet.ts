import { ref, computed, reactive, markRaw } from 'vue'
import { type Address, type WalletClient, formatEther, type Hash } from 'viem'
import { publicClient, getNetworkContracts } from '../config/clients'
import { connectors, type ConnectorType, CONNECTOR_TYPES } from '../config/connectors'

// --- Global State (Singleton) ---
// This mimics the "Context Provider" by keeping state outside the function scope
const account = ref<Address | null>(null)
const balance = ref<string | null>(null)
const chainId = ref<number | null>(null)
const errorMessage = ref<string | null>(null)
const isConnecting = ref(false)

// Store the active wallet client (marked raw to avoid Vue reactivity overhead on complex objects)
const walletClient = ref<WalletClient | null>(null)

// Store contract instances or addresses globally
const contracts = reactive({
  troveManager: null as Address | null,
  borrowerOperations: null as Address | null,
  priceFeed: null as Address | null,
  musdToken: null as Address | null,
})

export function useWallet() {
  
  /**
   * Initialize contracts based on current network
   */
  const setContracts = async () => {
    try {
      const networkContracts = await getNetworkContracts()
      contracts.troveManager = networkContracts.TROVE_MANAGER
      contracts.borrowerOperations = networkContracts.BORROWER_OPERATIONS
      contracts.priceFeed = networkContracts.PRICE_FEED
      contracts.musdToken = networkContracts.MUSD_TOKEN
    } catch (error) {
      console.error('Failed to set contracts:', error)
      errorMessage.value = 'Failed to load network contracts'
    }
  }

  /**
   * Connect to a specific wallet provider
   */
  const connect = async (type: ConnectorType = CONNECTOR_TYPES.INJECTED) => {
    isConnecting.value = true
    errorMessage.value = null
    
    try {
      const connector = connectors[type]
      if (!connector) throw new Error(`Connector ${type} not found`)

      const { address, client } = await connector.connect()
      
      account.value = address as Address
      walletClient.value = markRaw(client)
      
      // Setup chain data
      chainId.value = await publicClient.getChainId()
      await setContracts()
      await getBalance()

      // Setup listeners for injected provider
      if (type === CONNECTOR_TYPES.INJECTED && window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)
      }

    } catch (error: any) {
      console.error('Connection failed:', error)
      errorMessage.value = error.message || 'Failed to connect wallet'
    } finally {
      isConnecting.value = false
    }
  }

  const disconnect = () => {
    account.value = null
    balance.value = null
    walletClient.value = null
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged')
      window.ethereum.removeAllListeners('chainChanged')
    }
  }

  const getBalance = async () => {
    if (!account.value) return
    try {
      const bal = await publicClient.getBalance({ address: account.value })
      balance.value = formatEther(bal)
      return bal
    } catch (error) {
      console.error('Get balance failed:', error)
    }
  }

  // Event Handlers
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) disconnect()
    else {
      account.value = accounts[0] as Address
      getBalance()
    }
  }

  const handleChainChanged = (_chainId: string) => {
    window.location.reload()
  }

  return {
    // State
    account,
    balance,
    chainId,
    errorMessage,
    isConnecting,
    isConnected: computed(() => !!account.value),
    contracts, // Access to contract addresses
    
    // Actions
    connect,
    disconnect,
    getBalance,
    
    // Expose client for advanced usage (like writeContract)
    walletClient,
    
    // Helper to execute transactions (mimics postTransaction)
    postTransaction: async (
      to: Address, 
      data: `0x${string}`, 
      value: bigint = 0n
    ): Promise<Hash | undefined> => {
      if (!walletClient.value || !account.value) {
        errorMessage.value = 'Wallet not connected'
        return
      }
      try {
        return await walletClient.value.sendTransaction({
          account: account.value,
          to,
          data,
          value,
          chain: null
        })
      } catch (error: any) {
        errorMessage.value = error.message
        throw error
      }
    }
  }
}