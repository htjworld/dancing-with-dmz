// 지도: 어두운 배경 위에 군사분계선과 다섯 지역의 핀을 올린다.
import { state, set, subscribe, data, pass } from './state.js';
import { STOPS, centerOf, label } from './stops.js';

// 영상 네 귀퉁이를 감싸는 경위도 범위
const boundsOf = corners => [[Math.min(...corners.map(c => c[0])), Math.min(...corners.map(c => c[1]))],
  [Math.max(...corners.map(c => c[0])), Math.max(...corners.map(c => c[1]))]];

const BASE = 'https://tiles.openfreemap.org/styles/dark';
const EMPTY = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#07100e' } }] };
export const VIEW = [[126.45, 37.6], [128.5, 38.75]];
// 주 구역은 금색, 숲 기준은 초록, 비교 구역은 하늘색
const ZONE_COLOR = ['match', ['get', 'role'], 'main', '#ffe1a2', 'ref', '#8ff7b9', '#9fd0ff'];

// 지금 고른 지역·날짜·편파의 레이더 영상. 자료가 없는 통과나 그 편파가 없는 지역이면 null
function radarOf(s) {
  if (s.screen !== 'mission') return null;   // 오프닝과 밤사진에서는 날짜별 레이더 영상을 걷는다
  const L = data.layers.regions[s.stop], p = pass(s.cycle);
  if (!L || !p || p.rest || !L.dates.includes(p.date)) return null;
  const pol = L.pols.includes(s.pol) ? s.pol : 'hh';
  return { url: `data/layers/${s.stop}/${p.date}_${pol}.webp`, coordinates: L.corners };
}
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export function initMap() {
  const nobase = new URLSearchParams(location.search).has('nobase');
  // 오른쪽 미션 창과 아래 타임라인에 가리지 않게 여백을 둔다(좁은 화면에서는 줄인다)
  const padding = () => ({ top: 70, bottom: 130, left: 30, right: innerWidth > 900 ? 380 : 30 });
  const nightPadding = () => (innerWidth > 900 ? { top: 60, bottom: 50, left: 420, right: state.evidenceAt ? 390 : 40 } : { top: 60, bottom: 300, left: 16, right: 16 });
  const glow = data.glow?.regions || {};
  let nightAt = 'cheorwon';   // 밤사진에서 보고 있는 곳(지역 id 또는 'all')
  const nightView = (duration = 900) => map.fitBounds(nightAt === 'all' || !glow[nightAt] ? VIEW : boundsOf(glow[nightAt].corners), { padding: nightPadding(), duration });
  const map = new maplibregl.Map({ container: 'map', style: nobase ? EMPTY : BASE, bounds: VIEW,
    fitBoundsOptions: { padding: padding() }, attributionControl: false, maxZoom: 14 });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  // 사용자가 지도를 직접 움직이기 전까지는 창 크기가 바뀌면 전체가 보이게 다시 맞춘다
  let touched = false;
  for (const ev of ['dragstart', 'wheel', 'touchstart']) map.on(ev, () => { touched = true; });
  map.on('resize', () => { if (state.screen !== 'mission') nightView(0); else if (!touched) map.fitBounds(VIEW, { padding: padding(), duration: 0 }); });

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
    for (const [id, g] of Object.entries(glow)) {
      map.addSource(`glow-${id}`, { type: 'image', url: `data/${g.color}`, coordinates: g.corners });
      map.addLayer({ id: `glow-${id}`, type: 'raster', source: `glow-${id}`, layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0 } });
    }
    map.addSource('river', { type: 'geojson', data: { type: 'MultiPoint', coordinates: data.river.points } });
    map.addLayer({ id: 'river-hint', type: 'circle', source: 'river', layout: { visibility: 'none' }, paint: { 'circle-radius': 2.2, 'circle-color': '#7fe9ff', 'circle-opacity': .55 } });
    map.addSource('dmz', { type: 'geojson', data: data.boundary });
    map.addLayer({ id: 'dmz-glow', type: 'line', source: 'dmz', paint: { 'line-color': '#8ff7b9', 'line-width': 7, 'line-blur': 6, 'line-opacity': .35 } });
    map.addLayer({ id: 'dmz-line', type: 'line', source: 'dmz', paint: { 'line-color': '#bce9c5', 'line-width': 1.6, 'line-dasharray': [2, 2] } });
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
    for (const id of ['dmz-glow', 'dmz-line', 'zone-fill', 'zone-line']) map.setLayoutProperty(id, 'visibility', vis(!night));
  };
  subscribe((s, prev) => {
    if ((s.screen === 'mission') === (prev.screen === 'mission')) return;
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
      if (file) map.getSource(`glow-${id}`).updateImage({ url: `data/${file}`, coordinates: g.corners });
    }
  });
  // 밤사진 설명 창에서 지역을 고르면 그 지역의 변동 지도로 간다
  document.addEventListener('dmz-night-go', e => { nightAt = e.detail.id; nightView(); });
  subscribe((s, prev) => { if (s.evidenceAt !== prev.evidenceAt && s.screen === 'night' && !s.evidenceAt) nightView(); });
  const focus = id => { const b = STOPS.find(x => x.id === id).bounds; touched = true;
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: padding(), duration: 900 }); };
  const pins = STOPS.map((s, i) => {
    const el = document.createElement('button');
    el.className = 'pin'; el.type = 'button'; el.dataset.stop = s.id;
    const name = () => { el.setAttribute('aria-label', `${i + 1} ${label(s, 'name')}`); el.innerHTML = `${i + 1}<span class="pin-label">${label(s, 'name')}</span>`; };
    name(); subscribe((st, prev) => { if (st.lang !== prev.lang) name(); });
    el.addEventListener('click', e => { e.stopPropagation(); if (state.stop === s.id) focus(s.id); else set({ stop: s.id }); });   // 지금 지역의 핀을 다시 누르면 그 지역으로 확대
    new maplibregl.Marker({ element: el }).setLngLat(centerOf(s)).addTo(map);
    return el;
  });
  const paint = () => pins.forEach(el => {
    el.classList.toggle('current', el.dataset.stop === state.stop);
    el.classList.toggle('done', state.fragments.includes(el.dataset.stop));
  });
  subscribe(paint); paint();
  // 구역 이름표: 배경 지도의 글꼴에 기대지 않게 HTML 로 붙인다. 고른 지역의 것만, 충분히 확대했을 때만 보인다
  const tags = data.zones.map(z => {
    const el = document.createElement('div');
    el.className = `zone-tag ${z.role}`; el.textContent = z.name; el.dataset.region = z.region;
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
    if (k !== shownRadar) { shownRadar = k; if (r) map.getSource('radar').updateImage(r); map.setLayoutProperty('radar', 'visibility', r ? 'visible' : 'none'); }
    map.setLayoutProperty('river-hint', 'visibility', s.stop === 'yeoncheon' && s.riverHint ? 'visible' : 'none');
  };
  subscribe(radar);
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
    if (s.stop === prev.stop && s.mapReady === prev.mapReady) return;
    for (const id of ['zone-fill', 'zone-line']) if (map.getLayer(id)) map.setFilter(id, ['==', ['get', 'region'], s.stop]);
    if (s.stop !== prev.stop) focus(s.stop);
  });

  map.on('click', e => document.dispatchEvent(new CustomEvent('dmz-map-click', { detail: { lng: e.lngLat.lng, lat: e.lngLat.lat } })));
  return map;
}
