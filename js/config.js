// ============================================================
// CONFIG — Provo River Fishing Index
// ============================================================
const CONFIG = {
  appName: 'Provo River Fishing Index',
  version: '1.0.0',

  // USGS Station for Provo River at Provo
  usgs: {
    stationId: '10163000',
    baseUrl: 'https://waterservices.usgs.gov/nwis',
  },

  // NWS grid point for Provo area
  nws: {
    office: 'SLC',
    gridX: 96,
    gridY: 87,
    lat: 40.2338,
    lon: -111.6585,
    baseUrl: 'https://api.weather.gov',
  },

  // River geographic center for solunar calculations
  river: {
    lat: 40.37,
    lon: -111.55,
    timezone: 'America/Denver',
  },

  // River zones (bounding boxes for map filtering)
  zones: {
    upper:  { label: 'Upper Provo', lat: [40.55, 40.65], lon: [-111.42, -111.28], color: '#4db8a0' },
    middle: { label: 'Middle Provo', lat: [40.40, 40.55], lon: [-111.52, -111.36], color: '#e8b84b' },
    lower:  { label: 'Lower Provo', lat: [40.23, 40.40], lon: [-111.68, -111.50], color: '#e8884b' },
  },

  // Fishing Index weights (must sum to 1)
  indexWeights: {
    solunar:    0.25,
    waterTemp:  0.20,
    flow:       0.15,
    timeOfDay:  0.10,
    pressure:   0.10,
    cloudCover: 0.10,
    stability:  0.10,
  },

  // Ideal conditions for Rainbow/Brown Trout
  trout: {
    idealWaterTempMin: 10,  // °C
    idealWaterTempMax: 15,  // °C
    lowFlowCfs: 80,         // too low
    idealFlowMin: 150,
    idealFlowMax: 500,
    highFlowCfs: 800,       // too high
  },

  // Cache TTL in minutes
  cache: {
    usgs: 30,
    weather: 60,
  },

  // Map defaults
  map: {
    center: [40.37, -111.55],
    zoom: 11,
    minZoom: 9,
    maxZoom: 17,
  },
};
