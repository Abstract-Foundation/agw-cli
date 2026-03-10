import { randomBytes } from "node:crypto";
import { getWalletById } from "../privy/admin.js";
import { resolvePrivyAppCredentials } from "../privy/client.js";
import type { AgwSessionData } from "../session/types.js";
import type { Logger } from "../utils/logger.js";
import {
  assertRevokeBundleMatchesRequest,
  buildRevokeLaunchUrl,
  resolveAppUrl,
  validateAppUrl,
} from "./bootstrap-internals.js";
import { parseRevokeSignerBundleInput } from "./callback.js";
import { startCallbackServer } from "./handoff.js";

export interface RemoteRevokeOptions {
  appUrl?: string;
}

export async function runRemoteRevokeFlow(
  logger: Logger,
  session: AgwSessionData,
  options: RemoteRevokeOptions = {},
): Promise<void> {
  if (!session.privyWalletId || !session.privySignerBinding) {
    throw new Error("session is missing remote signer metadata");
  }

  const appUrl = resolveAppUrl(options);
  validateAppUrl(appUrl);

  const callbackState = randomBytes(16).toString("hex");
  const callbackServer = await startCallbackServer({
    expectedState: callbackState,
  });

  try {
    const launchUrl = buildRevokeLaunchUrl({
      appUrl,
      chainId: session.chainId,
      callbackUrl: callbackServer.callbackUrl,
      callbackState,
      walletId: session.privyWalletId,
      signerId: session.privySignerBinding.id,
      signerLabel: session.privySignerBinding.label,
      signerFingerprint: session.privySignerBinding.fingerprint,
    });

    logger.info(`Opening hosted revoke flow: ${launchUrl.toString()}`);
    try {
      const { default: open } = await import("open");
      await open(launchUrl.toString());
    } catch (error) {
      logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info("Waiting for hosted signer revocation approval in the browser (callback window: 15 minutes)...");
    const payload = await callbackServer.waitForPayload();
    const bundle = parseRevokeSignerBundleInput(payload);
    assertRevokeBundleMatchesRequest({
      bundle,
      requestedChainId: session.chainId,
      walletId: session.privyWalletId,
      signerId: session.privySignerBinding.id,
    });

    if (bundle.accountAddress.toLowerCase() !== session.accountAddress.toLowerCase()) {
      throw new Error(`Revoke bundle account address (${bundle.accountAddress}) does not match the active session.`);
    }

    const { appId, appSecret } = resolvePrivyAppCredentials();
    const wallet = await getWalletById({ appId, appSecret }, session.privyWalletId);
    if (wallet.additionalSigners.some(entry => entry.signerId === session.privySignerBinding?.id)) {
      throw new Error(`Signer ${session.privySignerBinding.id} is still attached to wallet ${session.privyWalletId}.`);
    }
  } finally {
    await callbackServer.close().catch(() => undefined);
  }
}
