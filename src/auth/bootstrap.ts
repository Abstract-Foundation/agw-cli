import open from "open";
import { randomBytes } from "node:crypto";
import { generateP256KeyPair } from "../privy/auth.js";
import { findWalletByAddress } from "../privy/admin.js";
import { resolvePrivyAppCredentials } from "../privy/client.js";
import type { Logger } from "../utils/logger.js";
import { SessionStorage } from "../session/storage.js";
import type { AgwSessionData } from "../session/types.js";
import { parseSignerBundleInput } from "./callback.js";
import {
  acquireBootstrapLock,
  assertBundleMatchesBootstrapRequest,
  buildLaunchUrl,
  captureStorageSnapshot,
  resolveAppUrl,
  restoreStorageSnapshot,
  validateAppUrl,
} from "./bootstrap-internals.js";
import { startCallbackServer } from "./handoff.js";
import { materializeSessionFromBundle, resolveStorageDir, writeAuthKey } from "./provision.js";

export interface BootstrapOptions {
  appUrl?: string;
  chainId: number;
  rpcUrl?: string;
  storageDir?: string;
}

export async function runBootstrapFlow(logger: Logger, options: BootstrapOptions): Promise<AgwSessionData> {
  const appUrl = resolveAppUrl(options);
  validateAppUrl(appUrl);

  const storageDir = resolveStorageDir(options.storageDir);
  const lock = acquireBootstrapLock(storageDir);

  const storage = new SessionStorage(storageDir);
  const previousSession = storage.load();
  if (previousSession && previousSession.status === "active") {
    logger.warn("Replacing existing active session. The previous signer will remain registered until explicitly revoked.");
  }
  const snapshot = captureStorageSnapshot(storageDir);

  const keyPair = generateP256KeyPair();
  const callbackState = randomBytes(16).toString("hex");
  let callbackServer: Awaited<ReturnType<typeof startCallbackServer>> | null = null;

  try {
    const authKeyfilePath = writeAuthKey(keyPair.privateKeyDer, storageDir);

    callbackServer = await startCallbackServer({
      expectedState: callbackState,
    });

    const launchUrl = buildLaunchUrl({
      appUrl,
      chainId: options.chainId,
      callbackUrl: callbackServer.callbackUrl,
      callbackState,
    });

    logger.info(`Opening hosted onboarding app: ${launchUrl.toString()}`);
    try {
      await open(launchUrl.toString());
    } catch (error) {
      logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info("Waiting for hosted session approval in the browser (callback window: 15 minutes)...");

    const sessionPayload = await callbackServer.waitForPayload();
    const bundle = parseSignerBundleInput(sessionPayload);
    assertBundleMatchesBootstrapRequest({
      bundle,
      requestedChainId: options.chainId,
    });
    const { appId, appSecret } = resolvePrivyAppCredentials();
    const walletId = await findWalletByAddress(
      { appId, appSecret },
      bundle.accountAddress,
    );

    return materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      walletId,
      storageDir,
      authKeyfilePath,
    });
  } catch (error) {
    restoreStorageSnapshot(snapshot);
    throw error;
  } finally {
    if (callbackServer) {
      await callbackServer.close().catch(() => undefined);
    }
    lock.release();
  }
}
