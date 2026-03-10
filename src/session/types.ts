export type SessionStatus = "missing" | "pending" | "active" | "revoked";

export type SessionPolicyPresetId =
  | "payments"
  | "trading"
  | "gaming"
  | "contract_write"
  | "deploy"
  | "signing"
  | "full_app_control"
  | "custom";

export type SessionToolName =
  | "get_wallet_address"
  | "get_balances"
  | "get_token_list"
  | "get_session_status"
  | "sign_message"
  | "sign_transaction"
  | "transfer_token"
  | "swap_tokens"
  | "preview_transaction"
  | "revoke_session"
  | "send_transaction"
  | "send_calls"
  | "write_contract"
  | "deploy_contract";

export interface SessionPolicyMeta {
  version: 1;
  mode: "guided" | "advanced";
  presetId: SessionPolicyPresetId;
  presetLabel: string;
  enabledTools: SessionToolName[];
  selectedAppIds: string[];
  selectedContractAddresses: string[];
  unverifiedAppIds: string[];
  warnings: string[];
  generatedAt: number;
}

export interface AgwSessionData {
  accountAddress: string;
  chainId: number;
  createdAt: number;
  updatedAt: number;
  status: Exclude<SessionStatus, "missing">;
  policyMeta?: SessionPolicyMeta;
  privyWalletId?: string;
  privyPolicyId?: string;
  privyQuorumId?: string;
  privyAuthKeyRef?: {
    kind: "keyfile";
    value: string;
  };
}
