/// <reference types="vite/client" />
import { createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as typeof globalThis & { __ENDLESS_WAKE_BASE_PATH__?: string }).__ENDLESS_WAKE_BASE_PATH__ =
  import.meta.env.BASE_URL.replace(/\/$/, "");

const container = document.getElementById("root");
if (!container) throw new Error("Game container unavailable");
const root = createRoot(container);

async function start() {
  if (document.body.dataset.version === "v5") {
    const [{ VoxelVoyageGame }] = await Promise.all([
      import("../app/voxel/VoxelVoyageGame"),
      import("../app/voxel/voxel.css"),
    ]);
    root.render(createElement(VoxelVoyageGame));
  } else {
    const [{ VoyageV4Game }] = await Promise.all([
      import("../app/v4/VoyageV4Game"),
      import("../app/v4/v4.css"),
    ]);
    root.render(createElement(VoyageV4Game));
  }
}

void start().catch(() => {
  const message = document.createElement("p");
  message.textContent = "Game assets failed to load. Check your connection and refresh the page.";
  container.replaceChildren(message);
});
