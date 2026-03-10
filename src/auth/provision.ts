import os from "node:os";
import path from "node:path";
import { writeAuthKeyfile } from "../privy/auth.js";
import type { AgwSessionData } from "../session/types.js";
import type { PrivySignerBundlePayload } from "./callback.js";

export interface MaterializeSessionFromBundleOptions {
  chainId: number;
  walletId: string;
  storageDir?: string;
  authKeyfilePath: string;
  nowUnixSeconds?: number;
}

export function resolveStorageDir(storageDir?: string): string {
  return storageDir ?? path.join(os.homedir(), ".agw-mcp");
}

export function writeAuthKey(privateKeyDer: Buffer, storageDir: string): string {
  return writeAuthKeyfile(privateKeyDer, storageDir);
}

export function materializeSessionFromBundle(
  bundle: PrivySignerBundlePayload,
  options: MaterializeSessionFromBundleOptions,
): AgwSessionData {
  if (bundle.chainId !== options.chainId) {
    throw new Error(`Signer bundle chain id (${bundle.chainId}) does not match requested chain id (${options.chainId}).`);
  }

  const now = options.nowUnixSeconds ?? Math.floor(Date.now() / 1000);

  return {
    accountAddress: bundle.accountAddress,
    chainId: bundle.chainId,
    createdAt: now,
    updatedAt: now,
    status: "active",
    policyMeta: bundle.policyMeta,
    privyWalletId: options.walletId,
    privyAuthKeyRef: {
      kind: "keyfile",
      value: options.authKeyfilePath,
    },
  };
}
