// ============================================================
// UTILS — General helpers
// ============================================================

const Utils = (() => {

  // ── Temperature conversion ──────────────────────────────
  let useCelsius = false;

  function toggleUnits() {
    useCelsius = !useCelsius;
    return useCelsius;
  }

  function fToC(f) { return (f - 32) * 5/9; }
  function cToF(c) { return c * 9/5 + 32; }

  function formatTemp(celsius) {
    if (useCelsius) return `${celsius.toFixed(1)}°C`;
    return `${cToF(celsius).toFixed(1)}°F`;
  }

  function isCelsius() { return useCelsius; }

  // ── Date helpers ─────────────────────────────────────────
  function getDayOffset(date, offset) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    return d;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { month:'short', day:'numeric', timeZone:'America/Denver' });
  }

  function formatDay(date) {
    const today = new Date();
    const d = new Date(date);
    const diff = Math.round((d - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday:'short', timeZone:'America/Denver' });
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:'America/Denver' });
  }

  function toISODate(date) {
    // Returns YYYY-MM-DD in Mountain time
    return date.toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
  }

  // ── Cache ─────────────────────────────────────────────────
  function cacheSet(key, data, ttlMinutes = 30) {
    try {
      localStorage.setItem(key, JSON.stringify({
        ts: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
        data,
      }));
    } catch(e) { /* storage full */ }
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

  // ── Score → color ─────────────────────────────────────────
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

  // ── Bar color ─────────────────────────────────────────────
  function barColor(score, max = 100) {
    const pct = score / max;
    if (pct >= 0.71) return '#4db84d';
    if (pct >= 0.51) return '#4db8a0';
    if (pct >= 0.31) return '#e8b84b';
    return '#e05a5a';
  }

  // ── Clamp ────────────────────────────────────────────────
  function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

  // ── Wind deg → direction ─────────────────────────────────
  function windDir(deg) {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  // ── Weather icon from NWS shortForecast ──────────────────
  function weatherIcon(desc = '') {
    const d = desc.toLowerCase();
    if (d.includes('thunder')) return '⛈';
    if (d.includes('snow')) return '❄️';
    if (d.includes('rain') || d.includes('shower')) return '🌧';
    if (d.includes('drizzle')) return '🌦';
    if (d.includes('fog')) return '🌫';
    if (d.includes('partly') || d.includes('mostly cloudy')) return '⛅';
    if (d.includes('cloudy')) return '☁️';
    if (d.includes('clear') || d.includes('sunny')) return '☀️';
    return '🌤';
  }

  // ── Toast ────────────────────────────────────────────────
  function toast(msg, duration = 2500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration);
  }

  // ── Fetch with timeout ───────────────────────────────────
  async function fetchWithTimeout(url, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(id);
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
