// Eclipse: the hero photo occults a hidden light while the tech stack orbits behind it.
// Hand-written WebGL2, no library. index.html imports the built copy (js/eclipse.js) once the page is idle.
// Build with `npm run build:js` (esbuild strips the DEV checks below).

const DEV = typeof __DEV__ !== "undefined" ? __DEV__ : true;

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const CAM = 1200; // camera distance; 1 world unit = 1 CSS px on the photo plane
const PERIOD = 24; // seconds per orbit; two slots give one emergence about every 12 s
const SLOTS = 2; // at most two bodies in view: restraint, not a logo cloud
const LEAD = 0.35; // seconds of rim light before a body breaks out ("Baily's bead")
const M0 = Math.PI / 3; // where slot 0 settles after the entrance (mean anomaly)

const STACK = [
  { name: "react", accent: "#61dafb" },
  { name: "next.js", accent: "#e9ebef" },
  { name: "typescript", accent: "#3178c6" },
  { name: "javascript", accent: "#f7df1e" },
  { name: "tailwind", accent: "#5fbfe9" },
  { name: "git", accent: "#f05032" },
];

/* ---------------------------------------------------------------- math */

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOut3 = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, t)));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const approach = (x, target, rate, dt) => target + (x - target) * Math.exp(-rate * dt);

function linear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
}

const m4 = () => new Float32Array(16);
function ident(o) {
  o.fill(0);
  o[0] = o[5] = o[10] = o[15] = 1;
  return o;
}
// o = a * b, column-major; o must not alias a or b
function mul(o, a, b) {
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      o[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}
function rotX(o, a) {
  ident(o);
  const c = Math.cos(a), s = Math.sin(a);
  o[5] = c; o[6] = s; o[9] = -s; o[10] = c;
  return o;
}
function rotY(o, a) {
  ident(o);
  const c = Math.cos(a), s = Math.sin(a);
  o[0] = c; o[2] = -s; o[8] = s; o[10] = c;
  return o;
}
function rotZ(o, a) {
  ident(o);
  const c = Math.cos(a), s = Math.sin(a);
  o[0] = c; o[1] = s; o[4] = -s; o[5] = c;
  return o;
}
function xform(m, x, y, z, out) {
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  return out;
}
function frustum(o, l, r, b, t, n, f) {
  o.fill(0);
  o[0] = (2 * n) / (r - l);
  o[5] = (2 * n) / (t - b);
  o[8] = (r + l) / (r - l);
  o[9] = (t + b) / (t - b);
  o[10] = -(f + n) / (f - n);
  o[11] = -1;
  o[14] = (-2 * f * n) / (f - n);
  return o;
}

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
function rotateAxis(v, k, a) {
  // Rodrigues
  const c = Math.cos(a), s = Math.sin(a), kv = cross3(k, v), d = dot3(k, v) * (1 - c);
  return [v[0] * c + kv[0] * s + k[0] * d, v[1] * c + kv[1] * s + k[1] * d, v[2] * c + kv[2] * s + k[2] * d];
}

// Kepler's equation, then the position in the orbit plane (periapsis on +x); returns the true anomaly
function keplerE(M, e) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 5; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}
function perifocal(M, p, e, out) {
  const E = keplerE(M, e);
  const a = p / (1 - e * e);
  out[0] = a * (Math.cos(E) - e);
  out[1] = -a * Math.sqrt(1 - e * e) * Math.sin(E);
  out[2] = 0;
  return Math.atan2(out[1], out[0]);
}

// orbit plane -> world: tilt the periapsis away from the viewer, aim the apoapsis, then parallax
const _a = m4(), _b = m4(), _c = m4();
function orbitMatrix(o, f, ax, ay, wob) {
  rotY(_a, f.incl);
  rotZ(_b, f.apo - Math.PI + wob);
  mul(_c, _b, _a);
  rotY(_a, ay);
  mul(_b, _a, _c);
  rotX(_a, ax);
  return mul(o, _a, _b);
}

/* ------------------------------------------------------------ geometry */

// interleaved: position 3, normal 3, legend uv 2, accent 1, glyph 1
class Geo {
  constructor() {
    this.v = [];
    this.i = [];
  }
  get count() {
    return this.v.length / 10;
  }
  push(p, n, u, v, m, g) {
    this.v.push(p[0], p[1], p[2], n[0], n[1], n[2], u, v, m, g);
  }
  lattice(cols, rows, base) {
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const a = base + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
        this.i.push(a, b, c, b, d, c);
      }
  }
  append(o, mat) {
    const base = this.count, p = [0, 0, 0];
    for (let k = 0; k < o.v.length; k += 10) {
      const v = o.v;
      if (mat) {
        xform(mat, v[k], v[k + 1], v[k + 2], p);
        const n = norm3([
          mat[0] * v[k + 3] + mat[4] * v[k + 4] + mat[8] * v[k + 5],
          mat[1] * v[k + 3] + mat[5] * v[k + 4] + mat[9] * v[k + 5],
          mat[2] * v[k + 3] + mat[6] * v[k + 4] + mat[10] * v[k + 5],
        ]);
        this.push(p, n, v[k + 6], v[k + 7], v[k + 8], v[k + 9]);
      } else this.v.push(...v.slice(k, k + 10));
    }
    for (const i of o.i) this.i.push(i + base);
  }
}

function tube(geo, curve, segs, rad, rsegs, closed, m, g, squashZ = 1) {
  const P = [], T = [];
  for (let s = 0; s <= segs; s++) P.push(curve(s / segs));
  for (let s = 0; s <= segs; s++) {
    const a = P[s === 0 ? (closed ? segs - 1 : 0) : s - 1];
    const b = P[s === segs ? (closed ? 1 : segs) : s + 1];
    T.push(norm3(sub3(b, a)));
  }
  let N = norm3(Math.abs(T[0][2]) < 0.9 ? cross3(T[0], [0, 0, 1]) : cross3(T[0], [1, 0, 0]));
  const base = geo.count;
  for (let s = 0; s <= segs; s++) {
    if (s > 0) {
      const ax = cross3(T[s - 1], T[s]), l = Math.hypot(ax[0], ax[1], ax[2]);
      if (l > 1e-6) N = rotateAxis(N, [ax[0] / l, ax[1] / l, ax[2] / l], Math.acos(clamp(dot3(T[s - 1], T[s]), -1, 1)));
    }
    const B = cross3(T[s], N), rr = typeof rad === "function" ? rad(s / segs) : rad;
    for (let r = 0; r <= rsegs; r++) {
      const a = (r / rsegs) * TAU, c = Math.cos(a), sn = Math.sin(a);
      const d = [N[0] * c + B[0] * sn, N[1] * c + B[1] * sn, N[2] * c + B[2] * sn];
      // squashZ flattens the section into an ellipse (normals follow the inverse scale)
      const n = norm3([d[0], d[1], d[2] / squashZ]);
      geo.push([P[s][0] + d[0] * rr, P[s][1] + d[1] * rr, P[s][2] + d[2] * rr * squashZ], n, -1, -1, m, g);
    }
  }
  geo.lattice(rsegs, segs, base);
}

function sphere(geo, c, rad, ws, hs, m, g) {
  const base = geo.count;
  for (let j = 0; j <= hs; j++)
    for (let i = 0; i <= ws; i++) {
      const th = (i / ws) * TAU, ph = (j / hs) * Math.PI;
      const n = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      geo.push([c[0] + n[0] * rad, c[1] + n[1] * rad, c[2] + n[2] * rad], n, -1, -1, m, g);
    }
  geo.lattice(ws, hs, base);
}

// rounded box: each face is a lattice whose rows bunch up on the rounded edges (uniform in angle)
function edgeCoords(H, rad, steps) {
  const o = [];
  for (let k = steps; k >= 1; k--) o.push(-(H - rad) - rad * Math.tan(((k / steps) * Math.PI) / 4));
  for (let j = -4; j <= 4; j++) o.push(((H - rad) * j) / 4);
  for (let k = 1; k <= steps; k++) o.push(H - rad + rad * Math.tan(((k / steps) * Math.PI) / 4));
  return o;
}
function roundedBox(geo, H, rad, steps, attr, dish = 0) {
  for (let ax = 0; ax < 3; ax++)
    for (const sg of [1, -1]) {
      const a1 = (ax + 1) % 3, a2 = (ax + 2) % 3;
      const c1 = edgeCoords(H[a1], rad, steps), c2 = edgeCoords(H[a2], rad, steps);
      const base = geo.count;
      for (let j = 0; j < c2.length; j++)
        for (let i = 0; i < c1.length; i++) {
          const p = [0, 0, 0];
          p[ax] = sg * H[ax];
          p[a1] = c1[i];
          p[a2] = c2[j];
          const inner = p.map((x, k) => clamp(x, -(H[k] - rad), H[k] - rad));
          let n = norm3(sub3(p, inner));
          const q = [inner[0] + n[0] * rad, inner[1] + n[1] * rad, inner[2] + n[2] * rad];
          if (dish && ax === 2 && sg === 1) {
            // shallow keycap dish on the front face
            const fx = H[0] - rad, fy = H[1] - rad, s = (q[0] * q[0]) / (fx * fx) + (q[1] * q[1]) / (fy * fy);
            if (s < 1) {
              q[2] -= dish * (1 - s);
              n = norm3([n[0] - (2 * dish * q[0]) / (fx * fx), n[1] - (2 * dish * q[1]) / (fy * fy), n[2]]);
            }
          }
          const [u, v, m, g] = attr(q, n);
          geo.push(q, n, u, v, m, g);
        }
      geo.lattice(c1.length - 1, c2.length - 1, base);
    }
}

// surface of revolution around z; profile segments [r0, z0, r1, z1, accent, glyph], flat-shaded per segment
function lathe(geo, prof, segs) {
  for (const [r0, z0, r1, z1, m, g] of prof) {
    const n = norm3([-(z1 - z0), 0, r1 - r0]);
    const base = geo.count;
    for (let j = 0; j <= 1; j++)
      for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * TAU, c = Math.cos(a), sn = Math.sin(a), r = j ? r1 : r0;
        geo.push([r * c, r * sn, j ? z1 : z0], [n[0] * c, n[0] * sn, n[2]], -1, -1, m, g);
      }
    geo.lattice(segs, 1, base);
  }
}

