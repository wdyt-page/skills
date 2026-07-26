#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const VERSION = "0.1.0";
const DEFAULT_ORIGIN = "https://www.wdyt.page";
const MAX_HTML_BYTES = 4 * 1024 * 1024;

class UsageError extends Error {}

const [command = "help", ...rawArgs] = process.argv.slice(2);
const args = parseArgs(rawArgs);
const jsonMode = Boolean(args.json) || !process.stdout.isTTY;
const origin = normalizeOrigin(String(args.origin || process.env.WDYT_URL || DEFAULT_ORIGIN));

try {
  if (command === "help" || command === "--help" || command === "-h") showHelp();
  else if (command === "version" || command === "--version" || command === "-v") emit({ version: VERSION }, `wdyt ${VERSION}`);
  else if (command === "doctor") await doctor();
  else if (command === "create") await createReview();
  else if (command === "context") await getContext();
  else if (command === "download") await downloadCurrent();
  else if (command === "upload") await uploadVersion();
  else if (command === "comment") await addComment();
  else if (command === "draw") await addDrawing();
  else if (command === "wait") await waitForReview();
  else if (command === "live") await createLiveReview();
  else if (command === "checkpoint") await createLiveCheckpoint();
  else throw new UsageError(`Unknown command: ${command}`);
} catch (error) {
  const usage = error instanceof UsageError;
  const message = error instanceof Error ? error.message : String(error);
  if (jsonMode) process.stderr.write(`${JSON.stringify({ ok: false, error: message, kind: usage ? "usage" : "runtime" })}\n`);
  else process.stderr.write(`wdyt: ${message}\n${usage ? "Run `wdyt help` for usage.\n" : ""}`);
  process.exitCode = usage ? 2 : 1;
}

async function doctor() {
  const targets = [
    ["agentGuide", "/agent.md"],
    ["templateCatalog", "/html-templates/index.json"],
    ["runtimeManifest", "/vendor/v1/manifest.json"],
  ];
  const checks = await Promise.all(targets.map(async ([name, path]) => {
    try {
      const response = await fetch(`${origin}${path}`, { headers: { "User-Agent": `wdyt-cli/${VERSION}` } });
      return { name, ok: response.ok, status: response.status, url: `${origin}${path}` };
    } catch (error) {
      return { name, ok: false, status: null, url: `${origin}${path}`, error: error instanceof Error ? error.message : String(error) };
    }
  }));
  const result = { ok: checks.every((check) => check.ok), origin, version: VERSION, node: process.version, checks };
  emit(result, [
    result.ok ? `WDYT is reachable at ${origin}` : `WDYT checks failed at ${origin}`,
    ...checks.map((check) => `${check.ok ? "✓" : "✗"} ${check.name}${check.status ? ` (${check.status})` : ""}`),
  ].join("\n"));
  if (!result.ok) process.exitCode = 1;
}

async function createReview() {
  const file = requiredPositional(0, "create requires an HTML file");
  const html = await readHtml(file);
  const headers = { "Content-Type": "text/html" };
  if (args.title) headers["X-WDYT-Title"] = String(args.title);
  if (args.label) headers["X-WDYT-Label"] = String(args.label);
  const data = await requestJson(`${origin}/api/reviews`, { method: "POST", headers, body: html });
  emit(data, `Created ${data.reviewUrl}`);
}

async function getContext() {
  const review = resolveReview(requiredPositional(0, "context requires a review URL or ID"));
  const data = await fetchContext(review);
  emit(data, data.markdown || data.brief || `Review context loaded from ${review.reviewUrl}`);
}

