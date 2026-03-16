---
name: managing-agent-identity
description: Register, inspect, and manage AI agent identity and reputation on Abstract via ERC-8004 IdentityRegistry and ReputationRegistry contracts. Use when a user wants to register an agent identity, check if an address has an ERC-8004 registration, read or update agent metadata, set an agent wallet, give or read reputation feedback, query reputation summaries, or interact with the Trustless Agents standard on Abstract. Trigger for requests mentioning ERC-8004, agent identity, agent registration, reputation, feedback, IdentityRegistry, ReputationRegistry, agentId, agentURI, or trustless agents on Abstract.
---

# Managing Agent Identity

ERC-8004 ("Trustless Agents") is a draft Ethereum standard for AI agent trust infrastructure. Abstract deploys IdentityRegistry and ReputationRegistry on both mainnet and testnet. Agents register as ERC-721 tokens and accumulate on-chain reputation through client feedback.

## Operating Rules

- Check session readiness before any write operation. Route session issues to `authenticating-with-agw`.
- Preview every registration, metadata update, and feedback submission with `--dry-run` before execution.
- Read [references/identity-registry.md](./references/identity-registry.md) for the full IIdentityRegistry interface, registration flow, and metadata management.
- Read [references/reputation-registry.md](./references/reputation-registry.md) for the full IReputationRegistry interface, feedback flow, and aggregation.

## Deployed Contracts

| Contract | Mainnet (2741) | Testnet (11124) |
|----------|---------------|-----------------|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

These are deterministic CREATE2 deployments — same addresses across all 20+ EVM chains.

## Core Concepts

- **Agent identity** is an ERC-721 token minted by `register()`. The token owner controls the identity.
- **agentURI** resolves to a JSON registration file containing name, description, services, and x402 support.
- **agentWallet** is a reserved metadata key for the agent's payment address. Requires EIP-712 or ERC-1271 signature to change. Cleared on transfer.
- **Reputation** is submitted by clients via `giveFeedback()` with a signed value, optional tags, and optional off-chain evidence.
- **Validation Registry** is not yet deployed on Abstract.

## Task Map

### Read identity for a wallet

```bash
agw contract write --json '{
  "address": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  "abi": ["function balanceOf(address owner) view returns (uint256)"],
  "functionName": "balanceOf",
  "args": ["<WALLET_ADDRESS>"]
}' --dry-run
```

If balance > 0, the wallet owns at least one agent identity. Use `tokenOfOwnerByIndex` or events to find the specific `agentId`.

### Register a new agent identity

```bash
agw contract write --json '{
  "address": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  "abi": ["function register(string agentURI) returns (uint256 agentId)"],
  "functionName": "register",
  "args": ["https://example.com/agent.json"]
}' --dry-run
```

The returned `agentId` is the ERC-721 token ID. Execute only after user confirms the preview.

### Read agent metadata

```bash
agw contract write --json '{
  "address": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  "abi": ["function tokenURI(uint256 tokenId) view returns (string)"],
  "functionName": "tokenURI",
  "args": ["<AGENT_ID>"]
}' --dry-run
```

### Get reputation summary

Requires at least one client address to avoid Sybil attacks:

```bash
agw contract write --json '{
  "address": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  "abi": ["function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)"],
  "functionName": "getSummary",
  "args": ["<AGENT_ID>", ["<CLIENT_ADDRESS_1>", "<CLIENT_ADDRESS_2>"], "", ""]
}' --dry-run
```

Pass empty strings for `tag1`/`tag2` to get unfiltered results. The `summaryValue` is a signed fixed-point number with `summaryValueDecimals` precision.

### Give feedback

The submitter cannot be the agent owner (prevents self-rating):

```bash
agw contract write --json '{
  "address": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  "abi": ["function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)"],
  "functionName": "giveFeedback",
  "args": ["<AGENT_ID>", "100", "0", "quality", "", "", "", "0x0000000000000000000000000000000000000000000000000000000000000000"]
}' --dry-run
```

Value `100` with `0` decimals = score of 100. Tags, endpoint, feedbackURI, and feedbackHash are all optional (pass empty strings and zero hash).

## Escalation

- Route session issues to `authenticating-with-agw`.
- Route balance and token checks to `reading-agw-wallet`.
- Route transaction safety questions to `executing-agw-transactions`.
