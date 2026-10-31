export type ModelVector = readonly [number, number, number];
export type ModelPalette = readonly ModelVector[];

export function addQuad(out: number[], a: ModelVector, b: ModelVector, c: ModelVector, d: ModelVector, normal: ModelVector, color: ModelVector) {
  for (const p of [a, b, c, a, c, d]) out.push(...p, ...normal, ...color);
}

export function addBox(out: number[], center: ModelVector, size: ModelVector, color: ModelVector) {
  const [x, y, z] = center, [w, h, l] = size;
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2, z0 = z - l / 2, z1 = z + l / 2;
  addQuad(out, [x0,y1,z0], [x0,y1,z1], [x1,y1,z1], [x1,y1,z0], [0,1,0], color);
  addQuad(out, [x0,y0,z1], [x0,y0,z0], [x1,y0,z0], [x1,y0,z1], [0,-1,0], color);
  addQuad(out, [x1,y0,z0], [x1,y1,z0], [x1,y1,z1], [x1,y0,z1], [1,0,0], color);
  addQuad(out, [x0,y0,z1], [x0,y1,z1], [x0,y1,z0], [x0,y0,z0], [-1,0,0], color);
  addQuad(out, [x0,y0,z0], [x0,y1,z0], [x1,y1,z0], [x1,y0,z0], [0,0,-1], color);
  addQuad(out, [x1,y0,z1], [x1,y1,z1], [x0,y1,z1], [x0,y0,z1], [0,0,1], color);
}

// Solid meshes are sampled once; internal faces are removed and coplanar faces merge.
export function addVoxelSolid(out: number[], minimum: ModelVector, maximum: ModelVector, cell: number,
  palette: ModelPalette, materialAt: (x: number, y: number, z: number) => number) {
  const dimensions = maximum.map((v, axis) => Math.ceil((v - minimum[axis]) / cell));
  const [nx, ny, nz] = dimensions;
  const strides = [1,nx,nx*ny];
  if (!Number.isFinite(cell) || cell <= 0 || minimum.some((v) => !Number.isFinite(v)) || dimensions.some((v) => !Number.isFinite(v) || v < 1 || v > 160) || nx * ny * nz > 500_000) throw new RangeError("Model volume exceeds its build budget");
  const cells = new Uint8Array(nx * ny * nz);
  const index = (x: number, y: number, z: number) => x + nx * (y + ny * z);
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const material = materialAt(minimum[0] + (x + .5) * cell, minimum[1] + (y + .5) * cell, minimum[2] + (z + .5) * cell);
    if (!Number.isInteger(material) || material < -1 || material >= palette.length || material > 253) throw new RangeError("Invalid model material");
    cells[index(x,y,z)] = material + 1;
  }
  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3, v = (axis + 2) % 3, width = dimensions[u], height = dimensions[v];
    const mask = new Int16Array(width * height);
    const sample = (d: number, i: number, j: number) => {
      if (d < 0 || d >= dimensions[axis]) return 0;
      return cells[d*strides[axis]+i*strides[u]+j*strides[v]];
    };
    for (let plane = 0; plane <= dimensions[axis]; plane++) {
      for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
        const a = sample(plane - 1, i, j), b = sample(plane, i, j);
        mask[i + j * width] = a && !b ? a : b && !a ? -b : 0;
      }
      for (let j = 0; j < height; j++) for (let i = 0; i < width;) {
        const material = mask[i + j * width];
        if (!material) { i++; continue; }
        let w = 1, h = 1;
        while (i + w < width && mask[i + w + j * width] === material) w++;
        outer: while (j + h < height) {
          for (let k = 0; k < w; k++) if (mask[i+k+(j+h)*width] !== material) break outer;
          h++;
        }
        const point = (du: number, dv: number): [number,number,number] => {
          const p: [number,number,number] = [...minimum];
          p[axis] += plane * cell; p[u] += (i+du) * cell; p[v] += (j+dv) * cell;
          return p;
        };
        const normal: [number,number,number] = [0,0,0]; normal[axis] = material > 0 ? 1 : -1;
        const a = point(0,0), b = point(w,0), c = point(w,h), d = point(0,h);
        if (material > 0) addQuad(out,a,b,c,d,normal,palette[material-1]);
        else addQuad(out,a,d,c,b,normal,palette[-material-1]);
        for (let row = 0; row < h; row++) mask.fill(0, i+(j+row)*width, i+w+(j+row)*width);
        i += w;
      }
    }
  }
}

export function addSteppedBeam(out: number[], from: ModelVector, to: ModelVector, thickness: number, color: ModelVector, step = .14) {
  const distance = Math.hypot(to[0]-from[0],to[1]-from[1],to[2]-from[2]);
  const count = Math.max(1, Math.ceil(distance / step));
  for (let i = 0; i < count; i++) {
    const p = from.map((value,a) => value+(to[a]-value)*(i+.5)/count) as [number,number,number];
    // Neighboring blocks overlap on every axis; thin diagonal rigging must not become dotted.
    const size = from.map((value,a) => Math.abs(to[a]-value)/count+thickness) as [number,number,number];
    addBox(out,p,size,color);
  }
}

export function appendModel(out: number[], mesh: readonly number[] | Float32Array, position: ModelVector, scale = 1, quarterTurns = 0) {
  const angle = quarterTurns * Math.PI / 2, c = Math.cos(angle), s = Math.sin(angle);
  for (let i = 0; i < mesh.length; i += 9) {
    out.push(position[0]+(mesh[i]*c+mesh[i+2]*s)*scale,position[1]+mesh[i+1]*scale,position[2]+(-mesh[i]*s+mesh[i+2]*c)*scale,
      mesh[i+3]*c+mesh[i+5]*s,mesh[i+4],-mesh[i+3]*s+mesh[i+5]*c,mesh[i+6],mesh[i+7],mesh[i+8]);
  }
}
