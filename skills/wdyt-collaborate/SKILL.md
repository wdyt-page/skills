---
name: wdyt-collaborate
description: Coordinate people and agents on an existing WDYT page by commenting, replying, drawing, signaling readiness, waiting for human activity, and keeping feedback in the right thread without adding status noise.
---

# Collaborate in WDYT

Prefer authenticated MCP for owned, workspace, or private pages. Read
`../wdyt-access/references/mcp-tools.md` for exact tool inputs.

## Page collaboration

- Add a comment only to acknowledge completed work, ask a precise question, or anchor feedback
  to a meaningful location.
- Reply in the existing thread when context exists; do not create parallel status threads.
- Use drawings only when a visual mark communicates more clearly than text.
- Call `wdyt_mark_ready` after a version is actually ready for review.
- Use `wdyt_wait_for_review` in bounded intervals. A timeout means no new activity, not failure.
- Delete another participant's contribution only when the human explicitly requests it and the
  authenticated page role permits it.

When the running website itself is the artifact, route to `wdyt-live-review`. The current live workflow uses the WDYT Chrome extension on the real website. Never create the retired iframe wrapper or treat a screenshot/checkpoint as editable product source.

Every outcome should retain the stable unversioned review URL and IDs needed for the next action.
