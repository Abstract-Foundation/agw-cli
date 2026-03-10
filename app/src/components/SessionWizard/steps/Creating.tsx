'use client';

import { useEffect, useRef } from 'react';
import type { Chain } from 'viem/chains';
import { useHeadlessDelegatedActions } from '@privy-io/react-auth';
import Button from '@/@abstract-ui/components/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import { useCreateAgentSigner } from '@/hooks/useCreateSession';
import { useSessionWizardState } from '@/hooks/useSessionWizardState';
import { buildRedirectUrl } from '@/lib/redirect';
import styles from '../styles.module.scss';

export default function Creating({
  callbackUrl,
  chain,
}: {
  callbackUrl: string;
  chain: Chain;
}) {
  const hasStartedRef = useRef(false);
  const {
    agwAddress,
    policyPreview,
    markCreationError,
    markCreationSuccess,
  } = useSessionWizardState();
  const { createAgentSigner, isPending } = useCreateAgentSigner();
  const { delegateWallet } = useHeadlessDelegatedActions();

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const run = async () => {
      try {
        if (!agwAddress) {
          throw new Error('Wallet is not connected.');
        }
        if (!policyPreview) {
          throw new Error('Policy preview is missing.');
        }
        const accountAddress = agwAddress as `0x${string}`;

        const bundle = await createAgentSigner({
          accountAddress,
          chainId: chain.id,
          policyPayload: policyPreview.policyPayload,
          delegateWallet,
        });

        const redirectUrl = buildRedirectUrl(callbackUrl, bundle);
        markCreationSuccess({ redirectUrl });
      } catch (error) {
        markCreationError(error instanceof Error ? error.message : String(error));
      }
    };

    void run();
  }, [
    agwAddress,
    policyPreview,
    createAgentSigner,
    delegateWallet,
    callbackUrl,
    chain.id,
    markCreationError,
    markCreationSuccess,
  ]);

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>Setting Up Agent Access</CardTitle>
          <CardDescription>Requesting delegated wallet access for this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={styles.helper}>
            {isPending
              ? 'Waiting for Privy delegation approval...'
              : 'Preparing delegated access request...'}
          </p>
        </CardContent>
        <CardFooter className={styles.footer}>
          <Button className={styles.footerButton} height="40" variant="secondary" disabled>
            In Progress
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
