// ============================================================
// APP — Main orchestrator v2
// Bulletproof init — splash ALWAYS hides
// ============================================================

const App = (() => {

  const state = {
    selectedDayIndex: 0,
    days: [],
    forecast: null,
    riverData: null,
    historicalData: null,
    solunar: null,
    currentResult: null,
    mapInitialized: false,
  };

  // ── Boot — wrapped in triple safety net ──────────────────
  async function init() {
    try {
      await boot();
    } catch(e) {
      console.error('Boot error:', e);
      emergencyRender();
    } finally {
      // ALWAYS hide splash, no matter what
      safeSplashHide();
    }
  }

  async function boot() {
    UI.setSplashStatus('Building calendar...');

    const today = new Date();
    today.setHours(0,0,0,0);
    state.days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() + i); return d;
    });

    UI.setSplashStatus('Fetching river & weather data...');

    // Fetch data — each request has its own fallback, so Promise.allSettled is safe
    const [fxRes, riverRes, histRes] = await Promise.allSettled([
      Weather.fetchForecast(),
      USGS.fetchCurrentConditions(),
      USGS.fetchHistoricalData(7),
    ]);

    state.forecast      = fxRes.status    === 'fulfilled' ? fxRes.value    : Weather.fetchForecast().catch(() => null) && getMockForecast();
    state.riverData     = riverRes.status === 'fulfilled' ? riverRes.value : getMockRiver();
    state.historicalData = histRes.status === 'fulfilled' ? histRes.value  : getMockHistorical();

    // Final safety: ensure forecast is never null
    if (!state.forecast || !state.forecast.days) {
      state.forecast = buildMockForecast();
    }
    if (!state.riverData) {
      state.riverData = getMockRiver();
    }

    UI.setSplashStatus('Computing solunar periods...');

    // Wire up UI
    initEventHandlers();
    UI.initTabs(onTabChange);
    UI.initZoneButtons(zone => RiverMap.filterZone(zone));
    UI.renderDateStrip(state.days, 0, onDaySelect);

    UI.setSplashStatus('Rendering dashboard...');
    await renderDay(0);
  }

  // ── Render a specific day ─────────────────────────────────
  async function renderDay(dayIndex) {
    try {
      state.selectedDayIndex = dayIndex;
      const date    = state.days[dayIndex];
      const isToday = dayIndex === 0;

      // Solunar — wrapped in try/catch
      try {
        state.solunar = Solunar.getSolunarPeriods(date, CONFIG.river.lat, CONFIG.river.lon);
      } catch(e) {
        console.warn('Solunar failed:', e.message);
        state.solunar = getSolunarFallback(date);
      }

      const wxDay = state.forecast?.days?.[dayIndex] || state.forecast?.days?.[0] || null;
      const airTempC = wxDay?.tempC ?? 15;

      const waterTempC = (isToday && state.riverData?.waterTemp != null)
        ? state.riverData.waterTemp
        : USGS.estimateWaterTemp(airTempC, date);

      const stabilityScore = Weather.stabilityScore(state.forecast);

      const params = {
        solunarScore:  state.solunar.solunarScore,
        waterTempC,
        flowCfs:       isToday ? (state.riverData?.flow ?? null) : null,
        airTempC,
        cloudCoverPct: wxDay?.cloudCover ?? 50,
        pressureTrend: 'stable',
        precipProb:    wxDay?.probabilityOfPrecipitation ?? 0,
        windSpeed:     wxDay?.windSpeed ?? 5,
        stabilityScore,
        date,
        sunRise: state.solunar.sunRise,
        sunSet:  state.solunar.sunSet,
      };

      state.currentResult = FishingIndex.calculate(params);

      const hourlyScores = FishingIndex.getHourlyScores(
        {
          solunarScore:   params.solunarScore,
          waterTempScore: USGS.waterTempScore(waterTempC),
          flowScore:      USGS.flowScore(params.flowCfs),
          pressureScore:  Weather.pressureScore(860, 'stable'),
          cloudScore:     Weather.cloudCoverScore(params.cloudCoverPct),
          stabilityScore,
        },
        state.solunar.sunRise,
        state.solunar.sunSet
      );

      const recs = FishingIndex.getRecommendations(state.currentResult, {
        waterTempC, flowCfs: params.flowCfs,
        cloudCoverPct: params.cloudCoverPct, windSpeed: params.windSpeed,
      });

      UI.renderHero(state.currentResult);
      UI.renderBestTimeBar(hourlyScores);
      UI.renderSolunar(state.solunar);
      UI.renderWeather(wxDay, isToday);
      UI.renderRiver(
        isToday ? state.riverData : { flow:null, gauge:null, waterTemp:null, trend:'—' },
        airTempC, date
      );
      UI.renderBreakdown(state.currentResult.breakdown);
      UI.renderRecommendations(recs);
      UI.renderForecast(state.forecast?.days || [], state.riverData, onDaySelect, dayIndex);

      if (state.mapInitialized) RiverMap.updateWithScore(state.currentResult.score);

    } catch(e) {
      console.error('renderDay error:', e);
      // Show partial data rather than crashing
      UI.renderHero({ score: 55, rating: 'Good', ratingClass: 'rating-good',
        breakdown: [], components: {} });
    }
  }

  // ── Emergency render when everything fails ────────────────
  function emergencyRender() {
    console.warn('Emergency render triggered');
    if (!state.forecast) state.forecast = buildMockForecast();
    if (!state.riverData) state.riverData = getMockRiver();
    if (!state.days.length) {
      const today = new Date(); today.setHours(0,0,0,0);
      state.days = Array.from({length:7}, (_,i) => { const d=new Date(today); d.setDate(d.getDate()+i); return d; });
    }
    try {
      initEventHandlers();
      UI.initTabs(onTabChange);
      UI.initZoneButtons(zone => RiverMap.filterZone(zone));
      UI.renderDateStrip(state.days, 0, onDaySelect);
      renderDay(0);
    } catch(e2) {
      console.error('Emergency render also failed:', e2);
    }
    Utils.toast('Running in offline mode');
  }

  function safeSplashHide() {
    try { UI.hideSplash(); } catch(e) {
      // Manual fallback
      const splash = document.getElementById('splash');
      const app    = document.getElementById('app');
      if (splash) { splash.style.opacity = '0'; splash.style.pointerEvents = 'none'; }
      if (app)    app.classList.remove('hidden');
    }
  }

  // ── Day selection ─────────────────────────────────────────
  async function onDaySelect(idx) {
    if (idx === state.selectedDayIndex) return;
    UI.renderDateStrip(state.days, idx, onDaySelect);
    await renderDay(idx);
    Utils.toast(`Forecast: ${Utils.formatDay(state.days[idx])}`);
  }

  // ── Tab change ────────────────────────────────────────────
  function onTabChange(tab) {
    if (tab === 'map') {
      if (!state.mapInitialized) {
        try { RiverMap.init(); state.mapInitialized = true; } catch(e) { console.warn('Map init failed:', e); }
        if (state.currentResult) RiverMap.updateWithScore(state.currentResult.score);
      } else {
        RiverMap.invalidate();
      }
    }
    if (tab === 'charts' && state.historicalData) {
      try {
        const scores = UI.buildForecastScores(state.forecast?.days || [], state.riverData);
        Charts.renderAll(state.historicalData, scores, Utils.isCelsius());
      } catch(e) { console.warn('Charts failed:', e); }
    }
    if (tab === 'forecast') {
      try {
        UI.renderForecast(state.forecast?.days || [], state.riverData, onDaySelect, state.selectedDayIndex);
      } catch(e) { console.warn('Forecast render failed:', e); }
    }
  }

  // ── Event handlers ────────────────────────────────────────
  function initEventHandlers() {
    const unitBtn = document.getElementById('unitToggle');
    if (unitBtn) {
      unitBtn.addEventListener('click', function() {
        const isCelsius = Utils.toggleUnits();
        this.textContent = isCelsius ? '°C' : '°F';
        const wxDay = state.forecast?.days?.[state.selectedDayIndex];
        const date  = state.days[state.selectedDayIndex];
        UI.renderWeather(wxDay, state.selectedDayIndex === 0);
        UI.renderRiver(
          state.selectedDayIndex === 0 ? state.riverData : {flow:null,gauge:null,waterTemp:null,trend:'—'},
          wxDay?.tempC, date
        );
        UI.renderForecast(state.forecast?.days||[], state.riverData, onDaySelect, state.selectedDayIndex);
        const chartsTab = document.getElementById('tab-charts');
        if (chartsTab?.classList.contains('active') && state.historicalData) {
          const scores = UI.buildForecastScores(state.forecast?.days||[], state.riverData);
          Charts.renderAll(state.historicalData, scores, Utils.isCelsius());
        }
        Utils.toast(`Units: ${isCelsius ? 'Celsius' : 'Fahrenheit'}`);
      });
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => Utils.toast('Settings coming soon'));

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const lastRefresh = parseInt(localStorage.getItem('lastRefresh') || '0');
        if (Date.now() - lastRefresh > 30 * 60000) {
          localStorage.setItem('lastRefresh', Date.now());
          renderDay(state.selectedDayIndex);
        }
      }
    });

    try { localStorage.setItem('lastRefresh', Date.now()); } catch(e) { /* ignore */ }
  }

  // ── Fallback data generators ──────────────────────────────
  function getMockRiver() {
    return { flow: 285, gauge: 2.45, waterTemp: null, trend: '→ Stable', mock: true };
  }

  function getMockHistorical() {
    return { flowSeries: [], gaugeSeries: [], tempSeries: [], mock: true };
  }

  function buildMockForecast() {
    const descs = ['Sunny','Partly Cloudy','Mostly Cloudy','Chance of Rain','Clear','Sunny','Partly Sunny'];
    const temps  = [17, 15, 13, 12, 16, 18, 15];
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() + i); date.setHours(0,0,0,0);
      return {
        date, dateStr: Utils.toISODate(date), dayLabel: Utils.formatDay(date),
        shortForecast: descs[i], detailedForecast: '',
        tempC: temps[i], nightTempC: temps[i] - 7,
        windSpeed: 8, windDir: 'SW',
        probabilityOfPrecipitation: i === 3 ? 40 : 5,
        cloudCover: Weather.estimateCloudCover(descs[i]),
        weatherIcon: Utils.weatherIcon(descs[i]),
        isDaytime: true, humidity: 45,
      };
    });
    return { days, current: days[0], basePressure: 860, pressureStable: true };
  }

  function getSolunarFallback(date) {
    const r = new Date(date); r.setHours(6,30,0,0);
    const s = new Date(date); s.setHours(20,0,0,0);
    return {
      periods:[
        { type:'major', label:'Major (Moonrise)',  time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),6,0),  duration:120 },
        { type:'minor', label:'Minor',             time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),12,0), duration:60  },
        { type:'major', label:'Major (Moonset)',   time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),18,0), duration:120 },
        { type:'minor', label:'Minor',             time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),21,0), duration:60  },
      ],
      moonPhase:0.25, phaseInfo:{name:'Waxing Crescent',emoji:'🌒'},
      phaseScore:55, periodScore:40, solunarScore:46,
      moonRise:r, moonSet:s, sunRise:r, sunSet:s,
    };
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());

