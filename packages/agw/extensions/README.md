# AGW Extension Packaging

This directory contains native packaging descriptors for agent platforms that can load AGW as an installed capability.

## Included Targets

- `gemini/`: Gemini CLI extension scaffold
- `claude-code/`: Claude Code plugin scaffold

Both descriptors assume the `agw` binary is installed and available on `PATH`.

## Why This Exists

The AGW rewrite is intentionally multi-surface:

- `agw` is the primary JSON-first CLI
- `agw mcp serve` is the typed MCP projection
- skills and extension descriptors package the operational guidance agents need

That follows the agent-first model from Justin Poehnelt’s March 4, 2026 article:

- https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/
