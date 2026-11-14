// 게임이 지도 위에서 쓰는 장치 둘.
//  · 화천 '커튼 밀기': 지도 위에 세로 커튼을 세우고 왼쪽은 HH, 오른쪽은 HV 영상을 보여 준다. 커튼을 밀어 두 눈을 견준다.
//  · 연천 '강 따라 긋기': 지도를 끄는 대신 손이 지나간 자리를 알려 주고(dmz-map-trace), 그은 자국을 지도에 그린다.
// 판정과 문구는 각 미션 화면(views/)이 맡는다.
import { state, set, subscribe, data, pass, zone } from '../state.js';
import { missionReady } from '../missions.js';
import * as pajuView from '../views/paju.js';
import * as cheorwonView from '../views/cheorwon.js';
import * as yangguView from '../views/yanggu.js';
import { t, dateText } from '../i18n.js';
import { blip } from '../sound.js';
import { loopSvg, PENCIL } from './zones.js';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

// 화천: 커튼이 레이더 영상의 어디쯤에 있는지(0 = 영상의 왼쪽 끝, 1 = 오른쪽 끝). 창의 게이지는 이 값을 쓴다.
// 커튼의 자리는 화면 전체 너비로 재지만, 영상은 화면 한가운데에 있지 않으므로 영상을 기준으로 다시 잰다
let share = .5;
export const curtainShare = () => share;

