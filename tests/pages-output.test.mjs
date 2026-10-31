import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve("dist-pages");
const parts = (process.env.PAGES_BASE_PATH || "/").split("/").filter(Boolean);
const base = parts.length ? `/${parts.join("/")}/` : "/";

test("static routes load version-specific pages and assets under the configured base path", async () => {
  for (const [path, version] of [["index.html", "v4"], ["v4/index.html", "v4"], ["v5/index.html", "v5"]]) {
    const html = await readFile(resolve(root, path), "utf8");
    assert.match(html, new RegExp(`data-version="${version}"`));
    assert.match(html, /Content-Security-Policy/);
    const source = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
    assert.ok(source?.startsWith(`${base}assets/`));
    await readFile(resolve(root, source.slice(base.length)));
    if (version === "v4") assert.ok(html.includes(`href="${base}manifest.webmanifest"`));
  }
  const manifest = JSON.parse(await readFile(resolve(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  const headers = await readFile(resolve(root, "_headers"), "utf8");
  assert.match(headers, /^\/\*\s*$/m);
  assert.match(headers, /^\s+X-Frame-Options:\s*DENY\s*$/im);
  assert.match(headers, /^\s+Content-Security-Policy:.*frame-ancestors 'none'/im);
  assert.match(headers, /^\s+X-Content-Type-Options:\s*nosniff\s*$/im);
  assert.match(headers, /^\s+Referrer-Policy:\s*no-referrer\s*$/im);
});
