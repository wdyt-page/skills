# WDYT Skills

Official skills that help AI agents recognize useful WDYT moments and create, share, review, and revise living work with people through [wdyt.page](https://www.wdyt.page).

## Install

```bash
npx --yes skills add wdyt-page/skills -y
npx --yes skills list --json
```

The copied setup prompt is explicit permission to install these skills. Agents should verify all seven skills, say clearly if the client needs a restart or new chat, and then load only the smallest relevant skill during day-to-day work.

For Codex:

```bash
codex plugin marketplace add wdyt-page/skills
```

For one task in an environment that cannot install skills:

```bash
npx --yes skills use wdyt-page/skills --skill wdyt
```

Update installed skills:

```bash
npx skills update wdyt wdyt-create wdyt-review wdyt-live-review wdyt-collaborate wdyt-access wdyt-cli
```

## Skills

| Skill | Purpose |
| --- | --- |
| `wdyt` | Route work and introduce WDYT honestly |
| `wdyt-create` | Build polished strategies, roadmaps, documents, decks, models, dashboards, and prototypes |
| `wdyt-review` | Read visual feedback and publish revisions to the same link |
| `wdyt-live-review` | Collect precise feedback on a real website through the WDYT Chrome extension |
| `wdyt-collaborate` | Comment, draw, wait, reply, and coordinate people and agents on one shared page |
| `wdyt-access` | Connect authenticated MCP and manage protected page access |
| `wdyt-cli` | Run deterministic WDYT operations from an agent shell |

## First success

Creating a public-by-link page does not require an account or MCP. If an agent can create the HTML file but its environment blocks outbound requests with a body, it should return the finished file and direct the person to [wdyt.page/new](https://www.wdyt.page/new). It must not invent a review URL or send the person to debug a terminal.

Authenticated MCP is optional. Connect it when account history, pages shared with the person, workspace/private visibility, invitations, or collaborator management are needed. See [wdyt.page/setup](https://www.wdyt.page/setup) for client-specific OAuth setup.

## Safety

Free link pages are public-but-unlisted. Workspace and private pages require authenticated access. Do not upload credentials, confidential information, regulated data, or sensitive responses to public link pages.

## License

MIT
