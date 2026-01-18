import { createWalletClient, custom, type WalletClient } from 'viem'
import { ACTIVE_CHAIN } from './mezo'

export const CONNECTOR_TYPES = {
  COINBASE: 'Coinbase',
  WALLET_CONNECT: 'WalletConnect'
} as const

export type ConnectorType = typeof CONNECTOR_TYPES[keyof typeof CONNECTOR_TYPES]

export interface WalletConnector {
  type: ConnectorType
  connect: () => Promise<{ address: string; client: WalletClient; provider: any }>
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
export const WalletConnectConnector: WalletConnector = {
  type: CONNECTOR_TYPES.WALLET_CONNECT,
  connect: async () => {
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider')

    // Note: Replace with your Project ID from https://cloud.walletconnect.com/
    // @ts-ignore
    const projectId = import.meta.env.VITE_WC_PROJECT_ID || 'YOUR_PROJECT_ID_HERE'

    const provider = await EthereumProvider.init({
      projectId,
      chains: [ACTIVE_CHAIN.id],
      showQrModal: true,
      methods: ['eth_sendTransaction', 'personal_sign'],
      events: ['chainChanged', 'accountsChanged']
    })

    await provider.enable()

    const client = createWalletClient({
      chain: ACTIVE_CHAIN,
      transport: custom(provider)
    })

    const [address] = await client.requestAddresses()
    if (!address) throw new Error('User rejected connection')

    return { address, client, provider }
  }
}

export const connectors: Record<ConnectorType, WalletConnector> = {
  [CONNECTOR_TYPES.COINBASE]: CoinbaseConnector,
  [CONNECTOR_TYPES.WALLET_CONNECT]: WalletConnectConnector
}