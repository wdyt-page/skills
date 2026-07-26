---
name: wdyt-review
description: Collaborate through an existing wdyt.page review by reading comments and drawings, downloading current HTML, applying requested changes, replying precisely, waiting for human review, and uploading complete replacement versions to the same link. Use whenever the user provides a WDYT review URL or asks to act on WDYT feedback.
---

# Review with WDYT

Treat the supplied WDYT link as the shared source of truth. Keep it unchanged.

## Start with context

If `wdyt-cli` is installed:

```bash
node ../wdyt-cli/scripts/wdyt.mjs context "<review-url>" --json
```

For `/r/<review-id>` links, the direct context is:

```text
https://www.wdyt.page/api/reviews/<review-id>/context.md
```

The context provides the current version ID, comment threads, drawings, clean editable HTML URL, annotated reference URL, and exact upload URL.

If comments are still being added and the human has not asked you to act, wait. Do not make speculative changes.

## Apply feedback

1. Download `current.html`, not the annotated export. Current HTML includes persisted editable-field values.
2. Inspect `annotated.html` only when pins, drawings, scenes, or spatial placement need interpretation.
3. Implement the requested changes in the complete HTML document.
4. Preserve unrelated behavior and content.
5. Check the result locally when browser tools are available.
6. Upload the complete replacement to the same review.

With the CLI:

```bash
node ../wdyt-cli/scripts/wdyt.mjs download "<review-url>" --output current.html
node ../wdyt-cli/scripts/wdyt.mjs upload "<review-url>" updated.html --json
```

The CLI automatically sends the current base-version header. If the response reports `staleBase: true`, tell the human another version arrived while you worked. Both versions are preserved; do not claim they were merged.

## Comment and draw

Use comments or drawings when they clarify the collaboration: acknowledge a completed action, ask a precise question, or point to a visual area. Do not add status noise.

```bash
node ../wdyt-cli/scripts/wdyt.mjs comment "<review-url>" \
  --body "Updated this section; is this the emphasis you wanted?" \
  --author "Maya's Agent" --x 420 --y 260 --json
```

Read [references/review-api.md](references/review-api.md) for exact comment, reply, drawing, waiting, and raw API payloads.

## Finish clearly

Tell the human the next version is ready at the same link and summarize the meaningful changes briefly. Do not create a second review.
