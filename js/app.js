/* Crowdsensing Lab site: Proteus demo UI. */
(() => {
"use strict";
const $ = (id) => document.getElementById(id);

/* ----------------------------------------------------------- page content */
const T2 = [["University of Houston campus", [["2-edge", 900, 340, 35.23, 4.8], ["3-edge", 900, 764, 90.11, 6.0], ["5-edge", 900, 755, 89.5, 13.5]]],
            ["Downtown Houston", [["2-edge", 6466, 2311, 40.79, 2.1], ["3-edge", 6466, 5172, 85.6, 3.0], ["5-edge", 6466, 5440, 92.8, 5.6]]]];
const T4 = [["University of Houston campus", [["2-edge", 340, 24.8], ["3-edge", 764, 64.5], ["5-edge", 755, 65.1]]],
            ["Downtown Houston", [["2-edge", 2311, 40.4], ["3-edge", 5172, 82.33], ["5-edge", 5440, 87.1]]]];
const T5 = [["University of Houston campus", 1400, 5600, 6100], ["Downtown Houston", 28000, 65000, 59000]];
const fmt = (n) => n.toLocaleString("en-US");
function tableHTML() {
  // Each table scrolls inside its own region, which keyboard users can reach and scroll.
  const wrap = (id, caption, head, body, note) =>
    `<div class="tbl" role="region" tabindex="0" aria-labelledby="${id}"><table><caption id="${id}">${caption}</caption>` +
    `<thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead>${body}</table><p class="tblnote">${note}</p></div>`;
  const bar = (v) => `<span class="bar" style="--w: ${v}%"></span>`;
  const group = (g, cols, rows) => `<tbody><tr class="grp"><th scope="rowgroup" colspan="${cols}">${g}</th></tr>${rows}</tbody>`;
  const a = T2.map(([g, rows]) => group(g, 4, rows.map((r) =>
    `<tr><th scope="row">${r[0]}</th><td class="v">${fmt(r[1])}</td><td class="v">${fmt(r[2])}</td><td class="v">${r[3].toFixed(1)}%${bar(r[3])}</td></tr>`).join(""))).join("");
  const b = T4.map(([g, rows]) => group(g, 3, rows.map((r) =>
    `<tr><th scope="row">${r[0]}</th><td class="v">${fmt(r[1])}</td><td class="v">${r[2].toFixed(1)}%${bar(r[2])}</td></tr>`).join(""))).join("");
  const c = `<tbody>${T5.map((r) => `<tr><th scope="row">${r[0]}</th><td class="v"><b>${fmt(r[1])}</b></td><td class="v">${fmt(r[2])}</td><td class="v">${fmt(r[3])}</td></tr>`).join("")}</tbody>`;
  $("tables").innerHTML =
    wrap("t-verify", "Edge verification", ["Model", "Input", "Verified", "Accuracy"], a, "Share of ground-truth edges reproduced (Table 2).") +
    wrap("t-combine", "Path combination", ["Model", "Input edges", "Similarity"], b, "Graph-edit-distance similarity of the combined map to ground truth (Table 4).") +
    wrap("t-deploy", "Volunteer deployment", ["Area", "Quadrants", "Whole map", "Random"], c, "Time steps until every node has been visited by three volunteers, 3-edge model (Table 5). Quadrant-based deployment covers both areas fastest.");
}
const DIRS = [
  ["Field trials with real phones", "Proteus has only seen simulated GPS noise. Real smartphone error is heavy-tailed: about 7 m standard deviation overall, with 95th-percentile errors near 18 m in suburban driving.",
   "Collect traces on the UH campus, fit an empirical error model, and re-tune θ and the n<sub>p</sub> ≥ 3 rule.", "Good first project | needs IRB approval",
   [["Hu, Yi & Bisnath, Sensors 2023", "https://pmc.ncbi.nlm.nih.gov/articles/PMC9921678"]]],
  ["Learned map inference as baseline and partner", "Diffusion models now build road graphs straight from raw trajectories and cope better with sparse data and flyovers, the overlap case Proteus handles with circuits.",
   "Benchmark Proteus against a learned model on the same traces, then let the model propose roads and Proteus confirm them.", "Machine learning",
   [["Wang et al., IJCAI 2025", "https://www.ijcai.org/proceedings/2025/702"]]],
  ["Fusing traces with drone and satellite imagery", "Imagery is an independent witness. New drone benchmarks label road damage across ten declared disasters, and misaligned road lines alone cost models about 6% accuracy.",
   "Count an imagery “passable” label as one of the two agreeing edges Algorithm 6 needs, and use imagery to decide where volunteers go first.", "Computer vision",
   [["Manzini et al., 2025", "https://arxiv.org/abs/2512.12128v1"], ["Gengec et al., 2024", "https://research.itu.edu.tr/en/publications/ai-powered-road-network-prediction-with-fused-low-resolution-sate/"]]],
  ["Adaptive volunteer tasking", "Algorithm 1 assigns volunteers once, and coverage limits how much of the map can be verified. Multi-agent reinforcement learning has raised task completion in emergency crowdsensing by about 18%.",
   "Re-route volunteers toward unverified roads during collection and compare coverage time with Table 5.", "Reinforcement learning | simulation",
   [["Lu et al., 2025", "https://arxiv.org/abs/2505.06997v1"], ["Sultimov et al., AAAI 2026", "https://ojs.aaai.org/index.php/AAAI/article/view/42384"]]],
  ["Trust, attacks and privacy", "Proteus treats every volunteer as honest and collects detailed location histories during a crisis. Reputation-based truth discovery and metric differential privacy address both gaps.",
   "Inject spoofed or colluding traces, weight n<sub>p</sub> by reputation, and measure the accuracy cost of privacy noise.", "Security",
   [["Li et al., 2024", "https://arxiv.org/abs/2405.18725"], ["Metric DP survey, 2025", "https://arxiv.org/pdf/2502.08970"]]],
];
function dirsHTML() {
  $("dirs").innerHTML = DIRS.map(([t, q, p, fit, refs]) => `<article class="dir"><span class="fit">${fit}</span><h3>${t}</h3><p class="q">${q}</p>
    <p class="proj"><b>Starter project.</b> ${p}</p><p class="refs">${refs.map(([n, u]) => `<a href="${u}">${n}</a>`).join(" | ")}</p></article>`).join("");
}
tableHTML(); dirsHTML();

document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => {
  const el = $(b.dataset.copy), txt = el.textContent;
  const done = () => { const o = b.textContent; b.textContent = "Copied"; setTimeout(() => (b.textContent = o), 1400); };
  try { navigator.clipboard.writeText(txt).then(done, () => selectEl(el)); } catch (e) { selectEl(el); }
}));
function selectEl(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }

