import * as THREE from "three";

export interface HeightmapOptions {
  extrusionDepth: number;
  baseThickness: number;
  addBase: boolean;
  invert: boolean;
  smoothingLevel: number;
  resolution: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Sample an ImageData at reduced resolution (bilinear).
 */
function sampleGrayscale(
  data: ImageData,
  cols: number,
  rows: number
): Float32Array {
  const grid = new Float32Array(cols * rows);
  const sw = data.width;
  const sh = data.height;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1)) * (sw - 1);
      const y = (r / (rows - 1)) * (sh - 1);
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const tx = x - xi;
      const ty = y - yi;
      const xi1 = Math.min(xi + 1, sw - 1);
      const yi1 = Math.min(yi + 1, sh - 1);

      function getL(px: number, py: number): number {
        const i = (py * sw + px) * 4;
        return (data.data[i] * 0.299 + data.data[i + 1] * 0.587 + data.data[i + 2] * 0.114) / 255;
      }

      const v =
        getL(xi, yi) * (1 - tx) * (1 - ty) +
        getL(xi1, yi) * tx * (1 - ty) +
        getL(xi, yi1) * (1 - tx) * ty +
        getL(xi1, yi1) * tx * ty;
      grid[r * cols + c] = v;
    }
  }
  return grid;
}

function boxBlur(grid: Float32Array, cols: number, rows: number, passes: number): Float32Array {
  let src = grid.slice();
  for (let p = 0; p < passes; p++) {
    const dst = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0, cnt = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              sum += src[nr * cols + nc];
              cnt++;
            }
          }
        }
        dst[r * cols + c] = sum / cnt;
      }
    }
    src = dst;
  }
  return src;
}

