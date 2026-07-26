# Locked browser runtime

WDYT renders uploaded HTML in a sandbox. Ordinary inline HTML, CSS, JavaScript, SVG, and non-sensitive sample data work without dependencies.

Use only these pinned WDYT-hosted browser assets:

```html
<script src="https://www.wdyt.page/vendor/v1/tailwind.js"></script>
<script src="https://www.wdyt.page/vendor/v1/marked.js"></script>
<script src="https://www.wdyt.page/vendor/v1/dompurify.js"></script>
<link rel="stylesheet" href="https://www.wdyt.page/vendor/v1/tabulator.css">
<script src="https://www.wdyt.page/vendor/v1/tabulator.js"></script>
```

Read `https://www.wdyt.page/vendor/v1/agent.md` for exact versions, hashes, Content Security Policy limits, and current examples.

## Tailwind

Use Tailwind when utility classes materially speed up a rich layout. Keep custom tokens and unusual animation logic in a small inline `<style>` block. Do not load plugins or another Tailwind build.

## Markdown

Always sanitize rendered Markdown:

```js
preview.innerHTML = DOMPurify.sanitize(marked.parse(source));
```

Do not enable raw HTML from untrusted user input.

## Data grids

Use Tabulator for meaningful tabular interactions such as sorting, filters, calculations, and repeated row editing. For a small static comparison, normal semantic `<table>` markup is better.

## Persisted fields

Add a stable unique key to ordinary controls:

```html
<input data-wdyt-field="forecast-growth" type="number" value="12">
<textarea data-wdyt-field="executive-summary">Initial text</textarea>
```

WDYT persists values per version. Updates are last-write-wins per field; this is not realtime document merging.

For a rich widget, serialize its state into one hidden marked textarea and dispatch a bubbling `input` event:

```js
stateField.value = JSON.stringify(table.getData());
stateField.dispatchEvent(new Event("input", { bubbles: true }));
```

Listen for `wdyt:state-applied` before recalculating derived UI after persisted state is restored.

## Security boundaries

Do not use arbitrary CDNs, remote APIs, iframes, workers, WebSockets, analytics, cookies, local storage, form actions, or secrets. The sandbox intentionally blocks network connections beyond WDYT's pinned assets. Never design an artifact that depends on a bypass.
