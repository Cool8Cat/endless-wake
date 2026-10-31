# World generation and streaming

The world contains regions, islands, harbors, habitats, and event entities. The world seed and region coordinates determine each region's contents.

`VoxelWorld` provides terrain and region data. `VoxelStream` manages nearby chunks, the loading queue, and chunk eviction. The renderer uses these data to build terrain meshes, depth fields, and shoreline effects.
