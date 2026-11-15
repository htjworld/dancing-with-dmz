// 지도: 어두운 배경 위에 군사분계선과 다섯 지역의 핀을 올린다.
import { state, set, subscribe, data, pass } from './state.js';
import { STOPS, centerOf, label } from './stops.js';
import { zoneName } from './i18n.js';
import { missionReady } from './missions.js';
import { compositeUrl } from './views/composite.js';

// 영상 네 귀퉁이를 감싸는 경위도 범위
const boundsOf = corners => [[Math.min(...corners.map(c => c[0])), Math.min(...corners.map(c => c[1]))],
  [Math.max(...corners.map(c => c[0])), Math.max(...corners.map(c => c[1]))]];

const BASE = 'https://tiles.openfreemap.org/styles/dark';
const EMPTY = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#07100e' } }] };
export const VIEW = [[126.45, 37.6], [128.5, 38.75]];
// 주 구역은 금색, 숲 기준은 초록, 비교 구역은 하늘색
const ZONE_COLOR = ['match', ['get', 'role'], 'main', '#ffe1a2', 'ref', '#8ff7b9', '#9fd0ff'];

// 지금 고른 지역·날짜·편파의 레이더 영상. 자료가 없는 통과나 그 편파가 없는 지역이면 null
// 영상의 네 모서리를 이은 테두리(닫힌 선)
const frameOf = c => ({ type: 'FeatureCollection', features: c ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [...c, c[0]] } }] : [] });