function box(geo, c, h, rz, m, g) {
  const part = new Geo();
  for (let ax = 0; ax < 3; ax++)
    for (const sg of [1, -1]) {
      const a1 = (ax + 1) % 3, a2 = (ax + 2) % 3, n = [0, 0, 0];
      n[ax] = sg;
      const base = part.count;
      for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const p = [0, 0, 0];
        p[ax] = sg * h[ax];
        p[a1] = u * h[a1];
        p[a2] = v * h[a2];
        part.push(p, n, -1, -1, m, g);
      }
      part.lattice(1, 1, base);
    }
  const t = rotZ(m4(), rz);
  t[12] = c[0]; t[13] = c[1]; t[14] = c[2];
  geo.append(part, t);
}

// flat ribbon swept along a planar path, rectangular section (top, bottom, two edges, end caps)
function ribbon(geo, path, width, th, segs, m, g) {
  const P = [], N = [], W = [];
  for (let s = 0; s <= segs; s++) P.push(path(s / segs));
  for (let s = 0; s <= segs; s++) {
    const a = P[Math.max(0, s - 1)], b = P[Math.min(segs, s + 1)];
    const t = norm3([b[0] - a[0], b[1] - a[1], 0]);
    N.push([-t[1], t[0]]);
    W.push(width(s / segs) / 2);
  }
  const h = th / 2;
  const corner = (s, side, top) => [P[s][0] + N[s][0] * W[s] * side, P[s][1] + N[s][1] * W[s] * side, top * h];
  const strip = (fa, fb, nrm) => {
    const base = geo.count;
    for (let s = 0; s <= segs; s++) {
      geo.push(fa(s), nrm(s), -1, -1, m, g);
      geo.push(fb(s), nrm(s), -1, -1, m, g);
    }
    geo.lattice(1, segs, base);
  };
  strip((s) => corner(s, 1, 1), (s) => corner(s, -1, 1), () => [0, 0, 1]);
  strip((s) => corner(s, -1, -1), (s) => corner(s, 1, -1), () => [0, 0, -1]);
  strip((s) => corner(s, 1, -1), (s) => corner(s, 1, 1), (s) => [N[s][0], N[s][1], 0]);
  strip((s) => corner(s, -1, 1), (s) => corner(s, -1, -1), (s) => [-N[s][0], -N[s][1], 0]);
  for (const [s, dir] of [[0, -1], [segs, 1]]) {
    const t = norm3([(P[Math.min(segs, s + 1)][0] - P[Math.max(0, s - 1)][0]) * dir, (P[Math.min(segs, s + 1)][1] - P[Math.max(0, s - 1)][1]) * dir, 0]);
    const base = geo.count;
    for (const [side, top] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) geo.push(corner(s, side, top), t, -1, -1, m, g);
    geo.lattice(1, 1, base);
  }
}

// the six stack bodies, each built to fit a unit-diameter sphere
function buildStack() {
  const shapes = [];

  // react: three thin elliptical orbits around a nucleus
  let g = new Geo();
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a);
    tube(g, (t) => {
      const x = 0.47 * Math.cos(t * TAU), y = 0.18 * Math.sin(t * TAU);
      return [x * ca - y * sa, x * sa + y * ca, 0];
    }, 72, 0.04, 8, true, 0.75, 0);
  }
  sphere(g, [0, 0, 0], 0.105, 16, 12, 1, 0);
  shapes.push(g);

  // next.js: chamfered coin with a raised N
  g = new Geo();
  const R = 0.44, hz = 0.06, ch = 0.028;
  lathe(g, [
    [0, hz, R - ch, hz, 0, 0],
    [R - ch, hz, R, hz - ch, 1, 0],
    [R, hz - ch, R, -(hz - ch), 1, 0],
    [R, -(hz - ch), R - ch, -hz, 1, 0],
    [R - ch, -hz, 0, -hz, 0, 0],
  ], 56);
  const zt = hz + 0.018;
  box(g, [-0.15, 0, zt], [0.036, 0.19, 0.02], 0, 0, 1);
  box(g, [0.15, 0.06, zt], [0.036, 0.13, 0.02], 0, 0, 1);
  box(g, [0, 0, zt], [0.036, Math.hypot(0.3, 0.38) / 2, 0.02], Math.atan2(0.3, 0.38), 0, 1);
  shapes.push(g);

  // typescript / javascript: dished keycaps, legend sampled from a canvas mask
  for (const cell of [0, 1]) {
    g = new Geo();
    const H = [0.36, 0.36, 0.2];
    roundedBox(g, H, 0.1, 5, (q, n) => [
      clamp(q[0] / (2 * H[0]) + 0.5, 0, 1) * 0.5 + cell * 0.5,
      clamp(0.5 - q[1] / (2 * H[1]), 0, 1),
      smooth(0.55, 0.92, n[2]),
      0,
    ], 0.028);
    shapes.push(g);
  }

  // tailwind: two tapered waves with a rounded, slightly flattened section so they catch the light
  g = new Geo();
  for (const [ox, oy] of [[-0.09, 0.115], [0.09, -0.115]])
    tube(g, (t) => [-0.36 + 0.72 * t + ox, 0.075 * Math.sin(TAU * t) + oy, 0], 40,
      (t) => 0.016 + 0.062 * Math.pow(Math.sin(Math.PI * t), 0.8), 10, false, 1, 0, 0.55);
  shapes.push(g);

  // git: diamond plaque with the branch glyph raised on it
  g = new Geo();
  const plaque = new Geo();
  roundedBox(plaque, [0.3, 0.3, 0.055], 0.05, 4, () => [-1, -1, 1, 0]);
  g.append(plaque, rotZ(m4(), Math.PI / 4));
  const z = 0.085, nodes = [[-0.07, -0.17, z], [-0.07, 0.15, z], [0.15, 0.03, z]];
  for (const p of nodes) sphere(g, p, 0.058, 12, 8, 0, 1);
  const rod = (a, b) => tube(g, (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], 1, 0.03, 8, false, 0, 1);
  rod(nodes[0], nodes[1]);
  rod([-0.07, -0.05, z], nodes[2]);
  shapes.push(g);

  // one interleaved buffer for all six
  const all = new Geo(), ranges = [];
  for (const s of shapes) {
    const start = all.i.length;
    all.append(s);
    ranges.push({ start, count: all.i.length - start });
  }
  return { verts: new Float32Array(all.v), index: new Uint16Array(all.i), ranges };
}

function legendCanvas() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const x = c.getContext("2d");
  x.fillStyle = "#000";
  x.fillRect(0, 0, 256, 128);
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = '500 62px "Geist Mono", ui-monospace, monospace';
  x.fillText("ts", 64, 66);
  x.fillText("js", 192, 66);
  return c;
}

/* ------------------------------------------------------------- shaders */

const BODY_VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec2 aUv;
layout(location=3) in vec2 aMG;
uniform mat4 uPV, uModel;
uniform mat3 uRot;
out vec3 vPos; out vec3 vNrm; out vec2 vUv; out vec2 vMG;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vPos = wp.xyz;
  vNrm = uRot * aNrm;
  vUv = aUv;
  vMG = aMG;
  gl_Position = uPV * wp;
}`;

const BODY_FS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNrm; in vec2 vUv; in vec2 vMG;
uniform vec3 uCam, uBase, uGlyph, uAccent, uRimColor;
uniform vec2 uSunDir;
uniform float uAccentAmt, uEmissive, uRim, uExposure;
uniform sampler2D uLegend;
out vec4 frag;
float panel(vec3 R, vec3 d, vec2 h, float soft) {
  float z = dot(R, d);
  if (z <= 0.0) return 0.0;
  vec3 ux = normalize(cross(vec3(0.0, 1.0, 0.0), d));
  vec3 uy = cross(d, ux);
  vec2 q = abs(vec2(dot(R, ux), dot(R, uy)) / z);
  vec2 e = smoothstep(h + soft, h - soft, q);
  return e.x * e.y;
}
vec3 studio(vec3 R, float rough) {
  float soft = 0.05 + rough * 0.9;
  float key = panel(R, normalize(vec3(0.45, 0.62, 0.64)), vec2(0.55, 0.3), soft);
  float strip = panel(R, normalize(vec3(-0.86, 0.12, 0.5)), vec2(0.07, 0.9), soft * 0.7);
  float sky = mix(0.012, 0.08, smoothstep(-0.4, 0.8, R.y));
  return vec3(1.0, 0.97, 0.93) * key * 3.4 + vec3(0.62, 0.7, 1.0) * strip * 1.4 + vec3(sky);
}
vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 N = normalize(vNrm);
  vec3 V = normalize(uCam - vPos);
  float NdV = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = reflect(-V, N);
  float legend = vUv.x >= 0.0 ? texture(uLegend, vUv).r : 1.0;
  float acc = clamp(vMG.x * legend, 0.0, 1.0);
  vec3 albedo = mix(mix(uBase, uAccent, acc * uAccentAmt), uGlyph, vMG.y);
  float F = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
  vec3 key = normalize(vec3(0.4, 0.6, 0.7));
  vec3 col = albedo * (0.3 + 0.95 * max(dot(N, key), 0.0)) * (1.0 - F);
  col += studio(R, 0.34) * F + studio(R, 0.07) * F * 0.85;
  vec2 nxy = N.xy + vec2(1e-4);
  col += uRimColor * pow(1.0 - NdV, 3.0) * clamp(dot(normalize(nxy), uSunDir), 0.0, 1.0) * uRim;
  col += uAccent * acc * uEmissive;
  col = aces(col * uExposure);
  frag = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

const FLAT_VS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uMVP;
void main() { gl_Position = uMVP * vec4(aPos, 1.0); }`;

const FLAT_FS = `#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 frag;
void main() { frag = uColor; }`;

const GLOW_VS = `#version 300 es
layout(location=0) in vec2 aP;
uniform mat4 uPV;
out vec2 vP;
void main() { vP = aP; gl_Position = uPV * vec4(aP, 0.5, 1.0); }`;

