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
  let a = `<div class="tbl"><table><caption>Edge verification</caption><thead><tr><th>Model</th><th>Input</th><th>Verified</th><th>Accuracy</th></tr></thead><tbody>`;
  for (const [g, rows] of T2) { a += `<tr class="grp"><td colspan="4">${g}</td></tr>`;
    for (const r of rows) a += `<tr><td>${r[0]}</td><td class="v">${fmt(r[1])}</td><td class="v">${fmt(r[2])}</td><td class="v">${r[3].toFixed(1)}%<span class="bar" style="width:${r[3]}%"></span></td></tr>`; }
  a += `</tbody></table><p class="tblnote">Share of ground-truth edges reproduced (Table 2).</p></div>`;
  let b = `<div class="tbl"><table><caption>Path combination</caption><thead><tr><th>Model</th><th>Input edges</th><th>Similarity</th></tr></thead><tbody>`;
  for (const [g, rows] of T4) { b += `<tr class="grp"><td colspan="3">${g}</td></tr>`;
    for (const r of rows) b += `<tr><td>${r[0]}</td><td class="v">${fmt(r[1])}</td><td class="v">${r[2].toFixed(1)}%<span class="bar" style="width:${r[2]}%"></span></td></tr>`; }
  b += `</tbody></table><p class="tblnote">Graph-edit-distance similarity of the combined map to ground truth (Table 4).</p></div>`;
  let c = `<div class="tbl"><table><caption>Volunteer deployment</caption><thead><tr><th>Area</th><th>Quadrants</th><th>Whole map</th><th>Random</th></tr></thead><tbody>`;
  for (const r of T5) c += `<tr><td>${r[0]}</td><td class="v"><b>${fmt(r[1])}</b></td><td class="v">${fmt(r[2])}</td><td class="v">${fmt(r[3])}</td></tr>`;
  c += `</tbody></table><p class="tblnote">Time steps until every node has been visited by three volunteers, 3-edge model (Table 5). Quadrant-based deployment covers both areas fastest.</p></div>`;
  $("tables").innerHTML = a + b + c;
}
const DIRS = [
  ["Field trials with real phones", "Proteus has only seen simulated GPS noise. Real smartphone error is heavy-tailed: about 7 m standard deviation overall, with 95th-percentile errors near 18 m in suburban driving.",
   "Collect traces on the UH campus, fit an empirical error model, and re-tune θ and the n<sub>p</sub> ≥ 3 rule.", "Good first project · needs IRB approval",
   [["Hu, Yi & Bisnath, Sensors 2023", "https://pmc.ncbi.nlm.nih.gov/articles/PMC9921678"]]],
  ["Learned map inference as baseline and partner", "Diffusion models now build road graphs straight from raw trajectories and cope better with sparse data and flyovers, the overlap case Proteus handles with circuits.",
   "Benchmark Proteus against a learned model on the same traces, then let the model propose roads and Proteus confirm them.", "Machine learning",
   [["Wang et al., IJCAI 2025", "https://www.ijcai.org/proceedings/2025/702"]]],
  ["Fusing traces with drone and satellite imagery", "Imagery is an independent witness. New drone benchmarks label road damage across ten declared disasters, and misaligned road lines alone cost models about 6% accuracy.",
   "Count an imagery “passable” label as one of the two agreeing edges Algorithm 6 needs, and use imagery to decide where volunteers go first.", "Computer vision",
   [["Manzini et al., 2025", "https://arxiv.org/abs/2512.12128v1"], ["Gengec et al., 2024", "https://research.itu.edu.tr/en/publications/ai-powered-road-network-prediction-with-fused-low-resolution-sate/"]]],
  ["Adaptive volunteer tasking", "Algorithm 1 assigns volunteers once, and coverage limits how much of the map can be verified. Multi-agent reinforcement learning has raised task completion in emergency crowdsensing by about 18%.",
   "Re-route volunteers toward unverified roads during collection and compare coverage time with Table 5.", "Reinforcement learning · simulation",
   [["Lu et al., 2025", "https://arxiv.org/abs/2505.06997v1"], ["Sultimov et al., AAAI 2026", "https://ojs.aaai.org/index.php/AAAI/article/view/42384"]]],
  ["Trust, attacks and privacy", "Proteus treats every volunteer as honest and collects detailed location histories during a crisis. Reputation-based truth discovery and metric differential privacy address both gaps.",
   "Inject spoofed or colluding traces, weight n<sub>p</sub> by reputation, and measure the accuracy cost of privacy noise.", "Security",
   [["Li et al., 2024", "https://arxiv.org/abs/2405.18725"], ["Metric DP survey, 2025", "https://arxiv.org/pdf/2502.08970"]]],
];
function dirsHTML() {
  $("dirs").innerHTML = DIRS.map(([t, q, p, fit, refs]) => `<article class="dir"><span class="fit">${fit}</span><h3>${t}</h3><p class="q">${q}</p>
    <p class="proj"><b>Starter project.</b> ${p}</p><p class="refs">${refs.map(([n, u]) => `<a href="${u}">${n}</a>`).join(" · ")}</p></article>`).join("");
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
  view: { s: 1, cx: 0, cy: 0 }, hoverChain: -1, tilesOn: false, tiles: new Map(), seed: 7, busy: false };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = $("map"), ctx = canvas.getContext("2d"), wrap = $("mapwrap");
