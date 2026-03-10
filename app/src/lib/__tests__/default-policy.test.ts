import { describe, expect, it } from 'vitest';
import { buildDefaultPolicyRequest } from '../server/default-policy';

describe('default-policy', () => {
  it('scopes transaction signing and sending rules to the selected chain', () => {
    const policy = buildDefaultPolicyRequest({
      chainId: 11124,
      signerLabel: 'AGW MCP signer',
      signerFingerprint: 'abc:def',
      nowUnixSeconds: 1_800_000_000,
    });

    const sendRule = policy.rules.find(rule => rule.method === 'eth_sendTransaction');
    const signRule = policy.rules.find(rule => rule.method === 'eth_signTransaction');

    expect(sendRule?.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_source: 'ethereum_transaction',
          field: 'chain_id',
          operator: 'eq',
          value: '11124',
        }),
      ]),
    );
    expect(signRule?.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_source: 'ethereum_transaction',
          field: 'chain_id',
          operator: 'eq',
          value: '11124',
        }),
      ]),
    );
  });
});
