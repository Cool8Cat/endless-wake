export const STREAM_CHUNK_SIZE = 13;
export const STREAM_RADIUS = 6;
export const STREAM_LIMIT = (STREAM_RADIUS * 2 + 1) ** 2;
export const STREAM_BATCH_CHUNKS = 4;
export type ChunkAddress = { key: string; x: number; z: number };
export function chunkKey(x: number, z: number) { return `${x},${z}`; }
export function batchKey(x: number, z: number) { return chunkKey(Math.floor(x / STREAM_BATCH_CHUNKS), Math.floor(z / STREAM_BATCH_CHUNKS)); }

// Independent of the GPU. The owner releases evicted resources before consuming new work.
export class VoxelStream {
  readonly resident = new Map<string, ChunkAddress>();
  private desired = new Map<string, ChunkAddress>();
  private queue: ChunkAddress[] = [];
  private centerX = Number.NaN;
  private centerZ = Number.NaN;
  loaded = 0;
  unloaded = 0;
  get pending() { return this.queue.length; }
  focus(x: number, z: number, velocityX = 0, velocityZ = 0) {
    const cx = Math.floor(x / STREAM_CHUNK_SIZE), cz = Math.floor(z / STREAM_CHUNK_SIZE);
    if (cx === this.centerX && cz === this.centerZ) return [];
    this.centerX = cx; this.centerZ = cz;
    this.desired = new Map();
    for (let dz = -STREAM_RADIUS; dz <= STREAM_RADIUS; dz += 1) for (let dx = -STREAM_RADIUS; dx <= STREAM_RADIUS; dx += 1) {
      const key = chunkKey(cx + dx, cz + dz);
      this.desired.set(key, { key, x: cx + dx, z: cz + dz });
    }
    const removed: ChunkAddress[] = [];
    for (const [key, address] of this.resident) if (!this.desired.has(key)) {
      this.resident.delete(key); removed.push(address); this.unloaded += 1;
    }
    const speed = Math.hypot(velocityX, velocityZ) || 1;
    const priority = (address: ChunkAddress) => {
      const dx = address.x - cx, dz = address.z - cz;
      return Math.max(Math.abs(dx), Math.abs(dz)) * 100 + dx * dx + dz * dz - (dx * velocityX + dz * velocityZ) / speed * 3;
    };
    this.queue = [...this.desired.values()].filter((address) => !this.resident.has(address.key)).sort((a, b) => priority(a) - priority(b));
    return removed;
  }
  take(): ChunkAddress | undefined { return this.queue.shift(); }
  accept(address: ChunkAddress) {
    if (!this.desired.has(address.key) || this.resident.has(address.key)) return false;
    this.resident.set(address.key, address); this.loaded += 1;
    return true;
  }
  readyAt(x: number, z: number, radius = 1) {
    const cx = Math.floor(x / STREAM_CHUNK_SIZE), cz = Math.floor(z / STREAM_CHUNK_SIZE);
    for (let dz = -radius; dz <= radius; dz += 1) for (let dx = -radius; dx <= radius; dx += 1) {
      if (!this.resident.has(chunkKey(cx + dx, cz + dz))) return false;
    }
    return true;
  }
  clear() {
    this.resident.clear(); this.desired.clear(); this.queue = [];
    this.centerX = Number.NaN; this.centerZ = Number.NaN;
  }
}
