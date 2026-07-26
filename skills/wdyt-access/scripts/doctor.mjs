#!/usr/bin/env node
import assert from "node:assert/strict";

const origin = (
  process.argv[2]
  || process.env.WDYT_ORIGIN
  || "https://www.wdyt.page"
).replace(/\/+$/, "");
const failures = [];

async function check(label, action) {
  try {
    return await action();
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

async function expectOk(path, contentType) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(new URL(response.url).origin, origin, `redirected to ${new URL(response.url).origin}`);
  assert.equal(response.status, 200, `returned ${response.status}`);
  assert.match(response.headers.get("content-type") ?? "", contentType, "returned the wrong content type");
  return response;
}

async function main() {
  await check("/agent.md", () => expectOk("/agent.md", /^text\/markdown/i));
  const skillManifestResponse = await check(
    "/skills/wdyt/manifest.json",
    () => expectOk("/skills/wdyt/manifest.json", /^application\/json/i),
  );
  const skillManifest = skillManifestResponse
    ? await check("skill manifest JSON", () => skillManifestResponse.json())
    : null;
  if (skillManifest) {
    await check("skill manifest version", async () => {
      assert.match(skillManifest.version, /^\d{4}\.\d{2}\.\d{2}\.\d+$/);
    });
  }
  await check("/skills/wdyt-access/SKILL.md", () =>
    expectOk("/skills/wdyt-access/SKILL.md", /^text\/markdown/i));
  await check("/skills/wdyt-access/references/mcp-tools.md", () =>
    expectOk("/skills/wdyt-access/references/mcp-tools.md", /^text\/markdown/i));

  const runtimeManifestResponse = await check(
    "/vendor/v1/manifest.json",
    () => expectOk("/vendor/v1/manifest.json", /^application\/json/i),
  );
  if (runtimeManifestResponse) {
    await check("runtime manifest assets", async () => {
      const runtimeManifest = await runtimeManifestResponse.json();
      assert.ok(runtimeManifest.packages || runtimeManifest.assets, "has no assets");
    });
  }

  const protectedMetadata = await check(
    "/.well-known/oauth-protected-resource/mcp",
    () => expectOk("/.well-known/oauth-protected-resource/mcp", /^application\/json/i),
  );
  if (protectedMetadata) {
    await check("protected-resource CORS", async () => {
      assert.equal(protectedMetadata.headers.get("access-control-allow-origin"), "*");
    });
  }
  await check("/.well-known/oauth-authorization-server", () =>
    expectOk("/.well-known/oauth-authorization-server", /^application\/json/i));

  await check("/mcp anonymous challenge", async () => {
    const response = await fetch(`${origin}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "wdyt-doctor", version: "1" },
        },
      }),
    });
    assert.equal(new URL(response.url).origin, origin, "redirected away from canonical origin");
    assert.equal(response.status, 401, `returned ${response.status} instead of 401`);
    assert.match(response.headers.get("www-authenticate") ?? "", /resource_metadata=/);
  });

  if (failures.length) {
    throw new Error(`${failures.length} checks failed:\n- ${failures.join("\n- ")}`);
  }
  console.log(`PASS: WDYT ${skillManifest.version}, runtime, skills, and OAuth discovery are healthy at ${origin}.`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