/* ----------------------------------------------------------- demo state */
const P = Proteus;
const S = { area: "grid", net: null, chains: null, destroyed: new Set(), sim: null, res: null, animStep: Infinity,
  view: { s: 1, cx: 0, cy: 0 }, hoverChain: -1, tilesOn: false, tiles: new Map(), seed: 7, busy: false,
  netReady: null, simToken: 0, runToken: 0 };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = $("map"), ctx = canvas.getContext("2d"), wrap = $("mapwrap");
let colors = {};
function readColors() { const cs = getComputedStyle(document.documentElement);
  for (const k of ["mapbg", "road", "trace", "verified", "final", "destroyed", "junction", "agent", "ink"]) colors[k] = cs.getPropertyValue("--" + k).trim(); }
readColors();

const val = (id) => parseFloat($(id).value);
const outputs = { damage: (v) => v + "%", agents: (v) => v, steps: (v) => v, sigma: (v) => v + " m", theta: (v) => v + " m", k: (v) => v, omega: (v) => v + "°", l: (v) => v + " m" };
for (const id in outputs) {
  const upd = () => { const t = String(outputs[id]($(id).value)); $(id + "-o").textContent = t; $(id).setAttribute("aria-valuetext", t); };
  $(id).addEventListener("input", upd); upd();
}
// The status line changes on every animation frame, so it is not a live region.
// Results and errors are announced once through a separate polite region.
function setStatus(t, announce = false) { $("status").textContent = t; if (announce) $("announce").textContent = t; }

