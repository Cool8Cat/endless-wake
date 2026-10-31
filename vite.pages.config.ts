import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const requestedBase = process.env.PAGES_BASE_PATH || "/";
const parts = requestedBase.split("/").filter(Boolean);
if (!requestedBase.startsWith("/") || parts.some((part) => !/^[a-zA-Z0-9._~-]+$/.test(part) || part === "." || part === "..")) {
  throw new Error("Invalid site base path");
}
const base = parts.length ? `/${parts.join("/")}/` : "/";

export default defineConfig({
  root: resolve("pages-site"),
  publicDir: resolve("public"),
  base,
  plugins: [
    react(),
    {
      name: "static-response-headers",
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "_headers", source: readFileSync(resolve("pages-site/_headers"), "utf8") });
      },
    },
  ],
  build: {
    outDir: resolve("dist-pages"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        home: resolve("pages-site/index.html"),
        v4: resolve("pages-site/v4/index.html"),
        v5: resolve("pages-site/v5/index.html"),
      },
    },
  },
});