export function initGameMap(map) {
  const host = map.getContainer();
  const inGame = id => state.screen === 'mission' && state.stop === id && state.introSeen.includes(id) && !missionReady(id, state.seen[id]);
  const dragging = () => ['yeoncheon'].find(inGame);   // 지도를 끄는 대신 손이 지나간 자리를 쓰는 지역

  // ---- 화천: 커튼
  const L = data.layers?.regions?.hwacheon;
  const cur = document.createElement('div');
  cur.id = 'curtain'; cur.hidden = true;
  cur.innerHTML = `<div class="hv"><img alt=""></div>
    <div class="bar" role="slider" tabindex="0" aria-label="HH | HV" aria-valuemin="0" aria-valuemax="100"><b class="l">HH</b><b class="r">HV</b><i></i></div>`;
  host.append(cur);
  const img = cur.querySelector('img'), hv = cur.querySelector('.hv'), bar = cur.querySelector('.bar');
  let shown = null, centred = false;
  // HV 영상을 지도 위 그 자리에 포갠다. 창의 세 모서리(좌상·우상·좌하)를 화면 좌표로 옮겨 그대로 기울인다
  const place = () => {
    if (cur.hidden) return;
    const [w, h] = L.size, p0 = map.project(L.corners[0]), p1 = map.project(L.corners[1]), p3 = map.project(L.corners[3]);
    img.style.width = `${w}px`; img.style.height = `${h}px`;
    img.style.transform = `matrix(${(p1.x - p0.x) / w},${(p1.y - p0.y) / w},${(p3.x - p0.x) / h},${(p3.y - p0.y) / h},${p0.x},${p0.y})`;
    // 구역의 고리와 이름은 screens/zones.js 가 커튼보다 위에 그린다(HV 영상이 덮지 않게)
    const x = state.curtain * host.clientWidth;
    const xs = L.corners.map(c => map.project(c).x), left = Math.min(...xs), right = Math.max(...xs);
    share = Math.max(0, Math.min(1, (x - left) / ((right - left) || 1)));
    hv.style.clipPath = `inset(0 0 0 ${x}px)`;   // 커튼 오른쪽만 HV
    bar.style.left = `${x}px`;
    bar.setAttribute('aria-valuenow', Math.round(state.curtain * 100));
  };
  const syncCurtain = () => {
    const on = !!L?.pols.includes('hv') && inGame('hwacheon');
    if (on && cur.hidden) centred = false;   // 다시 나타날 때마다 영상 한가운데에서 시작한다
    cur.hidden = !on;
    if (!on) return;
    if (!centred && !map.isMoving()) {   // 지도가 자리를 잡은 뒤, 커튼을 영상의 한가운데로 옮긴다
      centred = true;
      const xs = L.corners.map(c => map.project(c).x), mid = (Math.min(...xs) + Math.max(...xs)) / 2 / host.clientWidth;
      if (Math.abs(mid - state.curtain) > .005) queueMicrotask(() => set({ curtain: Math.max(.06, Math.min(.94, mid)) }));
    }
    const p = pass(state.cycle), url = p && !p.rest && L.dates.includes(p.date) ? `data/layers/hwacheon/${p.date}_hv.webp` : BLANK;
    if (url !== shown) { shown = url; img.src = url; }
    place();
  };
  map.on('move', place); map.on('resize', place);
  map.on('moveend', () => { if (!cur.hidden && !centred) syncCurtain(); });
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
  // 그은 자국: 파란 색연필로 강을 따라 칠한 것처럼 그린다. 강 위를 지난 구간은 진하게 세 겹, 벗어난 구간은 옅은 회색 한 겹
  const pen = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pen.id = 'trace-ink'; pen.setAttribute('aria-hidden', 'true'); host.append(pen);
  let drawn = null, drawnAt = '';
  // 점들을 둥글게 이은 길. 겹마다 조금씩 어긋나게(shift) 해서 색연필을 여러 번 그은 느낌을 낸다
  const stroke = (pts, shift) => {
    if (pts.length < 2) return '';
    const q = pts.map((p, i) => ({ x: p.x + Math.sin(i * 1.7 + shift * 2.1) * shift, y: p.y + Math.cos(i * 1.3 + shift * 3.3) * shift }));
    let d = `M${q[0].x.toFixed(1)},${q[0].y.toFixed(1)}`;
    for (let i = 1; i < q.length - 1; i++) d += `Q${q[i].x.toFixed(1)},${q[i].y.toFixed(1)} ${((q[i].x + q[i + 1].x) / 2).toFixed(1)},${((q[i].y + q[i + 1].y) / 2).toFixed(1)}`;
    return `${d}L${q[q.length - 1].x.toFixed(1)},${q[q.length - 1].y.toFixed(1)}`;
  };
  const syncTrace = () => {
    const tracing = !!dragging();
    if (tracing !== wasTracing) {
      wasTracing = tracing;
      // 미션 화면에서는 지도가 늘 고정돼 있다(map.js). 여기서는 손 모양만 바꾼다
      map.getCanvas().style.cursor = tracing ? 'crosshair' : '';
    }
    const show = inGame('yeoncheon') ? state.riverTrace : [], c = map.getCenter(), at = `${c.lng.toFixed(5)},${c.lat.toFixed(5)},${map.getZoom().toFixed(3)}`;
    if (show === drawn && at === drawnAt) return;
    drawn = show; drawnAt = at;
    // 획과, 강 위·강 밖이 바뀌는 자리에서 끊어 구간으로 나눈다(이웃 구간과는 한 점을 겹쳐 이어 보이게)
    const runs = [];
    show.forEach((p, i) => {
      const last = runs[runs.length - 1], xy = map.project([p[0], p[1]]);
      if (!last || p[3] || last.on !== p[2]) { const run = { on: p[2], pts: [] }; if (last && !p[3]) run.pts.push(last.pts[last.pts.length - 1]); runs.push(run); }
      runs[runs.length - 1].pts.push(xy);
    });
    pen.innerHTML = runs.length ? PENCIL + `<g filter="url(#pencil)">${runs.map(r => (r.on
      ? `<path d="${stroke(r.pts, 0)}" class="pen wet"/><path d="${stroke(r.pts, 2.2)}" class="pen wet two"/><path d="${stroke(r.pts, 3.4)}" class="pen wet three"/>`
      : `<path d="${stroke(r.pts, 0)}" class="pen dry"/>`)).join('')}</g>` : '';
  };
  map.on('move', syncTrace);

  // ---- 시간 돌리기(파주, 철원, 양구): 지도 아래의 손잡이를 끌어 날짜를 넘긴다. 철원에서는 이름을 가린 두 땅(가, 나)의 테두리도 지도 위에 그린다
  const SCRUB = { paju: pajuView, cheorwon: cheorwonView, yanggu: yangguView }, LANDS = cheorwonView.LANDS;
  const scrub = document.createElement('div');
  scrub.id = 'scrub'; scrub.hidden = true;
  scrub.innerHTML = `<svg class="lands" aria-hidden="true">${PENCIL}${LANDS.map(l => `<g class="${l.key}" data-land="${l.key}"><ellipse/><g class="loop" filter="url(#pencil)"></g><text></text></g>`).join('')}</svg>
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
      const L = loopSvg(q, l.id, '#fff');
      g.querySelector('.loop').innerHTML = L.html;
      // 고리 안쪽은 눌리는 자리(보이지 않는 타원)
      const el = g.querySelector('ellipse'); el.setAttribute('cx', L.cx.toFixed(1)); el.setAttribute('cy', L.cy.toFixed(1)); el.setAttribute('rx', L.rx.toFixed(1)); el.setAttribute('ry', L.ry.toFixed(1));
      const tx = g.querySelector('text'); tx.setAttribute('x', (L.cx + L.rx * .62).toFixed(1)); tx.setAttribute('y', (L.cy - L.ry - 6).toFixed(1));
    }
  };
  const syncScrub = () => {
    const now = Object.keys(SCRUB).find(inGame) || null;
    scrub.hidden = !now;
    if (!now) { who = null; return; }
    if (now !== who) {   // 지역이 바뀌면 그 지역의 날짜들로 다시 만든다
      who = now; cyc = SCRUB[who].cycles(); scrub.dataset.stop = who;
      scrub.querySelector('.dots').innerHTML = cyc.map(() => '<i></i>').join(''); rail.setAttribute('aria-valuemax', cyc.length - 1);
      // 손잡이는 늘 첫 날짜에서 시작한다(앞 지역에서 보던 날짜가 남아 중간부터 시작하지 않게). 이미 넘겨 보던 중이면 그대로 둔다
      const seenHere = cyc.filter(c => state.visited.includes(c)).length;
      if (seenHere <= 1 && state.cycle !== cyc[0]) { const stop = who; queueMicrotask(() => { if (state.stop === stop) set({ cycle: cyc[0], visited: [cyc[0]] }); }); }
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
