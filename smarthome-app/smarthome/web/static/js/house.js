// Builds the isometric cutaway house as SVG and keeps it in sync with device state.
import { P, T, box, pts, shade, prismBounds, U } from './iso.js';
import { icon } from './icons.js';

const H = 3.0;      // full wall height
const LW = 0.55;    // cut height of interior / front walls
const WALL = { t: '#3d3833', l: '#f3efe9', r: '#e4ded5' };
const LOW = { t: '#4a443e', l: '#efe9e1', r: '#ddd6cc' };

export const ROOMS = {
  living:   { x0: 0,  x1: 8,  y0: 0, y1: 6,  h: H,   label: [4, -0.2, H + 0.75] },
  kitchen:  { x0: 8,  x1: 13, y0: 0, y1: 6,  h: H,   label: [10.5, -0.2, H + 0.75] },
  garage:   { x0: 13, x1: 19.8, y0: 0, y1: 6, h: H,  label: [15.5, -0.2, H + 0.75] },
  bedroom:  { x0: 0,  x1: 5,  y0: 6, y1: 10, h: H,   label: [-0.1, 8, H + 0.75] },
  bathroom: { x0: 5,  x1: 8,  y0: 6, y1: 10, h: 1.6, label: [6.5, 10.2, -1.05] },
  outdoor:  { x0: 8,  x1: 18, y0: 6, y1: 10, h: 2.8, label: [13, 10.2, -1.05] },
};

// Where each device's pin sits (world coordinates).
const ANCHORS = {
  'living-light': [3.05, 3.25, 3.05], 'living-curtains': [6.35, 0, 2.95], 'living-tv': [2.8, 0, 2.95],
  'living-music': [4.85, 0.35, 1.5], 'living-ac': [0, 3.0, 3.0], 'living-vacuum': [7.5, 5.5, 0.7],
  'kitchen-light': [10.5, 3.45, 3.05], 'kitchen-fridge': [12.5, 0.45, 2.6], 'kitchen-smoke': [8.9, 0, 3.15],
  'garage-light': [16.2, 0, 3.05], 'garage-door': [18.1, 3, 2.85], 'garage-energy': [13.95, 0, 2.55],
  'bedroom-light': [3.1, 8.1, 3.05], 'bedroom-curtains': [0, 7.0, 2.95], 'bedroom-ac': [0, 9.0, 3.0],
  'bathroom-light': [6.8, 8.0, 3.05], 'bathroom-heater': [6.85, 6.2, 1.25],
  'outdoor-light': [9.2, 9.3, 2.5], 'front-door': [10.9, 6, 2.7], 'outdoor-camera': [17.9, 6.2, 3.0],
  'outdoor-sprinkler': [15.2, 8.1, 0.7],
};

const VACUUM_PATH = [
  [7.5, 5.5], [7.3, 5.15], [5.7, 5.15], [5.7, 4.4], [7.35, 4.4], [7.35, 3.6], [5.7, 3.6], [5.7, 2.8],
  [7.35, 2.8], [7.35, 2.0], [5.7, 2.0], [5.7, 1.4], [7.35, 1.4], [7.4, 5.1],
];

const at = (x, y, z) => { const [a, b] = P(x, y, z); return `translate(${a.toFixed(2)} ${b.toFixed(2)})`; };

// ---------------------------------------------------------------- building blocks

function lightDefs(id) {
  return `<radialGradient id="pool-${id}"><stop offset="0" class="lc" stop-color="#fff2d9" stop-opacity=".95"/><stop offset=".55" class="lc" stop-color="#fff2d9" stop-opacity=".35"/><stop offset="1" class="lc" stop-color="#fff2d9" stop-opacity="0"/></radialGradient>
  <linearGradient id="cone-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="lc" stop-color="#fff2d9" stop-opacity=".55"/><stop offset="1" class="lc" stop-color="#fff2d9" stop-opacity="0"/></linearGradient>`;
}

/** Light pool on the floor (drawn under furniture). */
function pool(id, x, y, r, z = 0) {
  return `<g transform="${T.h(z)}"><circle class="pool" data-dev="${id}" cx="${x}" cy="${y}" r="${r}" fill="url(#pool-${id})"/></g>`;
}

function pendant(id, x, y, zs = 2.05) {
  const [tx, ty] = P(x, y, zs + 0.3);
  const [bx, by] = P(x, y, zs);
  const [fx, fy] = P(x, y, 0);
  const [cx, cy] = P(x, y, H);
  return `<g class="dev light-fixture" data-dev="${id}">
    <polygon class="cone" data-dev="${id}" points="${bx - 8.5},${by} ${bx + 8.5},${by} ${fx + 30},${fy} ${fx - 30},${fy}" fill="url(#cone-${id})"/>
    <line x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" stroke="#5b544d" stroke-width=".5"/>
    <circle class="halo" cx="${bx}" cy="${by + 1}" r="${1.9 * U}" fill="url(#pool-${id})"/>
    <path d="M${tx - 2.6},${ty} L${bx - 8.4},${by} A8.4 3.2 0 0 0 ${bx + 8.4},${by} L${tx + 2.6},${ty} Z" fill="#2f2b28"/>
    <ellipse cx="${tx}" cy="${ty}" rx="2.6" ry="1.1" fill="#4a443e"/>
    <ellipse class="glass" cx="${bx}" cy="${by}" rx="8.4" ry="3.2"/>
    <circle cx="${bx}" cy="${by - 4}" r="${0.9 * U}" fill="transparent"/>
  </g>`;
}

function windowOnWall(plane, c, u0, w, z0, z1, curtainsId) {
  const tr = plane === 'y' ? T.wy(c) : T.wx(c);
  const h = z1 - z0;
  let s = `<g transform="${tr}">
    <rect x="${u0 - 0.08}" y="${-z1 - 0.08}" width="${w + 0.16}" height="${h + 0.16}" fill="#d9d2c7"/>
    <rect class="sky" x="${u0}" y="${-z1}" width="${w}" height="${h}" fill="url(#sky)"/>
    <rect class="sky-sheen" x="${u0}" y="${-z1}" width="${w}" height="${h}" fill="url(#sheen)"/>
    <line x1="${u0 + w / 2}" y1="${-z1}" x2="${u0 + w / 2}" y2="${-z0}" stroke="#fbfaf7" stroke-width=".06"/>
    <line x1="${u0}" y1="${-(z0 + h * 0.62)}" x2="${u0 + w}" y2="${-(z0 + h * 0.62)}" stroke="#fbfaf7" stroke-width=".05"/>
    <rect x="${u0}" y="${-z1}" width="${w}" height="${h}" fill="none" stroke="#fbfaf7" stroke-width=".09"/>
    <rect x="${u0 - 0.14}" y="${-z0}" width="${w + 0.28}" height=".07" fill="#cfc7bb"/>`;
  if (curtainsId) {
    const top = z1 + 0.22, half = w / 2 + 0.2;
    s += `<g class="dev curtains" data-dev="${curtainsId}">
      <rect x="${u0 - 0.35}" y="${-(z0 - 0.85)}" width="${w + 0.7}" height="${z1 - z0 + 1.4}" fill="transparent"/>
      <g class="curtain-panel cp-left"><rect x="${u0 - 0.3}" y="${-top}" width="${half + 0.1}" height="${top - 0.06}" fill="url(#folds)"/></g>
      <g class="curtain-panel cp-right"><rect x="${u0 + w / 2 - 0.0}" y="${-top}" width="${half + 0.1}" height="${top - 0.06}" fill="url(#folds)"/></g>
      <rect x="${u0 - 0.4}" y="${-top - 0.08}" width="${w + 0.8}" height=".07" rx=".03" fill="#6f655b"/>
      <circle cx="${u0 - 0.42}" cy="${-top - 0.045}" r=".06" fill="#6f655b"/><circle cx="${u0 + w + 0.42}" cy="${-top - 0.045}" r=".06" fill="#6f655b"/>
    </g>`;
  }
  return s + '</g>';
}

