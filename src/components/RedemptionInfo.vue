<template>
  <div class="mt-16 bg-gray-900/50 p-8 rounded-3xl backdrop-blur-sm">
    <h3 class="text-2xl font-bold text-white mb-6">Liquidation vs Redemption</h3>
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
    <br/><br/>
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
            <th class="p-4">Mechanism</th>
            <th class="p-4">Trigger</th>
            <th class="p-4">Who gets collateral?</th>
            <th class="p-4">Your ICR after</th>
          </tr>
        </thead>
        <tbody class="text-gray-300">
          <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
            <td class="p-4 font-bold text-red-400">Liquidation</td>
            <td class="p-4">Your ICR &lt; 110% (unsafe)</td>
            <td class="p-4">Stability Pool + liquidator bonus</td>
            <td class="p-4 text-gray-500 italic">You lose trove</td>
          </tr>
          <tr class="hover:bg-white/5 transition-colors">
            <td class="p-4 font-bold text-emerald-400">Redemption</td>
            <td class="p-4">MUSD &lt; $1, your trove is lowest ≥110%</td>
            <td class="p-4">Redeemer gets BTC, you lose debt</td>
            <td class="p-4 text-emerald-300 font-bold">ICR goes up ↗</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>