import { createWalletClient, custom, type WalletClient } from 'viem'
import { ACTIVE_CHAIN } from './mezo'

export const CONNECTOR_TYPES = {
  COINBASE: 'Coinbase',
  WALLET_CONNECT: 'WalletConnect',
  INJECTED: 'Injected'
} as const

export type ConnectorType = typeof CONNECTOR_TYPES[keyof typeof CONNECTOR_TYPES]

export interface WalletConnector {
  type: ConnectorType
  connect: () => Promise<{ address: string; client: WalletClient; provider: any }>
}

// Injected Connector (MetaMask, Rabby, etc.)
export const InjectedConnector: WalletConnector = {
  type: CONNECTOR_TYPES.INJECTED,
  connect: async () => {
    const provider = (window as any).ethereum
    if (!provider) throw new Error('No injected wallet found. Please install MetaMask.')

    const client = createWalletClient({
      chain: ACTIVE_CHAIN,
      transport: custom(provider)
    })

    const [address] = await client.requestAddresses()
    if (!address) throw new Error('User rejected connection')

    return { address, client, provider }
  }
}

// Coinbase Connector (Example stub - requires SDK)
export const CoinbaseConnector: WalletConnector = {
  type: CONNECTOR_TYPES.COINBASE,
  connect: async () => {
    const { default: CoinbaseWalletSDK } = await import('@coinbase/wallet-sdk')

    const sdk = new CoinbaseWalletSDK({
      appName: 'Mezo Redemption'
    })

    const provider = sdk.makeWeb3Provider()

    const client = createWalletClient({
      chain: ACTIVE_CHAIN,
      transport: custom(provider)
    })

    const [address] = await client.requestAddresses()
    if (!address) throw new Error('User rejected connection')

    return { address, client, provider }
  }
}

// WalletConnect Connector (Example stub - requires SDK)
// Use a global key to prevent re-initialization during HMR (Hot Module Replacement)
const WC_PROVIDER_KEY = '__MEZO_WC_PROVIDER__'

export const WalletConnectConnector: WalletConnector = {
  type: CONNECTOR_TYPES.WALLET_CONNECT,
  connect: async () => {
    let wcProvider = (window as any)[WC_PROVIDER_KEY]

    if (!wcProvider) {
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider')

      // Note: Replace with your Project ID from https://cloud.walletconnect.com/
      // @ts-ignore
      const projectId = import.meta.env.VITE_WC_PROJECT_ID

      if (!projectId || projectId === 'YOUR_PROJECT_ID_HERE') {
        throw new Error('Missing WalletConnect Project ID. Please add VITE_WC_PROJECT_ID to your .env file.')
      }

      wcProvider = await EthereumProvider.init({
        projectId,
        optionalChains: [ACTIVE_CHAIN.id],
        rpcMap: {
          [ACTIVE_CHAIN.id]: ACTIVE_CHAIN.rpcUrls.default.http[0]
        },
        showQrModal: true,
        methods: ['eth_sendTransaction', 'personal_sign'],
        events: ['chainChanged', 'accountsChanged'],
        metadata: {
          name: 'Mezo Redemption',
          description: 'Redeem MUSD for collateral on Mezo.',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`],
        },
      })
      ;(window as any)[WC_PROVIDER_KEY] = wcProvider
    }

    try {
      // This opens the modal if not connected.
      // If already connected, it resolves immediately.
      await wcProvider.connect()
    } catch (error) {
      // If the user closes the modal or a race condition occurs, check if we have a session anyway.
      if (!wcProvider.session) throw error
    }

    const client = createWalletClient({
      chain: ACTIVE_CHAIN,
      transport: custom(wcProvider)
    })

    const [address] = await client.requestAddresses()
    if (!address) throw new Error('User rejected connection')

    return { address, client, provider: wcProvider }
  }
}

export const connectors: Record<ConnectorType, WalletConnector> = {
  [CONNECTOR_TYPES.COINBASE]: CoinbaseConnector,
  [CONNECTOR_TYPES.WALLET_CONNECT]: WalletConnectConnector,
  [CONNECTOR_TYPES.INJECTED]: InjectedConnector
}