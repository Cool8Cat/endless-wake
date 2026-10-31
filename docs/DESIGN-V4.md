# V4 · Living Tides

V4 uses Canvas 2D to draw the sea, ships, islands, and marine life. The world is divided into chunks; ship motion accounts for heading, sails, speed, drag, and collisions.

Players can fish, salvage cargo, trade, repair their ship, and use automatic docking at harbor islands. Events include treasure, whirlpools, black-sailed ships, and sea monsters.

## Saving and offline play

Voyages, high scores, and settings are stored locally in the browser. Clearing site data deletes local saves. After the first successful load, the V4 service worker can use cached pages and assets for offline play.

The game entry point is in `app/v4/`; rendering, simulation, and save parsing are in `engine-v4.ts`.
