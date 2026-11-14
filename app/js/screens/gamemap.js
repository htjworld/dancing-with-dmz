// 게임이 지도 위에서 쓰는 장치 둘.
//  · 화천 '커튼 밀기': 지도 위에 세로 커튼을 세우고 왼쪽은 HH, 오른쪽은 HV 영상을 보여 준다. 커튼을 밀어 두 눈을 견준다.
//  · 연천 '강 따라 긋기': 지도를 끄는 대신 손이 지나간 자리를 알려 주고(dmz-map-trace), 그은 자국을 지도에 그린다.
// 판정과 문구는 각 미션 화면(views/)이 맡는다.
import { state, set, subscribe, data, pass, zone } from '../state.js';
import { missionReady } from '../missions.js';
import * as cheorwonView from '../views/cheorwon.js';
import * as yangguView from '../views/yanggu.js';
import { t, dateText } from '../i18n.js';
import { blip } from '../sound.js';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export function initGameMap(map) {
  const host = map.getContainer();
  const inGame = id => state.screen === 'mission' && state.stop === id && state.introSeen.includes(id) && !missionReady(id, state.seen[id]);
  const dragging = () => ['yeoncheon'].find(inGame);   // 지도를 끄는 대신 손이 지나간 자리를 쓰는 지역

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

  // ---- 시간 돌리기(철원, 양구): 지도 아래의 손잡이를 끌어 날짜를 넘긴다. 철원에서는 이름을 가린 두 땅(가, 나)의 테두리도 지도 위에 그린다
  const SCRUB = { cheorwon: cheorwonView, yanggu: yangguView }, LANDS = cheorwonView.LANDS;
  const scrub = document.createElement('div');
  scrub.id = 'scrub'; scrub.hidden = true;
  scrub.innerHTML = `<svg class="lands" aria-hidden="true">${LANDS.map(l => `<g class="${l.key}" data-land="${l.key}"><polygon/><text></text></g>`).join('')}</svg>
    <div class="time"><b class="day"></b>
      <div class="rail" role="slider" tabindex="0" aria-valuemin="0"><i class="fill"></i><span class="dots"></span><b class="knob"></b></div>
      <div class="ends"><span></span><span></span></div></div>`;
  host.append(scrub);
  const rail = scrub.querySelector('.rail'), knob = scrub.querySelector('.knob'), fill = scrub.querySelector('.fill'), dayEl = scrub.querySelector('.day');
  const loaded = new Set();
  let cyc = [], who = null;
  const placeLands = () => {
    if (scrub.hidden || who !== 'cheorwon') return;
    for (const l of LANDS) {
      const b = zone(l.id)?.bounds; if (!b) continue;
      const g = scrub.querySelector(`.lands .${l.key}`), q = [[b[0], b[3]], [b[2], b[3]], [b[2], b[1]], [b[0], b[1]]].map(c => map.project(c));
      g.querySelector('polygon').setAttribute('points', q.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' '));
      const tx = g.querySelector('text'); tx.setAttribute('x', (q[0].x + 8).toFixed(1)); tx.setAttribute('y', (q[0].y - 8).toFixed(1));
    }
  };
  const syncScrub = () => {
    const now = Object.keys(SCRUB).find(inGame) || null;
    scrub.hidden = !now;
    if (!now) { who = null; return; }
    if (now !== who) {   // 지역이 바뀌면 그 지역의 날짜들로 다시 만든다
      who = now; cyc = SCRUB[who].cycles(); scrub.dataset.stop = who;
      scrub.querySelector('.dots').innerHTML = cyc.map(() => '<i></i>').join(''); rail.setAttribute('aria-valuemax', cyc.length - 1);
      if (!loaded.has(who)) { loaded.add(who); for (const c of cyc) { const im = new Image(); im.src = `data/layers/${who}/${pass(c).date}_hh.webp`; } }   // 날짜를 넘길 때 영상이 바로 바뀌도록 미리 불러 둔다
    }
    const i = Math.max(0, cyc.indexOf(state.cycle)), f = cyc.length > 1 ? i / (cyc.length - 1) : 0;
    knob.style.left = fill.style.width = `${(f * 100).toFixed(2)}%`;
    const day = dateText(pass(cyc[i]).date);
    dayEl.textContent = day; rail.setAttribute('aria-valuenow', i); rail.setAttribute('aria-valuetext', day);
    const ends = scrub.querySelectorAll('.ends span'); ends[0].textContent = dateText(pass(cyc[0]).date); ends[1].textContent = dateText(pass(cyc[cyc.length - 1]).date);
    [...scrub.querySelectorAll('.dots i')].forEach((d, k) => d.classList.toggle('seen', state.visited.includes(cyc[k])));
    for (const l of LANDS) scrub.querySelector(`.lands .${l.key} text`).textContent = t(l.name);
    scrub.classList.toggle('ask', who === 'cheorwon' && SCRUB[who].askReady());
    placeLands();
  };
  map.on('move', placeLands); map.on('resize', placeLands);
  // 손잡이: 누른 자리로 바로 오고, 끄는 동안 가장 가까운 날짜로 넘어간다. 넘어갈 때마다 그 지역이 정한 음높이가 울린다
  const go = i => {
    if (!who) return;
    const c = cyc[Math.max(0, Math.min(cyc.length - 1, i))];
    if (c === state.cycle && state.visited.includes(c)) return;
    blip(294 * 2 ** SCRUB[who].tone(c), .13, .2);
    set({ cycle: c, visited: [...new Set([...state.visited, c])], note: null });
  };
  const at = x => { const r = rail.getBoundingClientRect(); return Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * (cyc.length - 1)); };
  let scrubbing = false;
  rail.addEventListener('pointerdown', e => { scrubbing = true; scrub.classList.add('grab'); try { rail.setPointerCapture(e.pointerId); } catch { /* 붙잡지 못해도 넘긴다 */ } go(at(e.clientX)); e.preventDefault(); });
  rail.addEventListener('pointermove', e => { if (scrubbing) go(at(e.clientX)); });
  const endScrub = () => { scrubbing = false; scrub.classList.remove('grab'); };
  rail.addEventListener('pointerup', endScrub); rail.addEventListener('pointercancel', endScrub);
  rail.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); go(cyc.indexOf(state.cycle) + (e.key === 'ArrowLeft' ? -1 : 1)); } });
  // 철원: 열한 날을 다 본 뒤에는 지도 위의 땅을 직접 눌러 고른다
  scrub.querySelector('.lands').addEventListener('click', e => {
    const g = e.target.closest('[data-land]');
    if (g && scrub.classList.contains('ask')) document.dispatchEvent(new CustomEvent('dmz-map-pick', { detail: { land: g.dataset.land } }));
  });

  subscribe(() => { syncCurtain(); syncTrace(); syncScrub(); });
  syncCurtain(); syncTrace(); syncScrub();
}
