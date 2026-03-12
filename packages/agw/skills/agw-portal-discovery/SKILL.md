---
name: agw-portal-discovery
version: 1.0.0
description: Discover apps, streams, and profiles through Portal with context-window discipline.
metadata:
  openclaw:
    requires:
      bins: ["agw"]
---

# AGW Portal Discovery

Use this skill when exploring Portal-backed app and stream data.

## Rules

- Prefer list commands with pagination.
- Use `fields` aggressively to avoid returning full Portal payloads.
- Use `app.list` and `app.show` for shipped AGW app-and-skill guidance.
- Fall back to `portal.*` commands for live Portal reads.

## Useful Commands

- `agw app list --json '{"pageSize":10,"fields":["items.id","items.name","items.skillRefs","nextCursor"]}'`
- `agw app show --json '{"appId":"183"}'`
- `agw portal apps list --json '{"pageSize":10}'`
- `agw portal streams list --json '{"appId":"12","pageSize":10}'`
