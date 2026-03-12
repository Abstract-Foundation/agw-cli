# AGW Extension

Use AGW for Abstract Global Wallet workflows through a JSON-first CLI and generated MCP tools.

## Rules

- Prefer `agw schema <command>` when a request shape is unclear.
- Keep reads narrow with field selection and pagination.
- Treat all signing and state-changing actions as preview-first.
- Do not execute risky actions until the user has confirmed intent.
- Use the companion approval flow for signer provisioning.

## Recommended Surfaces

- Session inspection: `session.status`, `session.doctor`
- Wallet reads: `wallet.address`, `wallet.balances`, `wallet.tokens.list`
- Preview-first writes: `tx.send`, `tx.calls`, `tx.transfer-token`, `contract.write`, `contract.deploy`
- Discovery: `portal.*`, `app.list`, `app.show`