const GLOW_FS = `#version 300 es
precision highp float;
in vec2 vP;
uniform float uR, uSun, uStarLen, uStarAmp, uCorona, uArc, uMaskHalf, uGuard, uTime, uLight, uBloom, uPulse;
uniform vec2 uGrow;
uniform vec4 uRect; // stage edges in plane units: x0, x1, y0, y1
uniform vec4 uBeads[4];
out vec4 frag;
const float PI = 3.14159265;
float adiff(float a, float b) { return mod(a - b + PI, 2.0 * PI) - PI; }
float star(vec2 q, float len) {
  float s = exp(-dot(q, q) / 9.7) * 1.4;
  float k = 3.0 / max(len, 1.0);
  vec2 ax0 = vec2(0.0, 1.0), ax1 = vec2(0.8660254, 0.5), ax2 = vec2(-0.8660254, 0.5);
  s += 0.65 * exp(-abs(dot(q, vec2(-ax0.y, ax0.x))) * 3.2) * exp(-abs(dot(q, ax0)) * k);
  s += 0.65 * exp(-abs(dot(q, vec2(-ax1.y, ax1.x))) * 3.2) * exp(-abs(dot(q, ax1)) * k);
  s += 0.65 * exp(-abs(dot(q, vec2(-ax2.y, ax2.x))) * 3.2) * exp(-abs(dot(q, ax2)) * k);
  s += 0.13 * exp(-abs(q.y) * 3.2) * exp(-abs(q.x) * k * 1.6);
  return s;
}
void main() {
  float d = length(vP);
  float th = atan(vP.y, vP.x);
  float o = d - uR;
  float mask = 1.0 - smoothstep(uMaskHalf - 0.17, uMaskHalf + 0.17, abs(th));
  float grow = 1.0 - smoothstep(uGrow.y - 0.2, uGrow.y + 0.02, abs(adiff(th, uGrow.x)));
  float sw = (cos(th - uSun) + 1.0) * 0.5;
  float sunW = sw * sw;
  float n = 0.6 + 0.4 * (0.5 * sin(3.0 * th + uTime * 0.3) + 0.3 * sin(7.0 * th - uTime * 0.21 + 1.3) + 0.2 * sin(13.0 * th + uTime * 0.47 + 2.1));
  float cw = 18.0 + 12.0 * uBloom;
  float corona = o > 0.0 ? exp(-o / (6.0 + 4.0 * uBloom)) * (1.0 - smoothstep(cw - 6.0, cw, o)) : 0.0;
  corona *= n * (0.3 + 0.7 * sunW) * 0.2 * uCorona * mask * grow;
  float band = smoothstep(-2.2, -1.2, o) * (1.0 - smoothstep(-0.2, 0.8, o));
  float chromo = 0.9 * pow(max(cos(th - uSun), 0.0), 16.0) + uArc * mask;
  float beadArc = 0.0, beadStar = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 b = uBeads[i];
    if (b.y < 0.002) continue;
    float da = adiff(th, b.x);
    float bm = 1.0 - smoothstep(uMaskHalf - 0.17, uMaskHalf + 0.17, abs(adiff(b.x, 0.0)));
    beadArc += b.y * bm * exp(-da * da / 0.0123);
    beadStar += b.y * bm * star(vP - uR * vec2(cos(b.x), sin(b.x)), 10.0 * b.z);
  }
  chromo = (chromo + beadArc * 1.3) * band * grow;
  float inner = smoothstep(-14.0, 0.0, o); // spikes fade out before they cross the photo
  beadStar *= inner;
  float st = star(vP - uR * vec2(cos(uSun), sin(uSun)), uStarLen) * uStarAmp * inner;
  // totality: one ring of light ripples out from the rim and fades
  float pulse = 0.0;
  if (uPulse >= 0.0 && uPulse < 1.0) {
    float pr = uR + 62.0 * (1.0 - pow(1.0 - uPulse, 3.0));
    pulse = exp(-(d - pr) * (d - pr) / 2.6) * pow(1.0 - uPulse, 2.0) * mask * 0.9;
  }
  float guard = 1.0;
  if (uGuard > 0.5) guard = max(step(abs(vP.y), 0.55 * uR), smoothstep(-uR - 8.0, -uR + 4.0, vP.x));
  // nothing may end in a hard line: fade toward the stage edges and the annulus bounds
  float edge = min(min(vP.x - uRect.x, uRect.y - vP.x), min(vP.y - uRect.z, uRect.w - vP.y));
  guard *= smoothstep(0.0, 12.0, edge) * smoothstep(uR - 46.0, uR - 30.0, d) * (1.0 - smoothstep(uR + 54.0, uR + 70.0, d));
  if (uLight < 0.5) {
    vec3 L = (corona * mix(vec3(0.95, 0.96, 1.0), vec3(0.79, 0.82, 1.0), clamp(o / cw, 0.0, 1.0)) + vec3(chromo + st + beadStar) + pulse * vec3(0.86, 0.9, 1.0)) * guard;
    vec3 c = 1.0 - exp(-L);
    frag = vec4(c, max(c.r, max(c.g, c.b)));
  } else {
    float I = (corona * 0.32 + chromo * 0.5 + (st + beadStar) * 0.85 + pulse * 0.6) * guard;
    float a = 1.0 - exp(-I);
    frag = vec4(vec3(0.043, 0.051, 0.063) * a, a);
  }
}`;

const PTS_VS = `#version 300 es
layout(location=0) in vec4 aA;
layout(location=1) in vec4 aB;
uniform mat4 uPV, uOrbit;
uniform float uTau, uPeriod, uDpr, uDust;
uniform vec3 uSun;
uniform vec4 uRect;
out float vA; out float vKind; out float vSize;
float kep(float M, float e) {
  float E = M + e * sin(M);
  for (int i = 0; i < 4; i++) E -= (E - e * sin(E) - M) / (1.0 - e * cos(E));
  return E;
}
void main() {
  vKind = aB.w;
  vec3 wp;
  float px, a;
  if (aB.w < 0.5) {
    float p = aA.x, e = aA.y;
    float M = 6.2831853 * fract(uTau / (uPeriod * aA.w) + aA.z);
    float E = kep(M, e);
    float sa = p / (1.0 - e * e);
    vec2 pf = vec2(sa * (cos(E) - e), -sa * sqrt(1.0 - e * e) * sin(E));
    wp = (uOrbit * vec4(pf, (fract(aB.y * 13.7) - 0.5) * 8.0, 1.0)).xyz;
    vec3 L = normalize(wp - uSun);
    float hg = pow(0.28 / sqrt(1.5184 - 1.44 * L.z), 3.0);
    float tw = 0.55 + 0.45 * sin(uTau * aB.z + aB.y * 40.0);
    a = (0.03 + 0.9 * hg * tw) * uDust;
    px = aB.x;
  } else {
    wp = aA.xyz;
    px = aA.w;
    a = aB.x;
  }
  gl_Position = uPV * vec4(wp, 1.0);
  vec2 sp = wp.xy * (${CAM.toFixed(1)} / (${CAM.toFixed(1)} - wp.z));
  a *= smoothstep(0.0, 10.0, min(min(sp.x - uRect.x, uRect.y - sp.x), min(sp.y - uRect.z, uRect.w - sp.y)));
  float s = px * uDpr * (${CAM.toFixed(1)} / (${CAM.toFixed(1)} - wp.z));
  gl_PointSize = max(2.0, s);
  vSize = gl_PointSize;
  vA = a * min(1.0, s * s / 4.0);
}`;

const PTS_FS = `#version 300 es
precision highp float;
in float vA; in float vKind; in float vSize;
uniform float uLight, uDpr;
out vec4 frag;
void main() {
  vec2 q = (gl_PointCoord - 0.5) * vSize;
  float a;
  if (vKind < 0.5) {
    a = exp(-dot(q, q) / (vSize * vSize * 0.08)) * vA;
  } else {
    float w = 3.2 / uDpr, k = 6.0 / vSize;
    float s = exp(-dot(q, q) / (2.0 * uDpr * uDpr)) * 1.2;
    s += 0.7 * exp(-abs(q.x) * w) * exp(-abs(q.y) * k);
    s += 0.7 * exp(-abs(dot(q, vec2(0.5, -0.8660254))) * w) * exp(-abs(dot(q, vec2(0.8660254, 0.5))) * k);
    s += 0.7 * exp(-abs(dot(q, vec2(0.5, 0.8660254))) * w) * exp(-abs(dot(q, vec2(-0.8660254, 0.5))) * k);
    a = clamp(s, 0.0, 1.0) * vA;
  }
  if (uLight < 0.5) frag = vec4(vec3(0.95, 0.97, 1.0) * a, a);
  else frag = vec4(vec3(0.043, 0.051, 0.063) * a * 0.8, a * 0.8);
}`;

/* ---------------------------------------------------------- orbit fit */

// Pick an orbit for the measured layout and prove it: nothing outside the envelope, anything over the
// photo either fully behind it or (phones) in front only below the face, and the periapsis hidden.
// motion the runtime may add on top of the orbit (pointer parallax + scroll pitch, parallax yaw, apsidal wobble)
const TILT_X = 5.5 * DEG, TILT_Y = 4 * DEG, WOBBLE = 8 * DEG;

// every extreme of that motion the fitter must prove; tight layouts trade amplitude for room
function variantsFor(side, amp) {
  const v = [[0, 0, 0]];
  for (const sx of [-1, 0, 1])
    for (const sy of [-1, 0, 1])
      for (const sw of side ? [-1, 0, 1] : [0]) if (sx || sy || sw) v.push([sx * TILT_X * amp, sy * TILT_Y * amp, sw * WOBBLE * amp]);
  return v;
}

function fitOrbit(Ly) {
  const { r, side } = Ly;
  const sizes = side ? [22, 20, 18, 16, 14] : r > 110 ? [20, 18, 16] : [18, 16];
  // narrow desktops (24px right of the photo) need the apoapsis aimed right with a near-vertical node line
  const apos = side ? [-40, -30, -50, -20, -60, -10, -70, 0, -80, 10, -90] : [-90];
  const eccs = side ? [0.3, 0.24, 0.36, 0.18, 0.1] : [0.04, 0];
  const incls = side ? [34, 30, 38, 42, 26] : [46, 42, 50, 38, 54];
  // desktop: first insist that bodies break out on the right half (by the star, away from the text)
  for (const emerge of side ? [100 * DEG, Math.PI] : [Math.PI])
    for (const s of sizes)
      for (const amp of [1, 0.5, 0.25]) {
        const variants = variantsFor(side, amp);
        for (const apo of apos)
          for (const e of eccs)
            for (const i of incls)
              for (const dp of [0, 8, 16, 28]) {
                const c = { s, apo: apo * DEG, e, incl: i * DEG, dp, emerge };
                const f = testOrbit(c, Ly, variants);
                if (f) return Object.assign(f, { amp, c });
              }
      }
  return null;
}

