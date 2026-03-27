'use client';

import { useEffect, useRef, useState } from 'react';
import { zeroAddress, type Hex } from 'viem';
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContracts,
  useWalletClient,
} from 'wagmi';

import { ChargePanel } from './charge-panel.js';
import { DepositPanel } from './deposit-panel.js';
import { EventTimeline } from './event-timeline.js';
import { PolicyPanel } from './policy-panel.js';
import { WalletState } from './wallet-state.js';
import {
  probeContractReadiness,
  type ContractReadinessState,
  type MissingContractCodeTarget,
} from '../lib/contract-readiness.js';
import {
  fetchPolicyVaultTimeline,
  type TimelineEntry,
  type TimelineLoadState,
} from '../lib/events.js';
import {
  buildPermitDomain,
  fundingTokenDefaults,
  getActionErrorMessage,
  parseFundingAmountInput,
  permitTypes,
  splitPermitSignature,
  type FundingActionState,
} from '../lib/funding.js';
import { formatTokenAmount, shortAddress } from '../lib/format.js';
import {
  initialPolicyLookupState,
  parseAddressInput,
  parseExpiryInput,
  parsePolicyAmountInput,
  parsePolicyIdInput,
  type PolicyDetails,
  type PolicyLookupState,
  type PolicyWriteState,
} from '../lib/policy.js';
import { contractConfig, mockUsdcContract, policyVaultContract } from '../lib/contracts.js';

function describeMissingContracts(missingContracts: MissingContractCodeTarget[]) {
  if (missingContracts.length === 0) {
    return 'MockUSDC and PolicyVault';
  }

  if (missingContracts.length === 1) {
    return missingContracts[0];
  }

  return `${missingContracts.slice(0, -1).join(', ')} and ${missingContracts.at(-1)}`;
}

function initialContractReadiness(): ContractReadinessState {
  if (!contractConfig.hasConfiguredAddresses) {
    return {
      kind: 'missing-addresses',
    };
  }

  return {
    kind: 'checking-contracts',
  };
}

type LastActionState = {
  message: string;
  tone: 'live' | 'muted' | 'warning' | 'error';
};

const initialTimelineState: TimelineLoadState = {
  phase: 'idle',
  message: 'Awaiting first receipt.',
};

