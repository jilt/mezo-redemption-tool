// contracts/test/MockOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockOracle {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            1,                          // roundId
            100000e8,                   // $100,000 BTC price (8 decimals)
            block.timestamp,            // startedAt
            block.timestamp,            // updatedAt
            1                           // answeredInRound
        );
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }
}
