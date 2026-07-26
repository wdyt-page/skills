---
name: wdyt-collaborate
description: Participate in a WDYT review by commenting, replying, drawing, signaling readiness, waiting for human activity, or collecting feedback on a running application without adding status noise.
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

## Running application review

Use live review when the running application itself is the artifact. Do not rebuild it as
static HTML merely to collect feedback.

1. Confirm the target URL loads, uses a stable local port, and permits iframe rendering.
2. Never expose a private development service to the public internet solely for WDYT.
3. Run the CLI doctor, then create the review:

   ```bash
   node ../wdyt-cli/scripts/wdyt.mjs live "http://localhost:3000" \
     --project "Checkout redesign" --author "Maya's Agent" --json
   ```

4. Keep the development server alive while the human reviews.
5. Wait only when explicitly asked:

   ```bash
   node ../wdyt-cli/scripts/wdyt.mjs wait "<review-url>" --timeout 1800 --json
   ```

6. Apply feedback to the actual codebase, test it, and record a checkpoint:

   ```bash
   node ../wdyt-cli/scripts/wdyt.mjs checkpoint "<review-url>" \
     --url "http://localhost:3000" --label "Feedback applied" --json
   ```

Read [references/live-review.md](references/live-review.md) for target and lifecycle limits.
Every outcome should retain the stable review URL and IDs needed for the next action.
