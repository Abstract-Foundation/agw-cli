import { PrivyWalletClient, resolvePrivyAppCredentials } from "../privy/client.js";
import { DEFAULT_CHAIN_ID, resolveNetworkConfig, type ResolvedNetworkConfig } from "../config/network.js";
import type { Logger } from "../utils/logger.js";
import { SessionStorage } from "./storage.js";
import type { AgwSessionData, SessionStatus } from "./types.js";

export interface SessionManagerOptions {
  storageDir?: string;
  chainId?: number;
  rpcUrl?: string;
}

export class SessionManager {
  private readonly storage: SessionStorage;
  private readonly logger: Logger;
  private readonly chainId: number;
  private readonly rpcUrl?: string;
  private session: AgwSessionData | null = null;
  private privyClient: PrivyWalletClient | null = null;

  constructor(logger: Logger, options: SessionManagerOptions = {}) {
    this.logger = logger.child("session");
    this.storage = new SessionStorage(options.storageDir);
    this.chainId = options.chainId ?? DEFAULT_CHAIN_ID;
    this.rpcUrl = options.rpcUrl;
  }

  initialize(): void {
    const session = this.storage.load();
    if (!session) {
      this.logger.warn("No AGW session found. Run the bootstrap flow before write operations.");
      this.session = null;
      return;
    }

    this.session = session;
    this.logger.info(`Loaded session for ${session.accountAddress}`);
  }

  getSession(): AgwSessionData | null {
    return this.session;
  }

  getSessionStatus(): SessionStatus {
    if (!this.session) {
      return "missing";
    }
    return this.session.status;
  }

  setSession(session: AgwSessionData): void {
    this.session = session;
    this.storage.save(session);
    this.privyClient = null;
  }

  clearSession(): void {
    this.session = null;
    this.privyClient = null;
    this.storage.delete();
  }

  markSessionRevoked(updatedAtUnixSeconds = Math.floor(Date.now() / 1000)): void {
    if (!this.session) {
      throw new Error("session is missing");
    }

    this.session = {
      ...this.session,
      status: "revoked",
      updatedAt: updatedAtUnixSeconds,
    };
    this.storage.save(this.session);
    this.storage.deleteAuthKeyfile();
    this.privyClient = null;
  }

  getChainId(): number {
    return this.chainId;
  }

  getNetworkConfig(chainId?: number): ResolvedNetworkConfig {
    return resolveNetworkConfig({
      chainId: chainId ?? this.chainId,
      rpcUrl: this.rpcUrl,
    });
  }

  getPrivyWalletClient(): PrivyWalletClient {
    if (!this.session) {
      throw new Error("session is missing");
    }
    if (!this.session.privyWalletId || !this.session.privyAuthKeyRef) {
      throw new Error(
        "write signer is not configured for this session. Re-run `agw-mcp init` and complete delegated access approval.",
      );
    }

    if (!this.privyClient) {
      const { appId, appSecret } = resolvePrivyAppCredentials();
      this.privyClient = new PrivyWalletClient({
        appId,
        appSecret,
        signerConfig: {
          walletId: this.session.privyWalletId,
          authKeyRef: this.session.privyAuthKeyRef,
        },
      });
    }

    return this.privyClient;
  }

  getStorageDir(): string {
    return this.storage.storageDir;
  }
}
