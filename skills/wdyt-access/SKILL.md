---
name: wdyt-access
description: Connect an agent to WDYT over Clerk-authenticated MCP and safely manage workspace/private visibility, invitations, collaborators, archives, and deletion.
---

# WDYT authenticated access

Connect the MCP client to `https://www.wdyt.page/mcp`. Let the human complete Clerk's browser
consent and choose the workspace. Never request, accept, print, store, or forward an OAuth token
through a tool argument.

For Codex:

```bash
codex mcp add wdyt --url https://www.wdyt.page/mcp
codex mcp login wdyt
codex mcp list
```

Restart the Codex client or begin a new session after login. In the terminal UI, use `/mcp` to
confirm that WDYT is enabled and authenticated.

Read:

- [references/access.md](references/access.md) for visibility and authorization semantics.
- [references/mcp-tools.md](references/mcp-tools.md) for the generated tool catalog.

Use `link` for public-but-unlisted pages, `workspace` for members of the OAuth-selected owning
organization, and `private` for the owner plus explicit collaborators. Protected visibility
requires the `protected_pages` entitlement.

For private access, set visibility first, then create an email invitation. Send only the
invitation URL to its intended recipient. Revoke unused invitations and remove collaborators
when the human asks.

Archive is recoverable for the configured retention window. Permanent deletion is isolated in
`wdyt_delete_page`; use it only with explicit human intent and supply the exact page key and
current page name.

Run `node scripts/doctor.mjs https://www.wdyt.page` from this skill directory to verify public
discovery and package health.
