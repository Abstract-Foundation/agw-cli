import { describe, expect, it } from 'vitest';
import { buildRedirectUrl, fromBase64Url, isLoopbackCallbackUrl } from '../redirect';

describe('redirect helpers', () => {
  it('builds loopback redirect with session payload', () => {
    const url = buildRedirectUrl('http://127.0.0.1:8787/cb/test', {
      version: 2,
      action: 'init',
      accountAddress: '0x1111111111111111111111111111111111111111',
      chainId: 11124,
      walletId: 'wallet_test123',
      signerType: 'device_authorization_key',
      signerId: 'quorum_test456',
      policyIds: ['policy_test789'],
      signerFingerprint: 'abc:def',
      signerLabel: 'AGW MCP abc:def',
      signerCreatedAt: 1_800_000_000,
      capabilitySummary: {
        chainId: 11124,
        expiresAt: 1_800_003_600,
        feeLimit: '2000000000000000',
        maxValuePerUse: '10000000000000000',
        enabledTools: ['get_session_status', 'revoke_session'],
        notes: ['Transactions and typed-data signatures are enabled.'],
      },
      policyMeta: {
        version: 1,
        mode: 'guided',
        presetId: 'full_app_control',
        presetLabel: 'Broad AGW MCP Access',
        enabledTools: ['get_session_status', 'revoke_session'],
        selectedAppIds: [],
        selectedContractAddresses: [],
        unverifiedAppIds: [],
        warnings: [],
        generatedAt: 1_800_000_000,
      },
    });

    const parsed = new URL(url);
    const session = parsed.searchParams.get('session');
    expect(session).toBeTruthy();
    expect(JSON.parse(fromBase64Url(session!))).toMatchObject({
      action: 'init',
      chainId: 11124,
      walletId: 'wallet_test123',
      signerId: 'quorum_test456',
    });
  });

  it('rejects non-loopback callback urls', () => {
    expect(() =>
      buildRedirectUrl('https://evil.example/callback', {
        version: 2,
        action: 'revoke',
        accountAddress: '0x1111111111111111111111111111111111111111',
        chainId: 11124,
        walletId: 'wallet_test123',
        signerType: 'device_authorization_key',
        signerId: 'quorum_test456',
        revokedAt: 1_800_000_000,
      }),
    ).toThrow('Only loopback');

    expect(isLoopbackCallbackUrl('http://localhost:8787/cb')).toBe(true);
    expect(isLoopbackCallbackUrl('https://localhost:8787/cb')).toBe(false);
    expect(isLoopbackCallbackUrl('http://user:pass@127.0.0.1:8787/cb')).toBe(false);
  });
});