/* ------------------------------------------------------- compute worker */
// Simulation and verification can take seconds, so they run in a Web Worker.
// If a worker cannot start, the same calls run on the page instead.
const compute = (() => {
  let worker = null, nextId = 1, net = null, sim = null;
  const pending = new Map();
  const inline = async (msg) => {
    await new Promise((r) => setTimeout(r, 0));        // let the status line paint first
    if (msg.type === "net") { net = msg.net; sim = null; return {}; }
    if (msg.type === "simulate") { sim = P.simulate(net, new Set(msg.destroyed), msg.opts); return { sim }; }
    const r = P.run(net, new Set(msg.destroyed), sim || S.sim, msg.params);
    return { res: { metrics: r.metrics, ok: r.ver.ok, junctions: r.inter.junctions, subs: r.comb.subs, kept: r.comb.kept } };
  };
  const fallBack = () => {
    if (!worker) return;
    worker.terminate(); worker = null;
    for (const [, p] of pending) inline(p.msg).then(p.resolve, p.reject);
    pending.clear();
  };
  try {
    worker = new Worker("js/proteus-worker.js?v=2026-11-21");
    worker.addEventListener("message", ({ data }) => {
      const p = pending.get(data.id); if (!p) return;
      pending.delete(data.id);
      data.error ? p.reject(new Error(data.error)) : p.resolve(data);
    });
    worker.addEventListener("error", (e) => { e.preventDefault(); fallBack(); });
  } catch (e) { worker = null; }
  return (msg) => {
    if (msg.type === "net") net = msg.net;
    if (!worker) return inline(msg);
    return new Promise((resolve, reject) => { const id = nextId++; pending.set(id, { resolve, reject, msg }); worker.postMessage({ ...msg, id }); });
  };
})();
const plainNet = (n) => ({ nodes: n.nodes, edges: n.edges, adj: n.adj, bbox: n.bbox, length: n.length });

/* ------------------------------------------------------------- networks */
function loadNetwork(net, hint, attrib, tiles) {
  S.tilesOn = !!tiles; S.net = net; S.chains = P.chains(net); S.sim = null; S.res = null;
  S.netReady = compute({ type: "net", net: plainNet(net) });
  $("area-hint").textContent = hint; $("attrib").textContent = attrib;
  newDamage(); fit(); runAll(false);
}
let uhData = null;
async function selectArea(a) {
  if (S.busy) return;
  S.area = a;
  for (const k of ["grid", "uh", "osm"]) $("area-" + k).setAttribute("aria-pressed", String(k === a));
  $("osm-box").hidden = a !== "osm";
  if (a === "grid") loadNetwork(P.syntheticGrid(), "A downtown-style street grid, rotated like central Houston. Blocks are 110 m long.", "Synthetic network");
  if (a === "uh") {
    // The campus network is only downloaded when someone picks it.
    if (!uhData) {
      setStatus("Loading the UH campus network…");
      try { uhData = await (await fetch("js/uh-campus.json?v=2026-11-21")).json(); }
      catch (err) { setStatus("Couldn’t load the UH campus network. Check your connection and try again.", true); return; }
      if (S.area !== "uh") return;
    }
    loadNetwork(P.fromCompact(uhData), "Footpaths of the University of Houston campus: the largest connected part of the map in ProteusData.", "UH campus: ProteusData | map tiles © OpenStreetMap contributors", true);
  }
  if (a === "osm") { $("area-hint").textContent = "Enter a centre point and load its streets or footpaths straight from OpenStreetMap."; }
}
$("area-grid").addEventListener("click", () => selectArea("grid"));
$("area-uh").addEventListener("click", () => selectArea("uh"));
$("area-osm").addEventListener("click", () => selectArea("osm"));

