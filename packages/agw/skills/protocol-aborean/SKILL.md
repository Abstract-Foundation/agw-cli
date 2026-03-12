---
name: protocol-aborean
version: 1.0.0
description: Compose AGW wallet, tx, and contract commands for Aborean Finance workflows.
metadata:
  openclaw:
    requires:
      bins: ["agw"]
---

# Aborean Protocol

Use this skill for Aborean Finance workflows while keeping protocol logic outside the AGW core command surface.

## Rules

- Start with `agw app show --json '{"appId":"183"}'` to load the shipped Aborean references.
- Inspect wallet state before constructing protocol actions.
- Preview every transfer, contract write, or deployment before execution.
- Keep protocol-specific sequencing here, not in reusable AGW command definitions.

## Suggested Flow

1. `agw app show --json '{"appId":"183"}'`
2. `agw wallet balances --json '{"fields":["accountAddress","balances"]}'`
3. Preview any allowance or deposit transaction with `agw contract write --json '{...}'`
4. Execute only after explicit user confirmation using `"execute": true`
