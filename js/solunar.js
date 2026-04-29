// ============================================================
// SOLUNAR v2 — Lightweight, mobile-safe
// No heavy loops — O(1) calculations
// ============================================================

const Solunar = (() => {

  const DEG = Math.PI / 180;

  function toJD(date) {
    const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1;
    const d = date.getUTCDate() + date.getUTCHours()/24 + date.getUTCMinutes()/1440;
    return 367*y - Math.floor(7*(y+Math.floor((m+9)/12))/4) + Math.floor(275*m/9) + d + 1721013.5;
  }

  function moonPhase(date) {
    try {
      const k = (toJD(date) - 2451550.1) / 29.53058867;
      return ((k % 1) + 1) % 1;
    } catch(e) { return 0.25; }
  }

  function moonPhaseName(phase) {
    if (phase < 0.025 || phase > 0.975) return { name:'New Moon',        emoji:'🌑' };
    if (phase < 0.25)                   return { name:'Waxing Crescent', emoji:'🌒' };
    if (phase < 0.275)                  return { name:'First Quarter',   emoji:'🌓' };
    if (phase < 0.5)                    return { name:'Waxing Gibbous',  emoji:'🌔' };
    if (phase < 0.525)                  return { name:'Full Moon',       emoji:'🌕' };
    if (phase < 0.75)                   return { name:'Waning Gibbous',  emoji:'🌖' };
    if (phase < 0.775)                  return { name:'Last Quarter',    emoji:'🌗' };
    return { name:'Waning Crescent', emoji:'🌘' };
  }

  // NOAA sunrise/sunset — O(1), no loops
  function sunriseSunset(date, lat, lon) {
    try {
      const jd = toJD(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)));
      const n = jd - 2451545.0;
      const L = (280.460 + 0.9856474*n) % 360;
      const g = (357.528 + 0.9856003*n) * DEG;
      const lambda = (L + 1.915*Math.sin(g) + 0.020*Math.sin(2*g)) * DEG;
      const sinDec = Math.sin(23.439*DEG) * Math.sin(lambda);
      const dec = Math.asin(sinDec);
      const cosH = (Math.sin(-0.833*DEG) - Math.sin(lat*DEG)*sinDec) / (Math.cos(lat*DEG)*Math.cos(dec));
      if (cosH < -1 || cosH > 1) {
        const noon = new Date(date); noon.setHours(12,0,0,0);
        return { rise:noon, set:noon };
      }
      const H = Math.acos(cosH) * (180/Math.PI);
      const f = (279.575 + 0.9856474*n) * DEG;
      const eot = (-104.7*Math.sin(f)+596.2*Math.sin(2*f)+4.1*Math.sin(3*f)
                  -12.79*Math.sin(4*f)-429.3*Math.cos(f)-2.0*Math.cos(2*f)+19.9*Math.cos(3*f))/3600;
      const noon = 12 - lon/15 - eot;
      const hToDate = h => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCMinutes(Math.round(h*60));
        return d;
      };
      return { rise: hToDate(noon - H/15), set: hToDate(noon + H/15), noon: hToDate(noon) };
    } catch(e) {
      const r = new Date(date); r.setHours(6,30,0,0);
      const s = new Date(date); s.setHours(20,15,0,0);
      return { rise:r, set:s, noon:null };
    }
  }

  // Moonrise/moonset — simplified, O(1)
  function moonriseMoonset(date, lat, lon) {
    try {
      const jd0 = toJD(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0)));
      const T = (jd0 - 2451545.0) / 36525;
      const L0 = ((218.3164477 + 481267.88123421*T) % 360 + 360) % 360;
      const Mp = ((134.9633964 + 477198.8675055 *T) % 360 + 360) % 360;
      const D  = ((297.8501921 + 445267.1114034 *T) % 360 + 360) % 360;
      const F  = ((93.2720950  + 483202.0175233 *T) % 360 + 360) % 360;
      const lng = L0 + 6.2888*Math.sin(Mp*DEG) + 1.2740*Math.sin((2*D-Mp)*DEG)
                     + 0.6583*Math.sin(2*D*DEG) + 0.2136*Math.sin(2*Mp*DEG);
      const latM = 5.1282*Math.sin(F*DEG);
      const sinDec = Math.sin(23.4393*DEG)*Math.sin(lng*DEG) + Math.cos(23.4393*DEG)*Math.sin(latM*DEG);
      const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
      const cosH = (Math.sin(0.125*DEG) - Math.sin(lat*DEG)*Math.sin(dec)) / (Math.cos(lat*DEG)*Math.cos(dec));
      
      const hToDate = h => {
        if (h === null) return null;
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCMinutes(Math.round(((h%24)+24)%24 * 60));
        return d;
      };

      if (cosH < -1 || cosH > 1) {
        return { rise:null, set:null, transit: hToDate(12), antiTransit: hToDate(0) };
      }

      const H = Math.acos(cosH) * (180/Math.PI) / 15;
      const ra = (Math.atan2(Math.sin(lng*DEG)*Math.cos(23.4393*DEG), Math.cos(lng*DEG)) * 180/Math.PI + 360) % 360;
      const gmst0 = (6.697375 + 0.0657098242*(jd0-2451545.0)) % 24;
      const lmst0 = ((gmst0 + lon/15) % 24 + 24) % 24;
      let transit = ra/15 - lmst0;
      transit = ((transit%24)+24)%24;

      return {
        rise:        hToDate(transit - H),
        set:         hToDate(transit + H),
        transit:     hToDate(transit),
        antiTransit: hToDate(transit + 12),
      };
    } catch(e) {
      const r = new Date(date); r.setHours(7,0,0,0);
      const s = new Date(date); s.setHours(19,0,0,0);
      return { rise:r, set:s, transit:null, antiTransit:null };
    }
  }

  function getSolunarPeriods(date, lat, lon) {
    try {
      const phase     = moonPhase(date);
      const phaseInfo = moonPhaseName(phase);
      const sun       = sunriseSunset(date, lat, lon);
      const moon      = moonriseMoonset(date, lat, lon);

      const majors = [];
      if (moon.rise)        majors.push({ type:'major', label:'Major (Moonrise)',      time:moon.rise,        duration:120 });
      if (moon.set)         majors.push({ type:'major', label:'Major (Moonset)',       time:moon.set,         duration:120 });
      if (moon.transit)     majors.push({ type:'major', label:'Major (Transit)',       time:moon.transit,     duration:120 });
      if (moon.antiTransit) majors.push({ type:'major', label:'Major (Anti-Transit)', time:moon.antiTransit, duration:120 });
      majors.sort((a,b) => a.time - b.time);

      const minors = [];
      for (let i = 0; i < majors.length; i++) {
        const next = majors[(i+1) % majors.length];
        const mid = new Date((majors[i].time.getTime() + next.time.getTime()) / 2);
        minors.push({ type:'minor', label:'Minor', time:mid, duration:60 });
      }

      const all = [...majors, ...minors].sort((a,b) => a.time - b.time);

      const phaseScore = Math.round(((Math.cos((phase < 0.5 ? phase : 1-phase) * 4*Math.PI)+1)/2) * 80 + 20);
      
      const now = new Date();
      let periodScore = 30;
      for (const p of majors) {
        const diffMin = Math.abs(now - p.time) / 60000;
        if (diffMin < p.duration/2) {
          const intensity = 1 - diffMin/(p.duration/2);
          periodScore = p.type==='major' ? Math.round(60+intensity*40) : Math.round(40+intensity*30);
          break;
        }
      }

      return {
        periods:      all.slice(0,6),
        moonPhase:    phase,
        phaseInfo,
        phaseScore,
        periodScore,
        solunarScore: Math.min(100, Math.max(0, Math.round(phaseScore*0.3 + periodScore*0.7))),
        moonRise:     moon.rise,
        moonSet:      moon.set,
        sunRise:      sun.rise,
        sunSet:       sun.set,
      };
    } catch(e) {
      console.warn('Solunar error:', e.message);
      const r = new Date(date); r.setHours(6,30,0,0);
      const s = new Date(date); s.setHours(20,0,0,0);
      return {
        periods:[
          { type:'major', label:'Major (Moonrise)',    time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),6,0,0),  duration:120 },
          { type:'minor', label:'Minor',               time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),12,0,0), duration:60  },
          { type:'major', label:'Major (Moonset)',     time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),18,0,0), duration:120 },
          { type:'minor', label:'Minor',               time:new Date(date.getFullYear(),date.getMonth(),date.getDate(),21,0,0), duration:60  },
        ],
        moonPhase:0.5, phaseInfo:{name:'Full Moon',emoji:'🌕'},
        phaseScore:60, periodScore:40, solunarScore:52, moonRise:r, moonSet:s, sunRise:r, sunSet:s,
      };
    }
  }

  function getSolunarScore(date, lat, lon) {
    return getSolunarPeriods(date, lat, lon).solunarScore;
  }

  return { getSolunarPeriods, getSolunarScore, moonPhase, moonPhaseName };
})();
