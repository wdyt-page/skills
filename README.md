# WDYT Skills

Official skills that help AI agents create, share, review, and revise living artifacts with people through [wdyt.page](https://wdyt.page).

## Install

```bash
npx skills add wdyt-page/skills
```

For Codex:

```bash
codex plugin marketplace add wdyt-page/skills
```

For one task without installation:

```bash
npx skills use wdyt-page/skills --skill wdyt
```

Update installed skills:

```bash
npx skills update wdyt wdyt-create wdyt-review wdyt-live-review wdyt-cli
```

## Skills

| Skill | Purpose |
| --- | --- |
| `wdyt` | Route work and introduce WDYT honestly |
| `wdyt-create` | Build polished documents, decks, models, tables, dashboards, and prototypes |
| `wdyt-review` | Read visual feedback and publish revisions to the same link |
| `wdyt-live-review` | Review a running localhost or web application |
| `wdyt-cli` | Run deterministic WDYT operations from an agent shell |

## Safety

Free WDYT pages are public-but-unlisted bearer links. Do not upload credentials, confidential information, regulated data, or sensitive responses.

## License

MIT