export function buildHeightmapGeometry(
  imageData: ImageData,
  opts: HeightmapOptions
): THREE.BufferGeometry {
  const cols = Math.max(32, Math.min(opts.resolution, 256));
  const rows = Math.max(32, Math.min(opts.resolution, 256));

  let grid = sampleGrayscale(imageData, cols, rows);
  if (opts.invert) grid = grid.map(v => 1 - v);
  if (opts.smoothingLevel > 0) grid = boxBlur(grid, cols, rows, opts.smoothingLevel);

  const pw = opts.scaleX;
  const ph = opts.scaleY;
  const depth = opts.extrusionDepth;
  const base = opts.baseThickness;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const getZ = (r: number, c: number) =>
    grid[r * cols + c] * depth + (opts.addBase ? base : 0);
  const getBaseZ = () => (opts.addBase ? 0 : undefined);

  // Top surface
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1) - 0.5) * pw;
      const y = (r / (rows - 1) - 0.5) * ph;
      const z = getZ(r, c);
      positions.push(x, y, z);
      uvs.push(c / (cols - 1), r / (rows - 1));
      normals.push(0, 0, 1); // will be recalculated
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      indices.push(a, d, b);
      indices.push(b, d, e);
    }
  }

  if (opts.addBase) {
    const bz = 0;
    const offset = positions.length / 3;
    // Bottom surface (inverted normals)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c / (cols - 1) - 0.5) * pw;
        const y = (r / (rows - 1) - 0.5) * ph;
        positions.push(x, y, bz);
        uvs.push(c / (cols - 1), r / (rows - 1));
        normals.push(0, 0, -1);
      }
    }
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = offset + r * cols + c;
        const b = a + 1;
        const d = offset + (r + 1) * cols + c;
        const e = d + 1;
        indices.push(a, b, d);
        indices.push(b, e, d);
      }
    }

    // Side walls — 4 edges
    const sideOffset = positions.length / 3;
    const addSideWall = (
      pts: Array<{ x: number; y: number; topZ: number }>
    ) => {
      const base = positions.length / 3;
      for (const p of pts) {
        positions.push(p.x, p.y, p.topZ); // top
        positions.push(p.x, p.y, bz);     // bottom
        uvs.push(0, 1); uvs.push(0, 0);
        normals.push(0, 0, 0); normals.push(0, 0, 0);
      }
      const n = pts.length;
      for (let i = 0; i < n - 1; i++) {
        const t0 = base + i * 2;
        const b0 = base + i * 2 + 1;
        const t1 = base + (i + 1) * 2;
        const b1 = base + (i + 1) * 2 + 1;
        indices.push(t0, b0, t1);
        indices.push(t1, b0, b1);
      }
    };

    // Left edge (c=0)
    addSideWall(Array.from({ length: rows }, (_, r) => ({
      x: -pw / 2,
      y: (r / (rows - 1) - 0.5) * ph,
      topZ: getZ(r, 0),
    })));
    // Right edge (c=cols-1)
    addSideWall(Array.from({ length: rows }, (_, r) => ({
      x: pw / 2,
      y: (r / (rows - 1) - 0.5) * ph,
      topZ: getZ(r, cols - 1),
    })).reverse());
    // Bottom edge (r=0)
    addSideWall(Array.from({ length: cols }, (_, c) => ({
      x: (c / (cols - 1) - 0.5) * pw,
      y: -ph / 2,
      topZ: getZ(0, c),
    })).reverse());
    // Top edge (r=rows-1)
    addSideWall(Array.from({ length: cols }, (_, c) => ({
      x: (c / (cols - 1) - 0.5) * pw,
      y: ph / 2,
      topZ: getZ(rows - 1, c),
    })));
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── STL export ──────────────────────────────────────────────────────────────
export function geometryToSTL(geo: THREE.BufferGeometry): ArrayBuffer {
  const cloned = geo.clone().toNonIndexed();
  cloned.computeVertexNormals();
  const posAttr = cloned.attributes.position as THREE.BufferAttribute;
  const normAttr = cloned.attributes.normal as THREE.BufferAttribute;
  const triangles = posAttr.count / 3;
  const buf = new ArrayBuffer(84 + triangles * 50);
  const view = new DataView(buf);
  // Header (80 bytes)
  const header = "Rhe.3d Export";
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  }
  view.setUint32(80, triangles, true);
  let offset = 84;
  for (let i = 0; i < triangles; i++) {
    const base = i * 3;
    // Normal
    view.setFloat32(offset, normAttr.getX(base), true); offset += 4;
    view.setFloat32(offset, normAttr.getY(base), true); offset += 4;
    view.setFloat32(offset, normAttr.getZ(base), true); offset += 4;
    // 3 vertices
    for (let v = 0; v < 3; v++) {
      const vi = base + v;
      view.setFloat32(offset, posAttr.getX(vi), true); offset += 4;
      view.setFloat32(offset, posAttr.getY(vi), true); offset += 4;
      view.setFloat32(offset, posAttr.getZ(vi), true); offset += 4;
    }
    view.setUint16(offset, 0, true); offset += 2;
  }
  return buf;
}

// ─── OBJ export ──────────────────────────────────────────────────────────────
export function geometryToOBJ(geo: THREE.BufferGeometry): string {
  const cloned = geo.clone().toNonIndexed();
  cloned.computeVertexNormals();
  const posAttr = cloned.attributes.position as THREE.BufferAttribute;
  const normAttr = cloned.attributes.normal as THREE.BufferAttribute;
  const uvAttr = cloned.attributes.uv as THREE.BufferAttribute;
  const lines: string[] = ["# Rhe.3d Export", "# https://github.com/littlebeansf/rhe-3d", "o Rhe3d"];
  for (let i = 0; i < posAttr.count; i++) {
    lines.push(`v ${posAttr.getX(i).toFixed(5)} ${posAttr.getY(i).toFixed(5)} ${posAttr.getZ(i).toFixed(5)}`);
  }
  if (uvAttr) {
    for (let i = 0; i < uvAttr.count; i++) {
      lines.push(`vt ${uvAttr.getX(i).toFixed(5)} ${uvAttr.getY(i).toFixed(5)}`);
    }
  }
  for (let i = 0; i < normAttr.count; i++) {
    lines.push(`vn ${normAttr.getX(i).toFixed(5)} ${normAttr.getY(i).toFixed(5)} ${normAttr.getZ(i).toFixed(5)}`);
  }
  for (let i = 0; i < posAttr.count; i += 3) {
    const a = i + 1, b = i + 2, c = i + 3;
    lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);
  }
  return lines.join("\n");
}

