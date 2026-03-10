'use client';

import { create } from 'zustand';
import type { PolicyPreview } from '@/lib/policy-types';
import type { ExistingAgwMcpSignerSummary, ProvisionedSignerResult } from '@/lib/session-config';

export type SessionWizardStep =
  | 'not_logged_in'
  | 'select_policy'
  | 'creating'
  | 'success'
  | 'error';

interface SessionWizardState {
  currentStep: SessionWizardStep;
  agwAddress: string | null;
  signerAddress: string | null;
  dangerAcknowledged: boolean;
  policyPreview: PolicyPreview | null;
  error: string | null;
  redirectUrl: string | null;
  provisionedSigner: ProvisionedSignerResult | null;
  existingSigners: ExistingAgwMcpSignerSummary[];
  syncConnection: (input: { isConnected: boolean; agwAddress: string | null; signerAddress: string | null }) => void;
  setDangerAcknowledged: (value: boolean) => void;
  setValidationError: (error: string | null) => void;
  proceedToCreating: (preview: PolicyPreview) => void;
  backToPolicySelection: () => void;
  markCreationSuccess: (input: { redirectUrl: string; provisionedSigner: ProvisionedSignerResult }) => void;
  markCreationError: (error: string) => void;
}

const useSessionWizardStore = create<SessionWizardState>(set => ({
  currentStep: 'not_logged_in',
  agwAddress: null,
  signerAddress: null,
  dangerAcknowledged: false,
  policyPreview: null,
  error: null,
  redirectUrl: null,
  provisionedSigner: null,
  existingSigners: [],
  syncConnection: ({ isConnected, agwAddress, signerAddress }) =>
    set(state => {
      if (!isConnected || !agwAddress || !signerAddress) {
        return {
          agwAddress: null,
          signerAddress: null,
          currentStep: state.currentStep === 'creating' || state.currentStep === 'success' ? state.currentStep : 'not_logged_in',
        };
      }

      return {
        agwAddress,
        signerAddress,
        currentStep: state.currentStep === 'not_logged_in' ? 'select_policy' : state.currentStep,
      };
    }),
  setDangerAcknowledged: dangerAcknowledged =>
    set({
      dangerAcknowledged,
    }),
  setValidationError: error => set({ error }),
  proceedToCreating: policyPreview =>
    set({
      currentStep: 'creating',
      policyPreview,
      error: null,
      redirectUrl: null,
      provisionedSigner: null,
    }),
  backToPolicySelection: () =>
    set({
      currentStep: 'select_policy',
      policyPreview: null,
      error: null,
      redirectUrl: null,
      provisionedSigner: null,
    }),
  markCreationSuccess: ({ redirectUrl, provisionedSigner }) =>
    set({
      currentStep: 'success',
      redirectUrl,
      provisionedSigner,
      existingSigners: provisionedSigner.existingSigners,
      error: null,
    }),
  markCreationError: error =>
    set({
      currentStep: 'error',
      error,
    }),
}));

export default useSessionWizardStore;
