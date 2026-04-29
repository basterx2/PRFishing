// ============================================================
// UI — DOM rendering v2 (null-safe everywhere)
// ============================================================

const UI = (() => {

  function $(id) { return document.getElementById(id); }
  function set(id, val, cls) {
    const el = $(id); if (!el) return;
    el.textContent = val ?? '—';
    if (cls !== undefined) el.className = cls;
  }

  // ── Score ring ────────────────────────────────────────────
  function drawScoreRing(score) {
    const canvas = $('scoreRing'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2, r=W/2-10;
    ctx.clearRect(0,0,W,H);
    // Background
    ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.strokeStyle='rgba(77,184,160,0.10)'; ctx.lineWidth=10; ctx.stroke();
    // Arc
    const color = Utils.scoreColor(score);
    ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+(score/100)*2*Math.PI);
    ctx.strokeStyle=color; ctx.lineWidth=10; ctx.lineCap='round'; ctx.stroke();
    // Text
    ctx.fillStyle=color;
    ctx.font=`bold 28px 'Playfair Display', serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(score, cx, cy);
  }

  function renderHero(result) {
    if (!result) return;
    set('heroScore',   result.score ?? '--');
    set('heroRating',  result.rating ?? '—', `hero-rating ${result.ratingClass||''}`);
    set('heroUpdated', `Updated ${Utils.formatTime(new Date())}`);
    try { drawScoreRing(result.score || 0); } catch(e) { /* canvas unavailable */ }
  }

  // ── Date strip ────────────────────────────────────────────
  function renderDateStrip(days, selectedIdx, onSelect) {
    const strip = $('dateStrip'); if (!strip) return;
    strip.innerHTML = '';
    (days || []).forEach((date, i) => {
      const pill = document.createElement('button');
      pill.className = `day-pill${i===selectedIdx?' active':''}`;
      pill.innerHTML = `<span>${Utils.formatDay(date)}</span><span>${Utils.formatDate(date)}</span>`;
      pill.addEventListener('click', () => onSelect(i));
      strip.appendChild(pill);
    });
  }

  // ── Solunar ───────────────────────────────────────────────
  function renderSolunar(data) {
    if (!data) return;
    const phaseEl = $('moonPhase');
    if (phaseEl) { phaseEl.textContent = data.phaseInfo?.emoji || '🌙'; phaseEl.title = data.phaseInfo?.name || ''; }

    const grid = $('solunarGrid'); if (!grid) return;
    const now = new Date();
    const periods = (data.periods || []).filter(p => p && p.time instanceof Date && !isNaN(p.time));

    if (!periods.length) { grid.innerHTML = '<div style="color:var(--text-3);font-size:0.78rem">No period data</div>'; return; }

    // Show next 4 (upcoming or current)
    const upcoming = periods.filter(p => p.time > new Date(now - 2*3600000)).slice(0,4);
    const display  = upcoming.length ? upcoming : periods.slice(0,4);

    grid.innerHTML = display.map(p => `
      <div class="solunar-item ${p.type}">
        <div class="solunar-type">${p.label||p.type}</div>
        <div class="solunar-time">${Utils.formatTime(p.time)}</div>
        <div class="solunar-dur">${p.duration||60} min window</div>
      </div>
    `).join('');
  }

  // ── Weather ───────────────────────────────────────────────
  function renderWeather(wx) {
    if (!wx) { ['wTemp','wWind','wCloud','wPressure','wRain'].forEach(id=>set(id,'—')); return; }
    set('wTemp',     Utils.formatTemp(wx.tempC));
    set('wWind',     `${wx.windSpeed||0} mph ${wx.windDir||''}`);
    set('wCloud',    `${wx.cloudCover||0}%`);
    set('wPressure', '~860 hPa');
    set('wRain',     `${wx.probabilityOfPrecipitation||0}%`);
  }

  // ── River ─────────────────────────────────────────────────
  function renderRiver(riverData, airTempC, date) {
    if (!riverData) { ['rFlow','rGauge','rTemp','rStatus','rTrend'].forEach(id=>set(id,'—')); return; }
    const wt = (riverData.waterTemp != null && !isNaN(riverData.waterTemp))
      ? riverData.waterTemp
      : USGS.estimateWaterTemp(airTempC||15, date||new Date());
    const status = USGS.flowStatus(riverData.flow);
    set('rFlow',  riverData.flow  != null ? `${Math.round(riverData.flow)} cfs` : '—');
    set('rGauge', riverData.gauge != null ? `${Number(riverData.gauge).toFixed(2)} ft` : '—');
    set('rTemp',  Utils.formatTemp(wt) + (riverData.waterTemp == null ? ' *est' : ''));
    const statusEl = $('rStatus');
    if (statusEl) { statusEl.textContent = status.label; statusEl.className = status.class; }
    set('rTrend', riverData.trend || '—');
  }

  // ── Breakdown ─────────────────────────────────────────────
  function renderBreakdown(breakdown) {
    const list = $('breakdownList'); if (!list) return;
    if (!breakdown?.length) { list.innerHTML = ''; return; }
    list.innerHTML = breakdown.map(item => `
      <div class="breakdown-row">
        <div class="breakdown-label">${item.label}</div>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar" style="width:${item.score||0}%;background:${Utils.barColor(item.score||0)}"></div>
        </div>
        <div class="breakdown-score">${Math.round(item.score||0)}</div>
      </div>
    `).join('');
  }

  // ── Recommendations ───────────────────────────────────────
  function renderRecommendations(recs) {
    const el = $('recList'); if (!el) return;
    if (!recs?.length) { el.textContent = 'No recommendations available.'; return; }
    el.innerHTML = recs.map(r=>`<div class="rec-item"><span class="rec-dot">›</span><span>${r}</span></div>`).join('');
  }

  // ── Best time bar ─────────────────────────────────────────
  function renderBestTimeBar(hourlyScores) {
    const bar = $('bestTimeBar'); if (!bar || !hourlyScores?.length) return;
    const segs = [];
    for (let h=0; h<24; h+=2) {
      const avg = Math.round(((hourlyScores[h]?.score||0) + (hourlyScores[h+1]?.score||0)) / 2);
      segs.push({ hour:h, score:avg });
    }
    bar.innerHTML = segs.map(seg => {
      const cls = seg.score>=71?'peak':seg.score>=51?'good':seg.score>=31?'fair':'poor';
      const h=seg.hour, label=h===0?'12a':h<12?`${h}a`:h===12?'12p':`${h-12}p`;
      return `<div class="time-seg ${cls}" title="${label}: ${seg.score}">${label}</div>`;
    }).join('');
  }

  // ── Forecast list ─────────────────────────────────────────
  function renderForecast(days, riverData, onDaySelect, selectedIdx=0) {
    const list = $('forecastList'); if (!list) return;
    if (!days?.length) { list.innerHTML = '<div style="padding:1rem;color:var(--text-3)">No forecast data available</div>'; return; }

    list.innerHTML = days.map((day, i) => {
      let score=55, rating='Good', color='#4db8a0';
      try {
        const result = FishingIndex.calculateForDay(day, riverData, day.date);
        score=result.score; rating=result.rating; color=Utils.scoreColor(score);
      } catch(e) { /* keep defaults */ }

      const tempStr = Utils.isCelsius()
        ? `${(day.tempC||0).toFixed(0)}° / ${(day.nightTempC||0).toFixed(0)}°C`
        : `${Utils.cToF(day.tempC||0).toFixed(0)}° / ${Utils.cToF(day.nightTempC||0).toFixed(0)}°F`;

      return `
        <div class="forecast-card ${i===selectedIdx?'active':''}" data-idx="${i}">
          <div class="forecast-day">${Utils.formatDay(day.date)}</div>
          <div class="forecast-icon">${day.weatherIcon||'🌤'}</div>
          <div class="forecast-info">
            <div class="forecast-desc">${day.shortForecast||''}</div>
            <div class="forecast-temps">${tempStr} · ${day.probabilityOfPrecipitation||0}% rain</div>
          </div>
          <div class="forecast-index">
            <div class="fi-num" style="color:${color}">${score}</div>
            <div class="fi-label" style="color:${color}">${rating}</div>
            <div class="fi-dot" style="background:${color}"></div>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.forecast-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx);
        list.querySelectorAll('.forecast-card').forEach(c=>c.classList.remove('active'));
        card.classList.add('active');
        if (onDaySelect) onDaySelect(idx);
      });
    });
  }

  function buildForecastScores(days, riverData) {
    return (days||[]).map(day => {
      let score = 55;
      try { score = FishingIndex.calculateForDay(day, riverData, day.date).score; } catch(e) {}
      return { label: Utils.formatDay(day.date), score };
    });
  }

  // ── Tabs ──────────────────────────────────────────────────
  function initTabs(onTabChange) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
        tab.classList.add('active');
        const content = document.getElementById(`tab-${target}`);
        if (content) content.classList.add('active');
        if (onTabChange) try { onTabChange(target); } catch(e) {}
      });
    });
  }

  function initZoneButtons(onZoneSelect) {
    document.querySelectorAll('.zone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zone-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        try { onZoneSelect(btn.dataset.zone); } catch(e) {}
      });
    });
  }

  // ── Splash ────────────────────────────────────────────────
  function hideSplash() {
    const splash = $('splash');
    const app    = $('app');
    if (splash) splash.classList.add('fade-out');
    if (app)    app.classList.remove('hidden');
    setTimeout(() => { try { if(splash) splash.remove(); } catch(e){} }, 700);
  }

  function setSplashStatus(msg) {
    const el = $('splashStatus'); if (el) el.textContent = msg;
  }

  return {
    renderHero, renderDateStrip, renderSolunar, renderWeather,
    renderRiver, renderBreakdown, renderRecommendations,
    renderBestTimeBar, renderForecast, buildForecastScores,
    initTabs, initZoneButtons, hideSplash, setSplashStatus, drawScoreRing,
  };
})();
