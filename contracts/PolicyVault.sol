// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { IERC20Permit } from '@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
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

        uint256 newVaultBalance = _vaultBalance[msg.sender] + amount;
        _vaultBalance[msg.sender] = newVaultBalance;

        asset.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, newVaultBalance);
    }

    function depositWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        /// TODO(EP-0002/M2.1): implement permit + deposit path.
        /// Expected shape:
        /// 1. validate amount > 0
        /// 2. call IERC20Permit(address(asset)).permit(...)
        /// 3. reuse the same deposit logic
        amount;
        deadline;
        v;
        r;
        s;
        revert NotImplemented();
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
    ) external returns (bytes32 policyId) {
        /// TODO(EP-0001/M1.3): implement policy creation.
        /// Expected shape:
        /// 1. validate beneficiary, cap, expiry
        /// 2. compute policy id from owner + nonce
        /// 3. persist Policy
        /// 4. increment owner nonce
        /// 5. emit PolicyCreated
        beneficiary;
        cap;
        expiresAt;
        policyId = bytes32(0);
        revert NotImplemented();
    }

    function revokePolicy(bytes32 policyId) external {
        /// TODO(EP-0001/M1.3): implement policy revocation.
        /// Expected shape:
        /// 1. load policy
        /// 2. ensure caller is owner
        /// 3. mark revoked
        /// 4. emit PolicyRevoked
        policyId;
        revert NotImplemented();
    }

    function charge(bytes32 policyId, uint256 amount) external nonReentrant {
        /// TODO(EP-0001/M1.3): implement beneficiary charge.
        /// Expected shape:
        /// 1. validate amount > 0
        /// 2. load policy and ensure caller is beneficiary
        /// 3. enforce not revoked, not expired, within cap
        /// 4. enforce owner vault balance
        /// 5. update spent and owner vault balance
        /// 6. transfer tokens to beneficiary
        /// 7. emit Charged
        policyId;
        amount;
        revert NotImplemented();
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

    function _requirePositiveAmount(uint256 amount) internal pure {
        if (amount == 0) revert ZeroAmount();
    }

    function _requireNonZeroAddress(address value) internal pure {
        if (value == address(0)) revert ZeroAddress();
    }
}
