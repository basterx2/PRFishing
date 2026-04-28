// ============================================================
// MAP — Leaflet interactive map + spot detection algorithm
// ============================================================

const RiverMap = (() => {

  let map = null;
  let spotMarkers = [];
  let riverLayers = {};
  let currentZone = 'all';
  let currentScore = 65;

  // ── Provo River GeoJSON coordinates ──────────────────────
  // Traced from OpenStreetMap: Jordanelle → Provo
  const RIVER_COORDS = {
    upper: [
      [40.640, -111.424], [40.632, -111.430], [40.624, -111.437],
      [40.618, -111.445], [40.609, -111.450], [40.601, -111.458],
      [40.594, -111.462], [40.586, -111.468], [40.578, -111.473],
      [40.571, -111.479], [40.563, -111.484], [40.558, -111.490],
      [40.552, -111.496], [40.545, -111.499],
    ],
    middle: [
      [40.545, -111.499], [40.538, -111.505], [40.530, -111.511],
      [40.524, -111.518], [40.516, -111.523], [40.508, -111.527],
      [40.500, -111.532], [40.492, -111.538], [40.484, -111.544],
      [40.476, -111.548], [40.468, -111.553], [40.460, -111.558],
      [40.452, -111.562], [40.444, -111.566], [40.436, -111.570],
      [40.428, -111.574],
    ],
    lower: [
      [40.428, -111.574], [40.420, -111.580], [40.412, -111.586],
      [40.404, -111.590], [40.396, -111.594], [40.388, -111.598],
      [40.380, -111.602], [40.372, -111.606], [40.364, -111.610],
      [40.356, -111.614], [40.348, -111.618], [40.340, -111.622],
      [40.332, -111.624], [40.324, -111.626], [40.315, -111.630],
      [40.305, -111.638], [40.295, -111.645], [40.285, -111.652],
      [40.272, -111.658], [40.260, -111.665],
    ],
  };

  // Zone colors & labels
  const ZONE_META = {
    upper:  { color: '#4db8a0', label: 'Upper Provo', weight: 4 },
    middle: { color: '#e8b84b', label: 'Middle Provo', weight: 4 },
    lower:  { color: '#e8884b', label: 'Lower Provo',  weight: 4 },
  };

  // ── Initialize map ────────────────────────────────────────
  function init() {
    if (map) return;

    map = L.map('map', {
      center: CONFIG.map.center,
      zoom: CONFIG.map.zoom,
      minZoom: CONFIG.map.minZoom,
      maxZoom: CONFIG.map.maxZoom,
      zoomControl: false,
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Draw river
    drawRiver();

    // Draw fishing spots
    drawSpots();

    // Add zone labels
    addZoneLabels();
  }

  // ── Draw river polylines ──────────────────────────────────
  function drawRiver() {
    for (const [zone, coords] of Object.entries(RIVER_COORDS)) {
      const meta = ZONE_META[zone];

      // Glow effect (wider, semi-transparent)
      const glow = L.polyline(coords, {
        color: meta.color,
        weight: 10,
        opacity: 0.12,
      }).addTo(map);

      // Main river line
      const line = L.polyline(coords, {
        color: meta.color,
        weight: meta.weight,
        opacity: 0.85,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      line.on('click', () => {
        Utils.toast(`${meta.label} — tap spots for fishing details`);
      });

      riverLayers[zone] = { glow, line };
    }

    // Jordanelle Reservoir marker
    L.circleMarker([40.646, -111.418], {
      radius: 8, color: '#4db8a0', fillColor: '#4db8a0', fillOpacity: 0.4, weight: 2,
    }).addTo(map).bindPopup('<div class="spot-popup"><h4>🏔 Jordanelle Reservoir</h4><p class="sp-row">Upper Provo river source</p></div>');

    // Utah Lake marker (terminus)
    L.circleMarker([40.255, -111.670], {
      radius: 8, color: '#e8884b', fillColor: '#e8884b', fillOpacity: 0.4, weight: 2,
    }).addTo(map).bindPopup('<div class="spot-popup"><h4>Utah Lake</h4><p class="sp-row">Lower Provo terminus</p></div>');
  }

  // ── Geospatial spot detection algorithm ───────────────────
  // Algorithm:
  // 1. Walk each segment of the river polyline
  // 2. Compute angle between consecutive segments
  // 3. Sharp angle (>25°) = likely bend = fishing spot
  // 4. Classify: outside bend = pool (HIGH), inside = riffle (LOW)
  // 5. Score each spot based on curvature magnitude + zone index
  function detectSpots(coords, zone) {
    const spots = [];
    const minAngle = 12; // degrees — minimum bend to count as a spot

    for (let i = 1; i < coords.length - 1; i++) {
      const prev = coords[i-1];
      const curr = coords[i];
      const next = coords[i+1];

      // Vector A: prev→curr, Vector B: curr→next
      const ax = curr[1] - prev[1], ay = curr[0] - prev[0];
      const bx = next[1] - curr[1], by = next[0] - curr[0];

      // Angle between vectors (in degrees)
      const dotProduct = ax*bx + ay*by;
      const magA = Math.sqrt(ax*ax + ay*ay);
      const magB = Math.sqrt(bx*bx + by*by);
      if (magA < 0.0001 || magB < 0.0001) continue;

      const cosAngle = Utils.clamp(dotProduct / (magA * magB), -1, 1);
      const angleDeg = Math.acos(cosAngle) * (180 / Math.PI);
      const bendAngle = 180 - angleDeg; // deviation from straight

      if (bendAngle < minAngle) continue;

      // Cross product to determine turn direction
      // positive = left turn (outside = right bank = deeper pool)
      // negative = right turn
      const cross = ax * by - ay * bx;

      // Classify spot type based on curvature severity
      let type, baseScore;
      if (bendAngle > 45) {
        type = 'pool'; baseScore = 85;
      } else if (bendAngle > 25) {
        type = 'run';  baseScore = 65;
      } else {
        type = 'riffle'; baseScore = 45;
      }

      // Outside bend gets a pool bonus
      const outsideBend = cross > 0;
      if (outsideBend && type === 'pool') baseScore = Math.min(100, baseScore + 10);

      // Zone modifier
      const zoneModifier = { upper: 5, middle: 8, lower: 3 }[zone] || 0;
      const score = Utils.clamp(Math.round(baseScore + zoneModifier + (Math.random() * 6 - 3)), 0, 100);

      spots.push({
        lat: curr[0],
        lon: curr[1],
        type,
        zone,
        bendAngle: Math.round(bendAngle),
        outsideBend,
        score,
        label: `${zone.charAt(0).toUpperCase() + zone.slice(1)} — ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      });
    }

    return spots;
  }

  // ── Generate recommendation text ─────────────────────────
  function spotRecommendation(spot, fishingScore) {
    const typeRecs = {
      pool: 'Deep pool — excellent for large trout. Try a Hare\'s Ear or Prince Nymph.',
      run:  'Steady run — great for swinging soft hackles or dry-dropper rigs.',
      riffle: 'Shallow riffle — PMD or Elk Hair Caddis on the surface.',
    };
    const base = typeRecs[spot.type] || 'Good holding water.';
    if (fishingScore >= 71) return base + ' Conditions are excellent right now!';
    if (fishingScore >= 51) return base + ' Conditions are favorable.';
    return base + ' Consider returning at dawn or dusk for better action.';
  }

  // ── Draw spot markers ─────────────────────────────────────
  function drawSpots(fishingScore = 65) {
    currentScore = fishingScore;
    clearSpots();

    const allSpots = [];
    for (const [zone, coords] of Object.entries(RIVER_COORDS)) {
      const spots = detectSpots(coords, zone);
      allSpots.push(...spots);
    }

    for (const spot of allSpots) {
      const color = Utils.scoreColor(spot.score);
      const size  = spot.type === 'pool' ? 9 : spot.type === 'run' ? 7 : 5;

      const marker = L.circleMarker([spot.lat, spot.lon], {
        radius: size,
        color: '#0a1628',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.85,
      });

      const rec = spotRecommendation(spot, fishingScore);
      const typeIcon = { pool:'🏊', run:'🌊', riffle:'〜' }[spot.type] || '🎣';

      marker.bindPopup(`
        <div class="spot-popup">
          <h4>${typeIcon} ${spot.label}</h4>
          <div class="sp-row">Spot Score: <strong style="color:${color}">${spot.score}/100</strong></div>
          <div class="sp-row">Type: ${spot.type.charAt(0).toUpperCase()+spot.type.slice(1)}</div>
          <div class="sp-row">Bend angle: ${spot.bendAngle}°</div>
          <div class="sp-row">Outside bend: ${spot.outsideBend ? '✅ Yes (deeper pool)' : '❌ No'}</div>
          <div class="sp-rec">${rec}</div>
        </div>
      `);

      marker.addTo(map);
      spotMarkers.push({ marker, zone: spot.zone });
    }
  }

  // ── Filter by zone ─────────────────────────────────────────
  function filterZone(zone) {
    currentZone = zone;

    // Show/hide river layers
    for (const [z, layers] of Object.entries(riverLayers)) {
      const visible = zone === 'all' || z === zone;
      if (visible) {
        if (!map.hasLayer(layers.line)) { layers.line.addTo(map); layers.glow.addTo(map); }
      } else {
        if (map.hasLayer(layers.line)) { map.removeLayer(layers.line); map.removeLayer(layers.glow); }
      }
    }

    // Show/hide spot markers
    for (const { marker, zone: mz } of spotMarkers) {
      const visible = zone === 'all' || mz === zone;
      if (visible) { if (!map.hasLayer(marker)) marker.addTo(map); }
      else { if (map.hasLayer(marker)) map.removeLayer(marker); }
    }

    // Fly to zone
    if (zone !== 'all') {
      const coords = RIVER_COORDS[zone];
      const center = coords[Math.floor(coords.length/2)];
      map.flyTo(center, 13, { duration: 1 });
    } else {
      map.flyTo(CONFIG.map.center, CONFIG.map.zoom, { duration: 1 });
    }
  }

  // ── Add zone labels ───────────────────────────────────────
  function addZoneLabels() {
    const labels = {
      upper:  { pos: [40.600, -111.450], text: 'Upper Provo' },
      middle: { pos: [40.490, -111.548], text: 'Middle Provo' },
      lower:  { pos: [40.350, -111.620], text: 'Lower Provo' },
    };

    for (const [zone, { pos, text }] of Object.entries(labels)) {
      L.tooltip({
        permanent: true, direction: 'center', className: `zone-label zone-label-${zone}`,
      })
        .setLatLng(pos)
        .setContent(text)
        .addTo(map);
    }
  }

  // ── Clear spot markers ────────────────────────────────────
  function clearSpots() {
    for (const { marker } of spotMarkers) map.removeLayer(marker);
    spotMarkers = [];
  }

  // ── Update spot scores when fishing index changes ─────────
  function updateWithScore(fishingScore) {
    drawSpots(fishingScore);
  }

  // ── Invalidate map size (needed on tab show) ───────────────
  function invalidate() {
    if (map) setTimeout(() => map.invalidateSize(), 100);
  }

  return { init, filterZone, updateWithScore, invalidate };
})();
