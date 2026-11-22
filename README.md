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
| `js/proteus-worker.js` | Runs the simulation and the Proteus pipeline in a Web Worker so the page stays responsive |
| `js/app.js` | Demo UI: map rendering, controls, OpenStreetMap loading |
| `js/uh-campus.json` | UH campus footpath network from [ProteusData](https://github.com/UH-DAIS/ProteusData), downloaded only when that area is picked |
| `fonts/` | Self-hosted Archivo, Source Serif 4 and IBM Plex Mono (SIL Open Font License, see `fonts/LICENSE.txt`) |
| `og/proteus-card.jpg` | Preview image for links shared on social media |
| `CNAME` | Custom domain for GitHub Pages |

The reference Python implementations live at
[RaunakDune/proteus-implementation](https://github.com/RaunakDune/proteus-implementation) and
[RaunakDune/deimosbc-implementation](https://github.com/RaunakDune/deimosbc-implementation).

## Local preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
