# AGW Rename + Compatibility Strategy

## Decision Summary

- The canonical product, repo, package, and CLI identity should converge on `agw`.
- The currently published package, `@abstract-foundation/agw-mcp`, remains the compatibility entry point during the migration window.
- The canonical CLI binary becomes `agw`.
- The legacy CLI binary `agw-mcp` remains available only through the compatibility package.
- The MCP server alias stays `agw` throughout the migration so agent config names do not churn.

## Surface Map

| Surface | Current shipping identity | Canonical identity | Compatibility strategy |
| --- | --- | --- | --- |
| GitHub repo | `Abstract-Foundation/agw-mcp` | `Abstract-Foundation/agw` | Rename the repo when the `agw` package launch is ready; rely on GitHub redirects instead of maintaining two long-lived repos. |
| npm package | `@abstract-foundation/agw-mcp` | `agw` | Dual-publish at launch. After that, keep `@abstract-foundation/agw-mcp` as a thin compatibility shim that points users to `agw`. |
| CLI binary | `agw-mcp` | `agw` | The `agw` package ships only `agw`. The compatibility package ships only `agw-mcp` and forwards into the same implementation. |
| MCP server name | `agw` | `agw` | No change. Existing MCP client registrations keep working without renaming the server alias. |
| Local state directory | `~/.agw-mcp` | `~/.agw` eventually | Do not rename the state directory in the same release as the package/binary rename. Keep the old path during the compatibility window and handle filesystem migration in a dedicated follow-up. |

## Rollout Phases

### Phase 0: Planning Before Rename Ships

- Docs must distinguish between the current shipping package (`@abstract-foundation/agw-mcp`) and the target canonical identity (`agw`).
- No install snippet should claim `npx -y agw` works until the package is actually published.
- Planning docs should treat `agw` as the steady-state name and `@abstract-foundation/agw-mcp` as the migration source.

### Phase 1: Rename Launch

- Publish the canonical package as `agw`.
- Keep the implementation aligned between `agw` and `@abstract-foundation/agw-mcp`.
- Rename the repo to `agw` in the same release window so package metadata, clone URLs, badges, and issue/PR links stay coherent.
- Flip primary docs and install snippets to `agw`.

### Phase 2: Compatibility Window

- Keep `npx -y @abstract-foundation/agw-mcp ...` working for existing users.
- Keep the `agw-mcp` binary working through the compatibility package only.
- Show migration guidance as a single-token rewrite:
  - `npx -y @abstract-foundation/agw-mcp serve` -> `npx -y agw serve`
  - `agw-mcp init` -> `agw init`
- Emit a deprecation notice from the compatibility package that points users to `agw`.

### Phase 3: Compatibility Retirement

- Do not remove `@abstract-foundation/agw-mcp` until `agw` has been the documented default for at least one stable release cycle.
- Remove the compatibility package only in a major release.
- When the compatibility package is retired, keep the retirement notice in the final deprecated package version and in the migration docs.

## Binary Naming Rules

- The only long-term binary is `agw`.
- The `agw` package must not also ship an `agw-mcp` bin because dual binaries create avoidable collisions in local installs and blur the migration target.
- The `agw-mcp` binary exists only to preserve legacy install flows that invoke the old package directly.
- Examples, screenshots, CLI help text, and onboarding copy should treat `agw` as canonical once Phase 1 ships.

## Migration Constraints

### Docs

- README, product docs, onboarding docs, and config examples must flip in the same release window as the `agw` publish.
- Until then, docs should explicitly label `@abstract-foundation/agw-mcp` as the current package and `agw` as the target canonical name.
- Historical documents such as changelogs and dated beta plans can keep the old name if they are clearly time-bound.

### Package Metadata

- `agw` needs the canonical `name`, `bin`, `repository`, `homepage`, `bugs`, badges, and install snippets.
- `@abstract-foundation/agw-mcp` should become a compatibility package, not a second independently evolving product surface.
- The compatibility package README and npm deprecation message should point directly to `agw`.

### User Install Flows

- Fresh-install docs should move to `npx -y agw` as soon as Phase 1 ships.
- Existing scripts and MCP registrations that reference `@abstract-foundation/agw-mcp` should continue working during the compatibility window.
- The MCP server alias remains `agw`; users only need to swap the executable/package token, not the configured server name.
- The local session/state path stays on `~/.agw-mcp` during the rename window so upgrades do not force re-onboarding.

## Out of Scope For This Rename Ticket

- Filesystem migration from `~/.agw-mcp` to `~/.agw`
- Package implementation changes for dual-publish or deprecation messaging
- Post-rename telemetry or package download analysis
