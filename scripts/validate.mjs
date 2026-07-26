#!/usr/bin/env node

import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills");
const expected = new Set(["wdyt", "wdyt-create", "wdyt-review", "wdyt-collaborate", "wdyt-access", "wdyt-cli"]);

const entries = await readdir(skillRoot, { withFileTypes: true });
const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
assert.deepEqual(new Set(directories), expected, "Skill inventory changed unexpectedly");

for (const name of directories) {
  const directory = path.join(skillRoot, name);
  const skillPath = path.join(directory, "SKILL.md");
  const text = await readFile(skillPath, "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(frontmatter, `${name} must start with YAML frontmatter`);
  const keys = [...frontmatter[1].matchAll(/^([a-zA-Z0-9_-]+):/gm)].map((match) => match[1]);
  assert.deepEqual(keys, ["name", "description"], `${name} frontmatter must contain only name and description`);
  assert.match(frontmatter[1], new RegExp(`^name:\\s*${name}\\s*$`, "m"), `${name} frontmatter name must match its directory`);
  assert.match(frontmatter[1], /^description:\s*\S.+$/m, `${name} needs a useful description`);
  assert.ok(!text.includes("TODO"), `${name} still contains TODO text`);
  assert.ok(text.split("\n").length <= 500, `${name} exceeds 500 lines`);
  await access(path.join(directory, "agents", "openai.yaml"));

  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|#)/.test(target)) continue;
    await access(path.resolve(directory, target));
  }
}

for (const metadata of [".codex-plugin/plugin.json", ".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json", "package.json"]) {
  JSON.parse(await readFile(path.join(root, metadata), "utf8"));
}

const cliPath = path.join(skillRoot, "wdyt-cli", "scripts", "wdyt.mjs");
const syntax = spawnSync(process.execPath, ["--check", cliPath], { encoding: "utf8" });
assert.equal(syntax.status, 0, syntax.stderr || "CLI syntax check failed");

const assets = await readdir(path.join(skillRoot, "wdyt-create", "assets"));
assert.deepEqual(new Set(assets), new Set(["product-walkthrough.html", "sales-deck.html", "scenario-model.html", "working-document.html"]));
for (const file of assets) {
  const html = await readFile(path.join(skillRoot, "wdyt-create", "assets", file), "utf8");
  assert.match(html, /<title>[^<]+<\/title>/i, `${file} needs a title`);
  assert.ok(Buffer.byteLength(html) <= 4 * 1024 * 1024, `${file} exceeds WDYT's limit`);
  assert.doesNotMatch(html, /(?:sk_live_|sk_test_|ghp_|AKIA[0-9A-Z]{16})/, `${file} resembles a secret-bearing file`);
}

console.log(`PASS: ${directories.length} WDYT skills, plugin metadata, CLI syntax, references, and starter assets are valid.`);
