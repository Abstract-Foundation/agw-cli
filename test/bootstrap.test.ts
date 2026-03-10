import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Logger } from "../src/utils/logger.js";
import { parseSignerBundleInput } from "../src/auth/callback.js";
import { materializeSessionFromBundle } from "../src/auth/provision.js";

jest.mock("open", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../src/auth/handoff.js", () => ({
  startCallbackServer: jest.fn(),
}));

jest.mock("../src/privy/admin.js", () => ({
  findWalletByAddress: jest.fn(async () => "wallet_test123"),
}));

import open from "open";
import { runBootstrapFlow } from "../src/auth/bootstrap.js";
import { startCallbackServer } from "../src/auth/handoff.js";
import { findWalletByAddress } from "../src/privy/admin.js";

const openMock = open as unknown as jest.Mock;
const startServerMock = startCallbackServer as unknown as jest.Mock;
const findWalletByAddressMock = findWalletByAddress as unknown as jest.Mock;
const ORIGINAL_APP_URL = process.env.AGW_MCP_APP_URL;
const ORIGINAL_PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const ORIGINAL_PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

function createLogger(): Logger {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: () => createLogger(),
  } as unknown as Logger;
}

function encodePayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function buildPrivyPayload(overrides: Record<string, unknown> = {}) {
  return {
    accountAddress: "0x1111111111111111111111111111111111111111",
    chainId: 11124,
    ...overrides,
  };
}

