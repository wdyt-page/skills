# WDYT access semantics

| Visibility | Browser/API access | Agent path |
| --- | --- | --- |
| `link` | Anyone holding the active link | Public HTTP or authenticated MCP |
| `workspace` | Signed-in members of the owning organization | OAuth-selected matching workspace |
| `private` | Owner and explicit collaborators | Authenticated MCP as the invited user/owner |

Owners manage access, invitations, archive, restore, and permanent deletion. Workspace members
and private collaborators can read, download, edit saved fields, comment, draw, and upload
versions. Public link holders retain collaboration actions but never owner actions.

The page key identifies a protected page but does not authorize access. User and workspace
identity come only from the verified Clerk session/OAuth token. Billing entitlements never
replace ownership or membership checks.

An invitation is bound to a normalized verified email, expires after seven days, and is
single-use. WDYT stores only a digest of the invitation token.
