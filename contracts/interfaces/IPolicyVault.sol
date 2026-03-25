// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IPolicyVault {
    struct Policy {
        address owner;
        address beneficiary;
        uint128 cap;
        uint128 spent;
        uint64 expiresAt;
        bool revoked;
    }

    error ZeroAmount();
    error ZeroAddress();
    error InvalidExpiry();
    error PolicyNotFound(bytes32 policyId);
    error NotPolicyOwner(bytes32 policyId, address caller);
    error NotBeneficiary(bytes32 policyId, address caller);
    error PolicyExpired(bytes32 policyId, uint64 expiresAt, uint64 nowTs);
    error PolicyIsRevoked(bytes32 policyId);
    error InsufficientVaultBalance(uint256 requested, uint256 available);
    error CapExceeded(bytes32 policyId, uint256 requested, uint256 remaining);
    error NotImplemented();

    event Deposited(address indexed owner, uint256 amount, uint256 newVaultBalance);
    event Withdrawn(
        address indexed owner,
        address indexed receiver,
        uint256 amount,
        uint256 newVaultBalance
    );
    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed owner,
        address indexed beneficiary,
        uint256 cap,
        uint64 expiresAt
    );
    event PolicyRevoked(
        bytes32 indexed policyId,
        address indexed owner,
        address indexed beneficiary
    );
    event Charged(
        bytes32 indexed policyId,
        address indexed owner,
        address indexed beneficiary,
        uint256 amount,
        uint256 spent,
        uint256 remaining
    );

    function asset() external view returns (IERC20);

    function deposit(uint256 amount) external;

    function depositWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function withdraw(uint256 amount, address receiver) external;

    function createPolicy(
        address beneficiary,
        uint256 cap,
        uint64 expiresAt
    ) external returns (bytes32 policyId);

    function revokePolicy(bytes32 policyId) external;

    function charge(bytes32 policyId, uint256 amount) external;

    function vaultBalanceOf(address owner) external view returns (uint256);

    function remaining(bytes32 policyId) external view returns (uint256);

    function nextPolicyNonce(address owner) external view returns (uint256);

    function getPolicy(bytes32 policyId) external view returns (Policy memory);

    function computePolicyId(
        address owner,
        address beneficiary,
        uint256 cap,
        uint64 expiresAt,
        uint256 nonce
    ) external pure returns (bytes32);
}
