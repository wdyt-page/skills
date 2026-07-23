#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const runFile = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "skills", "wdyt-cli", "scripts", "wdyt.mjs");
const temporary = await mkdtemp(path.join(tmpdir(), "wdyt-skills-test-"));
const fixture = path.join(temporary, "artifact.html");
const downloaded = path.join(temporary, "current.html");
await writeFile(fixture, "<!doctype html><title>CLI test</title><main>CLI test</main>", "utf8");

let baseUrl = "";
const server = createServer(async (request, response) => {
  const body = await readBody(request);
  const url = new URL(request.url || "/", baseUrl);
  const json = (value, status = 200) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(value));
  };

  if (request.method === "GET" && ["/agent.md", "/html-templates/index.json", "/vendor/v1/manifest.json"].includes(url.pathname)) return json({ ok: true });
  if (request.method === "POST" && url.pathname === "/api/reviews") {
    assert.match(body, /CLI test/);
    return json({ reviewUrl: `${baseUrl}/r/test123?version=1`, contextMarkdownUrl: `${baseUrl}/api/reviews/test123/context.md`, currentHtmlUrl: `${baseUrl}/api/reviews/test123/current.html` }, 201);
  }
  if (request.method === "GET" && url.pathname === "/api/reviews/test123/context.json") {
    return json({
      version: { id: "version-1", number: 1 },
      source: { htmlUrl: `${baseUrl}/api/reviews/test123/current.html` },
      urls: { reviewUrl: `${baseUrl}/r/test123?version=1`, currentHtmlUrl: `${baseUrl}/api/reviews/test123/current.html` },
      reviewSignal: { status: "ready" },
      markdown: "# Test context",
    });
  }
  if (request.method === "GET" && url.pathname === "/api/reviews/test123/current.html") {
    response.writeHead(200, { "Content-Type": "text/html" });
    return response.end("<!doctype html><title>Current</title><main>Current</main>");
  }
  if (request.method === "POST" && url.pathname === "/api/reviews/test123/versions") {
    assert.equal(request.headers["x-wdyt-base-version-id"], "version-1");
    return json({ reviewUrl: `${baseUrl}/r/test123?version=2`, staleBase: false, version: { id: "version-2", number: 2 } }, 201);
  }
  if (request.method === "POST" && url.pathname === "/api/reviews/test123/comments") return json({ comment: { id: "comment-1" } }, 201);
  if (request.method === "POST" && url.pathname === "/api/reviews/test123/drawings") return json({ drawing: { id: "drawing-1" } }, 201);
  if (request.method === "POST" && url.pathname === "/api/workspaces") {
    return json({
      reviewUrl: `${baseUrl}/w/workspace-1/p/project-1?branch=branch-1&version=live-1`,
      workspace: { id: "workspace-1" },
      project: { id: "project-1" },
      branch: { id: "branch-1" },
      version: { id: "live-1", liveUrl: "http://localhost:3000" },
    });
  }
  if (request.method === "GET" && url.pathname === "/api/workspaces/workspace-1/projects/project-1/branches/branch-1/agent-context") {
    return json({
      version: { id: "live-1", artboardWidth: 1440 },
      source: { type: "live_url", liveUrl: "http://localhost:3000" },
      reviewSignal: { status: "ready" },
      reviewUrl: `${baseUrl}/w/workspace-1/p/project-1?branch=branch-1&version=live-1`,
      brief: "Live context",
    });
  }
  if (request.method === "POST" && url.pathname === "/api/workspaces/workspace-1/projects/project-1/branches/branch-1/versions") {
    return json({ reviewUrl: `${baseUrl}/w/workspace-1/p/project-1?branch=branch-1&version=live-2`, version: { id: "live-2" } });
  }
  json({ error: `Unhandled ${request.method} ${url.pathname}` }, 404);
});

try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;

  const doctor = await run(["doctor"]);
  assert.equal(doctor.ok, true);

  const created = await run(["create", fixture]);
  assert.match(created.reviewUrl, /\/r\/test123/);

  const context = await run(["context", created.reviewUrl]);
  assert.equal(context.version.id, "version-1");

  const download = await run(["download", created.reviewUrl, "--output", downloaded]);
  assert.equal(download.output, downloaded);
  assert.match(await readFile(downloaded, "utf8"), /Current/);

  const uploaded = await run(["upload", created.reviewUrl, fixture]);
  assert.equal(uploaded.staleBase, false);

  const comment = await run(["comment", created.reviewUrl, "--body", "Agent note"]);
  assert.equal(comment.comment.id, "comment-1");

  const drawing = await run(["draw", created.reviewUrl, "--points", "10,10 20,20"]);
  assert.equal(drawing.drawing.id, "drawing-1");

  const waited = await run(["wait", created.reviewUrl, "--timeout", "1"]);
  assert.equal(waited.ready, true);

  const live = await run(["live", "http://localhost:3000"]);
  assert.equal(live.workspaceId, "workspace-1");

  const checkpoint = await run(["checkpoint", live.reviewUrl, "--url", "http://localhost:3000"]);
  assert.equal(checkpoint.version.id, "live-2");

  console.log("PASS: WDYT CLI doctor, create, context, download, upload, comment, drawing, wait, live review, and checkpoint flows work.");
} finally {
  server.close();
  await rm(temporary, { recursive: true, force: true });
}

async function run(arguments_) {
  const { stdout } = await runFile(process.execPath, [cli, ...arguments_, "--origin", baseUrl, "--json"], { cwd: temporary });
  return JSON.parse(stdout);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}