async function downloadCurrent() {
  const review = resolveReview(requiredPositional(0, "download requires a review URL or ID"));
  const context = await fetchContext(review);
  const sourceUrl = context.source?.htmlUrl || context.source?.currentHtmlUrl || context.urls?.currentHtmlUrl;
  if (!sourceUrl) throw new Error("The review does not expose editable HTML");
  const response = await fetch(new URL(sourceUrl, review.baseUrl));
  if (!response.ok) throw new Error(`Could not download current HTML (${response.status})`);
  const html = await response.text();
  const output = String(args.output || "current.html");
  await writeFile(output, html, "utf8");
  emit({ ok: true, output, bytes: Buffer.byteLength(html), reviewUrl: context.urls?.reviewUrl || review.reviewUrl, versionId: context.version?.id || null }, `Saved ${output}`);
}

async function uploadVersion() {
  const review = resolveReview(requiredPositional(0, "upload requires a review URL"));
  const file = requiredPositional(1, "upload requires an HTML file");
  const html = await readHtml(file);
  const context = await fetchContext(review);

  if (review.type === "hosted") {
    const baseVersionId = String(args["base-version-id"] || context.version?.id || "");
    if (!baseVersionId) throw new Error("Could not determine the current version ID");
    const headers = { "Content-Type": "text/html", "X-WDYT-Base-Version-ID": baseVersionId };
    if (args.label) headers["X-WDYT-Label"] = String(args.label);
    const data = await requestJson(`${review.baseUrl}/api/reviews/${review.id}/versions`, { method: "POST", headers, body: html });
    emit(data, data.staleBase ? `Uploaded ${data.reviewUrl}; another version arrived while you worked` : `Uploaded ${data.reviewUrl}`);
    return;
  }

  const data = await requestJson(`${review.baseUrl}/api/workspaces/${review.workspaceId}/projects/${review.projectId}/branches/${review.branchId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceType: "html_blob",
      html,
      authorName: String(args.author || "Agent"),
      artboardWidth: numberArg("width", context.version?.artboardWidth || 1440),
      label: args.label ? String(args.label) : null,
    }),
  });
  emit(data, `Uploaded ${data.reviewUrl || review.reviewUrl}`);
}

async function addComment() {
  const review = resolveReview(requiredPositional(0, "comment requires a review URL"));
  const body = String(args.body || "").trim();
  if (!body) throw new UsageError("comment requires --body TEXT");
  const context = await fetchContext(review);
  const versionId = String(args["version-id"] || context.version?.id || "");
  if (!versionId) throw new Error("Could not determine the current version ID");
  const x = numberArg("x", 80);
  const y = numberArg("y", 80);
  const selector = String(args.selector || "body");
  const payload = {
    createdOnVersionId: versionId,
    x,
    y,
    body,
    authorName: String(args.author || "Agent"),
    authorToken: "agent",
    parentId: args["reply-to"] ? String(args["reply-to"]) : null,
    element: {
      tag: selector === "body" ? "body" : "div",
      text: String(args.target || ""),
      cssSelector: selector,
      outerHTMLSnippet: String(args.target || "<body>").slice(0, 220),
      manualPosition: selector === "body",
    },
  };
  const endpoint = review.type === "hosted"
    ? `${review.baseUrl}/api/reviews/${review.id}/comments`
    : `${review.baseUrl}/api/workspaces/${review.workspaceId}/projects/${review.projectId}/branches/${review.branchId}/comments`;
  const data = await requestJson(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  emit(data, "Comment added");
}

async function addDrawing() {
  const review = resolveReview(requiredPositional(0, "draw requires a review URL"));
  if (!args.points) throw new UsageError('draw requires --points "x,y x,y ..." or --points @file.json');
  const context = await fetchContext(review);
  const versionId = String(args["version-id"] || context.version?.id || "");
  if (!versionId) throw new Error("Could not determine the current version ID");
  const points = await parsePoints(String(args.points));
  const payload = {
    createdOnVersionId: versionId,
    points,
    color: String(args.color || "#ff3040"),
    width: numberArg("width", 4),
    authorName: String(args.author || "Agent"),
    authorToken: "agent",
  };
  const endpoint = review.type === "hosted"
    ? `${review.baseUrl}/api/reviews/${review.id}/drawings`
    : `${review.baseUrl}/api/workspaces/${review.workspaceId}/projects/${review.projectId}/branches/${review.branchId}/drawings`;
  const data = await requestJson(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  emit(data, "Drawing added");
}

async function waitForReview() {
  const review = resolveReview(requiredPositional(0, "wait requires a review URL"));
  const timeoutSeconds = boundedNumber(args.timeout, 1800, 1, 86400);
  const intervalMs = boundedNumber(args.interval, 1500, 1000, 15000);
  const deadline = Date.now() + timeoutSeconds * 1000;
  let context = await fetchContext(review);
  while (context.reviewSignal?.status !== "ready" && Date.now() < deadline) {
    await sleep(intervalMs);
    context = await fetchContext(review);
  }
  const ready = context.reviewSignal?.status === "ready";
  emit({ ready, reviewUrl: context.urls?.reviewUrl || context.reviewUrl || review.reviewUrl, context }, ready ? "Review is ready" : "Timed out waiting for review");
}

async function createLiveReview() {
  const targetUrl = requiredPositional(0, "live requires a target URL");
  assertHttpUrl(targetUrl, "target URL");
  const data = await requestJson(`${origin}/api/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceName: String(args.workspace || "Live app review"),
      projectName: String(args.project || "Live application"),
      sourceType: "live_url",
      liveUrl: targetUrl,
      authorName: String(args.author || "Agent"),
      artboardWidth: numberArg("width", 1440),
    }),
  });
  const result = {
    reviewUrl: data.reviewUrl,
    workspaceId: data.workspace?.id,
    projectId: data.project?.id,
    branchId: data.branch?.id,
    versionId: data.version?.id,
    liveUrl: data.version?.liveUrl || targetUrl,
  };
  emit(result, `Created ${result.reviewUrl}`);
}

