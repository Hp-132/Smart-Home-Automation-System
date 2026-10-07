// Isometric projection helpers. World units: x → right-down, y → left-down, z → up.
export const U = 20;
const C = 0.8660254;

export const P = (x, y, z = 0) => [(x - y) * C * U, (x + y) * 0.5 * U - z * U];

const r2 = (n) => Math.round(n * 100) / 100;

export const pts = (list) =>
  list.map(([x, y, z]) => P(x, y, z).map(r2).join(',')).join(' ');

/** SVG transforms that map a 2D drawing onto a plane of the house. */
export const T = {
  // horizontal plane at height z: local (x, y)
  h: (z = 0) => `matrix(${r2(C * U)},${r2(0.5 * U)},${r2(-C * U)},${r2(0.5 * U)},0,${r2(-z * U)})`,
  // vertical wall plane y = c: local (x, -z)
  wy: (c) => `matrix(${r2(C * U)},${r2(0.5 * U)},0,${U},${r2(-c * C * U)},${r2(c * 0.5 * U)})`,
  // vertical wall plane x = c: local (-y, -z)
  wx: (c) => `matrix(${r2(C * U)},${r2(-0.5 * U)},0,${U},${r2(c * C * U)},${r2(c * 0.5 * U)})`,
};

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return '#' + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Axis-aligned box. Draws the three faces visible from the viewer: top, +y (left) and +x (right). */
export function box(x, y, z, dx, dy, dz, color, attrs = '') {
  const x1 = x + dx, y1 = y + dy, z1 = z + dz;
  const c = typeof color === 'string' ? { t: shade(color, 0.12), l: color, r: shade(color, -0.14) } : color;
  return `<g ${attrs}>
    <polygon points="${pts([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]])}" fill="${c.l}"/>
    <polygon points="${pts([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]])}" fill="${c.r}"/>
    <polygon points="${pts([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]])}" fill="${c.t}"/>
  </g>`;
}

/** Outline of the prism above a rectangle, used for focus bounds. */
export function prismBounds(x0, x1, y0, y1, h) {
  const corners = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [0, h]) corners.push(P(x, y, z));
  const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
