'use client';

import { useState } from 'react';
import { useAuthorizationSignature, usePrivy } from '@privy-io/react-auth';
import Button from '@/@abstract-ui/components/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import { buildRedirectUrl } from '@/lib/redirect';
import type { PrivySignerRevokeBundle } from '@/lib/session-config';
import styles from '@/components/SessionWizard/styles.module.scss';

interface RevokePrepareResponse {
  walletId: string;
  accountAddress: string;
  patchBody: Record<string, unknown>;
}

export default function RevokeSignerFlow({
  callbackUrl,
  chainId,
  walletId,
  signerId,
  signerLabel,
  signerFingerprint,
}: {
  callbackUrl: string;
  chainId: number;
  walletId: string;
  signerId: string;
  signerLabel?: string;
  signerFingerprint?: string;
}) {
  const { ready, authenticated } = usePrivy();
  const { generateAuthorizationSignature } = useAuthorizationSignature();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  const handleRevoke = async () => {
    if (!ready || !authenticated) {
      setError('Log in to AGW before revoking this signer.');
      return;
    }
    if (!appId) {
      setError('Missing NEXT_PUBLIC_PRIVY_APP_ID.');
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const prepareResponse = await fetch(
        `/api/session/revoke?wallet_id=${encodeURIComponent(walletId)}&signer_id=${encodeURIComponent(signerId)}`,
      );
      const prepared = (await prepareResponse.json()) as RevokePrepareResponse & { error?: string };
      if (!prepareResponse.ok) {
        throw new Error(prepared.error ?? 'Failed to prepare revoke request.');
      }

      const signaturePayload = {
        version: 1 as const,
        method: 'PATCH' as const,
        url: `https://api.privy.io/api/v1/wallets/${walletId}`,
        body: prepared.patchBody,
        headers: {
          'privy-app-id': appId,
        },
      };
      const { signature } = await generateAuthorizationSignature(signaturePayload);

      const commitResponse = await fetch('/api/session/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId,
          signerId,
          patchBody: prepared.patchBody,
          authorizationSignature: signature,
        }),
      });
      const committed = (await commitResponse.json()) as { error?: string };
      if (!commitResponse.ok) {
        throw new Error(committed.error ?? 'Failed to revoke signer.');
      }

      const bundle: PrivySignerRevokeBundle = {
        version: 2,
        action: 'revoke',
        accountAddress: prepared.accountAddress,
        chainId,
        walletId,
        signerType: 'device_authorization_key',
        signerId,
        revokedAt: Math.floor(Date.now() / 1000),
      };
      setRedirectUrl(buildRedirectUrl(callbackUrl, bundle));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Card>
        <CardHeader>
          <CardTitle>Revoke AGW MCP Signer</CardTitle>
          <CardDescription>Remove this device signer from your wallet, then hand the result back to the CLI.</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          {signerLabel ? (
            <p className={styles.helper}>
              Signer label: <code>{signerLabel}</code>
            </p>
          ) : null}
          {signerFingerprint ? (
            <p className={styles.helper}>
              Signer fingerprint: <code>{signerFingerprint}</code>
            </p>
          ) : null}
          <p className={styles.helper}>
            This only removes the selected AGW MCP signer. Other AGW MCP signers on this wallet are left unchanged.
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
        </CardContent>
        <CardFooter className={styles.footer}>
          {redirectUrl ? (
            <Button className={styles.footerButton} height="40" variant="primary" href={redirectUrl}>
              Return to CLI
            </Button>
          ) : (
            <Button
              className={styles.footerButton}
              height="40"
              variant="primary"
              onClick={handleRevoke}
              disabled={isPending}
            >
              {isPending ? 'Revoking…' : 'Revoke Signer'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
