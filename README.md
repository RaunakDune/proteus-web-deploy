# crowdsensinglab.org

Website of the Crowdsensing Lab (Raunak Sarbajna, University of Houston), featuring
**Proteus**: a system for combining paths collected using crowdsensing
([GeoInformatica 30:7, 2026](https://link.springer.com/article/10.1007/s10707-026-00567-1)),
and **DEIMOSBC**: a blockchain-based system for crowdsensing after natural disasters
([BRAINS 2021](https://ieeexplore.ieee.org/document/9569794)), at `/deimosbc/`.

The site is static and is served by GitHub Pages at https://crowdsensinglab.org.

| File | Purpose |
|---|---|
| `index.html` | The page (content and styles) |
| `js/proteus-engine.js` | Browser port of Proteus: volunteer simulation, verification (Alg. 2), intersections (Alg. 3–4), map combination (Alg. 5–6) |
| `js/app.js` | Demo UI: map rendering, controls, OpenStreetMap loading |
| `js/uh-campus.js` | UH campus footpath network from [ProteusData](https://github.com/UH-DAIS/ProteusData) |
| `deimosbc/index.html` | DEIMOSBC page at [/deimosbc](https://crowdsensinglab.org/deimosbc/) (BRAINS 2021) |
| `deimosbc/js/deimosbc-engine.js` | Browser port of DEIMOSBC: volunteers, Trace Management System, smart contracts, consensus, SHA-256 ledger |
| `deimosbc/js/app.js` | DEIMOSBC demo UI (reuses the network loaders in `js/proteus-engine.js`) |
| `CNAME` | Custom domain for GitHub Pages |

The reference Python implementations live at
[RaunakDune/proteus-implementation](https://github.com/RaunakDune/proteus-implementation) and
[RaunakDune/deimosbc-implementation](https://github.com/RaunakDune/deimosbc-implementation).

## Local preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
