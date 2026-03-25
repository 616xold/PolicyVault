// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import { ERC20Permit } from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';

/// @title MockUSDC
/// @notice Local-only ERC-20 used to exercise approve and permit-based vault deposits.
contract MockUSDC is ERC20, ERC20Permit {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20('Mock USDC', 'mUSDC') ERC20Permit('Mock USDC') {}

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Local faucet mint for tests and demos.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
