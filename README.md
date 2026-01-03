# Mezo Devezoper bounty 
Anti liquidation tool for the mezo blockchain [bounty program](https://coda.io/d/Mezo-Community-Resources_d7Ee5YHYoEI/Devezoper-Bounties_su3zAeuq#_luxuowSF) and the [virtual grant metaverse]()

## Vue 3 + TypeScript + Vite UI

`npm run dev` to run on testnet

`npm run build` to run on mainnet

## Test on fork

Fork is tested and working with anvil (foundry)

Suggested rpc: [https://drpc.org/chainlist/mezo-mainnet-rpc](https://drpc.org/chainlist/mezo-mainnet-rpc)
1) Run the node:
`anvil --fork-url https://lb.drpc.live/mezo/YOUR_API_KEY --chain-id 31337 --host 127.0.0.1 --port 8545`
2) Run the UI: `npm run dev:fork`


## What you can do
The UI lists all troves with 110 -150% ICR and automagically redeems 10% of the less healthy ones when you click the redeem button.

To test you can create a trove using our "open trove" button, it will calculate and let you review the ICR risk before you send the transaction then click on "redeem riskiest trove" button on testnet or in a fork.

You can also test using the script (in the fork): `npx tsx .\verify-redemption.ts `