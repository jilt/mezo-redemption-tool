# Mezo Devezoper bounty 
Arbitrage MUSD tool for the mezo blockchain [bounty program](https://coda.io/d/Mezo-Community-Resources_d7Ee5YHYoEI/Devezoper-Bounties_su3zAeuq#_luxuowSF) and the [virtual grant metaverse]()

[video demo](https://drive.google.com/file/d/1xbVqAOeX0f0WAyrfeOa6fuMRFTP8oNCu/view?usp=sharing)

(I'm sorry audio was cut explanation here in the readme)

## Vue 3 + TypeScript + Vite UI

`npm run dev` to run on testnet

`npm run build` to run on mainnet

## Test on fork

Fork is tested and working with anvil (foundry)

Suggested rpc: [https://drpc.org/chainlist/mezo-mainnet-rpc](https://drpc.org/chainlist/mezo-mainnet-rpc)
1) Run the node:
`anvil --fork-url https://lb.drpc.live/mezo/YOUR_API_KEY --chain-id 31337 --host 127.0.0.1 --port 8545`
2) Deploy and cast the mock oracle contract
3) Run the UI: `npm run dev:fork`


## What you can do
The UI lists all troves starting with the lower ICR risk,and automagically redeems 10% of the less healthy ones when you click the redeem button.

To test you can create a trove using our "open trove" button, it will calculate and let you review the ICR risk before you send the transaction then click on "redeem riskiest" button on testnet or in a fork.

I have kept the open trove button for testnet or mainned to be able to further implement this project there's also some utilities for troves owners.

The fork has serious storage deserialization problems, so i had to stub some contract call outputs, those fallbacks are conditional to the fork's chainID.


1. Local Fork (31337)
→ Uses stubs and mock oracle✅

2. Mezo Mainnet (21337)
→ Uses real calls ✅

3. Testnet
→ Uses real calls ✅

Vue Component auto-detects network and applies workarounds only where needed. Production-ready!

I also had to mockup some crucial parts of PriceFeed, so when you launch the fork you need to deploy the MockOracle contract at the right address for it to be called by other contracts, you can reach out to me on the [mezo discord](https://discord.gg/mezo) if you need help with that.

You can also test using this script (in the fork): `npx tsx .\verify-redemption.ts `