// ── HATCH CALENDAR integration (appended) ───────────────
// Override onTabChange to handle hatch tab
const _origOnTabChange = typeof App !== 'undefined' ? null : null;

document.addEventListener('DOMContentLoaded', () => {
  // Patch: intercept hatch tab activation
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.dataset.tab === 'hatch') {
      tab.addEventListener('click', () => {
        // Init hatch calendar with current water temp
        const waterTempEl = document.getElementById('rTemp');
        let waterTemp = null;
        if (waterTempEl) {
          const match = waterTempEl.textContent.match(/([\d.]+)/);
          if (match) waterTemp = parseFloat(match[1]);
        }
        HatchCalendar.init(waterTemp);
      });
    }
  });

  // Widget link → switch to hatch tab
  document.getElementById('hatchWidgetLink')?.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const hatchTab = document.querySelector('[data-tab="hatch"]');
    const hatchContent = document.getElementById('tab-hatch');
    if (hatchTab) hatchTab.classList.add('active');
    if (hatchContent) hatchContent.classList.add('active');
    HatchCalendar.init(null);
  });
});

// Render today's hatch widget on dashboard
function renderHatchWidget(waterTempC) {
  const list = document.getElementById('hatchTodayList');
  if (!list) return;

  const month = new Date().getMonth() + 1;
  const active = HatchCalendar.getTodayHatches(waterTempC, month).slice(0, 3);

  if (!active.length) {
    list.innerHTML = '<div style="color:var(--text-3);font-size:0.78rem">No major hatches today — try midges.</div>';
    return;
  }

  list.innerHTML = active.map(h => {
    const intensity = h.intensity[month] || 0;
    const iColor = HatchCalendar.intensityColor(intensity);
    const iLabel = HatchCalendar.intensityLabel(intensity);
    return `
      <div class="hatch-today-item">
        <span class="hatch-today-emoji">${h.emoji}</span>
        <div class="hatch-today-info">
          <div class="hatch-today-name">${h.name}</div>
          <div class="hatch-today-detail">${h.timeLabel} · ${h.sizeLabel}</div>
        </div>
        <span class="hatch-today-intensity" style="color:${iColor};background:${iColor}18">${iLabel}</span>
      </div>`;
  }).join('');
}

// Auto-render widget after app loads
window.addEventListener('load', () => {
  setTimeout(() => {
    const waterTempEl = document.getElementById('rTemp');
    let wt = null;
    if (waterTempEl) {
      const m = waterTempEl.textContent.match(/([\d.]+)/);
      if (m) wt = parseFloat(m[1]);
    }
    renderHatchWidget(wt);
  }, 2500);
});