async function loadOSM() {
  const m = $("osm-center").value.split(",").map((s) => parseFloat(s));
  if (m.length !== 2 || m.some(isNaN)) { setStatus("Enter the centre as “latitude, longitude”, for example 29.7604, -95.3698.", true); return; }
  const [lat, lon] = m, half = parseFloat($("osm-size").value), pr = P.makeProj(lat, lon);
  const [w, s] = pr.toLL(-half, -half), [e, n] = pr.toLL(half, half);
  setStatus("Downloading streets from OpenStreetMap…"); S.busy = true; $("osm-load").disabled = true;
  try {
    const mode = $("osm-mode").value;
    let net;
    try { net = await fromVectorTiles(s, w, n, e, mode); }
    catch (vtErr) { net = P.fromOverpass(await overpass(P.overpassQuery(s, w, n, e, mode))); }
    if (net.edges.length < 10) throw new Error("too few streets in this area");
    S.busy = false;
    loadNetwork(net, `${fmt(Math.round(net.length / 100) / 10)} km of streets around ${lat.toFixed(4)}, ${lon.toFixed(4)}. Real areas are large: add volunteers and walking time to cover more of them.`, "Streets: OpenFreeMap / OpenMapTiles | data and map tiles © OpenStreetMap contributors", true);
  } catch (err) { setStatus("Couldn’t load streets: " + err.message + ". Wait a minute and try again, or pick a smaller area.", true); }
  finally { S.busy = false; $("osm-load").disabled = false; }
}
$("osm-load").addEventListener("click", loadOSM);

// Streets come from OpenStreetMap vector tiles served by OpenFreeMap (a CDN, fast
// and reliable). If that fails, fall back to the public Overpass API, which is
// often overloaded and can take a minute or more to answer.
let tileTemplate = null;
async function fromVectorTiles(s, w, n, e, mode) {
  setStatus("Downloading streets from OpenStreetMap…");
  if (!tileTemplate) {
    const r = await fetch("https://tiles.openfreemap.org/planet");
    if (!r.ok) throw new Error("tile index returned " + r.status);
    tileTemplate = (await r.json()).tiles[0];
  }
  const tiles = await Promise.all(P.tilesFor(s, w, n, e, 14).map(async ([z, x, y]) => {
    const r = await fetch(tileTemplate.replace("{z}", z).replace("{x}", x).replace("{y}", y));
    if (!r.ok) throw new Error("tile returned " + r.status);
    return { z, x, y, buf: await r.arrayBuffer() };
  }));
  return P.fromVectorTiles(tiles, s, w, n, e, mode);
}
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
async function overpass(query) {
  let last = "no server answered";
  for (const url of OVERPASS) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 120000);
    try {
      setStatus(`Trying the Overpass server ${new URL(url).hostname}. This can take a minute when it is busy…`);
      const r = await fetch(url, { method: "POST", signal: ctl.signal, body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (r.ok) return await r.json();
      last = r.status === 429 ? "the OpenStreetMap servers are busy" : "server returned " + r.status;
    } catch (e) { last = e.name === "AbortError" ? "the request timed out" : "the server couldn’t be reached"; }
    finally { clearTimeout(t); }
  }
  throw new Error(last);
}

/* ---------------------------------------------------------------- damage */
function newDamage() { S.seed = (S.seed * 48271 + 11) % 2147483647; S.destroyed = P.randomDestroy(S.net, val("damage"), S.seed, S.chains); }
$("reshuffle").addEventListener("click", () => { if (S.busy) return; newDamage(); runAll(true); });
$("damage").addEventListener("change", () => { if (S.busy) return; newDamage(); runAll(true); });
function toggleChain(c) {
  const members = S.chains.list[c], on = !S.destroyed.has(members[0]);
  for (const e of members) on ? S.destroyed.add(e) : S.destroyed.delete(e);
  runAll(true);
}

