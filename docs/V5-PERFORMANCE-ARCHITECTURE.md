# Voxel rendering architecture

Terrain is built in chunks, with neighboring chunks combined into draw batches. Mesh generation merges adjacent faces with the same material and removes hidden interior faces. Frustum culling avoids drawing areas outside the view.

The resident chunk window moves with the ship. Chunk loading, mesh rebuilding, and uploads are distributed across frames. Volcanic terrain changes update only affected chunks. Rendering resolution can adjust to the measured frame interval.