function sunPatch(plane, a, b, dev) {
  // daylight falling on the floor in front of a window
  const poly = plane === 'y'
    ? `${a},0.08 ${b},0.08 ${b + 1.1},2.5 ${a + 1.1},2.5`
    : `0.08,${a} 0.08,${b} 2.5,${b + 1.1} 2.5,${a + 1.1}`;
  return `<g transform="${T.h(0.005)}"><polygon class="sunpatch" ${dev ? `data-dev="${dev}"` : ''} points="${poly}" fill="url(#sunpatch)"/></g>`;
}

function acUnit(id, plane, c, u0, len, z) {
  const tr = plane === 'y' ? T.wy(c) : T.wx(c);
  let air = '';
  for (let i = 0; i < 4; i++) {
    const x = u0 + 0.25 + i * ((len - 0.5) / 3);
    air += `<path class="air" d="M${x},${-z + 0.05} q .12,.35 0,.7 q -.12,.35 0,.7" />`;
  }
  return `<g transform="${tr}"><g class="dev ac" data-dev="${id}">
    <rect x="${u0 - 0.1}" y="${-z - 0.55}" width="${len + 0.2}" height="1.9" fill="transparent"/>
    <g class="airflow">${air}</g>
    <rect x="${u0}" y="${-z - 0.46}" width="${len}" height=".46" rx=".09" fill="#fbfbf9" stroke="#d7d1c8" stroke-width=".03"/>
    <rect x="${u0 + 0.06}" y="${-z - 0.1}" width="${len - 0.12}" height=".07" rx=".03" fill="#e2ddd6"/>
    <rect class="ac-display" x="${u0 + len - 0.52}" y="${-z - 0.36}" width=".38" height=".17" rx=".03"/>
    <text class="ac-temp" x="${u0 + len - 0.33}" y="${-z - 0.235}" text-anchor="middle">24°</text>
    <circle class="led" cx="${u0 + 0.14}" cy="${-z - 0.3}" r=".035"/>
  </g></g>`;
}

function plant(x, y, s = 1) {
  const [px, py] = P(x, y, 0.45 * s);
  return box(x - 0.18 * s, y - 0.18 * s, 0, 0.36 * s, 0.36 * s, 0.45 * s, '#d8cbb8') +
    `<g><circle cx="${px - 4 * s}" cy="${py - 6 * s}" r="${5.5 * s}" fill="#6f8f62"/>
     <circle cx="${px + 4 * s}" cy="${py - 8 * s}" r="${5 * s}" fill="#5f7f54"/>
     <circle cx="${px}" cy="${py - 13 * s}" r="${5.5 * s}" fill="#7f9f70"/></g>`;
}

function planks(x0, y0, w, h, base, alongX = true, step = 0.42) {
  let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${base}"/>`;
  const d = shade(base, -0.06);
  if (alongX) for (let y = y0 + step; y < y0 + h - 0.01; y += step) s += `<line x1="${x0}" y1="${y}" x2="${x0 + w}" y2="${y}" stroke="${d}" stroke-width=".025"/>`;
  else for (let x = x0 + step; x < x0 + w - 0.01; x += step) s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + h}" stroke="${d}" stroke-width=".025"/>`;
  return s;
}

function tiles(x0, y0, w, h, base, step = 0.5) {
  let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${base}"/>`;
  const d = shade(base, -0.07);
  for (let y = y0 + step; y < y0 + h; y += step) s += `<line x1="${x0}" y1="${y}" x2="${x0 + w}" y2="${y}" stroke="${d}" stroke-width=".02"/>`;
  for (let x = x0 + step; x < x0 + w; x += step) s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + h}" stroke="${d}" stroke-width=".02"/>`;
  return s;
}

const floor = (room, inner) => `<g transform="${T.h(0)}"><g class="floor-hit" data-room-hit="${room}">${inner}</g></g>`;

// ---------------------------------------------------------------- rooms

