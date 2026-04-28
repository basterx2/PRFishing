# 🎣 Provo River Fishing Index

A Progressive Web App (PWA) for fly fishing on the Provo River, Utah.

![Mobile-first PWA](https://img.shields.io/badge/PWA-Mobile--first-4db8a0)
![No backend required](https://img.shields.io/badge/Backend-None%20required-07111f)
![Free APIs](https://img.shields.io/badge/APIs-Free%20%26%20public-e8b84b)

## Features

- **Fishing Index (0–100)** — composite score from 7 weighted variables
- **Solunar Periods** — computed entirely in JavaScript (no external API)
- **Live River Data** — USGS station 10163000 (flow, gauge height, water temp)
- **7-Day Weather Forecast** — National Weather Service (no API key needed)
- **Interactive Map** — Leaflet + OpenStreetMap with geospatial spot detection
- **Historical Charts** — Chart.js visualizations of flow, gauge, temperature
- **PWA** — installable, offline-capable, mobile-first

## Deploy to GitHub Pages

### Option A: GitHub Actions (recommended)

1. Fork or clone this repo
2. Go to **Settings → Pages**
3. Set Source to **GitHub Actions**
4. Push to `main` branch
5. Your app will be live at `https://yourusername.github.io/provo-fishing`

### Option B: Manual

```bash
# Install gh-pages tool
npm install -g gh-pages

# Deploy
gh-pages -d . --dotfiles
```

### Option C: Local development

```bash
# Python simple server
python3 -m http.server 8080

# Or with Node
npx serve .
```

Open http://localhost:8080

## Architecture

```
provo-fishing/
├── index.html          # Single page app shell
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline cache)
├── css/
│   └── main.css        # All styles (mobile-first, dark theme)
└── js/
    ├── config.js       # Constants, weights, coordinates
    ├── utils.js        # Shared helpers, cache, formatting
    ├── solunar.js      # Moon phase & solunar period calculator
    ├── usgs.js         # USGS river data fetcher
    ├── weather.js      # NWS weather API client
    ├── fishingIndex.js # Core scoring algorithm
    ├── map.js          # Leaflet map + geospatial spot detection
    ├── charts.js       # Chart.js visualizations
    ├── ui.js           # DOM rendering functions
    └── app.js          # Main orchestrator
```

## Fishing Index Formula

The index is a weighted sum of 7 variables, each scored 0–100:

| Variable | Weight | Notes |
|---|---|---|
| Solunar Activity | 25% | Phase + period proximity |
| Water Temperature | 20% | Optimal: 10–15°C for trout |
| River Flow (cfs) | 15% | Ideal: 150–500 cfs |
| Time of Day | 10% | Dawn/dusk peaks |
| Atmospheric Pressure | 10% | Stable = best |
| Cloud Cover | 10% | Overcast = trout less wary |
| Weather Stability | 10% | Consistent conditions |

**Modifiers:**
- Wind > 20mph → score penalty
- Rain probability > 60% → score penalty
- Full/New moon → +5 point bonus

## Geospatial Spot Detection Algorithm

The map detects fishing spots by analyzing river curvature:

1. Walk each consecutive pair of river segments
2. Compute the angle between vector A (prev→curr) and vector B (curr→next)
3. If bend angle > 12°, mark as a fishing spot
4. Classify by severity:
   - > 45° bend → **Pool** (deep, high score)
   - 25–45° bend → **Run** (medium)
   - 12–25° bend → **Riffle** (shallow, lower score)
5. Outside bend (cross product direction) = deeper pool → bonus points
6. Zone modifier applied per section (Upper/Middle/Lower)

## APIs Used

| API | Data | Key Required |
|---|---|---|
| USGS waterservices.usgs.gov | Flow, gauge, water temp | No |
| api.weather.gov (NWS) | Forecast, hourly | No |
| OpenStreetMap / CARTO | Map tiles | No |
| Solunar | Computed locally | No |

## License

MIT — built for the fly fishing community 🎣
