import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getWalletById, updateWalletWithSignature } from '@/lib/server/privy-api';

interface RevokeRequestBody {
  walletId?: string;
  signerId?: string;
  authorizationSignature?: string;
  patchBody?: Record<string, unknown>;
}

async function buildRevokePatchBody(walletId: string, signerId: string) {
  const wallet = await getWalletById(walletId);
  const nextAdditionalSigners = wallet.additionalSigners
    .filter(entry => entry.signerId !== signerId)
    .map(entry => ({
      signer_id: entry.signerId,
      override_policy_ids: entry.policyIds,
    }));

  if (nextAdditionalSigners.length === wallet.additionalSigners.length) {
    throw new Error(`Signer ${signerId} is not attached to wallet ${walletId}.`);
  }

  return {
    wallet,
    patchBody: {
      additional_signers: nextAdditionalSigners,
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('wallet_id');
    const signerId = searchParams.get('signer_id');
    if (!walletId || !signerId) {
      return NextResponse.json({ error: 'Missing required query params: wallet_id, signer_id.' }, { status: 400 });
    }

    const { wallet, patchBody } = await buildRevokePatchBody(walletId, signerId);
    return NextResponse.json({
      walletId: wallet.id,
      accountAddress: wallet.address,
      patchBody,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RevokeRequestBody;
    if (!body.walletId || !body.signerId || !body.authorizationSignature || !body.patchBody) {
      return NextResponse.json(
        { error: 'Missing required fields: walletId, signerId, authorizationSignature, patchBody.' },
        { status: 400 },
      );
    }

    const { patchBody } = await buildRevokePatchBody(body.walletId, body.signerId);
    if (JSON.stringify(patchBody) !== JSON.stringify(body.patchBody)) {
      return NextResponse.json(
        { error: 'patchBody does not match the current wallet signer state.' },
        { status: 400 },
      );
    }

    const updatedWallet = await updateWalletWithSignature({
      walletId: body.walletId,
      authorizationSignature: body.authorizationSignature,
      idempotencyKey: randomUUID(),
      body: patchBody,
    });

    return NextResponse.json({
      walletId: updatedWallet.id,
      accountAddress: updatedWallet.address,
      remainingSignerIds: updatedWallet.additionalSigners.map(entry => entry.signerId),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
