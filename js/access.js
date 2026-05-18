// ============================================================
// ACCESS POINTS — Provo River, Utah
// Coordenadas GPS verificadas, datos reales de campo
// Fuentes: UDWR, Utah Mitigation Commission, AllTrails, norrik.com
// ============================================================

const AccessPoints = (() => {

  // ── BASE DE DATOS DE ACCESOS ──────────────────────────────
  const POINTS = [

    // ══ UPPER PROVO ═══════════════════════════════════════════

    {
      id: 'rock_cliff',
      name: 'Rock Cliff Recreation Area',
      zone: 'upper',
      lat: 40.6142, lon: -111.3928,
      parking: 'paved',
      parkingSpots: 40,
      fee: '$5 day use',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure',
      fishType: ['Brown Trout', 'Rainbow Trout', 'Cutthroat'],
      description: 'Jordanelle State Park — Rock Cliff area. Paved lot, restrooms, picnic tables. River enters the reservoir here. Good early-season fishing.',
      directions: 'Take SR-32 north from Heber City. Follow signs to Jordanelle State Park, Rock Cliff section.',
      tips: 'Walk upstream from the parking area for better water. Avoid summer crowds by arriving early.',
      icon: '🅿️',
    },

    {
      id: 'upper_sr35_woodland',
      name: 'SR-35 / Woodland Pullouts',
      zone: 'upper',
      lat: 40.6520, lon: -111.3355,
      parking: 'gravel',
      parkingSpots: 8,
      fee: 'Free',
      restrooms: false,
      wadingAccess: true,
      difficulty: 'moderate',
      regulation: 'fly-lure',
      fishType: ['Brown Trout', 'Cutthroat Trout', 'Brook Trout'],
      description: 'Multiple pullouts along SR-35 between Woodland and Francis. National Forest land — public access. Pocket water with good dry fly action.',
      directions: 'From Francis, take SR-35 east toward Woodland. Multiple gravel pullouts along the highway.',
      tips: 'Walk away from pullouts for solitude. Best in fall when summer traffic drops.',
      icon: '🛣️',
    },

    {
      id: 'mirror_lake_hwy',
      name: 'Mirror Lake Hwy (UT-150) Access',
      zone: 'upper',
      lat: 40.6872, lon: -111.2715,
      parking: 'gravel',
      parkingSpots: 15,
      fee: 'Free',
      restrooms: false,
      wadingAccess: true,
      difficulty: 'moderate',
      regulation: 'standard',
      fishType: ['Cutthroat Trout', 'Brook Trout'],
      description: 'Upper Upper Provo near Kamas. National Forest land. Wild cutthroat and brook trout in beautiful mountain setting. Less pressure than lower sections.',
      directions: 'From Kamas, take UT-150 (Mirror Lake Highway) east. Multiple pullouts along the highway near the river.',
      tips: 'Best July–September when accessible. Smaller fish but wild and beautiful country.',
      icon: '⛰️',
    },

    // ══ MIDDLE PROVO ══════════════════════════════════════════
    // 7 accesos oficiales construidos por Utah Mitigation Commission

    {
      id: 'lunker_lane',
      name: 'Lunker Lane (Below Jordanelle Dam)',
      zone: 'middle',
      lat: 40.5992, lon: -111.4215,
      parking: 'paved',
      parkingSpots: 30,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Highest fish density on the entire river — up to 4,000 fish/mile. Just below Jordanelle Dam tailwater. Expect company but outstanding fishing.',
      directions: 'From US-40/189 junction near Heber, turn north on SR-189 toward Jordanelle. Follow signs to dam. Parking lot at base of dam.',
      tips: 'Most pressured stretch on the river. Fish in the early morning or weekdays. Walk upstream or downstream from the lot for fewer anglers.',
      icon: '⭐',
      popular: true,
    },

    {
      id: 'rickety_bridge',
      name: 'Rickety Bridge Access',
      zone: 'middle',
      lat: 40.5878, lon: -111.4332,
      parking: 'gravel',
      parkingSpots: 15,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Official UMCC access #2. Good runs and pools with slightly less pressure than Lunker Lane. Excellent for first-time visitors.',
      directions: 'Head south from Jordanelle Dam on the west side road. Small gravel road leads to parking area.',
      tips: 'Great starting point for first trips. Nymph fishing is productive year-round here.',
      icon: '🌉',
    },

    {
      id: 'legacy_bridge',
      name: 'Legacy Bridge / SR-113',
      zone: 'middle',
      lat: 40.5815, lon: -111.4378,
      parking: 'paved',
      parkingSpots: 25,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Main public access bridge on Middle Provo. Official UMCC site with restrooms. Riffle-pool structure excellent for all techniques.',
      directions: 'From Heber City, take SR-113 west. Cross the Provo River at Legacy Bridge. Parking on both sides.',
      tips: 'Park on the north side for upstream pools. South side accesses productive riffles. PMD hatch here June–August is spectacular.',
      icon: '🎣',
      popular: true,
    },

    {
      id: 'river_road_north',
      name: 'River Road North Parking',
      zone: 'middle',
      lat: 40.5752, lon: -111.4425,
      parking: 'gravel',
      parkingSpots: 20,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Official UMCC access on River Road (W 100 South). Two separate lots 0.3 miles apart. Meadow water with great sight-fishing.',
      directions: 'From Heber, head west on US-40. Turn right on W 100 South / River Road. 0.3 miles to first gravel lot. Second lot slightly further south.',
      tips: 'The meadow section here is perfect for spotting bank-feeding fish. Bring polarized glasses.',
      icon: '🌾',
    },

    {
      id: 'midway_lane',
      name: 'Midway Lane Access',
      zone: 'middle',
      lat: 40.5435, lon: -111.4655,
      parking: 'paved',
      parkingSpots: 30,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Most popular access on the Middle Provo. Official UMCC site. Classic Heber Valley meander water. Walk-and-wade through open meadows.',
      directions: 'From Midway, head south on Midway Lane. Parking lot on the right just before the river. Trail leads west to the river.',
      tips: 'Walk upstream 15+ minutes for less pressure. Trico spinner falls here in August are incredible. Evening caddis action is reliable all summer.',
      icon: '🅿️',
      popular: true,
    },

    {
      id: 'bunny_farm',
      name: 'Bunny Farm / Casperville Road',
      zone: 'middle',
      lat: 40.5182, lon: -111.4838,
      parking: 'gravel',
      parkingSpots: 12,
      fee: 'Free',
      restrooms: false,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Official UMCC access via Casperville Road. Open meadow section — excellent sight fishing for rising trout. Less visited than upper accesses.',
      directions: 'From Midway, take Casperville Road south. Look for UDWR access signs. Small gravel parking area.',
      tips: 'One of the best sight-fishing stretches on the river. Best on calm mornings when fish are visibly rising.',
      icon: '🌿',
    },

    {
      id: 'charleston_bridge',
      name: 'Charleston Bridge',
      zone: 'middle',
      lat: 40.5055, lon: -111.4932,
      parking: 'paved',
      parkingSpots: 20,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Official UMCC access at Charleston. Good wade access to productive runs and deep pools. Brown trout congregation point in fall.',
      directions: 'From Charleston, head east across the bridge. Parking lot on the south side of the river.',
      tips: 'Excellent fall destination — brown trout get aggressive in October–November. Big nymphs and streamers produce large fish.',
      icon: '🏘️',
    },

    {
      id: 'deer_creek_inlet',
      name: 'Deer Creek Inlet / Snake Creek',
      zone: 'middle',
      lat: 40.4765, lon: -111.5212,
      parking: 'gravel',
      parkingSpots: 10,
      fee: 'Free',
      restrooms: false,
      wadingAccess: true,
      difficulty: 'moderate',
      regulation: 'fly-lure-only',
      fishType: ['Brown Trout', 'Rainbow Trout'],
      description: 'Lower Middle Provo near Deer Creek Reservoir. Snake Creek confluence area. Less visited stretch with large brown trout.',
      directions: 'From Charleston, continue south on Charleston Road. Turn east on 4800 S toward Deer Creek inlet.',
      tips: 'Walk this section in both directions. Streamers and large nymphs for the big browns that stage here before spawning.',
      icon: '🐟',
    },

    // ══ LOWER PROVO (Provo Canyon) ════════════════════════════

    {
      id: 'deer_creek_dam_lower',
      name: 'Deer Creek Dam — Lower Outlet',
      zone: 'lower',
      lat: 40.4083, lon: -111.5295,
      parking: 'paved',
      parkingSpots: 20,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Rainbow Trout', 'Brown Trout'],
      description: 'Just below Deer Creek Dam. Cold, clear tailwater. Some of the largest rainbow trout in the state. Year-round fishing.',
      directions: 'Take US-189 west from Heber. Just past the dam, turn left into the small parking area below the spillway.',
      tips: 'Trophy rainbow section. Midge patterns and small nymphs dominate. 20"+ fish are common. Use 5X–6X tippet.',
      icon: '🏔️',
      popular: true,
    },

    {
      id: 'sundance_area',
      name: 'Sundance / SR-92 Area',
      zone: 'lower',
      lat: 40.3928, lon: -111.5680,
      parking: 'paved',
      parkingSpots: 30,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'moderate',
      regulation: 'fly-lure-only',
      fishType: ['Rainbow Trout', 'Brown Trout'],
      description: 'River section near Sundance Resort junction (SR-92). Beautiful canyon setting. Riffles and pools with good dry fly water.',
      directions: 'Head up US-189 from Provo. At SR-92 junction (Sundance turnoff), pull into parking areas along the highway.',
      tips: 'Fish above and below the SR-92 bridge. Morning hatches are excellent. Resort guests don\'t usually fish this far.',
      icon: '🎿',
    },

    {
      id: 'vivian_park',
      name: 'Vivian Park',
      zone: 'lower',
      lat: 40.3775, lon: -111.5195,
      parking: 'paved',
      parkingSpots: 60,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Rainbow Trout', 'Brown Trout'],
      description: 'Utah County park 5 miles up Provo Canyon. Large paved lots, restrooms, picnic areas. Direct river access. Very popular summer destination.',
      directions: 'Take US-189 east from Provo into the canyon. Turn right at mile 5.8. Follow signs to Vivian Park.',
      tips: 'Walk upstream or downstream from the park for less crowded water. Good canyon scenery. Avoid summer weekends — very busy.',
      icon: '🌲',
    },

    {
      id: 'nunns_park',
      name: "Nunn's Park",
      zone: 'lower',
      lat: 40.3655, lon: -111.5045,
      parking: 'paved',
      parkingSpots: 40,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'fly-lure-only',
      fishType: ['Rainbow Trout', 'Brown Trout'],
      description: 'Camping and day-use area 3.2 miles up the canyon. Two large lots. Good wading access upstream and downstream. Near Bridal Veil Falls.',
      directions: 'Take US-189 east from Provo into Provo Canyon. Exit right at mile 3.2. Two parking areas available.',
      tips: 'Fish away from the campground for better water. Upstream toward Bridal Veil has tight canyon water with good cover.',
      icon: '⛺',
    },

    {
      id: 'bridal_veil_area',
      name: 'Bridal Veil Falls Area',
      zone: 'lower',
      lat: 40.3720, lon: -111.5145,
      parking: 'paved',
      parkingSpots: 25,
      fee: 'Free',
      restrooms: false,
      wadingAccess: true,
      difficulty: 'moderate',
      regulation: 'fly-lure-only',
      fishType: ['Rainbow Trout', 'Brown Trout'],
      description: 'Canyon narrows near the famous falls. Deep pools below ledge rocks hold large fish. Wade with caution — slippery rocks.',
      directions: 'Take US-189 east. Small parking areas along the highway near the falls (mile 3.8). Note: lower lot closed 2025–2027 for renovation — use Nunn\'s Park.',
      tips: 'Plunge pools below the falls hold trophy fish. Best accessed on foot from Nunn\'s Park. Slippery wading — felt soles or wading staff recommended.',
      icon: '💧',
    },

    {
      id: 'canyon_glen',
      name: 'Canyon Glen Park',
      zone: 'lower',
      lat: 40.3358, lon: -111.4788,
      parking: 'paved',
      parkingSpots: 100,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'standard',
      fishType: ['Rainbow Trout', 'Brown Trout'],
      description: 'Large Utah County park 2.5 miles from canyon mouth. 100+ parking spots, restrooms, picnic areas, amphitheater. River access via bridge.',
      directions: 'Take US-189 east from Provo/Orem. Turn left into Canyon Glen Park at mile 2.5.',
      tips: 'Great family option. Fish up or downstream from the bridge. Water warms in summer — better spring and fall fishing here.',
      icon: '🏞️',
    },

    {
      id: 'canyon_view_park',
      name: 'Canyon View Park',
      zone: 'lower',
      lat: 40.3215, lon: -111.4622,
      parking: 'paved',
      parkingSpots: 30,
      fee: 'Free',
      restrooms: true,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'standard',
      fishType: ['Rainbow Trout', 'Brown Trout'],
      description: 'Near canyon mouth. Provo River Parkway access. Mix of trout water transitioning to warmer species as you move downstream.',
      directions: 'Take US-189 east from Provo. Park entrance on right just inside the canyon mouth.',
      tips: 'Good for beginners and families. Fish upstream into the canyon for better trout action. Water can be warm in summer.',
      icon: '👨‍👩‍👧',
    },

    {
      id: 'olmstead_diversion',
      name: 'Olmstead Diversion / Provo Parkway',
      zone: 'lower',
      lat: 40.3028, lon: -111.4512,
      parking: 'paved',
      parkingSpots: 20,
      fee: 'Free',
      restrooms: false,
      wadingAccess: true,
      difficulty: 'easy',
      regulation: 'standard',
      fishType: ['Rainbow Trout', 'Brown Trout', 'Carp'],
      description: 'Diversion dam creating good pools above and below. Access via Provo River Parkway trail. Regulations change at this point — no artificial-only below here.',
      directions: 'Access via Provo River Parkway trail from Canyon Road Park or Canyon Glen. About 1 mile of walking.',
      tips: 'Pool below the diversion holds surprising numbers of trout. Regulations change here — check before fishing downstream.',
      icon: '🚧',
    },
  ];

  // ── Metadata ──────────────────────────────────────────────
  const REGULATION_LABELS = {
    'fly-lure-only': { label: 'Fly & Lure Only', color: '#4db8a0', short: 'F&L' },
    'fly-lure':      { label: 'Fly & Lure',      color: '#4db8a0', short: 'F&L' },
    'standard':      { label: 'Standard',         color: '#e8b84b', short: 'STD' },
  };

  const PARKING_ICONS = {
    'paved': '🟢', 'gravel': '🟡', 'dirt': '🟠',
  };

  const DIFFICULTY_COLORS = {
    'easy': '#4db84d', 'moderate': '#e8b84b', 'hard': '#e05a5a',
  };

  // ── Getters ───────────────────────────────────────────────
  function getByZone(zone) {
    if (zone === 'all') return POINTS;
    return POINTS.filter(p => p.zone === zone);
  }

  function getById(id) {
    return POINTS.find(p => p.id === id);
  }

  // ── Render markers on map ─────────────────────────────────
  let accessMarkers = [];
  let accessVisible = false;
  let mapRef = null;

  function addToMap(map) {
    mapRef = map;
    renderMarkers(map, 'all');
  }

  function renderMarkers(map, zone) {
    // Clear existing
    accessMarkers.forEach(m => map.removeLayer(m));
    accessMarkers = [];

    if (!accessVisible) return;

    const points = getByZone(zone);

    for (const p of points) {
      const regMeta = REGULATION_LABELS[p.regulation] || REGULATION_LABELS.standard;
      const parkIcon = PARKING_ICONS[p.parking] || '🟡';
      const diffColor = DIFFICULTY_COLORS[p.difficulty] || '#e8b84b';

      // Custom div icon — parking symbol
      const iconHtml = `
        <div style="
          background:${p.popular ? '#0d1e30' : '#0a1628'};
          border:2px solid ${p.popular ? '#e8b84b' : '#4a7a70'};
          border-radius:8px;
          width:28px; height:28px;
          display:flex; align-items:center; justify-content:center;
          font-size:13px;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
        ">🅿</div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      });

      const marker = L.marker([p.lat, p.lon], { icon });

      const feeStr  = p.fee === 'Free' ? '<span style="color:#4db84d">Free</span>' : `<span style="color:#e8b84b">${p.fee}</span>`;
      const restrStr = p.restrooms ? '✅ Yes' : '❌ No';
      const popStr = p.popular ? '<span style="color:#e8b84b;font-size:0.65rem">⭐ Popular</span>' : '';

      marker.bindPopup(`
        <div class="spot-popup access-popup">
          <h4>${p.icon} ${p.name} ${popStr}</h4>
          <div class="ap-zone zone-tag-${p.zone}">${p.zone.charAt(0).toUpperCase()+p.zone.slice(1)} Provo</div>
          <div class="sp-row">Parking: ${parkIcon} ${p.parking} · ${p.parkingSpots} spots</div>
          <div class="sp-row">Fee: ${feeStr}</div>
          <div class="sp-row">Restrooms: ${restrStr}</div>
          <div class="sp-row">Regulation: <span style="color:${regMeta.color}">${regMeta.label}</span></div>
          <div class="sp-row">Fish: ${p.fishType.join(', ')}</div>
          <div class="ap-desc">${p.description}</div>
          <div class="ap-tip">💡 ${p.tips}</div>
          <div class="ap-dir">📍 ${p.directions}</div>
        </div>
      `, { maxWidth: 280 });

      marker.addTo(map);
      accessMarkers.push(marker);
    }
  }

  function toggle(map, zone) {
    accessVisible = !accessVisible;
    renderMarkers(map, zone || 'all');
    return accessVisible;
  }

  function show(map, zone) {
    accessVisible = true;
    renderMarkers(map, zone || 'all');
  }

  function hide(map) {
    accessVisible = false;
    accessMarkers.forEach(m => map.removeLayer(m));
    accessMarkers = [];
  }

  function updateZone(map, zone) {
    if (accessVisible) renderMarkers(map, zone);
  }

  // ── Render access list view (for a dedicated panel) ───────
  function renderList(zone) {
    const container = document.getElementById('accessContent');
    if (!container) return;

    const points = getByZone(zone || 'all');
    const zones = ['upper','middle','lower'];

    const grouped = zones.reduce((acc, z) => {
      acc[z] = points.filter(p => p.zone === z);
      return acc;
    }, {});

    container.innerHTML = zones.map(z => {
      if (!grouped[z].length) return '';
      const zLabel = { upper:'Upper Provo', middle:'Middle Provo', lower:'Lower Provo (Canyon)' }[z];
      const zColor = { upper:'#4db8a0', middle:'#e8b84b', lower:'#e8884b' }[z];
      return `
        <div class="access-zone-header" style="border-left:3px solid ${zColor}">
          <span style="color:${zColor}">${zLabel}</span>
          <span class="access-count">${grouped[z].length} access points</span>
        </div>
        ${grouped[z].map(p => renderAccessCard(p)).join('')}
      `;
    }).join('');

    // Bind click to fly map
    container.querySelectorAll('.access-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const point = getById(id);
        if (point) {
          // Switch to map tab and fly to location
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          const mapTab = document.querySelector('[data-tab="map"]');
          const mapContent = document.getElementById('tab-map');
          if (mapTab) mapTab.classList.add('active');
          if (mapContent) mapContent.classList.add('active');

          // Trigger map init if needed and fly to point
          setTimeout(() => {
            if (window._provoMap) {
              window._provoMap.flyTo([point.lat, point.lon], 15, { duration: 1.5 });
              AccessPoints.show(window._provoMap, 'all');
            }
          }, 200);
        }
      });
    });
  }

  function renderAccessCard(p) {
    const reg = REGULATION_LABELS[p.regulation] || REGULATION_LABELS.standard;
    const parkIcon = PARKING_ICONS[p.parking] || '🟡';
    const diffColor = DIFFICULTY_COLORS[p.difficulty] || '#e8b84b';
    return `
      <div class="access-card ${p.popular ? 'access-popular' : ''}" data-id="${p.id}">
        <div class="access-card-header">
          <span class="access-icon">${p.icon}</span>
          <div class="access-info">
            <div class="access-name">${p.name}${p.popular ? ' <span class="popular-star">⭐</span>':''}</div>
            <div class="access-meta-row">
              <span class="access-chip" style="color:${reg.color};background:${reg.color}18">${reg.short}</span>
              <span class="access-chip">${parkIcon} ${p.parkingSpots} spots</span>
              <span class="access-chip" style="color:${p.fee==='Free'?'#4db84d':'#e8b84b'}">${p.fee}</span>
              ${p.restrooms ? '<span class="access-chip">🚻</span>' : ''}
            </div>
          </div>
          <span class="access-arrow">›</span>
        </div>
        <div class="access-desc">${p.description}</div>
        <div class="access-fish">🐟 ${p.fishType.join(' · ')}</div>
      </div>
    `;
  }

  return {
    POINTS,
    REGULATION_LABELS,
    getByZone,
    getById,
    addToMap,
    toggle,
    show,
    hide,
    updateZone,
    renderList,
    get isVisible() { return accessVisible; },
  };
})();
