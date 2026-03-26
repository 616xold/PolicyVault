// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { IERC20Permit } from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { SafeCast } from '@openzeppelin/contracts/utils/math/SafeCast.sol';
import { ReentrancyGuard } from '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import { IPolicyVault } from './interfaces/IPolicyVault.sol';

/// @title PolicyVault
/// @notice Owner-funded, beneficiary-specific bounded spend policies for a single ERC-20 asset.
contract PolicyVault is IPolicyVault, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable override asset;

    mapping(address => uint256) internal _vaultBalance;
    mapping(address => uint256) internal _ownerNonce;
    mapping(bytes32 => Policy) internal _policies;

    constructor(IERC20 asset_) {
        if (address(asset_) == address(0)) revert ZeroAddress();
        asset = asset_;
    }

    function deposit(uint256 amount) external nonReentrant {
        _requirePositiveAmount(amount);
        _depositFrom(msg.sender, amount);
    }

    function depositWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        _requirePositiveAmount(amount);

        IERC20Permit(address(asset)).permit(msg.sender, address(this), amount, deadline, v, r, s);
        _depositFrom(msg.sender, amount);
    }

    function withdraw(uint256 amount, address receiver) external nonReentrant {
        _requirePositiveAmount(amount);
        _requireNonZeroAddress(receiver);
        _requireVaultBalance(msg.sender, amount);

        uint256 newVaultBalance = _vaultBalance[msg.sender] - amount;
        _vaultBalance[msg.sender] = newVaultBalance;

        asset.safeTransfer(receiver, amount);

        emit Withdrawn(msg.sender, receiver, amount, newVaultBalance);
    }

    function createPolicy(
        address beneficiary,
        uint256 cap,
        uint64 expiresAt
    ) external nonReentrant returns (bytes32 policyId) {
        _requireNonZeroAddress(beneficiary);
        _requirePositiveAmount(cap);
        _requireFutureExpiry(expiresAt);

        uint256 nonce = _ownerNonce[msg.sender];
        policyId = computePolicyId(msg.sender, beneficiary, cap, expiresAt, nonce);

        _policies[policyId] = Policy({
            owner: msg.sender,
            beneficiary: beneficiary,
            cap: SafeCast.toUint128(cap),
            spent: 0,
            expiresAt: expiresAt,
            revoked: false
        });

        _ownerNonce[msg.sender] = nonce + 1;

        emit PolicyCreated(policyId, msg.sender, beneficiary, cap, expiresAt);
    }

    function revokePolicy(bytes32 policyId) external nonReentrant {
        Policy storage policy = _requirePolicyOwner(policyId, msg.sender);
        if (policy.revoked) revert PolicyIsRevoked(policyId);

        policy.revoked = true;

        emit PolicyRevoked(policyId, policy.owner, policy.beneficiary);
    }

    function charge(bytes32 policyId, uint256 amount) external nonReentrant {
        _requirePositiveAmount(amount);

        Policy storage policy = _requireActivePolicy(policyId, msg.sender);
        uint256 remainingAmount = uint256(policy.cap) - uint256(policy.spent);
        if (amount > remainingAmount) revert CapExceeded(policyId, amount, remainingAmount);

        _requireVaultBalance(policy.owner, amount);

        uint256 newSpent = uint256(policy.spent) + amount;
        uint256 newVaultBalance = _vaultBalance[policy.owner] - amount;
        uint256 remainingAfterCharge = remainingAmount - amount;

        policy.spent = SafeCast.toUint128(newSpent);
        _vaultBalance[policy.owner] = newVaultBalance;

        asset.safeTransfer(policy.beneficiary, amount);

        emit Charged(
            policyId,
            policy.owner,
            policy.beneficiary,
            amount,
            newSpent,
            remainingAfterCharge
        );
    }

    function vaultBalanceOf(address owner) external view returns (uint256) {
        return _vaultBalance[owner];
    }

    function remaining(bytes32 policyId) external view returns (uint256) {
        Policy memory policy = _policies[policyId];
        if (policy.owner == address(0)) revert PolicyNotFound(policyId);
        return uint256(policy.cap) - uint256(policy.spent);
    }

    function nextPolicyNonce(address owner) external view returns (uint256) {
        return _ownerNonce[owner];
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        Policy memory policy = _policies[policyId];
        if (policy.owner == address(0)) revert PolicyNotFound(policyId);
        return policy;
    }

    function computePolicyId(
        address owner,
        address beneficiary,
        uint256 cap,
        uint64 expiresAt,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(owner, beneficiary, cap, expiresAt, nonce));
    }

    function _requirePolicyOwner(bytes32 policyId, address caller) internal view returns (Policy storage) {
        Policy storage policy = _policies[policyId];
        if (policy.owner == address(0)) revert PolicyNotFound(policyId);
        if (policy.owner != caller) revert NotPolicyOwner(policyId, caller);
        return policy;
    }

    function _requireActivePolicy(bytes32 policyId, address caller) internal view returns (Policy storage) {
        Policy storage policy = _policies[policyId];
        if (policy.owner == address(0)) revert PolicyNotFound(policyId);
        if (policy.beneficiary != caller) revert NotBeneficiary(policyId, caller);
        if (policy.revoked) revert PolicyIsRevoked(policyId);
        if (block.timestamp > policy.expiresAt) {
            revert PolicyExpired(policyId, policy.expiresAt, uint64(block.timestamp));
        }
        return policy;
    }

    function _requireVaultBalance(address owner, uint256 requested) internal view {
        uint256 available = _vaultBalance[owner];
        if (requested > available) revert InsufficientVaultBalance(requested, available);
    }

    function _requireFutureExpiry(uint64 expiresAt) internal view {
        if (expiresAt <= block.timestamp) revert InvalidExpiry();
    }

    function _requirePositiveAmount(uint256 amount) internal pure {
        if (amount == 0) revert ZeroAmount();
    }

    function _requireNonZeroAddress(address value) internal pure {
        if (value == address(0)) revert ZeroAddress();
    }

    /// @dev Shared post-validation funding path so approve and permit deposits stay state/event-identical.
    function _depositFrom(address owner, uint256 amount) internal {
        uint256 newVaultBalance = _vaultBalance[owner] + amount;
        _vaultBalance[owner] = newVaultBalance;

        asset.safeTransferFrom(owner, address(this), amount);

        emit Deposited(owner, amount, newVaultBalance);
    }
}
