/* Runs the Proteus simulation and pipeline off the main thread, so the page
   stays responsive while volunteers are simulated and traces are verified. */
importScripts("proteus-engine.js?v=2026-11-21");

let net = null;   // road network for the current area
let sim = null;   // traces from the latest simulation

self.onmessage = ({ data }) => {
  const { id, type } = data;
  try {
    if (type === "net") {
      net = data.net; sim = null;
      self.postMessage({ id });
    } else if (type === "simulate") {
      sim = Proteus.simulate(net, new Set(data.destroyed), data.opts);
      self.postMessage({ id, sim });               // structured copy; the worker keeps its own
    } else if (type === "run") {
      const r = Proteus.run(net, new Set(data.destroyed), sim, data.params);
      // Send back only what the page draws and reports.
      self.postMessage({ id, res: {
        metrics: r.metrics,
        ok: r.ver.ok,
        junctions: r.inter.junctions,
        subs: r.comb.subs,
        kept: r.comb.kept,
      } });
    }
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
