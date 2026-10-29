/* Crowdsensing Lab site: DEIMOSBC demo UI. */
(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const REPO = "https://github.com/RaunakDune/deimosbc-implementation/blob/main/";

/* ----------------------------------------------------------- page content */
// Reference implementation, 2 km grid, 40 volunteers, 5 processors, 1 hour (see docs/RESEARCH_NOTES.md).
const TA = [["Discard both (2021 rule)", 1, 0.350, 0.848, 0.193], ["Discard both", 2, 0.153, 0.985, 0.011],
            ["Count witnesses", 1, 0.345, 0.845, 0.159], ["Count witnesses", 2, 0.150, 0.994, 0.003]];
const TB = [["None", 4, 0.337, 0.912, 0.008], ["None", 12, 0.315, 0.797, 0.022], ["10%", 4, 0.353, 0.813, 0.267], ["10%", 12, 0.318, 0.743, 0.304]];
const TC = [["2 of 7 processors Byzantine, 1 crashed for 10 min", "360 of 360 rounds committed; 295 tampered proposals rejected; honest replicas identical"],
            ["Garbage uploaders (5%)", "All disabled within minutes, in every seed"],
            ["Honest volunteers disabled", "0 of 32 on the grid, in every seed"],
            ["Half the volunteers upload garbage", "Error rate crosses the threshold; a majority freezes the chain after 5 minutes"],
            ["Median wait for confirmation", "About 3 minutes, almost all of it walking into Wi-Fi range"]];
const pct = (x, d = 0) => (x * 100).toFixed(d) + "%";
function tableHTML() {
  const bar = (x, bad) => `<span class="bar" style="width:${Math.max(1, x * 100)}%${bad ? ";background:var(--destroyed)" : ""}"></span>`;
  let a = `<div class="tbl"><table><caption>Conflict rule and corroboration</caption><thead><tr><th>Conflict rule</th><th>Per street</th><th>Recall</th><th>Precision</th><th>Contam.</th></tr></thead><tbody>`;
  for (const r of TA) a += `<tr><td>${r[0]}</td><td class="v">${r[1]}</td><td class="v">${pct(r[2])}${bar(r[2])}</td><td class="v">${pct(r[3])}${bar(r[3])}</td><td class="v">${pct(r[4], 1)}${bar(r[4], 1)}</td></tr>`;
  a += `</tbody></table><p class="tblnote">With 10% of volunteers claiming flooded streets are open. Requiring two volunteers per released street removes almost all false streets but halves coverage after one hour.</p></div>`;
  let b = `<div class="tbl"><table><caption>Bad actors and GPS noise</caption><thead><tr><th>Fabricators</th><th>GPS σ</th><th>Recall</th><th>Precision</th><th>Contam.</th></tr></thead><tbody>`;
  for (const r of TB) b += `<tr><td>${r[0]}</td><td class="v">${r[1]} m</td><td class="v">${pct(r[2])}${bar(r[2])}</td><td class="v">${pct(r[3])}${bar(r[3])}</td><td class="v">${pct(r[4], 1)}${bar(r[4], 1)}</td></tr>`;
  b += `</tbody></table><p class="tblnote">Original 2021 rules, two seeds per row. A fabricated trace on a flooded street is accepted unless an honest volunteer has reported that street as blocked.</p></div>`;
  let c = `<div class="tbl"><table><caption>Robustness</caption><thead><tr><th>Scenario</th><th>Outcome</th></tr></thead><tbody>`;
  for (const r of TC) c += `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`;
  c += `</tbody></table><p class="tblnote">Consensus survives a dishonest or crashed minority of processors. It stalls, safely, if a majority is offline.</p></div>`;
  $("tables").innerHTML = a + b + c;
}
const DIRS = [
  ["Corroboration without losing coverage", "The contract accepts a street on one volunteer's word. Requiring two removes nearly all false streets, but early in a response most streets have been walked once.",
   "Release two layers, verified and provisional, and weight each witness by the reputation the chain already records (accepted, rejected, disputed).", "Good first project | simulation",
   [["Research notes §1", REPO + "docs/RESEARCH_NOTES.md#1-single-source-acceptance-is-the-main-safety-gap"]]],
  ["Proteus inside the contract", "The map-merging step is pluggable and chosen in the first block, so every processor runs the same algorithm. Proteus' distance and angle constraints are a principled replacement for the simple overlap rule.",
   "Implement the merger interface with Proteus and compare false streets, coverage and cost per block against the same attackers.", "Algorithms | builds on Proteus",
   [["Integration guide", REPO + "docs/PROTEUS_INTEGRATION.md"], ["Proteus", "../"]]],
  ["Conflicts that keep their evidence", "Discarding both traces in a conflict also erases the honest hazard report, so the same false claim can come back, and the honest reporter is penalised.",
   "Start from the “count witnesses” rule in the demo, add time so a later hazard can supersede an earlier traversal without punishing anyone.", "Mechanism design",
   [["Research notes §2", REPO + "docs/RESEARCH_NOTES.md#2-discard-both-erases-the-evidence-it-needs"]]],
  ["Field trial with phones and Wi-Fi", "Blocks take seconds; the wait for confirmation is minutes, spent walking into range of a processor. Real radio contact times and processor placement decide how fast the map grows.",
   "Build a phone client using Wi-Fi Direct, measure contact times on campus, and test processors mounted on vehicles.", "Systems | needs IRB approval",
   [["Research notes §5", REPO + "docs/RESEARCH_NOTES.md#5-latency-is-a-radio-problem-not-a-blockchain-problem"]]],
  ["Privacy for volunteers", "Every processor holds every trace, so the ledger records where each volunteer walked during the crisis.",
   "Commit only to map edges, or coarsen and delay traces, and measure what each choice costs in map accuracy.", "Security",
   [["Research notes §7", REPO + "docs/RESEARCH_NOTES.md#7-other-gaps-worth-a-paragraph-in-our-follow-up-work"]]],
  ["Who can stop the chain?", "The freeze protects the map from bad data, but a coordinated group uploading garbage can trigger it on purpose and stop mapping for everyone.",
   "Add per-volunteer rate limits or leave suspended volunteers out of the error window, then attack it in simulation.", "Security | game theory",
   [["Research notes §7", REPO + "docs/RESEARCH_NOTES.md#7-other-gaps-worth-a-paragraph-in-our-follow-up-work"]]],
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
const P = Proteus, D = Deimos;
const S = { area: "grid", net: null, chains: null, blocked: new Set(), floods: [], res: null, frame: 0, playing: false,
  view: { s: 1, cx: 0, cy: 0 }, hoverChain: -1, tilesOn: false, tiles: new Map(), seed: 7, busy: false, policy: "discard_both",
  tampered: -1, falseCache: new Map() };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = $("map"), ctx = canvas.getContext("2d"), wrap = $("mapwrap");
const colors = {};
(function readColors() { const cs = getComputedStyle(document.documentElement);
  for (const k of ["mapbg", "road", "final", "destroyed", "agent", "ink", "chain", "hazard", "proc", "bad", "muted"]) colors[k] = cs.getPropertyValue("--" + k).trim(); })();

const val = (id) => parseFloat($(id).value);
const outputs = { damage: (v) => v + "%", agents: (v) => v, minutes: (v) => v + " min", sigma: (v) => v + " m", fabricate: (v) => v + "%", spam: (v) => v + "%",
  faulty: (v) => v + "%", procs: (v) => v, range: (v) => v + " m", support: (v) => v, theta: (v) => v + " m", freeze: (v) => (+v >= 100 ? "never" : v + "%") };
for (const id in outputs) { const upd = () => ($(id + "-o").textContent = outputs[id]($(id).value)); $(id).addEventListener("input", upd); upd(); }
function setStatus(t) { $("status").textContent = t; }
const fmt = (n) => n.toLocaleString("en-US");
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ------------------------------------------------------------- networks */
function loadNetwork(net, hint, attrib, tiles) {
  S.tilesOn = !!tiles; S.net = net; S.chains = P.chains(net); S.res = null;
  $("area-hint").textContent = hint; $("attrib").textContent = attrib;
  newDamage(); fit(); run(false);
}
function selectArea(a) {
  if (S.busy) return;
  S.area = a;
  for (const k of ["grid", "uh", "osm"]) $("area-" + k).setAttribute("aria-pressed", String(k === a));
  $("osm-box").hidden = a !== "osm";
  if (a === "grid") loadNetwork(P.syntheticGrid(), "A downtown-style street grid, rotated like central Houston. Blocks are 110 m long.", "Synthetic network");
  if (a === "uh") loadNetwork(P.fromCompact(UH_DATA), "Footpaths of the University of Houston campus, from ProteusData. Irregular paths make conflicts between honest traces more likely.", "UH campus: ProteusData | map tiles © OpenStreetMap contributors", true);
  if (a === "osm") $("area-hint").textContent = "Enter a centre point and load its streets or footpaths straight from OpenStreetMap.";
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
    const mode = $("osm-mode").value;
    let net;
    try { net = await fromVectorTiles(s, w, n, e, mode); }
    catch (vtErr) { net = P.fromOverpass(await overpass(P.overpassQuery(s, w, n, e, mode))); }
    if (net.edges.length < 10) throw new Error("too few streets in this area");
    S.busy = false;
    loadNetwork(net, `${fmt(Math.round(net.length / 100) / 10)} km of streets around ${lat.toFixed(4)}, ${lon.toFixed(4)}. Real areas are large: add volunteers and time to cover more of them.`, "Streets: OpenFreeMap / OpenMapTiles | data and map tiles © OpenStreetMap contributors", true);
  } catch (err) { setStatus("Couldn’t load streets: " + err.message + ". Wait a minute and try again, or pick a smaller area."); }
  finally { S.busy = false; $("osm-load").disabled = false; }
}
$("osm-load").onclick = loadOSM;
let tileTemplate = null;
async function fromVectorTiles(s, w, n, e, mode) {
  if (!tileTemplate) { const r = await fetch("https://tiles.openfreemap.org/planet"); if (!r.ok) throw new Error("tile index returned " + r.status); tileTemplate = (await r.json()).tiles[0]; }
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
      const r = await fetch(url, { method: "POST", signal: ctl.signal, body: "data=" + encodeURIComponent(query), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      if (r.ok) return await r.json();
      last = r.status === 429 ? "the OpenStreetMap servers are busy" : "server returned " + r.status;
    } catch (e) { last = e.name === "AbortError" ? "the request timed out" : "the server couldn’t be reached"; }
    finally { clearTimeout(t); }
  }
  throw new Error(last);
}

/* ---------------------------------------------------------------- damage */
function newDamage() { S.seed = (S.seed * 48271 + 11) % 2147483647; const d = D.floodDamage(S.net, val("damage"), S.seed); S.blocked = d.blocked; S.floods = d.floods; }
$("reshuffle").onclick = () => { if (S.busy) return; newDamage(); run(true); };
$("damage").addEventListener("change", () => { if (S.busy) return; newDamage(); run(true); });
function toggleChain(c) {
  const members = S.chains.list[c], on = !S.blocked.has(members[0]);
  for (const e of members) on ? S.blocked.add(e) : S.blocked.delete(e);
  run(true);
}

/* -------------------------------------------------------------- pipeline */
function options() {
  const area = (S.net.bbox[2] - S.net.bbox[0]) * (S.net.bbox[3] - S.net.bbox[1]);
  return { agents: val("agents"), minutes: val("minutes"), sigma: val("sigma"), fabricate: val("fabricate"), spam: val("spam"), faulty: val("faulty"),
    processors: val("procs"), range: val("range"), tamper: $("tamper").checked, seed: S.seed,
    protocol: { policy: S.policy, minSupport: val("support"), mergeRadius: val("theta"), freezeRate: val("freeze") >= 100 ? 2 : val("freeze") / 100,
      cell: Math.max(80, Math.min(300, Math.sqrt(area / (1.2 * val("agents"))))) } };
}
function run(animate) {
  if (!S.net || S.busy) return;
  S.busy = true; $("run").disabled = true; stop();
  setStatus("Volunteers are out, processors are mining…");
  setTimeout(() => {
    const t0 = performance.now();
    try { S.res = D.simulate(S.net, S.blocked, options()); }
    catch (err) { S.busy = false; $("run").disabled = false; setStatus("The simulation failed: " + err.message); return; }
    const ms = performance.now() - t0;
    S.tampered = -1; S.falseCache = new Map(); $("chainmsg").textContent = ""; $("chainmsg").className = "chainmsg";
    const r = S.res, m = r.metrics;
    $("time").max = r.frames.length; S.busy = false; $("run").disabled = false;
    S.summary = `${val("agents")} volunteers | ${fmt(m.accepted + m.rejected + m.disputed)} traces | ${fmt(m.blocks)} blocks | ${r.releases.length} map versions` +
      (m.frozen ? ` | chain frozen at ${clock(m.freezeAt.t)}` : "") + (m.rejectedProposals ? ` | ${fmt(m.rejectedProposals)} tampered blocks rejected` : "") + ` | simulated in ${fmt(Math.round(ms))} ms`;
    finalMetrics();
    if (animate && !reduceMotion) play(0); else setFrame(r.frames.length);
  }, 30);
}
$("run").onclick = () => run(true);
for (const id of ["agents", "minutes", "sigma", "fabricate", "spam", "faulty", "procs", "range"]) $(id).addEventListener("change", () => run(true));
$("tamper").addEventListener("change", () => run(true));
let rerun = 0;
const rerunQuiet = () => { clearTimeout(rerun); rerun = setTimeout(() => run(false), 250); };
for (const id of ["support", "theta", "freeze"]) $(id).addEventListener("change", rerunQuiet);
function setPolicy(p) { S.policy = p; $("pol-both").setAttribute("aria-pressed", String(p === "discard_both")); $("pol-evid").setAttribute("aria-pressed", String(p === "evidence")); rerunQuiet(); }
$("pol-both").onclick = () => setPolicy("discard_both");
$("pol-evid").onclick = () => setPolicy("evidence");

function finalMetrics() {
  const m = S.res.metrics, roles = m.byRole, bad = ["fabricate", "spam", "faulty"].reduce((s, k) => s + (roles[k] ? roles[k].n : 0), 0);
  const cut = ["fabricate", "spam", "faulty"].reduce((s, k) => s + (roles[k] ? roles[k].disabled : 0), 0);
  $("m-acc").textContent = fmt(m.accepted);
  $("m-acc-s").textContent = `traces accepted on chain, ${fmt(m.rejected)} rejected, ${fmt(m.disputed)} discarded in conflicts`;
  $("m-bad").textContent = bad ? `${cut} of ${bad}` : "–";
  $("m-delay").textContent = m.medianDelay == null ? "–" : clock(m.medianDelay);
}
function releaseAt(tt) { const rel = S.res.releases; let k = -1; for (let i = 0; i < rel.length; i++) if (rel[i].t <= tt) k = i; return k; }
function timeMetrics(tt) {
  const k = releaseAt(tt), tl = S.res.timeline[k];
  $("m-rec").textContent = tl ? pct(tl.recall) : "–"; $("m-pre").textContent = tl ? pct(tl.precision) : "–"; $("m-con").textContent = tl ? pct(tl.contamination) : "–";
}

/* ------------------------------------------------------------ replay */
let raf = 0;
function setFrame(f) {
  const r = S.res; if (!r) return;
  S.frame = Math.max(0, Math.min(r.frames.length, f)); $("time").value = S.frame;
  const tt = S.frame * r.FR, k = releaseAt(tt);
  $("time-o").textContent = `${clock(tt)} of ${clock(r.frames.length * r.FR)}`;
  timeMetrics(tt); ledger(tt);
  const atEnd = S.frame >= r.frames.length;
  setStatus(atEnd ? S.summary : `${clock(tt)} after landfall | ${k >= 0 ? "map v" + (k + 1) + " released" : "no map released yet"}`);
  draw();
}
function play(from) {
  const r = S.res; if (!r) return; stop();
  if (from != null) S.frame = from; if (S.frame >= r.frames.length) S.frame = 0;
  S.playing = true; $("play").textContent = "Pause";
  const dur = 9000 * (1 - S.frame / r.frames.length), f0 = S.frame, t0 = performance.now();
  const tick = (now) => { const f = Math.min(1, (now - t0) / Math.max(1, dur)); setFrame(Math.round(f0 + f * (r.frames.length - f0)));
    if (f < 1 && S.playing) raf = requestAnimationFrame(tick); else stop(); };
  raf = requestAnimationFrame(tick);
}
function stop() { cancelAnimationFrame(raf); S.playing = false; $("play").textContent = "Replay"; }
$("play").onclick = () => (S.playing ? stop() : play());
$("time").addEventListener("input", () => { stop(); setFrame(+$("time").value); });

/* ------------------------------------------------------------- ledger */
function ledger(tt) {
  const r = S.res, upto = r.blocks.filter((b) => b.t <= tt), head = upto[upto.length - 1];
  $("ledger-title").textContent = `Ledger | ${fmt(upto.length - 1)} blocks | head ${head.hash.slice(0, 12)}…`;
  const shown = upto.filter((b) => b.txs.length).slice(-60).reverse();
  $("blocks").innerHTML = shown.length ? shown.map((b) => `<details class="blk${b.h === S.tampered ? " tampered" : ""}" data-h="${b.h}"><summary><span class="h">#${b.h}</span><span>${clock(b.t)}</span><span>${b.proposer}</span><span>${b.txs.length} tx | ${esc(b.txs[0])}${b.txs.length > 1 ? " …" : ""}</span><span>${b.hash.slice(0, 10)}</span></summary>
      <ul>${b.txs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="meta">prev ${b.prev.slice(0, 16)}… | tx root ${b.txRoot.slice(0, 16)}… | state ${b.app.slice(0, 16)}… | signed by ${b.attest.join(", ")}</p></details>`).join("")
    : `<p style="padding:8px 10px;margin:0;color:var(--muted)">No transactions yet. Blocks are produced every 5 seconds.</p>`;
}
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
$("verify").onclick = () => {
  if (!S.res) return; const v = D.verifyChain(S.res.blocks), el = $("chainmsg");
  if (v.ok) { el.textContent = `All ${fmt(S.res.blocks.length - 1)} blocks re-hashed from the first block: every link and transaction root checks out.`; el.className = "chainmsg ok"; }
  else { el.textContent = `Block #${v.at} fails: ${v.why}. Every processor would reject this chain.`; el.className = "chainmsg err"; }
};
$("tamper-btn").onclick = () => {
  if (!S.res) return; const r = S.res, tt = S.frame * r.FR;
  const cands = r.blocks.filter((b) => b.t <= tt && b.txs.some((x) => /rejected|disputed/.test(x)));
  const pool = cands.length ? cands : r.blocks.filter((b) => b.t <= tt && b.txs.length);
  if (!pool.length) { $("chainmsg").textContent = "No transactions yet to tamper with."; return; }
  const b = pool[Math.floor(Math.random() * pool.length)], i = b.txs.findIndex((x) => /rejected|disputed/.test(x));
  const j = i < 0 ? 0 : i, before = b.txs[j];
  b.txs[j] = before.replace(/rejected \(.*\)|disputed \(.*\)|rejected|disputed/, "accepted +120m").replace(/ assigned$/, " assigned to someone else");
  if (b.txs[j] === before) b.txs[j] = before + " (edited)";
  S.tampered = b.h;
  $("chainmsg").textContent = `Edited block #${b.h}: “${before}” now reads “${b.txs[j]}”. Press Verify chain.`; $("chainmsg").className = "chainmsg";
  ledger(tt);
};

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
  const k = b.dataset.show, set = (n, v) => ($("L-" + n).checked = v);
  set("streets", true); set("blocked", true);
  set("procs", k === "procs" || k === "people"); set("people", k === "people" || k === "procs"); set("bad", k === "people");
  set("hazards", k !== "procs"); set("chain", k === "chain"); set("released", k === "released");
  if (S.res && (k === "released" || k === "chain")) { stop(); setFrame(S.res.frames.length); } else draw();
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
function falseSegs(k) {
  if (!S.falseCache.has(k)) S.falseCache.set(k, D.evaluate(S.res.releases[k].segs, S.net, S.blocked).falseSeg);
  return S.falseCache.get(k);
}

function draw() {
  const [W, H] = size(); if (!W) return;
  ctx.fillStyle = colors.mapbg; ctx.fillRect(0, 0, W, H);
  if (!S.net) return;
  drawTiles(W, H);
  const net = S.net, nodes = net.nodes, z = Math.min(2, Math.max(0.6, S.view.s * 0.6)), r = S.res;
  const tt = r ? S.frame * r.FR : 0;
  ctx.lineCap = "round";
  if (layer("blocked")) for (const f of S.floods) { ctx.fillStyle = "rgba(44,102,214,0.07)"; ctx.beginPath(); ctx.arc(sx(f.x), sy(f.y), f.r * S.view.s, 0, 2 * Math.PI); ctx.fill(); }
  if (layer("streets")) {
    ctx.strokeStyle = colors.road; ctx.lineWidth = Math.max(1.5, 3.2 * z); ctx.beginPath();
    net.edges.forEach((e, i) => { if (S.blocked.has(i) && layer("blocked")) return; const a = nodes[e.a], b = nodes[e.b]; ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); });
    ctx.stroke();
  }
  if (layer("blocked")) {
    ctx.strokeStyle = colors.destroyed; ctx.lineWidth = Math.max(1.5, 2.6 * z); ctx.setLineDash([5, 4]); ctx.beginPath();
    for (const i of S.blocked) { const e = net.edges[i], a = nodes[e.a], b = nodes[e.b]; ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  if (S.hoverChain >= 0) {
    ctx.strokeStyle = colors.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 9; ctx.beginPath();
    for (const i of S.chains.list[S.hoverChain]) { const e = net.edges[i], a = nodes[e.a], b = nodes[e.b]; ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  const k = r ? releaseAt(tt) : -1;
  if (r && k >= 0 && layer("released")) {
    const segs = r.releases[k].segs, bad = falseSegs(k);
    for (const pass of [false, true]) {
      ctx.strokeStyle = pass ? colors.bad : colors.final; ctx.lineWidth = Math.max(2.5, 4 * z) + (pass ? 1 : 0); ctx.beginPath();
      segs.forEach((g, i) => { if (!!bad[i] !== pass) return; ctx.moveTo(sx(g[0]), sy(g[1])); ctx.lineTo(sx(g[2]), sy(g[3])); });
      ctx.stroke();
    }
  }
  if (r && layer("chain")) {
    ctx.strokeStyle = colors.chain; ctx.lineWidth = Math.max(1, 1.6 * z); ctx.beginPath();
    for (const h of r.hist) if (h.born <= tt && h.died > tt) { ctx.moveTo(sx(h.a[0]), sy(h.a[1])); ctx.lineTo(sx(h.b[0]), sy(h.b[1])); }
    ctx.stroke();
  }
  if (r && layer("hazards")) {
    ctx.strokeStyle = colors.hazard; ctx.lineWidth = 2;
    for (const h of r.hazards) { if (h.t > tt) continue; const x = sx(h.x), y = sy(h.y);
      ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); }
  }
  if (r && layer("procs")) {
    for (const p of r.procs) {
      const x = sx(p.pos[0]), y = sy(p.pos[1]);
      ctx.strokeStyle = colors.proc; ctx.globalAlpha = 0.45; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, val("range") * S.view.s, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = p.tamper ? colors.bad : colors.proc; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 7, y + 5); ctx.lineTo(x - 7, y + 5); ctx.closePath(); ctx.fill();
    }
  }
  if (r && layer("people") && r.frames.length) {
    const f = Math.min(r.frames.length - 1, Math.max(0, S.frame - 1)), pos = r.frames[f], st = r.statusFrames[f];
    for (let i = 0; i < r.roles.length; i++) {
      const x = sx(pos[2 * i]), y = sy(pos[2 * i + 1]);
      if (st[i] === 0) { ctx.fillStyle = colors.agent; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 2 * Math.PI); ctx.fill(); }
      else { ctx.strokeStyle = st[i] === 1 ? colors.hazard : colors.muted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 2 * Math.PI); ctx.stroke();
        if (st[i] === 2) { ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.stroke(); } }
      if (layer("bad") && r.roles[i] !== "honest") { ctx.strokeStyle = colors.bad; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.stroke(); }
    }
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
