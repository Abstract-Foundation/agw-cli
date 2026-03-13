<p align="center">
  <img src="https://raw.githubusercontent.com/Abstract-Foundation/agw-mcp/main/docs/assets/banner.png" alt="AGW CLI Banner" width="100%" />
</p>

# AGW CLI

AGW is an agent-first CLI for Abstract Global Wallet workflows. The product surface is one JSON-first binary, `agw`, with runtime schema introspection, generated MCP exposure, a focused companion approval app, and shipped skills for agent guidance.

The repo follows Justin Poehnelt’s March 4, 2026 article, “You Need to Rewrite Your CLI for AI Agents”:

- raw JSON payloads instead of sprawling flag matrices
- machine-readable output by default
- runtime schema discovery through `agw schema`
- preview-first execution for risky actions
- field-trimmed and paginated reads for context-window discipline
- one shared core for CLI and MCP
- shipped operational guidance through skills

## Repo Layout

- `packages/agw`: publishable CLI package
- `packages/agw-core`: internal shared runtime, command registry, and integrations
- `app/`: browser-side approval and callback verification app

## Quick Start

```bash
pnpm install
pnpm dev schema tx.send
pnpm dev session status --json '{"fields":["status","readiness","accountAddress"]}'
pnpm dev auth init --json '{"chainId":2741}' --dry-run
pnpm dev tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --dry-run
pnpm dev tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --execute
pnpm dev wallet tokens list --json '{"pageSize":25,"fields":["items.token.symbol","items.balance","nextCursor"]}' --page-all --output ndjson
pnpm dev mcp serve
```

## Command Groups

- `agw schema`
- `agw auth`
- `agw session`
- `agw wallet`
- `agw tx`
- `agw contract`
- `agw portal`
- `agw app`
- `agw mcp`

Every executable command accepts `--json <payload|@file>` as the canonical input path.

Public runtime configuration is supplied through CLI flags or `AGW_*` env vars, not through JSON payloads:

- `AGW_HOME`
- `AGW_CHAIN_ID`
- `AGW_RPC_URL`
- `AGW_APP_URL`
- `AGW_OUTPUT`
- `AGW_CALLBACK_SIGNING_PUBLIC_KEY`
- `AGW_CALLBACK_SIGNING_ISSUER`
- `AGW_SANITIZE_PROFILE`

JSON payloads no longer carry runtime wiring such as `storageDir`, `appUrl`, or `rpcUrl`.

## Safety Model

- Mutating commands default to preview mode.
- Use `--dry-run` to validate locally without side effects.
- Use `--execute` only after explicit user confirmation.
- Output precedence is `--output`, then payload `output`, then `AGW_OUTPUT`, then the non-TTY pagination heuristic, then the command default.
- Sanitization profiles are `off` and `strict`.
- Stdout is reserved for machine-readable output.
- Inputs are validated before any downstream wallet or API action runs.
- `@file` payload reads are sandboxed to the current working directory.
- Pagination-aware non-TTY reads default to NDJSON page envelopes unless overridden.
- MCP and shipped extension surfaces default to strict sanitization for untrusted text-bearing content.
- The companion web app remains the approval trust boundary.

## Skills and Extensions

First-party skills ship under `packages/agw/skills/`. Extension descriptors for Gemini and Claude Code ship under `packages/agw/extensions/`.

Repo-wide agent invariants are shipped in [CONTEXT.md](./CONTEXT.md).

## Companion App

The companion app is documented in [app/README.md](./app/README.md). It handles onboarding, signer approval, revoke flows, and callback-key publication. It is intentionally not a second control plane.

## Development

```bash
pnpm check-types
pnpm lint
pnpm test
pnpm --dir app test
pnpm build
```