function living() {
  let s = floor('living', planks(0, 0, 8, 6, '#dcbf96') +
    `<rect x="1.3" y="2.2" width="3.7" height="2.9" rx=".05" fill="#e6ddd0"/><rect x="1.45" y="2.35" width="3.4" height="2.6" fill="none" stroke="#cfc3b2" stroke-width=".04"/>`);
  s += box(-0.2, -0.2, 0, 0.2, 6.2, H, WALL) + box(0, -0.2, 0, 8, 0.2, H, WALL);
  s += sunPatch('y', 5.3, 7.4, 'living-curtains');
  s += pool('living-light', 3.05, 3.25, 2.9);
  s += `<g transform="${T.h(0.01)}"><ellipse class="tv-spill" data-dev="living-tv" cx="2.8" cy="1.6" rx="1.8" ry="1.3" fill="url(#tvspill)"/></g>`;
  // TV on the back wall
  s += `<g transform="${T.wy(0)}"><g class="dev tv" data-dev="living-tv">
      <rect x="1.4" y="-2.7" width="2.8" height="1.6" rx=".05" fill="#1c1c1e"/>
      <g class="tv-screen-wrap"><rect class="tv-screen" x="1.47" y="-2.63" width="2.66" height="1.46" fill="url(#tvoff)"/>
        <rect class="tv-content" x="1.47" y="-2.63" width="2.66" height="1.46" fill="url(#tvon)"/>
        <g class="tv-osd"><text class="tv-ch" x="1.6" y="-2.4">CH 1</text>
        <rect x="1.6" y="-1.36" width="1.2" height=".06" rx=".03" fill="rgba(255,255,255,.3)"/><rect class="tv-vol" x="1.6" y="-1.36" width=".12" height=".06" rx=".03" fill="#fff"/></g></g>
      <rect x="1.47" y="-2.63" width="2.66" height="1.46" fill="url(#glare)"/>
    </g></g>`;
  s += windowOnWall('y', 0, 5.3, 2.1, 0.95, 2.55, 'living-curtains');
  s += acUnit('living-ac', 'x', 0, -3.8, 1.6, 2.3);
  // shelf with books
  s += box(0, 0.3, 0, 0.42, 1.3, 1.9, { t: '#d7b58c', l: '#c9a67e', r: '#b89470' });
  s += `<g transform="${T.wx(0.42)}">` + [0.62, 1.24, 1.86].map((z) => `<rect x="-1.58" y="${-z}" width="1.26" height=".05" fill="#8e6f52"/>`).join('') +
    [['#b7564a', -1.5, 0.52], ['#3f6b73', -1.35, 0.46], ['#d9a441', -1.2, 0.5], ['#6d5b8a', -1.05, 0.42], ['#4f7a5a', -0.72, 0.5], ['#c5793f', -0.58, 0.44],
     ['#3f6b73', -1.45, 1.1], ['#e0d6c4', -1.3, 1.12], ['#b7564a', -0.95, 1.08], ['#445566', -0.8, 1.14]]
      .map(([c, x, z]) => `<rect x="${x}" y="${-z - 0.1}" width=".12" height="${z > 1 ? 0.48 : 0.5}" fill="${c}"/>`).join('') + '</g>';
  // TV console, speaker, plant
  s += box(1.2, 0.02, 0, 3.2, 0.45, 0.42, { t: '#7a6250', l: '#6a5444', r: '#5a4638' });
  s += `<g class="dev speaker" data-dev="living-music">` + box(4.65, 0.12, 0, 0.4, 0.42, 1.1, '#35383c') +
    `<g transform="${T.wy(0.54)}"><circle cx="4.85" cy="-0.85" r=".1" fill="#1e2022"/><circle cx="4.85" cy="-0.4" r=".15" fill="#1e2022"/><circle cx="4.85" cy="-0.4" r=".06" fill="#4a4e53"/>
      <circle class="led" cx="4.85" cy="-1.02" r=".025"/></g></g>`;
  s += plant(7.5, 0.5, 1.1);
  // coffee table
  s += box(2.3, 2.9, 0, 1.5, 0.75, 0.36, { t: '#9a7a5d', l: '#7d5f46', r: '#6c513b' });
  s += `<g transform="${T.h(0.361)}"><rect x="2.55" y="3.05" width=".45" height=".3" fill="#e8e1d5"/><circle cx="3.45" cy="3.3" r=".12" fill="#fff"/></g>`;
  // sofa (seen from behind)
  const sofa = '#9ea79c';
  s += box(1.5, 4.3, 0, 3.1, 0.95, 0.42, sofa);
  s += `<g transform="${T.h(0.421)}"><line x1="2.53" y1="4.35" x2="2.53" y2="5" stroke="${shade(sofa, -0.15)}" stroke-width=".03"/><line x1="3.56" y1="4.35" x2="3.56" y2="5" stroke="${shade(sofa, -0.15)}" stroke-width=".03"/></g>`;
  s += box(1.5, 4.3, 0.42, 0.28, 1.0, 0.22, shade(sofa, -0.05)) + box(4.32, 4.3, 0.42, 0.28, 1.0, 0.22, shade(sofa, -0.05));
  s += box(1.5, 5.0, 0.42, 3.1, 0.3, 0.55, shade(sofa, -0.03));
  // vacuum dock + robot
  s += box(7.35, 5.72, 0, 0.36, 0.14, 0.22, '#e9e6e1');
  s += `<g class="dev vacuum" data-dev="living-vacuum"><g class="vacuum-body">
      <ellipse cx="0" cy="2" rx="8" ry="4.6" fill="rgba(0,0,0,.18)"/>
      <path d="M-7.35,0 v-2.2 A7.35 4.25 0 0 1 7.35,-2.2 V0 A7.35 4.25 0 0 1 -7.35,0 Z" fill="#2b2d31"/>
      <ellipse cx="0" cy="-2.2" rx="7.35" ry="4.25" fill="#3a3d42"/>
      <ellipse cx="0" cy="-2.2" rx="4.4" ry="2.5" fill="none" stroke="#55595f" stroke-width=".6"/>
      <circle class="led" cx="0" cy="-2.2" r="1"/>
      <circle cx="0" cy="-2" r="11" fill="transparent"/></g></g>`;
  s += pendant('living-light', 3.05, 3.25);
  return s;
}

function kitchen() {
  let s = floor('kitchen', tiles(8, 0, 5, 6, '#ece7df', 0.6));
  s += box(8, -0.2, 0, 5, 0.2, H, WALL);
  s += box(7.93, 0, 0, 0.14, 2.6, LW, LOW) + box(7.93, 4.4, 0, 0.14, 1.6, LW, LOW);
  s += sunPatch('y', 9.8, 10.8);
  s += pool('kitchen-light', 10.5, 3.45, 2.6);
  s += `<g transform="${T.wy(0)}"><rect x="8.1" y="-1.5" width="3.85" height=".58" fill="#e4ddd2"/>` +
    Array.from({ length: 11 }, (_, i) => `<line x1="${8.1 + i * 0.35}" y1="-1.5" x2="${8.1 + i * 0.35}" y2="-0.92" stroke="#d3cabd" stroke-width=".02"/>`).join('') + '</g>';
  s += windowOnWall('y', 0, 9.8, 1.0, 1.3, 2.3, null);
  s += `<g transform="${T.wy(0)}"><g class="dev smoke" data-dev="kitchen-smoke">
      <circle cx="8.9" cy="-2.72" r=".42" fill="transparent"/>
      <circle cx="8.9" cy="-2.72" r=".17" fill="#fbfbf9" stroke="#d2ccc3" stroke-width=".03"/>
      <circle cx="8.9" cy="-2.72" r=".08" fill="none" stroke="#e1dcd4" stroke-width=".03"/>
      <circle class="led" cx="8.98" cy="-2.66" r=".03"/></g></g>`;
  s += box(8.2, 0, 1.6, 1.4, 0.35, 0.75, { t: '#ffffff', l: '#f6f3ee', r: '#e5e0d8' });
  s += box(11.0, 0, 1.6, 0.95, 0.35, 0.75, { t: '#ffffff', l: '#f6f3ee', r: '#e5e0d8' });
  s += `<g transform="${T.wy(0.35)}"><line x1="8.9" y1="-2.3" x2="8.9" y2="-1.65" stroke="#d8d2c9" stroke-width=".02"/><line x1="11.47" y1="-2.3" x2="11.47" y2="-1.65" stroke="#d8d2c9" stroke-width=".02"/></g>`;
  s += box(8.1, 0, 0, 3.85, 0.7, 0.92, { t: '#3a3835', l: '#f4f1ec', r: '#e1dcd4' });
  s += `<g transform="${T.wy(0.7)}">` + [8.1, 9.06, 10.02, 10.98].map((x) => `<rect x="${x + 0.04}" y="-0.84" width=".88" height=".78" fill="none" stroke="#dcd6cd" stroke-width=".02"/><line x1="${x + 0.38}" y1="-0.74" x2="${x + 0.58}" y2="-0.74" stroke="#b9b2a8" stroke-width=".03"/>`).join('') + '</g>';
  s += `<g transform="${T.h(0.921)}"><rect x="9.95" y="0.12" width=".8" height=".42" rx=".06" fill="#8d8f91"/><circle cx="8.55" cy="0.35" r=".15" fill="none" stroke="#6b6966" stroke-width=".04"/><circle cx="9.05" cy="0.35" r=".15" fill="none" stroke="#6b6966" stroke-width=".04"/></g>`;
  // fridge
  s += `<g class="dev fridge" data-dev="kitchen-fridge">` + box(12.05, 0.05, 0, 0.9, 0.85, 2.2, { t: '#e5e8ea', l: '#d3d7da', r: '#bcc1c5' }) +
    `<g transform="${T.wy(0.9)}"><line x1="12.05" y1="-1.42" x2="12.95" y2="-1.42" stroke="#aeb3b7" stroke-width=".025"/>
      <rect x="12.84" y="-1.35" width=".04" height=".5" rx=".02" fill="#9aa0a5"/><rect x="12.84" y="-2.0" width=".04" height=".4" rx=".02" fill="#9aa0a5"/>
      <rect class="fridge-display" x="12.14" y="-1.95" width=".48" height=".24" rx=".03"/>
      <text class="fridge-temp" x="12.38" y="-1.79" text-anchor="middle">3°C</text></g></g>`;
  // island and stools
  s += box(9.3, 3.0, 0, 2.4, 0.9, 0.92, { t: '#3a3835', l: '#f4f1ec', r: '#e1dcd4' });
  for (const x of [9.75, 10.5, 11.25]) {
    s += box(x - 0.03, 4.3, 0, 0.06, 0.06, 0.62, '#5a4a3d') + box(x - 0.18, 4.15, 0.62, 0.36, 0.36, 0.08, '#b88a5f');
  }
  s += pendant('kitchen-light', 10.5, 3.45);
  s += box(8, 5.93, 0, 2.4, 0.14, LW, LOW) + box(11.4, 5.93, 0, 1.6, 0.14, LW, LOW);
  return s;
}

