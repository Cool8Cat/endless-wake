const BASE_URL = new URL("./", self.location.href);
const CACHE_PREFIX = `endless-wake-${encodeURIComponent(BASE_URL.pathname)}-v4-`;
const CACHE_NAME = `${CACHE_PREFIX}8`;
const MAX_CACHE_ENTRIES = 96;
const MAX_RESOURCE_BYTES = 4_000_000;
const MAX_MESSAGE_URLS = 80;
const CORE_PATHS = [
  "", "v4", "v4/", "v4-world-atlas-v1.png", "v4-player-ship-directional-full-v1.png",
  "v4-player-ship-directional-furled-v1.png", "v4-rival-ship-directional-v1.png",
  "v4-player-ship-north-full-v1.png", "v4-player-ship-north-furled-v1.png",
  "v4-rival-ship-north-v1.png", "v4-events-v1.png", "v4-seabed.jpg",
  "v4-island-variants-v1.png", "v4-event-frames-v1.png", "v4-event-expansion-v1.png",
  "v4-ambient-life-v1.png", "v4-harbors-v1.png", "v4-harbor-life-v1.png",
  "v4-underwater-life-v1.png", "v4-social-preview.jpg", "manifest.webmanifest",
];
const CORE_URLS = CORE_PATHS.map((path) => new URL(path, BASE_URL).href);
const CORE_SET = new Set(CORE_PATHS);
let cacheWrites = Promise.resolve();
let pendingWrites = 0;

function resourceKind(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  let url;
  try {
    url = new URL(value, BASE_URL);
  } catch {
    return null;
  }
  if (url.origin !== BASE_URL.origin || url.username || url.password || url.search || url.hash ||
      !url.pathname.startsWith(BASE_URL.pathname)) return null;
  const path = url.pathname.slice(BASE_URL.pathname.length);
  if (CORE_SET.has(path)) {
    if (path === "" || path === "v4" || path === "v4/") return "page";
    if (path.endsWith(".png")) return "png";
    if (path.endsWith(".jpg")) return "jpeg";
    if (path.endsWith(".webp")) return "webp";
    if (path === "manifest.webmanifest") return "manifest";
  }
  if (path.startsWith("assets/") || path.startsWith("_next/static/")) {
    if (/\.(?:m?js)$/i.test(path)) return "script";
    if (/\.css$/i.test(path)) return "style";
    if (/\.woff2?$/i.test(path)) return "font";
  }
  return null;
}

function validResponse(response, kind) {
  if (!response.ok || response.type !== "basic") return false;
  if (response.url && resourceKind(response.url) !== kind) return false;
  const type = (response.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
  if (kind === "page") return type === "text/html";
  if (kind === "png") return type === "image/png";
  if (kind === "jpeg") return type === "image/jpeg";
  if (kind === "webp") return type === "image/webp";
  if (kind === "manifest") return type === "application/manifest+json" || type === "application/json" || type === "text/plain";
  if (kind === "script") return type === "text/javascript" || type === "application/javascript";
  if (kind === "style") return type === "text/css";
  if (kind === "font") return type === "font/woff" || type === "font/woff2" || type === "application/font-woff";
  return false;
}

async function fitsResourceLimit(response) {
  const declared = response.headers.get("content-length");
  if (declared && Number(declared) > MAX_RESOURCE_BYTES) return false;
  const stream = response.clone().body;
  if (!stream) return true;
  const reader = stream.getReader();
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return true;
    size += value.byteLength;
    if (size > MAX_RESOURCE_BYTES) {
      void reader.cancel();
      return false;
    }
  }
}

function storeResponse(request, response, kind) {
  if (pendingWrites >= MAX_CACHE_ENTRIES) return Promise.resolve(false);
  pendingWrites += 1;
  const next = cacheWrites.then(async () => {
    if (!validResponse(response, kind) || !(await fitsResourceLimit(response))) return false;
    const cache = await caches.open(CACHE_NAME);
    if (!(await cache.match(request)) && (await cache.keys()).length >= MAX_CACHE_ENTRIES) return false;
    await cache.put(request, response);
    return true;
  }).catch(() => false).finally(() => { pendingWrites -= 1; });
  cacheWrites = next.then(() => undefined);
  return next;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const results = await Promise.all(CORE_URLS.map(async (url) => {
      const response = await fetch(url, { cache: "reload" });
      return storeResponse(url, response, resourceKind(url));
    }));
    if (results.some((result) => !result)) throw new Error("Offline resources could not be fully cached");
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) =>
      (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) ||
      (BASE_URL.pathname === "/" && /^endless-wake-v4-\d+$/.test(key)),
    ).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "CACHE_URLS" || !Array.isArray(event.data.urls)) return;
  const port = event.ports?.[0];
  event.waitUntil((async () => {
    try {
      const source = new URL(event.source.url);
      if (source.origin !== BASE_URL.origin || !source.pathname.startsWith(BASE_URL.pathname) ||
          event.data.urls.length > MAX_MESSAGE_URLS) throw new Error("Invalid offline cache request");
      const urls = [...new Set(event.data.urls)];
      if (!urls.some((url) => resourceKind(url) === "script") ||
          urls.some((url) => !["script", "style", "font"].includes(resourceKind(url)))) {
        throw new Error("Invalid offline resource");
      }
      const cache = await caches.open(CACHE_NAME);
      const results = await Promise.all(urls.map(async (url) => {
        if (await cache.match(url)) return true;
        const response = await fetch(url, { cache: "reload" });
        return storeResponse(url, response, resourceKind(url));
      }));
      const core = await Promise.all(CORE_URLS.map((url) => cache.match(url)));
      port?.postMessage({ ok: results.every(Boolean) && core.every(Boolean) });
    } catch {
      port?.postMessage({ ok: false });
    }
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const kind = resourceKind(request.url);
  if (!kind || (request.mode === "navigate" && kind !== "page")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      event.waitUntil(storeResponse(request, response.clone(), kind));
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request)) || (await cache.match(CORE_URLS[0])) || Response.error();
    }));
    return;
  }

  event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    event.waitUntil(storeResponse(request, response.clone(), kind));
    return response;
  }));
});
