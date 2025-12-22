/// <reference types="vite/client" />

// ✅ EIP-1193 Wallet types
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on: (event: string, callback: (...args: any[]) => void) => void
    removeAllListeners: (event?: string) => void
    selectedAddress?: string
  }
}
