// ============================================================
// WEATHER — National Weather Service API (free, no key)
// ============================================================

const Weather = (() => {

  const { office, gridX, gridY, lat, lon, baseUrl } = CONFIG.nws;

  // ── Fetch 7-day forecast ──────────────────────────────────
  async function fetchForecast() {
    const cacheKey = `nws_forecast_${office}_${gridX}_${gridY}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      const url = `${baseUrl}/gridpoints/${office}/${gridX},${gridY}/forecast`;
      const data = await Utils.fetchWithTimeout(url);
      const result = parseForecast(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.weather);
      return result;
    } catch(e) {
      console.warn('NWS forecast failed:', e.message);
      return getMockForecast();
    }
  }

  // ── Fetch hourly forecast (for today's time-of-day calc) ──
  async function fetchHourly() {
    const cacheKey = `nws_hourly_${office}_${gridX}_${gridY}`;
    const cached = Utils.cacheGet(cacheKey);
    if (cached) return cached;

    try {
      const url = `${baseUrl}/gridpoints/${office}/${gridX},${gridY}/forecast/hourly`;
      const data = await Utils.fetchWithTimeout(url);
      const result = parseHourly(data);
      Utils.cacheSet(cacheKey, result, CONFIG.cache.weather);
      return result;
    } catch(e) {
      console.warn('NWS hourly failed:', e.message);
      return getMockHourly();
    }
  }

  // ── Parse forecast periods ───────────────────────────────
  function parseForecast(data) {
    const periods = data?.properties?.periods || [];
    const days = [];

    // NWS gives day/night pairs; group by date
    for (let i = 0; i < periods.length; i += 2) {
      const day  = periods[i];
      const night = periods[i+1] || periods[i];
      if (!day) break;

      const date = new Date(day.startTime);
      const tempC = fToC(day.temperature); // NWS gives Fahrenheit
      const nightTempC = night ? fToC(night.temperature) : tempC - 8;

      days.push({
        date,
        dateStr: Utils.toISODate(date),
        dayLabel: day.name,
        shortForecast: day.shortForecast,
        detailedForecast: day.detailedForecast,
        icon: day.icon,
        tempC,
        nightTempC,
        windSpeed: parseWindSpeed(day.windSpeed),
        windDir: day.windDirection,
        probabilityOfPrecipitation: day.probabilityOfPrecipitation?.value || 0,
        cloudCover: estimateCloudCover(day.shortForecast),
        weatherIcon: Utils.weatherIcon(day.shortForecast),
        isDaytime: day.isDaytime,
        humidity: day.relativeHumidity?.value || 60,
      });
    }

    const current = days[0] || null;

    // Estimate pressure (NWS basic grid doesn't always include it)
    // We'll use 1015 as baseline and adjust for altitude (Provo ~4500ft / 1370m)
    // Provo standard pressure ~860 hPa
    const basePressure = 860;

    return {
      days: days.slice(0, 7),
      current,
      basePressure,
      pressureStable: true, // NWS doesn't give pressure in basic forecast
    };
  }

  // ── Parse hourly data ─────────────────────────────────────
  function parseHourly(data) {
    const periods = data?.properties?.periods || [];
    return periods.slice(0, 24).map(p => ({
      time: new Date(p.startTime),
      tempC: fToC(p.temperature),
      windSpeed: parseWindSpeed(p.windSpeed),
      cloudCover: estimateCloudCover(p.shortForecast),
      rain: p.probabilityOfPrecipitation?.value || 0,
      shortForecast: p.shortForecast,
    }));
  }

  // ── Estimate cloud cover % from text description ──────────
  function estimateCloudCover(desc = '') {
    const d = desc.toLowerCase();
    if (d.includes('clear') || d.includes('sunny')) return 0;
    if (d.includes('mostly sunny') || d.includes('mostly clear')) return 15;
    if (d.includes('partly sunny') || d.includes('partly cloudy')) return 40;
    if (d.includes('mostly cloudy')) return 70;
    if (d.includes('cloudy') || d.includes('overcast')) return 90;
    if (d.includes('fog') || d.includes('rain') || d.includes('snow') || d.includes('thunder')) return 95;
    return 50;
  }

  // ── Parse wind speed string "12 mph" → number ────────────
  function parseWindSpeed(str = '') {
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // ── °F → °C ───────────────────────────────────────────────
  function fToC(f) { return ((f - 32) * 5 / 9); }

  // ── Cloud cover score (0-100) ─────────────────────────────
  // Overcast = better for trout (reduces light penetration)
  // But extreme overcast can kill bite
  function cloudCoverScore(pct) {
    if (pct <= 20)  return 50;  // bright sun = fish go deep
    if (pct <= 40)  return 70;  // light clouds = good
    if (pct <= 70)  return 90;  // overcast = excellent
    if (pct <= 90)  return 80;  // mostly cloudy = good
    return 60;                  // total overcast = fair
  }

  // ── Pressure score (0-100) ────────────────────────────────
  // Stable pressure = best; rising = ok; falling = poor
  function pressureScore(hPa, trend = 'stable') {
    // All relative since we're estimating; use trend
    if (trend === 'stable')  return 90;
    if (trend === 'rising')  return 70;
    if (trend === 'falling') return 40;
    return 65;
  }

  // ── Stability score (0-100) ───────────────────────────────
  function stabilityScore(forecast) {
    if (!forecast || !forecast.days || forecast.days.length < 2) return 65;
    const today = forecast.days[0];
    const tomorrow = forecast.days[1];
    const tempDiff = Math.abs(today.tempC - tomorrow.tempC);
    const rainRisk = Math.max(today.probabilityOfPrecipitation, tomorrow.probabilityOfPrecipitation);

    let score = 100;
    score -= tempDiff * 3;        // big temp swings = unstable
    score -= rainRisk * 0.5;      // rain probability
    return Utils.clamp(Math.round(score), 0, 100);
  }

  // ── Mock data ─────────────────────────────────────────────
  function getMockForecast() {
    const days = [];
    const descs = ['Sunny','Partly Cloudy','Mostly Cloudy','Chance of Rain','Clear','Sunny','Partly Sunny'];
    const temps = [18, 16, 14, 13, 15, 17, 16];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date,
        dateStr: Utils.toISODate(date),
        dayLabel: i === 0 ? 'Today' : date.toLocaleDateString('en-US',{weekday:'long'}),
        shortForecast: descs[i],
        detailedForecast: descs[i] + ' with light winds.',
        tempC: temps[i],
        nightTempC: temps[i] - 7,
        windSpeed: 5 + Math.round(Math.random()*8),
        windDir: 'SW',
        probabilityOfPrecipitation: i === 3 ? 40 : 5,
        cloudCover: estimateCloudCover(descs[i]),
        weatherIcon: Utils.weatherIcon(descs[i]),
        isDaytime: true,
        humidity: 45,
      });
    }
    return { days, current: days[0], basePressure: 860, pressureStable: true };
  }

  function getMockHourly() {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      const d = new Date();
      d.setHours(h, 0, 0, 0);
      hours.push({
        time: d,
        tempC: 14 + 4 * Math.sin((h - 6) * Math.PI / 12),
        windSpeed: 5 + Math.round(Math.random() * 5),
        cloudCover: h > 14 ? 50 : 20,
        rain: h > 15 ? 20 : 0,
        shortForecast: h < 10 ? 'Sunny' : h < 16 ? 'Partly Cloudy' : 'Mostly Cloudy',
      });
    }
    return hours;
  }

  return {
    fetchForecast,
    fetchHourly,
    cloudCoverScore,
    pressureScore,
    stabilityScore,
    estimateCloudCover,
  };
})();
