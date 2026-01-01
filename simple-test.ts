import { createPublicClient, http } from 'viem'
import { hardhat } from 'viem/chains'

async function main() {
  const client = createPublicClient({ chain: hardhat, transport: http() })
  const block = await client.getBlockNumber()
  console.log('✅ BLOCK:', Number(block))
  console.log('🎉 FORK:', Number(block) > 0 ? 'ACTIVE!' : 'FAILED')
}

main().catch(console.error)
