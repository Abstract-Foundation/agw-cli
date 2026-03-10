'use client';

import { useEffect } from 'react';
import { getSmartAccountAddressFromInitialSigner, isAGWAccount } from '@abstract-foundation/agw-client';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, type Address } from 'viem';
import { abstractTestnet } from 'viem/chains';
import useSessionWizardStore from '@/stores/useSessionWizardStore';

export function useSessionWizardState() {
  const { ready, authenticated, user } = usePrivy();

  const privyWallet = user?.linkedAccounts
    .filter(account => account.type === 'wallet')
    .find(account => account.walletClientType === 'privy');
  const signerAddress = (privyWallet?.address ?? null) as `0x${string}` | null;

  const currentStep = useSessionWizardStore(state => state.currentStep);
  const agwAddress = useSessionWizardStore(state => state.agwAddress);
  const storedSignerAddress = useSessionWizardStore(state => state.signerAddress);
  const dangerAcknowledged = useSessionWizardStore(state => state.dangerAcknowledged);
  const policyPreview = useSessionWizardStore(state => state.policyPreview);
  const error = useSessionWizardStore(state => state.error);
  const redirectUrl = useSessionWizardStore(state => state.redirectUrl);
  const provisionedSigner = useSessionWizardStore(state => state.provisionedSigner);
  const existingSigners = useSessionWizardStore(state => state.existingSigners);

  const syncConnection = useSessionWizardStore(state => state.syncConnection);
  const setDangerAcknowledged = useSessionWizardStore(state => state.setDangerAcknowledged);
  const setValidationError = useSessionWizardStore(state => state.setValidationError);
  const proceedToCreating = useSessionWizardStore(state => state.proceedToCreating);
  const backToPolicySelection = useSessionWizardStore(state => state.backToPolicySelection);
  const markCreationSuccess = useSessionWizardStore(state => state.markCreationSuccess);
  const markCreationError = useSessionWizardStore(state => state.markCreationError);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!ready || !authenticated || !user || !signerAddress) {
        syncConnection({
          isConnected: false,
          agwAddress: null,
          signerAddress: null,
        });
        return;
      }

      try {
        const publicClient = createPublicClient({
          chain: abstractTestnet,
          transport: http(),
        });

        const derivedAgwAddress = await getSmartAccountAddressFromInitialSigner(signerAddress, publicClient);
        const agwRegistered = await isAGWAccount(publicClient, derivedAgwAddress);
        if (cancelled) {
          return;
        }
        syncConnection({
          isConnected: agwRegistered,
          agwAddress: (agwRegistered ? derivedAgwAddress : null) as Address | null,
          signerAddress,
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to resolve AGW account from signer', error);
          syncConnection({
            isConnected: false,
            agwAddress: null,
            signerAddress: null,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user, signerAddress, syncConnection]);

  return {
    currentStep,
    agwAddress,
    signerAddress: storedSignerAddress,
    dangerAcknowledged,
    policyPreview,
    error,
    redirectUrl,
    provisionedSigner,
    existingSigners,
    setDangerAcknowledged,
    setValidationError,
    proceedToCreating,
    backToPolicySelection,
    markCreationSuccess,
    markCreationError,
    isConnected: Boolean(ready && authenticated && agwAddress && storedSignerAddress),
  };
}
