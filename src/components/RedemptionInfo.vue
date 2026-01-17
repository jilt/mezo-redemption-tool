<template>
  <div class="mt-16 p-8">
    <br/><br/>
    <div class="shadow-sm retro-card background-card">
      <h3 class="text-2xl font-bold text-accent mb-6">Liquidation vs Redemption</h3>
      <p class="text-gray-400 text-sm mb-8">You only redeem when MUSD is trading below $1 on the market:<br/>
      Example: MUSD trades at $0.95 on an exchange.<br/>
      You buy 1,000 MUSD for $950.<br/>
      You redeem 1,000 MUSD in Mezo and receive $992.50 of BTC (after the 0.75% redemption fee).<br/>
      You can then sell that BTC back for roughly $1,000, netting about $42.50 risk‑free (minus gas).<br/>
      So the incentive is off‑chain arbitrage profit, not extra on‑chain collateral from the trove. Redemptions are how the protocol lets traders close the gap when MUSD < $1.<br/>
      The trove owner tolerates it because when your trove is redeemed against:<br/>
      Debt goes down by the redeemed MUSD amount.<br/>
      Collateral goes down by the same dollar value.<br/>
      ICR increases, so your position becomes safer.<br/>
      If a redemption completely clears your debt, you keep the surplus BTC and can claim it. This is "neutral or even positive" for the borrower; it's not a liquidation.
    </p>
    </div>
    <br/>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-flow-rows gap-6">
      <!-- Liquidation Card -->
      <div class="retro-card background-card p-6 shadow-sm">
        <h4 class="text-xl font-bold text-accent mb-4 pb-2">Liquidation</h4>
        <ul class="space-y-3 text-gray-300 list-disc list-inside">
          <li>Your ICR &lt; 110%</li>
          <li>Stability Pool + liquidator bonus</li>
          <li>Owner lose trove</li>
        </ul>
      </div>

      <!-- Redemption Card -->
      <div class="retro-card background-card p-6 shadow-sm">
        <h4 class="text-xl font-bold text-accent mb-4 pb-2">Redemption</h4>
        <ul class="space-y-3 text-gray-300 list-disc list-inside">
          <li>MUSD &lt; $1, your trove is lowest ≥110%</li>
          <li>Redeemer gets BTC, owner lose debt</li>
          <li>ICR goes up ↗</li>
        </ul>
      </div>
    </div>
  </div>
</template>