# crowdsensinglab.org

Website of the Crowdsensing Lab (Raunak Sarbajna, University of Houston), featuring
**Proteus**: a system for combining paths collected using crowdsensing
([GeoInformatica 30:7, 2026](https://link.springer.com/article/10.1007/s10707-026-00567-1)).

The site is static and is served by GitHub Pages at https://crowdsensinglab.org.

| File | Purpose |
|---|---|
| `index.html` | The page (content and styles) |
| `js/proteus-engine.js` | Browser port of Proteus: volunteer simulation, verification (Alg. 2), intersections (Alg. 3–4), map combination (Alg. 5–6) |
| `js/app.js` | Demo UI: map rendering, controls, OpenStreetMap loading |
| `js/uh-campus.js` | UH campus footpath network from [ProteusData](https://github.com/UH-DAIS/ProteusData) |
| `CNAME` | Custom domain for GitHub Pages |

The reference Python implementation lives at
[RaunakDune/proteus-implementation](https://github.com/RaunakDune/proteus-implementation).

## Local preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deployment

GitHub Pages, deployed from the `main` branch, root folder. DNS for `crowdsensinglab.org` is managed in Cloudflare:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | 185.199.108.153 | DNS only |
| A | `@` | 185.199.109.153 | DNS only |
| A | `@` | 185.199.110.153 | DNS only |
| A | `@` | 185.199.111.153 | DNS only |
| CNAME | `www` | raunakdune.github.io | DNS only |

Map data © OpenStreetMap contributors. Code: MIT licence.
