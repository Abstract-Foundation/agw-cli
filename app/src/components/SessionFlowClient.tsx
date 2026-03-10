'use client';

import SessionWizard from '@/components/SessionWizard';
import { resolveChain, type SupportedChainId } from '@/lib/chains';

export default function SessionFlowClient({
  callbackUrl,
  chainId,
}: {
  callbackUrl: string;
  chainId: SupportedChainId;
}) {
  const chain = resolveChain(chainId);

  return <SessionWizard callbackUrl={callbackUrl} chain={chain} />;
}
