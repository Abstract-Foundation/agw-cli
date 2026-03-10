'use client';

import SessionWizard from '@/components/SessionWizard';
import { resolveChain, type SupportedChainId } from '@/lib/chains';

export default function SessionFlowClient({
  callbackUrl,
  chainId,
  authPublicKey,
}: {
  callbackUrl: string;
  chainId: SupportedChainId;
  authPublicKey: string;
}) {
  const chain = resolveChain(chainId);

  return <SessionWizard callbackUrl={callbackUrl} chain={chain} authPublicKey={authPublicKey} />;
}