/* -------------------------------------------------------------- pipeline */
function params() { return { theta: val("theta"), k: val("k"), omega: val("omega"), l: val("l"), junctionRadius: 15 }; }
async function runAll(animate) {
  if (!S.net) return;
  const token = ++S.simToken;
  S.busy = true; $("run").disabled = true; S.res = null;
  setStatus("Volunteers are walking…");
  const done = () => { if (token === S.simToken) { S.busy = false; $("run").disabled = false; } };
  try {
    await S.netReady;
    const { sim } = await compute({ type: "simulate", destroyed: [...S.destroyed],
      opts: { agents: val("agents"), steps: val("steps"), sigma: val("sigma"), seed: S.seed } });
    if (token !== S.simToken) return;
    S.sim = sim;
  } catch (err) { if (token === S.simToken) setStatus("The simulation stopped: " + err.message, true); done(); return; }
  const finish = async () => { S.animStep = Infinity; setStatus("Verifying and combining…"); draw(); await runProteus(); done(); };
  if (!animate || reduceMotion) { finish(); return; }
  const total = val("steps"), dur = 2200, t0 = performance.now();
  const tick = (now) => { const f = Math.min(1, (now - t0) / dur); S.animStep = Math.max(1, Math.floor(f * total)); draw();
    setStatus(`Volunteers are walking… step ${S.animStep} of ${total}`); if (f < 1) requestAnimationFrame(tick); else finish(); };
  requestAnimationFrame(tick);
}
async function runProteus() {
  const token = ++S.runToken;
  let res;
  try { ({ res } = await compute({ type: "run", destroyed: [...S.destroyed], params: params() })); }
  catch (err) { if (token === S.runToken) setStatus("Proteus stopped: " + err.message, true); return; }
  if (token !== S.runToken) return;                 // a newer run has started
  S.res = res;
  const m = res.metrics, pct = (x) => Math.round(x * 100) + "%";
  $("m-cov").textContent = pct(m.coverage); $("m-ver").textContent = pct(m.points ? m.verifiedPoints / m.points : 0);
  $("m-rec").textContent = pct(m.recall); $("m-pre").textContent = pct(m.precision);
  $("m-del").textContent = S.destroyed.size ? pct(m.destroyedRemoved) : "–"; $("m-jn").textContent = fmt(m.junctions);
  const ms = Math.round(m.ms.verify + m.ms.intersections + m.ms.combine);
  setStatus(`${fmt(m.points)} GPS fixes from ${val("agents")} volunteers | Proteus ran in ${fmt(ms)} ms`, true);
  draw();
}
$("run").addEventListener("click", () => { if (!S.busy) runAll(true); });
let rerun = 0;
for (const id of ["theta", "k", "omega", "l"]) $(id).addEventListener("input", () => {
  clearTimeout(rerun); if (!S.sim || S.busy) return; setStatus("Re-running Proteus…");
  rerun = setTimeout(runProteus, 250); });
for (const id of ["agents", "steps", "sigma"]) $(id).addEventListener("change", () => { if (!S.busy) runAll(true); });

/* ------------------------------------------------------------ rendering */
function resize() { const r = wrap.getBoundingClientRect(), d = devicePixelRatio || 1;
  canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); draw(); }
new ResizeObserver(resize).observe(wrap);
function size() { const r = wrap.getBoundingClientRect(); return [r.width, r.height]; }
function fit() { if (!S.net) return; const [W, H] = size(), [x0, y0, x1, y1] = S.net.bbox;
  S.view.s = Math.min(W / ((x1 - x0) * 1.08 + 1), H / ((y1 - y0) * 1.08 + 1)); S.view.cx = (x0 + x1) / 2; S.view.cy = (y0 + y1) / 2; draw(); }
const sx = (x) => (x - S.view.cx) * S.view.s + size()[0] / 2, sy = (y) => (S.view.cy - y) * S.view.s + size()[1] / 2;
const wx = (px) => (px - size()[0] / 2) / S.view.s + S.view.cx, wy = (py) => S.view.cy - (py - size()[1] / 2) / S.view.s;
const layer = (n) => $("L-" + n).checked;
document.querySelectorAll("#layers input").forEach((i) => i.addEventListener("change", draw));
document.querySelectorAll("[data-show]").forEach((b) => b.addEventListener("click", () => {
  const order = ["traces", "verified", "junctions", "final"], k = order.indexOf(b.dataset.show);
  order.forEach((n, i) => ($("L-" + n).checked = i === k || (n === "traces" && k === 1)));
  $("L-map").checked = true; $("L-damage").checked = true; draw();
  $("demo").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}));