function garage() {
  let s = floor('garage', `<rect x="13" y="0" width="5" height="6" fill="#cfccc6"/><rect x="13.9" y="1.1" width="3.6" height="3.8" fill="none" stroke="#e8e5df" stroke-width=".06" stroke-dasharray=".3 .2"/>`);
  s += box(13, -0.2, 0, 5, 0.2, H, WALL);
  s += box(12.93, 0, 0, 0.14, 4.8, LW, LOW) + box(12.93, 5.7, 0, 0.14, 0.3, LW, LOW);
  s += pool('garage-light', 15.8, 2.2, 3.0);
  s += `<g transform="${T.wy(0)}"><g class="dev light-fixture tube" data-dev="garage-light">
      <rect x="15.0" y="-3.0" width="2.4" height=".7" fill="transparent"/>
      <ellipse class="halo-flat" cx="16.2" cy="-2.6" rx="1.8" ry=".7" fill="url(#pool-garage-light)"/>
      <rect x="15.2" y="-2.74" width="2.0" height=".14" rx=".05" fill="#d9d6d0"/>
      <rect class="glass" x="15.26" y="-2.66" width="1.88" height=".07" rx=".03"/></g>
    <g class="dev energy" data-dev="garage-energy">
      <rect x="13.45" y="-2.3" width="1.0" height="1.25" rx=".06" fill="#2f3337"/>
      <rect class="energy-screen" x="13.55" y="-2.18" width=".8" height=".46" rx=".03"/>
      <text class="energy-text" x="13.95" y="-1.9" text-anchor="middle">OFF</text>
      <g class="eco-leaf" transform="translate(13.66 -1.55) scale(.012)"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="#7bd389"/></g>
      <circle class="led" cx="14.28" cy="-1.3" r=".04"/></g></g>`;
  // car
  const car = '#3f5d6e';
  s += box(14.1, 1.4, 0.18, 3.2, 3.2, 0.62, car);
  s += box(14.9, 1.65, 0.8, 1.7, 2.7, 0.48, { t: shade(car, 0.1), l: '#a9bfcb', r: '#8ea7b4' });
  s += `<g transform="${T.wy(4.6)}"><circle cx="14.75" cy="-0.28" r=".28" fill="#1f2326"/><circle cx="16.65" cy="-0.28" r=".28" fill="#1f2326"/><circle cx="14.75" cy="-0.28" r=".11" fill="#9aa3a8"/><circle cx="16.65" cy="-0.28" r=".11" fill="#9aa3a8"/></g>`;
  s += `<g transform="${T.wx(17.3)}"><rect x="-4.3" y="-0.66" width=".45" height=".13" rx=".05" fill="#f3efe0"/><rect x="-1.95" y="-0.66" width=".45" height=".13" rx=".05" fill="#f3efe0"/></g>`;
  s += box(13, 5.93, 0, 4.8, 0.14, LW, LOW);
  // façade with the garage door
  const FAC = { t: '#3d3833', l: '#e9e3da', r: '#f1ece4' };
  s += box(17.8, -0.2, 0, 0.2, 1.2, H, FAC);
  s += `<g transform="${T.wx(18)}"><rect x="-5.04" y="-2.44" width="4.08" height="2.44" fill="none" stroke="#b9b1a5" stroke-width=".05"/>
    <g class="dev garage-door" data-dev="garage-door"><rect x="-5.1" y="-2.6" width="4.2" height="2.7" fill="transparent"/>
      <g class="gd-panel"><rect x="-5" y="-2.4" width="4" height="2.4" fill="#d6d0c6"/>` +
    Array.from({ length: 6 }, (_, i) => `<rect x="-5" y="${-2.4 + i * 0.4}" width="4" height=".4" fill="url(#slat)"/>`).join('') +
    `<rect x="-3.25" y="-0.28" width=".5" height=".06" rx=".03" fill="#8e877d"/></g></g></g>`;
  s += box(17.8, 1, 2.4, 0.2, 4, H - 2.4, FAC);
  s += box(17.8, 5, 0, 0.2, 1, H, FAC);
  return s;
}

function bedroom() {
  let s = floor('bedroom', planks(0, 6, 5, 4, '#e4cfad', false) + `<rect x="1.0" y="7.2" width="2.9" height="2.6" rx=".05" fill="#cdb9a5"/>`);
  s += box(-0.2, 6, 0, 0.2, 4, H, WALL);
  s += box(0, 5.93, 0, 3.8, 0.14, LW, LOW) + box(4.8, 5.93, 0, 0.2, 0.14, LW, LOW);
  s += sunPatch('x', 6.3, 7.7, 'bedroom-curtains');
  s += pool('bedroom-light', 3.1, 8.1, 2.4);
  s += windowOnWall('x', 0, -7.7, 1.4, 0.95, 2.5, 'bedroom-curtains');
  s += acUnit('bedroom-ac', 'x', 0, -9.7, 1.4, 2.3);
  s += plant(0.45, 6.45, 0.85);
  s += box(0, 7.3, 0, 0.45, 0.5, 0.5, '#bf9c78');
  s += box(0, 7.9, 0, 0.16, 2.0, 1.15, '#8e7c6c');
  s += box(0.16, 7.95, 0, 2.5, 1.9, 0.48, { t: '#f7f5f1', l: '#ebe7e1', r: '#dcd6ce' });
  s += box(0.3, 8.1, 0.48, 0.5, 0.75, 0.14, { t: '#ffffff', l: '#f1eee9', r: '#e3dfd8' });
  s += box(0.3, 9.02, 0.48, 0.5, 0.75, 0.14, { t: '#ffffff', l: '#f1eee9', r: '#e3dfd8' });
  s += box(1.0, 7.9, 0.2, 1.72, 2.0, 0.34, { t: '#a8b7c2', l: '#95a5b1', r: '#8395a2' });
  s += box(3.9, 9.35, 0, 1.0, 0.5, 0.8, { t: '#d4b28a', l: '#c29f79', r: '#b08d69' });
  s += `<g transform="${T.wy(9.85)}"><line x1="3.9" y1="-0.4" x2="4.9" y2="-0.4" stroke="#a58563" stroke-width=".02"/><rect x="4.3" y="-0.62" width=".2" height=".04" fill="#8a6c4f"/><rect x="4.3" y="-0.24" width=".2" height=".04" fill="#8a6c4f"/></g>`;
  s += pendant('bedroom-light', 3.1, 8.1);
  s += box(0, 9.93, 0, 5, 0.14, LW, LOW);
  return s;
}

