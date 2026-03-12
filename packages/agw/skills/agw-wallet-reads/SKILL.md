---
name: agw-wallet-reads
version: 1.0.0
description: Context-window-safe wallet and token inspection through AGW.
metadata:
  openclaw:
    requires:
      bins: ["agw"]
---

# AGW Wallet Reads

Use this skill for wallet identity, balances, and token inventory.

## Rules

- Default to `--json` payloads and machine-readable output.
- Always trim reads with `fields` when possible.
- Prefer paginated or NDJSON output for token inventories.
- Inspect session state before assuming a linked wallet is available.

## Useful Commands

- `agw wallet address --json '{}'`
- `agw wallet balances --json '{"fields":["accountAddress","chainId","balances"]}'`
- `agw wallet tokens list --json '{"pageSize":25,"fields":["items.token.symbol","items.balance","nextCursor"]}'`
