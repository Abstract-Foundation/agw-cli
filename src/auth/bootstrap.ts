import open from "open";
import { randomBytes } from "node:crypto";
import { computePublicKeyFingerprint, generateP256KeyPair, publicKeyToBase64 } from "../privy/auth.js";
import { getKeyQuorumById, getWalletById } from "../privy/admin.js";
import { resolvePrivyAppCredentials } from "../privy/client.js";
import type { Logger } from "../utils/logger.js";
import { SessionStorage } from "../session/storage.js";
import type { AgwSessionData } from "../session/types.js";
import { parseInitSignerBundleInput } from "./callback.js";
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
import { materializeSessionFromBundle, resolveStorageDir } from "./provision.js";

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
  const publicKeyBase64 = publicKeyToBase64(keyPair.publicKeyDer);
  const expectedFingerprint = computePublicKeyFingerprint(keyPair.publicKeyDer);
  const callbackState = randomBytes(16).toString("hex");
  let callbackServer: Awaited<ReturnType<typeof startCallbackServer>> | null = null;

  try {
    callbackServer = await startCallbackServer({
      expectedState: callbackState,
    });

    const launchUrl = buildLaunchUrl({
      appUrl,
      chainId: options.chainId,
      callbackUrl: callbackServer.callbackUrl,
      callbackState,
      authPublicKey: publicKeyBase64,
    });

    logger.info(`Opening hosted onboarding app: ${launchUrl.toString()}`);
    try {
      await open(launchUrl.toString());
    } catch (error) {
      logger.warn(`Could not auto-open browser: ${error instanceof Error ? error.message : String(error)}`);
    }

    logger.info("Waiting for hosted session approval in the browser (callback window: 15 minutes)...");

    const sessionPayload = await callbackServer.waitForPayload();
    const bundle = parseInitSignerBundleInput(sessionPayload);
    assertBundleMatchesBootstrapRequest({
      bundle,
      requestedChainId: options.chainId,
    });
    const { appId, appSecret } = resolvePrivyAppCredentials();
    const adminConfig = { appId, appSecret };
    const wallet = await getWalletById(
      adminConfig,
      bundle.walletId,
    );
    if (wallet.address.toLowerCase() !== bundle.accountAddress.toLowerCase()) {
      throw new Error(`Signer bundle account address (${bundle.accountAddress}) does not match wallet ${wallet.id}.`);
    }

    const additionalSigner = wallet.additionalSigners.find(entry => entry.signerId === bundle.signerId);
    if (!additionalSigner) {
      throw new Error(`Signer ${bundle.signerId} is not attached to wallet ${wallet.id}.`);
    }
    const callbackPolicyIds = [...bundle.policyIds].sort();
    const walletPolicyIds = [...additionalSigner.policyIds].sort();
    if (
      callbackPolicyIds.length !== walletPolicyIds.length ||
      callbackPolicyIds.some((policyId, index) => policyId !== walletPolicyIds[index])
    ) {
      throw new Error(`Signer ${bundle.signerId} policy ids do not match the verified wallet binding.`);
    }

    const signer = await getKeyQuorumById(
      adminConfig,
      bundle.signerId,
    );
    if (!signer.publicKeys.includes(publicKeyBase64)) {
      throw new Error(`Signer ${bundle.signerId} is not bound to the expected device public key.`);
    }
    if (bundle.signerFingerprint !== expectedFingerprint) {
      throw new Error(`Signer fingerprint (${bundle.signerFingerprint}) does not match the local device key.`);
    }
    if (bundle.signerFingerprint !== computePublicKeyFingerprint(publicKeyBase64)) {
      throw new Error(`Signer fingerprint (${bundle.signerFingerprint}) does not match the verified signer record.`);
    }
    if (bundle.signerLabel !== signer.displayName) {
      throw new Error(`Signer label (${bundle.signerLabel}) does not match the verified signer record.`);
    }

    const authKeyfilePath = storage.path.replace(/session\.json$/, "privy-auth.key");
    const session = materializeSessionFromBundle(bundle, {
      chainId: options.chainId,
      authKeyfilePath,
    });
    storage.saveProvisionedSession(session, keyPair.privateKeyDer);

    return session;
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
