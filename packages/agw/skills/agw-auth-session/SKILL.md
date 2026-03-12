---
name: agw-auth-session
version: 1.0.0
description: Bootstrap, inspect, and revoke AGW sessions through the companion approval flow.
metadata:
  openclaw:
    requires:
      bins: ["agw"]
---

# AGW Auth And Session

Use this skill when an agent needs to create, inspect, or revoke an AGW session.

## Rules

- Use `agw auth init --json '{...}'` as the canonical bootstrap path.
- Do not assume write access. Inspect with `agw session status` first.
- Treat `auth.init` and `auth.revoke` as explicit-intent actions. Preview first, then execute only after user confirmation.
- Keep stdout machine-readable. Parse JSON only from stdout; logs belong on stderr.
- Use field selection on session reads when only a subset is needed.

## Default Flow

1. Inspect readiness with `agw session status --json '{"fields":["status","readiness","accountAddress","policyPreset"]}'`
2. If missing, preview bootstrap with `agw auth init --json '{"chainId":2741}'`
3. After confirmation, execute bootstrap with `agw auth init --json '{"chainId":2741,"execute":true}'`
4. Validate health with `agw session doctor --json '{}'`
5. Revoke only with explicit confirmation using `agw auth revoke --json '{"execute":true}'`
