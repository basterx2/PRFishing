// ============================================================
// USGS — River data from waterservices.usgs.gov
// ============================================================

const USGS = (() => {

  const BASE = CONFIG.usgs.baseUrl;
  const STATION = CONFIG.usgs.stationId;

  // ── Parameter codes ──────────────────────────────────────
  // 00060 = Discharge (cfs)
  // 00065 = Gauge height (ft)
  // 00010 = Water temperature (°C)

  async function fetchCurrentConditions() {
    const cacheKey = `usgs_current_${STATION}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      // Fetch flow, gauge height, and water temp (if available)
      const url = `${BASE}/iv/?sites=${STATION}&parameterCd=00060,00065,00010&siteStatus=all&format=json&period=PT2H`;
      const data = await Utils.fetchWithTimeout(url);

      const result = parseCurrentData(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.usgs);
      return result;
    } catch(e) {
      console.warn('USGS current fetch failed:', e.message);
      return getMockCurrentData();
    }
  }

  async function fetchHistoricalData(days = 7) {
    const cacheKey = `usgs_hist_${STATION}_${days}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const start = Utils.toISODate(startDate);
      const end   = Utils.toISODate(endDate);

      const url = `${BASE}/dv/?sites=${STATION}&parameterCd=00060,00065,00010&startDT=${start}&endDT=${end}&siteStatus=all&format=json`;
      const data = await Utils.fetchWithTimeout(url);

      const result = parseHistoricalData(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.usgs);
      return result;
    } catch(e) {
      console.warn('USGS historical fetch failed:', e.message);
      return getMockHistoricalData(days);
    }
  }

  // ── Parse current IV data ────────────────────────────────
  function parseCurrentData(data) {
    const ts = data?.value?.timeSeries || [];
    let flow = null, gauge = null, waterTemp = null;

    for (const series of ts) {
      const code = series.variable?.variableCode?.[0]?.value;
      const values = series.values?.[0]?.value || [];
      const latest = values.filter(v => v.value !== '-999999').pop();
      if (!latest) continue;
      const val = parseFloat(latest.value);

      if (code === '00060') flow = val;
      if (code === '00065') gauge = val;
      if (code === '00010') waterTemp = val;
    }

    const trend = computeFlowTrend(ts);

    return { flow, gauge, waterTemp, trend, timestamp: new Date().toISOString(), mock: false };
  }

  // ── Parse daily values ───────────────────────────────────
  function parseHistoricalData(data) {
    const ts = data?.value?.timeSeries || [];
    const flowSeries = [], gaugeSeries = [], tempSeries = [];

    for (const series of ts) {
      const code = series.variable?.variableCode?.[0]?.value;
      const values = (series.values?.[0]?.value || [])
        .filter(v => v.value !== '-999999')
        .map(v => ({ date: v.dateTime.slice(0, 10), value: parseFloat(v.value) }));

      if (code === '00060') flowSeries.push(...values);
      if (code === '00065') gaugeSeries.push(...values);
      if (code === '00010') tempSeries.push(...values);
    }

    return { flowSeries, gaugeSeries, tempSeries, mock: false };
  }

  // ── Compute trend from last 2 values ────────────────────
  function computeFlowTrend(ts) {
    for (const series of ts) {
      const code = series.variable?.variableCode?.[0]?.value;
      if (code !== '00060') continue;
      const values = (series.values?.[0]?.value || []).filter(v => v.value !== '-999999');
      if (values.length < 2) return 'Stable';
      const last = parseFloat(values[values.length - 1].value);
      const prev = parseFloat(values[values.length - 2].value);
      const change = ((last - prev) / prev) * 100;
      if (change > 5) return '↑ Rising';
      if (change < -5) return '↓ Falling';
      return '→ Stable';
    }
    return 'Stable';
  }

  // ── Estimate water temp from air temp if not available ────
  // Formula: T_water ≈ 0.75 * T_air + seasonal_offset
  // Trout streams have a natural lag from air temperature
  function estimateWaterTemp(airTempC, dateObj) {
    const month = dateObj.getMonth() + 1; // 1-12
    // Seasonal base temperatures for Provo River (mountain stream)
    const seasonal = {
      1: 2, 2: 2, 3: 4, 4: 6, 5: 8, 6: 11,
      7: 14, 8: 13, 9: 11, 10: 8, 11: 4, 12: 2
    };
    const base = seasonal[month] || 8;
    // Air temp influence (lagged/muted for stream)
    const airInfluence = airTempC * 0.25;
    return Utils.clamp(base + airInfluence, 0, 22);
  }

  // ── Flow status ───────────────────────────────────────────
  function flowStatus(cfs) {
    if (cfs === null) return { label: 'Unknown', class: 'text-3' };
    const { lowFlowCfs, idealFlowMin, idealFlowMax, highFlowCfs } = CONFIG.trout;
    if (cfs < lowFlowCfs)      return { label: 'Very Low', class: 'rating-poor' };
    if (cfs < idealFlowMin)    return { label: 'Low',      class: 'rating-fair' };
    if (cfs <= idealFlowMax)   return { label: 'Ideal',    class: 'rating-excellent' };
    if (cfs < highFlowCfs)     return { label: 'High',     class: 'rating-fair' };
    return { label: 'Very High', class: 'rating-poor' };
  }

  // ── Flow score (0-100) ────────────────────────────────────
  function flowScore(cfs) {
    if (cfs === null) return 40;
    const { lowFlowCfs, idealFlowMin, idealFlowMax, highFlowCfs } = CONFIG.trout;
    if (cfs < lowFlowCfs)    return Utils.clamp(20 + (cfs / lowFlowCfs) * 20, 0, 40);
    if (cfs < idealFlowMin)  return Utils.clamp(40 + ((cfs - lowFlowCfs) / (idealFlowMin - lowFlowCfs)) * 30, 40, 70);
    if (cfs <= idealFlowMax) return 100;
    if (cfs < highFlowCfs)   return Utils.clamp(100 - ((cfs - idealFlowMax) / (highFlowCfs - idealFlowMax)) * 60, 40, 100);
    return Utils.clamp(40 - ((cfs - highFlowCfs) / 500) * 30, 0, 40);
  }

  // ── Water temp score (0-100) ─────────────────────────────
  function waterTempScore(tempC) {
    if (tempC === null) return 50;
    const { idealWaterTempMin, idealWaterTempMax } = CONFIG.trout;
    if (tempC < 4)  return 10;  // too cold
    if (tempC < idealWaterTempMin) {
      return Utils.clamp(10 + ((tempC - 4) / (idealWaterTempMin - 4)) * 70, 10, 80);
    }
    if (tempC <= idealWaterTempMax) return 100;
    if (tempC < 18) return Utils.clamp(100 - ((tempC - idealWaterTempMax) / 3) * 40, 20, 100);
    if (tempC < 22) return Utils.clamp(60 - ((tempC - 18) / 4) * 50, 5, 60);
    return 5; // lethal for trout
  }

  // ── Mock data ─────────────────────────────────────────────
  function getMockCurrentData() {
    return {
      flow: 285,
      gauge: 2.45,
      waterTemp: null, // will be estimated
      trend: '→ Stable',
      timestamp: new Date().toISOString(),
      mock: true,
    };
  }

  function getMockHistoricalData(days = 7) {
    const flowSeries = [], gaugeSeries = [], tempSeries = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = Utils.toISODate(d);
      const base = 260 + Math.random() * 80;
      flowSeries.push({ date, value: Math.round(base) });
      gaugeSeries.push({ date, value: +(2.1 + Math.random() * 0.7).toFixed(2) });
      tempSeries.push({ date, value: +(11 + Math.random() * 3).toFixed(1) });
    }
    return { flowSeries, gaugeSeries, tempSeries, mock: true };
  }

  return {
    fetchCurrentConditions,
    fetchHistoricalData,
    estimateWaterTemp,
    flowStatus,
    flowScore,
    waterTempScore,
  };
})();
