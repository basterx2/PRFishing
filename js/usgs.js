// ============================================================
// USGS — River data v2 (mobile-safe, shorter timeout)
// ============================================================

const USGS = (() => {

  const BASE    = CONFIG.usgs.baseUrl;
  const STATION = CONFIG.usgs.stationId;

  async function fetchCurrentConditions() {
    const cacheKey = `usgs_cur_v2_${STATION}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      // Use shorter period and timeout — mobile networks are slow
      const url = `${BASE}/iv/?sites=${STATION}&parameterCd=00060,00065,00010&siteStatus=all&format=json&period=PT3H`;
      const data = await Utils.fetchWithTimeout(url, 9000);
      if (!data?.value?.timeSeries) throw new Error('No timeSeries in USGS response');
      const result = parseCurrentData(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.usgs);
      return result;
    } catch(e) {
      console.warn('USGS current failed:', e.message);
      return getMockCurrentData();
    }
  }

  async function fetchHistoricalData(days = 7) {
    const cacheKey = `usgs_hist_v2_${STATION}_${days}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      const end   = Utils.toISODate(new Date());
      const start = Utils.toISODate(new Date(Date.now() - days * 86400000));
      const url = `${BASE}/dv/?sites=${STATION}&parameterCd=00060,00065,00010&startDT=${start}&endDT=${end}&siteStatus=all&format=json`;
      const data = await Utils.fetchWithTimeout(url, 9000);
      if (!data?.value?.timeSeries) throw new Error('No timeSeries in USGS historical');
      const result = parseHistoricalData(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.usgs);
      return result;
    } catch(e) {
      console.warn('USGS historical failed:', e.message);
      return getMockHistoricalData(days);
    }
  }

  function parseCurrentData(data) {
    const ts = data.value.timeSeries || [];
    let flow = null, gauge = null, waterTemp = null;

    for (const series of ts) {
      try {
        const code   = series.variable?.variableCode?.[0]?.value;
        const values = series.values?.[0]?.value || [];
        const latest = values.filter(v => v.value !== '-999999' && v.value !== 'Ice').pop();
        if (!latest) continue;
        const val = parseFloat(latest.value);
        if (isNaN(val)) continue;
        if (code === '00060') flow = val;
        if (code === '00065') gauge = val;
        if (code === '00010') waterTemp = val;
      } catch(e) { /* skip bad series */ }
    }

    return { flow, gauge, waterTemp, trend: computeFlowTrend(ts), timestamp: new Date().toISOString(), mock: false };
  }

  function parseHistoricalData(data) {
    const ts = data.value.timeSeries || [];
    const flowSeries = [], gaugeSeries = [], tempSeries = [];

    for (const series of ts) {
      try {
        const code   = series.variable?.variableCode?.[0]?.value;
        const values = (series.values?.[0]?.value || [])
          .filter(v => v.value !== '-999999' && v.value !== 'Ice')
          .map(v => ({ date: (v.dateTime||'').slice(0, 10), value: parseFloat(v.value) }))
          .filter(v => !isNaN(v.value));
        if (code === '00060') flowSeries.push(...values);
        if (code === '00065') gaugeSeries.push(...values);
        if (code === '00010') tempSeries.push(...values);
      } catch(e) { /* skip */ }
    }

    return { flowSeries, gaugeSeries, tempSeries, mock: false };
  }

  function computeFlowTrend(ts) {
    try {
      for (const series of ts) {
        const code = series.variable?.variableCode?.[0]?.value;
        if (code !== '00060') continue;
        const values = (series.values?.[0]?.value || []).filter(v => v.value !== '-999999');
        if (values.length < 2) return '→ Stable';
        const last = parseFloat(values[values.length - 1].value);
        const prev = parseFloat(values[values.length - 2].value);
        if (isNaN(last) || isNaN(prev) || prev === 0) return '→ Stable';
        const pct = ((last - prev) / prev) * 100;
        if (pct > 5)  return '↑ Rising';
        if (pct < -5) return '↓ Falling';
        return '→ Stable';
      }
    } catch(e) { /* */ }
    return '→ Stable';
  }

  function estimateWaterTemp(airTempC, dateObj) {
    try {
      const month = (dateObj || new Date()).getMonth() + 1;
      const seasonal = { 1:2,2:2,3:4,4:6,5:9,6:12,7:15,8:14,9:11,10:8,11:4,12:2 };
      const base = seasonal[month] || 8;
      return Utils.clamp(base + (airTempC || 0) * 0.2, 0, 22);
    } catch(e) { return 10; }
  }

  function flowStatus(cfs) {
    if (cfs === null || cfs === undefined) return { label:'Unknown', class:'text-3' };
    const { lowFlowCfs, idealFlowMin, idealFlowMax, highFlowCfs } = CONFIG.trout;
    if (cfs < lowFlowCfs)    return { label:'Very Low',  class:'rating-poor'      };
    if (cfs < idealFlowMin)  return { label:'Low',       class:'rating-fair'      };
    if (cfs <= idealFlowMax) return { label:'Ideal ✓',   class:'rating-excellent' };
    if (cfs < highFlowCfs)   return { label:'High',      class:'rating-fair'      };
    return { label:'Very High', class:'rating-poor' };
  }

  function flowScore(cfs) {
    if (cfs === null || cfs === undefined) return 45;
    const { lowFlowCfs, idealFlowMin, idealFlowMax, highFlowCfs } = CONFIG.trout;
    if (cfs < lowFlowCfs)    return Utils.clamp(Math.round(20 + (cfs/lowFlowCfs)*20), 0, 40);
    if (cfs < idealFlowMin)  return Utils.clamp(Math.round(40 + ((cfs-lowFlowCfs)/(idealFlowMin-lowFlowCfs))*30), 40, 70);
    if (cfs <= idealFlowMax) return 100;
    if (cfs < highFlowCfs)   return Utils.clamp(Math.round(100 - ((cfs-idealFlowMax)/(highFlowCfs-idealFlowMax))*60), 40, 100);
    return Utils.clamp(Math.round(40 - ((cfs-highFlowCfs)/500)*30), 0, 40);
  }

  function waterTempScore(tempC) {
    if (tempC === null || tempC === undefined) return 55;
    const { idealWaterTempMin, idealWaterTempMax } = CONFIG.trout;
    if (tempC < 2)  return 5;
    if (tempC < 4)  return 15;
    if (tempC < idealWaterTempMin) return Utils.clamp(Math.round(15 + ((tempC-4)/(idealWaterTempMin-4))*70), 15, 85);
    if (tempC <= idealWaterTempMax) return 100;
    if (tempC < 18) return Utils.clamp(Math.round(100 - ((tempC-idealWaterTempMax)/3)*40), 20, 100);
    if (tempC < 22) return Utils.clamp(Math.round(60  - ((tempC-18)/4)*50), 5, 60);
    return 5;
  }

  function getMockCurrentData() {
    return { flow:285, gauge:2.45, waterTemp:null, trend:'→ Stable', timestamp:new Date().toISOString(), mock:true };
  }

  function getMockHistoricalData(days = 7) {
    const flowSeries=[], gaugeSeries=[], tempSeries=[];
    for (let i = days; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const date = Utils.toISODate(d);
      flowSeries.push({ date, value: Math.round(250 + Math.random()*100) });
      gaugeSeries.push({ date, value: parseFloat((2.0 + Math.random()*0.8).toFixed(2)) });
      tempSeries.push({ date, value: parseFloat((10 + Math.random()*4).toFixed(1)) });
    }
    return { flowSeries, gaugeSeries, tempSeries, mock:true };
  }

  return { fetchCurrentConditions, fetchHistoricalData, estimateWaterTemp, flowStatus, flowScore, waterTempScore };
})();