describe("bootstrap callback/signer bundle flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AGW_MCP_APP_URL = "https://onboarding.example";
    process.env.PRIVY_APP_ID = "test-app-id";
    process.env.PRIVY_APP_SECRET = "test-app-secret";
  });

  afterAll(() => {
    if (ORIGINAL_APP_URL === undefined) {
      delete process.env.AGW_MCP_APP_URL;
      return;
    }
    process.env.AGW_MCP_APP_URL = ORIGINAL_APP_URL;

    if (ORIGINAL_PRIVY_APP_ID === undefined) {
      delete process.env.PRIVY_APP_ID;
    } else {
      process.env.PRIVY_APP_ID = ORIGINAL_PRIVY_APP_ID;
    }

    if (ORIGINAL_PRIVY_APP_SECRET === undefined) {
      delete process.env.PRIVY_APP_SECRET;
    } else {
      process.env.PRIVY_APP_SECRET = ORIGINAL_PRIVY_APP_SECRET;
    }
  });

  it("parses callback URL payloads into a validated signer bundle", () => {
    // #given
    const policyMeta = {
      version: 1,
      mode: "guided",
      presetId: "payments",
      presetLabel: "Payments",
      enabledTools: ["get_session_status", "revoke_session"],
      selectedAppIds: [],
      selectedContractAddresses: [],
      unverifiedAppIds: [],
      warnings: [],
      generatedAt: 1_800_000_000,
    };
    const payload = buildPrivyPayload({ policyMeta });

    // #when
    const encoded = encodePayload(payload);
    const parsed = parseSignerBundleInput(`http://127.0.0.1:8787/callback?session=${encoded}`);

    // #then
    expect(parsed.accountAddress).toBe("0x1111111111111111111111111111111111111111");
    expect(parsed.chainId).toBe(11124);
    expect(parsed.policyMeta).toEqual(policyMeta);
  });

  it("materializes session bundle with auth keyfile path", () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-"));
    const now = 1_800_000_000;

    try {
      const authKeyfilePath = path.join(tmpDir, "privy-auth.key");
      fs.writeFileSync(authKeyfilePath, "wallet-auth:dGVzdC1rZXktZGF0YQ==\n", { mode: 0o600 });

      // #when
      const session = materializeSessionFromBundle(
        buildPrivyPayload({
          policyMeta: {
            version: 1,
            mode: "guided",
            presetId: "payments",
            presetLabel: "Payments",
            enabledTools: ["get_session_status", "revoke_session"],
            selectedAppIds: [],
            selectedContractAddresses: [],
            unverifiedAppIds: [],
            warnings: [],
            generatedAt: now,
          },
        }),
        {
          chainId: 11124,
          walletId: "wallet_test123",
          storageDir: tmpDir,
          authKeyfilePath,
          nowUnixSeconds: now,
        },
      );

      // #then
      expect(session.privyAuthKeyRef).toBeDefined();
      expect(session.privyAuthKeyRef!.kind).toBe("keyfile");
      expect(session.privyAuthKeyRef!.value).toBe(authKeyfilePath);
      expect(session.privyWalletId).toBe("wallet_test123");
      expect(session.policyMeta?.presetId).toBe("payments");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("opens hosted onboarding URL with callback_url + chain_id and then saves session", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));

    let resolvePayload!: (value: string) => void;
    const payloadPromise = new Promise<string>(resolve => {
      resolvePayload = resolve;
    });

    startServerMock.mockResolvedValue({
      callbackUrl: "http://127.0.0.1:4567/callback/abc123",
      waitForPayload: () => payloadPromise,
      close: async () => undefined,
    });

    openMock.mockImplementation(async (url: string) => {
      const launchUrl = new URL(url);
      expect(`${launchUrl.origin}${launchUrl.pathname}`).toBe("https://onboarding.example/session/new");
      const callbackUrlParam = launchUrl.searchParams.get("callback_url");
      expect(callbackUrlParam).toBeTruthy();
      const callbackUrl = new URL(callbackUrlParam!);
      expect(`${callbackUrl.origin}${callbackUrl.pathname}`).toBe("http://127.0.0.1:4567/callback/abc123");
      expect(callbackUrl.searchParams.get("state")).toMatch(/^[0-9a-f]{32}$/);
      expect(launchUrl.searchParams.get("chain_id")).toBe("11124");
      expect(launchUrl.searchParams.get("auth_pubkey")).toBeNull();

      const keyfilePath = path.join(tmpDir, "privy-auth.key");
      expect(fs.existsSync(keyfilePath)).toBe(true);

      resolvePayload(encodePayload(buildPrivyPayload()));
    });

    // #when
    try {
      const session = await runBootstrapFlow(createLogger(), {
        chainId: 11124,
        storageDir: tmpDir,
      });

      // #then
      expect(startServerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedState: expect.stringMatching(/^[0-9a-f]{32}$/),
        }),
      );
      expect(session.privyAuthKeyRef).toBeDefined();
      expect(session.privyAuthKeyRef!.kind).toBe("keyfile");
      expect(session.privyAuthKeyRef!.value).toBe(path.join(tmpDir, "privy-auth.key"));
      expect(session.chainId).toBe(11124);
      expect(session.privyWalletId).toBe("wallet_test123");
      expect(findWalletByAddressMock).toHaveBeenCalledWith(
        { appId: "test-app-id", appSecret: "test-app-secret" },
        "0x1111111111111111111111111111111111111111",
      );
      expect(fs.existsSync(path.join(tmpDir, ".bootstrap-init.lock"))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("defaults to mcp.abs.xyz when onboarding app URL is not configured", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));
    const previous = process.env.AGW_MCP_APP_URL;
    delete process.env.AGW_MCP_APP_URL;

    try {
      let resolvePayload!: (value: string) => void;
      const payloadPromise = new Promise<string>(resolve => {
        resolvePayload = resolve;
      });

      startServerMock.mockResolvedValue({
        callbackUrl: "http://127.0.0.1:4567/callback/default-host",
        waitForPayload: () => payloadPromise,
        close: async () => undefined,
      });

      openMock.mockImplementation(async (url: string) => {
        const launchUrl = new URL(url);
        expect(`${launchUrl.origin}${launchUrl.pathname}`).toBe("https://mcp.abs.xyz/session/new");
        expect(launchUrl.searchParams.get("auth_pubkey")).toBeNull();

        resolvePayload(encodePayload(buildPrivyPayload()));
      });

      // #when
      const session = await runBootstrapFlow(createLogger(), {
        chainId: 11124,
        storageDir: tmpDir,
      });

      // #then
      expect(session.chainId).toBe(11124);
    } finally {
      if (previous === undefined) {
        delete process.env.AGW_MCP_APP_URL;
      } else {
        process.env.AGW_MCP_APP_URL = previous;
      }
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects insecure non-loopback http app URLs", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));

    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
          appUrl: "http://mcp.abs.xyz",
        }),
      ).rejects.toThrow("Refusing insecure app URL over http for non-loopback host");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("fails when another bootstrap lock already exists", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-lock-"));
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, ".bootstrap-init.lock"), JSON.stringify({ pid: process.pid }), { mode: 0o600 });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("already in progress");
      expect(startServerMock).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("recovers stale bootstrap lock and continues", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-lock-"));
    const lockPath = path.join(tmpDir, ".bootstrap-init.lock");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(lockPath, "stale-lock", { mode: 0o600 });

    const staleAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    fs.utimesSync(lockPath, staleAt, staleAt);

    let resolvePayload!: (value: string) => void;
    const payloadPromise = new Promise<string>(resolve => {
      resolvePayload = resolve;
    });

    startServerMock.mockResolvedValue({
      callbackUrl: "http://127.0.0.1:4567/callback/abc123",
      waitForPayload: () => payloadPromise,
      close: async () => undefined,
    });

    openMock.mockImplementation(async () => {
      resolvePayload(encodePayload(buildPrivyPayload()));
    });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).resolves.toBeDefined();
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects malformed payload with invalid account address", () => {
    const payload = buildPrivyPayload({ accountAddress: "not-an-address" });

    expect(() => parseSignerBundleInput(encodePayload(payload))).toThrow("Invalid signer bundle accountAddress.");
  });

  it("rejects malformed payload with missing account address", () => {
    const payload = buildPrivyPayload({ accountAddress: "" });

    expect(() => parseSignerBundleInput(encodePayload(payload))).toThrow("Invalid signer bundle accountAddress.");
  });

  it("rejects malformed payload when chain id is missing", () => {
    const payload = buildPrivyPayload();
    delete (payload as { chainId?: number }).chainId;

    expect(() => parseSignerBundleInput(encodePayload(payload))).toThrow("Invalid chainId");
  });

  it("rejects bundle when returned chain id mismatches requested chain", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-flow-"));

    let resolvePayload!: (value: string) => void;
    const payloadPromise = new Promise<string>(resolve => {
      resolvePayload = resolve;
    });

    startServerMock.mockResolvedValue({
      callbackUrl: "http://127.0.0.1:4567/callback/abc123",
      waitForPayload: () => payloadPromise,
      close: async () => undefined,
    });

    openMock.mockImplementation(async () => {
      resolvePayload(encodePayload(buildPrivyPayload({ chainId: 2741 })));
    });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("does not match requested chain id");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("restores previous local key/session files when bootstrap fails", async () => {
    // #given
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agw-mcp-bootstrap-restore-"));
    const originalKey = "wallet-auth:dGVzdC1vcmlnaW5hbC1rZXk=\n";
    const originalSession = JSON.stringify(
      {
        accountAddress: "0x1111111111111111111111111111111111111111",
        chainId: 11124,
        createdAt: 1_800_000_000,
        updatedAt: 1_800_000_000,
        status: "active",
        privyWalletId: "wallet_previous",
        privyAuthKeyRef: {
          kind: "keyfile",
          value: path.join(tmpDir, "privy-auth.key"),
        },
      },
      null,
      2,
    );
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "privy-auth.key"), originalKey, { mode: 0o600 });
    fs.writeFileSync(path.join(tmpDir, "session.json"), originalSession, { mode: 0o600 });

    let resolvePayload!: (value: string) => void;
    const payloadPromise = new Promise<string>(resolve => {
      resolvePayload = resolve;
    });

    startServerMock.mockResolvedValue({
      callbackUrl: "http://127.0.0.1:4567/callback/abc123",
      waitForPayload: () => payloadPromise,
      close: async () => undefined,
    });

    openMock.mockImplementation(async () => {
      resolvePayload(encodePayload(buildPrivyPayload({ chainId: 2741 })));
    });

    // #then
    try {
      await expect(
        runBootstrapFlow(createLogger(), {
          chainId: 11124,
          storageDir: tmpDir,
        }),
      ).rejects.toThrow("does not match requested chain id");

      expect(fs.readFileSync(path.join(tmpDir, "privy-auth.key"), "utf8")).toBe(originalKey);
      expect(fs.readFileSync(path.join(tmpDir, "session.json"), "utf8")).toBe(originalSession);
      expect(fs.existsSync(path.join(tmpDir, ".bootstrap-init.lock"))).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