function drawTiles(W, H) {
  if (!S.tilesOn || !S.net) return;
  const pr = S.net.proj, mpp = 1 / S.view.s;
  const z = Math.max(3, Math.min(19, Math.round(Math.log2(156543.03 * Math.cos(pr.lat0 * Math.PI / 180) / mpp))));
  const n = 2 ** z, lon2t = (lo) => (lo + 180) / 360 * n, lat2t = (la) => (1 - Math.log(Math.tan(la * Math.PI / 180) + 1 / Math.cos(la * Math.PI / 180)) / Math.PI) / 2 * n;
  const t2lon = (x) => x / n * 360 - 180, t2lat = (y) => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const [lw, ln] = pr.toLL(wx(0), wy(0)), [le, ls] = pr.toLL(wx(W), wy(H));
  ctx.save(); ctx.globalAlpha = 0.55;
  for (let tx = Math.floor(lon2t(lw)); tx <= Math.floor(lon2t(le)); tx++) for (let ty = Math.floor(lat2t(ln)); ty <= Math.floor(lat2t(ls)); ty++) {
    const key = `${z}/${tx}/${ty}`; let img = S.tiles.get(key);
    if (!img) { img = new Image(); img.onload = draw; img.onerror = () => {}; img.src = `https://tile.openstreetmap.org/${key}.png`; S.tiles.set(key, img); }
    if (!img.complete || !img.naturalWidth) continue;
    const [ax, ay] = pr.toXY(t2lon(tx), t2lat(ty)), [bx, by] = pr.toXY(t2lon(tx + 1), t2lat(ty + 1));
    ctx.drawImage(img, sx(ax), sy(ay), sx(bx) - sx(ax), sy(by) - sy(ay));
  }
  ctx.restore();
}