export function VaultDashboard() {
  const [depositAmount, setDepositAmount] = useState('');
  const [fundingActionState, setFundingActionState] = useState<FundingActionState>({
    phase: 'idle',
  });
  const [beneficiary, setBeneficiary] = useState('');
  const [cap, setCap] = useState('');
  const [expiry, setExpiry] = useState('');
  const [policyLookupId, setPolicyLookupId] = useState('');
  const [loadedPolicyId, setLoadedPolicyId] = useState<Hex | undefined>();
  const [loadedPolicy, setLoadedPolicy] = useState<PolicyDetails | undefined>();
  const [policyLookupState, setPolicyLookupState] =
    useState<PolicyLookupState>(initialPolicyLookupState);
  const [createdPolicyId, setCreatedPolicyId] = useState<Hex | undefined>();
  const [createPolicyState, setCreatePolicyState] = useState<PolicyWriteState>({
    phase: 'idle',
  });
  const [actionPolicyId, setActionPolicyId] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReceiver, setWithdrawReceiver] = useState('');
  const [policyActionState, setPolicyActionState] = useState<PolicyWriteState>({
    phase: 'idle',
  });
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [timelineState, setTimelineState] = useState<TimelineLoadState>(initialTimelineState);
  const [lastActionState, setLastActionState] = useState<LastActionState>({
    message: 'Awaiting first receipt.',
    tone: 'muted',
  });
  const [contractReadiness, setContractReadiness] =
    useState<ContractReadinessState>(initialContractReadiness);
  const readinessRequestIdRef = useRef(0);
  const timelineRequestIdRef = useRef(0);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    connectAsync,
    connectors,
    error: connectError,
    isPending: isConnectPending,
  } = useConnect();
  const { disconnect, isPending: isDisconnectPending } = useDisconnect();
  const publicClient = usePublicClient({ chainId: contractConfig.chainId });
  const { data: walletClient } = useWalletClient({ chainId: contractConfig.chainId });

  const isExpectedChain = !isConnected || chainId === contractConfig.chainId;
  const selectedConnector = connectors[0];
  const owner = address ?? zeroAddress;

  const tokenMetadata = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...mockUsdcContract, functionName: 'name' },
      { ...mockUsdcContract, functionName: 'symbol' },
      { ...mockUsdcContract, functionName: 'decimals' },
    ],
    query: {
      enabled: contractReadiness.kind === 'ready',
    },
  });

  const accountReads = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...mockUsdcContract, functionName: 'balanceOf', args: [owner] },
      { ...policyVaultContract, functionName: 'vaultBalanceOf', args: [owner] },
      {
        ...mockUsdcContract,
        functionName: 'allowance',
        args: [owner, policyVaultContract.address],
      },
      { ...mockUsdcContract, functionName: 'nonces', args: [owner] },
    ],
    query: {
      enabled:
        contractReadiness.kind === 'ready' &&
        Boolean(address) &&
        isExpectedChain &&
        Boolean(publicClient),
    },
  });

  useEffect(() => {
    const requestId = ++readinessRequestIdRef.current;

    if (!contractConfig.hasConfiguredAddresses) {
      setContractReadiness({
        kind: 'missing-addresses',
      });
      return;
    }

    if (!publicClient) {
      setContractReadiness({
        kind: 'rpc-unavailable',
      });
      return;
    }

    setContractReadiness({
      kind: 'checking-contracts',
    });

    void (async () => {
      const nextReadiness = await probeContractReadiness(publicClient, {
        mockUsdcAddress: mockUsdcContract.address,
        policyVaultAddress: policyVaultContract.address,
      });

      if (requestId !== readinessRequestIdRef.current) {
        return;
      }

      setContractReadiness(nextReadiness);
    })();
  }, [publicClient]);

  const tokenSymbol = tokenMetadata.data?.[1] ?? fundingTokenDefaults.symbol;
  const tokenDecimals = tokenMetadata.data?.[2] ?? fundingTokenDefaults.decimals;
  const walletBalance = accountReads.data?.[0];
  const vaultBalance = accountReads.data?.[1];
  const allowance = accountReads.data?.[2];

  let parsedDepositAmount: bigint | undefined;
  let depositAmountError: string | undefined;
  try {
    if (depositAmount.trim()) {
      parsedDepositAmount = parseFundingAmountInput(depositAmount, tokenDecimals);
    }
  } catch (error) {
    depositAmountError = getActionErrorMessage(error);
  }

  let parsedCapAmount: bigint | undefined;
  try {
    if (cap.trim()) {
      parsedCapAmount = parsePolicyAmountInput(cap, tokenDecimals, 'cap amount');
    }
  } catch {
    parsedCapAmount = undefined;
  }

  let parsedChargeAmount: bigint | undefined;
  try {
    if (chargeAmount.trim()) {
      parsedChargeAmount = parsePolicyAmountInput(chargeAmount, tokenDecimals, 'charge amount');
    }
  } catch {
    parsedChargeAmount = undefined;
  }

  let parsedWithdrawAmount: bigint | undefined;
  try {
    if (withdrawAmount.trim()) {
      parsedWithdrawAmount = parsePolicyAmountInput(
        withdrawAmount,
        tokenDecimals,
        'withdraw amount',
      );
    }
  } catch {
    parsedWithdrawAmount = undefined;
  }

  const readinessBlocker =
    contractReadiness.kind === 'missing-addresses'
      ? 'Sync deployment first.'
      : contractReadiness.kind === 'rpc-unavailable'
        ? 'Start local node.'
        : contractReadiness.kind === 'checking-contracts'
          ? 'Checking vault.'
          : contractReadiness.kind === 'missing-bytecode'
            ? `${describeMissingContracts(contractReadiness.missingContracts)} missing. Redeploy and sync.`
            : undefined;

  const readDisabledReason = readinessBlocker;

  const writeDisabledReason = readinessBlocker
    ? readinessBlocker
    : !isConnected
      ? 'Connect wallet.'
      : !isExpectedChain
        ? `Switch to local chain (${contractConfig.chainId}).`
        : !walletClient
          ? 'Unlock wallet.'
          : tokenMetadata.isPending
            ? 'Loading token info.'
            : tokenMetadata.error
              ? `Token read failed: ${getActionErrorMessage(tokenMetadata.error)}`
              : undefined;

  const allowanceCoversAmount =
    parsedDepositAmount !== undefined && allowance !== undefined
      ? allowance >= parsedDepositAmount
      : undefined;

  async function refreshEventTimeline(options?: { showLoading?: boolean }) {
    const requestId = ++timelineRequestIdRef.current;
    const showLoading = options?.showLoading ?? true;

    if (contractReadiness.kind !== 'ready') {
      setTimelineEntries([]);
      setTimelineState({
        phase: 'idle',
        message:
          contractReadiness.kind === 'missing-addresses'
            ? 'Sync deployment to load receipts.'
            : contractReadiness.kind === 'rpc-unavailable'
              ? 'Start local node to load receipts.'
              : contractReadiness.kind === 'checking-contracts'
                ? 'Checking vault.'
                : `${describeMissingContracts(contractReadiness.missingContracts)} missing.`,
      });
      return;
    }

    const reader = publicClient;
    if (!reader) {
      setTimelineEntries([]);
      setTimelineState({
        phase: 'idle',
        message: 'Start local node to load receipts.',
      });
      return;
    }

    if (showLoading) {
      setTimelineState({
        phase: 'loading',
        message: 'Refreshing receipts.',
      });
    }

    try {
      const nextEntries = await fetchPolicyVaultTimeline(reader, {
        address: policyVaultContract.address,
        tokenDecimals,
        tokenSymbol,
      });

      if (requestId !== timelineRequestIdRef.current) {
        return;
      }

      setTimelineEntries(nextEntries);
      setTimelineState({
        phase: 'success',
        message: nextEntries.length > 0 ? 'Recent receipts loaded.' : 'No receipts yet.',
      });
    } catch (error) {
      if (requestId !== timelineRequestIdRef.current) {
        return;
      }

      setTimelineState({
        phase: 'error',
        message: `Event reads failed: ${getActionErrorMessage(error)}`,
      });
    }
  }

  async function refreshFundingReads() {
    await tokenMetadata.refetch();

    if (address && isExpectedChain) {
      await accountReads.refetch();
    }
  }

  async function loadPolicyById(
    policyIdValue: string | Hex,
    options?: {
      announce?: boolean;
      preserveOnError?: boolean;
      successMessage?: string;
    },
  ) {
    const announce = options?.announce ?? true;

    try {
      if (!contractConfig.hasConfiguredAddresses) {
        throw new Error('Run pnpm deploy:local and pnpm abi:sync first.');
      }

      if (!publicClient) {
        throw new Error('Start the local RPC with pnpm node.');
      }

      const policyId =
        typeof policyIdValue === 'string' ? parsePolicyIdInput(policyIdValue) : policyIdValue;

      if (announce) {
        setPolicyLookupState({
          phase: 'loading',
          message: 'Loading policy.',
        });
      }

      const [policy, remaining] = await Promise.all([
        publicClient.readContract({
          ...policyVaultContract,
          functionName: 'getPolicy',
          args: [policyId],
        }),
        publicClient.readContract({
          ...policyVaultContract,
          functionName: 'remaining',
          args: [policyId],
        }),
      ]);

      setLoadedPolicy({
        owner: policy.owner,
        beneficiary: policy.beneficiary,
        cap: policy.cap,
        spent: policy.spent,
        remaining,
        expiresAt: policy.expiresAt,
        revoked: policy.revoked,
      });
      setLoadedPolicyId(policyId);
      setPolicyLookupId(policyId);
      setPolicyLookupState({
        phase: 'success',
        message: options?.successMessage ?? 'Policy ready.',
      });
    } catch (error) {
      if (!options?.preserveOnError) {
        setLoadedPolicy(undefined);
        setLoadedPolicyId(undefined);
      }

      setPolicyLookupState({
        phase: 'error',
        message: getActionErrorMessage(error),
      });
    }
  }

  async function refreshDashboardReads(policyId?: Hex) {
    await Promise.all([
      refreshFundingReads(),
      refreshEventTimeline({
        showLoading: false,
      }),
    ]);

    const policyToRefresh = policyId ?? loadedPolicyId;
    if (policyToRefresh) {
      await loadPolicyById(policyToRefresh, {
        announce: false,
        preserveOnError: true,
      });
    }
  }

  useEffect(() => {
    void refreshEventTimeline();

    if (contractReadiness.kind !== 'ready' || !publicClient) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refreshEventTimeline({
        showLoading: false,
      });
    }, 15_000);

    return () => window.clearInterval(intervalId);
  }, [contractReadiness.kind, publicClient, tokenDecimals, tokenSymbol]);

  async function handleConnect() {
    if (!selectedConnector) return;

    try {
      await connectAsync({ connector: selectedConnector });
    } catch {
      // The wagmi hook already exposes the latest connect error for the panel.
    }
  }

  function resetFundingActionState() {
    if (fundingActionState.phase !== 'idle') {
      setFundingActionState({ phase: 'idle' });
    }
  }

  function resetCreatePolicyState() {
    if (createPolicyState.phase !== 'idle') {
      setCreatePolicyState({ phase: 'idle' });
    }
  }

  function resetPolicyActionState() {
    if (policyActionState.phase !== 'idle') {
      setPolicyActionState({ phase: 'idle' });
    }
  }

  function updateDepositAmount(nextAmount: string) {
    resetFundingActionState();
    setDepositAmount(nextAmount);
  }

  function updateBeneficiary(nextBeneficiary: string) {
    resetCreatePolicyState();
    setBeneficiary(nextBeneficiary);
  }

  function updateCap(nextCap: string) {
    resetCreatePolicyState();
    setCap(nextCap);
  }

  function updateExpiry(nextExpiry: string) {
    resetCreatePolicyState();
    setExpiry(nextExpiry);
  }

  function updatePolicyLookupId(nextPolicyId: string) {
    if (policyLookupState.phase !== 'idle') {
      setPolicyLookupState(initialPolicyLookupState);
    }
    setPolicyLookupId(nextPolicyId);
  }

  function updateActionPolicyId(nextPolicyId: string) {
    resetPolicyActionState();
    setActionPolicyId(nextPolicyId);
  }

  function updateChargeAmount(nextChargeAmount: string) {
    resetPolicyActionState();
    setChargeAmount(nextChargeAmount);
  }

  function updateWithdrawAmount(nextWithdrawAmount: string) {
    resetPolicyActionState();
    setWithdrawAmount(nextWithdrawAmount);
  }

  function updateWithdrawReceiver(nextReceiver: string) {
    resetPolicyActionState();
    setWithdrawReceiver(nextReceiver);
  }

  function requireWrite() {
    if (writeDisabledReason) {
      throw new Error(writeDisabledReason.replace(/`/g, ''));
    }

    if (!address || !publicClient || !walletClient) {
      throw new Error('Wallet connection is not ready.');
    }

    return {
      owner: address,
      publicClient,
      walletClient,
    };
  }

  function recordLastAction(
    tone: LastActionState['tone'],
    message: string,
    txHash?: `0x${string}`,
  ) {
    setLastActionState({
      message: txHash ? `${message} Tx ${shortAddress(txHash)}.` : message,
      tone,
    });
  }

  async function handleApproveDeposit() {
    resetFundingActionState();

    try {
      const amount = parseFundingAmountInput(depositAmount, tokenDecimals);
      const { owner: connectedOwner, publicClient: reader, walletClient: signer } = requireWrite();

      const currentAllowance = await reader.readContract({
        ...mockUsdcContract,
        functionName: 'allowance',
        args: [connectedOwner, policyVaultContract.address],
      });

      if (currentAllowance < amount) {
        const approvalSimulation = await reader.simulateContract({
          ...mockUsdcContract,
          account: signer.account,
          functionName: 'approve',
          args: [policyVaultContract.address, amount],
        });

        setFundingActionState({
          phase: 'pending',
          mode: 'approve',
          step: 'approving',
          message: 'Approval pending.',
        });

        const approvalHash = await signer.writeContract(approvalSimulation.request);
        setFundingActionState({
          phase: 'pending',
          mode: 'approve',
          step: 'approving',
          message: 'Approval pending.',
          txHash: approvalHash,
        });
        await reader.waitForTransactionReceipt({ hash: approvalHash });
      }

      const depositSimulation = await reader.simulateContract({
        ...policyVaultContract,
        account: signer.account,
        functionName: 'deposit',
        args: [amount],
      });

      setFundingActionState({
        phase: 'pending',
        mode: 'approve',
        step: 'depositing',
        message: 'Funding pending.',
      });

      const depositHash = await signer.writeContract(depositSimulation.request);
      setFundingActionState({
        phase: 'pending',
        mode: 'approve',
        step: 'depositing',
        message: 'Funding pending.',
        txHash: depositHash,
      });

      await reader.waitForTransactionReceipt({ hash: depositHash });
      await refreshDashboardReads();

      setFundingActionState({
        phase: 'success',
        mode: 'approve',
        message: 'Vault funded.',
        txHash: depositHash,
      });
      recordLastAction('live', 'Vault funded.', depositHash);
    } catch (error) {
      await refreshDashboardReads().catch(() => undefined);
      const message = getActionErrorMessage(error);
      setFundingActionState({
        phase: 'error',
        mode: 'approve',
        message,
      });
      recordLastAction('error', message);
    }
  }

  async function handlePermitDeposit() {
    resetFundingActionState();

    try {
      const amount = parseFundingAmountInput(depositAmount, tokenDecimals);
      const { owner: connectedOwner, publicClient: reader, walletClient: signer } = requireWrite();

      const [liveTokenName, liveNonce] = await Promise.all([
        reader.readContract({
          ...mockUsdcContract,
          functionName: 'name',
        }),
        reader.readContract({
          ...mockUsdcContract,
          functionName: 'nonces',
          args: [connectedOwner],
        }),
      ]);

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);

      setFundingActionState({
        phase: 'pending',
        mode: 'permit',
        step: 'signing',
        message: 'Sign in wallet.',
      });

      const signature = await signer.signTypedData({
        account: signer.account,
        domain: buildPermitDomain(liveTokenName, contractConfig.chainId, mockUsdcContract.address),
        types: permitTypes,
        primaryType: 'Permit',
        message: {
          owner: connectedOwner,
          spender: policyVaultContract.address,
          value: amount,
          nonce: liveNonce,
          deadline,
        },
      });

      const { r, s, v } = splitPermitSignature(signature);
      const permitSimulation = await reader.simulateContract({
        ...policyVaultContract,
        account: signer.account,
        functionName: 'depositWithPermit',
        args: [amount, deadline, v, r, s],
      });

      setFundingActionState({
        phase: 'pending',
        mode: 'permit',
        step: 'depositing',
        message: 'Funding pending.',
      });

      const depositHash = await signer.writeContract(permitSimulation.request);
      setFundingActionState({
        phase: 'pending',
        mode: 'permit',
        step: 'depositing',
        message: 'Funding pending.',
        txHash: depositHash,
      });

      await reader.waitForTransactionReceipt({ hash: depositHash });
      await refreshDashboardReads();

      setFundingActionState({
        phase: 'success',
        mode: 'permit',
        message: 'Vault funded.',
        txHash: depositHash,
      });
      recordLastAction('live', 'Vault funded.', depositHash);
    } catch (error) {
      await refreshDashboardReads().catch(() => undefined);
      const message = getActionErrorMessage(error);
      setFundingActionState({
        phase: 'error',
        mode: 'permit',
        message,
      });
      recordLastAction('error', message);
    }
  }

  async function handleCreatePolicy() {
    resetCreatePolicyState();

    try {
      const parsedBeneficiary = parseAddressInput(beneficiary, 'beneficiary');
      const parsedCap = parsePolicyAmountInput(cap, tokenDecimals, 'cap amount');
      const parsedExpiry = parseExpiryInput(expiry);
      const { publicClient: reader, walletClient: signer } = requireWrite();

      const createSimulation = await reader.simulateContract({
        ...policyVaultContract,
        account: signer.account,
        functionName: 'createPolicy',
        args: [parsedBeneficiary, parsedCap, parsedExpiry],
      });

      setCreatePolicyState({
        phase: 'pending',
        action: 'create',
        message: 'Creating policy.',
      });

      const createHash = await signer.writeContract(createSimulation.request);
      setCreatePolicyState({
        phase: 'pending',
        action: 'create',
        message: 'Creating policy.',
        txHash: createHash,
      });

      await reader.waitForTransactionReceipt({ hash: createHash });

      const nextPolicyId = createSimulation.result;
      setCreatedPolicyId(nextPolicyId);
      setPolicyLookupId(nextPolicyId);
      setActionPolicyId(nextPolicyId);

      await refreshDashboardReads(nextPolicyId);

      setCreatePolicyState({
        phase: 'success',
        action: 'create',
        message: 'Policy created.',
        txHash: createHash,
      });
      recordLastAction('live', 'Policy created.', createHash);
    } catch (error) {
      await refreshDashboardReads().catch(() => undefined);
      const message = getActionErrorMessage(error);
      setCreatePolicyState({
        phase: 'error',
        action: 'create',
        message,
      });
      recordLastAction('error', message);
    }
  }

  async function handleLoadPolicy() {
    await loadPolicyById(policyLookupId);
  }

  async function handleCharge() {
    resetPolicyActionState();

    try {
      const policyId = parsePolicyIdInput(actionPolicyId);
      const amount = parsePolicyAmountInput(chargeAmount, tokenDecimals, 'charge amount');
      const { publicClient: reader, walletClient: signer } = requireWrite();

      const chargeSimulation = await reader.simulateContract({
        ...policyVaultContract,
        account: signer.account,
        functionName: 'charge',
        args: [policyId, amount],
      });

      setPolicyActionState({
        phase: 'pending',
        action: 'charge',
        message: 'Charging.',
      });

      const chargeHash = await signer.writeContract(chargeSimulation.request);
      setPolicyActionState({
        phase: 'pending',
        action: 'charge',
        message: 'Charging.',
        txHash: chargeHash,
      });

      await reader.waitForTransactionReceipt({ hash: chargeHash });
      setPolicyLookupId(policyId);
      await refreshDashboardReads(policyId);

      setPolicyActionState({
        phase: 'success',
        action: 'charge',
        message: 'Charge complete.',
        txHash: chargeHash,
      });
      recordLastAction('live', 'Charge complete.', chargeHash);
    } catch (error) {
      await refreshDashboardReads().catch(() => undefined);
      const message = getActionErrorMessage(error);
      setPolicyActionState({
        phase: 'error',
        action: 'charge',
        message,
      });
      recordLastAction('error', message);
    }
  }

  async function handleRevoke() {
    resetPolicyActionState();

    try {
      const policyId = parsePolicyIdInput(actionPolicyId);
      const { publicClient: reader, walletClient: signer } = requireWrite();

      const revokeSimulation = await reader.simulateContract({
        ...policyVaultContract,
        account: signer.account,
        functionName: 'revokePolicy',
        args: [policyId],
      });

      setPolicyActionState({
        phase: 'pending',
        action: 'revoke',
        message: 'Revoking policy.',
      });

      const revokeHash = await signer.writeContract(revokeSimulation.request);
      setPolicyActionState({
        phase: 'pending',
        action: 'revoke',
        message: 'Revoking policy.',
        txHash: revokeHash,
      });

      await reader.waitForTransactionReceipt({ hash: revokeHash });
      setPolicyLookupId(policyId);
      await refreshDashboardReads(policyId);

      setPolicyActionState({
        phase: 'success',
        action: 'revoke',
        message: 'Policy revoked.',
        txHash: revokeHash,
      });
      recordLastAction('live', 'Policy revoked.', revokeHash);
    } catch (error) {
      await refreshDashboardReads().catch(() => undefined);
      const message = getActionErrorMessage(error);
      setPolicyActionState({
        phase: 'error',
        action: 'revoke',
        message,
      });
      recordLastAction('error', message);
    }
  }

  async function handleWithdraw() {
    resetPolicyActionState();

    try {
      const amount = parsePolicyAmountInput(withdrawAmount, tokenDecimals, 'withdraw amount');
      const receiver = parseAddressInput(withdrawReceiver, 'withdraw receiver');
      const { publicClient: reader, walletClient: signer } = requireWrite();

      const withdrawSimulation = await reader.simulateContract({
        ...policyVaultContract,
        account: signer.account,
        functionName: 'withdraw',
        args: [amount, receiver],
      });

      setPolicyActionState({
        phase: 'pending',
        action: 'withdraw',
        message: 'Withdrawing funds.',
      });

      const withdrawHash = await signer.writeContract(withdrawSimulation.request);
      setPolicyActionState({
        phase: 'pending',
        action: 'withdraw',
        message: 'Withdrawing funds.',
        txHash: withdrawHash,
      });

      await reader.waitForTransactionReceipt({ hash: withdrawHash });
      await refreshDashboardReads();

      setPolicyActionState({
        phase: 'success',
        action: 'withdraw',
        message: 'Funds withdrawn.',
        txHash: withdrawHash,
      });
      recordLastAction('live', 'Funds withdrawn.', withdrawHash);
    } catch (error) {
      await refreshDashboardReads().catch(() => undefined);
      const message = getActionErrorMessage(error);
      setPolicyActionState({
        phase: 'error',
        action: 'withdraw',
        message,
      });
      recordLastAction('error', message);
    }
  }

  const connectionStatus = isConnectPending
    ? 'Connecting'
    : isConnected && !isExpectedChain
      ? 'Wrong network'
      : isConnected
        ? 'Connected'
        : selectedConnector
          ? 'Disconnected'
          : 'No wallet';

  const walletStateNote =
    contractReadiness.kind === 'missing-addresses'
      ? 'Sync deployment first.'
      : contractReadiness.kind === 'rpc-unavailable'
        ? 'Start local node.'
        : contractReadiness.kind === 'checking-contracts'
          ? 'Checking vault.'
          : contractReadiness.kind === 'missing-bytecode'
            ? `${describeMissingContracts(contractReadiness.missingContracts)} missing. Redeploy and sync.`
            : !isConnected
              ? 'Connect a wallet.'
              : !isExpectedChain
                ? `Switch to local chain (${contractConfig.chainId}).`
                : accountReads.error
                  ? `Balance reads failed: ${getActionErrorMessage(accountReads.error)}`
                  : 'Ready for vault actions.';

  const timelineContractStatus =
    contractReadiness.kind === 'missing-addresses'
      ? {
          detail: 'Sync deployment to load receipts.',
          label: 'Missing deploy',
          tone: 'warning' as const,
        }
      : contractReadiness.kind === 'rpc-unavailable'
        ? {
            detail: 'Start local node to load receipts.',
            label: 'RPC offline',
            tone: 'warning' as const,
          }
        : contractReadiness.kind === 'checking-contracts'
          ? {
              detail: 'Checking vault.',
              label: 'Checking',
              tone: 'muted' as const,
            }
          : contractReadiness.kind === 'missing-bytecode'
            ? {
                detail: `${describeMissingContracts(contractReadiness.missingContracts)} missing. Redeploy and sync.`,
                label: 'No contract code',
                tone: 'warning' as const,
              }
            : {
                detail: 'Ready for live receipts.',
                label: 'Ready',
                tone: 'live' as const,
              };

  const allowanceHint = depositAmountError
    ? depositAmountError
    : parsedDepositAmount === undefined
      ? 'Choose a funding path.'
      : allowanceCoversAmount
        ? 'Ready to fund.'
        : 'Approval needed first.';

  return (
    <section className="workspace-grid">
      <section className="workflow-shell">
        <div className="surface-heading">
          <div>
            <p className="section-kicker">Flow</p>
            <h2 className="surface-title">Spend flow</h2>
          </div>
          <p className="surface-copy">Fund the vault, set limits, and use the policy.</p>
        </div>

        <div className="workflow-panels">
          <DepositPanel
            actionState={fundingActionState}
            allowanceHint={allowanceHint}
            amount={depositAmount}
            amountPreview={
              parsedDepositAmount !== undefined
                ? formatTokenAmount(parsedDepositAmount, tokenDecimals, tokenSymbol)
                : ''
            }
            disabledReason={writeDisabledReason}
            isBusy={fundingActionState.phase === 'pending'}
            onAmountChange={updateDepositAmount}
            onApproveDeposit={handleApproveDeposit}
            onPermitDeposit={handlePermitDeposit}
            tokenSymbol={tokenSymbol}
            walletBalance={formatTokenAmount(walletBalance, tokenDecimals, tokenSymbol)}
          />

          <PolicyPanel
            beneficiary={beneficiary}
            cap={cap}
            capPreview={
              parsedCapAmount !== undefined
                ? formatTokenAmount(parsedCapAmount, tokenDecimals, tokenSymbol)
                : ''
            }
            createDisabledReason={writeDisabledReason}
            createState={createPolicyState}
            createdPolicyId={createdPolicyId}
            expiry={expiry}
            isCreateBusy={createPolicyState.phase === 'pending'}
            isLookupBusy={policyLookupState.phase === 'loading'}
            loadedPolicy={loadedPolicy}
            loadedPolicyId={loadedPolicyId}
            lookupDisabledReason={readDisabledReason}
            lookupPolicyId={policyLookupId}
            lookupState={policyLookupState}
            onBeneficiaryChange={updateBeneficiary}
            onCapChange={updateCap}
            onClearCreateState={resetCreatePolicyState}
            onCreatePolicy={handleCreatePolicy}
            onExpiryChange={updateExpiry}
            onLoadPolicy={handleLoadPolicy}
            onLookupPolicyIdChange={updatePolicyLookupId}
            tokenDecimals={tokenDecimals}
            tokenSymbol={tokenSymbol}
          />

          <ChargePanel
            actionPolicyId={actionPolicyId}
            actionState={policyActionState}
            chargeAmount={chargeAmount}
            chargePreview={
              parsedChargeAmount !== undefined
                ? formatTokenAmount(parsedChargeAmount, tokenDecimals, tokenSymbol)
                : ''
            }
            disabledReason={writeDisabledReason}
            isBusy={policyActionState.phase === 'pending'}
            onActionPolicyIdChange={updateActionPolicyId}
            onCharge={handleCharge}
            onChargeAmountChange={updateChargeAmount}
            onClearStatus={resetPolicyActionState}
            onRevoke={handleRevoke}
            onWithdraw={handleWithdraw}
            onWithdrawAmountChange={updateWithdrawAmount}
            onWithdrawReceiverChange={updateWithdrawReceiver}
            tokenSymbol={tokenSymbol}
            withdrawAmount={withdrawAmount}
            withdrawPreview={
              parsedWithdrawAmount !== undefined
                ? formatTokenAmount(parsedWithdrawAmount, tokenDecimals, tokenSymbol)
                : ''
            }
            withdrawReceiver={withdrawReceiver}
          />
        </div>
      </section>

      <aside className="context-shell">
        <div className="surface-heading context-heading">
          <div>
            <p className="section-kicker">Overview</p>
            <h2 className="surface-title">Wallet overview</h2>
          </div>
          <p className="surface-copy">Balance, status, and receipts.</p>
        </div>

        <div className="context-sections">
          <WalletState
            address={address}
            allowance={formatTokenAmount(allowance, tokenDecimals, tokenSymbol)}
            connectError={connectError ? getActionErrorMessage(connectError) : undefined}
            connectionStatus={connectionStatus}
            disableConnect={!selectedConnector}
            isConnectPending={isConnectPending}
            isConnected={isConnected}
            isDisconnectPending={isDisconnectPending}
            note={walletStateNote}
            onConnect={handleConnect}
            onDisconnect={() => disconnect()}
            tokenBalance={formatTokenAmount(walletBalance, tokenDecimals, tokenSymbol)}
            vaultBalance={formatTokenAmount(vaultBalance, tokenDecimals, tokenSymbol)}
          />

          <EventTimeline
            contractStatusDetail={timelineContractStatus.detail}
            contractStatusLabel={timelineContractStatus.label}
            contractStatusTone={timelineContractStatus.tone}
            entries={timelineEntries}
            lastActionLabel={lastActionState.message}
            lastActionTone={lastActionState.tone}
            loadState={timelineState}
            onRefresh={() => {
              void refreshEventTimeline();
            }}
          />
        </div>
      </aside>
    </section>
  );
}
