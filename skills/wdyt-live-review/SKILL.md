---
name: wdyt-live-review
description: Create and operate a WDYT visual review for a running localhost or web application without exporting static HTML. Use when a developer wants teammates to browse a live app, pin comments, draw over screens, signal that review is complete, and send structured visual feedback back to a coding agent.
---

# Live application review

Use live review when the running application itself is the artifact. Do not rebuild it as static HTML merely to collect feedback.

## Verify the target

1. Confirm the target URL loads in the human's browser.
2. Prefer a stable local port and keep the development server running.
3. Confirm the target allows iframe rendering.
4. Never expose a private development service to the public internet solely for WDYT.

The WDYT review page is public-but-unlisted. The target URL may still be `localhost` because it loads in the reviewer's browser, not on WDYT's server.

## Create the review

Run the CLI skill's doctor once, then:

```bash
node ../wdyt-cli/scripts/wdyt.mjs live "http://localhost:3000" \
  --project "Checkout redesign" --author "Maya's Agent" --json
```

Give the returned review URL to the human. Keep the target development server alive while they review.

## Collect feedback

Wait only when the user explicitly asks you to monitor the review:

```bash
node ../wdyt-cli/scripts/wdyt.mjs wait "<review-url>" --timeout 1800 --json
```

Read [references/live-review.md](references/live-review.md) for targeting limits and the review lifecycle.

## Revise the application

Apply feedback to the actual codebase, not to an exported WDYT wrapper. Test the app, then create a checkpoint on the same review:

```bash
node ../wdyt-cli/scripts/wdyt.mjs checkpoint "<review-url>" \
  --url "http://localhost:3000" --label "Feedback applied" --json
```

Tell the human the updated checkpoint is available at the same review link.
