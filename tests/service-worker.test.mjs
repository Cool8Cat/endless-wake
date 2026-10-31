import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function response(body, contentType = "text/html", headers = {}) {
  const value = new Response(body, { headers: { "content-type": contentType, ...headers } });
  function markBasic(item) {
    Object.defineProperty(item, "type", { value: "basic" });
    const clone = item.clone.bind(item);
    Object.defineProperty(item, "clone", { value: () => markBasic(clone()) });
    return item;
  }
  return markBasic(value);
}

function createWorker(basePath = "/project/") {
  const origin = "https://example.test";
  const listeners = new Map();
  const stores = new Map();
  let online = true;
  const keyOf = (request) => typeof request === "string" ? new URL(request, origin).href : request.url;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) { return store.get(keyOf(request))?.clone(); },
        async put(request, value) { store.set(keyOf(request), value.clone()); },
        async keys() { return [...store.keys()].map((url) => ({ url })); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const self = {
    location: { href: `${origin}${basePath}sw.js` },
    addEventListener(type, handler) { listeners.set(type, handler); },
    async skipWaiting() {},
    clients: { async claim() {} },
  };
  async function fetch(request) {
    if (!online) throw new Error("offline");
    const url = new URL(keyOf(request));
    const name = url.pathname;
    if (name.endsWith("wrong.js")) return response("data", "text/html");
    if (name.endsWith("large.js")) return response("data", "text/javascript", { "content-length": "4000001" });
    if (name.endsWith(".png")) return response("image", "image/png");
    if (name.endsWith(".jpg")) return response("image", "image/jpeg");
    if (name.endsWith(".webp")) return response("image", "image/webp");
    if (name.endsWith(".webmanifest")) return response("{}", "application/manifest+json");
    if (name.endsWith(".js")) return response("script", "text/javascript");
    if (name.endsWith(".css")) return response("style", "text/css");
    return response("page");
  }
  vm.runInNewContext(source, { self, caches, fetch, URL, Response, Promise, Set, encodeURIComponent });

  async function dispatch(type, properties = {}) {
    const waits = [];
    let responsePromise;
    const event = {
      ...properties,
      waitUntil(promise) { waits.push(promise); },
      respondWith(promise) { responsePromise = Promise.resolve(promise); },
    };
    listeners.get(type)(event);
    const result = responsePromise ? await responsePromise : undefined;
    await Promise.all(waits);
    return result;
  }
  async function send(urls, client = `${origin}${basePath}`) {
    let reply;
    await dispatch("message", {
      source: { url: client },
      ports: [{ postMessage(value) { reply = value; } }],
      data: { type: "CACHE_URLS", urls },
    });
    return reply?.ok;
  }
  return { origin, basePath, stores, caches, dispatch, send, setOnline(value) { online = value; } };
}

test("caches only approved query-free V4 resources and supports offline navigation", async () => {
  const worker = createWorker();
  await worker.dispatch("install");
  await worker.dispatch("activate");
  const base = `${worker.origin}${worker.basePath}`;
  assert.equal(await worker.send([`${base}assets/game.js`, `${base}assets/game.css`]), true);
  assert.equal(await worker.send([`${base}assets/game.js?token=synthetic`]), false);
  assert.equal(await worker.send([`${base}assets/game.js`], "https://elsewhere.test/"), false);
  assert.equal(await worker.send([`${base}assets/wrong.js`]), false);
  assert.equal(await worker.send([`${base}assets/large.js`]), false);

  const before = [...worker.stores.values()][0].size;
  for (const request of [
    { url: `${base}?token=synthetic`, method: "GET", mode: "navigate" },
    { url: `${base}v5/`, method: "GET", mode: "navigate" },
    { url: `${base}private`, method: "GET", mode: "navigate" },
    { url: `${base}assets/game.js?token=synthetic`, method: "GET", mode: "cors" },
    { url: `${base}assets/game.js`, method: "POST", mode: "cors" },
  ]) assert.equal(await worker.dispatch("fetch", { request }), undefined);
  assert.equal([...worker.stores.values()][0].size, before);

  worker.setOnline(false);
  const offline = await worker.dispatch("fetch", { request: { url: `${base}v4/`, method: "GET", mode: "navigate" } });
  assert.equal(await offline.text(), "page");
});

test("enforces a cache limit under concurrent requests and cleans only its own old caches", async () => {
  const worker = createWorker();
  await worker.caches.open("unrelated");
  await worker.caches.open("endless-wake-v4-6");
  await worker.caches.open("endless-wake-%2Fproject%2F-v4-6");
  await worker.caches.open("endless-wake-%2Fother%2F-v4-6");
  await worker.dispatch("install");
  await worker.dispatch("activate");
  assert.deepEqual([...worker.stores.keys()].sort(), [
    "endless-wake-%2Fother%2F-v4-6", "endless-wake-%2Fproject%2F-v4-8", "endless-wake-v4-6", "unrelated",
  ].sort());
  const base = `${worker.origin}${worker.basePath}`;
  await Promise.all(Array.from({ length: 110 }, (_, index) => worker.dispatch("fetch", {
    request: { url: `${base}assets/file-${index}.js`, method: "GET", mode: "cors" },
  })));
  assert.equal(worker.stores.get("endless-wake-%2Fproject%2F-v4-8").size, 96);
});

test("root installation removes the old application cache without affecting other caches", async () => {
  const worker = createWorker("/");
  await worker.caches.open("endless-wake-v4-6");
  await worker.caches.open("endless-wake-other-v4-6");
  await worker.dispatch("install");
  await worker.dispatch("activate");
  assert.equal(worker.stores.has("endless-wake-v4-6"), false);
  assert.equal(worker.stores.has("endless-wake-other-v4-6"), true);
});
