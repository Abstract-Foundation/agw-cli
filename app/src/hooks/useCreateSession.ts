'use client';

import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { useSessionSigners } from '@privy-io/react-auth';
import type { PolicyPreview } from '@/lib/policy-types';
import type { PrivySignerInitBundle, ProvisionedSignerResult } from '@/lib/session-config';

export interface CreateAgentSignerInput {
  accountAddress: Address;
  chainId: number;
  authPublicKey: string;
  policyPayload: PolicyPreview['policyPayload'];
}

export function useCreateAgentSigner() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSessionSigners } = useSessionSigners();

  const createAgentSigner = useCallback(
    async ({
      accountAddress,
      chainId,
      authPublicKey,
      policyPayload,
    }: CreateAgentSignerInput): Promise<{ bundle: PrivySignerInitBundle; provisionedSigner: ProvisionedSignerResult }> => {
      setIsPending(true);
      setError(null);

      try {
        const provisionResponse = await fetch('/api/session/provision', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountAddress,
            chainId,
            authPublicKey,
          }),
        });
        const provisionBody = (await provisionResponse.json()) as ProvisionedSignerResult & { error?: string };
        if (!provisionResponse.ok) {
          throw new Error(provisionBody.error ?? 'Failed to provision AGW MCP signer.');
        }

        await addSessionSigners({
          address: accountAddress,
          signers: [
            {
              signerId: provisionBody.signerId,
              policyIds: provisionBody.policyIds,
            },
          ],
        });

        const bundle: PrivySignerInitBundle = {
          version: 2,
          action: 'init',
          accountAddress,
          chainId,
          walletId: provisionBody.walletId,
          signerType: 'device_authorization_key',
          signerId: provisionBody.signerId,
          policyIds: provisionBody.policyIds,
          signerFingerprint: provisionBody.signerFingerprint,
          signerLabel: provisionBody.signerLabel,
          signerCreatedAt: provisionBody.signerCreatedAt,
          policyMeta: provisionBody.policyMeta ?? policyPayload.policyMeta!,
          capabilitySummary: provisionBody.capabilitySummary,
        };

        return {
          bundle,
          provisionedSigner: provisionBody,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [addSessionSigners],
  );

  return {
    createAgentSigner,
    isPending,
    error,
  };
}