function radarOf(s) {
  if (s.screen !== 'mission') return null;   // 오프닝과 밤사진에서는 날짜별 레이더 영상을 걷는다
  // 미션을 푸는 동안에만 켠다: 소개 카드를 넘기기 전, 미션을 푼 뒤(결과 카드, 조각을 받은 뒤)에는 걷고 선만 보인다
  if (!s.introSeen.includes(s.stop) || missionReady(s.stop, s.seen[s.stop])) return null;
  const L = data.layers.regions[s.stop], p = pass(s.cycle);
  if (!L || !p || p.rest || !L.dates.includes(p.date)) return null;
  const pol = L.pols.includes(s.pol) ? s.pol : 'hh';
  // 철원은 첫 날짜와 고른 날짜를 색으로 겹친 그림을 쓴다. 아직 만들어지지 않았으면 그날의 흑백 영상을 먼저 보여 준다
  const mix = s.stop === 'cheorwon' ? compositeUrl('cheorwon', L.dates[0], p.date) : null;
  return { url: mix || `data/layers/${s.stop}/${p.date}_${pol}.webp`, coordinates: L.corners };
}
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export function initMap() {
  const nobase = new URLSearchParams(location.search).has('nobase');
  // 오른쪽 미션 창과 아래 타임라인에 가리지 않게 여백을 둔다(좁은 화면에서는 줄인다)
  const padding = () => ({ top: 70, bottom: innerWidth > 900 ? 130 : Math.round(innerHeight * 0.5) + 120, left: 30, right: innerWidth > 1180 ? 468 : innerWidth > 900 ? 380 : 30 });   // 좁은 화면에서는 아래 절반을 미션 창이 덮는다(hdk)
  // 영상 모드에서는 설명 창이 없으니 가운데에 두고 아래 자막 자리만 비운다
  const nightPadding = () => (state.nightMode === 'film' || state.screen === 'opening' ? { top: 70, bottom: 190, left: 40, right: 40 }
    : innerWidth > 900 ? { top: 60, bottom: 50, left: 420, right: state.evidenceAt ? 390 : 40 } : { top: 60, bottom: 300, left: 16, right: 16 });
  const places = data.glow?.regions || {};
  const glow = data.corridor?.regions || places;
  // (hdk) 빛 지도 그림 주소: 밤하늘 둘러보기가 남색 위 금빛으로 다시 칠한 그림이 있으면 그것을 쓴다(screens/nightglow.js)
  const glowUrl = f => window.__glowUrl?.(f) ?? `data/${f}`;
  let nightAt = data.corridor ? 'all' : 'cheorwon';   // 연속 관측 띠가 있으면 전체 범위부터 보여 준다
  const nightView = (duration = 900) => map.fitBounds(nightAt === 'all' || !places[nightAt]
    ? (state.nightMode === 'explore' ? data.corridor?.bounds || VIEW : VIEW)
    : boundsOf(places[nightAt].corners), { padding: nightPadding(), duration });
  const map = new maplibregl.Map({ container: 'map', style: nobase ? EMPTY : BASE, bounds: VIEW,
    fitBoundsOptions: { padding: padding() }, attributionControl: false, maxZoom: 14 });
  // 지도가 움직이는 동안에는 반투명 창의 흐림 효과를 잠깐 끈다(움직이는 지도 위의 흐림은 프레임마다 다시 계산되어 느려진다)
  let still = 0;
  map.on('movestart', () => { clearTimeout(still); document.body.classList.add('map-moving'); });
  map.on('moveend', () => { clearTimeout(still); still = setTimeout(() => document.body.classList.remove('map-moving'), 120); });
  // 지도 틀의 크기가 바뀌면 지도도 다시 맞춘다. 창 크기 이벤트 없이 틀만 커지는 때가 있다(가려진 채로 열렸다가 나중에 보이는 화면 등).
  // 그때 지도가 처음 크기(400×300)에 머물러 화면 한쪽에만 그려지던 것을 막는다
  const fit = () => { const c = map.getCanvas(), h = map.getContainer(); if (Math.abs(c.clientWidth - h.clientWidth) > 1 || Math.abs(c.clientHeight - h.clientHeight) > 1) map.resize(); };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(map.getContainer());
  map.on('load', fit); document.addEventListener('visibilitychange', fit); addEventListener('pageshow', fit);
  window.__dmzMap = map;   // (hdk, 밤하늘 영상) 물결 선 캔버스가 지도 좌표를 화면 좌표로 바꿀 때 쓴다. jmj 확인 요청은 plan.md 5절
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  // 사용자가 지도를 직접 움직이기 전까지는 창 크기가 바뀌면 전체가 보이게 다시 맞춘다
  const HANDLERS = ['scrollZoom', 'boxZoom', 'dragRotate', 'dragPan', 'keyboard', 'doubleClickZoom', 'touchZoomRotate', 'touchPitch'];
  const lock = on => { for (const h of HANDLERS) map[h]?.[on ? 'disable' : 'enable'](); };
  lock(state.screen === 'mission');
  // 다른 화면의 코드(밤하늘의 땅 연주)가 끌기를 다시 켤 수 있으므로, 상태가 바뀔 때마다 맨 마지막에 한 번 더 잠근다
  subscribe(s => { if (s.screen === 'mission') queueMicrotask(() => { if (state.screen === 'mission') lock(true); }); });
  let touched = false;
  for (const ev of ['dragstart', 'wheel', 'touchstart']) map.on(ev, () => { touched = true; });
  map.on('resize', () => { if (state.screen !== 'mission') nightView(0); else if (state.playing?.mode === 'finale') map.fitBounds(VIEW, { padding: { top: 90, bottom: 230, left: 30, right: 30 }, duration: 0 });   // 엔딩 중에는 선 전체가 보이는 화면을 지킨다
    else { const b = STOPS.find(x => x.id === state.stop).bounds; map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: padding(), duration: 0 }); } });   // 창 크기가 바뀌어도 그 지역이 화면에 맞게 들어온다

  // 배경 지도를 못 받아도 선과 핀은 보이게 한다
  let ready = false;
  const fallback = setTimeout(() => { if (!ready) map.setStyle(EMPTY); }, 6000);
  map.on('error', e => { if (!ready && e?.error?.status !== undefined) map.setStyle(EMPTY); });

  map.on('style.load', () => {
    if (map.getSource('dmz')) return;
    // 레이더 영상은 군사분계선과 구역보다 아래에 둔다
    const r0 = radarOf(state);
    map.addSource('radar', { type: 'image', url: r0?.url || BLANK, coordinates: (r0 || { coordinates: data.layers.regions[state.stop].corners }).coordinates });
    map.addLayer({ id: 'radar', type: 'raster', source: 'radar', layout: { visibility: r0 ? 'visible' : 'none' }, paint: { 'raster-opacity': .92, 'raster-fade-duration': 0 } });
    map.addSource('radar-frame', { type: 'geojson', data: frameOf(r0?.coordinates) });
    map.addLayer({ id: 'radar-frame-glow', type: 'line', source: 'radar-frame', layout: { visibility: r0 ? 'visible' : 'none', 'line-join': 'round' }, paint: { 'line-color': '#a9cdf5', 'line-width': 12, 'line-blur': 10, 'line-opacity': .32 } });
    map.addLayer({ id: 'radar-frame-line', type: 'line', source: 'radar-frame', layout: { visibility: r0 ? 'visible' : 'none', 'line-join': 'round' }, paint: { 'line-color': '#eaf3ff', 'line-width': 1.1, 'line-opacity': .7 } });
    for (const [id, g] of Object.entries(glow)) {
      map.addSource(`glow-${id}`, { type: 'image', url: glowUrl(g.color), coordinates: g.corners });
      map.addLayer({ id: `glow-${id}`, type: 'raster', source: `glow-${id}`, layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0 } });
    }
    map.addSource('river', { type: 'geojson', data: { type: 'MultiPoint', coordinates: data.river.points } });
    map.addLayer({ id: 'river-hint', type: 'circle', source: 'river', layout: { visibility: 'none' }, paint: { 'circle-radius': 2.2, 'circle-color': '#7fe9ff', 'circle-opacity': .55 } });
    map.addSource('dmz', { type: 'geojson', data: data.boundary });
    map.addLayer({ id: 'dmz-glow', type: 'line', source: 'dmz', paint: { 'line-color': '#9fc4ee', 'line-width': 6, 'line-blur': 6, 'line-opacity': .18 } });
    map.addLayer({ id: 'dmz-line', type: 'line', source: 'dmz', paint: { 'line-color': '#d5e2f2', 'line-width': 1.2, 'line-opacity': .75, 'line-dasharray': [1, 2.4] } });
    // 두 바깥 선은 관측 범위이며 실제 DMZ 경계가 아니다. 가운데 군사분계선과 구별한다.
    if (data.corridor?.edges) {
      map.addSource('corridor-edges', { type: 'geojson', data: data.corridor.edges });
      map.addLayer({ id: 'corridor-edges', type: 'line', source: 'corridor-edges', layout: { visibility: 'none' },
        paint: { 'line-color': '#d7c9ef', 'line-width': 1.2, 'line-opacity': .8, 'line-dasharray': [5, 4] } });
    }
    // 밤사진의 분계선: 빛나는 들판 사이에서 또렷이 보이는 흰 실선
    map.addLayer({ id: 'dmz-white', type: 'line', source: 'dmz', layout: { visibility: 'none' }, paint: { 'line-color': '#ffffff', 'line-width': 1.4, 'line-opacity': .95 } });
    // 구역 사각형: 지금 고른 지역의 것만 보인다
    map.addSource('zones', { type: 'geojson', data: { type: 'FeatureCollection', features: data.zones.map(z => ({ type: 'Feature',
      properties: { id: z.id, region: z.region, name: z.name, role: z.role }, geometry: { type: 'Polygon', coordinates: [z.polygon] } })) } });
    const only = ['==', ['get', 'region'], state.stop];
    map.addLayer({ id: 'zone-fill', type: 'fill', source: 'zones', filter: only, paint: { 'fill-color': ZONE_COLOR, 'fill-opacity': .14 } });
    map.addLayer({ id: 'zone-line', type: 'line', source: 'zones', filter: only, paint: { 'line-color': ZONE_COLOR, 'line-width': 1.6 } });
    ready = true; clearTimeout(fallback);
    screen(state);
    if (state.screen !== 'mission') nightView(0);
    set({ mapReady: true });
  });

  // 화면에 따라 지도 레이어를 갈아 낀다. 밤사진: 변동 지도와 흰 분계선만. 미션: 날짜별 레이더, 구역, 초록 분계선
  const screen = s => {
    if (!map.getLayer('dmz-white')) return;
    const night = s.screen !== 'mission', vis = on => (on ? 'visible' : 'none');   // 오프닝 뒤에도 밤사진이 깔려 있다
    for (const id of Object.keys(glow)) map.setLayoutProperty(`glow-${id}`, 'visibility', vis(night));
    map.setLayoutProperty('dmz-white', 'visibility', vis(night));
    for (const id of ['dmz-glow', 'dmz-line']) map.setLayoutProperty(id, 'visibility', vis(!night));
    for (const id of ['zone-fill', 'zone-line']) map.setLayoutProperty(id, 'visibility', 'none');   // 구역 사각형은 레이더 영상이 켜져 있을 때만
    if (map.getLayer('corridor-edges')) map.setLayoutProperty('corridor-edges', 'visibility', vis(night && s.nightMode === 'explore'));
  };
  subscribe((s, prev) => {
    if ((s.screen === 'mission') === (prev.screen === 'mission')) return;
    lock(s.screen === 'mission');
    screen(s);
    if (s.screen === 'mission') focus(s.stop); else nightView();
  });
  // 밤사진 재생: 프레임 번호가 바뀌면 다섯 지역의 영상을 그 시점까지 쌓인 것으로 갈아 낀다
  let shownFrame = null;
  subscribe(s => {
    if (s.nightFrame === shownFrame || !map.getLayer('dmz-white')) return;
    shownFrame = s.nightFrame;
    for (const [id, g] of Object.entries(glow)) {
      const file = shownFrame == null ? g.color : g.frames[Math.min(shownFrame, g.frames.length - 1)];
      if (file) map.getSource(`glow-${id}`).updateImage({ url: glowUrl(file), coordinates: g.corners });
    }
  });
  // 밤사진 설명 창에서 지역을 고르면 그 지역의 변동 지도로 간다
  document.addEventListener('dmz-night-go', e => { nightAt = e.detail.id; nightView(e.detail.duration ?? 900); });
  // 밤하늘 영상: '이 흰 선은 움직이지 않습니다'에서 분계선이 굵어졌다 돌아오며 눈길을 끈다(움직이지는 않는다)
  let pulse = 0;
  document.addEventListener('dmz-line-pulse', () => {
    if (!map.getLayer('dmz-white')) return;
    const t0 = performance.now(); clearInterval(pulse);
    pulse = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / 4200), w = 1.4 + 3.2 * Math.sin(k * Math.PI) ** 2 * (1 - k * .4);
      map.setPaintProperty('dmz-white', 'line-width', k >= 1 ? 1.4 : w);
      if (k >= 1) clearInterval(pulse);
    }, 40);
  });
  // 밤하늘 영상: 빛이 서서히 스며들게 한다(0~1)
  document.addEventListener('dmz-glow-opacity', e => { for (const id of Object.keys(glow)) if (map.getLayer(`glow-${id}`)) map.setPaintProperty(`glow-${id}`, 'raster-opacity', e.detail.value); });
  subscribe((s, prev) => { if (s.nightMode !== prev.nightMode && s.screen === 'night') { screen(s); nightView(); } });
  subscribe((s, prev) => { if (s.evidenceAt !== prev.evidenceAt && s.screen === 'night' && !s.evidenceAt) nightView(); });
  let pieceBack = 0;
  const focus = id => { const b = STOPS.find(x => x.id === id).bounds; touched = true;
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: padding(), duration: 900 }); };
  const pins = STOPS.map((s, i) => {
    const el = document.createElement('button');
    el.className = 'pin'; el.type = 'button'; el.dataset.stop = s.id;
    const name = () => { el.setAttribute('aria-label', `${i + 1} ${label(s, 'name')}`); el.innerHTML = `${i + 1}<span class="pin-label">${label(s, 'name')}</span><span class="pin-nav prev" data-nav="-1" aria-hidden="true">‹</span><span class="pin-nav next" data-nav="1" aria-hidden="true">›</span>`; };
    name(); subscribe((st, prev) => { if (st.lang !== prev.lang) name(); });
    el.addEventListener('click', e => {
      e.stopPropagation();
      // 지금 지역의 구슬 양옆 화살표: 이전 지역, 다음 지역으로 옮긴다(다음은 여기까지의 조각을 다 모았을 때만)
      const nav = e.target.closest?.('[data-nav]');
      if (nav) { const to = STOPS[i + +nav.dataset.nav]; if (to && (nav.dataset.nav === '-1' || el.dataset.next === '1')) set({ stop: to.id, note: null, peek: null }); return; }
      if (state.stop === s.id) focus(s.id); else set({ stop: s.id });
    });   // 지금 지역의 핀을 다시 누르면 그 지역으로 확대
    new maplibregl.Marker({ element: el }).setLngLat(centerOf(s)).addTo(map);
    return el;
  });
  const paint = () => pins.forEach(el => {
    el.classList.toggle('current', el.dataset.stop === state.stop);
    const on = state.fragments.includes(el.dataset.stop) && state.landing !== el.dataset.stop;   // 날아오는 조각이 꽂혀야 불이 켜진다(main.js pieceFly)
    if (on && !el.classList.contains('done') && state.screen === 'mission') { el.classList.remove('lit'); void el.offsetWidth; el.classList.add('lit'); }
    el.classList.toggle('done', on);
    const i = STOPS.findIndex(x => x.id === el.dataset.stop);
    el.dataset.prev = i > 0 ? '1' : '0';
    el.dataset.next = i < STOPS.length - 1 && STOPS.slice(0, i + 1).every(x => state.fragments.includes(x.id)) ? '1' : '0';
  });
  subscribe(paint); paint();
  // 구역 이름표: 배경 지도의 글꼴에 기대지 않게 HTML 로 붙인다. 고른 지역의 것만, 충분히 확대했을 때만 보인다
  const tags = data.zones.map(z => {
    const el = document.createElement('div');
    el.className = `zone-tag ${z.role}`; el.textContent = zoneName(z); el.dataset.region = z.region;
    subscribe((st, prev) => { if (st.lang !== prev.lang) el.textContent = zoneName(z); });
    new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([(z.bounds[0] + z.bounds[2]) / 2, z.bounds[3]]).addTo(map);
    return el;
  });
  const showTags = () => tags.forEach(el => { el.hidden = el.dataset.region !== state.stop || map.getZoom() < 9.5; });
  map.on('zoom', showTags); subscribe(showTags); showTags();
  // 레이더 영상: 지역·날짜·편파가 바뀌면 갈아 끼운다
  let shownRadar = null;
  const radar = s => {
    if (!map.getSource('radar')) return;
    const r = s.playing?.mode === 'finale' ? null : radarOf(s), k = r?.url || '';   // 피날레에서는 영상을 걷고 선만 본다
    if (k !== shownRadar) {
      shownRadar = k; if (r) map.getSource('radar').updateImage(r); map.setLayoutProperty('radar', 'visibility', r ? 'visible' : 'none');
      if (r) map.getSource('radar-frame').setData(frameOf(r.coordinates));
      for (const id of ['radar-frame-glow', 'radar-frame-line']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', r ? 'visible' : 'none');
      for (const id of ['zone-fill', 'zone-line']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');   // 철원은 이름을 가린 두 땅만 따로 그린다(gamemap.js)   // 영상이 없으면 구역 사각형도 걷는다
    }
    map.setLayoutProperty('river-hint', 'visibility', s.stop === 'yeoncheon' && s.riverHint ? 'visible' : 'none');
  };
  subscribe(radar);
  // 테두리의 빛은 움직이지 않는다. 값을 계속 바꾸면 지도가 쉬지 않고 다시 그려지고, 그 위의 반투명 창도 매 프레임 흐림을 다시 계산해 느려진다
  // 연천: 강 위에서 고른 곳의 표식
  let picks = [];
  subscribe(s => {
    if (s.riverPicks.length === picks.length) return;
    picks.forEach(m => m.remove());
    picks = s.riverPicks.map((p, i) => { const el = document.createElement('div'); el.className = 'river-mark'; el.textContent = i + 1;
      return new maplibregl.Marker({ element: el }).setLngLat(p).addTo(map); });
  });
  // 지역을 바꾸면 그 지역의 창으로 날아가고 구역을 바꿔 보여 준다
  subscribe((s, prev) => {
    // 조각을 받는 순간: 서쪽 끝에서 이 지역까지 이어진 선이 한눈에 보이게 물러났다가, 잠시 뒤 돌아온다.
    // 조각을 받아도 지역은 그대로이므로 아래의 '지역이 그대로면 돌아간다'보다 먼저 본다. 날아온 조각이 꽂히는 자리는 main.js(pieceFly)
    if (s.screen === 'mission' && s.fragments.length > prev.fragments.length) {
      const id = s.fragments[s.fragments.length - 1], a = STOPS[0].bounds, b = STOPS.find(x => x.id === id).bounds;
      map.fitBounds([[a[0] - .1, Math.min(a[1], b[1]) - .06], [b[2] + .1, Math.max(a[3], b[3]) + .06]], { padding: padding(), duration: 1100 });
      clearTimeout(pieceBack);
      pieceBack = setTimeout(() => { if (state.screen === 'mission' && state.stop === id && state.playing?.mode !== 'finale') focus(id); }, 6000);
    }
    if (s.stop === prev.stop && s.mapReady === prev.mapReady) return;
    for (const id of ['zone-fill', 'zone-line']) if (map.getLayer(id)) map.setFilter(id, ['==', ['get', 'region'], s.stop]);
    if (s.stop !== prev.stop) { clearTimeout(pieceBack); focus(s.stop); }
  });

  map.on('click', e => document.dispatchEvent(new CustomEvent('dmz-map-click', { detail: { lng: e.lngLat.lng, lat: e.lngLat.lat } })));
  return map;
}
