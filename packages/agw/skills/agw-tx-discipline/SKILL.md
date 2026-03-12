---
name: agw-tx-discipline
version: 1.0.0
description: Preview-first execution rules for AGW signing, sends, transfers, contract writes, and deployments.
metadata:
  openclaw:
    requires:
      bins: ["agw"]
---

# AGW Transaction Discipline

Use this skill for any AGW action that signs data or can change chain state.

## Rules

- Preview first. Mutating commands require explicit `execute: true`.
- Never infer that preview implies permission to execute.
- Keep payloads raw and schema-aligned. Do not invent bespoke flag abstractions.
- Use `agw schema <command>` if a request shape is uncertain.
- Prefer the narrowest command that matches the action.

## Preview-First Examples

- `agw tx send --json '{"to":"0x...","data":"0x1234","value":"0"}'`
- `agw tx calls --json '{"calls":[{"to":"0x...","data":"0x1234","value":"0"}]}'`
- `agw tx transfer-token --json '{"tokenAddress":"0x...","to":"0x...","amount":"1000000"}'`
- `agw contract write --json '{"address":"0x...","abi":[...],"functionName":"setValue","args":[42]}'`
- `agw contract deploy --json '{"abi":[...],"bytecode":"0x..."}'`

Execute only after explicit confirmation by adding `"execute": true`.
