# AGW PRD (v1)

## Scope
Build a local stdio MCP server and local companion app for AGW users to perform common crypto wallet actions through session keys.

## Naming + Compatibility Requirements
- The steady-state repo, package, and binary identity is `agw`.
- The current package, `@abstract-foundation/agw-mcp`, must remain the migration source and compatibility install path until the rename rollout completes.
- The canonical CLI binary after the rename is `agw`; `agw-mcp` is legacy-only and should live in the compatibility package, not alongside the canonical binary.
- The MCP server alias remains `agw` so client configuration names stay stable.
- Local state migration from `~/.agw-mcp` is a separate follow-up; the rename release should not force re-onboarding.
- Detailed rollout rules live in `meta/rename-compatibility-strategy.md`.

## Core Tool Surface (v1)
- `get_wallet_address`
- `get_balances`
- `get_token_list`
- `get_session_status`
- `sign_message`
- `sign_transaction`
- `send_transaction`
- `send_calls`
- `transfer_token`
- `swap_tokens`
- `write_contract`
- `deploy_contract`
- `preview_transaction`
- `revoke_session`

## Execution Semantics (locked)
- `sign_transaction`: signs and returns signed payload only; never broadcasts.
- `send_transaction`: executes signing + broadcast path and returns transaction hash.
- `swap_tokens`: routes through 0x backend (quote + execute flow).
- Write/sign tools must align with official AGW action semantics (`signMessage`, `signTransaction`, `sendTransaction`, `sendCalls`, `writeContract`, `deployContract`).

## Network Strategy
- Default target: Abstract testnet.
- Mainnet support: config-driven (`chainId`, RPC URL, env vars) without architectural rewrite.

## Acceptance Shape
- Users can complete the top wallet workflows on Abstract testnet.
- Write tools enforce session-policy constraints.
