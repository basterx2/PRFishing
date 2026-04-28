// ============================================================
// UI — DOM rendering & interaction layer
// ============================================================

const UI = (() => {

  // ── Draw score ring (canvas) ──────────────────────────────
  function drawScoreRing(score) {
    const canvas = document.getElementById('scoreRing');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, r = W/2 - 10;

    ctx.clearRect(0, 0, W, H);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2*Math.PI);
    ctx.strokeStyle = 'rgba(77,184,160,0.10)';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Score arc
    const pct = score / 100;
    const start = -Math.PI/2;
    const end = start + pct * 2 * Math.PI;
    const color = Utils.scoreColor(score);

    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center text
    ctx.fillStyle = color;
    ctx.font = `bold 28px 'Playfair Display', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score, cx, cy);
  }

  // ── Render hero section ───────────────────────────────────
  function renderHero(result) {
    const el = (id) => document.getElementById(id);
    el('heroScore').textContent   = result.score;
    el('heroRating').textContent  = result.rating;
    el('heroRating').className    = `hero-rating ${result.ratingClass}`;
    el('heroUpdated').textContent = `Updated ${Utils.formatTime(new Date())}`;
    drawScoreRing(result.score);
  }

  // ── Render date strip ──────────────────────────────────────
  function renderDateStrip(days, selectedIdx, onSelect) {
    const strip = document.getElementById('dateStrip');
    strip.innerHTML = '';
    days.forEach((date, i) => {
      const pill = document.createElement('button');
      pill.className = `day-pill${i === selectedIdx ? ' active' : ''}`;
      pill.innerHTML = `
        <span>${Utils.formatDay(date)}</span>
        <span>${Utils.formatDate(date)}</span>
      `;
      pill.addEventListener('click', () => onSelect(i));
      strip.appendChild(pill);
    });
  }

  // ── Render solunar section ────────────────────────────────
  function renderSolunar(solunarData) {
    const el = document.getElementById('moonPhase');
    if (el) {
      el.textContent = solunarData.phaseInfo.emoji;
      el.title = solunarData.phaseInfo.name;
    }

    const grid = document.getElementById('solunarGrid');
    if (!grid) return;

    // Show up to 4 upcoming periods
    const now = new Date();
    const upcoming = solunarData.periods
      .filter(p => p.time > now || Math.abs(p.time - now) < 3600000)
      .slice(0, 4);

    if (upcoming.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-3);font-size:0.78rem;padding:0.5rem">No periods available</div>';
      return;
    }

    grid.innerHTML = upcoming.map(p => `
      <div class="solunar-item ${p.type}">
        <div class="solunar-type">${p.label}</div>
        <div class="solunar-time">${Utils.formatTime(p.time)}</div>
        <div class="solunar-dur">${p.duration} min window</div>
      </div>
    `).join('');
  }

  // ── Render weather stats ──────────────────────────────────
  function renderWeather(wx, dateIsToday = true) {
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    if (!wx) { ['wTemp','wWind','wCloud','wPressure','wRain'].forEach(id => set(id,'—')); return; }

    set('wTemp', Utils.formatTemp(wx.tempC));
    set('wWind', `${wx.windSpeed} mph ${wx.windDir||''}`);
    set('wCloud', `${wx.cloudCover}%`);
    set('wPressure', dateIsToday ? '~860 hPa' : '—');
    set('wRain', `${wx.probabilityOfPrecipitation}%`);
  }

  // ── Render river stats ────────────────────────────────────
  function renderRiver(riverData, airTempC, date) {
    const set = (id, val, cls) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = val;
      if (cls) el.className = cls;
    };

    if (!riverData) {
      ['rFlow','rGauge','rTemp','rStatus','rTrend'].forEach(id => set(id,'—'));
      return;
    }

    const wt = riverData.waterTemp != null
      ? riverData.waterTemp
      : USGS.estimateWaterTemp(airTempC || 15, date || new Date());

    const status = USGS.flowStatus(riverData.flow);

    set('rFlow',   riverData.flow  ? `${Math.round(riverData.flow)} cfs` : '—');
    set('rGauge',  riverData.gauge ? `${riverData.gauge.toFixed(2)} ft`  : '—');
    set('rTemp',   Utils.formatTemp(wt) + (riverData.waterTemp == null ? ' *est' : ''));
    set('rStatus', status.label, status.class);
    set('rTrend',  riverData.trend || '—');
  }

  // ── Render breakdown bars ─────────────────────────────────
  function renderBreakdown(breakdown) {
    const list = document.getElementById('breakdownList');
    if (!list) return;
    list.innerHTML = breakdown.map(item => `
      <div class="breakdown-row">
        <div class="breakdown-label">${item.label}</div>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar" style="width:${item.score}%;background:${Utils.barColor(item.score)}"></div>
        </div>
        <div class="breakdown-score">${Math.round(item.score)}</div>
      </div>
    `).join('');
  }

  // ── Render recommendations ────────────────────────────────
  function renderRecommendations(recs) {
    const el = document.getElementById('recList');
    if (!el) return;
    if (!recs || recs.length === 0) { el.textContent = 'No recommendations available.'; return; }
    el.innerHTML = recs.map(r => `
      <div class="rec-item"><span class="rec-dot">›</span><span>${r}</span></div>
    `).join('');
  }

  // ── Render best time bar (24-hour) ────────────────────────
  function renderBestTimeBar(hourlyScores) {
    const bar = document.getElementById('bestTimeBar');
    if (!bar) return;

    // Group by 2-hour blocks for readability (12 segments)
    const segments = [];
    for (let h = 0; h < 24; h += 2) {
      const avg = Math.round((hourlyScores[h].score + (hourlyScores[h+1]?.score||hourlyScores[h].score)) / 2);
      segments.push({ hour: h, score: avg });
    }

    const maxScore = Math.max(...segments.map(s=>s.score));

    bar.innerHTML = segments.map(seg => {
      let cls = 'poor';
      if (seg.score >= 71) cls = 'peak';
      else if (seg.score >= 51) cls = 'good';
      else if (seg.score >= 31) cls = 'fair';

      const h = seg.hour;
      const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h-12}p`;

      return `<div class="time-seg ${cls}" title="${label}: ${seg.score}">${label}</div>`;
    }).join('');
  }

  // ── Render forecast list ──────────────────────────────────
  function renderForecast(days, riverData, onDaySelect, selectedIdx = 0) {
    const list = document.getElementById('forecastList');
    if (!list) return;

    list.innerHTML = days.map((day, i) => {
      const result = FishingIndex.calculateForDay(day, riverData, day.date);
      const color = Utils.scoreColor(result.score);
      const tempStr = Utils.isCelsius()
        ? `${day.tempC.toFixed(0)}° / ${day.nightTempC.toFixed(0)}°C`
        : `${Utils.cToF(day.tempC).toFixed(0)}° / ${Utils.cToF(day.nightTempC).toFixed(0)}°F`;

      return `
        <div class="forecast-card ${i === selectedIdx ? 'active' : ''}" data-idx="${i}">
          <div class="forecast-day">${Utils.formatDay(day.date)}</div>
          <div class="forecast-icon">${day.weatherIcon}</div>
          <div class="forecast-info">
            <div class="forecast-desc">${day.shortForecast}</div>
            <div class="forecast-temps">${tempStr} · ${day.probabilityOfPrecipitation}% rain</div>
          </div>
          <div class="forecast-index">
            <div class="fi-num" style="color:${color}">${result.score}</div>
            <div class="fi-label" style="color:${color}">${result.rating}</div>
            <div class="fi-dot" style="background:${color}"></div>
          </div>
        </div>
      `;
    }).join('');

    // Click handlers
    list.querySelectorAll('.forecast-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx);
        list.querySelectorAll('.forecast-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        onDaySelect(idx);
      });
    });
  }

  // ── Compute forecast scores for chart ────────────────────
  function buildForecastScores(days, riverData) {
    return days.map(day => {
      const result = FishingIndex.calculateForDay(day, riverData, day.date);
      return { label: Utils.formatDay(day.date), score: result.score };
    });
  }

  // ── Tab switching ─────────────────────────────────────────
  function initTabs(onTabChange) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const content = document.getElementById(`tab-${target}`);
        if (content) content.classList.add('active');
        if (onTabChange) onTabChange(target);
      });
    });
  }

  // ── Zone buttons ──────────────────────────────────────────
  function initZoneButtons(onZoneSelect) {
    document.querySelectorAll('.zone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onZoneSelect(btn.dataset.zone);
      });
    });
  }

  // ── Hide splash ───────────────────────────────────────────
  function hideSplash() {
    const splash = document.getElementById('splash');
    const app    = document.getElementById('app');
    splash.classList.add('fade-out');
    app.classList.remove('hidden');
    setTimeout(() => splash.remove(), 700);
  }

  // ── Update splash status ──────────────────────────────────
  function setSplashStatus(msg) {
    const el = document.getElementById('splashStatus');
    if (el) el.textContent = msg;
  }

  return {
    renderHero, renderDateStrip, renderSolunar, renderWeather,
    renderRiver, renderBreakdown, renderRecommendations,
    renderBestTimeBar, renderForecast, buildForecastScores,
    initTabs, initZoneButtons, hideSplash, setSplashStatus,
    drawScoreRing,
  };
})();
