import { DEFAULT_POLICY_EXPIRY_SECONDS, DEFAULT_POLICY_FEE_LIMIT, DEFAULT_POLICY_MAX_VALUE_PER_USE } from '../config';
import type { DelegatedCapabilitySummary } from '../session-config';
import type { SessionPolicyMeta, SessionToolName } from '../policy-types';

export const DEFAULT_ENABLED_TOOLS: SessionToolName[] = [
  'get_wallet_address',
  'get_balances',
  'get_token_list',
  'get_session_status',
  'preview_transaction',
  'sign_transaction',
  'send_transaction',
  'send_calls',
  'write_contract',
  'deploy_contract',
  'revoke_session',
];

export function buildDefaultPolicyMeta(nowUnixSeconds = Math.floor(Date.now() / 1000)): SessionPolicyMeta {
  return {
    version: 1,
    mode: 'guided',
    presetId: 'full_app_control',
    presetLabel: 'AGW MCP Default',
    enabledTools: [...DEFAULT_ENABLED_TOOLS],
    selectedAppIds: [],
    selectedContractAddresses: [],
    unverifiedAppIds: [],
    warnings: [
      'This signer can submit transactions and typed-data signatures within the remote spend and time limits.',
      'Plain personal_sign requests are not enabled in the default policy.',
    ],
    generatedAt: nowUnixSeconds,
  };
}

function buildCapabilitySummary(params: {
  chainId: number;
  expiresAt: number;
}): DelegatedCapabilitySummary {
  return {
    chainId: params.chainId,
    expiresAt: params.expiresAt,
    feeLimit: DEFAULT_POLICY_FEE_LIMIT,
    maxValuePerUse: DEFAULT_POLICY_MAX_VALUE_PER_USE,
    enabledTools: [...DEFAULT_ENABLED_TOOLS],
    notes: [
      'Transaction submission is enabled with a native value cap per request.',
      'Typed-data signing is enabled for the selected chain.',
      'Plain personal_sign is disabled in the default policy.',
    ],
  };
}

export function buildDefaultPolicyRequest(params: {
  chainId: number;
  signerLabel: string;
  signerFingerprint: string;
  nowUnixSeconds?: number;
}) {
  const nowUnixSeconds = params.nowUnixSeconds ?? Math.floor(Date.now() / 1000);
  const expiresAt = nowUnixSeconds + DEFAULT_POLICY_EXPIRY_SECONDS;

  return {
    version: '1.0',
    name: `${params.signerLabel} (${params.chainId})`,
    chain_type: 'ethereum',
    rules: [
      {
        name: 'deny-export-private-key',
        action: 'DENY',
        method: 'exportPrivateKey',
        conditions: [],
      },
      {
        name: 'allow-send-transaction',
        action: 'ALLOW',
        method: 'eth_sendTransaction',
        conditions: [
          {
            field_source: 'ethereum_transaction',
            field: 'chain_id',
            operator: 'eq',
            value: String(params.chainId),
          },
          {
            field_source: 'ethereum_transaction',
            field: 'value',
            operator: 'lte',
            value: DEFAULT_POLICY_MAX_VALUE_PER_USE,
          },
          {
            field_source: 'system',
            field: 'current_unix_timestamp',
            operator: 'lt',
            value: String(expiresAt),
          },
        ],
      },
      {
        name: 'allow-sign-transaction',
        action: 'ALLOW',
        method: 'eth_signTransaction',
        conditions: [
          {
            field_source: 'ethereum_transaction',
            field: 'chain_id',
            operator: 'eq',
            value: String(params.chainId),
          },
          {
            field_source: 'ethereum_transaction',
            field: 'value',
            operator: 'lte',
            value: DEFAULT_POLICY_MAX_VALUE_PER_USE,
          },
          {
            field_source: 'system',
            field: 'current_unix_timestamp',
            operator: 'lt',
            value: String(expiresAt),
          },
        ],
      },
      {
        name: 'allow-sign-typed-data',
        action: 'ALLOW',
        method: 'eth_signTypedData_v4',
        conditions: [
          {
            field_source: 'ethereum_typed_data_domain',
            field: 'chainId',
            operator: 'eq',
            value: String(params.chainId),
          },
          {
            field_source: 'system',
            field: 'current_unix_timestamp',
            operator: 'lt',
            value: String(expiresAt),
          },
        ],
      },
    ],
    policyMeta: buildDefaultPolicyMeta(nowUnixSeconds),
    capabilitySummary: buildCapabilitySummary({
      chainId: params.chainId,
      expiresAt,
    }),
  };
}
