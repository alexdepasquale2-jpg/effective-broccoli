const TESSERACT_VERTS = Array.from({ length: 16 }, (_, i) => ({
  x: i & 1 ? 1 : -1,
  y: i & 2 ? 1 : -1,
  z: i & 4 ? 1 : -1,
  w: i & 8 ? 1 : -1,
}));

const TESSERACT_EDGES = [];
for (let i = 0; i < 16; i += 1) {
  for (let bit = 0; bit < 4; bit += 1) {
    const j = i ^ (1 << bit);
    if (i < j) TESSERACT_EDGES.push([i, j]);
  }
}

const TESSERACT_FACES = [];
for (let a = 0; a < 4; a += 1) {
  for (let b = a + 1; b < 4; b += 1) {
    const free = [0, 1, 2, 3].filter((axis) => axis !== a && axis !== b);
    for (const sa of [-1, 1]) {
      for (const sb of [-1, 1]) {
        const corners = [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ].map(([fa, fb]) => {
          const p = [0, 0, 0, 0];
          p[a] = sa;
          p[b] = sb;
          p[free[0]] = fa;
          p[free[1]] = fb;
          return (p[0] > 0 ? 1 : 0) | (p[1] > 0 ? 2 : 0) | (p[2] > 0 ? 4 : 0) | (p[3] > 0 ? 8 : 0);
        });
        TESSERACT_FACES.push(corners);
      }
    }
  }
}

const CELL16_VERTS = [
  { x: 1, y: 0, z: 0, w: 0 },
  { x: -1, y: 0, z: 0, w: 0 },
  { x: 0, y: 1, z: 0, w: 0 },
  { x: 0, y: -1, z: 0, w: 0 },
  { x: 0, y: 0, z: 1, w: 0 },
  { x: 0, y: 0, z: -1, w: 0 },
  { x: 0, y: 0, z: 0, w: 1 },
  { x: 0, y: 0, z: 0, w: -1 },
];

const CELL16_EDGES = [];
for (let i = 0; i < CELL16_VERTS.length; i += 1) {
  for (let j = i + 1; j < CELL16_VERTS.length; j += 1) {
    const dot =
      CELL16_VERTS[i].x * CELL16_VERTS[j].x +
      CELL16_VERTS[i].y * CELL16_VERTS[j].y +
      CELL16_VERTS[i].z * CELL16_VERTS[j].z +
      CELL16_VERTS[i].w * CELL16_VERTS[j].w;
    if (Math.abs(dot) < 0.01) CELL16_EDGES.push([i, j]);
  }
}

export function tesseractVertexCount() {
  return TESSERACT_VERTS.length;
}

export function tesseractEdgeCount() {
  return TESSERACT_EDGES.length;
}

export function tesseractFaceCount() {
  return TESSERACT_FACES.length;
}

export function cell16EdgeCount() {
  return CELL16_EDGES.length;
}

export function norm4(point) {
  return Math.hypot(point.x, point.y, point.z, point.w);
}

export function rotate4(point, angles) {
  let { x, y, z, w } = point;

  const spin = (a, b, angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [a * c - b * s, a * s + b * c];
  };

  [x, y] = spin(x, y, angles.xy);
  [x, z] = spin(x, z, angles.xz);
  [x, w] = spin(x, w, angles.xw);
  [y, z] = spin(y, z, angles.yz);
  [y, w] = spin(y, w, angles.yw);
  [z, w] = spin(z, w, angles.zw);
  return { x, y, z, w };
}

export function project4to2(point, dist4 = 3.2, dist3 = 3.1) {
  const wDenom = Math.max(0.45, dist4 - point.w);
  const k4 = dist4 / wDenom;
  const x3 = point.x * k4;
  const y3 = point.y * k4;
  const z3 = point.z * k4;
  const zDenom = Math.max(0.45, dist3 - z3);
  const k3 = dist3 / zDenom;
  return {
    x: x3 * k3,
    y: y3 * k3,
    depth: z3 + point.w * 0.55,
    w: point.w,
  };
}

export function hypersphereSliceRadius(w, radius = 1) {
  const inner = radius * radius - w * w;
  return inner <= 0 ? 0 : Math.sqrt(inner);
}

export function createFourDAngles() {
  return { xy: 0.4, xz: 0.2, xw: 0.9, yz: 1.1, yw: 0.3, zw: 0.7 };
}

export function stepFourDAngles(angles, dt, speed = 1) {
  angles.xy += 0.31 * dt * speed;
  angles.xz += 0.47 * dt * speed;
  angles.xw += 0.93 * dt * speed;
  angles.yz += 0.58 * dt * speed;
  angles.yw += 0.76 * dt * speed;
  angles.zw += 1.12 * dt * speed;
  return angles;
}

function projectSet(vertices, angles, scale) {
  return vertices.map((vertex) => {
    const rotated = rotate4(vertex, angles);
    const projected = project4to2(rotated);
    return {
      x: projected.x * scale,
      y: projected.y * scale,
      depth: projected.depth,
      w: projected.w,
    };
  });
}

export function projectTesseract(angles, scale) {
  const vertices = projectSet(TESSERACT_VERTS, angles, scale);
  const faces = TESSERACT_FACES.map((indexes) => {
    const points = indexes.map((index) => vertices[index]);
    const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
    const w = points.reduce((sum, point) => sum + point.w, 0) / points.length;
    return { points, depth, w };
  });
  faces.sort((a, b) => a.depth - b.depth);
  const edges = TESSERACT_EDGES.map(([a, b]) => ({
    a: vertices[a],
    b: vertices[b],
    depth: (vertices[a].depth + vertices[b].depth) * 0.5,
  }));
  edges.sort((a, b) => a.depth - b.depth);
  return { vertices, faces, edges };
}

export function projectCell16(angles, scale) {
  const vertices = projectSet(CELL16_VERTS, angles, scale);
  const edges = CELL16_EDGES.map(([a, b]) => ({
    a: vertices[a],
    b: vertices[b],
    depth: (vertices[a].depth + vertices[b].depth) * 0.5,
  }));
  edges.sort((left, right) => left.depth - right.depth);
  return { vertices, edges };
}

export function sliceWFromAngles(angles) {
  return Math.sin(angles.xw + angles.zw * 0.5);
}
