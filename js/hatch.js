// ============================================================
// HATCH CALENDAR — Provo River, Utah
// Datos de eclosiones específicos para el río Provo
// basados en registros históricos y literatura local
// ============================================================

const HatchCalendar = (() => {

  // ── BASE DE DATOS DE ECLOSIONES ──────────────────────────
  // months: 1–12, peak: mes de mayor actividad
  // waterTempMin/Max: °C donde ocurre la eclosión
  // timeOfDay: 'morning' | 'midday' | 'afternoon' | 'evening' | 'all'
  // size: anzuelo recomendado
  // zone: qué tramos del Provo
  const HATCHES = [

    // ══ EPHEMEROPTERA (Mayflies) ═══════════════════════════

    {
      id: 'bwo_spring',
      name: 'Blue-Winged Olive',
      latin: 'Baetis tricaudatus',
      type: 'mayfly',
      emoji: '🫒',
      months: [3,4,5,10,11,12,1,2],
      peak: [4,11],
      waterTempMin: 4,
      waterTempMax: 12,
      timeOfDay: 'midday',
      timeLabel: '10am – 2pm',
      size: [18, 20, 22],
      sizeLabel: '#18–22',
      zone: ['upper','middle','lower'],
      intensity: { 1:2, 2:3, 3:4, 4:5, 5:3, 6:1, 7:1, 8:1, 9:1, 10:4, 11:5, 12:3 },
      patterns: [
        { name: 'Parachute BWO',     type: 'dry',   hook: '#18–20' },
        { name: 'RS2',               type: 'emerger',hook: '#20–22' },
        { name: 'Pheasant Tail',     type: 'nymph', hook: '#18–22' },
        { name: 'Sparkle Dun BWO',   type: 'dry',   hook: '#18–20' },
        { name: 'Mercury BWO',       type: 'nymph', hook: '#20–22' },
      ],
      notes: 'La eclosión más confiable del Provo. Mejor en días nublados y fríos. Truchas muy selectivas — presentación perfecta es clave.',
      color: '#7ab8a0',
    },

    {
      id: 'pmd',
      name: 'Pale Morning Dun',
      latin: 'Ephemerella inermis / infrequens',
      type: 'mayfly',
      emoji: '🌿',
      months: [5,6,7,8],
      peak: [6,7],
      waterTempMin: 12,
      waterTempMax: 18,
      timeOfDay: 'morning',
      timeLabel: '8am – 11am',
      size: [16, 18, 20],
      sizeLabel: '#16–20',
      zone: ['middle','upper'],
      intensity: { 1:0, 2:0, 3:0, 4:1, 5:3, 6:5, 7:5, 8:3, 9:1, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Parachute PMD',     type: 'dry',    hook: '#16–18' },
        { name: 'PMD Cripple',       type: 'emerger', hook: '#16–18' },
        { name: 'Barr\'s Emerger',   type: 'emerger', hook: '#18–20' },
        { name: 'PMD Nymph',         type: 'nymph',  hook: '#16–18' },
        { name: 'Vis-A-Dun PMD',     type: 'dry',    hook: '#16–18' },
      ],
      notes: 'El hatch más importante del verano en el Middle Provo. Las truchas son muy activas. Prueba cripples y emergers cuando los peces rechazan los secos.',
      color: '#e8d87a',
    },

    {
      id: 'trico',
      name: 'Trico',
      latin: 'Tricorythodes minutus',
      type: 'mayfly',
      emoji: '⚫',
      months: [7,8,9,10],
      peak: [8,9],
      waterTempMin: 14,
      waterTempMax: 20,
      timeOfDay: 'morning',
      timeLabel: '7am – 10am',
      size: [20, 22, 24],
      sizeLabel: '#20–24',
      zone: ['lower','middle'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:1, 7:3, 8:5, 9:5, 10:3, 11:0, 12:0 },
      patterns: [
        { name: 'Trico Spinner',     type: 'dry',    hook: '#20–24' },
        { name: 'Black Beauty',      type: 'emerger', hook: '#22–24' },
        { name: 'Trico Dun',         type: 'dry',    hook: '#20–22' },
        { name: 'CDC Trico',         type: 'dry',    hook: '#22–24' },
      ],
      notes: 'Masiva spinner fall al amanecer. Las truchas se alimentan en superficie en agua plana — presenta con líderes largos y tippet fino (6X–7X).',
      color: '#444',
    },

    {
      id: 'callibaetis',
      name: 'Callibaetis',
      latin: 'Callibaetis ferrugineus',
      type: 'mayfly',
      emoji: '🔵',
      months: [5,6,7,8,9],
      peak: [6,7],
      waterTempMin: 13,
      waterTempMax: 19,
      timeOfDay: 'midday',
      timeLabel: '10am – 1pm',
      size: [14, 16, 18],
      sizeLabel: '#14–18',
      zone: ['middle'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:2, 6:4, 7:5, 8:3, 9:2, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Parachute Callibaetis', type: 'dry',   hook: '#14–16' },
        { name: 'Callibaetis Nymph',     type: 'nymph', hook: '#14–16' },
        { name: 'Sparkle Dun',           type: 'dry',   hook: '#16–18' },
      ],
      notes: 'Frecuente en pozas lentas del Middle Provo. Truchas rising visibles en aguas planas.',
      color: '#5b8ab8',
    },

    {
      id: 'mahogany',
      name: 'Mahogany Dun',
      latin: 'Paraleptophlebia heteronea',
      type: 'mayfly',
      emoji: '🟫',
      months: [8,9,10,11],
      peak: [9,10],
      waterTempMin: 8,
      waterTempMax: 14,
      timeOfDay: 'afternoon',
      timeLabel: '1pm – 5pm',
      size: [14, 16],
      sizeLabel: '#14–16',
      zone: ['upper','middle'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:2, 9:5, 10:4, 11:2, 12:0 },
      patterns: [
        { name: 'Parachute Mahogany', type: 'dry',    hook: '#14–16' },
        { name: 'Mahogany Comparadun',type: 'dry',    hook: '#14–16' },
        { name: 'Hare\'s Ear',        type: 'nymph',  hook: '#14–16' },
      ],
      notes: 'Excelente hatch de otoño, coincide con el BWO. Uno de los mejores momentos del año en el Upper Provo.',
      color: '#8b5e3c',
    },

    // ══ TRICHOPTERA (Caddisflies) ═══════════════════════════

    {
      id: 'caddis_spring',
      name: 'Mother\'s Day Caddis',
      latin: 'Brachycentrus occidentalis',
      type: 'caddis',
      emoji: '🦋',
      months: [4,5,6],
      peak: [5],
      waterTempMin: 8,
      waterTempMax: 14,
      timeOfDay: 'afternoon',
      timeLabel: '2pm – 7pm',
      size: [14, 16, 18],
      sizeLabel: '#14–18',
      zone: ['upper','middle','lower'],
      intensity: { 1:0, 2:0, 3:0, 4:2, 5:5, 6:3, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Elk Hair Caddis',   type: 'dry',    hook: '#14–16' },
        { name: 'X-Caddis',         type: 'emerger', hook: '#14–16' },
        { name: 'Lafontaine Pupa',   type: 'pupa',   hook: '#14–18' },
        { name: 'Green Caddis Pupa', type: 'pupa',   hook: '#14–16' },
        { name: 'Parachute Caddis', type: 'dry',    hook: '#14–16' },
      ],
      notes: 'El evento de pesca más masivo del año. Millones de caddis emergen simultáneamente. Las truchas se lanzan en frenesí. ¡No te lo pierdas!',
      color: '#c8a84b',
    },

    {
      id: 'caddis_summer',
      name: 'Little Brown Caddis',
      latin: 'Hydropsyche spp.',
      type: 'caddis',
      emoji: '🪲',
      months: [6,7,8,9],
      peak: [7,8],
      waterTempMin: 14,
      waterTempMax: 20,
      timeOfDay: 'evening',
      timeLabel: '5pm – Dark',
      size: [14, 16, 18],
      sizeLabel: '#14–18',
      zone: ['lower','middle'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:1, 6:3, 7:5, 8:5, 9:3, 10:1, 11:0, 12:0 },
      patterns: [
        { name: 'Elk Hair Caddis',   type: 'dry',    hook: '#14–16' },
        { name: 'Goddard Caddis',    type: 'dry',    hook: '#14–16' },
        { name: 'Soft Hackle',       type: 'wet',    hook: '#14–16' },
        { name: 'Hydropsyche Pupa',  type: 'pupa',   hook: '#14–16' },
      ],
      notes: 'Activo al atardecer todo el verano. Excelente para swinging soft hackles en riffles del Lower Provo.',
      color: '#9b7a3c',
    },

    {
      id: 'caddis_fall',
      name: 'October Caddis',
      latin: 'Dicosmoecus gilvipes',
      type: 'caddis',
      emoji: '🍂',
      months: [9,10,11],
      peak: [10],
      waterTempMin: 6,
      waterTempMax: 12,
      timeOfDay: 'afternoon',
      timeLabel: '2pm – 6pm',
      size: [6, 8, 10],
      sizeLabel: '#6–10',
      zone: ['upper','middle'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:3, 10:5, 11:3, 12:0 },
      patterns: [
        { name: 'Stimulator Orange', type: 'dry',    hook: '#6–8' },
        { name: 'October Caddis Dry',type: 'dry',    hook: '#8–10' },
        { name: 'October Caddis Pupa',type:'pupa',   hook: '#8–10' },
      ],
      notes: 'Mosca grande — las truchas salen a por ella. Color naranja brillante inconfundible. Uno de los hatches más emocionantes del otoño.',
      color: '#e8724b',
    },

    // ══ PLECOPTERA (Stoneflies) ══════════════════════════════

    {
      id: 'skwala',
      name: 'Skwala Stonefly',
      latin: 'Skwala americana',
      type: 'stonefly',
      emoji: '🟢',
      months: [3,4],
      peak: [3,4],
      waterTempMin: 5,
      waterTempMax: 10,
      timeOfDay: 'midday',
      timeLabel: '11am – 3pm',
      size: [8, 10, 12],
      sizeLabel: '#8–12',
      zone: ['upper','middle'],
      intensity: { 1:0, 2:0, 3:4, 4:5, 5:1, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Skwala Para',       type: 'dry',    hook: '#8–10' },
        { name: 'Olive Stimulator',  type: 'dry',    hook: '#8–12' },
        { name: 'Skwala Nymph',      type: 'nymph',  hook: '#8–10' },
        { name: 'Tungsten Skwala',   type: 'nymph',  hook: '#10–12' },
      ],
      notes: 'Primera gran oportunidad de pesca con seco del año. Las truchas agresivas y hambrientas tras el invierno. Busca en orillas y contra la corriente.',
      color: '#5ba85b',
    },

    {
      id: 'golden_stone',
      name: 'Golden Stonefly',
      latin: 'Hesperoperla pacifica',
      type: 'stonefly',
      emoji: '🟡',
      months: [6,7],
      peak: [6,7],
      waterTempMin: 13,
      waterTempMax: 19,
      timeOfDay: 'evening',
      timeLabel: '4pm – Dark',
      size: [6, 8, 10],
      sizeLabel: '#6–10',
      zone: ['upper'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:1, 6:5, 7:4, 8:1, 9:0, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Stimulator Yellow', type: 'dry',    hook: '#6–8' },
        { name: 'Golden Stone Dry',  type: 'dry',    hook: '#6–8' },
        { name: 'Pat\'s Rubber Legs',type: 'nymph',  hook: '#6–8' },
        { name: 'Kaufmann Stone',    type: 'nymph',  hook: '#6–8' },
      ],
      notes: 'Principalmente en el Upper Provo. Las ninfas migran al fondo días antes de la eclosión — buena pesca de ninfas incluso sin actividad en superficie.',
      color: '#e8c84b',
    },

    {
      id: 'little_yellow',
      name: 'Little Yellow Sally',
      latin: 'Siphonoperla spp.',
      type: 'stonefly',
      emoji: '💛',
      months: [6,7,8,9],
      peak: [7,8],
      waterTempMin: 14,
      waterTempMax: 20,
      timeOfDay: 'afternoon',
      timeLabel: '2pm – 6pm',
      size: [14, 16],
      sizeLabel: '#14–16',
      zone: ['upper','middle'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:2, 7:5, 8:5, 9:2, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Blonde Humpy',      type: 'dry',    hook: '#14–16' },
        { name: 'Yellow Sally',      type: 'dry',    hook: '#14–16' },
        { name: 'Little Yellow Stone',type:'dry',    hook: '#14–16' },
      ],
      notes: 'Abundante todo el verano. Color amarillo pálido inconfundible. Busca en riffles rápidos.',
      color: '#f0d060',
    },

    // ══ DIPTERA (Midges) ════════════════════════════════════

    {
      id: 'midge',
      name: 'Midge',
      latin: 'Chironomidae',
      type: 'midge',
      emoji: '🔴',
      months: [1,2,3,4,5,6,7,8,9,10,11,12],
      peak: [1,2,3,12],
      waterTempMin: 0,
      waterTempMax: 22,
      timeOfDay: 'midday',
      timeLabel: '10am – 2pm (invierno)',
      size: [20, 22, 24, 26],
      sizeLabel: '#20–26',
      zone: ['upper','middle','lower'],
      intensity: { 1:5, 2:5, 3:4, 4:3, 5:2, 6:2, 7:2, 8:2, 9:2, 10:3, 11:4, 12:5 },
      patterns: [
        { name: 'Zebra Midge',       type: 'nymph',  hook: '#20–24' },
        { name: 'Griffith\'s Gnat',  type: 'dry',    hook: '#20–22' },
        { name: 'Palomino Midge',    type: 'emerger',hook: '#20–22' },
        { name: 'Mercury Midge',     type: 'nymph',  hook: '#22–24' },
        { name: 'Disco Midge',       type: 'nymph',  hook: '#22–24' },
      ],
      notes: 'El pan de cada día en el Provo. Crítico en invierno cuando nada más emerge. Usa tippet 6X–7X y presentación perfecta en pozas tranquilas.',
      color: '#c05050',
    },

    // ══ TERRESTRIALS ════════════════════════════════════════

    {
      id: 'hopper',
      name: 'Grasshopper',
      latin: 'Acrididae',
      type: 'terrestrial',
      emoji: '🦗',
      months: [7,8,9],
      peak: [8],
      waterTempMin: 16,
      waterTempMax: 24,
      timeOfDay: 'afternoon',
      timeLabel: '11am – 4pm',
      size: [6, 8, 10, 12],
      sizeLabel: '#6–12',
      zone: ['middle','lower'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:3, 8:5, 9:3, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Dave\'s Hopper',    type: 'dry',    hook: '#6–10' },
        { name: 'Parachute Hopper',  type: 'dry',    hook: '#8–10' },
        { name: 'Moorish Hopper',    type: 'dry',    hook: '#6–8' },
        { name: 'Chubby Chernobyl', type: 'dry',    hook: '#6–8' },
      ],
      notes: 'Pesca de hopper imprescindible en agosto. Lanza cerca de las orillas con vegetación. Las truchas golpean agresivamente — usa tippet 4X.',
      color: '#8bc84b',
    },

    {
      id: 'ant',
      name: 'Flying Ant',
      latin: 'Formicidae',
      type: 'terrestrial',
      emoji: '🐜',
      months: [8,9],
      peak: [8,9],
      waterTempMin: 16,
      waterTempMax: 22,
      timeOfDay: 'afternoon',
      timeLabel: '1pm – 5pm',
      size: [14, 16, 18, 20],
      sizeLabel: '#14–20',
      zone: ['upper','middle'],
      intensity: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:1, 8:4, 9:4, 10:0, 11:0, 12:0 },
      patterns: [
        { name: 'Foam Flying Ant',   type: 'dry',    hook: '#14–18' },
        { name: 'Black Ant',         type: 'dry',    hook: '#16–20' },
        { name: 'Cinnamon Ant',      type: 'dry',    hook: '#14–18' },
      ],
      notes: 'Las caídas masivas de hormigas voladoras crean frenesíes impredecibles pero brutales. Siempre lleva hormigas en tu caja.',
      color: '#3a2a1a',
    },
  ];

  // ── Tipos con colores e iconos ────────────────────────────
  const TYPE_META = {
    mayfly:      { label: 'Mayfly',      icon: '🪁', color: '#7ab8a0', bgColor: 'rgba(122,184,160,0.12)' },
    caddis:      { label: 'Caddis',      icon: '🦋', color: '#c8a84b', bgColor: 'rgba(200,168,75,0.12)'  },
    stonefly:    { label: 'Stonefly',    icon: '🪨', color: '#e8884b', bgColor: 'rgba(232,136,75,0.12)'  },
    midge:       { label: 'Midge',       icon: '🔴', color: '#c05050', bgColor: 'rgba(192,80,80,0.12)'   },
    terrestrial: { label: 'Terrestrial', icon: '🌱', color: '#8bc84b', bgColor: 'rgba(139,200,75,0.12)'  },
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // ── Obtener hatches activos este mes ──────────────────────
  function getActiveHatches(month) {
    return HATCHES
      .filter(h => h.months.includes(month))
      .sort((a, b) => (b.intensity[month] || 0) - (a.intensity[month] || 0));
  }

  // ── Obtener hatches activos HOY (con temperatura) ─────────
  function getTodayHatches(waterTempC, month) {
    return HATCHES
      .filter(h => {
        if (!h.months.includes(month)) return false;
        if (waterTempC === null) return true;
        return waterTempC >= h.waterTempMin && waterTempC <= h.waterTempMax;
      })
      .sort((a, b) => (b.intensity[month] || 0) - (a.intensity[month] || 0));
  }

  // ── Score de hatch para fishing index ────────────────────
  function getHatchScore(waterTempC, month, hourOfDay) {
    const active = getTodayHatches(waterTempC, month);
    if (!active.length) return 20;

    let score = 0;
    for (const h of active.slice(0, 3)) {
      const intensity = h.intensity[month] || 0;
      const timeBonus = isActiveTime(h, hourOfDay) ? 1.3 : 0.7;
      score += intensity * timeBonus * 4;
    }
    return Math.min(100, Math.round(score));
  }

  function isActiveTime(hatch, hour) {
    const windows = {
      morning:   [5, 11],
      midday:    [9, 14],
      afternoon: [12, 19],
      evening:   [16, 22],
      all:       [0, 24],
    };
    const [start, end] = windows[hatch.timeOfDay] || [0, 24];
    return hour >= start && hour <= end;
  }

  // ── Intensidad → label ────────────────────────────────────
  function intensityLabel(val) {
    if (val >= 5) return 'Peak';
    if (val >= 4) return 'Heavy';
    if (val >= 3) return 'Moderate';
    if (val >= 2) return 'Light';
    if (val >= 1) return 'Sparse';
    return 'None';
  }

  function intensityColor(val) {
    if (val >= 5) return '#4db84d';
    if (val >= 4) return '#8bc84b';
    if (val >= 3) return '#e8b84b';
    if (val >= 2) return '#e8884b';
    if (val >= 1) return '#888';
    return '#333';
  }

  // ── Render principal ──────────────────────────────────────
  function render(waterTempC, month, selectedType) {
    const container = document.getElementById('hatchContent');
    if (!container) return;

    const now = new Date();
    const currentMonth = month || (now.getMonth() + 1);

    // Header del mes
    const monthHtml = renderMonthSelector(currentMonth);

    // Filtro por tipo
    const filterHtml = renderTypeFilter(selectedType);

    // Hatches del mes actual
    let hatches = getActiveHatches(currentMonth);
    if (selectedType && selectedType !== 'all') {
      hatches = hatches.filter(h => h.type === selectedType);
    }

    // Timeline anual
    const timelineHtml = renderTimeline(currentMonth, selectedType);

    // Cards de hatches
    const cardsHtml = hatches.length
      ? hatches.map(h => renderHatchCard(h, currentMonth, waterTempC)).join('')
      : `<div class="hatch-empty">No hatches recorded for ${MONTHS_FULL[currentMonth-1]}.<br>Try checking adjacent months.</div>`;

    container.innerHTML = `
      ${monthHtml}
      ${filterHtml}
      ${timelineHtml}
      <div class="hatch-cards">${cardsHtml}</div>
    `;

    // Event listeners para los botones del mes
    container.querySelectorAll('.month-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = parseInt(btn.dataset.month);
        HatchCalendar._state.month = m;
        render(HatchCalendar._state.waterTemp, m, HatchCalendar._state.type);
      });
    });

    // Filtro tipo
    container.querySelectorAll('.type-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.type;
        HatchCalendar._state.type = t;
        container.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render(HatchCalendar._state.waterTemp, HatchCalendar._state.month, t);
      });
    });

    // Toggle detail
    container.querySelectorAll('.hatch-card').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('expanded'));
    });
  }

  function renderMonthSelector(currentMonth) {
    const pills = MONTHS.map((m, i) => {
      const monthNum = i + 1;
      const hasHatches = HATCHES.some(h => h.months.includes(monthNum) && (h.intensity[monthNum] || 0) >= 3);
      const isActive = monthNum === currentMonth;
      return `<button class="month-btn ${isActive ? 'active' : ''}" data-month="${monthNum}">
        ${m}${hasHatches ? '<span class="month-dot"></span>' : ''}
      </button>`;
    }).join('');

    return `
      <div class="hatch-month-header">
        <div class="hatch-month-title">${MONTHS_FULL[currentMonth-1]}</div>
        <div class="hatch-month-subtitle">Provo River Hatches</div>
      </div>
      <div class="month-selector">${pills}</div>
    `;
  }

  function renderTypeFilter(selectedType) {
    const types = [
      { key: 'all', label: 'All', icon: '🎣' },
      ...Object.entries(TYPE_META).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon })),
    ];
    return `
      <div class="type-filter">
        ${types.map(t => `
          <button class="type-filter-btn ${(selectedType || 'all') === t.key ? 'active' : ''}" data-type="${t.key}">
            <span>${t.icon}</span>
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderTimeline(currentMonth, selectedType) {
    let hatches = HATCHES;
    if (selectedType && selectedType !== 'all') {
      hatches = hatches.filter(h => h.type === selectedType);
    }

    const rows = hatches.map(h => {
      const cells = MONTHS.map((_, i) => {
        const m = i + 1;
        const intensity = h.intensity[m] || 0;
        const isCurrent = m === currentMonth;
        const bg = intensity > 0 ? intensityColor(intensity) : 'transparent';
        const opacity = intensity > 0 ? 0.2 + (intensity / 5) * 0.8 : 0.06;
        return `<div class="tl-cell ${isCurrent ? 'tl-current' : ''}"
          style="background:${intensity > 0 ? bg : 'rgba(255,255,255,0.04)'};opacity:${intensity > 0 ? 1 : 0.5}"
          title="${MONTHS_FULL[i]}: ${intensityLabel(intensity)}">
          ${intensity >= 4 ? '<span class="tl-peak"></span>' : ''}
        </div>`;
      }).join('');

      return `
        <div class="tl-row">
          <div class="tl-name">${h.emoji} ${h.name.split(' ').slice(0,2).join(' ')}</div>
          <div class="tl-cells">${cells}</div>
        </div>`;
    }).join('');

    const headers = MONTHS.map((m, i) => {
      const isCurrent = (i + 1) === currentMonth;
      return `<div class="tl-header-cell ${isCurrent ? 'tl-current' : ''}">${m[0]}</div>`;
    }).join('');

    return `
      <div class="hatch-timeline">
        <div class="tl-row tl-header-row">
          <div class="tl-name"></div>
          <div class="tl-cells">${headers}</div>
        </div>
        ${rows}
      </div>
    `;
  }

  function renderHatchCard(hatch, month, waterTempC) {
    const intensity = hatch.intensity[month] || 0;
    const meta = TYPE_META[hatch.type];
    const iLabel = intensityLabel(intensity);
    const iColor = intensityColor(intensity);
    const isInTempRange = waterTempC !== null
      ? (waterTempC >= hatch.waterTempMin && waterTempC <= hatch.waterTempMax)
      : true;

    const patternsHtml = hatch.patterns.map(p => `
      <div class="pattern-pill pattern-${p.type}">
        <span class="pattern-type">${p.type}</span>
        <span class="pattern-name">${p.name}</span>
        <span class="pattern-hook">${p.hook}</span>
      </div>
    `).join('');

    const zoneHtml = hatch.zone.map(z =>
      `<span class="zone-tag zone-tag-${z}">${z.charAt(0).toUpperCase()+z.slice(1)}</span>`
    ).join('');

    const tempIndicator = waterTempC !== null
      ? `<span class="temp-indicator ${isInTempRange ? 'temp-ok' : 'temp-no'}">
           ${isInTempRange ? '✓ In range' : '✗ Temp off'} (${waterTempC.toFixed(1)}°C)
         </span>`
      : '';

    return `
      <div class="hatch-card" style="border-color:${meta.color}20">
        <div class="hatch-card-header">
          <div class="hatch-emoji-wrap" style="background:${meta.bgColor}">${hatch.emoji}</div>
          <div class="hatch-card-info">
            <div class="hatch-card-name">${hatch.name}</div>
            <div class="hatch-card-latin">${hatch.latin}</div>
            <div class="hatch-card-meta">
              <span class="intensity-badge" style="color:${iColor};background:${iColor}18">${iLabel}</span>
              <span class="type-badge" style="color:${meta.color};background:${meta.bgColor}">${meta.icon} ${meta.label}</span>
              ${tempIndicator}
            </div>
          </div>
          <div class="hatch-intensity-bars">
            ${[1,2,3,4,5].map(i => `<div class="i-bar ${i <= intensity ? 'i-bar-active' : ''}" style="${i <= intensity ? `background:${iColor}` : ''}"></div>`).join('')}
          </div>
        </div>

        <div class="hatch-card-body">
          <div class="hatch-quick-info">
            <div class="hq-item">
              <span class="hq-label">Time</span>
              <span class="hq-value">🕐 ${hatch.timeLabel}</span>
            </div>
            <div class="hq-item">
              <span class="hq-label">Hook size</span>
              <span class="hq-value">🪝 ${hatch.sizeLabel}</span>
            </div>
            <div class="hq-item">
              <span class="hq-label">Water temp</span>
              <span class="hq-value">🌡 ${hatch.waterTempMin}–${hatch.waterTempMax}°C</span>
            </div>
            <div class="hq-item">
              <span class="hq-label">Zone</span>
              <span class="hq-value">${zoneHtml}</span>
            </div>
          </div>

          <div class="hatch-patterns">
            <div class="patterns-title">Recommended Patterns</div>
            <div class="patterns-list">${patternsHtml}</div>
          </div>

          <div class="hatch-notes">
            <div class="notes-icon">💡</div>
            <div class="notes-text">${hatch.notes}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Estado interno
  const _state = { month: new Date().getMonth() + 1, type: 'all', waterTemp: null };

  function init(waterTempC) {
    _state.waterTemp = waterTempC;
    _state.month = new Date().getMonth() + 1;
    render(waterTempC, _state.month, _state.type);
  }

  function updateWaterTemp(tempC) {
    _state.waterTemp = tempC;
  }

  return {
    HATCHES, TYPE_META, MONTHS, MONTHS_FULL,
    getActiveHatches, getTodayHatches, getHatchScore,
    intensityLabel, intensityColor, isActiveTime,
    render, init, updateWaterTemp,
    _state,
  };
})();
