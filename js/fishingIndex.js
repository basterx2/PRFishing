// ============================================================
// FISHING INDEX — Core scoring algorithm (0-100)
// Optimized for Rainbow & Brown Trout, Provo River, Utah
// ============================================================

const FishingIndex = (() => {

  // ── Time of day score (0-100) ────────────────────────────
  // Peaks at dawn and dusk, lowest at midday
  function timeOfDayScore(date, sunRise, sunSet) {
    const now = date || new Date();
    const h = now.getHours() + now.getMinutes() / 60;

    // Get sunrise/sunset hours in local time
    const srH = sunRise ? (sunRise.getHours() + sunRise.getMinutes()/60) : 6;
    const ssH = sunSet  ? (sunSet.getHours()  + sunSet.getMinutes()/60)  : 20;

    // Score function: high near sunrise/sunset, low at noon/night
    const dawnWindow  = 2.0; // hours around sunrise
    const duskWindow  = 2.0;
    const nightStart  = ssH + 2;
    const nightEnd    = srH - 1;

    // Dawn peak
    const dawnDiff = Math.abs(h - srH);
    if (dawnDiff < dawnWindow) {
      return Math.round(100 - (dawnDiff / dawnWindow) * 40);
    }

    // Dusk peak
    const duskDiff = Math.abs(h - ssH);
    if (duskDiff < duskWindow) {
      return Math.round(100 - (duskDiff / duskWindow) * 40);
    }

    // Night (before dawn or after dusk+2)
    if (h < srH - 1 || h > ssH + 2) return 30;

    // Midday trough — sinusoidal between dawn and dusk
    const midday = (srH + ssH) / 2;
    const dayLength = ssH - srH;
    const dayProgress = (h - srH) / dayLength; // 0=dawn, 1=dusk, 0.5=noon
    // Cosine wave: 1 at dawn/dusk, 0 at noon
    const score = 60 + 35 * Math.cos(dayProgress * Math.PI);
    return Math.round(Utils.clamp(score, 25, 95));
  }

  // ── Hourly fishing scores (for best time visualization) ───
  function getHourlyScores(params, sunRise, sunSet) {
    const scores = [];
    const now = new Date();
    const baseDate = new Date(now);
    baseDate.setHours(0,0,0,0);

    for (let h = 0; h < 24; h++) {
      const d = new Date(baseDate.getTime() + h * 3600000);
      const todScore = timeOfDayScore(d, sunRise, sunSet);

      // Simplified score for hourly (use pre-calculated env scores)
      const w = CONFIG.indexWeights;
      const score = Math.round(
        params.solunarScore  * w.solunar +
        params.waterTempScore * w.waterTemp +
        params.flowScore      * w.flow +
        todScore              * w.timeOfDay +
        params.pressureScore  * w.pressure +
        params.cloudScore     * w.cloudCover +
        params.stabilityScore * w.stability
      );
      scores.push({ hour: h, score: Utils.clamp(score, 0, 100) });
    }
    return scores;
  }

  // ── Main scoring function ─────────────────────────────────
  function calculate(params) {
    /*
      params: {
        solunarScore     (0-100) — from Solunar engine
        waterTempC       (number) — °C
        flowCfs          (number) — cubic feet/sec
        airTempC         (number) — for context
        cloudCoverPct    (number) — 0-100
        pressureTrend    ('stable'|'rising'|'falling')
        precipProb       (number) — 0-100
        windSpeed        (number) — mph
        date             (Date)
        sunRise          (Date)
        sunSet           (Date)
      }
    */

    const w = CONFIG.indexWeights;

    // 1. Solunar (25%)
    const solScore = Utils.clamp(params.solunarScore || 50, 0, 100);

    // 2. Water temperature (20%)
    const wtScore = USGS.waterTempScore(params.waterTempC);

    // 3. Flow (15%)
    const flowScore = USGS.flowScore(params.flowCfs);

    // 4. Time of day (10%)
    const todScore = timeOfDayScore(params.date, params.sunRise, params.sunSet);

    // 5. Atmospheric pressure (10%)
    const pressScore = Weather.pressureScore(params.pressure, params.pressureTrend || 'stable');

    // 6. Cloud cover (10%)
    const cloudScore = Weather.cloudCoverScore(params.cloudCoverPct || 50);

    // 7. Weather stability (10%)
    const stabScore = params.stabilityScore || 65;

    // Weighted sum
    const raw = (
      solScore   * w.solunar +
      wtScore    * w.waterTemp +
      flowScore  * w.flow +
      todScore   * w.timeOfDay +
      pressScore * w.pressure +
      cloudScore * w.cloudCover +
      stabScore  * w.stability
    );

    // Penalty adjustments
    let score = raw;

    // Strong wind penalty (>20mph hurts dry fly fishing)
    if (params.windSpeed > 20) score -= (params.windSpeed - 20) * 0.5;

    // High rain probability penalty
    if (params.precipProb > 60) score -= (params.precipProb - 60) * 0.3;

    // Full/New moon bonus (±2 points)
    const phase = Solunar.moonPhase(params.date || new Date());
    const moonBonus = Math.abs(Math.cos(phase * 2 * Math.PI)) * 5;
    score += moonBonus;

    const finalScore = Math.round(Utils.clamp(score, 0, 100));

    // Component breakdown for display
    const breakdown = [
      { label: '🌙 Solunar Activity', score: solScore,   weight: w.solunar,    raw: solScore   * w.solunar },
      { label: '🌡 Water Temperature', score: wtScore,    weight: w.waterTemp,  raw: wtScore    * w.waterTemp },
      { label: '🌊 River Flow',        score: flowScore,  weight: w.flow,       raw: flowScore  * w.flow },
      { label: '🕐 Time of Day',       score: todScore,   weight: w.timeOfDay,  raw: todScore   * w.timeOfDay },
      { label: '📊 Atm. Pressure',     score: pressScore, weight: w.pressure,   raw: pressScore * w.pressure },
      { label: '☁️ Cloud Cover',       score: cloudScore, weight: w.cloudCover, raw: cloudScore * w.cloudCover },
      { label: '🌤 Weather Stability', score: stabScore,  weight: w.stability,  raw: stabScore  * w.stability },
    ];

    return {
      score: finalScore,
      rating: Utils.scoreRating(finalScore),
      ratingClass: Utils.scoreClass(finalScore),
      breakdown,
      components: { solScore, wtScore, flowScore, todScore, pressScore, cloudScore, stabScore },
    };
  }

  // ── Generate recommendations ──────────────────────────────
  function getRecommendations(result, params) {
    const recs = [];
    const { components, score } = result;

    // Water temperature recs
    if (params.waterTempC !== null) {
      if (params.waterTempC < 8) recs.push('Water is cold — fish slow nymphs deep near structure.');
      else if (params.waterTempC >= 10 && params.waterTempC <= 15)
        recs.push('Water temp is ideal for trout. Expect active feeding throughout the day.');
      else if (params.waterTempC > 18)
        recs.push('Water is warm — move to shaded riffles, target early morning only.');
    }

    // Flow recs
    if (params.flowCfs !== null) {
      if (params.flowCfs < 100)
        recs.push('Low flow — fish are spooky. Use long, fine leaders (6X) and small flies.');
      else if (params.flowCfs > 600)
        recs.push('High flow — target seams and eddies. Heavy nymphs and streamers will work best.');
      else
        recs.push('Flow is excellent. All techniques should be productive.');
    }

    // Solunar
    if (components.solScore > 75)
      recs.push('🌙 Major solunar period — expect heightened feeding activity.');
    else if (components.solScore > 55)
      recs.push('Minor solunar influence — good time to be on the water.');

    // Time of day
    if (components.todScore > 80)
      recs.push('Golden hour is active — prime time for dry flies and emergers.');
    else if (components.todScore < 40)
      recs.push('Midday slump — try deep nymphing or take a break until 4 PM.');

    // Cloud cover
    if (params.cloudCoverPct > 60)
      recs.push('Overcast skies reduce light penetration — trout will be less wary.');

    // Wind
    if (params.windSpeed > 15)
      recs.push(`Wind at ${params.windSpeed} mph — position upstream. Consider terrestrials in gusts.`);

    // Overall
    if (score >= 71)
      recs.push('Overall conditions are excellent. Get on the water!');
    else if (score < 30)
      recs.push('Tough conditions today. If you go, focus on deep runs and pools.');

    return recs.slice(0, 5);
  }

  // ── Score for a specific forecast day ────────────────────
  function calculateForDay(dayForecast, riverData, date) {
    const airTempC = dayForecast.tempC;
    const waterTempC = riverData?.waterTemp ?? USGS.estimateWaterTemp(airTempC, date);
    const sol = Solunar.getSolunarPeriods(date, CONFIG.river.lat, CONFIG.river.lon);

    const params = {
      solunarScore:   sol.solunarScore,
      waterTempC,
      flowCfs:        riverData?.flow || null,
      airTempC,
      cloudCoverPct:  dayForecast.cloudCover,
      pressureTrend:  'stable',
      precipProb:     dayForecast.probabilityOfPrecipitation,
      windSpeed:      dayForecast.windSpeed,
      stabilityScore: 70,
      date,
      sunRise:        sol.sunRise,
      sunSet:         sol.sunSet,
    };

    return calculate(params);
  }

  return { calculate, getHourlyScores, getRecommendations, calculateForDay, timeOfDayScore };
})();
