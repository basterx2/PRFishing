# 🎣 Provo River Fishing Intelligence — PWA

> Real-time fishing conditions, solunar analysis, and hotspot scoring for the Provo River, Utah.

---

## 📐 Architecture

```
provo-fishing-pwa/
├── index.html      ← Entire application (single file)
├── sw.js           ← Service Worker (PWA/offline)
├── manifest.json   ← PWA manifest
├── icon-192.png    ← App icon (generate separately)
└── icon-512.png    ← App icon large
```

### Module Structure (inside index.html)

```
CONFIG              — River, API, cache settings
Cache               — localStorage TTL cache (10 min)
WeatherModule       — Open-Meteo fetch + scoring
RiverModule         — USGS NWIS IV fetch + scoring + assessment
SolunarModule       — Pure JS solunar theory calculations
HotspotModule       — Heuristic geo scoring (10 hotspots)
ScoringModule       — Global index (40% solunar, 30% weather, 30% river)
MapModule           — Leaflet map + marker rendering
ChartModule         — Chart.js: flow, gage, solunar activity
UI                  — All DOM rendering functions
App                 — Bootstrap + tab routing + data orchestration
```

---

## 🌐 APIs Used

| API | Auth | Purpose |
|-----|------|---------|
| [Open-Meteo](https://open-meteo.com) | None | Weather current + 7-day forecast |
| [USGS NWIS IV](https://waterservices.usgs.gov/nwis/iv/) | None | River discharge (cfs) + gage height (ft) |
| [CartoDB Dark](https://carto.com/basemaps/) | None | Map tiles |
| Leaflet | CDN | Interactive map |
| Chart.js | CDN | River + solunar charts |

**Zero API keys required.**

---

## 🧠 Fishing Logic

### Hotspot Scoring Formula
```
score = (curvature × 0.40) + (lowVelocity × 0.30) + (transition × 0.20) + (width × 0.10)
```
Each factor is 0–1 based on real geographic analysis of the Provo River.

The final score is then modified by:
- **Flow modifier**: Low flow → favors deeper/slower spots. High flow → favors wide/slow spots.
- **Trend modifier**: Falling water (+10%) = clearing. Rising (-10%) = possible muddying.

### Global Fishing Index
```
index = (solunar × 40%) + (weather × 30%) + (river × 30%)
```

### Solunar Calculation
All done client-side using astronomical formulas (no API):
1. Julian Day Number → Moon phase (0–1)
2. Moon phase → Phase name, illumination, rating
3. Sun transit times using Meeus formulas
4. Moon transit = solar noon + phase offset
5. Feeding windows: ±1h around moon overhead/underfoot (Major), ±30min around moonrise/set + sunrise/set (Minor)

### River Scoring (USGS Station 10163000)
```
Ideal:    80–250 cfs  → +35 pts
Good:     50–400 cfs  → +20 pts
Marginal: 25–600 cfs  → +5 pts
High:     >600 cfs    → −25 pts (dangerous)
Low:      <25 cfs     → −15 pts (spooky fish)
```

### Weather Scoring
- Temperature sweet spot: 50–72°F (+15)
- Cloud cover: 40–80% preferred (+10)
- Wind: <5mph best (+10), >20mph bad (−15)
- Pressure: 1013–1025 hPa ideal (+10)

---

## 🚀 Deploy to GitHub Pages

### 1. Create repository
```bash
git init provo-fishing-pwa
cd provo-fishing-pwa
```

### 2. Add files
Copy all files into the directory:
```
index.html
sw.js
manifest.json
icon-192.png   ← Create a 192×192 PNG (blue fishing hook on dark bg)
icon-512.png   ← Create a 512×512 PNG version
```

### 3. Generate icons (quick method)
Use any online tool to create a simple 192×192 and 512×512 PNG icon.
Or use this placeholder approach — the app works without icons, they're just for install UX.

### 4. Push to GitHub
```bash
git add .
git commit -m "Initial: Provo River Fishing Intelligence PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/provo-fishing-pwa.git
git push -u origin main
```

### 5. Enable GitHub Pages
- Go to repo **Settings → Pages**
- Source: **Deploy from branch**
- Branch: **main** / **/ (root)**
- Click **Save**

### 6. Access your app
```
https://YOUR_USERNAME.github.io/provo-fishing-pwa/
```

### 7. Install on phone
- **iPhone**: Open in Safari → Share button → "Add to Home Screen"
- **Android**: Open in Chrome → menu → "Add to Home Screen" or "Install App"

---

## 📍 Hotspot Locations

| # | Name | Segment | Score Factor |
|---|------|---------|-------------|
| 1 | Murdock Diversion Hole | Upper | High curvature + transition |
| 2 | Deer Creek Inlet | Middle | Low velocity + transition |
| 3 | Bridal Veil Bend | Upper | Extreme curvature |
| 4 | Olmstead Diversion Pool | Middle | Transition + low velocity |
| 5 | Vivian Park Riffle Complex | Middle | Width + species diversity |
| 6 | South Fork Confluence | Lower | Maximum transition score |
| 7 | Lower Canyon Oxbow | Lower | Curvature + slow inside bend |
| 8 | Provo Canyon Narrows | Upper | Low score (fast water, expert only) |
| 9 | Midway Flats Wide Bend | Middle | Width factor dominant |
| 10 | Canyon Glen Park Pool | Lower | Low velocity + accessibility |

---

## 🔧 Extending the App

### Add a new river
1. Create a new config block in `CONFIG`
2. Duplicate module calls with the new station ID
3. Add GeoJSON coordinates to `MapModule.riverSegments`
4. Add hotspot data to `HotspotModule.spots` with new segment IDs

### Add water temperature (USGS parameter 00010)
Add `00010` to the `parameterCd` in `RiverModule.fetch()` and process accordingly. Water temp is critical for trout — ideal range 45–65°F.

### Add hatch calendar
Create a `HatchModule` with monthly data keyed to temperature ranges. Cross-reference with current water temp and month to suggest fly patterns.

---

## 🐛 Known Limitations

- Solunar times use simplified astronomical formulas (±15 min accuracy). For exact professional-grade times, integrate a dedicated solunar API.
- USGS data may have a 15–30 minute lag.
- No water temperature data (USGS parameter 00010 not in current fetch, but trivial to add).
- Icon files (icon-192.png, icon-512.png) must be created separately.

---

*Built for serious fly fishers. Provo River, Heber Valley, Utah.*
