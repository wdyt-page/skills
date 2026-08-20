---
name: wdyt-live-review
description: Collect and act on precise feedback for a real website through the wdyt Chrome extension. Use for production, staging, local, or authenticated web pages where people need to comment, select text, draw, revisit routes, share a feedback session, or hand live-page context to an agent without rebuilding the site as static HTML.
---

# Review a live website with wdyt

Use this workflow when the running website is the artifact. Do not copy it into static HTML and do not use the retired iframe/live-URL workflow.

## Start the human review

1. Ask the human to install or reload the wdyt Chrome extension from the official wdyt setup.
2. The human opens the real website, opens the extension, connects their wdyt account, grants Chrome access to that exact site origin, and creates or selects a named feedback session.
3. Keep related routes in one session when they belong to the same review. Create a separate session when the audience, goal, or round of feedback should remain independent.
4. Browse mode leaves the website interactive. Select moves existing pins and drawings. Comment captures feedback without activating links or buttons. Draw marks visual regions.
5. Share the stable wdyt page link, not a screenshot URL or a version-pinned link.

The extension stores a bounded visual checkpoint and structured route/element context. It does not turn the captured checkpoint into the editable source of the product.

## Act on the feedback

1. Read the wdyt page through authenticated MCP when it belongs to an account/workspace. For a public link, read its context endpoints.
2. Use route URL, selected text, element selector, nearby copy, viewport, comments, and drawings to locate the real implementation in the product repository.
3. Change and test the actual codebase. Do not edit the checkpoint HTML as though it were the app.
4. Reply with implementation evidence or request clarification in the existing thread.
5. Ask the human to revisit the same live session and verify the deployed or running change.

## Limits

- A collaborator needs the Chrome extension to place feedback on the real website. They can still inspect the wdyt page, its context, and its collaboration controls without the extension.
- Site permission is exact-origin and user-granted. Never request broad browser access or bypass a site's authentication.
- If the website changes or a route disappears, use saved evidence and report that the live anchor is stale; never silently attach feedback to an unrelated element.
- Campaign-style one-time respondent links and embedded feedback invitations are not yet part of this workflow. Do not promise them.