let colors = {};
function readColors() { const cs = getComputedStyle(document.documentElement);
  for (const k of ["mapbg", "road", "trace", "verified", "final", "destroyed", "junction", "agent", "ink"]) colors[k] = cs.getPropertyValue("--" + k).trim(); }
readColors();

const val = (id) => parseFloat($(id).value);
const outputs = { damage: (v) => v + "%", agents: (v) => v, steps: (v) => v, sigma: (v) => v + " m", theta: (v) => v + " m", k: (v) => v, omega: (v) => v + "°", l: (v) => v + " m" };
for (const id in outputs) { const upd = () => ($(id + "-o").textContent = outputs[id]($(id).value)); $(id).addEventListener("input", upd); upd(); }
function setStatus(t) { $("status").textContent = t; }

/* ------------------------------------------------------------- networks */
function loadNetwork(net, hint, attrib, tiles) {
  S.tilesOn = !!tiles; S.net = net; S.chains = P.chains(net); S.sim = null; S.res = null;
  $("area-hint").textContent = hint; $("attrib").textContent = attrib;
  newDamage(); fit(); runAll(false);
}
function selectArea(a) {
  if (S.busy) return;
  S.area = a;
  for (const k of ["grid", "uh", "osm"]) $("area-" + k).setAttribute("aria-pressed", String(k === a));
  $("osm-box").hidden = a !== "osm";
  if (a === "grid") loadNetwork(P.syntheticGrid(), "A downtown-style street grid, rotated like central Houston. Blocks are 110 m long.", "Synthetic network");
  if (a === "uh") loadNetwork(P.fromCompact(UH_DATA), "Footpaths of the University of Houston campus: the largest connected part of the map in ProteusData.", "UH campus: ProteusData · map tiles © OpenStreetMap contributors", true);
  if (a === "osm") { $("area-hint").textContent = "Enter a centre point and load its streets or footpaths straight from OpenStreetMap."; }
}
$("area-grid").onclick = () => selectArea("grid");
$("area-uh").onclick = () => selectArea("uh");
$("area-osm").onclick = () => selectArea("osm");

async function loadOSM() {
  const m = $("osm-center").value.split(",").map((s) => parseFloat(s));
  if (m.length !== 2 || m.some(isNaN)) { setStatus("Enter the centre as “latitude, longitude”, for example 29.7604, -95.3698."); return; }
  const [lat, lon] = m, half = parseFloat($("osm-size").value), pr = P.makeProj(lat, lon);
  const [w, s] = pr.toLL(-half, -half), [e, n] = pr.toLL(half, half);
  setStatus("Downloading streets from OpenStreetMap…"); S.busy = true; $("osm-load").disabled = true;
  try {
    const q = P.overpassQuery(s, w, n, e, $("osm-mode").value);
    const net = P.fromOverpass(await overpass(q));
    if (net.edges.length < 10) throw new Error("too few streets in this area");
    S.busy = false;
    loadNetwork(net, `${fmt(net.edges.length)} street segments around ${lat.toFixed(4)}, ${lon.toFixed(4)}.`, "Road data and map tiles © OpenStreetMap contributors", true);
  } catch (err) { setStatus("Couldn’t load streets: " + err.message + ". Wait a minute and try again, or pick a smaller area."); }
  finally { S.busy = false; $("osm-load").disabled = false; }
}
$("osm-load").onclick = loadOSM;

// Public Overpass servers are shared and sometimes busy, so try each in turn.
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter",
                  "https://overpass.private.coffee/api/interpreter"];
