// 지도: 어두운 배경 위에 군사분계선과 다섯 지역의 핀을 올린다.
import { state, set, subscribe, data } from './state.js';
import { STOPS, centerOf } from './stops.js';

const BASE = 'https://tiles.openfreemap.org/styles/dark';
const EMPTY = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#07100e' } }] };
const VIEW = [[126.45, 37.6], [128.5, 38.75]];

export function initMap() {
  const nobase = new URLSearchParams(location.search).has('nobase');
  // 오른쪽 미션 창과 아래 타임라인에 가리지 않게 여백을 둔다(좁은 화면에서는 줄인다)
  const padding = () => ({ top: 70, bottom: 130, left: 30, right: innerWidth > 900 ? 380 : 30 });
  const map = new maplibregl.Map({ container: 'map', style: nobase ? EMPTY : BASE, bounds: VIEW,
    fitBoundsOptions: { padding: padding() }, attributionControl: false, maxZoom: 14 });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  // 사용자가 지도를 직접 움직이기 전까지는 창 크기가 바뀌면 전체가 보이게 다시 맞춘다
  let touched = false;
  for (const ev of ['dragstart', 'wheel', 'touchstart']) map.on(ev, () => { touched = true; });
  map.on('resize', () => { if (!touched) map.fitBounds(VIEW, { padding: padding(), duration: 0 }); });

  // 배경 지도를 못 받아도 선과 핀은 보이게 한다
  let ready = false;
  const fallback = setTimeout(() => { if (!ready) map.setStyle(EMPTY); }, 6000);
  map.on('error', e => { if (!ready && e?.error?.status !== undefined) map.setStyle(EMPTY); });

  map.on('style.load', () => {
    if (map.getSource('dmz')) return;
    map.addSource('dmz', { type: 'geojson', data: data.boundary });
    map.addLayer({ id: 'dmz-glow', type: 'line', source: 'dmz', paint: { 'line-color': '#8ff7b9', 'line-width': 7, 'line-blur': 6, 'line-opacity': .35 } });
    map.addLayer({ id: 'dmz-line', type: 'line', source: 'dmz', paint: { 'line-color': '#bce9c5', 'line-width': 1.6, 'line-dasharray': [2, 2] } });
    ready = true; clearTimeout(fallback);
    set({ mapReady: true });
  });

  const pins = STOPS.map((s, i) => {
    const el = document.createElement('button');
    el.className = 'pin'; el.type = 'button'; el.dataset.stop = s.id;
    el.setAttribute('aria-label', `${i + 1}번 ${s.name}`);
    el.innerHTML = `${i + 1}<span class="pin-label">${s.name}</span>`;
    el.addEventListener('click', e => { e.stopPropagation(); set({ stop: s.id }); });
    new maplibregl.Marker({ element: el }).setLngLat(centerOf(s)).addTo(map);
    return el;
  });
  const paint = () => pins.forEach(el => {
    el.classList.toggle('current', el.dataset.stop === state.stop);
    el.classList.toggle('done', state.fragments.includes(el.dataset.stop));
  });
  subscribe(paint); paint();

  map.on('click', e => document.dispatchEvent(new CustomEvent('dmz-map-click', { detail: { lng: e.lngLat.lng, lat: e.lngLat.lat } })));
  return map;
}