function bathroom() {
  let s = floor('bathroom', tiles(5, 6, 3, 4, '#dfe6e8', 0.4) + `<rect x="6.45" y="8.0" width=".6" height="1.0" rx=".08" fill="#c3d2d3"/>`);
  s += box(5, 5.93, 0, 3, 0.14, LW, LOW);
  s += box(4.93, 6.0, 0, 0.14, 0.2, LW, LOW) + box(4.93, 7.1, 0, 0.14, 2.9, LW, LOW);
  s += pool('bathroom-light', 6.8, 8.0, 2.0);
  // radiator
  s += `<g class="dev heater" data-dev="bathroom-heater">` + box(6.2, 6.08, 0.12, 1.3, 0.16, 0.7, { t: '#f2f2f0', l: '#e8e8e6', r: '#d4d4d1' }) +
    `<g transform="${T.wy(6.24)}"><rect x="6.2" y="-0.95" width="1.4" height="1.0" fill="transparent"/>` +
    Array.from({ length: 9 }, (_, i) => `<rect class="fin" x="${6.26 + i * 0.137}" y="-0.78" width=".08" height=".62" rx=".03"/>`).join('') +
    `<g class="heatwaves">${[6.5, 6.85, 7.2].map((x) => `<path d="M${x},-0.9 q .1,-.15 0,-.3 q -.1,-.15 0,-.3" />`).join('')}</g></g></g>`;
  // bath tub and vanity
  s += box(5.3, 7.5, 0, 1.0, 2.1, 0.55, { t: '#fdfdfc', l: '#f4f4f2', r: '#e3e3e0' });
  s += `<g transform="${T.h(0.551)}"><rect x="5.42" y="7.62" width=".76" height="1.86" rx=".32" fill="#cfe0e6"/></g>`;
  s += box(7.2, 8.6, 0, 0.62, 1.0, 0.85, { t: '#f3f1ed', l: '#b8906b', r: '#a57f5d' });
  s += `<g transform="${T.h(0.851)}"><ellipse cx="7.5" cy="9.1" rx=".2" ry=".3" fill="#dfe6e8"/></g>`;
  s += pendant('bathroom-light', 6.8, 8.0);
  s += box(7.93, 6, 0, 0.14, 4, LW, LOW);
  s += box(5, 9.93, 0, 3.07, 0.14, LW, LOW);
  return s;
}

function outdoor() {
  let grass = `<rect x="8" y="6" width="10" height="4" fill="#a9c08c"/>`;
  for (let x = 8; x < 18; x += 1) grass += `<rect x="${x}" y="6" width=".5" height="4" fill="#b2c796" opacity=".6"/>`;
  for (const y of [6.15, 6.85, 7.55, 8.25, 8.95, 9.6]) grass += `<rect x="10.5" y="${y}" width=".8" height=".48" rx=".06" fill="#e0d9cc"/>`;
  grass += `<rect x="18.2" y="1" width="1.6" height="4" fill="#d5d1ca"/>`;
  let s = floor('outdoor', grass);
  s += `<g transform="${T.h(0.005)}"><circle class="wet" data-dev="outdoor-sprinkler" cx="15.2" cy="8.1" r="1.7" fill="#7aa4b3"/></g>`;
  s += pool('outdoor-light', 9.2, 9.3, 2.2);
  const [c0x, c0y] = P(17.85, 6.3, 2.4), [c1x, c1y] = P(13.6, 8.3, 0), [c2x, c2y] = P(15.4, 10, 0);
  s += `<polygon class="cam-cone" data-dev="outdoor-camera" points="${c0x},${c0y} ${c1x},${c1y} ${c2x},${c2y}" fill="url(#camcone)"/>`;
  // bushes
  const bush = (x, y, r) => { const [a, b] = P(x, y, 0); return `<ellipse cx="${a}" cy="${b + 1}" rx="${r * 1.3}" ry="${r * 0.5}" fill="rgba(0,0,0,.12)"/><circle cx="${a - r * 0.4}" cy="${b - r * 0.5}" r="${r * 0.8}" fill="#6d8c5d"/><circle cx="${a + r * 0.45}" cy="${b - r * 0.55}" r="${r * 0.75}" fill="#5e7d51"/><circle cx="${a}" cy="${b - r}" r="${r * 0.8}" fill="#7c9b6b"/>`; };
  s += bush(8.7, 6.7, 7);
  // front door (kitchen / garden)
  s += box(10.32, 5.93, 0, 0.08, 0.14, 2.3, '#e9e3da') + box(11.4, 5.93, 0, 0.08, 0.14, 2.3, '#e9e3da') + box(10.32, 5.93, 2.22, 1.16, 0.14, 0.1, '#e9e3da');
  s += `<g transform="${T.wy(6.07)}"><g class="dev lock" data-dev="front-door">
      <rect x="10.4" y="-2.22" width="1.0" height="2.22" fill="#7c5a40"/>
      <rect x="10.52" y="-2.08" width=".76" height=".85" fill="none" stroke="#6a4c35" stroke-width=".03"/>
      <rect x="10.52" y="-1.08" width=".76" height=".95" fill="none" stroke="#6a4c35" stroke-width=".03"/>
      <rect x="11.16" y="-1.3" width=".16" height=".32" rx=".03" fill="#2c2e31"/>
      <circle class="led" cx="11.24" cy="-1.22" r=".035"/>
      <rect x="11.2" y="-0.92" width=".12" height=".04" rx=".02" fill="#d8c7a4"/></g></g>`;
  s += bush(12.6, 9.4, 8);
  // lamp post
  s += `<g class="dev light-fixture post" data-dev="outdoor-light">` + box(9.16, 9.26, 0, 0.08, 0.08, 1.75, '#3b3a38') +
    (() => { const [a, b] = P(9.2, 9.3, 1.95); return `<circle class="halo" cx="${a}" cy="${b}" r="${1.6 * U}" fill="url(#pool-outdoor-light)"/>`; })() +
    box(9.06, 9.16, 1.75, 0.28, 0.28, 0.34, { t: '#3b3a38', l: '#e9dfc9', r: '#d8ccb3' }) +
    `<g transform="${T.wy(9.44)}"><rect class="glass" x="9.1" y="-2.05" width=".2" height=".26"/></g><g transform="${T.wx(9.34)}"><rect class="glass" x="-9.4" y="-2.05" width=".2" height=".26"/></g>` +
    box(9.02, 9.12, 2.09, 0.36, 0.36, 0.05, '#3b3a38') +
    (() => { const [a, b] = P(9.2, 9.3, 1.6); return `<circle cx="${a}" cy="${b}" r="14" fill="transparent"/>`; })() + '</g>';
  // sprinkler
  const [sx, sy] = P(15.2, 8.1, 0.22);
  let arcs = '';
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const [ex, ey] = P(15.2 + Math.cos(ang) * 1.6, 8.1 + Math.sin(ang) * 1.6, 0);
    const mx = (sx + ex) / 2, my = Math.min(sy, ey) - 16;
    arcs += `<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" style="animation-delay:${(i * 0.13).toFixed(2)}s"/>`;
  }
  s += `<g class="dev sprinkler" data-dev="outdoor-sprinkler">
      <circle cx="${sx}" cy="${sy}" r="12" fill="transparent"/>
      <g class="spray">${arcs}</g>` + box(15.14, 8.04, 0, 0.12, 0.12, 0.22, '#5b5f63') + `</g>`;
  // tree
  { const [a, b] = P(16.8, 8.9, 0);
    s += `<ellipse cx="${a}" cy="${b + 2}" rx="20" ry="8" fill="rgba(0,0,0,.13)"/>` + box(16.74, 8.84, 0, 0.12, 0.12, 1.3, '#7a5b43') +
      `<circle cx="${a - 8}" cy="${b - 34}" r="13" fill="#5f7f52"/><circle cx="${a + 9}" cy="${b - 36}" r="12" fill="#56744a"/><circle cx="${a}" cy="${b - 46}" r="14" fill="#739463"/><circle cx="${a - 3}" cy="${b - 30}" r="9" fill="#688a59"/>`; }
  // camera on the garage corner
  s += `<g class="dev camera" data-dev="outdoor-camera">` + box(17.84, 6.0, 2.62, 0.08, 0.2, 0.06, '#d9d6d0') +
    box(17.7, 6.12, 2.42, 0.28, 0.36, 0.2, { t: '#f2f0ec', l: '#e3e0da', r: '#cfcbc4' }) +
    `<g transform="${T.wy(6.48)}"><circle cx="17.84" cy="-2.52" r=".07" fill="#1e2124"/><circle class="led" cx="17.94" cy="-2.58" r=".025"/></g>` +
    (() => { const [a, b] = P(17.84, 6.3, 2.52); return `<circle cx="${a}" cy="${b}" r="11" fill="transparent"/>`; })() + '</g>';
  return s;
}

