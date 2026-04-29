// ============================================================
// WEATHER — National Weather Service API v2
// Robust fallback — never crashes the app
// ============================================================

const Weather = (() => {

  const { office, gridX, gridY, baseUrl } = CONFIG.nws;

  async function fetchForecast() {
    const cacheKey = `nws_forecast_v2_${office}_${gridX}_${gridY}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      const url = `${baseUrl}/gridpoints/${office}/${gridX},${gridY}/forecast`;
      const data = await Utils.fetchWithTimeout(url, 10000);
      if (!data?.properties?.periods?.length) throw new Error('Empty NWS response');
      const result = parseForecast(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.weather);
      return result;
    } catch(e) {
      console.warn('NWS forecast failed, using mock:', e.message);
      return getMockForecast();
    }
  }

  async function fetchHourly() {
    const cacheKey = `nws_hourly_v2_${office}_${gridX}_${gridY}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      const url = `${baseUrl}/gridpoints/${office}/${gridX},${gridY}/forecast/hourly`;
      const data = await Utils.fetchWithTimeout(url, 10000);
      if (!data?.properties?.periods?.length) throw new Error('Empty NWS hourly');
      const result = parseHourly(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.weather);
      return result;
    } catch(e) {
      console.warn('NWS hourly failed, using mock:', e.message);
      return getMockHourly();
    }
  }

  // NWS temperature can be in F or C depending on unitCode
  function toC(value, unitCode) {
    if (!unitCode) return (value - 32) * 5/9; // assume F
    if (unitCode.includes('degC') || unitCode.includes('wmoUnit:degC')) return value;
    return (value - 32) * 5/9; // F → C
  }

  function parseForecast(data) {
    const periods = data.properties.periods;
    const days = [];

    for (let i = 0; i < periods.length && days.length < 7; i++) {
      const p = periods[i];
      if (!p.isDaytime) continue; // skip night periods for day cards

      const night = periods[i + 1] || p;
      const date = new Date(p.startTime);
      const tempC = toC(p.temperature, p.temperatureUnit === 'F' ? 'degF' : 'degC');
      const nightTempC = toC(night.temperature, night.temperatureUnit === 'F' ? 'degF' : 'degC');

      days.push({
        date,
        dateStr: Utils.toISODate(date),
        dayLabel: p.name || '',
        shortForecast: p.shortForecast || 'Partly Cloudy',
        detailedForecast: p.detailedForecast || '',
        tempC: isNaN(tempC) ? 15 : tempC,
        nightTempC: isNaN(nightTempC) ? 8 : nightTempC,
        windSpeed: parseWindSpeed(p.windSpeed),
        windDir: p.windDirection || 'SW',
        probabilityOfPrecipitation: p.probabilityOfPrecipitation?.value || 0,
        cloudCover: estimateCloudCover(p.shortForecast),
        weatherIcon: Utils.weatherIcon(p.shortForecast),
        isDaytime: true,
        humidity: p.relativeHumidity?.value || 50,
      });
    }

    // If we somehow got no daytime periods, try again without the filter
    if (days.length === 0) {
      for (let i = 0; i < Math.min(periods.length, 14); i += 2) {
        const p = periods[i];
        const date = new Date(p.startTime);
        const tempC = toC(p.temperature, p.temperatureUnit === 'F' ? 'degF' : 'degC');
        days.push({
          date, dateStr: Utils.toISODate(date),
          dayLabel: p.name || '',
          shortForecast: p.shortForecast || 'Partly Cloudy',
          detailedForecast: p.detailedForecast || '',
          tempC: isNaN(tempC) ? 15 : tempC,
          nightTempC: isNaN(tempC) ? 8 : tempC - 7,
          windSpeed: parseWindSpeed(p.windSpeed),
          windDir: p.windDirection || 'SW',
          probabilityOfPrecipitation: p.probabilityOfPrecipitation?.value || 0,
          cloudCover: estimateCloudCover(p.shortForecast),
          weatherIcon: Utils.weatherIcon(p.shortForecast),
          isDaytime: true,
          humidity: 50,
        });
        if (days.length >= 7) break;
      }
    }

    return { days: days.slice(0,7), current: days[0] || null, basePressure: 860, pressureStable: true };
  }

  function parseHourly(data) {
    return (data.properties.periods || []).slice(0, 24).map(p => ({
      time: new Date(p.startTime),
      tempC: toC(p.temperature, p.temperatureUnit === 'F' ? 'degF' : 'degC'),
      windSpeed: parseWindSpeed(p.windSpeed),
      cloudCover: estimateCloudCover(p.shortForecast),
      rain: p.probabilityOfPrecipitation?.value || 0,
      shortForecast: p.shortForecast || '',
    }));
  }

  function estimateCloudCover(desc) {
    if (!desc) return 50;
    const d = desc.toLowerCase();
    if (d.includes('clear') || d.includes('sunny')) return 5;
    if (d.includes('mostly sunny') || d.includes('mostly clear')) return 15;
    if (d.includes('partly')) return 40;
    if (d.includes('mostly cloudy')) return 70;
    if (d.includes('cloudy') || d.includes('overcast')) return 90;
    if (d.includes('fog') || d.includes('rain') || d.includes('snow') || d.includes('thunder')) return 95;
    return 50;
  }

  function parseWindSpeed(str) {
    if (!str) return 0;
    const m = String(str).match(/(\d+)/);
    return m ? parseInt(m[1]) : 0;
  }

  function cloudCoverScore(pct) {
    const p = pct || 0;
    if (p <= 20)  return 50;
    if (p <= 40)  return 70;
    if (p <= 70)  return 90;
    if (p <= 90)  return 80;
    return 60;
  }

  function pressureScore(hPa, trend) {
    if (trend === 'falling') return 40;
    if (trend === 'rising')  return 70;
    return 90; // stable
  }

  function stabilityScore(forecast) {
    try {
      if (!forecast?.days?.length) return 65;
      const t = forecast.days[0];
      const n = forecast.days[1] || t;
      const diff = Math.abs(t.tempC - n.tempC);
      const rain = Math.max(t.probabilityOfPrecipitation || 0, n.probabilityOfPrecipitation || 0);
      return Utils.clamp(Math.round(100 - diff*3 - rain*0.5), 0, 100);
    } catch(e) { return 65; }
  }

  // ── Rich mock data for offline/fallback ───────────────────
  function getMockForecast() {
    const descs = ['Sunny','Partly Cloudy','Mostly Cloudy','Chance of Showers','Sunny','Partly Sunny','Clear'];
    const temps  = [17, 15, 13, 12, 16, 18, 15];
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() + i); date.setHours(0,0,0,0);
      return {
        date, dateStr: Utils.toISODate(date),
        dayLabel: Utils.formatDay(date),
        shortForecast: descs[i],
        detailedForecast: descs[i] + ' with light winds out of the southwest.',
        tempC: temps[i],
        nightTempC: temps[i] - 7,
        windSpeed: 5 + Math.round(Math.random()*8),
        windDir: 'SW',
        probabilityOfPrecipitation: i === 3 ? 45 : i === 2 ? 20 : 5,
        cloudCover: estimateCloudCover(descs[i]),
        weatherIcon: Utils.weatherIcon(descs[i]),
        isDaytime: true,
        humidity: 42,
      };
    });
    return { days, current: days[0], basePressure: 860, pressureStable: true };
  }

  function getMockHourly() {
    return Array.from({ length: 24 }, (_, h) => {
      const d = new Date(); d.setHours(h, 0, 0, 0);
      return {
        time: d,
        tempC: 14 + 4 * Math.sin((h - 6) * Math.PI / 12),
        windSpeed: 5 + Math.round(Math.random()*5),
        cloudCover: h > 14 ? 50 : 20,
        rain: h > 15 ? 20 : 0,
        shortForecast: h < 10 ? 'Sunny' : h < 16 ? 'Partly Cloudy' : 'Mostly Cloudy',
      };
    });
  }

  return { fetchForecast, fetchHourly, cloudCoverScore, pressureScore, stabilityScore, estimateCloudCover };
})();
