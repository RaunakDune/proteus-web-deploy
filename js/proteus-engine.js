/* Proteus engine: browser port of github.com/RaunakDune/proteus-implementation */
/* Proteus engine (browser port of the reference implementation).
   Everything works in local metres; networks carry their own projection. */
const Proteus = (() => {
  const R = 6371008.8, D2R = Math.PI / 180;

  function makeProj(lat0, lon0) {
    const kx = D2R * R * Math.cos(lat0 * D2R), ky = D2R * R;
    return { lat0, lon0,
      toXY: (lon, lat) => [(lon - lon0) * kx, (lat - lat0) * ky],
      toLL: (x, y) => [x / kx + lon0, y / ky + lat0] };
  }

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }

  /* ------------------------------------------------------------------ network */
  function buildNetwork(lonlat, edgeList, proj) {
    if (!proj) {
      let la = 0, lo = 0; for (const [x, y] of lonlat) { lo += x; la += y; }
      proj = makeProj(la / lonlat.length, lo / lonlat.length);
    }
    const xy = lonlat.map(([lo, la]) => proj.toXY(lo, la));
    // largest connected component
    const adj0 = xy.map(() => []);
    const seen = new Set(), E0 = [];
    for (const [a, b] of edgeList) {
      if (a === b) continue;
      const k = a < b ? a + ',' + b : b + ',' + a;
      if (seen.has(k)) continue; seen.add(k);
      E0.push([a, b]); adj0[a].push(b); adj0[b].push(a);
    }
    const comp = new Int32Array(xy.length).fill(-1); let best = -1, bestSize = 0, c = 0;
    for (let s = 0; s < xy.length; s++) {
      if (comp[s] >= 0 || adj0[s].length === 0) continue;
      const st = [s]; comp[s] = c; let size = 0;
      while (st.length) { const u = st.pop(); size++; for (const v of adj0[u]) if (comp[v] < 0) { comp[v] = c; st.push(v); } }
      if (size > bestSize) { bestSize = size; best = c; } c++;
    }
    const remap = new Int32Array(xy.length).fill(-1), nodes = [];
    for (let i = 0; i < xy.length; i++) if (comp[i] === best) { remap[i] = nodes.length; nodes.push(xy[i]); }
    const edges = [], adj = nodes.map(() => []);
    for (const [a, b] of E0) {
      if (comp[a] !== best) continue;
      const A = remap[a], B = remap[b];
      const len = Math.hypot(nodes[B][0] - nodes[A][0], nodes[B][1] - nodes[A][1]);
      if (len < 0.01) continue;
      adj[A].push([B, edges.length]); adj[B].push([A, edges.length]);
      edges.push({ a: A, b: B, len });
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of nodes) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { proj, nodes, edges, adj, bbox: [x0, y0, x1, y1],
      length: edges.reduce((s, e) => s + e.len, 0) };
  }

  function syntheticGrid({ rows = 9, cols = 9, spacing = 110, rotation = -36, lat = 29.7557, lon = -95.3647, sub = 1 } = {}) {
    const proj = makeProj(lat, lon), t = rotation * D2R, c = Math.cos(t), s = Math.sin(t);
    const W = (cols - 1) * spacing, H = (rows - 1) * spacing, ll = [], idx = new Map(), E = [];
    const add = (key, x, y) => { x -= W / 2; y -= H / 2; const X = c * x - s * y, Y = s * x + c * y;
      idx.set(key, ll.length); ll.push(proj.toLL(X, Y)); return idx.get(key); };
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) add(r + ',' + q, q * spacing, r * spacing);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) for (const [dr, dq] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, q2 = q + dq; if (r2 >= rows || q2 >= cols) continue;
      let prev = idx.get(r + ',' + q);
      for (let i = 1; i < sub; i++) { const f = i / sub;
        const n = add([r, q, dr, dq, i].join(','), (q + dq * f) * spacing, (r + dr * f) * spacing); E.push([prev, n]); prev = n; }
      E.push([prev, idx.get(r2 + ',' + q2)]);
    }
    return buildNetwork(ll, E, proj);
  }

  function fromCompact(data) { return buildNetwork(data.n, data.e); }

  function fromOverpass(json) {
    const id2i = new Map(), ll = [], E = [];
    for (const el of json.elements) if (el.type === 'node') { id2i.set(el.id, ll.length); ll.push([el.lon, el.lat]); }
    for (const el of json.elements) if (el.type === 'way' && el.nodes)
      for (let i = 1; i < el.nodes.length; i++) {
        const a = id2i.get(el.nodes[i - 1]), b = id2i.get(el.nodes[i]);
        if (a !== undefined && b !== undefined) E.push([a, b]);
      }
    return buildNetwork(ll, E);
  }

  /* ---------------------------------------------- OpenStreetMap vector tiles */
  // Minimal Mapbox Vector Tile (protobuf) decoder: returns the LineString
  // features of one layer as arrays of [x, y] in tile units, with properties.
  function decodeMVT(buf, wantLayer) {
    const b = new Uint8Array(buf);
    function varint(st) { let r = 0, m = 1, c; do { c = b[st.p++]; r += (c & 0x7f) * m; m *= 128; } while (c & 0x80); return r; }
    function skip(st, wt) { if (wt === 0) varint(st); else if (wt === 1) st.p += 8; else if (wt === 2) { const l = varint(st); st.p += l; } else if (wt === 5) st.p += 4; }
    function str(st, end) { return new TextDecoder().decode(b.subarray(st.p, end)); }
    const out = [], st = { p: 0 };
    while (st.p < b.length) {
      const tag = varint(st), f = Math.floor(tag / 8), wt = tag & 7;
      if (f !== 3 || wt !== 2) { skip(st, wt); continue; }
      const lend = varint(st) + st.p; let name = '', extent = 4096; const keys = [], vals = [], feats = [];
      while (st.p < lend) {
        const t = varint(st), lf = Math.floor(t / 8), lw = t & 7;
        if (lf === 1) { const l = varint(st); name = str(st, st.p + l); st.p += l; }
        else if (lf === 3) { const l = varint(st); keys.push(str(st, st.p + l)); st.p += l; }
        else if (lf === 4) { const vend = varint(st) + st.p; let v = null;
          while (st.p < vend) { const vt = varint(st), vf = Math.floor(vt / 8), vw = vt & 7;
            if (vf === 1) { const l = varint(st); v = str(st, st.p + l); st.p += l; } else if (vf === 7) v = !!varint(st);
            else if (vf === 4 || vf === 5) v = varint(st); else skip(st, vw); }
          vals.push(v); }
        else if (lf === 5) extent = varint(st);
        else if (lf === 2) { const l = varint(st); feats.push([st.p, st.p + l]); st.p += l; }
        else skip(st, lw);
      }
      st.p = lend;
      if (name !== wantLayer) continue;
      for (const [fs, fe] of feats) {
        const fst = { p: fs }; let type = 0, tags = [], geom = [];
        while (fst.p < fe) {
          const t = varint(fst), ff = Math.floor(t / 8), fw = t & 7;
          if ((ff === 2 || ff === 4) && fw === 2) { const end = varint(fst) + fst.p; const arr = []; while (fst.p < end) arr.push(varint(fst)); if (ff === 2) tags = arr; else geom = arr; }
          else if (ff === 3) type = varint(fst); else skip(fst, fw);
        }
        if (type !== 2) continue;
        const props = {}; for (let i = 0; i + 1 < tags.length; i += 2) props[keys[tags[i]]] = vals[tags[i + 1]];
        const lines = []; let x = 0, y = 0, i = 0, cur = null;
        const zz = (n) => (n % 2 ? -(n + 1) / 2 : n / 2);
        while (i < geom.length) {
          const cmd = geom[i] & 7, cnt = Math.floor(geom[i] / 8); i++;
          for (let k = 0; k < cnt && cmd !== 7; k++) { x += zz(geom[i++]); y += zz(geom[i++]);
            if (cmd === 1) { cur = [[x, y]]; lines.push(cur); } else if (cur) cur.push([x, y]); }
        }
        out.push({ props, lines, extent });
      }
    }
    return out;
  }

  const DRIVE = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service']);
  const WALK = new Set(['primary', 'secondary', 'tertiary', 'minor', 'service', 'path', 'track']);
  const lon2tile = (lo, z) => (lo + 180) / 360 * 2 ** z;
  const lat2tile = (la, z) => (1 - Math.log(Math.tan(la * D2R) + 1 / Math.cos(la * D2R)) / Math.PI) / 2 * 2 ** z;
  const tile2lon = (x, z) => x / 2 ** z * 360 - 180;
  const tile2lat = (y, z) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** z))) / D2R;
  function tilesFor(s, w, n, e, z) {
    const out = [];
    for (let x = Math.floor(lon2tile(w, z)); x <= Math.floor(lon2tile(e, z)); x++)
      for (let y = Math.floor(lat2tile(n, z)); y <= Math.floor(lat2tile(s, z)); y++) out.push([z, x, y]);
    return out;
  }
  // tiles: [{z, x, y, buf}] -> road network inside the lon/lat box.
  // Vertices are matched on the shared global tile grid, so roads only join
  // where OpenStreetMap joins them (bridges over roads stay unconnected).
  function fromVectorTiles(tiles, s, w, n, e, mode) {
    const keep = mode === 'walk' ? WALK : DRIVE, id = new Map(), ll = [], E = [], seen = new Set();
    const node = (gx, gy, z, ext) => { const k = gx + ',' + gy; let i = id.get(k);
      if (i === undefined) { i = ll.length; id.set(k, i); ll.push([tile2lon(gx / ext, z), tile2lat(gy / ext, z)]); } return i; };
    for (const t of tiles) for (const f of decodeMVT(t.buf, 'transportation')) {
      const cls = f.props.class; if (!keep.has(cls)) continue;
      if (mode !== 'walk' && cls === 'service' && f.props.service && f.props.service !== 'alley') continue;
      const ext = f.extent;
      for (const line of f.lines) for (let i = 1; i < line.length; i++) {
        const [ax, ay] = line[i - 1], [bx, by] = line[i];
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        if (mx < 0 || my < 0 || mx >= ext || my >= ext) continue;          // owned by the neighbouring tile
        const lo = tile2lon(t.x + mx / ext, t.z), la = tile2lat(t.y + my / ext, t.z);
        if (lo < w || lo > e || la < s || la > n) continue;
        const gax = t.x * ext + ax, gay = t.y * ext + ay, gbx = t.x * ext + bx, gby = t.y * ext + by;
        const a = node(gax, gay, t.z, ext), c = node(gbx, gby, t.z, ext); if (a === c) continue;
        const k = a < c ? a + ',' + c : c + ',' + a; if (seen.has(k)) continue; seen.add(k); E.push([a, c]);
      }
    }
    return buildNetwork(ll, E);
  }

  function overpassQuery(s, w, n, e, mode) {
    const hw = mode === 'walk'
      ? 'footway|path|pedestrian|steps|living_street|residential|service|unclassified|tertiary|secondary|primary|cycleway'
      : 'motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|primary_link|secondary_link|tertiary_link|service';
    return `[out:json][timeout:25];way["highway"~"^(${hw})$"](${s},${w},${n},${e});(._;>;);out body;`;
  }

  /* ------------------------------------------------------------ spatial grids */
  class PointGrid {
    constructor(cell) { this.c = cell; this.m = new Map(); }
    key(ix, iy) { return (ix + 50000) * 100000 + (iy + 50000); }
    add(i, x, y) { const k = this.key(Math.floor(x / this.c), Math.floor(y / this.c));
      let a = this.m.get(k); if (!a) this.m.set(k, a = []); a.push(i); }
    near(x, y, fn) { const ix = Math.floor(x / this.c), iy = Math.floor(y / this.c);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const a = this.m.get(this.key(ix + dx, iy + dy)); if (a) for (const j of a) if (fn(j) === false) return; } }
  }
  class SegGrid {           // segments indexed in every cell they (padded) overlap
    constructor(segs, cell, pad) {
      this.s = segs; this.c = cell; this.m = new Map();
      segs.forEach((g, i) => {
        const x0 = Math.floor((Math.min(g[0], g[2]) - pad) / cell), x1 = Math.floor((Math.max(g[0], g[2]) + pad) / cell);
        const y0 = Math.floor((Math.min(g[1], g[3]) - pad) / cell), y1 = Math.floor((Math.max(g[1], g[3]) + pad) / cell);
        for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
          const k = (ix + 50000) * 100000 + (iy + 50000); let a = this.m.get(k); if (!a) this.m.set(k, a = []); a.push(i); }
      });
    }
    cand(x, y) { return this.m.get((Math.floor(x / this.c) + 50000) * 100000 + (Math.floor(y / this.c) + 50000)) || []; }
  }
  function segDist(px, py, g) {
    const dx = g[2] - g[0], dy = g[3] - g[1], L = dx * dx + dy * dy;
    let t = L ? ((px - g[0]) * dx + (py - g[1]) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(g[0] + t * dx - px, g[1] + t * dy - py);
  }
  const heading = (g) => Math.atan2(g[3] - g[1], g[2] - g[0]) / D2R;
  function angDiff(h1, h2) { const d = Math.abs(h1 - h2) % 180; return Math.min(d, 180 - d); }

  /* ------------------------------------------------------------- simulation */
  // Volunteers follow the Sec 4.1 rules: stay in their quadrant box, prefer
  // unexplored then least-explored edges, prefer going straight, and walk a
  // circuit around each intersection (Rule 4).
  function simulate(net, destroyed, o) {
    const r = rng(o.seed || 1), spacing = o.spacing || 5, circR = o.circuitRadius || 6;
    const alive = (e) => !destroyed.has(e);
    const deg = net.adj.map((a) => a.filter(([, e]) => alive(e)).length);
    const [bx0, by0, bx1, by1] = net.bbox, mx = (bx0 + bx1) / 2, my = (by0 + by1) / 2, margin = 75;
    const boxes = [[bx0, by0, mx, my], [mx, by0, bx1, my], [bx0, my, mx, by1], [mx, my, bx1, by1]];
    const usable = []; for (let i = 0; i < net.nodes.length; i++) if (deg[i] > 0) usable.push(i);
    const agents = [];
    for (let k = 0; k < o.agents; k++) {
      const b = boxes[k % 4], inBox = usable.filter((i) => { const [x, y] = net.nodes[i]; return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]; });
      const pool = inBox.length ? inBox : usable;
      const node = pool[Math.floor(r() * pool.length)];
      agents.push({ id: k, node, prev: -1, box: [b[0] - margin, b[1] - margin, b[2] + margin, b[3] + margin],
        taken: new Map(), px: [], py: [], pstep: [], path: [node] });
    }
    const counts = new Map(), visitors = net.nodes.map(() => new Set());
    for (const a of agents) visitors[a.node].add(a.id);
    const inside = (n, b) => { const [x, y] = net.nodes[n]; return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]; };
    for (let step = 1; step <= o.steps; step++) {
      for (const a of agents) {
        const nb = net.adj[a.node].filter(([, e]) => alive(e));
        if (!nb.length) { a.path.push(a.node); continue; }
        let cands = nb.filter(([v]) => inside(v, a.box)); if (!cands.length) cands = nb;
        const here = net.nodes[a.node], tk = a.taken.get(a.node) || new Set();
        const hin = a.prev >= 0 ? Math.atan2(here[1] - net.nodes[a.prev][1], here[0] - net.nodes[a.prev][0]) : null;
        let best = null, bs = null;
        for (const [v, e] of cands) {
          const p = net.nodes[v];
          let turn = 0; if (hin !== null) { const h = Math.atan2(p[1] - here[1], p[0] - here[0]);
            turn = Math.abs(((h - hin) / D2R + 540) % 360 - 180); }
          const sc = [deg[a.node] > 2 && tk.has(v) ? 1 : 0, counts.get(e) || 0, turn, r()];
          if (!bs || sc[0] < bs[0] || (sc[0] === bs[0] && (sc[1] < bs[1] || (sc[1] === bs[1] && (sc[2] < bs[2] - 1e-9 || (Math.abs(sc[2] - bs[2]) < 1e-9 && sc[3] < bs[3])))))) { bs = sc; best = [v, e]; }
        }
        const [v, e] = best, P = net.nodes[a.node], Q = net.nodes[v];
        let path = [P, Q];
        if (deg[v] > 2) {                               // Rule 4 circuit around the junction
          const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
          if (L > circR) {
            const ux = (P[0] - Q[0]) / L, uy = (P[1] - Q[1]) / L, pin = [Q[0] + ux * circR, Q[1] + uy * circR];
            const st = Math.atan2(uy, ux), n = Math.max(8, Math.ceil(2 * Math.PI * circR / spacing)), ring = [];
            for (let i = 0; i <= n; i++) { const t = st + 2 * Math.PI * i / n; ring.push([Q[0] + circR * Math.cos(t), Q[1] + circR * Math.sin(t)]); }
            path = [P, pin, ...ring, Q];
          }
        }
        // sample GPS fixes along the true path
        for (let i = 1; i < path.length; i++) {
          const A = path[i - 1], B = path[i], L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(L / spacing));
          for (let j = 1; j <= n; j++) {
            const f = j / n;
            a.px.push(A[0] + f * (B[0] - A[0]) + gauss(r) * o.sigma);
            a.py.push(A[1] + f * (B[1] - A[1]) + gauss(r) * o.sigma);
            a.pstep.push(step);
          }
        }
        counts.set(e, (counts.get(e) || 0) + 1);
        tk.add(v); a.taken.set(a.node, tk);
        a.prev = a.node; a.node = v; a.path.push(v); visitors[v].add(a.id);
      }
    }
    // flatten: points contiguous per agent, in time order
    let N = 0; for (const a of agents) N += a.px.length;
    const X = new Float64Array(N), Y = new Float64Array(N), V = new Int32Array(N), S = new Int32Array(N);
    let k = 0; for (const a of agents) for (let i = 0; i < a.px.length; i++, k++) { X[k] = a.px[i]; Y[k] = a.py[i]; V[k] = a.id; S[k] = a.pstep[i]; }
    let cov = 0, tot = 0; for (let i = 0; i < net.nodes.length; i++) if (deg[i] > 0) { tot++; if (visitors[i].size >= 3) cov++; }
    return { X, Y, V, S, n: N, agents: agents.map((a) => a.path), coverage: tot ? cov / tot : 0, nAgents: o.agents };
  }

  /* ----------------------------------------------- Algorithm 2: verification */
  function verify(tr, mapSegs, theta, k) {
    const { X, Y, V, n } = tr, mapOK = new Uint8Array(n);
    const sg = new SegGrid(mapSegs, Math.max(theta * 2, 20), theta);
    for (let i = 0; i < n; i++) { for (const j of sg.cand(X[i], Y[i])) if (segDist(X[i], Y[i], mapSegs[j]) <= theta) { mapOK[i] = 1; break; } }
    const grid = new PointGrid(theta); for (let i = 0; i < n; i++) if (mapOK[i]) grid.add(i, X[i], Y[i]);
    const stamp = new Int32Array(tr.nAgents).fill(-1), np = new Int32Array(n), ok = new Uint8Array(n), t2 = theta * theta;
    for (let i = 0; i < n; i++) {
      if (!mapOK[i]) continue;
      let c = 0; const xi = X[i], yi = Y[i], vi = V[i];
      grid.near(xi, yi, (j) => {
        const vj = V[j]; if (vj === vi || stamp[vj] === i) return;
        const dx = X[j] - xi, dy = Y[j] - yi; if (dx * dx + dy * dy > t2) return;
        stamp[vj] = i; c++; if (c >= k) return false;      // n_p counts distinct other volunteers
      });
      np[i] = c; ok[i] = c >= k ? 1 : 0;
    }
    // sequential sub-edges: extend while verified, close at the first unverified point
    const edges = []; let cur = [];
    const close = () => { if (cur.length >= 2) edges.push({ v: V[cur[0]], pts: cur.map((i) => [X[i], Y[i]]) }); cur = []; };
    for (let i = 0; i < n; i++) {
      if (i > 0 && V[i] !== V[i - 1]) close();
      if (ok[i]) { if (cur.length && Math.hypot(X[i] - X[cur[cur.length - 1]], Y[i] - Y[cur[cur.length - 1]]) > 4 * theta) close(); cur.push(i); }
      else close();
    }
    close();
    return { mapOK, np, ok, edges };
  }

  /* ---------------------------------------------------------- polyline utils */
  function resample(pts, sp) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const T = cum[cum.length - 1]; if (T <= sp) return [pts[0], pts[pts.length - 1]];
    const n = Math.max(1, Math.round(T / sp)), out = []; let j = 0;
    for (let i = 0; i <= n; i++) { const s = T * i / n; while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const f = cum[j + 1] > cum[j] ? (s - cum[j]) / (cum[j + 1] - cum[j]) : 0;
      out.push([pts[j][0] + f * (pts[j + 1][0] - pts[j][0]), pts[j][1] + f * (pts[j + 1][1] - pts[j][1])]); }
    return out;
  }
  function smooth(pts, h) {
    if (pts.length < 3) return pts;
    return pts.map((p, i) => { if (i === 0 || i === pts.length - 1) return p; let sx = 0, sy = 0, c = 0;
      for (let j = Math.max(0, i - h); j <= Math.min(pts.length - 1, i + h); j++) { sx += pts[j][0]; sy += pts[j][1]; c++; } return [sx / c, sy / c]; });
  }
  function splitByLength(pts, maxLen) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const T = cum[cum.length - 1]; if (T <= maxLen * (1 + 1e-9)) return [[pts[0], pts[pts.length - 1]]];
    const n = Math.ceil(T / maxLen - 1e-9), at = (s) => { let j = 0; while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const f = cum[j + 1] > cum[j] ? (s - cum[j]) / (cum[j + 1] - cum[j]) : 0; return [pts[j][0] + f * (pts[j + 1][0] - pts[j][0]), pts[j][1] + f * (pts[j + 1][1] - pts[j][1])]; };
    const out = []; for (let i = 0; i < n; i++) out.push([at(T * i / n), at(T * (i + 1) / n)]); return out;
  }

  /* ------------------------------------------ Algorithms 5 + 6: combination */
  function subdivide(net, l) {
    const subs = [];
    net.edges.forEach((e, ei) => {
      const A = net.nodes[e.a], B = net.nodes[e.b], n = Math.max(1, Math.ceil(e.len / l - 1e-9));
      for (let i = 0; i < n; i++) subs.push([A[0] + (B[0] - A[0]) * i / n, A[1] + (B[1] - A[1]) * i / n,
        A[0] + (B[0] - A[0]) * (i + 1) / n, A[1] + (B[1] - A[1]) * (i + 1) / n, ei]);
    });
    return subs;
  }
  function combine(net, verifiedEdges, theta, omega, l, minAgree) {
    const subs = subdivide(net, l), grid = new SegGrid(subs, Math.max(l, 2 * theta), theta);
    const chunks = [];
    for (const e of verifiedEdges) {
      const pts = smooth(resample(e.pts, 5), 1);
      for (const [p, q] of splitByLength(pts, l)) if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) chunks.push([p[0], p[1], q[0], q[1]]);
    }
    const support = new Int32Array(subs.length), step = theta / 4;
    for (const A of chunks) {                         // AGREE(e', e) for every nearby sub-edge e
      const L = Math.hypot(A[2] - A[0], A[3] - A[1]), n = Math.max(1, Math.ceil(L / step)), cnt = new Map();
      for (let i = 0; i <= n; i++) {
        const x = A[0] + (A[2] - A[0]) * i / n, y = A[1] + (A[3] - A[1]) * i / n;
        for (const j of grid.cand(x, y)) if (segDist(x, y, subs[j]) < theta) cnt.set(j, (cnt.get(j) || 0) + 1);
      }
      const hA = heading(A);
      for (const [j, c] of cnt) if (c >= (n + 1) / 2 && angDiff(hA, heading(subs[j])) <= omega) support[j]++;
    }
    const kept = Array.from(support, (s) => s >= minAgree);
    return { subs, support, kept, chunks: chunks.length };
  }

  /* ------------------------------- combined map + Algorithms 3 and 4 (junctions) */
  function combinedMap(verifiedEdges, r, htol) {
    const nx = [], ny = [], eu = [], ev = [], eh = [], adj = [], cnt = [], grid = new Map(), cell = r;
    const key = (ix, iy) => (ix + 50000) * 100000 + (iy + 50000);
    const has = (a, b) => adj[a].includes(b);
    const addNode = (x, y) => { nx.push(x); ny.push(y); adj.push([]); cnt.push(1); return nx.length - 1; };
    const addEdge = (a, b) => { if (a === b || has(a, b)) return -1; const k = eu.length; eu.push(a); ev.push(b);
      eh.push(Math.atan2(ny[b] - ny[a], nx[b] - nx[a]) / D2R); adj[a].push(b); adj[b].push(a);
      const x0 = Math.floor(Math.min(nx[a], nx[b]) / cell), x1 = Math.floor(Math.max(nx[a], nx[b]) / cell);
      const y0 = Math.floor(Math.min(ny[a], ny[b]) / cell), y1 = Math.floor(Math.max(ny[a], ny[b]) / cell);
      for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) { const kk = key(i, j); let L = grid.get(kk); if (!L) grid.set(kk, L = []); L.push(k); }
      return k; };
    const match = (px, py, h, excl) => {
      const bx = Math.floor(px / cell), by = Math.floor(py / cell); let best = -1, bd = Infinity;
      for (let i = bx - 1; i <= bx + 1; i++) for (let j = by - 1; j <= by + 1; j++) for (const k of grid.get(key(i, j)) || []) {
        if (k >= excl || angDiff(eh[k], h) > htol) continue;
        const d = segDist(px, py, [nx[eu[k]], ny[eu[k]], nx[ev[k]], ny[ev[k]]]); if (d <= r && d < bd) { bd = d; best = k; } }
      return best; };
    for (const e of verifiedEdges) {
      const pts = smooth(resample(e.pts, 5), 1); let prev = -1, prevM = false; const own = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)];
        const h = Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R, [px, py] = pts[i];
        const excl = own.length >= 5 ? own[own.length - 5] : (own.length ? own[0] : eu.length);
        const k = match(px, py, h, excl);
        if (k >= 0) {
          const A = eu[k], B = ev[k], anc = Math.hypot(nx[A] - px, ny[A] - py) <= Math.hypot(nx[B] - px, ny[B] - py) ? A : B;
          const c = ++cnt[anc]; nx[anc] += (px - nx[anc]) / c; ny[anc] += (py - ny[anc]) / c;
          if (prev >= 0 && !prevM) { const ne = addEdge(prev, anc); if (ne >= 0) own.push(ne); }
          prev = anc; prevM = true;
        } else {
          const nn = addNode(px, py); if (prev >= 0) { const ne = addEdge(prev, nn); if (ne >= 0) own.push(ne); }
          prev = nn; prevM = false;
        }
      }
    }
    return { nx, ny, adj: adj.map((a) => new Set(a)) };
  }

  function handleIntersections(G, rad) {        // Algorithm 4, calling INTERSECT (Algorithm 3)
    const { nx, ny, adj } = G, aliveN = adj.map((a) => a.size > 0), isJ = new Uint8Array(nx.length + 100000);
    const d = (a, b) => Math.hypot(nx[a] - nx[b], ny[a] - ny[b]);
    function intersect(A) {
      if (adj[A].size <= 2) return null;
      const grid = G._grid, local = new Set();
      const ix = Math.floor(nx[A] / rad), iy = Math.floor(ny[A] / rad);
      for (let i = ix - 1; i <= ix + 1; i++) for (let j = iy - 1; j <= iy + 1; j++) for (const n of grid.get((i + 50000) * 100000 + (j + 50000)) || [])
        if (aliveN[n] && d(n, A) <= rad) local.add(n);
      local.add(A);
      for (const nb of adj[A]) {
        if (!local.has(nb)) continue;
        const prev = new Map([[nb, -1]]), q = [nb]; let found = false;     // BFS nb -> A without edge (A, nb)
        while (q.length && !found) { const u = q.shift(); for (const w of adj[u]) {
          if (!local.has(w) || prev.has(w) || (u === nb && w === A)) continue; prev.set(w, u); if (w === A) { found = true; break; } q.push(w); } }
        if (!found) continue;
        const path = []; for (let u = A; u !== -1; u = prev.get(u)) path.push(u);
        if (path.length >= 3) return path;           // cycle of >= 3 edges, all within the threshold
      }
      return null;
    }
    const junctions = [];
    for (let pass = 0; pass < 10; pass++) {
      G._grid = new Map();
      for (let n = 0; n < nx.length; n++) if (aliveN[n]) { const k = (Math.floor(nx[n] / rad) + 50000) * 100000 + (Math.floor(ny[n] / rad) + 50000);
        let L = G._grid.get(k); if (!L) G._grid.set(k, L = []); L.push(n); }
      let changed = false; const N0 = nx.length;
      for (let A = 0; A < N0; A++) {
        if (!aliveN[A]) continue;
        const cyc = intersect(A); if (!cyc) continue;
        const cs = new Set(cyc), con = new Set();
        for (const c of cs) for (const w of adj[c]) if (!cs.has(w)) con.add(w);
        let sx = 0, sy = 0; for (const c of cs) { sx += nx[c]; sy += ny[c]; }
        const J = nx.length; nx.push(sx / cs.size); ny.push(sy / cs.size); adj.push(new Set()); aliveN.push(true); isJ[J] = 1;
        for (const c of cs) { for (const w of adj[c]) adj[w].delete(c); adj[c].clear(); aliveN[c] = false; }
        for (const w of con) { adj[J].add(w); adj[w].add(J); }
        changed = true;
      }
      if (!changed) break;
    }
    for (let n = 0; n < nx.length; n++) if (aliveN[n] && isJ[n] && adj[n].size > 2) junctions.push([nx[n], ny[n]]);
    const edges = []; for (let a = 0; a < nx.length; a++) if (aliveN[a]) for (const b of adj[a]) if (a < b) edges.push([nx[a], ny[a], nx[b], ny[b]]);
    return { junctions, edges };
  }

  /* --------------------------------------------------------------- pipeline */
  function run(net, destroyed, sim, p) {
    const t0 = performance.now();
    const mapSegs = net.edges.map((e) => [...net.nodes[e.a], ...net.nodes[e.b]]);
    const ver = verify(sim, mapSegs, p.theta, p.k);
    const t1 = performance.now();
    const G = combinedMap(ver.edges, p.theta, 45);
    const inter = handleIntersections(G, p.junctionRadius || 15);
    const t2 = performance.now();
    const comb = combine(net, ver.edges, p.theta, p.omega, p.l, 2);
    const t3 = performance.now();
    let alive = 0, aliveKept = 0, dead = 0, deadKept = 0, kept = 0;
    comb.subs.forEach((s, i) => { const isAlive = !destroyed.has(s[4]);
      if (isAlive) { alive++; if (comb.kept[i]) aliveKept++; } else { dead++; if (comb.kept[i]) deadKept++; }
      if (comb.kept[i]) kept++; });
    let nv = 0; for (let i = 0; i < sim.n; i++) nv += ver.ok[i];
    return { ver, inter, comb,
      metrics: { points: sim.n, verifiedPoints: nv, verifiedEdges: ver.edges.length, chunks: comb.chunks,
        junctions: inter.junctions.length, recall: alive ? aliveKept / alive : 0, precision: kept ? aliveKept / kept : 1,
        destroyedRemoved: dead ? 1 - deadKept / dead : 1, coverage: sim.coverage,
        ms: { verify: t1 - t0, intersections: t2 - t1, combine: t3 - t2 } } };
  }

  // Road segments between intersections (chains of degree-2 nodes); damage
  // takes out whole segments, so the demo destroys and toggles chains.
  function chains(net) {
    const deg = net.adj.map((a) => a.length), chainOf = new Int32Array(net.edges.length).fill(-1), list = [];
    for (let e0 = 0; e0 < net.edges.length; e0++) {
      if (chainOf[e0] >= 0) continue;
      const id = list.length, members = [e0]; chainOf[e0] = id;
      for (const start of [net.edges[e0].a, net.edges[e0].b]) {
        let node = start, from = e0;
        while (deg[node] === 2) {
          const nxt = net.adj[node].find(([, e]) => e !== from); if (!nxt || chainOf[nxt[1]] >= 0) break;
          chainOf[nxt[1]] = id; members.push(nxt[1]); from = nxt[1]; node = nxt[0];
        }
      }
      list.push(members);
    }
    return { chainOf, list };
  }

  function randomDestroy(net, pct, seed, ch) {
    ch = ch || chains(net);
    const r = rng(seed), idx = ch.list.map((_, i) => i), target = net.length * pct / 100, out = new Set();
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    let len = 0;
    for (const c of idx) { if (len >= target) break; for (const e of ch.list[c]) { out.add(e); len += net.edges[e].len; } }
    return out;
  }

  return { makeProj, syntheticGrid, fromCompact, fromOverpass, overpassQuery, decodeMVT, tilesFor, fromVectorTiles, simulate, verify, combine,
    combinedMap, handleIntersections, run, randomDestroy, chains, segDist };
})();
