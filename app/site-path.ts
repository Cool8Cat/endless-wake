type SiteGlobal = typeof globalThis & { __ENDLESS_WAKE_BASE_PATH__?: string };

export function sitePath(path: string): string {
  const base = (globalThis as SiteGlobal).__ENDLESS_WAKE_BASE_PATH__ ?? "";
  return `${base}${path}`;
}
