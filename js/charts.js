// ============================================================
// CHARTS — Chart.js visualization module
// ============================================================

const Charts = (() => {

  let charts = {};

  const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d1e30',
        borderColor: 'rgba(77,184,160,0.2)',
        borderWidth: 1,
        titleColor: '#e8f4f0',
        bodyColor: '#8ab4a8',
        titleFont: { family: "'DM Mono', monospace", size: 11 },
        bodyFont: { family: "'DM Mono', monospace", size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(77,184,160,0.06)', drawBorder: false },
        ticks: { color: '#4a7a70', font: { family: "'DM Mono', monospace", size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(77,184,160,0.06)', drawBorder: false },
        ticks: { color: '#4a7a70', font: { family: "'DM Mono', monospace", size: 10 } },
        border: { display: false },
      },
    },
    animation: { duration: 600, easing: 'easeOutCubic' },
  };

  function destroy(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  }

  // ── Flow chart ────────────────────────────────────────────
  function renderFlowChart(data) {
    destroy('flowChart');
    const canvas = document.getElementById('flowChart');
    if (!canvas) return;

    const labels = data.map(d => d.date.slice(5)); // MM-DD
    const values = data.map(d => d.value);

    charts.flowChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#4db8a0',
          backgroundColor: 'rgba(77,184,160,0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#4db8a0',
          pointRadius: 3,
          pointHoverRadius: 5,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: { label: ctx => `${ctx.parsed.y} cfs` },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'cfs', color: '#4a7a70', font:{size:10} } },
        },
      },
    });
  }

  // ── Gauge chart ───────────────────────────────────────────
  function renderGaugeChart(data) {
    destroy('gaugeChart');
    const canvas = document.getElementById('gaugeChart');
    if (!canvas) return;

    const labels = data.map(d => d.date.slice(5));
    const values = data.map(d => d.value);

    charts.gaugeChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: values.map(v => `rgba(77,184,160,${0.3 + v * 0.1})`),
          borderColor: '#4db8a0',
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: { label: ctx => `${ctx.parsed.y} ft` },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'ft', color: '#4a7a70', font:{size:10} } },
        },
      },
    });
  }

  // ── Water temperature chart ───────────────────────────────
  function renderTempChart(data, unit = 'C') {
    destroy('tempChart');
    const canvas = document.getElementById('tempChart');
    if (!canvas) return;

    const labels = data.map(d => d.date.slice(5));
    const values = data.map(d => unit === 'F' ? Utils.cToF(d.value) : d.value);
    const ideal  = values.map(() => unit === 'F' ? [Utils.cToF(10), Utils.cToF(15)] : [10, 15]);

    charts.tempChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `Water °${unit}`,
            data: values,
            borderColor: '#e8884b',
            backgroundColor: 'rgba(232,136,75,0.08)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#e8884b',
            pointRadius: 3,
          },
          {
            label: 'Ideal Min',
            data: ideal.map(i => i[0]),
            borderColor: 'rgba(77,184,160,0.4)',
            borderWidth: 1,
            borderDash: [4,4],
            pointRadius: 0,
            fill: false,
          },
          {
            label: 'Ideal Max',
            data: ideal.map(i => i[1]),
            borderColor: 'rgba(77,184,160,0.4)',
            borderWidth: 1,
            borderDash: [4,4],
            pointRadius: 0,
            fill: '-1',
            backgroundColor: 'rgba(77,184,160,0.05)',
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          legend: {
            display: true,
            labels: { color: '#4a7a70', font: { size: 9, family: "'DM Mono', monospace" }, boxWidth: 12 },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: `°${unit}`, color: '#4a7a70', font:{size:10} } },
        },
      },
    });
  }

  // ── Fishing Index 7-day forecast chart ───────────────────
  function renderIndexChart(forecastScores) {
    destroy('indexChart');
    const canvas = document.getElementById('indexChart');
    if (!canvas) return;

    const labels = forecastScores.map(d => d.label);
    const values = forecastScores.map(d => d.score);
    const colors = values.map(v => Utils.scoreColor(v));

    charts.indexChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + '66'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          tooltip: {
            ...CHART_DEFAULTS.plugins.tooltip,
            callbacks: { label: ctx => `${ctx.parsed.y} — ${Utils.scoreRating(ctx.parsed.y)}` },
          },
        },
        scales: {
          ...CHART_DEFAULTS.scales,
          y: { ...CHART_DEFAULTS.scales.y, min: 0, max: 100,
               title: { display: true, text: 'Index', color: '#4a7a70', font:{size:10} } },
        },
      },
    });
  }

  // ── Update all charts ─────────────────────────────────────
  function renderAll(historicalData, forecastScores, useCelsius) {
    const unit = useCelsius ? 'C' : 'F';
    if (historicalData.flowSeries.length)  renderFlowChart(historicalData.flowSeries);
    if (historicalData.gaugeSeries.length) renderGaugeChart(historicalData.gaugeSeries);

    // Build temp series: use USGS water temp if available, else estimate
    const tempData = historicalData.tempSeries.length > 0
      ? historicalData.tempSeries
      : historicalData.flowSeries.map((d, i) => ({
          date: d.date,
          value: 11 + Math.sin(i * 0.5) * 2, // smooth estimate
        }));

    renderTempChart(tempData, unit);
    if (forecastScores) renderIndexChart(forecastScores);
  }

  return { renderAll, renderFlowChart, renderGaugeChart, renderTempChart, renderIndexChart };
})();
