// 게임이 지도 위에서 쓰는 장치 둘.
//  · 화천 '커튼 밀기': 지도 위에 세로 커튼을 세우고 왼쪽은 HH, 오른쪽은 HV 영상을 보여 준다. 커튼을 밀어 두 눈을 견준다.
//  · 연천 '강 따라 긋기': 지도를 끄는 대신 손이 지나간 자리를 알려 주고(dmz-map-trace), 그은 자국을 지도에 그린다.
// 판정과 문구는 각 미션 화면(views/)이 맡는다.
import { state, set, subscribe, data, pass, zone } from '../state.js';
import { missionReady } from '../missions.js';
import { hotSpot } from '../views/yanggu.js';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export function initGameMap(map) {
  const host = map.getContainer();
  const inGame = id => state.screen === 'mission' && state.stop === id && state.introSeen.includes(id) && !missionReady(id, state.seen[id]);
  const dragging = () => ['yeoncheon', 'yanggu'].find(inGame);   // 지도를 끄는 대신 손이 지나간 자리를 쓰는 지역

  // ---- 화천: 커튼
  const L = data.layers?.regions?.hwacheon;
  const cur = document.createElement('div');
  cur.id = 'curtain'; cur.hidden = true;
  cur.innerHTML = `<div class="hv"><img alt=""></div>
    <svg class="zones" aria-hidden="true"><polygon class="a"/><polygon class="b"/></svg>
    <div class="bar" role="slider" tabindex="0" aria-label="HH | HV" aria-valuemin="0" aria-valuemax="100"><b class="l">HH</b><b class="r">HV</b><i></i></div>`;
  host.append(cur);
  const img = cur.querySelector('img'), hv = cur.querySelector('.hv'), bar = cur.querySelector('.bar');
  let shown = null;
  // HV 영상을 지도 위 그 자리에 포갠다. 창의 세 모서리(좌상·우상·좌하)를 화면 좌표로 옮겨 그대로 기울인다
  const place = () => {
    if (cur.hidden) return;
    const [w, h] = L.size, p0 = map.project(L.corners[0]), p1 = map.project(L.corners[1]), p3 = map.project(L.corners[3]);
    img.style.width = `${w}px`; img.style.height = `${h}px`;
    img.style.transform = `matrix(${(p1.x - p0.x) / w},${(p1.y - p0.y) / w},${(p3.x - p0.x) / h},${(p3.y - p0.y) / h},${p0.x},${p0.y})`;
    // 견줄 두 구역의 테두리는 커튼 위에도 그린다(HV 영상이 지도의 테두리를 가리므로)
    [['a', 'hwacheon-dmz'], ['b', 'hwacheon-north']].forEach(([cls, id]) => {
      const b = zone(id)?.bounds; if (!b) return;
      cur.querySelector(`.zones .${cls}`).setAttribute('points', [[b[0], b[3]], [b[2], b[3]], [b[2], b[1]], [b[0], b[1]]].map(c => { const q = map.project(c); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join(' '));
    });
    const x = state.curtain * host.clientWidth;
    hv.style.clipPath = `inset(0 0 0 ${x}px)`;   // 커튼 오른쪽만 HV
    bar.style.left = `${x}px`;
    bar.setAttribute('aria-valuenow', Math.round(state.curtain * 100));
  };
  const syncCurtain = () => {
    const on = !!L?.pols.includes('hv') && inGame('hwacheon');
    cur.hidden = !on;
    if (!on) return;
    const p = pass(state.cycle), url = p && !p.rest && L.dates.includes(p.date) ? `data/layers/hwacheon/${p.date}_hv.webp` : BLANK;
    if (url !== shown) { shown = url; img.src = url; }
    place();
  };
  map.on('move', place); map.on('resize', place);
  const LO = .06, HI = .94;
  // 끝을 넘겨 끌면 넘긴 만큼 덜 따라온다(딱 멈추지 않는다)
  const band = over => (over * .55) / (1 + .55 * Math.abs(over) / .12);
  const soft = f => (f < LO ? LO + band(f - LO) : f > HI ? HI + band(f - HI) : f);
  let sliding = false, grab = 0, back = 0;
  const slide = clientX => {
    const b = host.getBoundingClientRect(), f = soft((clientX - grab - b.left) / b.width);
    if (Math.abs(f - state.curtain) > .001) set({ curtain: f });
  };
  // 놓았을 때 끝을 넘어가 있으면 지금 자리에서부터 끝으로 돌아온다. 다시 잡으면 그 자리에서 멈춘다
  const settle = () => {
    cancelAnimationFrame(back);
    const to = Math.max(LO, Math.min(HI, state.curtain));
    if (to === state.curtain) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return set({ curtain: to });
    let last = performance.now();
    const step = now => {
      const k = 1 - Math.exp(-(now - last) / 70); last = now;
      const next = state.curtain + (to - state.curtain) * k;
      if (Math.abs(to - next) < .001) return set({ curtain: to });
      set({ curtain: next }); back = requestAnimationFrame(step);
    };
    back = requestAnimationFrame(step);
  };
  bar.addEventListener('pointerdown', e => {
    cancelAnimationFrame(back);
    sliding = true; cur.classList.add('grab');
    grab = e.clientX - (host.getBoundingClientRect().left + state.curtain * host.clientWidth);   // 손잡이의 어디를 잡았는지 기억한다
    try { bar.setPointerCapture(e.pointerId); } catch { /* 붙잡지 못해도 민다 */ }
    e.preventDefault();
  });
  bar.addEventListener('pointermove', e => { if (sliding) slide(e.clientX); });
  const stopSlide = () => { if (!sliding) return; sliding = false; cur.classList.remove('grab'); settle(); };
  bar.addEventListener('pointerup', stopSlide); bar.addEventListener('pointercancel', stopSlide);
  bar.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') set({ curtain: Math.max(LO, Math.min(HI, state.curtain + (e.key === 'ArrowLeft' ? -.04 : .04))) });
  });

  // ---- 연천: 강 따라 긋기
  let down = false, wasTracing = null;
  const send = detail => document.dispatchEvent(new CustomEvent('dmz-map-trace', { detail }));
  const begin = e => { if (!dragging() || !e.lngLat) return; down = true; send({ lng: e.lngLat.lng, lat: e.lngLat.lat, phase: 'start' }); };
  const drag = e => { if (down && e.lngLat && dragging()) send({ lng: e.lngLat.lng, lat: e.lngLat.lat, phase: 'move' }); };
  const end = () => { if (down) { down = false; send({ phase: 'end' }); } };
  map.on('mousedown', begin); map.on('mousemove', drag); map.on('mouseup', end); map.on('mouseout', end);
  map.on('touchstart', begin); map.on('touchmove', drag); map.on('touchend', end); map.on('touchcancel', end);
  // 그은 자국: 강 위는 하늘색, 벗어난 곳은 회색 점
  let drawn = null;
  const syncTrace = () => {
    const tracing = !!dragging();
    if (tracing !== wasTracing) {   // 긋는 동안에는 지도가 끌려가지 않게 한다
      wasTracing = tracing;
      // 미션 화면에서는 지도가 늘 고정돼 있다(map.js). 여기서는 손 모양만 바꾼다
      map.getCanvas().style.cursor = tracing ? 'crosshair' : '';
    }
    if (!map.getSource('dmz')) return;   // 지도가 아직 준비되지 않았다
    if (!map.getSource('trace')) {
      map.addSource('trace', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'trace', type: 'circle', source: 'trace', paint: { 'circle-radius': ['case', ['==', ['get', 'on'], 1], 6, 4],
        'circle-color': ['case', ['==', ['get', 'on'], 1], '#7fe9ff', '#7d8c88'], 'circle-opacity': ['case', ['==', ['get', 'on'], 1], .9, .55], 'circle-blur': .35 } });
      drawn = null;
    }
    const show = state.screen === 'mission' && state.stop === 'yeoncheon' ? state.riverTrace : [];
    if (show !== drawn) {
      drawn = show;
      map.getSource('trace').setData({ type: 'FeatureCollection', features: show.map(p => ({ type: 'Feature', properties: { on: p[2] }, geometry: { type: 'Point', coordinates: [p[0], p[1]] } })) });
    }
  };

  // ---- 양구: 손이 지나간 자리를 변화 정도의 색으로 칠한다(조용한 곳은 푸르게, 많이 변한 곳은 금색으로)
  let trailDrawn = null, marks = '';
  const fc = features => ({ type: 'FeatureCollection', features });
  const pt = (c, properties = {}) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [c[0], c[1]] } });
  const syncProbe = () => {
    if (!map.getSource('dmz')) return;
    if (!map.getSource('probe-trail')) {
      map.addSource('probe-trail', { type: 'geojson', data: fc([]) });
      map.addSource('probe-mark', { type: 'geojson', data: fc([]) });
      map.addLayer({ id: 'probe-trail', type: 'circle', source: 'probe-trail', paint: { 'circle-radius': 9, 'circle-blur': .7, 'circle-opacity': .6,
        'circle-color': ['interpolate', ['linear'], ['get', 'v'], 0, '#2b4a9a', .45, '#7fe9ff', .8, '#ffe1a2', 1, '#ffffff'] } });
      map.addLayer({ id: 'probe-hint', type: 'circle', source: 'probe-mark', filter: ['==', ['get', 'k'], 'hint'], paint: { 'circle-radius': 70, 'circle-color': '#ffe1a2', 'circle-opacity': .14, 'circle-stroke-color': '#ffe1a2', 'circle-stroke-width': 1.5, 'circle-stroke-opacity': .6 } });
      map.addLayer({ id: 'probe-now', type: 'circle', source: 'probe-mark', filter: ['==', ['get', 'k'], 'now'], paint: { 'circle-radius': 15, 'circle-color': 'rgba(255,255,255,.08)', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'probe-hot', type: 'circle', source: 'probe-mark', filter: ['==', ['get', 'k'], 'hot'], paint: { 'circle-radius': 13, 'circle-color': 'rgba(255,225,162,.25)', 'circle-stroke-color': '#ffe1a2', 'circle-stroke-width': 3 } });
      trailDrawn = null; marks = '';
    }
    const here = state.screen === 'mission' && state.stop === 'yanggu';
    const trail = here ? state.probeTrail : [];
    if (trail !== trailDrawn) { trailDrawn = trail; map.getSource('probe-trail').setData(fc(trail.map(p => pt(p, { v: p[2] })))); }
    const list = [];
    if (here && state.hot) list.push(pt(state.hot, { k: 'hot' }));
    else if (here) {
      if (state.probe && inGame('yanggu')) list.push(pt(state.probe, { k: 'now' }));
      if (state.hotHint && hotSpot()) list.push(pt(hotSpot(), { k: 'hint' }));
    }
    const key = JSON.stringify(list);
    if (key !== marks) { marks = key; map.getSource('probe-mark').setData(fc(list)); }
  };

  subscribe(() => { syncCurtain(); syncTrace(); syncProbe(); });
  syncCurtain(); syncTrace(); syncProbe();
}