// Hundreds of thousands of GPS fixes: write them into a pixel buffer and draw
// it with one call, instead of one canvas call per point.
const dotLayer = document.createElement("canvas"), dotCtx = dotLayer.getContext("2d");
let dotImage = null;
function rgb(hex) { const v = parseInt(hex.replace("#", ""), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function drawPoints(sim, keep, color, alpha, r) {
  const W = canvas.width, H = canvas.height, d = W / size()[0];
  if (!dotImage || dotImage.width !== W || dotImage.height !== H) {
    dotLayer.width = W; dotLayer.height = H; dotImage = dotCtx.createImageData(W, H);
  }
  const px = new Uint32Array(dotImage.data.buffer); px.fill(0);
  const [cr, cg, cb] = rgb(color), packed = (255 << 24 | cb << 16 | cg << 8 | cr) >>> 0;   // little-endian RGBA
  const rp = Math.max(1, Math.round(r * d)), half = rp >> 1;
  const k = S.view.s * d, ox = W / 2 - S.view.cx * k, oy = H / 2 + S.view.cy * k;
  const X = sim.X, Y = sim.Y;
  for (let i = 0, n = sim.n; i < n; i++) {
    if (!keep(i)) continue;
    const x0 = Math.round(X[i] * k + ox) - half, y0 = Math.round(oy - Y[i] * k) - half;
    if (x0 >= W || y0 >= H || x0 + rp <= 0 || y0 + rp <= 0) continue;
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + rp); y++) {
      const row = y * W;
      for (let x = Math.max(0, x0); x < Math.min(W, x0 + rp); x++) px[row + x] = packed;
    }
  }
  dotCtx.putImageData(dotImage, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(dotLayer, 0, 0); ctx.restore();
}

function draw() {
  const [W, H] = size(); if (!W) return;
  ctx.fillStyle = colors.mapbg; ctx.fillRect(0, 0, W, H);
  if (!S.net) return;
  drawTiles(W, H);
  const net = S.net, nodes = net.nodes, z = Math.min(2, Math.max(0.6, S.view.s * 0.6));
  ctx.lineCap = "round";
  if (layer("map")) {
    ctx.strokeStyle = colors.road; ctx.lineWidth = Math.max(1.5, 3.2 * z); ctx.beginPath();
    net.edges.forEach((e, i) => { if (S.destroyed.has(i) && layer("damage")) return; const a = nodes[e.a], b = nodes[e.b]; ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); });
    ctx.stroke();
  }
  if (layer("damage")) {
    ctx.strokeStyle = colors.destroyed; ctx.lineWidth = Math.max(1.5, 2.6 * z); ctx.setLineDash([5, 4]); ctx.beginPath();
    for (const i of S.destroyed) { const e = net.edges[i], a = nodes[e.a], b = nodes[e.b]; ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  if (S.hoverChain >= 0) {
    ctx.strokeStyle = colors.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 9; ctx.beginPath();
    for (const i of S.chains.list[S.hoverChain]) { const e = net.edges[i], a = nodes[e.a], b = nodes[e.b]; ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  const sim = S.sim, ok = S.res && S.animStep === Infinity ? S.res.ok : null;
  if (sim && (layer("traces") || layer("verified"))) {
    const r = Math.max(1, Math.min(2, S.view.s * 0.7)), lim = S.animStep, showVer = ok && layer("verified");
    if (layer("traces")) drawPoints(sim, (i) => sim.S[i] <= lim && !(showVer && ok[i]), colors.trace, 0.35, r);
    if (showVer) drawPoints(sim, (i) => ok[i] === 1, colors.verified, layer("final") ? 0.16 : 0.45, r);
  }
  if (S.res && layer("final")) {
    ctx.strokeStyle = colors.final; ctx.lineWidth = Math.max(2.5, 4 * z); ctx.beginPath();
    S.res.subs.forEach((g, i) => { if (!S.res.kept[i]) return; ctx.moveTo(sx(g[0]), sy(g[1])); ctx.lineTo(sx(g[2]), sy(g[3])); });
    ctx.stroke();
  }
  if (S.res && layer("junctions")) {
    ctx.strokeStyle = colors.junction; ctx.lineWidth = 2;
    for (const [x, y] of S.res.junctions) { ctx.beginPath(); ctx.arc(sx(x), sy(y), 5, 0, 2 * Math.PI); ctx.stroke(); }
  }
  if (sim && S.animStep !== Infinity) {
    ctx.fillStyle = colors.agent;
    for (const path of sim.agents) { const p = nodes[path[Math.min(path.length - 1, S.animStep)]]; ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 3.5, 0, 2 * Math.PI); ctx.fill(); }
  }
}

/* ------------------------------------------------------------ interaction */
function nearestChain(px, py) {
  if (!S.net) return -1; const x = wx(px), y = wy(py), tol = 10 / S.view.s; let best = -1, bd = tol;
  S.net.edges.forEach((e, i) => { const a = S.net.nodes[e.a], b = S.net.nodes[e.b]; const d = P.segDist(x, y, [a[0], a[1], b[0], b[1]]); if (d < bd) { bd = d; best = i; } });
  return best < 0 ? -1 : S.chains.chainOf[best];
}
let drag = null;
canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); drag = { x: e.offsetX, y: e.offsetY, cx: S.view.cx, cy: S.view.cy, moved: false }; canvas.style.cursor = "grabbing"; });
canvas.addEventListener("pointermove", (e) => {
  if (drag) { const dx = e.offsetX - drag.x, dy = e.offsetY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) { S.view.cx = drag.cx - dx / S.view.s; S.view.cy = drag.cy + dy / S.view.s; draw(); } return; }
  const c = nearestChain(e.offsetX, e.offsetY); if (c !== S.hoverChain) { S.hoverChain = c; canvas.classList.toggle("hover", c >= 0); draw(); }
});
canvas.addEventListener("pointerup", (e) => { const d = drag; drag = null; canvas.style.cursor = "";
  if (d && !d.moved && !S.busy) { const c = nearestChain(e.offsetX, e.offsetY); if (c >= 0) toggleChain(c); } });
canvas.addEventListener("pointerleave", () => { if (S.hoverChain >= 0) { S.hoverChain = -1; draw(); } });
function zoomAt(f, px, py) { const x = wx(px), y = wy(py); S.view.s *= f; S.view.cx = x - (px - size()[0] / 2) / S.view.s; S.view.cy = y + (py - size()[1] / 2) / S.view.s; draw(); }
canvas.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.offsetX, e.offsetY); }, { passive: false });
$("zin").addEventListener("click", () => zoomAt(1.4, size()[0] / 2, size()[1] / 2));
$("zout").addEventListener("click", () => zoomAt(1 / 1.4, size()[0] / 2, size()[1] / 2));
$("zfit").addEventListener("click", fit);

/* ------------------------------------------------------------------ boot */
$("controls").addEventListener("submit", (e) => e.preventDefault());
resize();
selectArea("grid");
})();
