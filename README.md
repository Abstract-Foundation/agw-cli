# AGW

AGW is an agent-first CLI for Abstract Global Wallet workflows. The product surface is one JSON-first binary, `agw`, with runtime schema introspection, generated MCP exposure, a focused companion approval app, and shipped skills for agent guidance.

The repo follows Justin Poehnelt’s March 4, 2026 article, “You Need to Rewrite Your CLI for AI Agents”:

- raw JSON payloads instead of sprawling flag matrices
- machine-readable output by default
- runtime schema discovery through `agw schema`
- preview-first execution for risky actions
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
pnpm dev auth init --json '{"chainId":2741}'
pnpm dev tx send --json '{"to":"0x...","data":"0x1234","value":"0"}'
pnpm dev mcp serve --json '{}'
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

## Safety Model

- Risky actions require `execute: true`.
- Preview results are returned by default for signing and state-changing flows.
- Stdout is reserved for machine-readable output.
- Inputs are validated before any downstream wallet or API action runs.
- The companion web app remains the approval trust boundary.

## Skills and Extensions

First-party skills ship under `packages/agw/skills/`. Extension descriptors for Gemini and Claude Code ship under `packages/agw/extensions/`.

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
