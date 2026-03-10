'use client';

import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import type { PolicyPreview } from '@/lib/policy-types';
import type { PrivySignerBundle } from '@/lib/session-config';

export interface CreateAgentSignerInput {
  accountAddress: Address;
  chainId: number;
  policyPayload: PolicyPreview['policyPayload'];
  delegateWallet: (params: {
    address: string;
    chainType: 'ethereum';
  }) => Promise<unknown>;
}

export function useCreateAgentSigner() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAgentSigner = useCallback(
    async ({
      accountAddress,
      chainId,
      policyPayload,
      delegateWallet,
    }: CreateAgentSignerInput): Promise<PrivySignerBundle> => {
      setIsPending(true);
      setError(null);

      try {
        await delegateWallet({
          address: accountAddress,
          chainType: 'ethereum',
        });

        return {
          accountAddress,
          chainId,
          policyMeta: policyPayload.policyMeta,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return {
    createAgentSigner,
    isPending,
    error,
  };
}
