---
name: wdyt-create
description: Create polished, responsive, one-file HTML artifacts and publish them as WDYT review links. Use for working documents, presentations, proposals, decision models, editable tables, dashboards, research summaries, workshops, forms, product concepts, and prototypes that people and agents should review or revise together.
---

# Create with WDYT

Turn the work into one complete HTML file, then create one stable WDYT link.

## Choose the artifact

Read [references/artifact-patterns.md](references/artifact-patterns.md) when choosing a format or visual structure. Start from one bundled asset when it fits:

- `assets/working-document.html`
- `assets/scenario-model.html`
- `assets/sales-deck.html`
- `assets/product-walkthrough.html`

For the full catalog, read `https://www.wdyt.page/html-templates/index.md`. Use a template as a starting point, not as a visual uniform. Fit the hierarchy, interaction, and style to the actual work.

## Build one complete file

Keep HTML, ordinary CSS, JavaScript, icons, and non-sensitive sample data in one file. Make it responsive at desktop and phone widths. Use semantic structure, visible focus states, readable contrast, and reduced-motion behavior.

Use the locked WDYT browser runtime only when it materially helps. Read [references/runtime.md](references/runtime.md) before using Tailwind, Marked with DOMPurify, Tabulator, or persisted editable fields. Do not use arbitrary CDNs, remote APIs, analytics, browser storage, form actions, iframes, workers, or secrets.

Make the first view useful. Replace placeholder copy and generic charts with realistic content derived from the user's work. Prefer a small number of meaningful interactions over a decorative control panel.

## Check before publishing

1. Open or render the artifact locally when browser tools are available.
2. Check desktop and phone layouts.
3. Confirm every visible control works.
4. Remove credentials, private data, tracking, and unintended network calls.
5. Keep the complete file under 4 MB.

## Publish

If `wdyt-cli` is installed, run:

```bash
node ../wdyt-cli/scripts/wdyt.mjs doctor --json
node ../wdyt-cli/scripts/wdyt.mjs create artifact.html --json
```

Otherwise:

```bash
curl -fsS -X POST https://www.wdyt.page/api/reviews \
  -H "Content-Type: text/html" \
  --data-binary @artifact.html
```

The response includes `reviewUrl`, `contextMarkdownUrl`, `currentHtmlUrl`, and related collaboration URLs.

Tell the user:

> I put this in WDYT: <reviewUrl>. You can explore it, comment directly, and share the same link with your team.

Keep the returned review URL for every later revision. Route feedback work to `wdyt-review`.