// phones: bodies may pass in front of the shirt, never across the face (centre column, above 0.5r below centre)
const overFace = (sx, sy, rb, r) => Math.abs(sx) - rb < 0.62 * r && sy + rb > -0.5 * r;

let failWhy = "";
function testOrbit(c, Ly, variants) {
  const { r, side, env } = Ly;
  const R = r + 1, bR = 0.5 * c.s * 1.1 * 1.16;
  const f = { p: R + bR * 1.12 + 4 + c.dp, e: c.e, incl: c.incl, apo: c.apo, s: c.s };
  const O = m4(), w = [0, 0, 0];
  const b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
  for (const [ax, ay, wob] of variants) {
    orbitMatrix(O, f, ax, ay, wob);
    for (let k = 0; k < 120; k++) {
      const nu = (k / 120) * TAU, rr = f.p / (1 + f.e * Math.cos(nu));
      xform(O, rr * Math.cos(nu), rr * Math.sin(nu), 0, w);
      const kk = CAM / (CAM - w[2]), sx = w[0] * kk, sy = w[1] * kk, rb = bR * kk, dist = Math.hypot(sx, sy);
      if (k === 0 && !(w[2] < -bR && dist + rb < R - 2)) return ((failWhy = "periapsis visible"), null);
      if (dist < R + rb) {
        if (w[2] < -(bR + 2)) {
          if (dist + rb < R) continue; // fully hidden
        } else if (side || w[2] <= bR + 2 || overFace(sx, sy, rb, r)) return ((failWhy = side ? "front overlap" : "slice/face"), null);
      }
      if (sx - rb < env.xMin || sx + rb > env.xMax || sy + rb > env.yMax || sy - rb < env.yMin)
        return ((failWhy = sx - rb < env.xMin ? "left" : sx + rb > env.xMax ? "right" : sy + rb > env.yMax ? "top" : "bottom"), null);
      b.x0 = Math.min(b.x0, sx - rb);
      b.x1 = Math.max(b.x1, sx + rb);
      b.y0 = Math.min(b.y0, sy - rb);
      b.y1 = Math.max(b.y1, sy + rb);
    }
  }
  if (c.emerge < Math.PI) {
    orbitMatrix(O, f, 0, 0, 0);
    for (let k = 1; k < 120; k++) {
      const nu = (k / 120) * TAU, rr = f.p / (1 + f.e * Math.cos(nu));
      xform(O, rr * Math.cos(nu), -rr * Math.sin(nu), 0, w);
      const kk = CAM / (CAM - w[2]), sx = w[0] * kk, sy = w[1] * kk;
      if (!(w[2] < 0 && Math.hypot(sx, sy) + bR * kk < R)) {
        if (Math.abs(Math.atan2(sy, sx)) > c.emerge) return ((failWhy = "emerges on the text side"), null);
        break;
      }
    }
  }
  f.bounds = b;
  return f;
}

/* --------------------------------------------------------------- mount */

