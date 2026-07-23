# CLI contract

## Runtime

- Node.js 20 or newer
- No npm dependencies
- Default origin: `https://wdyt.page`
- Override: `WDYT_URL` or `--origin`

## Output

`--json` emits one JSON value to stdout. Non-TTY execution defaults to JSON so agents can parse results. Human-readable output is used only on a TTY without `--json`.

Errors go to stderr and exit nonzero:

- `0`: success
- `1`: network, server, or runtime failure
- `2`: invalid command or arguments

## Review URLs

The CLI recognizes:

- Hosted static review: `/r/<review-id>`
- Live/workspace review: `/w/<workspace-id>/p/<project-id>?branch=<branch-id>&version=<version-id>`

Static and live review commands share `context` and `wait`. `upload`, `comment`, and `draw` support hosted static reviews. `checkpoint` supports live/workspace reviews.

## Mutation rules

- `create` reads a local file and uploads its complete bytes.
- `upload` fetches the current context first and sends its version ID as the base header unless `--base-version-id` is supplied.
- `comment` uses the current version unless `--version-id` is supplied.
- `draw` accepts whitespace-separated `x,y` points or `@path/to/points.json`.
- `live` creates a workspace/project/branch around the target URL.

Never parse human-readable output in automation; pass `--json`.