async function overpass(query) {
  let last = "no server answered";
  for (const url of OVERPASS) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
    try {
      setStatus(`Downloading streets from OpenStreetMap (${new URL(url).hostname})…`);
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
$("reshuffle").onclick = () => { if (S.busy) return; newDamage(); runAll(true); };
$("damage").addEventListener("change", () => { if (S.busy) return; newDamage(); runAll(true); });
function toggleChain(c) {
  const members = S.chains.list[c], on = !S.destroyed.has(members[0]);
  for (const e of members) on ? S.destroyed.add(e) : S.destroyed.delete(e);
  runAll(true);
}

/* -------------------------------------------------------------- pipeline */
function params() { return { theta: val("theta"), k: val("k"), omega: val("omega"), l: val("l"), junctionRadius: 15 }; }
function runAll(animate) {
  if (!S.net) return;
  S.busy = true; $("run").disabled = true;
  setStatus("Volunteers are walking…");
  S.sim = P.simulate(S.net, S.destroyed, { agents: val("agents"), steps: val("steps"), sigma: val("sigma"), seed: S.seed });
  S.res = null;
  const finish = () => { S.animStep = Infinity; setStatus("Verifying and combining…"); draw(); setTimeout(() => { runProteus(); S.busy = false; $("run").disabled = false; }, 20); };
  if (!animate || reduceMotion) { finish(); return; }
  const total = val("steps"), dur = 2200, t0 = performance.now();
  const tick = (now) => { const f = Math.min(1, (now - t0) / dur); S.animStep = Math.max(1, Math.floor(f * total)); draw();
    setStatus(`Volunteers are walking… step ${S.animStep} of ${total}`); if (f < 1) requestAnimationFrame(tick); else finish(); };
  requestAnimationFrame(tick);
}
function runProteus() {
  S.res = P.run(S.net, S.destroyed, S.sim, params());
  const m = S.res.metrics, pct = (x) => Math.round(x * 100) + "%";
  $("m-cov").textContent = pct(m.coverage); $("m-ver").textContent = pct(m.points ? m.verifiedPoints / m.points : 0);
  $("m-rec").textContent = pct(m.recall); $("m-pre").textContent = pct(m.precision);
  $("m-del").textContent = S.destroyed.size ? pct(m.destroyedRemoved) : "–"; $("m-jn").textContent = fmt(m.junctions);
  const ms = Math.round(m.ms.verify + m.ms.intersections + m.ms.combine);
  setStatus(`${fmt(m.points)} GPS fixes from ${val("agents")} volunteers · Proteus ran in ${fmt(ms)} ms`);
  draw();
}
$("run").onclick = () => { if (!S.busy) runAll(true); };
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
  const sim = S.sim, ok = S.res && S.animStep === Infinity ? S.res.ver.ok : null;
  if (sim && (layer("traces") || layer("verified"))) {
    const r = Math.max(1, Math.min(2, S.view.s * 0.7)), lim = S.animStep;
    if (layer("traces")) { ctx.fillStyle = colors.trace; ctx.globalAlpha = 0.35;
      for (let i = 0; i < sim.n; i++) { if (sim.S[i] > lim || (ok && ok[i] && layer("verified"))) continue; ctx.fillRect(sx(sim.X[i]) - r / 2, sy(sim.Y[i]) - r / 2, r, r); }
      ctx.globalAlpha = 1; }
    if (ok && layer("verified")) { ctx.fillStyle = colors.verified; ctx.globalAlpha = layer("final") ? 0.16 : 0.45;
      for (let i = 0; i < sim.n; i++) if (ok[i]) ctx.fillRect(sx(sim.X[i]) - r / 2, sy(sim.Y[i]) - r / 2, r, r);
      ctx.globalAlpha = 1; }
  }
  if (S.res && layer("final")) {
    ctx.strokeStyle = colors.final; ctx.lineWidth = Math.max(2.5, 4 * z); ctx.beginPath();
    S.res.comb.subs.forEach((g, i) => { if (!S.res.comb.kept[i]) return; ctx.moveTo(sx(g[0]), sy(g[1])); ctx.lineTo(sx(g[2]), sy(g[3])); });
    ctx.stroke();
  }
  if (S.res && layer("junctions")) {
    ctx.strokeStyle = colors.junction; ctx.lineWidth = 2;
    for (const [x, y] of S.res.inter.junctions) { ctx.beginPath(); ctx.arc(sx(x), sy(y), 5, 0, 2 * Math.PI); ctx.stroke(); }
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
$("zin").onclick = () => zoomAt(1.4, size()[0] / 2, size()[1] / 2);
$("zout").onclick = () => zoomAt(1 / 1.4, size()[0] / 2, size()[1] / 2);
$("zfit").onclick = fit;

/* ------------------------------------------------------------------ boot */
resize();
selectArea("grid");
})();
