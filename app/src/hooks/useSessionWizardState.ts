'use client';

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import useSessionWizardStore from '@/stores/useSessionWizardStore';

export function useSessionWizardState() {
  const { ready, authenticated, user } = usePrivy();

  const privyWallet = user?.linkedAccounts
    .filter(account => account.type === 'wallet')
    .find(account => account.walletClientType === 'privy');
  const address = (privyWallet?.address ?? null) as `0x${string}` | null;
  const isConnected = Boolean(ready && authenticated && address);

  const currentStep = useSessionWizardStore(state => state.currentStep);
  const agwAddress = useSessionWizardStore(state => state.agwAddress);
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
    syncConnection({
      isConnected,
      address,
    });
  }, [isConnected, address, syncConnection]);

  return {
    currentStep,
    agwAddress,
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
    isConnected,
  };
}
