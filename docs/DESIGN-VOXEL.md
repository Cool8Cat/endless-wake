# V5 · Voxel

V5 uses WebGL to draw voxel islands and the sea. The world includes harbors, islands, marine life, wrecks, and volcanoes. Terrain streams in around the ship.

Ship motion combines sails, drag, currents, buoyancy, and collisions. Players can salvage, fish, fight, trade, repair their ship, and change equipment. Voyage state lasts for the current page session.

The interface is in `app/voxel/VoxelVoyageGame.tsx`. World generation, mesh construction, and rendering are in `voxel-world.ts`, `voxel-terrain-mesh.ts`, and `voxel-engine.ts`, respectively.
