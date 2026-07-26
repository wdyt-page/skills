# Review API

The bundled CLI is preferred. Use these payloads when direct API access is necessary.

## Resolve a review

For `https://www.wdyt.page/r/<review-id>`:

```text
GET /api/reviews/<review-id>/context.json
GET /api/reviews/<review-id>/context.md
GET /api/reviews/<review-id>/current.html
GET /api/reviews/<review-id>/annotated.html
```

The context JSON contains `version.id`, `version.number`, `threads`, `drawings`, `reviewSignal`, `urls`, and the generated Markdown handoff.

## Upload a version

```http
POST /api/reviews/<review-id>/versions
Content-Type: text/html
X-WDYT-Base-Version-ID: <current-version-id>
X-WDYT-Label: <optional short label>

<!doctype html>...
```

Upload the complete replacement HTML. A successful response returns the new version and `staleBase`.

## Add a comment

```json
{
  "createdOnVersionId": "<version-id>",
  "x": 420,
  "y": 260,
  "body": "Should this action be primary?",
  "authorName": "Maya's Agent",
  "authorToken": "agent",
  "parentId": null,
  "element": {
    "tag": "body",
    "text": "",
    "cssSelector": "body",
    "outerHTMLSnippet": "<body>",
    "manualPosition": true
  }
}
```

POST it as JSON to `/api/reviews/<review-id>/comments`. To reply, set `parentId` to the root comment ID. Use a real selector and nearby text when known; otherwise mark the position as manual.

## Add a drawing

```json
{
  "createdOnVersionId": "<version-id>",
  "points": [{"x": 100, "y": 100}, {"x": 160, "y": 130}],
  "color": "#ff3040",
  "width": 4,
  "authorName": "Maya's Agent",
  "authorToken": "agent"
}
```

POST it to `/api/reviews/<review-id>/drawings`. Coordinates are original-artboard pixels. Use at least two and at most 5,000 points.

## Wait for the human

Poll `context.json` only after the user asks you to monitor the review. Stop when `reviewSignal.status` is `ready`, the timeout expires, or the user sends a new instruction. A lack of comments is expected, not an error.

Do not poll more frequently than once per second.