async function createLiveCheckpoint() {
  const review = resolveReview(requiredPositional(0, "checkpoint requires a live review URL"));
  if (review.type !== "workspace") throw new UsageError("checkpoint requires a /w/... live review URL");
  const targetUrl = String(args.url || "");
  if (!targetUrl) throw new UsageError("checkpoint requires --url TARGET_URL");
  assertHttpUrl(targetUrl, "target URL");
  const context = await fetchContext(review);
  const data = await requestJson(`${review.baseUrl}/api/workspaces/${review.workspaceId}/projects/${review.projectId}/branches/${review.branchId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceType: "live_url",
      liveUrl: targetUrl,
      authorName: String(args.author || "Agent"),
      artboardWidth: numberArg("width", context.version?.artboardWidth || 1440),
      label: args.label ? String(args.label) : null,
    }),
  });
  emit(data, `Checkpoint ready at ${data.reviewUrl || review.reviewUrl}`);
}

async function fetchContext(review) {
  if (review.type === "hosted") {
    const version = review.version ? `?version=${encodeURIComponent(review.version)}` : "";
    return await requestJson(`${review.baseUrl}/api/reviews/${review.id}/context.json${version}`);
  }
  const version = review.versionId ? `?versionId=${encodeURIComponent(review.versionId)}` : "";
  return await requestJson(`${review.baseUrl}/api/workspaces/${review.workspaceId}/projects/${review.projectId}/branches/${review.branchId}/agent-context${version}`);
}

function resolveReview(value) {
  let url;
  try {
    url = new URL(value, origin);
  } catch {
    throw new UsageError(`Invalid review URL: ${value}`);
  }
  const hosted = url.pathname.match(/^\/r\/([^/]+)$/);
  if (hosted) {
    return { type: "hosted", id: hosted[1], baseUrl: url.origin, reviewUrl: url.toString(), version: url.searchParams.get("version") || "" };
  }
  const workspace = url.pathname.match(/^\/w\/([^/]+)\/p\/([^/]+)$/);
  if (workspace) {
    const branchId = url.searchParams.get("branch");
    if (!branchId) throw new UsageError("Workspace review URL is missing ?branch=...");
    return {
      type: "workspace",
      workspaceId: workspace[1],
      projectId: workspace[2],
      branchId,
      versionId: url.searchParams.get("version") || "",
      baseUrl: url.origin,
      reviewUrl: url.toString(),
    };
  }
  if (/^[A-Za-z0-9_-]+$/.test(value)) {
    return { type: "hosted", id: value, baseUrl: origin, reviewUrl: `${origin}/r/${value}`, version: "" };
  }
  throw new UsageError(`Not a WDYT review URL: ${value}`);
}

async function readHtml(file) {
  const bytes = await readFile(file);
  if (bytes.byteLength > MAX_HTML_BYTES) throw new Error("HTML must be 4 MB or smaller");
  const html = bytes.toString("utf8");
  if (!/<\s*(?:!doctype|html|head|body|title|style|script|main|div|section|article|header|footer|p|h[1-6]|svg|canvas|form|button)\b/i.test(html)) {
    throw new Error(`${file} does not appear to contain HTML`);
  }
  return html;
}

async function parsePoints(value) {
  let points;
  if (value.startsWith("@")) {
    points = JSON.parse(await readFile(value.slice(1), "utf8"));
  } else {
    points = value.trim().split(/\s+/).map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
  }
  if (!Array.isArray(points) || points.length < 2 || points.length > 5000 || points.some((point) => !Number.isFinite(point?.x) || !Number.isFinite(point?.y))) {
    throw new UsageError("Drawing points must contain 2–5,000 finite {x,y} points");
  }
  return points;
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { "User-Agent": `wdyt-cli/${VERSION}`, ...(init.headers || {}) } });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { text };
  }
  if (!response.ok) throw new Error(data.error || data.text || `${response.status} ${response.statusText}`);
  return data;
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }
    const equal = token.indexOf("=");
    if (equal > 2) {
      parsed[token.slice(2, equal)] = token.slice(equal + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function requiredPositional(index, message) {
  const value = args._[index];
  if (!value) throw new UsageError(message);
  return String(value);
}

function numberArg(name, fallback) {
  const value = args[name];
  if (value === undefined) return Number(fallback);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new UsageError(`--${name} must be a number`);
  return number;
}

function boundedNumber(value, fallback, minimum, maximum) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(number)) throw new UsageError("Expected a number");
  return Math.max(minimum, Math.min(maximum, number));
}

function assertHttpUrl(value, label) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new UsageError(`${label} must use http or https`);
}

function normalizeOrigin(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new UsageError("--origin must use http or https");
  return url.origin;
}

function emit(value, human) {
  if (jsonMode) process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  else process.stdout.write(`${human}\n`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function showHelp() {
  const help = `WDYT agent CLI ${VERSION}

Usage:
  wdyt doctor [--origin URL] [--json]
  wdyt create <html-file> [--title TEXT] [--label TEXT] [--json]
  wdyt context <review-url-or-id> [--json]
  wdyt download <review-url-or-id> [--output current.html] [--json]
  wdyt upload <review-url> <html-file> [--base-version-id ID] [--label TEXT] [--json]
  wdyt comment <review-url> --body TEXT [--x N --y N --selector CSS] [--reply-to ID] [--author NAME] [--json]
  wdyt draw <review-url> --points "x,y x,y ..." [--color HEX] [--width N] [--author NAME] [--json]
  wdyt wait <review-url> [--timeout SECONDS] [--interval MILLISECONDS] [--json]
  wdyt live <target-url> [--workspace NAME] [--project NAME] [--author NAME] [--width N] [--json]
  wdyt checkpoint <review-url> --url TARGET_URL [--label TEXT] [--author NAME] [--width N] [--json]

Environment:
  WDYT_URL defaults to ${DEFAULT_ORIGIN}
`;
  process.stdout.write(help);
}
