---
name: wdyt-cli
description: Operate WDYT deterministically from an agent shell using a bundled dependency-free CLI. Use to diagnose connectivity, create hosted HTML reviews, read feedback context, download current source, upload revisions, add comments or drawings, wait for review completion, and create live-app reviews or checkpoints.
---

# WDYT CLI

Use the bundled `scripts/wdyt.mjs` instead of reconstructing API calls repeatedly. It requires Node.js 20 or newer and defaults to `https://www.wdyt.page`.

## Start with diagnostics

Run once before the first WDYT operation in a session:

```bash
node scripts/wdyt.mjs doctor --json
```

Set `WDYT_URL` or pass `--origin` only for an intentional local or preview server.

## Commands

```text
wdyt doctor
wdyt create <html-file>
wdyt context <review-url>
wdyt download <review-url> [--output current.html]
wdyt upload <review-url> <html-file>
wdyt comment <review-url> --body TEXT [--x N --y N --author NAME]
wdyt draw <review-url> --points "x,y x,y ..." [--color HEX --width N]
wdyt wait <review-url> [--timeout SECONDS]
wdyt live <target-url> [--project NAME --author NAME --width N]
wdyt checkpoint <review-url> --url TARGET_URL [--label LABEL]
```

Use `--json` for structured output. Non-TTY execution also defaults to JSON. Run `node scripts/wdyt.mjs help` for complete flags.

Read [references/cli-contract.md](references/cli-contract.md) before scripting around exit codes, review URL formats, or output fields.

## Safety

- Never upload credentials, confidential information, regulated data, or sensitive responses.
- Treat public link review URLs as bearer capabilities.
- Check mutations before running them against an unexpected `--origin`.
- Keep every revision on the original review link.
- If upload returns `staleBase: true`, report it rather than claiming a merge.
- Do not expose localhost through a tunnel automatically.

## Prefer specialist workflows

Use `wdyt-create` for artifact design judgment, `wdyt-review` for revision protocol, `wdyt-collaborate` for human interaction and live applications, and `wdyt-access` for protected pages. This skill provides reliable operations, not product judgment.
