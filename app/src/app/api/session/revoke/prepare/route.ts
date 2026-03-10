import { NextResponse } from 'next/server';
import { getWalletById } from '@/lib/server/privy-api';

interface RevokePrepareRequestBody {
  walletId?: string;
  signerId?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RevokePrepareRequestBody;
    if (!body.walletId || !body.signerId) {
      return NextResponse.json(
        { error: 'Missing required fields: walletId, signerId.' },
        { status: 400 },
      );
    }

    const wallet = await getWalletById(body.walletId);
    const nextAdditionalSigners = wallet.additionalSigners
      .filter(entry => entry.signerId !== body.signerId)
      .map(entry => ({
        signer_id: entry.signerId,
        override_policy_ids: entry.policyIds,
      }));

    if (nextAdditionalSigners.length === wallet.additionalSigners.length) {
      return NextResponse.json(
        { error: `Signer ${body.signerId} is not attached to wallet ${body.walletId}.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      walletId: wallet.id,
      accountAddress: wallet.address,
      signerId: body.signerId,
      updateBody: {
        additional_signers: nextAdditionalSigners,
      },
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
