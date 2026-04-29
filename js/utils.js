// ============================================================
// UTILS — General helpers v2 (mobile-safe)
// ============================================================

const Utils = (() => {

  let useCelsius = false;

  function toggleUnits() { useCelsius = !useCelsius; return useCelsius; }
  function isCelsius() { return useCelsius; }
  function fToC(f) { return (f - 32) * 5/9; }
  function cToF(c) { return c * 9/5 + 32; }

  function formatTemp(celsius) {
    if (celsius === null || celsius === undefined || isNaN(celsius)) return '—';
    if (useCelsius) return `${celsius.toFixed(1)}°C`;
    return `${cToF(celsius).toFixed(1)}°F`;
  }

  // ── Date helpers ─────────────────────────────────────────
  function getDayOffset(date, offset) {
    const d = new Date(date); d.setDate(d.getDate() + offset); return d;
  }

  function formatDate(date) {
    try { return date.toLocaleDateString('en-US', { month:'short', day:'numeric' }); }
    catch(e) { return ''; }
  }

  function formatDay(date) {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const d = new Date(date); d.setHours(0,0,0,0);
      const diff = Math.round((d - today) / 86400000);
      if (diff === 0) return 'Today';
      if (diff === 1) return 'Tomorrow';
      return d.toLocaleDateString('en-US', { weekday:'short' });
    } catch(e) { return ''; }
  }

  function formatTime(date) {
    try { return date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true }); }
    catch(e) { return '--:--'; }
  }

  function toISODate(date) {
    try { return date.toLocaleDateString('en-CA'); }
    catch(e) { return new Date().toLocaleDateString('en-CA'); }
  }

  // ── Cache ─────────────────────────────────────────────────
  function cacheSet(key, data, ttlMinutes = 30) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), ttl: ttlMinutes * 60000, data }));
    } catch(e) { /* storage full or unavailable */ }
  }

  function cacheGet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { ts, ttl, data } = JSON.parse(raw);
      if (Date.now() - ts > ttl) { localStorage.removeItem(key); return null; }
      return data;
    } catch(e) { return null; }
  }

  // ── Score helpers ─────────────────────────────────────────
  function scoreColor(score) {
    if (score >= 71) return '#4db84d';
    if (score >= 51) return '#4db8a0';
    if (score >= 31) return '#e8b84b';
    return '#e05a5a';
  }

  function scoreRating(score) {
    if (score >= 71) return 'Excellent';
    if (score >= 51) return 'Good';
    if (score >= 31) return 'Fair';
    return 'Poor';
  }

  function scoreClass(score) {
    if (score >= 71) return 'rating-excellent';
    if (score >= 51) return 'rating-good';
    if (score >= 31) return 'rating-fair';
    return 'rating-poor';
  }

  function barColor(score) {
    if (score >= 71) return '#4db84d';
    if (score >= 51) return '#4db8a0';
    if (score >= 31) return '#e8b84b';
    return '#e05a5a';
  }

  function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

  function windDir(deg) {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function weatherIcon(desc) {
    if (!desc) return '🌤';
    const d = desc.toLowerCase();
    if (d.includes('thunder')) return '⛈';
    if (d.includes('snow')) return '❄️';
    if (d.includes('rain') || d.includes('shower')) return '🌧';
    if (d.includes('drizzle')) return '🌦';
    if (d.includes('fog')) return '🌫';
    if (d.includes('partly') || d.includes('mostly cloudy')) return '⛅';
    if (d.includes('cloudy') || d.includes('overcast')) return '☁️';
    if (d.includes('clear') || d.includes('sunny')) return '☀️';
    return '🌤';
  }

  function toast(msg, duration = 2500) {
    try {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), duration);
    } catch(e) { /* ignore */ }
  }

  // ── Fetch with timeout + NWS-compatible headers ───────────
  async function fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const headers = { 'Accept': 'application/json' };
      // NWS requires User-Agent — use a valid format
      if (url.includes('weather.gov')) {
        headers['User-Agent'] = '(ProvoRiverFishingIndex, contact@example.com)';
      }
      const res = await fetch(url, { signal: controller.signal, headers });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch(e) {
      clearTimeout(id);
      throw e;
    }
  }

  return {
    toggleUnits, isCelsius, formatTemp, fToC, cToF,
    getDayOffset, formatDate, formatDay, formatTime, toISODate,
    cacheSet, cacheGet,
    scoreColor, scoreRating, scoreClass, barColor,
    clamp, windDir, weatherIcon, toast, fetchWithTimeout,
  };
})();
