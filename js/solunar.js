// ============================================================
// SOLUNAR — Moon phase, rise/set, major/minor periods
// Pure JavaScript — no external API needed
// ============================================================

const Solunar = (() => {

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  // ── Julian Date ──────────────────────────────────────────
  function toJD(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate() + date.getUTCHours()/24 + date.getUTCMinutes()/1440;
    let jd = 367*y - Math.floor(7*(y + Math.floor((m+9)/12))/4)
      + Math.floor(275*m/9) + d + 1721013.5;
    return jd;
  }

  // ── Sun position ─────────────────────────────────────────
  function sunPosition(date) {
    const jd = toJD(date);
    const n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const lambda = L + 1.915 * Math.sin(g * DEG) + 0.02 * Math.sin(2*g*DEG);
    const epsilon = 23.439 - 0.0000004 * n;
    const ra = Math.atan2(Math.cos(epsilon*DEG)*Math.sin(lambda*DEG), Math.cos(lambda*DEG)) * RAD;
    const dec = Math.asin(Math.sin(epsilon*DEG)*Math.sin(lambda*DEG)) * RAD;
    return { ra: (ra + 360) % 360, dec };
  }

  // ── Moon position ────────────────────────────────────────
  function moonPosition(date) {
    const jd = toJD(date);
    const T = (jd - 2451545.0) / 36525;

    // Moon's mean longitude
    const L0 = 218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841;
    // Mean elongation
    const D  = 297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868;
    // Sun's mean anomaly
    const M  = 357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000;
    // Moon's mean anomaly
    const Mp = 134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699;
    // Moon's argument of latitude
    const F  = 93.2720950  + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000;

    const toR = x => (x % 360) * DEG;

    const longitude = L0
      + 6.288774 * Math.sin(toR(Mp))
      + 1.274027 * Math.sin(toR(2*D - Mp))
      + 0.658314 * Math.sin(toR(2*D))
      + 0.213618 * Math.sin(toR(2*Mp))
      - 0.185116 * Math.sin(toR(M))
      - 0.114332 * Math.sin(toR(2*F));

    const latitude = 5.128122 * Math.sin(toR(F))
      + 0.280602 * Math.sin(toR(Mp + F))
      + 0.277693 * Math.sin(toR(Mp - F));

    const distance = 385001 - 20905*Math.cos(toR(Mp));

    return { longitude: ((longitude % 360) + 360) % 360, latitude, distance };
  }

  // ── Moon phase (0=new, 0.5=full) ─────────────────────────
  function moonPhase(date) {
    const jd = toJD(date);
    const k = (jd - 2451550.1) / 29.53058867;
    const phase = ((k % 1) + 1) % 1;
    return phase;
  }

  function moonPhaseName(phase) {
    if (phase < 0.025 || phase > 0.975) return { name: 'New Moon',         emoji: '🌑' };
    if (phase < 0.25)                    return { name: 'Waxing Crescent',  emoji: '🌒' };
    if (phase < 0.275)                   return { name: 'First Quarter',    emoji: '🌓' };
    if (phase < 0.5)                     return { name: 'Waxing Gibbous',   emoji: '🌔' };
    if (phase < 0.525)                   return { name: 'Full Moon',        emoji: '🌕' };
    if (phase < 0.75)                    return { name: 'Waning Gibbous',   emoji: '🌖' };
    if (phase < 0.775)                   return { name: 'Last Quarter',     emoji: '🌗' };
    return { name: 'Waning Crescent', emoji: '🌘' };
  }

  // ── Rise/Set calculator ──────────────────────────────────
  function riseSet(date, lat, lon, body = 'moon') {
    // Simplified rise/set using body transit time
    const jd0 = toJD(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
    const results = [];

    for (let hour = 0; hour <= 24; hour += 0.5) {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCMinutes(hour * 60);

      let pos;
      if (body === 'moon') pos = moonPosition(d);
      else pos = sunPosition(d);

      const gha = body === 'moon'
        ? (pos.longitude - 0.9856 * (jd0 - 2451545) - 13.176 * hour / 24 * 24) % 360
        : (pos.ra - 15 * hour) % 360;

      results.push({ hour, pos });
    }

    // Find moonrise (alt crosses horizon going up)
    function getAlt(hour) {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCMinutes(hour * 60);
      const pos = body === 'moon' ? moonPosition(d) : sunPosition(d);
      const dec = pos.latitude || pos.dec || 0;
      const ra  = (pos.longitude || pos.ra || 0) % 360;
      const lst = ((280.46061837 + 360.98564736629 * (toJD(d) - 2451545.0) + lon) % 360 + 360) % 360;
      const ha  = ((lst - ra + 360) % 360) > 180
        ? ((lst - ra + 360) % 360) - 360
        : (lst - ra + 360) % 360;
      const alt = Math.asin(
        Math.sin(lat*DEG)*Math.sin(dec*DEG) +
        Math.cos(lat*DEG)*Math.cos(dec*DEG)*Math.cos(ha*DEG)
      ) * RAD;
      return alt;
    }

    let rise = null, set = null, transit = null, maxAlt = -999, maxHour = 0;
    for (let h = 0; h < 24; h += 0.25) {
      const alt0 = getAlt(h);
      const alt1 = getAlt(h + 0.25);
      if (alt0 > maxAlt) { maxAlt = alt0; maxHour = h; }
      if (alt0 <= 0 && alt1 > 0 && !rise) rise = h + 0.125;
      if (alt0 >= 0 && alt1 < 0 && !set) set = h + 0.125;
    }
    transit = maxHour;

    function hoursToDate(hours) {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCMinutes(hours * 60);
      return d;
    }

    return {
      rise:    rise    != null ? hoursToDate(rise)    : null,
      set:     set     != null ? hoursToDate(set)      : null,
      transit: transit != null ? hoursToDate(transit)  : null,
    };
  }

  // ── Solunar periods ──────────────────────────────────────
  // Major: moonrise/moonset + moon transit/antitransit (±1hr)
  // Minor: midpoints between major periods (±30min)
  function getSolunarPeriods(date, lat, lon) {
    const moon = riseSet(date, lat, lon, 'moon');
    const sun  = riseSet(date, lat, lon, 'sun');
    const phase = moonPhase(date);
    const phaseInfo = moonPhaseName(phase);

    const periods = [];

    // Major periods: moonrise & moonset (±1 hour window)
    if (moon.rise) {
      periods.push({ type:'major', label:'Major (Rise)', time: moon.rise, duration: 120 });
    }
    if (moon.set) {
      periods.push({ type:'major', label:'Major (Set)', time: moon.set, duration: 120 });
    }

    // Transit: directly overhead / underfoot
    if (moon.transit) {
      periods.push({ type:'major', label:'Major (Transit)', time: moon.transit, duration: 120 });
    }

    // Anti-transit: ~12h after transit
    if (moon.transit) {
      const antiTransit = new Date(moon.transit.getTime() + 12*60*60*1000);
      periods.push({ type:'major', label:'Major (Anti-Transit)', time: antiTransit, duration: 120 });
    }

    // Minor periods: midpoints
    for (let i = 0; i < periods.length; i++) {
      const next = periods[(i+1) % periods.length];
      const midMs = (periods[i].time.getTime() + next.time.getTime()) / 2;
      periods.push({ type:'minor', label:'Minor', time: new Date(midMs), duration: 60 });
    }

    // Sort by time
    periods.sort((a,b) => a.time - b.time);

    // Solunar score (0-100): based on phase + current period proximity
    const now = new Date();
    const fullMoonBonus = Math.cos((phase - 0.5) * 2 * Math.PI); // max at full/new moon
    const phaseScore = Utils.clamp((fullMoonBonus + 1) / 2 * 100, 20, 100);

    // Check if within a major/minor period right now
    let periodScore = 30;
    for (const p of periods) {
      const diffMin = Math.abs(now - p.time) / 60000;
      const window  = p.duration / 2;
      if (diffMin < window) {
        const intensity = 1 - (diffMin / window);
        periodScore = p.type === 'major'
          ? Utils.clamp(60 + intensity * 40, 0, 100)
          : Utils.clamp(40 + intensity * 30, 0, 100);
        break;
      }
    }

    return {
      periods: periods.slice(0, 6), // show 6 max
      moonPhase: phase,
      phaseInfo,
      phaseScore,
      periodScore,
      solunarScore: Math.round((phaseScore * 0.3 + periodScore * 0.7)),
      moonRise: moon.rise,
      moonSet:  moon.set,
      sunRise:  sun.rise,
      sunSet:   sun.set,
    };
  }

  // ── Active solunar score for a given date/time ────────────
  function getSolunarScore(date, lat, lon) {
    const data = getSolunarPeriods(date, lat, lon);
    return data.solunarScore;
  }

  return { getSolunarPeriods, getSolunarScore, moonPhase, moonPhaseName };
})();
