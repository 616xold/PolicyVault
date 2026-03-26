'use client';

import { useState } from 'react';
import { zeroAddress } from 'viem';
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useReadContracts,
  useWalletClient,
} from 'wagmi';

import { DepositPanel } from './deposit-panel.js';
import { WalletState } from './wallet-state.js';
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
import { contractConfig, mockUsdcContract, policyVaultContract } from '../lib/contracts.js';

function describeAddressSource() {
  switch (contractConfig.addressSource) {
    case 'generated-localhost':
      return 'Using generated localhost deployment addresses.';
    case 'env-fallback':
      return 'Using env fallback contract addresses.';
    default:
      return 'No synced contract addresses yet.';
  }
}

export function FundingSlice() {
  const [amount, setAmount] = useState('');
  const [actionState, setActionState] = useState<FundingActionState>({ phase: 'idle' });

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectAsync, connectors, error: connectError, isPending: isConnectPending } =
    useConnect();
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
      enabled: contractConfig.hasConfiguredAddresses,
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
        contractConfig.hasConfiguredAddresses &&
        Boolean(address) &&
        isExpectedChain &&
        Boolean(publicClient),
    },
  });

  const tokenName = tokenMetadata.data?.[0] ?? fundingTokenDefaults.name;
  const tokenSymbol = tokenMetadata.data?.[1] ?? fundingTokenDefaults.symbol;
  const tokenDecimals = tokenMetadata.data?.[2] ?? fundingTokenDefaults.decimals;
  const walletBalance = accountReads.data?.[0];
  const vaultBalance = accountReads.data?.[1];
  const allowance = accountReads.data?.[2];

  let parsedAmount: bigint | undefined;
  let amountError: string | undefined;
  try {
    if (amount.trim()) {
      parsedAmount = parseFundingAmountInput(amount, tokenDecimals);
    }
  } catch (error) {
    amountError = getActionErrorMessage(error);
  }

  const writeDisabledReason = !contractConfig.hasConfiguredAddresses
    ? 'Run pnpm deploy:local and pnpm abi:sync first.'
    : !publicClient
      ? 'Start the local RPC with pnpm node.'
      : !isConnected
        ? 'Connect a wallet to fund the vault.'
        : !isExpectedChain
          ? `Switch the wallet to localhost (${contractConfig.chainId}).`
          : !walletClient
            ? 'Unlock the connected wallet to prepare transactions.'
            : tokenMetadata.isPending
              ? 'Loading token metadata.'
              : tokenMetadata.error
                ? `Token reads failed: ${getActionErrorMessage(tokenMetadata.error)}`
                : undefined;

  const allowanceCoversAmount =
    parsedAmount !== undefined && allowance !== undefined ? allowance >= parsedAmount : undefined;

  async function refreshFundingReads() {
    const refreshes = [tokenMetadata.refetch()];

    if (address && isExpectedChain) {
      refreshes.push(accountReads.refetch());
    }

    await Promise.all(refreshes);
  }

  async function handleConnect() {
    if (!selectedConnector) return;

    try {
      await connectAsync({ connector: selectedConnector });
    } catch {
      // The wagmi hook already exposes the latest connect error for the panel.
    }
  }

  function resetActionState() {
    if (actionState.phase !== 'idle') {
      setActionState({ phase: 'idle' });
    }
  }

  function updateAmount(nextAmount: string) {
    resetActionState();
    setAmount(nextAmount);
  }

  function requireFundingWrite() {
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

  async function handleApproveDeposit() {
    resetActionState();

    try {
      const depositAmount = parseFundingAmountInput(amount, tokenDecimals);
      const { owner: connectedOwner, publicClient: reader, walletClient: signer } =
        requireFundingWrite();

      const currentAllowance = await reader.readContract({
        ...mockUsdcContract,
        functionName: 'allowance',
        args: [connectedOwner, policyVaultContract.address],
      });

      let approvalWasSent = false;
      if (currentAllowance < depositAmount) {
        const approvalSimulation = await reader.simulateContract({
          ...mockUsdcContract,
          account: signer.account,
          functionName: 'approve',
          args: [policyVaultContract.address, depositAmount],
        });

        setActionState({
          phase: 'pending',
          mode: 'approve',
          step: 'approving',
          message: 'Approval pending.',
        });

        const approvalHash = await signer.writeContract(approvalSimulation.request);
        approvalWasSent = true;
        setActionState({
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
        args: [depositAmount],
      });

      setActionState({
        phase: 'pending',
        mode: 'approve',
        step: 'depositing',
        message: 'Deposit pending.',
      });

      const depositHash = await signer.writeContract(depositSimulation.request);
      setActionState({
        phase: 'pending',
        mode: 'approve',
        step: 'depositing',
        message: 'Deposit pending.',
        txHash: depositHash,
      });

      await reader.waitForTransactionReceipt({ hash: depositHash });
      await refreshFundingReads();

      setActionState({
        phase: 'success',
        mode: 'approve',
        message: approvalWasSent ? 'Approval and deposit confirmed.' : 'Deposit confirmed.',
        txHash: depositHash,
      });
    } catch (error) {
      await refreshFundingReads().catch(() => undefined);
      setActionState({
        phase: 'error',
        mode: 'approve',
        message: getActionErrorMessage(error),
      });
    }
  }

  async function handlePermitDeposit() {
    resetActionState();

    try {
      const depositAmount = parseFundingAmountInput(amount, tokenDecimals);
      const { owner: connectedOwner, publicClient: reader, walletClient: signer } =
        requireFundingWrite();

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

      setActionState({
        phase: 'pending',
        mode: 'permit',
        step: 'signing',
        message: 'Check the wallet to sign the permit.',
      });

      const signature = await signer.signTypedData({
        account: signer.account,
        domain: buildPermitDomain(liveTokenName, contractConfig.chainId, mockUsdcContract.address),
        types: permitTypes,
        primaryType: 'Permit',
        message: {
          owner: connectedOwner,
          spender: policyVaultContract.address,
          value: depositAmount,
          nonce: liveNonce,
          deadline,
        },
      });

      const { r, s, v } = splitPermitSignature(signature);
      const permitSimulation = await reader.simulateContract({
        ...policyVaultContract,
        account: signer.account,
        functionName: 'depositWithPermit',
        args: [depositAmount, deadline, v, r, s],
      });

      setActionState({
        phase: 'pending',
        mode: 'permit',
        step: 'depositing',
        message: 'Permit deposit pending.',
      });

      const depositHash = await signer.writeContract(permitSimulation.request);
      setActionState({
        phase: 'pending',
        mode: 'permit',
        step: 'depositing',
        message: 'Permit deposit pending.',
        txHash: depositHash,
      });

      await reader.waitForTransactionReceipt({ hash: depositHash });
      await refreshFundingReads();

      setActionState({
        phase: 'success',
        mode: 'permit',
        message: 'Permit deposit confirmed.',
        txHash: depositHash,
      });
    } catch (error) {
      await refreshFundingReads().catch(() => undefined);
      setActionState({
        phase: 'error',
        mode: 'permit',
        message: getActionErrorMessage(error),
      });
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

  const walletStateNote = !contractConfig.hasConfiguredAddresses
    ? 'Run pnpm deploy:local and pnpm abi:sync to materialize the local contract addresses before funding.'
    : !publicClient
      ? 'The local JSON-RPC client is unavailable. Start pnpm node before testing the funding flow.'
      : !isConnected
        ? 'Connect a localhost-funded wallet to read balances and allowance.'
        : !isExpectedChain
          ? `Switch the wallet to localhost (${contractConfig.chainId}) to read the local vault state.`
          : accountReads.error
            ? `Funding reads failed: ${getActionErrorMessage(accountReads.error)}`
            : `${describeAddressSource()} Vault ${shortAddress(policyVaultContract.address)}.`;

  const allowanceHint = amountError
    ? amountError
    : parsedAmount === undefined
      ? 'Approve sends a token approval first when needed. Permit signs typed data and deposits in one contract write.'
      : allowanceCoversAmount
        ? 'Current allowance already covers this deposit amount.'
        : 'This amount will require an approval before deposit.';

  return (
    <>
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
        tokenLabel={tokenSymbol}
        vaultBalance={formatTokenAmount(vaultBalance, tokenDecimals, tokenSymbol)}
      />

      <DepositPanel
        actionState={actionState}
        allowanceHint={allowanceHint}
        amount={amount}
        amountPreview={
          parsedAmount !== undefined ? formatTokenAmount(parsedAmount, tokenDecimals, tokenSymbol) : ''
        }
        disabledReason={writeDisabledReason}
        isBusy={actionState.phase === 'pending'}
        onAmountChange={updateAmount}
        onApproveDeposit={handleApproveDeposit}
        onPermitDeposit={handlePermitDeposit}
        tokenName={tokenName}
        tokenSymbol={tokenSymbol}
        walletBalance={formatTokenAmount(walletBalance, tokenDecimals, tokenSymbol)}
      />
    </>
  );
}
