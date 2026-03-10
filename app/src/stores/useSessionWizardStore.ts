'use client';

import { create } from 'zustand';
import type { PolicyPreview } from '@/lib/policy-types';

export type SessionWizardStep =
  | 'not_logged_in'
  | 'select_policy'
  | 'creating'
  | 'success'
  | 'error';

interface SessionWizardState {
  currentStep: SessionWizardStep;
  agwAddress: string | null;
  dangerAcknowledged: boolean;
  policyPreview: PolicyPreview | null;
  error: string | null;
  redirectUrl: string | null;
  syncConnection: (input: { isConnected: boolean; address: string | null }) => void;
  setDangerAcknowledged: (value: boolean) => void;
  setValidationError: (error: string | null) => void;
  proceedToCreating: (preview: PolicyPreview) => void;
  backToPolicySelection: () => void;
  markCreationSuccess: (input: { redirectUrl: string }) => void;
  markCreationError: (error: string) => void;
}

const useSessionWizardStore = create<SessionWizardState>(set => ({
  currentStep: 'not_logged_in',
  agwAddress: null,
  dangerAcknowledged: false,
  policyPreview: null,
  error: null,
  redirectUrl: null,
  syncConnection: ({ isConnected, address }) =>
    set(state => {
      if (!isConnected || !address) {
        return {
          agwAddress: null,
          currentStep: state.currentStep === 'creating' || state.currentStep === 'success' ? state.currentStep : 'not_logged_in',
        };
      }

      return {
        agwAddress: address,
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
    }),
  backToPolicySelection: () =>
    set({
      currentStep: 'select_policy',
      policyPreview: null,
      error: null,
      redirectUrl: null,
    }),
  markCreationSuccess: ({ redirectUrl }) =>
    set({
      currentStep: 'success',
      redirectUrl,
      error: null,
    }),
  markCreationError: error =>
    set({
      currentStep: 'error',
      error,
    }),
}));

export default useSessionWizardStore;