// ─── 3MF export ──────────────────────────────────────────────────────────────
export async function geometryTo3MF(geo: THREE.BufferGeometry): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const cloned = geo.clone().toNonIndexed();
  const posAttr = cloned.attributes.position as THREE.BufferAttribute;
  const triangles = posAttr.count / 3;

  // Build vertices and deduplicated index map
  const vertices: number[] = [];
  const triangleList: Array<[number, number, number]> = [];
  const vertexMap = new Map<string, number>();

  const addVertex = (i: number): number => {
    const key = `${posAttr.getX(i).toFixed(4)},${posAttr.getY(i).toFixed(4)},${posAttr.getZ(i).toFixed(4)}`;
    if (vertexMap.has(key)) return vertexMap.get(key)!;
    const idx = vertices.length / 3;
    vertices.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    vertexMap.set(key, idx);
    return idx;
  };

  for (let i = 0; i < triangles; i++) {
    const a = addVertex(i * 3);
    const b = addVertex(i * 3 + 1);
    const c = addVertex(i * 3 + 2);
    triangleList.push([a, b, c]);
  }

  const vertexXML = vertices.reduce((acc, _, i) => {
    if (i % 3 === 0) {
      acc += `<vertex x="${vertices[i].toFixed(4)}" y="${vertices[i+1].toFixed(4)}" z="${vertices[i+2].toFixed(4)}"/>`;
    }
    return acc;
  }, "");
  const triangleXML = triangleList.map(([a, b, c]) => `<triangle v1="${a}" v2="${b}" v3="${c}"/>`).join("");

  const model3MF = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">Rhe.3d Export</metadata>
  <metadata name="Application">Rhe.3d</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>${vertexXML}</vertices>
        <triangles>${triangleXML}</triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1"/>
  </build>
</model>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", rels);
  zip.file("3D/3dmodel.model", model3MF);

  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.ms-package.3dmanufacturing-3dmodel+zip" });
}

// ─── GLB export ──────────────────────────────────────────────────────────────
export async function geometryToGLB(geo: THREE.BufferGeometry): Promise<ArrayBuffer> {
  const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x4fd1c5 })
  );
  const scene = new THREE.Scene();
  scene.add(mesh);
  return new Promise((resolve, reject) => {
    exporter.parse(scene, (result) => resolve(result as ArrayBuffer), reject, { binary: true });
  });
}

// ─── Mesh validation ─────────────────────────────────────────────────────────
export interface MeshValidation {
  triangles: number;
  vertices: number;
  isManifold: boolean;
  minWallThickness: number;
  hasOverhangs: boolean;
  warnings: string[];
}

export function validateMesh(geo: THREE.BufferGeometry): MeshValidation {
  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const indexAttr = geo.index;
  const triangles = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;
  const vertices = posAttr.count;

  const warnings: string[] = [];

  // Simple manifold check: count edge occurrences
  const edgeMap = new Map<string, number>();
  const getIdx = (i: number) => indexAttr ? indexAttr.getX(i) : i;
  for (let t = 0; t < triangles; t++) {
    const a = getIdx(t * 3), b = getIdx(t * 3 + 1), c = getIdx(t * 3 + 2);
    for (const [x, y] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = x < y ? `${x}-${y}` : `${y}-${x}`;
      edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
    }
  }
  const nonManifoldEdges = [...edgeMap.values()].filter(v => v !== 2).length;
  const isManifold = nonManifoldEdges === 0;

  if (!isManifold) warnings.push(`Non-manifold geometry detected (${nonManifoldEdges} boundary edges)`);

  // Bounding box based wall thickness estimate
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const dims = new THREE.Vector3();
  bb.getSize(dims);
  const minWall = Math.min(dims.x, dims.y, dims.z);

  if (minWall < 0.8) warnings.push("Minimum dimension < 0.8mm — may be too thin to print");

  // Overhang check: look for downward-facing normals > 45°
  const normAttr = geo.attributes.normal as THREE.BufferAttribute;
  let hasOverhangs = false;
  for (let i = 0; i < normAttr.count; i++) {
    const nz = normAttr.getZ(i);
    if (nz < -0.707) { hasOverhangs = true; break; }
  }
  if (hasOverhangs) warnings.push("Overhangs > 45° detected — consider supports");

  return { triangles, vertices, isManifold, minWallThickness: Math.round(minWall * 10) / 10, hasOverhangs, warnings };
}
