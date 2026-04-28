// ============================================================
// APP — Main orchestrator
// Provo River Fishing Index PWA
// ============================================================

const App = (() => {

  // ── State ─────────────────────────────────────────────────
  const state = {
    selectedDayIndex: 0,
    days: [],
    forecast: null,
    riverData: null,
    historicalData: null,
    hourlyData: null,
    solunar: null,
    currentResult: null,
    mapInitialized: false,
    chartsRendered: false,
  };

  // ── Boot sequence ─────────────────────────────────────────
  async function init() {
    UI.setSplashStatus('Loading river conditions...');

    // Generate 7-day array starting today
    const today = new Date();
    state.days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // Fetch all data in parallel
    try {
      UI.setSplashStatus('Fetching weather & river data...');
      const [forecast, riverData, historicalData, hourlyData] = await Promise.all([
        Weather.fetchForecast(),
        USGS.fetchCurrentConditions(),
        USGS.fetchHistoricalData(7),
        Weather.fetchHourly(),
      ]);

      state.forecast = forecast;
      state.riverData = riverData;
      state.historicalData = historicalData;
      state.hourlyData = hourlyData;

      if (riverData.mock) Utils.toast('Using demo data — check your connection');
    } catch(e) {
      console.error('Init fetch error:', e);
      // Use mock data
      state.forecast = await Weather.fetchForecast(); // will return mock
      state.riverData = { flow: 285, gauge: 2.45, waterTemp: null, trend: '→ Stable', mock: true };
      state.historicalData = { flowSeries: [], gaugeSeries: [], tempSeries: [], mock: true };
    }

    UI.setSplashStatus('Calculating solunar periods...');

    // Init UI components
    initEventHandlers();
    UI.initTabs(onTabChange);
    UI.initZoneButtons(zone => RiverMap.filterZone(zone));

    // Render initial day
    UI.renderDateStrip(state.days, 0, onDaySelect);
    await renderDay(0);

    UI.hideSplash();
  }

  // ── Render a specific day ─────────────────────────────────
  async function renderDay(dayIndex) {
    state.selectedDayIndex = dayIndex;
    const date = state.days[dayIndex];
    const isToday = dayIndex === 0;

    // Solunar for this day
    state.solunar = Solunar.getSolunarPeriods(
      date,
      CONFIG.river.lat,
      CONFIG.river.lon
    );

    // Weather for this day
    const wxDay = state.forecast?.days?.[dayIndex] || state.forecast?.current;

    // Water temp: use USGS if today, estimate otherwise
    const airTempC = wxDay?.tempC || 15;
    const waterTempC = (isToday && state.riverData?.waterTemp != null)
      ? state.riverData.waterTemp
      : USGS.estimateWaterTemp(airTempC, date);

    // Stability score
    const stabilityScore = Weather.stabilityScore(state.forecast);

    // Build params
    const params = {
      solunarScore:   state.solunar.solunarScore,
      waterTempC,
      flowCfs:        isToday ? state.riverData?.flow : null,
      airTempC,
      cloudCoverPct:  wxDay?.cloudCover || 50,
      pressureTrend:  'stable',
      precipProb:     wxDay?.probabilityOfPrecipitation || 0,
      windSpeed:      wxDay?.windSpeed || 0,
      stabilityScore,
      date,
      sunRise:        state.solunar.sunRise,
      sunSet:         state.solunar.sunSet,
    };

    // Calculate index
    state.currentResult = FishingIndex.calculate(params);

    // Hourly scores for time bar
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

    // Recommendations
    const recs = FishingIndex.getRecommendations(state.currentResult, {
      waterTempC,
      flowCfs:       params.flowCfs,
      cloudCoverPct: params.cloudCoverPct,
      windSpeed:     params.windSpeed,
    });

    // ── Update DOM ────────────────────────────────────────────
    UI.renderHero(state.currentResult);
    UI.renderBestTimeBar(hourlyScores);
    UI.renderSolunar(state.solunar);
    UI.renderWeather(wxDay, isToday);
    UI.renderRiver(
      isToday ? state.riverData : { flow: null, gauge: null, waterTemp: null, trend: '—' },
      airTempC,
      date
    );
    UI.renderBreakdown(state.currentResult.breakdown);
    UI.renderRecommendations(recs);
    UI.renderForecast(
      state.forecast?.days || [],
      state.riverData,
      onDaySelect,
      dayIndex
    );

    // Update map spots with new score
    if (state.mapInitialized) {
      RiverMap.updateWithScore(state.currentResult.score);
    }
  }

  // ── Day selection handler ─────────────────────────────────
  async function onDaySelect(idx) {
    if (idx === state.selectedDayIndex) return;
    UI.renderDateStrip(state.days, idx, onDaySelect);
    await renderDay(idx);
    Utils.toast(`Showing forecast for ${Utils.formatDay(state.days[idx])}`);
  }

  // ── Tab change handler ────────────────────────────────────
  function onTabChange(tab) {
    if (tab === 'map' && !state.mapInitialized) {
      RiverMap.init();
      state.mapInitialized = true;
      if (state.currentResult) RiverMap.updateWithScore(state.currentResult.score);
    } else if (tab === 'map') {
      RiverMap.invalidate();
    }

    if (tab === 'charts' && state.historicalData) {
      const forecastScores = UI.buildForecastScores(
        state.forecast?.days || [],
        state.riverData
      );
      Charts.renderAll(state.historicalData, forecastScores, Utils.isCelsius());
    }

    if (tab === 'forecast' && state.forecast) {
      UI.renderForecast(
        state.forecast.days,
        state.riverData,
        onDaySelect,
        state.selectedDayIndex
      );
    }
  }

  // ── Event handlers ────────────────────────────────────────
  function initEventHandlers() {
    // Unit toggle
    document.getElementById('unitToggle').addEventListener('click', function() {
      const isCelsius = Utils.toggleUnits();
      this.textContent = isCelsius ? '°C' : '°F';
      // Re-render weather and river
      const wxDay = state.forecast?.days?.[state.selectedDayIndex];
      const date  = state.days[state.selectedDayIndex];
      UI.renderWeather(wxDay, state.selectedDayIndex === 0);
      UI.renderRiver(
        state.selectedDayIndex === 0 ? state.riverData : { flow:null, gauge:null, waterTemp:null, trend:'—' },
        wxDay?.tempC,
        date
      );
      // Re-render forecast (temperatures)
      UI.renderForecast(
        state.forecast?.days || [],
        state.riverData,
        onDaySelect,
        state.selectedDayIndex
      );
      // Re-render charts if visible
      const chartsTab = document.getElementById('tab-charts');
      if (chartsTab?.classList.contains('active') && state.historicalData) {
        const scores = UI.buildForecastScores(state.forecast?.days || [], state.riverData);
        Charts.renderAll(state.historicalData, scores, Utils.isCelsius());
      }
      Utils.toast(`Switched to ${isCelsius ? 'Celsius' : 'Fahrenheit'}`);
    });

    // Settings button (placeholder)
    document.getElementById('settingsBtn').addEventListener('click', () => {
      Utils.toast('Settings coming soon');
    });

    // PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      // Could show custom install button here
    });

    // Refresh on visibility change (when user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const lastRefresh = parseInt(localStorage.getItem('lastRefresh') || '0');
        if (now - lastRefresh > 30 * 60 * 1000) { // 30 min
          localStorage.setItem('lastRefresh', now);
          // Silent refresh current day
          renderDay(state.selectedDayIndex);
        }
      }
    });

    localStorage.setItem('lastRefresh', Date.now());
  }

  return { init };
})();

// ── Start app when DOM is ready ────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
