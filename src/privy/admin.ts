const PRIVY_API_BASE = "https://api.privy.io";

export interface PrivyAdminConfig {
  appId: string;
  appSecret: string;
}

function buildBasicAuth(appId: string, appSecret: string): string {
  return Buffer.from(`${appId}:${appSecret}`).toString("base64");
}

function buildHeaders(config: PrivyAdminConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${buildBasicAuth(config.appId, config.appSecret)}`,
    "privy-app-id": config.appId,
  };
}

async function privyFetch<T>(config: PrivyAdminConfig, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${PRIVY_API_BASE}${path}`, {
    ...init,
    headers: { ...buildHeaders(config), ...init.headers },
  });

  if (!response.ok) {
    let detail: string;
    try {
      const body = await response.json();
      detail = body.error?.message ?? body.message ?? body.error ?? JSON.stringify(body);
    } catch {
      detail = response.statusText;
    }
    throw new Error(`Privy API error (${response.status}): ${detail}`);
  }

  return response.json() as Promise<T>;
}

export async function findWalletByAddress(
  config: PrivyAdminConfig,
  address: string,
): Promise<string> {
  const userResult = await privyFetch<{ id: string }>(config, "/v1/users/wallet/address", {
    method: "POST",
    body: JSON.stringify({ address }),
  });

  const walletsResult = await privyFetch<{
    data: Array<{ id: string; address: string; chain_type: string }>;
  }>(config, `/v1/wallets?user_id=${encodeURIComponent(userResult.id)}&chain_type=ethereum`, {
    method: "GET",
  });

  const wallet = walletsResult.data?.find(
    entry => entry.address.toLowerCase() === address.toLowerCase(),
  );
  if (!wallet?.id) {
    throw new Error(`No Privy wallet found for address ${address}.`);
  }

  return wallet.id;
}
