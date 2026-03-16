<p align="center">
  <img src="https://raw.githubusercontent.com/Abstract-Foundation/agw-mcp/main/docs/assets/banner.png" alt="AGW CLI Banner" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@abstract-foundation/agw-cli"><img src="https://img.shields.io/npm/v/@abstract-foundation/agw-cli" alt="npm version" /></a>
  <a href="https://github.com/Abstract-Foundation/agw-mcp/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Abstract-Foundation/agw-mcp" alt="License" /></a>
  <img src="https://img.shields.io/node/v/@abstract-foundation/agw-cli" alt="Node.js version" />
</p>

# AGW CLI

AGW is an agent-first CLI for [Abstract Global Wallet](https://docs.abs.xyz/abstract-global-wallet/overview). It enables AI agents like [Claude](https://code.claude.com/docs/en/overview) to interact with your Abstract Global Wallet autonomously — viewing wallet balances, sending transactions, and interacting with apps deployed on [Abstract](https://abs.xyz/).

It also ships a built-in [MCP](https://modelcontextprotocol.io/) server, so any MCP-compatible host can use AGW as a native tool surface.

## Features

- **Agent-first design** — structured JSON input/output on every command, built for LLM tool-use
- **Built-in MCP server** — plug into Claude Code, Gemini, or any MCP-compatible host
- **Preview-first writes** — all state-changing commands require explicit `--execute` after `--dry-run`
- **Session-key auth** — delegated signing via companion app approval, no private keys exposed to agents
- **Schema introspection** — `agw-cli schema <command>` for machine-readable input/output specs
- **Pagination & field trimming** — narrow reads with `fields`, paginate with `--page-all`
- **Agent skills** — installable skills that teach AI agents safe CLI usage patterns

## Get Started

Copy and paste this prompt to your LLM agent (Claude Code, Codex, etc.):

```text
Install and configure the AGW CLI by following the instructions here (use curl to fetch this file, NOT WebFetch): https://raw.githubusercontent.com/Abstract-Foundation/agw-mcp/main/docs/guide/installation.md
```

Or, read the [installation guide](https://github.com/Abstract-Foundation/agw-mcp/blob/main/docs/guide/installation.md) directly.

### Prerequisites

- Node.js 18+
- npm 10+

### Install

```bash
npm install -g @abstract-foundation/agw-cli
```

### Authenticate

The companion app handles authentication. Run the init flow to create a session key linked to your wallet:

```bash
agw-cli auth init --json '{"chainId":2741}' --execute
```

This opens your browser where you connect an existing AGW or create a new one, then approve the agent signer for this machine.

### Verify

```bash
agw-cli session status --json '{"fields":["status","readiness","accountAddress"]}'
```

## Commands

| Group | Commands | Description |
|-------|----------|-------------|
| **wallet** | `address`, `balances`, `tokens list` | Read wallet identity, balances, and token inventory |
| **tx** | `preview`, `send`, `calls`, `transfer-token`, `sign-message`, `sign-transaction` | Preview and execute transactions |
| **contract** | `write`, `deploy` | Interact with or deploy smart contracts |
| **auth** | `init`, `revoke` | Manage session-key authentication |
| **session** | `status`, `doctor` | Inspect and troubleshoot session state |
| **app** | `list`, `show` | Discover apps deployed on Abstract |
| **portal** | `streams list`, `user-profile get` | Browse Portal content and profiles |
| **schema** | `list`, `get` | Introspect command schemas |
| **mcp** | `serve` | Start the built-in MCP server |
| **mcp-config** | — | Print a ready-to-paste MCP config snippet |

Run `agw-cli schema <command>` for detailed input/output schemas on any command.

## Usage Examples

**Check your wallet balance:**

```bash
agw-cli wallet balances --json '{"fields":["native","tokens"]}'
```

**Preview a transaction before sending:**

```bash
agw-cli tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --dry-run
```

**Execute after reviewing the preview:**

```bash
agw-cli tx send --json '{"to":"0x...","data":"0x1234","value":"0"}' --execute
```

**Stream paginated token list:**

```bash
agw-cli wallet tokens list \
  --json '{"pageSize":25,"fields":["items.symbol","items.value","nextCursor"]}' \
  --page-all --output ndjson
```

**Discover apps on Abstract:**

```bash
agw-cli app list --json '{"pageSize":10,"fields":["items.id","items.name"]}'
```

## MCP Server

AGW ships a built-in MCP server generated from the same command registry as the CLI. Start it with:

```bash
agw-cli mcp serve --sanitize strict
```

Or generate a config snippet to paste into your agent host:

```bash
agw-cli mcp-config        # local binary
agw-cli mcp-config --npx  # npx-based (no global install needed)
```

## Agent Skills

The repo ships agent skills that teach AI agents how to use the CLI safely. Install them with:

```bash
npx skills add https://github.com/Abstract-Foundation/agw-mcp/tree/main/packages/agw-cli/skills
```

Available skills:

| Skill | What it covers |
|-------|----------------|
| `agw-auth-session` | Session bootstrap, inspection, and troubleshooting |
| `agw-wallet-reads` | Wallet identity, balances, and token inventory |
| `agw-tx-discipline` | Preview-first execution rules for signing and sends |
| `agw-portal-discovery` | App and Portal stream discovery |
| `protocol-aborean` | Aborean Finance protocol workflows |

## Agent Host Extensions

Pre-built configuration for:

- **Claude Code** — MCP config scaffold in `packages/agw-cli/extensions/claude-code/`
- **Gemini** — Extension guidance in `packages/agw-cli/extensions/gemini/`

Both assume `agw-cli` is installed and on `PATH`.

## Configuration

Runtime configuration via environment variables:

| Variable | Description |
|----------|-------------|
| `AGW_HOME` | Override AGW home directory (default: `~/.agw/`) |
| `AGW_CHAIN_ID` | Default chain ID |
| `AGW_RPC_URL` | RPC URL override |
| `AGW_APP_URL` | Companion app URL override |
| `AGW_OUTPUT` | Default output mode (`json` or `ndjson`) |
| `AGW_SANITIZE_PROFILE` | Sanitization profile (`off` or `strict`) |

Or use CLI flags: `--home`, `--chain-id`, `--rpc-url`, `--app-url`, `--output`, `--sanitize`.

## Security

- Session keys are stored locally with restrictive file permissions (`0o600`)
- All write operations are default-deny — no action executes without a matching policy
- State-changing commands require explicit `--execute` after preview
- Companion callback payloads are signed and verified before session materialization
- No secrets or session material in logs

See [SECURITY.md](SECURITY.md) and [THREAT_MODEL.md](THREAT_MODEL.md) for details.

## Project Status

> **Under active development** — breaking changes possible before v1.0.

## Contributing

Issues and pull requests are welcome at [github.com/Abstract-Foundation/agw-mcp](https://github.com/Abstract-Foundation/agw-mcp/issues).

## License

[MIT](LICENSE) — Abstract Foundation