function base() {
  return `<ellipse cx="${P(9, 5, 0)[0]}" cy="${P(9, 5, 0)[1] + 18}" rx="330" ry="120" fill="url(#groundshadow)"/>` +
    box(-0.2, -0.2, -0.4, 18.4, 10.4, 0.4, { t: '#e8e1d6', l: '#d6cec1', r: '#c7beb0' }) +
    box(18.2, 1, -0.4, 1.6, 4, 0.4, { t: '#e0dbd3', l: '#cfc9bf', r: '#c2bbb0' });
}

function defs(lightIds) {
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop class="sky1" offset="0"/><stop class="sky2" offset="1"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="sunpatch" x1="0" y1="0" x2="0" y2="1"><stop class="sun1" offset="0"/><stop class="sun2" offset="1"/></linearGradient>
    <pattern id="folds" width=".26" height="1" patternUnits="userSpaceOnUse"><rect width=".26" height="1" fill="#ece5d8"/><rect x=".13" width=".13" height="1" fill="#e0d7c7"/><rect x=".2" width=".06" height="1" fill="#d5cab8"/></pattern>
    <linearGradient id="slat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2ddd4"/><stop offset=".85" stop-color="#d1cabf"/><stop offset="1" stop-color="#bdb5a9"/></linearGradient>
    <linearGradient id="tvoff" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2c30"/><stop offset="1" stop-color="#101113"/></linearGradient>
    <linearGradient id="tvon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d6cdf"/><stop offset=".5" stop-color="#7a4fd6"/><stop offset="1" stop-color="#e2744a"/></linearGradient>
    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="tvspill"><stop offset="0" stop-color="#8fb1ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fb1ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="camcone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b5b" stop-opacity=".35"/><stop offset="1" stop-color="#ff6b5b" stop-opacity="0"/></linearGradient>
    <radialGradient id="groundshadow"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".7" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    ${lightIds.map(lightDefs).join('')}
    ${['base', ...ORDER].map((r) => `<filter id="rf-${r}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>`).join('')}
  </defs>`;
}

// ---------------------------------------------------------------- component

const ORDER = ['living', 'kitchen', 'garage', 'bedroom', 'bathroom', 'outdoor'];
const BUILDERS = { living, kitchen, garage, bedroom, bathroom, outdoor };
const LIGHT_IDS = ['living-light', 'kitchen-light', 'garage-light', 'bedroom-light', 'bathroom-light', 'outdoor-light'];

export const LIGHT_COLORS = {
  'white': '#fff2d9', 'warm white': '#ffd9a3', 'cool white': '#e8f0ff', 'amber': '#ffb04a', 'coral': '#ff8a70',
  'rose': '#ff8fb8', 'violet': '#b99cff', 'blue': '#86b4ff', 'teal': '#6fe0d0', 'green': '#9be7a5',
  'red': '#ff6b6b', 'yellow': '#ffe27a', 'orange': '#ffa25c', 'purple': '#c08bff', 'pink': '#ff9fcf',
};

export function colorToCss(name) {
  if (!name) return LIGHT_COLORS.white;
  const key = String(name).trim().toLowerCase();
  if (LIGHT_COLORS[key]) return LIGHT_COLORS[key];
  if (/^#[0-9a-f]{3,8}$/i.test(key)) return key;
  if (window.CSS && CSS.supports('color', key)) return key;
  return LIGHT_COLORS.white;
}

export class House {
  constructor(svg, { onDevice, onRoom }) {
    this.svg = svg;
    this.onDevice = onDevice;
    this.onRoom = onRoom;
    this.focus = 'all';
    this.devices = new Map();
    this.scene = 'day';
    this.vacuum = { pos: VACUUM_PATH[0].slice(), seg: 0, running: false, raf: 0 };
    this.build();
  }

  build() {
    const whole = prismBounds(-0.2, 19.8, -0.2, 10.4, H + 1.3);
    this.wholeBox = { x: whole.minX - 14, y: whole.minY - 6, w: whole.maxX - whole.minX + 28, h: whole.maxY - whole.minY + 24 };
    let rooms = '';
    for (const id of ORDER) rooms += `<g class="room" data-room="${id}" filter="url(#rf-${id})">${BUILDERS[id]()}</g>`;
    let labels = '';
    for (const id of ORDER) {
      const [a, b] = P(...ROOMS[id].label);
      labels += `<g class="room-label" data-room-hit="${id}" data-label="${id}" transform="translate(${a.toFixed(1)} ${b.toFixed(1)})">
        <rect class="rl-bg" x="-30" y="-9" width="60" height="18" rx="9"/>
        <circle class="rl-dot" cx="-21" cy="0" r="2.6"/>
        <text class="rl-name" x="-15" y="2.6"></text></g>`;
    }
    this.svg.setAttribute('viewBox', this.vb(this.wholeBox));
    this.svg.innerHTML = defs(LIGHT_IDS) +
      `<g class="scene-root"><g class="base" filter="url(#rf-base)">${base()}</g>${rooms}</g>
       <g class="fx"><g class="alarm-rings" data-dev="kitchen-smoke" transform="${at(8.9, 0, 2.72)}"><circle r="6"/><circle r="6" style="animation-delay:.6s"/></g>
         <g class="music-notes" data-dev="living-music" transform="${at(4.85, 0.35, 1.25)}"><text x="-3" y="0">♪</text><text x="3" y="-2" style="animation-delay:.9s">♫</text><text x="0" y="0" style="animation-delay:1.7s">♪</text></g></g>
       <g class="labels">${labels}</g><g class="pins"></g>`;

    this.refs = new Map();
    this.svg.querySelectorAll('[data-dev]').forEach((el) => {
      const id = el.dataset.dev;
      if (!this.refs.has(id)) this.refs.set(id, []);
      this.refs.get(id).push(el);
    });
    this.roomEls = new Map([...this.svg.querySelectorAll('.room')].map((g) => [g.dataset.room, g]));
    this.vacEl = this.svg.querySelector('.vacuum-body');
    this.placeVacuum();

    this.svg.addEventListener('click', (e) => {
      const dev = e.target.closest('.dev, .pin');
      if (dev) { e.stopPropagation(); this.onDevice(dev.dataset.dev, dev.classList.contains('pin') ? 'pin' : 'house'); return; }
      const hit = e.target.closest('[data-room-hit]');
      if (hit) this.onRoom(hit.dataset.roomHit);
    });
    this.svg.addEventListener('keydown', (e) => {
      const pin = e.target.closest('.pin');
      if (pin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.onDevice(pin.dataset.dev, 'pin'); }
    });
  }

  vb(b) { return `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`; }

  roomBox(id) {
    const r = ROOMS[id];
    const b = prismBounds(r.x0 - 0.2, r.x1, r.y0 - 0.2, r.y1, r.h);
    const pad = 16;
    let box = { x: b.minX - pad, y: b.minY - pad - 10, w: b.maxX - b.minX + pad * 2, h: b.maxY - b.minY + pad * 2 + 10 };
    // keep a pleasant aspect ratio
    const rect = this.svg.getBoundingClientRect();
    const target = rect.width && rect.height ? rect.width / rect.height : 1.8;
    if (box.w / box.h < target) { const nw = box.h * target; box.x -= (nw - box.w) / 2; box.w = nw; }
    else { const nh = box.w / target; box.y -= (nh - box.h) / 2; box.h = nh; }
    return box;
  }

  setFocus(id) {
    this.focus = id;
    const to = id === 'all' ? this.wholeBox : this.roomBox(id);
    const from = this.svg.viewBox.baseVal;
    const start = { x: from.x, y: from.y, w: from.width, h: from.height };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce ? 0 : 650;
    const t0 = performance.now();
    cancelAnimationFrame(this.zoomRaf);
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const k = ease(t);
      this.svg.setAttribute('viewBox', this.vb({
        x: start.x + (to.x - start.x) * k, y: start.y + (to.y - start.y) * k,
        w: start.w + (to.w - start.w) * k, h: start.h + (to.h - start.h) * k,
      }));
      if (t < 1) this.zoomRaf = requestAnimationFrame(step);
    };
    this.zoomRaf = requestAnimationFrame(step);
    this.svg.classList.toggle('is-focused', id !== 'all');
    for (const [rid, g] of this.roomEls) g.classList.toggle('is-dimmed', id !== 'all' && rid !== id);
    this.renderPins();
  }

  refit() { this.setFocus(this.focus); }

  setScene(scene) {
    this.scene = scene;
    this.svg.classList.toggle('scene-evening', scene === 'evening');
    this.updateRooms();
  }

  setSelected(id) {
    this.selected = id;
    this.svg.querySelectorAll('.is-selected').forEach((el) => el.classList.remove('is-selected'));
    if (id) (this.refs.get(id) || []).forEach((el) => el.classList.add('is-selected'));
    this.svg.querySelectorAll('.pin').forEach((p) => p.classList.toggle('is-selected', p.dataset.dev === id));
  }

  setPending(id, pending) {
    (this.refs.get(id) || []).forEach((el) => el.classList.toggle('is-pending', pending));
    this.svg.querySelectorAll(`.pin[data-dev="${id}"]`).forEach((p) => p.classList.toggle('is-pending', pending));
  }

  update(devices) {
    for (const d of devices) this.devices.set(d.id, d);
    for (const d of devices) this.applyDevice(d);
    this.updateRooms();
    this.fxReady = true;
    this.renderPins();
    this.updateLabels();
  }

  applyDevice(d) {
    const els = this.refs.get(d.id) || [];
    const s = d.state || {};
    const cls = {
      'is-on': !!d.active,
      'is-open': !!s.open,
      'is-locked': !!s.locked,
      'is-playing': !!s.playing,
      'is-cleaning': !!s.cleaning,
      'is-alarm': !!s.alarmSounding,
      'is-eco': !!s.powerSaving,
      'is-offline': !d.available,
    };
    for (const el of els) {
      for (const [k, v] of Object.entries(cls)) el.classList.toggle(k, v);
    }
    if (d.type === 'light') {
      const c = colorToCss(s.color);
      const b = Math.max(0.05, (s.brightness ?? 80) / 100);
      for (const el of els) el.style.setProperty('--lb', b.toFixed(2));
      for (const el of els) el.style.setProperty('--lc', c);
      this.svg.querySelectorAll(`#pool-${d.id} .lc, #cone-${d.id} .lc`).forEach((st) => st.setAttribute('stop-color', c));
    }
    if (d.type === 'ac') {
      els.forEach((el) => { const t = el.querySelector('.ac-temp'); if (t) t.textContent = `${fmt(s.temperature)}°`; });
    }
    if (d.type === 'tv') {
      els.forEach((el) => {
        const ch = el.querySelector('.tv-ch'); if (ch) ch.textContent = `CH ${s.channel}`;
        const v = el.querySelector('.tv-vol'); if (v) v.setAttribute('width', Math.max(0.02, 1.2 * (s.volume / 100)).toFixed(3));
        const w = el.querySelector('.tv-content'); if (w) w.style.setProperty('--hue', `${(s.channel * 37) % 360}deg`);
      });
    }
    if (d.type === 'fridge') {
      els.forEach((el) => { const t = el.querySelector('.fridge-temp'); if (t) t.textContent = s.on ? `${s.temperature}°C` : 'OFF'; });
    }
    if (d.type === 'energy') {
      els.forEach((el) => { const t = el.querySelector('.energy-text'); if (t) t.textContent = s.on ? (s.powerSaving ? 'ECO' : 'ON') : 'OFF'; });
    }
    if (d.type === 'vacuum') this.setVacuum(!!s.cleaning);
  }

  /** Room brightness reflects its lights and curtains; it is a visual effect only. */
  updateRooms() {
    const evening = this.scene === 'evening';
    const byRoom = {};
    for (const d of this.devices.values()) (byRoom[d.room] ||= []).push(d);
    for (const [rid, g] of this.roomEls) {
      const ds = byRoom[rid] || [];
      const lights = ds.filter((d) => d.type === 'light');
      const curtains = ds.filter((d) => d.type === 'curtains');
      let b;
      if (rid === 'outdoor') b = evening ? 0.5 : 1;
      else {
        b = evening ? 0.4 : 0.8;
        const windowOpen = curtains.length ? curtains.some((c) => c.state.open) : ['kitchen'].includes(rid);
        if (windowOpen) b += evening ? 0.05 : 0.2;
        if (!curtains.length && !['kitchen'].includes(rid) && !evening) b += 0.1;
      }
      for (const l of lights) if (l.state.on) b += (evening ? 0.58 : 0.2) * ((l.state.brightness ?? 80) / 100) * (rid === 'outdoor' ? 0.6 : 1);
      if (rid === 'living' && !evening) { /* keep */ }
      const tv = ds.find((d) => d.type === 'tv');
      if (tv && tv.state.on && evening) b += 0.06;
      b = Math.min(1.06, b);
      const warm = evening ? Math.min(1, lights.filter((l) => l.state.on).length ? 0.8 : 0) : 0;
      this.tweenRoom(rid, b, evening, warm);
    }
    this.tweenRoom('base', evening ? 0.5 : 1, evening, 0);
  }

  /** Animates a room's colour matrix: darker and bluer at night, warmer when its lights are on. */
  tweenRoom(rid, b, evening, warm) {
    const t = evening ? Math.max(0, Math.min(1, (1.0 - b) / 0.6)) : 0;
    const N = [0.62, 0.7, 0.98];
    const m = N.map((n) => b * (1 - t + (t * n) / 0.77));
    m[0] *= 1 + 0.07 * warm; m[2] *= 1 - 0.1 * warm;
    const target = [...m, 0.035 * t];
    this.roomFx ||= {};
    const fx = this.roomFx[rid] ||= { cur: [1, 1, 1, 0], raf: 0 };
    const node = this.svg.querySelector(`#rf-${rid} feColorMatrix`);
    const from = fx.cur.slice();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce || !this.fxReady ? 0 : 900;
    const t0 = performance.now();
    cancelAnimationFrame(fx.raf);
    const step = (now) => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - k, 3);
      fx.cur = from.map((v, i) => v + (target[i] - v) * e);
      const [r, g, bl, lift] = fx.cur;
      node.setAttribute('values', `${r.toFixed(3)} 0 0 0 ${(lift * 0.3).toFixed(3)} 0 ${g.toFixed(3)} 0 0 ${(lift * 0.5).toFixed(3)} 0 0 ${bl.toFixed(3)} 0 ${lift.toFixed(3)} 0 0 0 1 0`);
      if (k < 1) fx.raf = requestAnimationFrame(step);
    };
    fx.raf = requestAnimationFrame(step);
  }

  updateLabels() {
    for (const id of ORDER) {
      const g = this.svg.querySelector(`[data-label="${id}"]`);
      if (!g) continue;
      const ds = [...this.devices.values()].filter((d) => d.room === id);
      const on = ds.filter((d) => d.powered && d.active).length;
      const name = { living: 'Living room', kitchen: 'Kitchen', garage: 'Garage', bedroom: 'Bedroom', bathroom: 'Bathroom', outdoor: 'Garden & entry' }[id];
      const text = on ? `${name} · ${on} on` : name;
      const t = g.querySelector('.rl-name');
      t.textContent = text;
      const w = Math.max(56, text.length * 5.1 + 30);
      const r = g.querySelector('.rl-bg');
      r.setAttribute('x', -w / 2); r.setAttribute('width', w);
      g.querySelector('.rl-dot').setAttribute('cx', -w / 2 + 9);
      t.setAttribute('x', -w / 2 + 16);
      g.classList.toggle('has-on', on > 0);
    }
  }

  renderPins() {
    const layer = this.svg.querySelector('.pins');
    if (this.focus === 'all') { layer.innerHTML = ''; return; }
    let s = '';
    for (const d of this.devices.values()) {
      if (d.room !== this.focus || !ANCHORS[d.id]) continue;
      const [a, b] = P(...ANCHORS[d.id]);
      const on = d.active;
      s += `<g class="pin${on ? ' is-on' : ''}${!d.available ? ' is-offline' : ''}${this.selected === d.id ? ' is-selected' : ''}" data-dev="${d.id}" transform="translate(${a.toFixed(1)} ${(b - 3).toFixed(1)})" tabindex="0" role="button" aria-label="${d.name}">
        <title>${d.name}</title>
        <path class="pin-tail" d="M-2.2,4.4 L0,8 L2.2,4.4 Z"/>
        <circle class="pin-bg" r="6"/>
        <g transform="translate(-3.6 -3.6) scale(.3)">${icon(d.type, d.state)}</g></g>`;
    }
    layer.innerHTML = s;
  }

  // ---------------------------------------------------------- robot vacuum
  placeVacuum() {
    const [x, y] = this.vacuum.pos;
    const [a, b] = P(x, y, 0);
    this.vacEl.setAttribute('transform', `translate(${a.toFixed(2)} ${b.toFixed(2)})`);
  }

  setVacuum(cleaning) {
    const v = this.vacuum;
    if (cleaning === v.running) return;
    v.running = cleaning;
    cancelAnimationFrame(v.raf);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();
    const speed = 0.9; // world units per second
    const target = () => (cleaning ? VACUUM_PATH[(v.seg + 1) % VACUUM_PATH.length] : VACUUM_PATH[0]);
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const [tx, ty] = target();
      const dx = tx - v.pos[0], dy = ty - v.pos[1];
      const dist = Math.hypot(dx, dy);
      const stepLen = reduce ? dist : speed * dt;
      if (dist <= stepLen) {
        v.pos = [tx, ty];
        if (cleaning) v.seg = (v.seg + 1) % VACUUM_PATH.length;
        else { v.seg = 0; this.placeVacuum(); return; }
      } else {
        v.pos = [v.pos[0] + (dx / dist) * stepLen, v.pos[1] + (dy / dist) * stepLen];
      }
      this.placeVacuum();
      v.raf = requestAnimationFrame(tick);
    };
    v.raf = requestAnimationFrame(tick);
  }
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : Number(n).toFixed(1);
}
