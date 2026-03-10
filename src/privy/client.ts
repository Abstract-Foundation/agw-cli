import type { KeyObject } from "node:crypto";
import { computeAuthorizationSignature, readAuthKeyfile } from "./auth.js";
import type {
  PrivySignerConfig,
  PrivyTransactionRequest,
  PrivyWalletRpcErrorResponse,
  PrivyWalletRpcResponse,
} from "./types.js";

const PRIVY_API_BASE = "https://api.privy.io";

export interface PrivyWalletClientConfig {
  appId: string;
  appSecret: string;
  signerConfig: PrivySignerConfig;
}

export class PrivyWalletClient {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly walletId: string;
  private authKey: KeyObject | null = null;
  private readonly authKeyRef: string;

  constructor(config: PrivyWalletClientConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.walletId = config.signerConfig.walletId;
    this.authKeyRef = config.signerConfig.authKeyRef.value;
  }

  private getAuthKey(): KeyObject {
    if (!this.authKey) {
      this.authKey = readAuthKeyfile(this.authKeyRef);
    }
    return this.authKey;
  }

  private buildBasicAuth(): string {
    return Buffer.from(`${this.appId}:${this.appSecret}`).toString("base64");
  }

  private async rpc(
    method: string,
    caip2: string,
    params: Record<string, unknown>,
  ): Promise<string> {
    const url = `${PRIVY_API_BASE}/v1/wallets/${this.walletId}/rpc`;
    const body = { method, caip2, params };

    const signature = computeAuthorizationSignature(this.getAuthKey(), {
      url,
      method: "POST",
      body,
      appId: this.appId,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${this.buildBasicAuth()}`,
        "privy-app-id": this.appId,
        "privy-authorization-signature": signature,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorDetail: string;
      try {
        const errorBody = (await response.json()) as PrivyWalletRpcErrorResponse;
        errorDetail = errorBody.error?.message ?? response.statusText;
      } catch {
        errorDetail = response.statusText;
      }
      throw new Error(`Privy wallet RPC failed (${response.status}): ${errorDetail}`);
    }

    const result = (await response.json()) as PrivyWalletRpcResponse;
    return result.data.result;
  }

  async sendTransaction(chainId: number, transaction: PrivyTransactionRequest): Promise<string> {
    return this.rpc("eth_sendTransaction", `eip155:${chainId}`, { transaction });
  }

  async signMessage(chainId: number, message: string): Promise<string> {
    return this.rpc("personal_sign", `eip155:${chainId}`, {
      message,
      encoding: "utf-8",
    });
  }

  async signTypedData(chainId: number, typedData: string): Promise<string> {
    return this.rpc("eth_signTypedData_v4", `eip155:${chainId}`, {
      typed_data: typedData,
    });
  }

  async signTransaction(chainId: number, transaction: PrivyTransactionRequest): Promise<string> {
    return this.rpc("eth_signTransaction", `eip155:${chainId}`, { transaction });
  }

  getWalletId(): string {
    return this.walletId;
  }
}

export function resolvePrivyAppCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();

  if (!appId) {
    throw new Error("PRIVY_APP_ID environment variable is required.");
  }
  if (!appSecret) {
    throw new Error("PRIVY_APP_SECRET environment variable is required.");
  }

  return { appId, appSecret };
}