export function mount(wrap) {
  if (!wrap || wrap.dataset.eclipseOn) return;
  wrap.dataset.eclipseOn = "1";

  const photo = wrap.firstElementChild;
  const row = wrap.parentElement;
  const section = wrap.closest("section") || row;
  const textBlock = [...row.children].find((el) => el !== wrap);
  const root = document.documentElement;
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  // dev builds can force the mouse path for headless testing (headless Chrome reports hover: none)
  const touchFirst = matchMedia("(hover: none)").matches && !(DEV && location.search.includes("eclipse-hover"));

  const canvas = document.createElement("canvas");
  canvas.className = "eclipse-stage";
  canvas.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "eclipse-label";
  label.setAttribute("aria-hidden", "true");

  let Ly = null, fit = null, rect = null, dpr = 1, quality = 0;
  let gl = null, G = null, ready = false, lost = 0, dead = false;
  let visible = false, running = false, raf = 0, last = 0, acc = 0;
  let reduced = mqReduce.matches;
  let light = root.classList.contains("light");

  // simulation state
  const S = {
    t: 0, tau: 0, ts: 1, ent: 0,
    sun: 40 * DEG, sunV: 0, starLen: 0, starAmp: 1,
    total: 0, totalHold: 0, totalRose: -99, sweepT: -1, waveT: -99, pulseT: -1,
    ax: 0, ay: 0, scroll: 0, scrollY: scrollY,
    capture: -1, captureUntil: 0, present: 0, presentAt: 14,
    ptr: { on: false, x: 0, y: 0, last: -99 },
    nextTwinkle: 4,
  };
  const slots = Array.from({ length: SLOTS }, (_, k) => ({
    k, logo: k, hidden: true, beadFired: false, swap: false, glint: 9,
    w: [0, 0, 0], sx: 0, sy: 0, rb: 0, nu: 0, cap: 0, wave: 0,
  }));
  let deal = SLOTS;
  const beads = [0, 1, 2, 3].map(() => ({ a: 0, age: 9, scale: 1 }));
  const glints = [0, 1, 2, 3].map(() => ({ w: [0, 0, 0], size: 0, age: 9, life: 0.5, amp: 0 }));
  let labelSlot = -1, labelText = "", labelW = 0, labelH = 11;

  const O = m4(), PV = m4(), P = m4(), V = m4(), Mdl = m4(), Rt = m4(), Tmp = m4(), Tmp2 = m4();
  const rot3 = new Float32Array(9);
  ident(V);
  V[14] = -CAM;

  /* ------------------------------------------------------ layout */

  function measure() {
    const pr = photo.getBoundingClientRect();
    const sr = section.getBoundingClientRect();
    const tr = textBlock ? textBlock.getBoundingClientRect() : null;
    const cw = root.clientWidth;
    const r = Math.round(pr.width / 2);
    const side = getComputedStyle(row).flexDirection.startsWith("row");
    let env;
    if (side) {
      const gap = tr ? pr.left - tr.right : 64;
      env = {
        xMin: -(r + clamp(gap - 12, 0, 8)),
        xMax: r + cw - pr.right - 6,
        yMax: r + clamp(pr.top - sr.top - 8, 0, 90),
        yMin: -(r + clamp(sr.bottom - pr.bottom - 12, 0, 200)),
      };
    } else {
      const below = tr ? tr.top - pr.bottom : 40;
      env = {
        xMin: -(r + pr.left - 6),
        xMax: r + cw - pr.right - 6,
        yMax: r + clamp(pr.top - sr.top - 6, 0, 90),
        yMin: -(r + clamp(below - 12, 0, 120)),
      };
    }
    return { r, side, cw, env };
  }

  function stageRect() {
    const { r, env } = Ly;
    const g = r + 70;
    let x0 = -g, x1 = g, y0 = -g, y1 = g;
    if (fit) {
      x0 = Math.min(x0, fit.bounds.x0 - 4);
      x1 = Math.max(x1, fit.bounds.x1 + 4);
      y0 = Math.min(y0, fit.bounds.y0 - 4);
      y1 = Math.max(y1, fit.bounds.y1 + 4);
    }
    x0 = Math.floor(Math.max(x0, env.xMin));
    x1 = Math.ceil(Math.min(x1, env.xMax));
    y0 = Math.floor(Math.max(y0, env.yMin));
    y1 = Math.ceil(Math.min(y1, env.yMax));
    return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
  }

  const sameEnv = (a, b) =>
    a && b && a.r === b.r && a.side === b.side && ["xMin", "xMax", "yMax", "yMin"].every((k) => Math.abs(a.env[k] - b.env[k]) < 1);
  let noFitFor = null, refitTimer = 0, refitting = false;

  function search() {
    const prev = fit;
    fit = fitOrbit(Ly);
    noFitFor = fit ? null : Ly;
    if (DEV) console.info("[eclipse] fit", fit ? { p: fit.p.toFixed(1), e: fit.e, i: Math.round(fit.incl / DEG), apo: Math.round(fit.apo / DEG), s: fit.s, amp: fit.amp } : "eclipse only", Ly);
    return prev !== fit;
  }

  function refit(now) {
    if (now) return void search();
    // while the window is being resized, keep the current orbit if it still fits (one test, no jump);
    // if it no longer fits, its bodies stay out of sight. Once the layout settles, search for the best
    // orbit and fade over to it if it changed.
    let keep = false;
    if (fit) {
      const again = testOrbit(fit.c, Ly, variantsFor(Ly.side, fit.amp));
      if (again) {
        fit = Object.assign(again, { amp: fit.amp, c: fit.c });
        keep = true;
      }
    }
    refitting = !keep;
    if (!keep && sameEnv(noFitFor, Ly)) return void (refitting = false);
    clearTimeout(refitTimer);
    refitTimer = setTimeout(() => {
      const before = fit && JSON.stringify(fit.c);
      refitting = false;
      search();
      sizeStage();
      if (G) rebuildDynamic();
      if (!keep || (fit && JSON.stringify(fit.c)) !== before) fadeSwap();
      else render();
    }, 160);
  }

  function layout(now) {
    const next = measure();
    const changed = !sameEnv(next, Ly);
    Ly = next;
    if (changed) refit(now);
    sizeStage();
    if (G) rebuildDynamic();
  }

  function sizeStage() {
    rect = stageRect();
    const { r } = Ly;
    dpr = Math.min(devicePixelRatio || 1, Ly.side ? 2 : 1.75) * (quality >= 1 ? 0.7 : 1);
    dpr = Math.max(1, dpr);
    Object.assign(canvas.style, {
      left: `${r + rect.x0}px`,
      top: `${r - rect.y1}px`,
      width: `${rect.w}px`,
      height: `${rect.h}px`,
    });
    const bw = Math.round(rect.w * dpr), bh = Math.round(rect.h * dpr);
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    const n = CAM - 500, f = CAM + 500, s = n / CAM;
    frustum(P, rect.x0 * s, rect.x1 * s, rect.y0 * s, rect.y1 * s, n, f);
    mul(PV, P, V);
  }

  /* ----------------------------------------------------------- GL */

  function compile(vs, fs) {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      gl.attachShader(p, sh);
    }
    gl.linkProgram(p);
    return p;
  }
  function uniforms(p, names) {
    const u = {};
    for (const n of names) u[n] = gl.getUniformLocation(p, n);
    return u;
  }

  let stackData = null, dustData = null;

  async function initGL() {
    const ctx = canvas.getContext("webgl2", {
      alpha: true, premultipliedAlpha: true, antialias: (devicePixelRatio || 1) < 1.5,
      depth: true, stencil: false, powerPreference: "low-power",
      // software GL is refused in production; dev builds can allow it for headless testing
      failIfMajorPerformanceCaveat: !(DEV && location.search.includes("eclipse-soft")),
    });
    if (!ctx) return false;
    gl = ctx;
    const ext = gl.getExtension("KHR_parallel_shader_compile");
    const progs = {
      body: compile(BODY_VS, BODY_FS),
      flat: compile(FLAT_VS, FLAT_FS),
      glow: compile(GLOW_VS, GLOW_FS),
      pts: compile(PTS_VS, PTS_FS),
    };
    // let the driver link in the background instead of blocking a frame
    await new Promise((res) => setTimeout(res, 0));
    if (gl.isContextLost()) return false;
    if (ext) {
      for (let i = 0; i < 120 && !Object.values(progs).every((p) => gl.getProgramParameter(p, ext.COMPLETION_STATUS_KHR)); i++)
        await new Promise((res) => requestAnimationFrame(res));
    }
    for (const [name, p] of Object.entries(progs)) {
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        if (DEV) {
          for (const sh of gl.getAttachedShaders(p)) console.warn(gl.getShaderInfoLog(sh));
          console.warn("[eclipse] link failed:", name, gl.getProgramInfoLog(p));
        }
        return false;
      }
    }
    if (gl.isContextLost()) return false;

    stackData = stackData || buildStack();
    G = { progs };
    G.u = {
      body: uniforms(progs.body, ["uPV", "uModel", "uRot", "uCam", "uBase", "uGlyph", "uAccent", "uRimColor", "uSunDir", "uAccentAmt", "uEmissive", "uRim", "uExposure", "uLegend"]),
      flat: uniforms(progs.flat, ["uMVP", "uColor"]),
      glow: uniforms(progs.glow, ["uPV", "uR", "uSun", "uStarLen", "uStarAmp", "uCorona", "uArc", "uMaskHalf", "uGuard", "uTime", "uLight", "uGrow", "uBeads[0]", "uBloom", "uPulse", "uRect"]),
      pts: uniforms(progs.pts, ["uPV", "uOrbit", "uTau", "uPeriod", "uDpr", "uDust", "uSun", "uLight", "uRect"]),
    };

    // bodies
    G.bodyVao = gl.createVertexArray();
    gl.bindVertexArray(G.bodyVao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, stackData.verts, gl.STATIC_DRAW);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, stackData.index, gl.STATIC_DRAW);
    for (const [loc, size, off] of [[0, 3, 0], [1, 3, 12], [2, 2, 24], [3, 2, 32]]) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 40, off);
    }

    // occluder disc, orbit trace, corona annulus: rebuilt on layout changes
    for (const k of ["disc", "trace", "ring"]) {
      G[k + "Vao"] = gl.createVertexArray();
      gl.bindVertexArray(G[k + "Vao"]);
      G[k + "Buf"] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, G[k + "Buf"]);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, k === "ring" ? 2 : 3, gl.FLOAT, false, 0, 0);
    }

    // dust (static) and glints (rewritten every frame)
    G.dustVao = gl.createVertexArray();
    gl.bindVertexArray(G.dustVao);
    G.dustBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, G.dustBuf);
    for (const [loc, off] of [[0, 0], [1, 16]]) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 32, off);
    }
    G.glintVao = gl.createVertexArray();
    gl.bindVertexArray(G.glintVao);
    G.glintBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, G.glintBuf);
    G.glintData = new Float32Array(4 * 8);
    gl.bufferData(gl.ARRAY_BUFFER, G.glintData, gl.DYNAMIC_DRAW);
    for (const [loc, off] of [[0, 0], [1, 16]]) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 32, off);
    }
    gl.bindVertexArray(null);

    // legend mask (ts | js); redrawn once the font is ready
    G.legend = gl.createTexture();
    uploadLegend();
    G.maxPoint = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 64;
    rebuildDynamic();
    return true;
  }

  function uploadLegend() {
    gl.bindTexture(gl.TEXTURE_2D, G.legend);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, legendCanvas());
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function rebuildDynamic() {
    const R = Ly.r + 1;
    const disc = [];
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * TAU, b = ((k + 1) / 96) * TAU;
      disc.push(0, 0, 0, R * Math.cos(a), R * Math.sin(a), 0, R * Math.cos(b), R * Math.sin(b), 0);
    }
    G.discCount = disc.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, G.discBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(disc), gl.STATIC_DRAW);

    const ring = [], r0 = Math.max(0, R - 46), r1 = R + 70;
    for (let k = 0; k <= 128; k++) {
      const a = (k / 128) * TAU, c = Math.cos(a), s = Math.sin(a);
      ring.push(r0 * c, r0 * s, r1 * c, r1 * s);
    }
    G.ringCount = ring.length / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, G.ringBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ring), gl.STATIC_DRAW);

    if (fit) {
      const tr = [];
      for (let k = 0; k <= 160; k++) {
        const nu = (k / 160) * TAU, rr = fit.p / (1 + fit.e * Math.cos(nu));
        tr.push(rr * Math.cos(nu), rr * Math.sin(nu), 0);
      }
      G.traceCount = tr.length / 3;
      gl.bindBuffer(gl.ARRAY_BUFFER, G.traceBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tr), gl.STATIC_DRAW);

      // dust shares the apsidal line, so it hides on the same side
      const n = Ly.side ? 36 : 28, d = new Float32Array(n * 8);
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let k = 0; k < n; k++) {
        d.set([fit.p * (0.92 + 0.08 * rnd()), clamp(fit.e - 0.08 * rnd(), 0, fit.e), rnd(), 0.8 + 0.5 * rnd(),
          1 + rnd(), rnd(), 0.6 + 1.2 * rnd(), 0], k * 8);
      }
      dustData = { n };
      gl.bindBuffer(gl.ARRAY_BUFFER, G.dustBuf);
      gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    }
  }

  /* ----------------------------------------------------- simulate */

  function meanAnomaly(slot, tau) {
    const steady = TAU * (tau / PERIOD + slot.k / SLOTS) + M0;
    if (S.ent >= 3) return steady;
    return steady * easeOut3((S.ent - 0.6 - 0.28 * slot.k) / 1.8);
  }

  const _q = [0, 0, 0], _w = [0, 0, 0];
  function place(slot, M, out) {
    const nu = perifocal(M, fit.p, fit.e, _q);
    xform(O, _q[0], _q[1], _q[2], _w);
    const k = CAM / (CAM - _w[2]);
    out.w[0] = _w[0]; out.w[1] = _w[1]; out.w[2] = _w[2];
    out.sx = _w[0] * k;
    out.sy = _w[1] * k;
    out.rb = 0.5 * fit.s * 1.1 * (1 + 0.16 * slot.cap) * k;
    out.nu = nu;
    const dist = Math.hypot(out.sx, out.sy);
    out.hidden = _w[2] < 0 && dist + out.rb < Ly.r + 1;
    return out;
  }
  const _look = { w: [0, 0, 0] };

  function fire(list, a, scale) {
    let best = list[0];
    for (const b of list) if (b.age > best.age) best = b;
    best.a = a;
    best.age = 0;
    best.scale = scale;
    return best;
  }

  function update(dt) {
    S.t += dt;
    S.ent += dt;
    const { r, side } = Ly;
    const R = r + 1;

    // pointer: where the cursor is relative to the photo centre (y up)
    const pr = photo.getBoundingClientRect();
    const cx = pr.left + pr.width / 2, cy = pr.top + pr.height / 2;
    const p = S.ptr;
    let u = 0, px = 0, py = 0;
    if (p.on && !touchFirst) {
      px = p.x - cx;
      py = cy - p.y;
      if (!side || px > -(r + 40)) u = smooth(2.6 * r, 1.0 * r, Math.hypot(px, py));
    }

    // totality: pointer over the photo, or a tap
    const overPhoto = p.on && !touchFirst && Math.hypot(px, py) < r;
    const totalTarget = overPhoto || S.t < S.totalHold ? 1 : 0;
    const prevTotal = S.total;
    S.total = approach(S.total, totalTarget, totalTarget ? 4 : 0.85, dt);
    if (prevTotal < 0.5 && S.total >= 0.5 && S.t - S.totalRose > 4) {
      S.totalRose = S.t;
      S.sweepT = 0;
      S.waveT = S.t;
      S.pulseT = 0;
    }
    if (S.pulseT >= 0) S.pulseT = S.pulseT + dt > 1.1 ? -1 : S.pulseT + dt;

    // the star: follows the cursor along the rim, otherwise idles
    let target;
    if (u > 0.02) target = Math.atan2(py, px);
    else if (side) target = 95 * DEG * Math.sin((TAU * S.t) / 26);
    else target = S.sun + dt * (TAU / 40);
    if (side) target = clamp(target, -125 * DEG, 125 * DEG);
    const diff = side ? target - S.sun : wrapAngle(target - S.sun);
    S.sunV += (120 * diff - 22 * S.sunV) * dt;
    S.sun += S.sunV * dt;
    if (side) S.sun = clamp(S.sun, -125 * DEG, 125 * DEG);

    // star size: entrance pop, a small flare every 11 s, held during totality
    const e = S.ent - 0.45;
    let len = 24;
    if (e < 0) len = 0;
    else if (e < 0.45) len = 40 * easeOutExpo(e / 0.45);
    else if (e < 1.65) len = lerp(40, 24, smooth(0.45, 1.65, e));
    else {
      const tf = S.t % 11;
      len = 24 + 16 * (tf < 0.38 ? easeOutExpo(tf / 0.38) : 1 - smooth(0.38, 1.78, tf));
    }
    S.starLen = lerp(len, 54, S.total);
    S.starAmp = (1 + 0.08 * Math.sin(TAU * 0.3 * S.t)) * (1 + 0.25 * S.total);

    // time: slows near the hand, almost stops in totality, pushed a little by scrolling
    const anyCap = slots.some((s) => s.cap > 0.5);
    let tsT = lerp(1, 0.3, u);
    if (anyCap) tsT = Math.min(tsT, 0.3);
    tsT = lerp(tsT, 0.15, S.total) + 0.5 * S.scroll;
    S.ts = approach(S.ts, tsT, tsT < S.ts ? 3.3 : 0.85, dt);
    if (S.ent > 3) S.tau += dt * S.ts;
    S.scroll = approach(S.scroll, 0, 2.5, dt);

    // parallax tilts the orbit plane, never the camera (the occluder must stay on the DOM circle)
    const amp = fit ? fit.amp : 1;
    const axT = p.on && !touchFirst ? -4 * DEG * amp * clamp(py / (3 * r), -1, 1) : 0;
    const ayT = p.on && !touchFirst ? 4 * DEG * amp * clamp(px / (3 * r), -1, 1) : 0;
    S.ax = approach(S.ax, axT + 1.5 * DEG * amp * S.scroll, 1.7, dt);
    S.ay = approach(S.ay, ayT, 1.7, dt);

    // beads, glints, wave
    for (const b of beads) b.age += dt;
    for (const g of glints) g.age += dt;
    if (S.sweepT >= 0) {
      S.sweepT += dt;
      const half = side ? 125 * DEG : Math.PI;
      const b = beads[3];
      b.a = side ? lerp(half, -half, smooth(0, 0.6, S.sweepT)) : S.sun - smooth(0, 0.6, S.sweepT) * TAU;
      b.age = 0.13;
      b.scale = 0.8;
      if (S.sweepT > 0.6) S.sweepT = -1;
    }

    if (!fit) return;
    orbitMatrix(O, fit, S.ax, S.ay, side ? WOBBLE * fit.amp * Math.sin((TAU * S.t) / 70) : 0);

    // capture: a tapped or presented body (held for a moment), else the body nearest the cursor
    if (S.t <= S.captureUntil) {
      // keep it
    } else if (!touchFirst) {
      let best = -1, bestD = 36;
      if (p.on)
        for (const s of slots) {
          if (s.hidden) continue;
          const d = Math.hypot(s.sx - px, s.sy - py);
          if (d < bestD || (s.k === S.capture && d < 56)) {
            best = s.k;
            bestD = d;
          }
        }
      S.capture = best;
    } else {
      S.capture = -1;
      if (S.present < 3 && S.t > S.presentAt && S.ent > 4) {
        let best = -1, bestA = 0.9;
        for (const s of slots) {
          const a = Math.abs(wrapAngle(s.nu - Math.PI));
          if (!s.hidden && a < bestA) {
            best = s.k;
            bestA = a;
          }
        }
        S.presentAt = S.t + 14;
        if (best >= 0) {
          S.present++;
          S.capture = best;
          S.captureUntil = S.t + 1.8;
        }
      }
    }

    for (const s of slots) {
      s.cap = approach(s.cap, s.k === S.capture ? 1 : 0, s.k === S.capture ? 4 : 1.7, dt);
      const wasHidden = s.hidden;
      place(s, meanAnomaly(s, S.tau), s);
      // look ahead: light the rim where this body is about to break out
      if (s.hidden && !s.beadFired) {
        const ahead = S.ent > 3 ? S.tau + LEAD * Math.max(S.ts, 0.15) : S.tau;
        const prevEnt = S.ent;
        if (S.ent <= 3) S.ent += LEAD;
        place(s, meanAnomaly(s, ahead), _look);
        S.ent = prevEnt;
        if (!_look.hidden) {
          fire(beads.slice(0, SLOTS), Math.atan2(_look.sy, _look.sx), 1);
          s.beadFired = true;
        }
      }
      if (wasHidden && !s.hidden) {
        s.glint = 0;
        const a = Math.atan2(s.sy, s.sx);
        if (!side || Math.abs(a) < 125 * DEG) {
          const g = fire(glints, 0, 0);
          g.w = [R * Math.cos(a), R * Math.sin(a), 1];
          g.size = 22;
          g.life = 0.55;
          g.amp = 1;
        }
      }
      if (!wasHidden && s.hidden) {
        s.beadFired = false;
        s.swap = true;
      }
      if (s.hidden && s.swap) {
        const taken = slots.map((o) => o.logo);
        while (taken.includes(deal % STACK.length)) deal++;
        s.logo = deal % STACK.length;
        deal++;
        s.swap = false;
      }
      s.glint += dt;
      const wt = S.t - S.waveT - 0.08 * s.k;
      s.wave = wt > 0 && wt < 1 ? Math.sin(Math.PI * smooth(0, 1, wt)) : 0;
    }

    // a visible body catches the softbox now and then
    if (S.t > S.nextTwinkle) {
      S.nextTwinkle = S.t + 4 + 3 * Math.random();
      const vis = slots.filter((s) => !s.hidden && s.w[2] > 0);
      if (vis.length) {
        const s = vis[(Math.random() * vis.length) | 0], g = fire(glints, 0, 0);
        g.w = [s.w[0] + 0.2 * s.rb, s.w[1] + 0.25 * s.rb, s.w[2] + s.rb];
        g.size = 15;
        g.life = 0.4;
        g.amp = 0.85;
      }
    }

    if (DEV && !refitting) devCheck();
  }

  // dev only: the same envelope rules the fitter proved, checked every frame
  const devWarned = {};
  const devCheck = DEV && function () {
    const { r, side, env } = Ly;
    for (const s of slots) {
      if (s.hidden) continue;
      const warn = (k, msg) => {
        if (!devWarned[k]) {
          devWarned[k] = 1;
          console.warn("[eclipse]", msg, { slot: s.k, sx: s.sx.toFixed(1), sy: s.sy.toFixed(1), z: s.w[2].toFixed(1), rb: s.rb.toFixed(1) });
        }
      };
      if (s.sx - s.rb < env.xMin - 1 || s.sx + s.rb > env.xMax + 1 || s.sy + s.rb > env.yMax + 1 || s.sy - s.rb < env.yMin - 1) warn("env", "body outside the envelope");
      const dist = Math.hypot(s.sx, s.sy);
      if (dist < r + 1 + s.rb && Math.abs(s.w[2]) < s.rb) warn("slice", "body sliced by the occluder");
      if (side && dist < r + 1 + s.rb && s.w[2] > 0) warn("front", "body in front of the photo on desktop");
      if (!side && dist < r + 1 + s.rb && s.w[2] > 0 && overFace(s.sx, s.sy, s.rb, r)) warn("face", "body over the face");
    }
  };

  /* -------------------------------------------------------- draw */

  const PAL = {
    dark: { base: linear("#2b2f37"), glyph: linear("#dfe3ea"), rimc: linear("#f4f6ff"), exposure: 1, accent: 0.5, emissive: 0.04, rim: 1.4, dust: 1 },
    light: { base: linear("#30343b"), glyph: linear("#f3f5f8"), rimc: linear("#ffffff"), exposure: 1.05, accent: 0.72, emissive: 0.03, rim: 0.5, dust: 0.6 },
  };
  const accents = STACK.map((s) => linear(s.accent));
  const accentsLight = accents.map((c) => c.map((x) => x * 0.64));

  function bead(b) {
    // rises in 120 ms, falls over 500 ms
    const a = b.age;
    return a < 0.12 ? 1 - (1 - a / 0.12) ** 2 : Math.max(0, 1 - (a - 0.12) / 0.5) ** 2;
  }

  const beadU = new Float32Array(16);
  function draw() {
    if (!G || gl.isContextLost()) return;
    const { r, side } = Ly;
    const R = r + 1;
    const pal = light ? PAL.light : PAL.dark;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);

    // 1. the photo as a depth-only occluder: anything behind it is cut exactly at its rim
    gl.useProgram(G.progs.flat);
    gl.uniformMatrix4fv(G.u.flat.uMVP, false, PV);
    gl.colorMask(false, false, false, false);
    gl.depthFunc(gl.LESS);
    gl.bindVertexArray(G.discVao);
    gl.drawArrays(gl.TRIANGLES, 0, G.discCount);
    gl.colorMask(true, true, true, true);

    const sunW = [R * Math.cos(S.sun), R * Math.sin(S.sun), -0.6 * r];

    // 2. bodies (opaque); hidden while a resize settles on a new orbit
    if (fit && !refitting) {
      const u = G.u.body;
      gl.useProgram(G.progs.body);
      gl.uniformMatrix4fv(u.uPV, false, PV);
      gl.uniform3f(u.uCam, 0, 0, CAM);
      gl.uniform3fv(u.uBase, pal.base);
      gl.uniform3fv(u.uGlyph, pal.glyph);
      gl.uniform3fv(u.uRimColor, pal.rimc);
      gl.uniform1f(u.uExposure, pal.exposure);
      gl.uniform1i(u.uLegend, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, G.legend);
      gl.bindVertexArray(G.bodyVao);
      const list = DEV && window.__eclipse && window.__eclipse.gallery
        ? STACK.map((_, i) => ({ k: i, logo: i, hidden: false, cap: window.__eclipse.gallery.cap || 0, wave: 0, glint: 9, nu: Math.PI,
          w: [rect.x0 + 30 + (i % 3) * (rect.w - 60) / 2, rect.y1 - 40 - Math.floor(i / 3) * 90, 60] }))
        : slots;
      const sizeOf = DEV && window.__eclipse && window.__eclipse.gallery ? window.__eclipse.gallery.size || 60 : fit.s;
      for (const s of list) {
        if (s.hidden) continue;
        const faceOn = Math.max(smooth(0.7, 0.3, Math.abs(wrapAngle(s.nu - Math.PI))), s.cap);
        const ph = s.k * 2.1;
        const yaw = 22 * DEG * Math.sin((TAU * S.t) / 7.3 + ph) * (1 - faceOn);
        const pitch = 8 * DEG * Math.sin((TAU * S.t) / 8.1 + ph * 1.7) * (1 - faceOn);
        const spin = s.logo === 0 ? 0.4 * S.t : 0;
        rotZ(Tmp, spin);
        rotY(Tmp2, yaw);
        mul(Rt, Tmp2, Tmp);
        rotX(Tmp, pitch);
        mul(Tmp2, Tmp, Rt);
        for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) rot3[c * 3 + k] = Tmp2[c * 4 + k];
        const sc = sizeOf * (1 + 0.16 * s.cap) * (s.logo === 0 ? 1.08 : 1);
        Mdl.set(Tmp2);
        for (let k = 0; k < 12; k++) if (k % 4 !== 3) Mdl[k] *= sc;
        Mdl[12] = s.w[0]; Mdl[13] = s.w[1]; Mdl[14] = s.w[2];
        gl.uniformMatrix4fv(u.uModel, false, Mdl);
        gl.uniformMatrix3fv(u.uRot, false, rot3);
        const sd = [sunW[0] - s.w[0], sunW[1] - s.w[1]], sl = Math.hypot(sd[0], sd[1]) || 1;
        gl.uniform2f(u.uSunDir, sd[0] / sl, sd[1] / sl);
        const gl8 = s.glint < 0.12 ? s.glint / 0.12 : Math.max(0, 1 - (s.glint - 0.12) / 0.7);
        gl.uniform1f(u.uRim, pal.rim * (1 + 2.2 * gl8) * (0.85 + 0.3 * S.total));
        gl.uniform3fv(u.uAccent, (light ? accentsLight : accents)[s.logo]);
        gl.uniform1f(u.uAccentAmt, Math.min(1, lerp(pal.accent, 1, s.cap) + 0.35 * s.wave));
        gl.uniform1f(u.uEmissive, lerp(pal.emissive, light ? 0.1 : 0.9, s.cap) + (light ? 0.1 : 0.55) * s.wave);
        const rg = stackData.ranges[s.logo];
        gl.drawElements(gl.TRIANGLES, rg.count, gl.UNSIGNED_SHORT, rg.start * 2);
      }
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.depthFunc(gl.LEQUAL);

    // 3. the captured body's orbit, as a hairline (its far half hides behind the photo)
    const capAmt = Math.max(...slots.map((s) => s.cap));
    if (fit && !refitting && capAmt > 0.01) {
      gl.useProgram(G.progs.flat);
      mul(Tmp, PV, O);
      gl.uniformMatrix4fv(G.u.flat.uMVP, false, Tmp);
      const a = (light ? 0.1 : 0.12) * capAmt;
      gl.uniform4f(G.u.flat.uColor, light ? 0 : a, light ? 0 : a, light ? 0 : a, a);
      gl.bindVertexArray(G.traceVao);
      gl.drawArrays(gl.LINE_STRIP, 0, G.traceCount);
    }

    // 4. corona, chromosphere, star and beads in one annulus pass
    const gu = G.u.glow;
    gl.useProgram(G.progs.glow);
    gl.uniformMatrix4fv(gu.uPV, false, PV);
    gl.uniform1f(gu.uR, R);
    gl.uniform1f(gu.uSun, S.sun);
    gl.uniform1f(gu.uStarLen, S.starLen);
    gl.uniform1f(gu.uStarAmp, S.starAmp);
    const ent = S.ent;
    gl.uniform1f(gu.uCorona, easeOut3((ent - 0.25) / 0.9) * (1 + 1.2 * S.total));
    gl.uniform1f(gu.uBloom, S.total);
    gl.uniform4f(gu.uRect, rect.x0, rect.x1, rect.y0, rect.y1);
    gl.uniform1f(gu.uPulse, S.pulseT >= 0 ? S.pulseT / 1.1 : -1);
    gl.uniform1f(gu.uArc, lerp(0.06, 0.45, S.total));
    gl.uniform1f(gu.uMaskHalf, side ? 125 * DEG : Math.PI + 1);
    gl.uniform1f(gu.uGuard, side ? 1 : 0);
    gl.uniform1f(gu.uTime, S.t);
    gl.uniform1f(gu.uLight, light ? 1 : 0);
    const growT = clamp(ent / 0.7, 0, 1);
    gl.uniform2f(gu.uGrow, side ? 40 * DEG : 90 * DEG, (growT < 0.5 ? 4 * growT ** 3 : 1 - (-2 * growT + 2) ** 3 / 2) * (Math.PI + 0.3));
    beads.forEach((b, i) => {
      beadU[i * 4] = b.a;
      beadU[i * 4 + 1] = bead(b) * (i === 3 ? 0.9 : 1);
      beadU[i * 4 + 2] = b.scale;
      beadU[i * 4 + 3] = 0;
    });
    gl.uniform4fv(gu["uBeads[0]"], beadU);
    gl.bindVertexArray(G.ringVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, G.ringCount);

    // 5. dust and glints
    if (fit && !refitting) {
      const pu = G.u.pts;
      gl.useProgram(G.progs.pts);
      gl.uniformMatrix4fv(pu.uPV, false, PV);
      gl.uniformMatrix4fv(pu.uOrbit, false, O);
      gl.uniform1f(pu.uTau, S.tau + 3 * smooth(0, 3, S.ent));
      gl.uniform1f(pu.uPeriod, PERIOD);
      gl.uniform1f(pu.uDpr, dpr);
      gl.uniform1f(pu.uDust, pal.dust * smooth(0.8, 2.4, ent) * (1 + 0.6 * S.total));
      gl.uniform3f(pu.uSun, sunW[0], sunW[1], sunW[2]);
      gl.uniform1f(pu.uLight, light ? 1 : 0);
      gl.uniform4f(pu.uRect, rect.x0, rect.x1, rect.y0, rect.y1);
      gl.bindVertexArray(G.dustVao);
      gl.drawArrays(gl.POINTS, 0, light ? 10 : dustData.n);

      let n = 0;
      for (const g of glints) {
        if (g.age >= g.life) continue;
        const t = g.age / g.life, env = t < 0.2 ? t / 0.2 : 1 - smooth(0.2, 1, t);
        G.glintData.set([g.w[0], g.w[1], g.w[2], Math.min(g.size, G.maxPoint / dpr), g.amp * env, 0, 0, 1], n * 8);
        n++;
      }
      if (n) {
        gl.bindVertexArray(G.glintVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, G.glintBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, G.glintData.subarray(0, n * 8));
        gl.drawArrays(gl.POINTS, 0, n);
      }
    }
    gl.bindVertexArray(null);
    gl.depthMask(true);

    drawLabel();
  }

  function drawLabel() {
    const s = slots.find((o) => o.k === S.capture);
    const spot = s && !s.hidden && !refitting && s.cap >= 0.35 ? placeLabel(s) : null;
    if (!spot) {
      if (labelSlot !== -1) {
        label.classList.remove("is-on");
        labelSlot = -1;
      }
      return;
    }
    label.classList.toggle("is-left", spot.lead === "right");
    label.classList.toggle("is-plain", spot.lead === "none");
    label.style.transform = `translate3d(${Math.round(spot.x)}px, ${Math.round(spot.y)}px, 0)`;
    if (labelSlot !== s.k) {
      label.classList.add("is-on");
      labelSlot = s.k;
    }
  }

  // Try beside the body (outward side first), then the other side, then above and below. A spot
  // must stay on screen, off the photo, inside the envelope (so never over the text) and clear of
  // the body it names; if none fits, the label simply stays hidden.
  function placeLabel(s) {
    const text = `${STACK[s.logo].name} · ${String(s.logo + 1).padStart(2, "0")}/${String(STACK.length).padStart(2, "0")}`;
    if (text !== labelText) {
      label.textContent = text;
      labelText = text;
      label.classList.add("is-plain");
      labelW = label.offsetWidth; // text only; a leader adds 18px
      labelH = label.offsetHeight || 11;
    }
    const { r, cw, env } = Ly;
    const R = r + 1, gap = s.rb + 12, lead = 18, h = labelH;
    const pageLeft = photo.getBoundingClientRect().left;
    const out = s.sx >= 0;
    const beside = (right) => {
      const w = labelW + lead;
      return { x0: right ? s.sx + gap : s.sx - gap - w, w, yc: s.sy, lead: right ? "left" : "right" };
    };
    const stacked = (above) => ({ x0: s.sx - labelW / 2, w: labelW, yc: s.sy + (above ? 1 : -1) * (gap + h / 2), lead: "none" });
    const tries = [beside(out), beside(!out), stacked(s.sy >= 0), stacked(s.sy < 0)];
    for (const c of tries) {
      const x1 = c.x0 + c.w, y0 = c.yc - h / 2, y1 = c.yc + h / 2;
      if (r + c.x0 + pageLeft < 8 || r + x1 + pageLeft > cw - 8) continue;
      if (c.x0 < env.xMin || x1 > env.xMax || y0 < env.yMin || y1 > env.yMax) continue;
      // nearest point of the label box to the photo centre must clear the rim
      const nx = clamp(0, c.x0, x1), ny = clamp(0, y0, y1);
      if (Math.hypot(nx, ny) < R + 3) continue;
      return { x: r + c.x0, y: r - y1, lead: c.lead };
    }
    // stacked layouts: no room beside the ring, so the name becomes a caption in the gap under the photo
    if (!Ly.side) {
      const room = -env.yMin - R;
      const yc = -(R + Math.min(14, room / 2)), x0 = -labelW / 2;
      if (room >= h + 4 && r + x0 + pageLeft >= 8 && r + x0 + labelW + pageLeft <= cw - 8) return { x: r + x0, y: r - (yc + h / 2), lead: "none" };
    }
    return null;
  }

  /* ----------------------------------------------------- lifecycle */

  let base = 0, slow = 0, samples = [];
  const regovern = () => ((base = 0), (slow = 0), (samples = []));
  // judge the cadence against the refresh measured just before, so a 30 Hz cap is not read as
  // overload; two slow windows in a row step down: lower resolution, then 30 fps. Never freezes.
  function govern(ms) {
    samples.push(ms);
    if (samples.length < 30) return false;
    if (!base) {
      base = samples.slice().sort((a, b) => a - b)[15];
      samples = [];
      return false;
    }
    if (samples.length < 120) return false;
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    samples = [];
    if (!(mean > base * 1.4 && mean > 20)) return ((slow = 0), false);
    if (++slow < 2 || quality >= 2) return false;
    quality++;
    regovern();
    if (DEV) console.info("[eclipse] quality step", quality);
    if (quality === 1) {
      layout(); // new backing size clears the canvas: this frame must draw
      return true;
    }
    return false;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const ms = last ? Math.min(now - last, 250) : 16.7;
    last = now;
    const forced = govern(ms);
    acc += ms;
    const idle = S.t - S.ptr.last > 12 && S.ent > 12 && S.t > S.captureUntil + 1;
    if (!forced && (idle || quality >= 2) && acc < 33) return;
    const dt = Math.min(acc / 1000, 0.05);
    acc = 0;
    update(dt);
    draw();
  }

  function start() {
    if (running || !ready || dead || reduced || !visible || document.hidden) return;
    running = true;
    last = 0;
    acc = 0;
    regovern();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function still() {
    // reduced motion: one composed frame, no loop, nothing left over from hover or a tap
    Object.assign(S, { ent: 99, tau: 4.5, sun: 35 * DEG, sunV: 0, total: 0, totalHold: 0, pulseT: -1, sweepT: -1, capture: -1, captureUntil: 0 });
    for (const s of slots) s.cap = 0;
    const on = S.ptr.on;
    S.ptr.on = false;
    update(0);
    S.ptr.on = on;
    for (const b of beads) b.age = 9;
    for (const g of glints) g.age = 9;
    draw();
  }

  function render() {
    if (!ready) return;
    if (reduced) still();
    else draw();
  }

  function show() {
    canvas.classList.add("is-on");
  }

  let booting = false;
  async function boot() {
    if (ready || dead || booting || (gl && gl.isContextLost())) return;
    booting = true;
    const fontReady = document.fonts ? Promise.race([document.fonts.load('500 62px "Geist Mono"'), new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
    let ok = false;
    try {
      ok = await initGL();
    } finally {
      booting = false;
    }
    if (!ok) {
      if (gl && gl.isContextLost()) return; // webglcontextrestored will boot again
      return teardown();
    }
    fontReady.then(() => {
      if (G && !gl.isContextLost()) {
        uploadLegend();
        render();
      }
    });
    ready = true;
    render();
    requestAnimationFrame(show);
    start();
  }

  const bye = new AbortController(), signal = bye.signal, observers = [];
  function teardown() {
    dead = true;
    stop();
    clearTimeout(refitTimer);
    bye.abort();
    for (const o of observers) o.disconnect();
    if (gl && !gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext();
    gl = G = null;
    canvas.remove();
    label.remove();
  }

  // an orbit change after a resize, or a theme swap: hide in the same task, repaint, fade back in
  function fadeSwap() {
    if (!ready) return;
    canvas.style.transition = "none";
    canvas.classList.remove("is-on");
    render();
    requestAnimationFrame(() => {
      canvas.style.transition = "";
      if (ready) canvas.classList.add("is-on");
    });
  }

  const themeObs = new MutationObserver(() => {
    const next = root.classList.contains("light");
    if (next === light) return;
    light = next;
    fadeSwap();
  });

  let relayoutQueued = false;
  function relayout() {
    if (relayoutQueued || dead) return;
    relayoutQueued = true;
    requestAnimationFrame(() => {
      relayoutQueued = false;
      if (dead) return;
      layout();
      render(); // resizing clears the canvas, so paint at once even while paused
    });
  }

  // first sizing before the canvas enters the DOM, so it never flashes at 300x150
  layout(true);
  wrap.append(canvas, label);

  const ro = new ResizeObserver(relayout);
  ro.observe(wrap);
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (!visible) return stop();
    if (!ready) boot();
    else start();
  }, { rootMargin: "80px" });
  io.observe(wrap);
  themeObs.observe(root, { attributes: true, attributeFilter: ["class"] });
  observers.push(ro, io, themeObs);
  addEventListener("resize", relayout, { passive: true, signal });
  // moving the window to a screen with another pixel ratio resizes nothing in CSS px
  const watchDpr = () =>
    matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`).addEventListener("change", () => {
      relayout();
      watchDpr();
    }, { once: true, signal });
  watchDpr();
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()), { signal });
  mqReduce.addEventListener("change", (e) => {
    reduced = e.matches;
    if (reduced) {
      stop();
      render();
    } else start();
  }, { signal });

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    stop();
    ready = false;
    G = null;
    canvas.classList.remove("is-on");
    label.classList.remove("is-on");
    labelSlot = -1;
    if (++lost > 1) teardown();
  }, { signal });
  canvas.addEventListener("webglcontextrestored", () => {
    if (!dead) boot();
  }, { signal });

  // input (passive; nothing here ever blocks scrolling or selection)
  section.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    S.ptr.on = true;
    S.ptr.x = e.clientX;
    S.ptr.y = e.clientY;
    S.ptr.last = S.t;
  }, { passive: true, signal });
  section.addEventListener("pointerleave", () => {
    S.ptr.on = false;
  }, { passive: true, signal });
  let down = null;
  section.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || touchFirst) down = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, { passive: true, signal });
  section.addEventListener("pointerup", (e) => {
    if (!down || !fit || reduced) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
    down = null;
    if (moved > 10 || dt > 300) return;
    const pr = photo.getBoundingClientRect();
    const px = e.clientX - (pr.left + pr.width / 2), py = pr.top + pr.height / 2 - e.clientY;
    S.ptr.last = S.t;
    let hit = -1, best = 44;
    for (const s of slots) {
      if (s.hidden) continue;
      const d = Math.hypot(s.sx - px, s.sy - py);
      if (d < best) {
        best = d;
        hit = s.k;
      }
    }
    if (hit >= 0) {
      S.capture = hit;
      S.captureUntil = S.t + 2.4;
    } else if (Math.hypot(px, py) < Ly.r) {
      if (S.t < S.totalHold) S.totalHold = 0;
      else {
        S.totalHold = S.t + 2.6;
        S.sun = Math.atan2(py, px);
        S.sunV = 0;
      }
    }
  }, { passive: true, signal });
  addEventListener("scroll", () => {
    const y = scrollY, v = Math.abs(y - S.scrollY);
    S.scrollY = y;
    if (running) S.scroll = Math.max(S.scroll, clamp(v / 48, 0, 1));
  }, { passive: true, signal });

  if (DEV)
    window.__eclipse = {
      S, slots,
      get Ly() { return Ly; },
      get fit() { return fit; },
      get rect() { return rect; },
      get quality() { return quality; },
      get loop() { return { running, visible, ready, booting, refitting, dead, hidden: document.hidden }; },
      place(k) { const s = slots[k]; return { spot: placeLabel(s), labelW, labelH, env: Ly.env, s: { sx: s.sx, sy: s.sy, rb: s.rb, cap: s.cap, hidden: s.hidden }, capture: S.capture }; },
      // dev only: paint now and show an enlarged copy of the canvas over the page
      zoom(scale = 3, bg = light ? "#fff" : "#0b0d10") {
        draw();
        // composite: page colour, the round photo where the DOM draws it, then this frame on top
        const out = document.createElement("canvas");
        out.width = canvas.width;
        out.height = canvas.height;
        const x = out.getContext("2d"), k = canvas.width / canvas.clientWidth;
        x.fillStyle = bg;
        x.fillRect(0, 0, out.width, out.height);
        const im = photo.querySelector("img"), r = Ly.r;
        x.save();
        x.beginPath();
        x.arc((r - parseFloat(canvas.style.left)) * k, (r - parseFloat(canvas.style.top)) * k, r * k, 0, TAU);
        x.clip();
        const ar = im.naturalWidth / im.naturalHeight, ih = 2 * r * k, iw = ih * ar;
        x.drawImage(im, (r - parseFloat(canvas.style.left)) * k - iw / 2, (0 - parseFloat(canvas.style.top)) * k, iw, ih);
        x.restore();
        // premultiplied GL pixels over the composite (readPixels is bottom-up)
        const w = canvas.width, h = canvas.height, px = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const dst = x.getImageData(0, 0, w, h), d = dst.data;
        for (let yy = 0; yy < h; yy++)
          for (let xx = 0; xx < w; xx++) {
            const si = ((h - 1 - yy) * w + xx) * 4, di = (yy * w + xx) * 4, a = px[si + 3] / 255;
            for (let c = 0; c < 3; c++) d[di + c] = Math.min(255, px[si + c] + d[di + c] * (1 - a));
          }
        x.putImageData(dst, 0, 0);
        const url = out.toDataURL();
        let img = document.getElementById("eclipse-zoom");
        if (!img) {
          img = document.createElement("img");
          img.id = "eclipse-zoom";
          img.style.cssText = "position:fixed;left:0;top:0;z-index:9999;border:1px solid #333";
          document.body.append(img);
        }
        img.style.background = bg;
        img.style.width = canvas.clientWidth * scale + "px";
        img.src = url;
        return { w: canvas.width, h: canvas.height };
      },
      why(list) {
        const vs = [[0, 0, 0]];
        return list.map((c) => ({ c, ok: !!testOrbit({ emerge: Math.PI, ...c, apo: c.apo * DEG, incl: c.incl * DEG }, Ly, vs), why: failWhy }));
      },
      stats(n = 600) {
        const keep = { tau: S.tau, ent: S.ent }, hist = [0, 0, 0, 0];
        S.ent = 99;
        let hiddenTime = 0;
        for (let i = 0; i < n; i++) {
          const tau = (i / n) * PERIOD;
          let vis = 0;
          for (const s of slots) {
            const o = { w: [0, 0, 0] };
            place(s, meanAnomaly(s, tau), o);
            if (!o.hidden) vis++;
            else if (s.k === 0) hiddenTime++;
          }
          hist[vis]++;
        }
        Object.assign(S, keep);
        return { hiddenFraction: +(hiddenTime / n).toFixed(2), visibleCount: hist.map((h) => +(h / n).toFixed(2)) };
      },
      unzoom() {
        document.getElementById("eclipse-zoom")?.remove();
      },
    };
}
