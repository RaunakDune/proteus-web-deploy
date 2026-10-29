/* DEIMOSBC engine: browser port of github.com/RaunakDune/deimosbc-implementation.
   Works in local metres on the same network objects as the Proteus engine
   ({ nodes, edges, adj, bbox, proj }). One tick is one second. */
const Deimos = (() => {
  "use strict";

  /* ------------------------------------------------------------ utilities */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const bearing = (a, b) => ((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI) + 360) % 360;
  const angleDiff = (h1, h2) => { const d = Math.abs(h1 - h2) % 360; return d > 180 ? 360 - d : d; };
  const lineDiff = (h1, h2) => { const d = angleDiff(h1, h2); return d > 90 ? 180 - d : d; };
  function project(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    if (!l2) return [0, a];
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return [t, [a[0] + t * dx, a[1] + t * dy]];
  }
  const psd = (p, a, b) => dist(p, project(p, a, b)[1]);

  /* --------------------------------------------------------------- SHA-256 */
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const W = new Uint32Array(64);
  function sha256(str) {
    const msg = new TextEncoder().encode(str), len = msg.length, nb = ((len + 9 + 63) >> 6) << 6, buf = new Uint8Array(nb);
    buf.set(msg); buf[len] = 0x80;
    const bits = len * 8, dv = new DataView(buf.buffer);
    dv.setUint32(nb - 4, bits >>> 0); dv.setUint32(nb - 8, Math.floor(bits / 4294967296));
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (let o = 0; o < nb; o += 64) {
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) {
        const a = W[i - 15], b = W[i - 2];
        const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
        const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }

  /* -------------------------------------------------------- hurricane damage */
  // Flood zones grow from random centres until they cover ~80% of the target
  // length; scattered debris blocks the rest.
  function floodDamage(net, pct, seed) {
    const r = rng(seed), [x0, y0, x1, y1] = net.bbox, Wd = x1 - x0, Hd = y1 - y0;
    const target = net.length * pct / 100, blocked = new Set(), floods = [];
    if (pct <= 0) return { blocked, floods };
    const mid = net.edges.map((e) => { const a = net.nodes[e.a], b = net.nodes[e.b]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; });
    const nz = Math.max(1, Math.round(1 + pct / 12));
    for (let i = 0; i < nz; i++) floods.push({ x: x0 + (0.15 + 0.7 * r()) * Wd, y: y0 + (0.15 + 0.7 * r()) * Hd, k: 0.6 + 0.8 * r(), r: 0 });
    let len = 0;
    for (let rad = 10; len < 0.8 * target && rad < 2 * Math.max(Wd, Hd); rad += 10) {
      for (const z of floods) z.r = rad * z.k;
      for (let i = 0; i < mid.length; i++) {
        if (blocked.has(i)) continue;
        if (floods.some((z) => dist(mid[i], [z.x, z.y]) <= z.r)) { blocked.add(i); len += net.edges[i].len; }
      }
    }
    const idx = net.edges.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    for (const i of idx) { if (len >= target) break; if (!blocked.has(i)) { blocked.add(i); len += net.edges[i].len; } }
    return { blocked, floods: floods.map(({ x, y, r }) => ({ x, y, r })) };
  }

  /* ------------------------------------------------- Data Summarization: map */
  // Port of deimosbc/mapping/graph.py: anchored vertices, per-trace edge
  // support, local maps by task cell, grid spatial index.
  class MapGraph {
    constructor(cell, cellOf) {
      this.cs = cell; this.cellOf = cellOf; this.V = new Map(); this.adj = new Map(); this.E = new Map();
      this.hz = new Map(); this.vg = new Map(); this.eg = new Map(); this.next = 1; this.hist = []; this.now = 0;
    }
    static key(u, v) { return u < v ? u + "," + v : v + "," + u; }
    gk(x, y) { return Math.floor(x / this.cs) + "," + Math.floor(y / this.cs); }
    around(p, r) {
      const out = [], gx0 = Math.floor((p[0] - r) / this.cs), gx1 = Math.floor((p[0] + r) / this.cs);
      const gy0 = Math.floor((p[1] - r) / this.cs), gy1 = Math.floor((p[1] + r) / this.cs);
      for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) out.push(gx + "," + gy);
      return out;
    }
    pos(v) { return this.V.get(v).p; }
    ends(k) { const e = this.E.get(k); return [this.pos(e.u), this.pos(e.v)]; }
    elen(k) { const [a, b] = this.ends(k); return dist(a, b); }
    edgesNear(p, r) {
      const seen = new Set(), out = [];
      for (const c of this.around(p, r)) { const s = this.eg.get(c); if (!s) continue;
        for (const k of s) { if (seen.has(k)) continue; seen.add(k); const [a, b] = this.ends(k), d = psd(p, a, b); if (d <= r) out.push([d, k]); } }
      out.sort((x, y) => x[0] - y[0] || (x[1] < y[1] ? -1 : 1));
      return out;
    }
    hazardsNear(p, r) { const out = []; for (const hs of this.hz.values()) for (const h of hs) if (dist(p, [h.x, h.y]) <= r) out.push(h); return out; }
    addVertex(p) { const id = this.next++; this.V.set(id, { p: [p[0], p[1]], traces: new Set() }); this.adj.set(id, new Set());
      const g = this.gk(p[0], p[1]); if (!this.vg.has(g)) this.vg.set(g, new Set()); this.vg.get(g).add(id); return id; }
    removeVertex(id) { const v = this.V.get(id); this.V.delete(id); this.adj.delete(id); const s = this.vg.get(this.gk(v.p[0], v.p[1])); if (s) s.delete(id); }
    edgeCells(a, b) { const out = [];
      const gx0 = Math.floor(Math.min(a[0], b[0]) / this.cs), gx1 = Math.floor(Math.max(a[0], b[0]) / this.cs);
      const gy0 = Math.floor(Math.min(a[1], b[1]) / this.cs), gy1 = Math.floor(Math.max(a[1], b[1]) / this.cs);
      for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) out.push(gx + "," + gy); return out; }
    putEdge(u, v, support) {
      const k = MapGraph.key(u, v), a = this.pos(u), b = this.pos(v), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const e = { u: Math.min(u, v), v: Math.max(u, v), cell: this.cellOf(mid), support, hid: this.hist.length };
      this.hist.push({ a, b, born: this.now, died: Infinity });
      this.E.set(k, e); this.adj.get(u).add(v); this.adj.get(v).add(u);
      for (const c of this.edgeCells(a, b)) { if (!this.eg.has(c)) this.eg.set(c, new Set()); this.eg.get(c).add(k); }
      return e;
    }
    dropEdge(k) {
      const e = this.E.get(k), [a, b] = this.ends(k);
      for (const c of this.edgeCells(a, b)) { const s = this.eg.get(c); if (s) s.delete(k); }
      this.hist[e.hid].died = this.now;
      this.E.delete(k); this.adj.get(e.u).delete(e.v); this.adj.get(e.v).delete(e.u);
    }
    addSupport(u, v, tid, col) {
      const k = MapGraph.key(u, v), e = this.E.get(k);
      if (e) { e.support.set(tid, col); return [false, this.elen(k)]; }
      this.putEdge(u, v, new Map([[tid, col]])); return [true, this.elen(k)];
    }
    split(k, p) {
      const e = this.E.get(k), sup = new Map(e.support), u = e.u, v = e.v;
      this.dropEdge(k);
      const w = this.addVertex(p);
      this.putEdge(u, w, new Map(sup)); this.putEdge(v, w, new Map(sup));
      for (const t of sup.keys()) this.V.get(w).traces.add(t);
      return w;
    }
    hopPath(s, t, maxLen, maxHops) {
      if (s === t) return [s];
      const pq = [[0, 0, s, [s]]], best = new Map([[s, 0]]);
      while (pq.length) {
        pq.sort((a, b) => b[0] - a[0]); const [d, hops, u, path] = pq.pop();
        if (u === t) return path;
        if (hops >= maxHops) continue;
        for (const w of [...this.adj.get(u)].sort((a, b) => a - b)) {
          const nd = d + dist(this.pos(u), this.pos(w));
          if (nd <= maxLen && nd < (best.has(w) ? best.get(w) : Infinity)) { best.set(w, nd); pq.push([nd, hops + 1, w, path.concat([w])]); }
        }
      }
      return null;
    }
    removeTrace(tid) {
      let removed = 0;
      for (const [k, e] of [...this.E]) if (e.support.has(tid)) { e.support.delete(tid); if (!e.support.size) { removed += this.elen(k); this.dropEdge(k); } }
      for (const [id, v] of [...this.V]) { v.traces.delete(tid); if (!this.adj.get(id).size) this.removeVertex(id); }
      this.hz.delete(tid);
      return removed;
    }
    collectors(e) { return new Set(e.support.values()).size; }
    snapshot(minSupport) {
      const segs = [];
      for (const e of this.E.values()) {
        const n = this.collectors(e); if (n < minSupport) continue;
        const a = this.pos(e.u), b = this.pos(e.v); segs.push([+a[0].toFixed(2), +a[1].toFixed(2), +b[0].toFixed(2), +b[1].toFixed(2), n]);
      }
      segs.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2] || p[3] - q[3]);
      const hazards = [];
      for (const hs of this.hz.values()) for (const h of hs) hazards.push([+h.x.toFixed(2), +h.y.toFixed(2)]);
      return { segs, hazards };
    }
  }

  // Port of OverlapChainMerger (deimosbc/mapping/merger.py).
  function makeMerger(p) {
    const r = p.mergeRadius, maxDev = p.maxAngleDev, minRun = p.conflictRun, hr = p.hazardRadius;
    function findConflicts(g, pts, hazards, tid) {
      const rep = { geo: new Set(), haz: new Set(), trav: new Set() }, run = new Map();
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], sl = dist(a, b); if (!sl) continue;
        const h = bearing(a, b), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const mis = new Set(); let aligned = false;
        for (const [, k] of g.edgesNear(mid, r)) {
          const [ea, eb] = g.ends(k);
          if (psd(a, ea, eb) > r || psd(b, ea, eb) > r || !dist(ea, eb)) continue;
          if (lineDiff(h, bearing(ea, eb)) <= maxDev) { aligned = true; break; }
          for (const t of g.E.get(k).support.keys()) if (t !== tid) mis.add(t);
        }
        const cur = aligned ? new Set() : mis;
        for (const t of [...run.keys()]) if (!cur.has(t)) run.delete(t);
        for (const t of cur) { const v = (run.get(t) || 0) + sl; run.set(t, v); if (v >= minRun) rep.geo.add(t); }
        for (const hz of g.hazardsNear(mid, hr + sl / 2)) {
          if (hz.trace === tid) continue;
          if (hz.heading != null && lineDiff(hz.heading, h) > maxDev) continue;
          if (psd([hz.x, hz.y], a, b) <= hr) rep.haz.add(hz.trace);
        }
      }
      for (const hz of hazards) for (const [, k] of g.edgesNear([hz.x, hz.y], hr)) {
        const [ea, eb] = g.ends(k);
        if (hz.heading != null && lineDiff(hz.heading, bearing(ea, eb)) > maxDev) continue;
        for (const t of g.E.get(k).support.keys()) if (t !== tid) rep.trav.add(t);
      }
      rep.any = rep.geo.size + rep.haz.size + rep.trav.size > 0;
      return rep;
    }
    function snap(g, p, exclude) {
      let best = null, bd = r;
      for (const c of g.around(p, r)) { const s = g.vg.get(c); if (!s) continue;
        for (const id of s) { if (exclude.has(id)) continue; const d = dist(p, g.pos(id)); if (d < bd || (d === bd && best !== null && id < best)) { best = id; bd = d; } } }
      if (best !== null) return [best, false];
      for (const [, k] of g.edgesNear(p, r)) {
        const e = g.E.get(k); if (exclude.has(e.u) || exclude.has(e.v)) continue;
        const [ea, eb] = g.ends(k), q = project(p, ea, eb)[1];
        if (dist(q, ea) < 1) return [e.u, false];
        if (dist(q, eb) < 1) return [e.v, false];
        return [g.split(k, q), true];
      }
      return [g.addVertex(p), true];
    }
    function connect(g, u, v, tid, col, res) {
      if (!g.V.has(u) || !g.V.has(v)) return;
      if (!g.E.has(MapGraph.key(u, v))) {
        const d = dist(g.pos(u), g.pos(v)), path = g.hopPath(u, v, 1.3 * d + r, 4);
        if (path && path.length > 2) { for (let i = 0; i + 1 < path.length; i++) res.matched += g.addSupport(path[i], path[i + 1], tid, col)[1]; return; }
      }
      const [isNew, len] = g.addSupport(u, v, tid, col);
      if (isNew) { res.added += len; const c = g.E.get(MapGraph.key(u, v)).cell; res.byCell.set(c, (res.byCell.get(c) || 0) + len); }
      else res.matched += len;
    }
    function integrate(g, pts, hazards, tid, col) {
      const res = { added: 0, matched: 0, byCell: new Map(), path: [] }, created = new Set(), along = [];
      let cum = 0;
      for (let i = 0; i < pts.length; i++) {
        if (i) cum += dist(pts[i - 1], pts[i]);
        const ex = new Set(); for (let j = 0; j < res.path.length; j++) if (cum - along[j] < 3 * r && created.has(res.path[j])) ex.add(res.path[j]);
        const [vid, made] = snap(g, pts[i], ex); if (made) created.add(vid);
        g.V.get(vid).traces.add(tid);
        if (res.path.length && res.path[res.path.length - 1] === vid) continue;
        if (res.path.length) connect(g, res.path[res.path.length - 1], vid, tid, col, res);
        res.path.push(vid); along.push(cum);
      }
      for (const hz of hazards) { if (!g.hz.has(tid)) g.hz.set(tid, []); g.hz.get(tid).push({ x: hz.x, y: hz.y, heading: hz.heading, trace: tid, col }); }
      for (const id of created) if (g.V.has(id) && !g.adj.get(id).size) g.removeVertex(id);
      return res;
    }
    return { findConflicts, integrate };
  }

  /* --------------------------------------------------------------- metrics */
  class SegIndex {
    constructor(segs, cell = 50) { this.c = cell; this.segs = segs; this.g = new Map();
      segs.forEach((s, i) => { for (const k of this.cells(s[0], s[1], s[2], s[3], 0)) { if (!this.g.has(k)) this.g.set(k, []); this.g.get(k).push(i); } }); }
    cells(ax, ay, bx, by, pad) { const out = [];
      for (let gx = Math.floor((Math.min(ax, bx) - pad) / this.c); gx <= Math.floor((Math.max(ax, bx) + pad) / this.c); gx++)
        for (let gy = Math.floor((Math.min(ay, by) - pad) / this.c); gy <= Math.floor((Math.max(ay, by) + pad) / this.c); gy++) out.push(gx + "," + gy);
      return out; }
    near(p, tol) { for (const k of this.cells(p[0], p[1], p[0], p[1], tol)) { const l = this.g.get(k); if (!l) continue;
      for (const i of l) { const s = this.segs[i]; if (psd(p, [s[0], s[1]], [s[2], s[3]]) <= tol) return true; } } return false; }
  }
  function samples(a, b, step) { const L = dist(a, b), n = Math.max(1, Math.round(L / step)), out = [];
    for (let i = 0; i <= n; i++) out.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return out; }
  function evaluate(segs, net, blocked, tol = 15) {
    const open = [], blk = [];
    net.edges.forEach((e, i) => { const a = net.nodes[e.a], b = net.nodes[e.b]; (blocked.has(i) ? blk : open).push([a[0], a[1], b[0], b[1]]); });
    const mi = new SegIndex(segs), oi = new SegIndex(open);
    let rh = 0, rt = 0, ph = 0, pt = 0, ch = 0, ct = 0;
    for (const s of open) for (const p of samples([s[0], s[1]], [s[2], s[3]], 5)) { rt++; rh += mi.near(p, tol); }
    for (const s of segs) for (const p of samples([s[0], s[1]], [s[2], s[3]], 5)) { pt++; ph += oi.near(p, tol); }
    for (const s of blk) { const a = [s[0], s[1]], b = [s[2], s[3]];
      for (const p of samples(a, b, 5)) { if (dist(p, a) <= 25 || dist(p, b) <= 25) continue; ct++; ch += mi.near(p, tol); } }
    // released segments that sit on blocked streets (drawn as "false passable")
    const bi = new SegIndex(blk), falseSeg = segs.map((s) => { const m = [(s[0] + s[2]) / 2, (s[1] + s[3]) / 2]; return bi.near(m, 8) && !oi.near(m, 12); });
    return { recall: rt ? rh / rt : 0, precision: pt ? ph / pt : 0, contamination: ct ? ch / ct : 0, falseSeg,
      mappedLength: segs.reduce((s, q) => s + Math.hypot(q[2] - q[0], q[3] - q[1]), 0) };
  }

  /* ----------------------------------------------------- volunteer movement */
  function largestOpenComponent(net, blocked) {
    const comp = new Int32Array(net.nodes.length).fill(-1); let best = -1, bestSize = 0, c = 0;
    for (let s = 0; s < net.nodes.length; s++) {
      if (comp[s] >= 0 || !net.adj[s].some(([, e]) => !blocked.has(e))) continue;
      const st = [s]; comp[s] = c; let size = 0;
      while (st.length) { const u = st.pop(); size++; for (const [v, e] of net.adj[u]) if (!blocked.has(e) && comp[v] < 0) { comp[v] = c; st.push(v); } }
      if (size > bestSize) { bestSize = size; best = c; } c++;
    }
    const out = []; for (let i = 0; i < comp.length; i++) if (comp[i] === best) out.push(i);
    return out;
  }
  // Dijkstra over open streets with a binary heap and early exit.
  function shortestPath(net, blocked, s, t) {
    if (s === t) return [s];
    const n = net.nodes.length, d = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), heap = [];
    const push = (k, v) => { heap.push([k, v]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0;
      for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    d[s] = 0; push(0, s);
    while (heap.length) {
      const [du, u] = pop(); if (u === t) break; if (du > d[u]) continue;
      for (const [v, e] of net.adj[u]) { if (blocked.has(e)) continue; const nd = du + net.edges[e].len; if (nd < d[v]) { d[v] = nd; prev[v] = u; push(nd, v); } }
    }
    if (prev[t] < 0) return null;
    const path = [t]; while (path[path.length - 1] !== s) path.push(prev[path[path.length - 1]]);
    return path.reverse();
  }
  class Walker {
    constructor(net, blocked, start, r, speed) { this.net = net; this.bl = blocked; this.node = start; this.pos = net.nodes[start].slice();
      this.r = r; this.speed = speed; this.path = []; this.prog = 0; this.visited = new Set(); this.reported = new Set(); }
    get idle() { return !this.path.length; }
    plan(target) {
      if (this.path.length && this.prog > 0) { const via = this.path[0], p = shortestPath(this.net, this.bl, via, target); if (!p) return false; this.path = p; }
      else { const p = shortestPath(this.net, this.bl, this.node, target); if (!p) return false; this.path = p.slice(1); this.prog = 0; }
      return true;
    }
    nearest(p, among) { let best = among[0], bd = Infinity; for (const i of among) { const d = dist(this.net.nodes[i], p); if (d < bd) { bd = d; best = i; } } return best; }
    goTo(p, comp) { return this.plan(this.nearest(p, comp)); }
    explore(rect, comp) {
      const [x0, y0, x1, y1] = rect, m = 30, inside = comp.filter((i) => { const q = this.net.nodes[i]; return q[0] >= x0 - m && q[0] <= x1 + m && q[1] >= y0 - m && q[1] <= y1 + m; });
      if (!inside.length) return this.goTo([(x0 + x1) / 2, (y0 + y1) / 2], comp);
      const w = inside.map((n) => 1 + 4 * this.net.adj[n].filter(([, e]) => !this.bl.has(e) && !this.visited.has(e)).length);
      let tot = w.reduce((s, x) => s + x, 0), pick = this.r() * tot, k = 0;
      while (pick > w[k]) { pick -= w[k]; k++; }
      const target = inside[Math.min(k, inside.length - 1)];
      if (target === this.node && !this.path.length) return false;
      return this.plan(target);
    }
    step(onNode) {
      let budget = this.speed;
      while (budget > 0 && this.path.length) {
        const nxt = this.path[0], a = this.net.nodes[this.node], b = this.net.nodes[nxt], seg = dist(a, b), rem = seg - this.prog;
        if (budget >= rem) { budget -= rem;
          for (const [v, e] of this.net.adj[this.node]) if (v === nxt) this.visited.add(e);
          this.node = nxt; this.path.shift(); this.prog = 0; this.pos = b.slice(); onNode(nxt);
        } else { this.prog += budget; const t = seg ? this.prog / seg : 1; this.pos = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; budget = 0; }
      }
    }
  }

  /* ------------------------------------------------ Trace Management System */
  function makeTMS(p) {
    return { last: null, cur: [], done: [],
      feed(fx) {
        if (this.last) { const d = dist(this.last, fx); if (d < p.sampleDisp) return; if (d > 0.8 * p.maxSpeed * Math.max(fx[2] - this.last[2], 0)) return; }
        this.last = fx; const c = this.cur;
        if (c.length && dist(c[c.length - 1], fx) > p.segGap) this.close(false);
        if (this.cur.length >= 2) { const n = this.cur.length;
          if (angleDiff(bearing(this.cur[n - 2], this.cur[n - 1]), bearing(this.cur[n - 1], fx)) > p.segAngle) this.close(true); }
        this.cur.push(fx); if (this.cur.length >= p.maxPts) this.close(true);
      },
      close(carry) { const c = this.cur;
        if (c.length >= p.minPts) { const s = [c[0]];
          for (let i = 1; i + 1 < c.length; i++) s.push([(c[i - 1][0] + c[i][0] + c[i + 1][0]) / 3, (c[i - 1][1] + c[i][1] + c[i + 1][1]) / 3, c[i][2]]);
          s.push(c[c.length - 1]); this.done.push(s); }
        this.cur = carry && c.length ? [c[c.length - 1]] : []; },
      flush() { if (this.cur.length) this.close(false); this.last = null; },
      pop() { const d = this.done; this.done = []; return d; } };
  }

  /* --------------------------------------------------------------- defaults */
  const PROTOCOL = { cell: 250, sampleDisp: 10, segAngle: 60, segGap: 60, minPts: 3, maxPts: 120, minSpacing: 2, maxGap: 80, maxSpeed: 15,
    taskTol: 100, mergeRadius: 15, maxAngleDev: 35, conflictRun: 40, hazardRadius: 15, policy: "discard_both", minSupport: 1,
    balance: 100, stake: 10, reward: 2, rewardPerM: 0.02, maxErrors: 3, maxReauths: 2, taskDone: 350, claimTimeout: 120,
    blockEvery: 5, window: 40, minSamples: 20, freezeRate: 0.6, releaseEvery: 24, releaseQuiet: 12 };

  /* ------------------------------------------------------------ simulation */
  // o: { agents, minutes, sigma, fabricate, spam, faulty, processors, range, tamper, seed, ...protocol overrides }
  function simulate(net, blocked, o) {
    const p = Object.assign({}, PROTOCOL, o.protocol || {});
    const r = rng(o.seed >>> 0), T = Math.round(o.minutes * 60), FR = 5;
    const comp = largestOpenComponent(net, blocked);
    const [bx0, by0, bx1, by1] = net.bbox, nx = Math.max(1, Math.ceil((bx1 - bx0) / p.cell)), ny = Math.max(1, Math.ceil((by1 - by0) / p.cell));
    const cellOf = (q) => { const cx = Math.min(nx - 1, Math.max(0, Math.floor((q[0] - bx0) / p.cell))), cy = Math.min(ny - 1, Math.max(0, Math.floor((q[1] - by0) / p.cell))); return cy * nx + cx; };
    const cellRect = (c) => { const cx = c % nx, cy = Math.floor(c / nx); return [bx0 + cx * p.cell, by0 + cy * p.cell, bx0 + (cx + 1) * p.cell, by0 + (cy + 1) * p.cell]; };
    const inArea = (q) => q[0] >= bx0 - 100 && q[0] <= bx1 + 100 && q[1] >= by0 - 100 && q[1] <= by1 + 100;

    /* ---- genesis: processors (authorities) and tasks */
    const nP = o.processors, procs = [], gw = Math.ceil(Math.sqrt(nP)), gh = Math.ceil(nP / gw), sites = [];
    for (let i = 0; i < gh; i++) for (let j = 0; j < gw; j++) sites.push([bx0 + (j + 0.5) * (bx1 - bx0) / gw, by0 + (i + 0.5) * (by1 - by0) / gh]);
    const ctr = [(bx0 + bx1) / 2, (by0 + by1) / 2]; sites.sort((a, b) => dist(a, ctr) - dist(b, ctr));
    for (let i = 0; i < nP; i++) {
      let best = comp[0], bd = Infinity; for (const n of comp) { const d = dist(net.nodes[n], sites[i]); if (d < bd) { bd = d; best = n; } }
      procs.push({ name: "P" + i, pos: net.nodes[best].slice(), tamper: !!o.tamper && i === nP - 1 });
    }
    const cellLen = new Map();
    net.edges.forEach((e, i) => { if (blocked.has(i)) return; const a = net.nodes[e.a], b = net.nodes[e.b], c = cellOf([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); cellLen.set(c, (cellLen.get(c) || 0) + e.len); });
    const tasks = new Map();
    for (const [c, L] of [...cellLen].sort((a, b) => a[0] - b[0])) if (L >= 100) tasks.set(c, { cell: c, mapped: 0, need: Math.min(p.taskDone, 0.5 * L), status: "open", claim: null, claimH: 0 });

    /* ---- volunteers */
    const N = o.agents, roles = [];
    const nf = Math.round(o.fabricate / 100 * N), ns = Math.round(o.spam / 100 * N), nb = Math.round(o.faulty / 100 * N);
    for (let i = 0; i < N; i++) roles.push(i < nf ? "fabricate" : i < nf + ns ? "spam" : i < nf + ns + nb ? "faulty" : "honest");
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [roles[i], roles[j]] = [roles[j], roles[i]]; }
    const cols = roles.map((role, i) => {
      const faulty = role === "faulty", jit = faulty ? 18 : o.sigma, off = faulty ? 35 : 2, ang = r() * 2 * Math.PI;
      return { id: "C" + i, role, w: new Walker(net, blocked, comp[Math.floor(r() * comp.length)], rng(Math.floor(r() * 2 ** 31)), 1.1 + 0.6 * r()),
        jit, bias: [off * Math.cos(ang), off * Math.sin(ang)], dup: faulty ? 0.2 : 0.02, del: faulty ? 0.15 : 0.03,
        tms: makeTMS(p), pendHaz: [], queue: [], seq: 0, task: null, lastTask: null, pendClaim: -1, mode: "", lastFix: null, local: "active", known: 0 };
    });
    const acct = new Map(cols.map((c) => [c.id, { status: "active", balance: p.balance, errors: 0, reauths: 0, accepted: 0, rejected: 0, disputed: 0, claimed: new Set() }]));

    /* ---- chain state */
    const g = new MapGraph(p.mergeRadius, cellOf), merger = makeMerger(p);
    const traces = new Map(), recent = [], releases = [], blocks = [], mempool = [], seenPkt = new Set();
    let appHash = sha256("genesis|" + JSON.stringify({ processors: procs.map((x) => x.name), volunteers: N, protocol: p })), frozen = false, freezeAt = null;
    let lastChangeH = 0, pendingRelease = false, pendingFreeze = null, rejectedProposals = 0;
    blocks.push(header({ h: 0, t: 0, proposer: "genesis", prev: "0".repeat(64), txs: [], attest: [] }));
    const errRate = () => recent.length ? recent.filter(Boolean).length / recent.length : 0;
    const pushRecent = (x) => { recent.push(x); if (recent.length > p.window) recent.shift(); };

    function header(b) {
      b.txRoot = sha256(JSON.stringify(b.txs)); b.app = appHash;
      b.hash = sha256(JSON.stringify([b.h, b.t, b.proposer, b.prev, b.txRoot, b.app])); return b;
    }

    function recordError(id, why, ev) {
      const a = acct.get(id); a.errors++;
      if (a.status === "active" && a.errors >= p.maxErrors) {
        a.status = a.reauths >= p.maxReauths ? "disabled" : "suspended"; ev.push(`${id} ${a.status}`);
        for (const t of tasks.values()) if (t.claim === id) t.claim = null;
      }
    }
    function discard(tid, against, ev) {
      const tr = traces.get(tid); if (!tr || tr.status !== "accepted") return;
      g.removeTrace(tid); tr.status = "disputed"; const a = acct.get(tr.col); a.disputed++; recordError(tr.col, "conflict", ev);
    }

    function execSubmit(pkt, h, ev) {
      const a = acct.get(pkt.col), tid = pkt.id;
      if (a.status !== "active") return { code: "collector_not_active" };
      if (traces.has(tid)) return { code: "duplicate_packet" };
      if (a.balance < p.stake) return { code: "insufficient_stake" };
      const pts = pkt.pts.map((q) => [q[0], q[1]]), ts = pkt.pts.map((q) => q[2]);
      let why = null;
      if (!a.claimed.has(pkt.task)) why = "task_not_claimed";
      else if (pts.length < p.minPts) why = "too_few_points";
      else if (pts.length > p.maxPts) why = "too_many_points";
      else if (!pts.every(inArea)) why = "outside_area";
      else {
        for (let i = 0; i + 1 < pts.length && !why; i++) { const d = dist(pts[i], pts[i + 1]), dt = ts[i + 1] - ts[i];
          if (d < p.minSpacing) why = "points_too_close"; else if (d > p.maxGap) why = "gap_too_large"; else if (dt <= 0 || d / dt > p.maxSpeed) why = "implausible_speed"; }
        if (!why) { const [x0, y0, x1, y1] = cellRect(pkt.task);
          if (!pts.some((q) => q[0] >= x0 - p.taskTol && q[0] <= x1 + p.taskTol && q[1] >= y0 - p.taskTol && q[1] <= y1 + p.taskTol)) why = "outside_task"; }
      }
      if (why) {
        a.balance -= p.stake; a.rejected++; traces.set(tid, { col: pkt.col, status: "rejected", why }); pushRecent(true);
        recordError(pkt.col, why, ev); return { code: "ok", status: "rejected", why };
      }
      const hz = pkt.haz.map((q) => ({ x: q[0], y: q[1], heading: q[2] }));
      const rep = merger.findConflicts(g, pts, hz, tid);
      if (rep.any) {
        const all = new Set([...rep.geo, ...rep.haz, ...rep.trav]); let losers = all, newLoses = true;
        if (p.policy === "evidence" && !rep.geo.size && !(rep.haz.size && rep.trav.size)) {
          const who = (t) => (t === tid ? pkt.col : traces.get(t).col);
          const hazSide = new Set([...rep.haz, ...(rep.trav.size ? [tid] : [])]), travSide = new Set([...rep.trav, ...(rep.haz.size ? [tid] : [])]);
          const nh = new Set([...hazSide].map(who)).size, nt = new Set([...travSide].map(who)).size;
          const lose = nt > nh ? hazSide : travSide; newLoses = lose.has(tid); losers = new Set([...lose].filter((t) => t !== tid));
        }
        for (const t of [...losers].sort()) discard(t, tid, ev);
        pushRecent(true); lastChangeH = h;
        if (newLoses) { traces.set(tid, { col: pkt.col, status: "disputed", why: "conflict" }); a.disputed++; recordError(pkt.col, "conflict", ev); return { code: "ok", status: "disputed", why: "conflict" }; }
      }
      const res = merger.integrate(g, pts, hz, tid, pkt.col);
      const reward = p.reward + Math.floor(res.added * p.rewardPerM);
      a.balance += reward; a.accepted++; traces.set(tid, { col: pkt.col, status: "accepted", added: res.added }); pushRecent(false);
      if (res.added > 0 || hz.length) lastChangeH = h;
      for (const [c, L] of res.byCell) { const t = tasks.get(c); if (!t || t.status !== "open") continue; t.mapped += L;
        if (t.mapped >= t.need) { t.status = "mapped"; t.claim = null; ev.push(`task ${c} mapped`); } }
      return { code: "ok", status: "accepted", added: res.added };
    }

    function execute(tx, h, ev) {
      if (frozen) return { code: "chain_frozen" };
      if (tx.kind === "submit") return execSubmit(tx.pkt, h, ev);
      if (tx.kind === "claim") {
        const a = acct.get(tx.col), t = tasks.get(tx.task);
        if (a.status !== "active") return { code: "collector_not_active" };
        if (!t || t.status !== "open") return { code: "task_already_mapped" };
        if (t.claim && t.claim !== tx.col) return { code: "task_unavailable" };
        for (const u of tasks.values()) if (u.claim === tx.col) u.claim = null;
        t.claim = tx.col; t.claimH = h; a.claimed.add(tx.task); return { code: "ok" };
      }
      if (tx.kind === "reauth") {
        const a = acct.get(tx.col); if (a.status !== "suspended") return { code: a.status === "disabled" ? "collector_disabled" : "not_suspended" };
        a.reauths++; a.errors = 0; a.status = "active"; a.balance = Math.max(a.balance, p.stake); return { code: "ok" };
      }
      if (tx.kind === "release") {
        const snap = g.snapshot(p.minSupport), root = sha256(JSON.stringify(snap));
        releases.push({ v: releases.length + 1, h, t: tx.t, root, segs: snap.segs, hazards: snap.hazards }); ev.push(`map v${releases.length} released`); return { code: "ok" };
      }
      if (tx.kind === "freeze") { frozen = true; freezeAt = { h, t: tx.t, rate: tx.rate }; ev.push("chain frozen"); return { code: "ok" }; }
      return { code: "unknown" };
    }

    function consensus(t) {
      if (frozen) return;
      const h = blocks.length;
      let proposer = null;
      for (let view = 0; view < nP; view++) { const cand = procs[(h + view) % nP];
        if (cand.tamper) { rejectedProposals++; continue; }   // honest majority rejects its app hash
        proposer = cand; break; }
      if (!proposer) return;
      g.now = t;
      const txs = mempool.splice(0, mempool.length), ev = [], summary = [];
      if (pendingRelease) { txs.push({ kind: "release", t }); pendingRelease = false; }
      if (pendingFreeze) { txs.push({ kind: "freeze", t, rate: pendingFreeze }); pendingFreeze = null; }
      const receipts = [];
      for (const tx of txs) {
        const rc = execute(tx, h, ev); tx.rc = rc; receipts.push(rc);
        summary.push(tx.kind === "submit" ? `trace ${tx.pkt.col}#${tx.pkt.seq} ${rc.status || rc.code}${rc.status === "accepted" ? " +" + Math.round(rc.added) + "m" : rc.why ? " (" + rc.why.replace(/_/g, " ") + ")" : ""}`
          : tx.kind === "claim" ? `claim ${tx.col} cell ${tx.task} ${rc.code === "ok" ? "assigned" : rc.code.replace(/_/g, " ")}`
          : tx.kind === "reauth" ? `re-authenticate ${tx.col} ${rc.code}` : tx.kind === "release" ? `release map v${releases.length}` : `freeze (error rate ${Math.round(tx.rate * 100)}%)`);
      }
      // claims time out so an absent volunteer can't hold a cell
      for (const tk of tasks.values()) if (tk.claim && h - tk.claimH > p.claimTimeout) tk.claim = null;
      appHash = sha256(appHash + "|" + h + "|" + JSON.stringify(receipts));
      const honest = procs.filter((x) => !x.tamper).map((x) => x.name);
      blocks.push(header({ h, t, proposer: proposer.name, prev: blocks[h - 1].hash, txs: summary, attest: honest, ev }));
      if (frozen) return;
      // governance, decided by the (honest) processors after each block
      const lastRelH = releases.length ? releases[releases.length - 1].h : 0;
      const allMapped = [...tasks.values()].every((x) => x.status !== "open");
      if (lastChangeH > lastRelH && (h - lastChangeH >= p.releaseQuiet || h - lastRelH >= p.releaseEvery || allMapped)) pendingRelease = true;
      if (recent.length >= p.minSamples && errRate() >= p.freezeRate) pendingFreeze = errRate();
    }

    /* ---- main loop */
    const frames = [], statusFrames = [], stat = { uploads: 0, delays: [] }, hazAll = [];
    const inRange = (q) => procs.some((x) => dist(q, x.pos) <= o.range);
    const nearestProc = (q) => procs.reduce((b, x) => (dist(q, x.pos) < dist(q, b.pos) ? x : b), procs[0]);
    const openTasks = () => [...tasks.values()].filter((x) => x.status === "open" && !x.claim);
    const ST = { active: 0, suspended: 1, disabled: 2, stopped: 3 };

    function fabricate(c, t0) {
      const near = c.task != null ? (() => { const q = cellRect(c.task); return [(q[0] + q[2]) / 2, (q[1] + q[3]) / 2]; })() : c.w.pos;
      const cand = [...blocked].filter((i) => { const e = net.edges[i], a = net.nodes[e.a], b = net.nodes[e.b]; return dist([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], near) <= p.cell; });
      if (!cand.length) return null;
      const e = net.edges[cand[Math.floor(c.w.r() * cand.length)]]; let a = net.nodes[e.a], b = net.nodes[e.b];
      if (c.w.r() < 0.5) [a, b] = [b, a];
      const n = Math.max(3, Math.floor(dist(a, b) / 10) + 1), out = [];
      for (let i = 0; i < n; i++) { const f = i / (n - 1); out.push([a[0] + f * (b[0] - a[0]) + gauss(c.w.r) * 2, a[1] + f * (b[1] - a[1]) + gauss(c.w.r) * 2, t0 + Math.round(i * 10 / 1.4)]); }
      return out;
    }
    function packTraces(c) {
      for (const tr of c.tms.pop()) {
        const task = c.task != null ? c.task : c.lastTask; if (task == null) continue;
        let pts = tr, haz = [];
        if (c.role === "fabricate") { pts = fabricate(c, tr[0][2]); if (!pts) continue; }
        else if (c.role === "spam") pts = tr.map((q, i) => [bx0 + r() * (bx1 - bx0), by0 + r() * (by1 - by0), tr[0][2] + i]);
        else {
          const [x0, y0, x1, y1] = cellRect(task);
          if (!tr.some((q) => q[0] >= x0 - p.taskTol && q[0] <= x1 + p.taskTol && q[1] >= y0 - p.taskTol && q[1] <= y1 + p.taskTol)) continue;
          haz = c.pendHaz; c.pendHaz = [];
        }
        c.queue.push({ id: c.id + ":" + c.seq, col: c.id, seq: c.seq++, task, pts, haz, made: tr[tr.length - 1][2], sent: false });
      }
    }

    for (let t = 1; t <= T; t++) {
      for (const c of cols) {
        const a = acct.get(c.id), here = inRange(c.w.pos);
        if (here) { c.local = frozen ? "stopped" : a.status; }          // the volunteer learns its on-chain status from a processor
        if (c.local === "stopped" && !frozen) c.local = a.status;
        // amplification: hearing the freeze from another volunteer
        if (frozen && c.local !== "stopped" && cols.some((d) => d.local === "stopped" && dist(d.w.pos, c.w.pos) <= o.range)) c.local = "stopped";
        if (c.local === "disabled" || c.local === "stopped") continue;
        if (here && c.task == null && c.pendClaim < 0 && c.local === "active") {
          const op = openTasks(); if (op.length) {
            const best = op.reduce((b, x) => { const q = cellRect(x.cell), d = dist([(q[0] + q[2]) / 2, (q[1] + q[3]) / 2], c.w.pos); return d < b[0] ? [d, x] : b; }, [Infinity, null])[1];
            c.pendClaim = best.cell; mempool.push({ kind: "claim", col: c.id, task: best.cell });
          }
        }
        if (here && c.pendClaim >= 0) { const tk = tasks.get(c.pendClaim);
          if (tk.claim === c.id) { c.task = c.pendClaim; c.lastTask = c.task; c.pendClaim = -1; }
          else if (tk.claim || tk.status !== "open") c.pendClaim = -1; }
        if (c.task != null && tasks.get(c.task).status !== "open" && here) c.task = null;
        if (here && c.local === "suspended" && !c.reauthAsked) { c.reauthAsked = true; mempool.push({ kind: "reauth", col: c.id }); }
        if (c.local === "active") c.reauthAsked = false;
        // movement
        const needProc = c.local === "suspended" || c.task == null || c.queue.length >= 4;
        if (needProc) { const pr = nearestProc(c.w.pos); if ((c.mode !== "proc" || c.w.idle) && dist(c.w.pos, pr.pos) > 0.5 * o.range) { c.mode = "proc"; c.w.goTo(pr.pos, comp); } }
        else if (c.mode !== "task" + c.task || c.w.idle) { c.mode = "task" + c.task; if (!c.w.explore(cellRect(c.task), comp)) c.w.path = []; }
        const moving = !c.w.idle;
        c.w.step((node) => {
          for (const [v, e] of net.adj[node]) { if (!blocked.has(e) || c.w.reported.has(e) || c.w.r() >= 0.7) continue;
            c.w.reported.add(e); const a0 = net.nodes[node], b0 = net.nodes[v], f = 0.3 + 0.15 * c.w.r();
            const hz = [a0[0] + f * (b0[0] - a0[0]) + gauss(r) * 3, a0[1] + f * (b0[1] - a0[1]) + gauss(r) * 3, bearing(a0, b0)];
            c.pendHaz.push(hz); hazAll.push({ col: c.id, x: hz[0], y: hz[1], t }); }
        });
        if (moving && c.local === "active") {
          if (r() >= c.del) {
            let fx;
            if (c.lastFix && r() < c.dup) fx = [c.lastFix[0], c.lastFix[1], t];
            else { fx = [c.w.pos[0] + c.bias[0] + gauss(r) * c.jit, c.w.pos[1] + c.bias[1] + gauss(r) * c.jit, t]; c.lastFix = fx; }
            c.tms.feed(fx); packTraces(c);
          }
        }
        // upload: one trace in flight; the rest wait for confirmation
        if (here && c.queue.length) {
          const head = c.queue[0];
          if (!head.sent && r() > 0.05) { head.sent = true; if (!seenPkt.has(head.id)) { seenPkt.add(head.id); head.tx = { kind: "submit", pkt: head }; mempool.push(head.tx); stat.uploads++; } }
          const tr = traces.get(head.id);
          if (head.sent && tr) { stat.delays.push(t - head.made); c.queue.shift(); }
          else if (head.sent && head.tx && head.tx.rc && head.tx.rc.code !== "ok") { head.sent = false; seenPkt.delete(head.id); head.tx = null; }  // retry after re-authentication
        }
      }
      if (t % p.blockEvery === 0) consensus(t);
      if (t % FR === 0) {
        const fpos = new Float32Array(N * 2), fst = new Uint8Array(N);
        cols.forEach((c, i) => { fpos[2 * i] = c.w.pos[0]; fpos[2 * i + 1] = c.w.pos[1]; fst[i] = ST[c.local] || 0; });
        frames.push(fpos); statusFrames.push(fst);
      }
      if (frozen && blocks[blocks.length - 1].t < t - 300) break;
    }

    /* ---- results */
    const finalRel = releases.length ? releases[releases.length - 1] : null;
    const relSegs = finalRel ? finalRel.segs : [];
    const m = evaluate(relSegs, net, blocked);
    const counts = { accepted: 0, rejected: 0, disputed: 0 }; for (const tr of traces.values()) counts[tr.status]++;
    const byRole = {}; for (const c of cols) { const a = acct.get(c.id), d = byRole[c.role] || (byRole[c.role] = { n: 0, accepted: 0, rejected: 0, disputed: 0, disabled: 0 });
      d.n++; d.accepted += a.accepted; d.rejected += a.rejected; d.disputed += a.disputed; d.disabled += a.status === "disabled"; }
    const ds = stat.delays.slice().sort((a, b) => a - b);
    const timeline = releases.map((x) => { const e = evaluate(x.segs, net, blocked); return { v: x.v, t: x.t, recall: e.recall, precision: e.precision, contamination: e.contamination }; });
    return { params: p, T, FR, frames, statusFrames, roles, procs, blocks, releases, finalRel, hist: g.hist, hazards: hazAll,
      liveSnap: g.snapshot(1), metrics: { ...m, ...counts, byRole, medianDelay: ds.length ? ds[Math.floor(ds.length / 2)] : null,
        blocks: blocks.length - 1, rejectedProposals, frozen, freezeAt, tasksMapped: [...tasks.values()].filter((x) => x.status !== "open").length, tasks: tasks.size },
      timeline, cellRect, nx, ny, tasks };
  }

  /* ------------------------------------------------------- chain audit demo */
  function verifyChain(blocks) {
    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.prev !== blocks[i - 1].hash) return { ok: false, at: i, why: "link to the previous block is broken" };
      if (sha256(JSON.stringify(b.txs)) !== b.txRoot) return { ok: false, at: i, why: "transactions don't match the signed transaction root" };
      if (sha256(JSON.stringify([b.h, b.t, b.proposer, b.prev, b.txRoot, b.app])) !== b.hash) return { ok: false, at: i, why: "header hash mismatch" };
    }
    return { ok: true };
  }

  return { simulate, floodDamage, evaluate, verifyChain, sha256, PROTOCOL, rng };
})();
if (typeof module !== "undefined") module.exports = Deimos;
