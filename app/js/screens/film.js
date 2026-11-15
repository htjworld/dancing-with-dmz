// 밤하늘 영상: 밤사진 화면의 첫 모습(hdk 담당). 두 부분으로 흐른다.
// 1) 도입(globe.js): 점 지구본 위를 NISAR가 돌며 스스로 쏜 전파로 땅을 비추고, 같은 길을 되풀이한 뒤 DMZ로 내려간다.
// 2) 물결 선: 다섯 지역을 약 0.6 km마다 가로줄로 긋고, 줄의 흔들림 = 그 자리의 한 계절 평균과 비교한 그날의 숲 대비 HH 신호(dB).
//    통과마다 실제 값으로 선이 춤추고, 끝에는 한 계절을 계속 되풀이한다. 끝나면 다섯 지역 미션(게임)으로 넘어간다.
// 지도 카메라는 map.js 가 맡는다(dmz-night-go). 물결 선과 분계선은 지도 위 캔버스에 직접 그린다. 숫자는 facts.json 에서만 가져온다.
import { state, set, subscribe, fact } from '../state.js';
import { t } from '../i18n.js';
import { nightScore } from './nightmusic.js';
import { play, stop } from '../sound.js';
import { createIntro } from './globe.js';

const el = document.getElementById('film');
// 물결 영상의 시간표(초, 도입이 끝난 뒤부터). cam: 카메라가 가는 곳, cap: 자막 키
const CUES = [
  { at: 0, cap: 'film.c1', cam: 'all' }, { at: 4, cap: 'film.c2', cam: 'cheorwon' }, { at: 8, cap: 'film.paju', cam: 'paju', ch: 'paju' },
  { at: 13, cap: 'film.yeoncheon', cam: 'yeoncheon', ch: 'yeoncheon' }, { at: 17.5, cap: 'film.cheorwon', cam: 'cheorwon', ch: 'cheorwon' },
  { at: 23, cap: 'film.hwacheon', cam: 'hwacheon', ch: 'hwacheon' }, { at: 27, cap: 'film.yanggu', cam: 'yanggu', ch: 'yanggu' },
  { at: 31, cap: 'film.c6', cam: 'all', line: true, ch: 'end' }, { at: 35, cap: 'film.c7' }, { at: 38.5, cap: 'film.c8' },
  { at: 42, cap: '', title: true },
];
const SHOW = [2.5, 5], GROW = [7, 31], END = 44, LEAVE = 51;   // 선이 나타나는 구간, 통과가 흐르는 구간, 끝, 게임으로 넘어가는 때
const SLOTS = 11, LOOP = 0.95;                                // 통과 수, 끝난 뒤 한 통과에 걸리는 시간
const LABELS = ['6/23', '7/5', '7/17', '8/10', '8/22', '9/3', '9/15', '9/27', '10/9', '10/21', '11/2'];

const intro = createIntro();

// 음악: 밤하늘 주제(nightmusic.js 의 24초 곡)를 영상 끝(도입 + 물결 + 게임으로 넘어가기 전)까지 이어 붙인다.
// 첫 바퀴(지구본 도입)는 별 소리 없이 화음만 조용히, 두 번째 바퀴부터 별 소리가 돌아오고 조금씩 늘어난다. 연출이며 관측값이 아니다
function longScore(seconds) {
  const a = nightScore(), reps = Math.ceil(seconds / a.duration), events = [];
  let seed = 1115; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let r = 0; r < reps; r++) {
    const off = r * a.duration;
    for (const e of a.events) {
      if (r === 0 && e.type === 'sparkle') continue;
      events.push({ ...e, time: e.time + off, gain: (e.gain ?? 1) * (r === 0 ? 0.8 : 1) });
    }
    if (r >= 2) for (let m = 0; m < 6; m++) {   // 뒤 바퀴에는 별을 한두 개 더
      const base = a.events.find(e => e.type === 'pad' && Math.abs(e.time - m * 4) < 1e-6);
      if (base) events.push({ type: 'sparkle', time: off + m * 4 + 0.75 + Math.round(rnd() * 5) / 2, dur: .3, midi: base.midis[Math.floor(rnd() * base.midis.length)] + 24, gain: .2 + .15 * rnd() });
    }
  }
  return { bpm: a.bpm, duration: reps * a.duration, events: events.sort((x, y) => x.time - y.time) };
}
const cv = document.createElement('canvas'); cv.id = 'film-waves';
const tint = document.createElement('div'); tint.id = 'film-tint';
const ticks = document.createElement('div'); ticks.id = 'film-ticks'; ticks.setAttribute('aria-hidden', 'true');
const cx = cv.getContext('2d');
// 영상 끝의 제목: 글자마다 다섯 지역 중 하나를 맡아(서쪽부터 차례로), 그 지역 물결의 실제 흔들림만큼 오르내린다(참고: 「Dancing with DMZ 눈과 레이더」 시안)
const WORD = 'Dancing with DMZ', ORDER = ['paju', 'yeoncheon', 'cheorwon', 'hwacheon', 'yanggu'];
const skipEl = document.createElement('button'); skipEl.type = 'button'; skipEl.id = 'film-skip';
const titleEl = document.createElement('div'); titleEl.id = 'film-title'; titleEl.setAttribute('aria-hidden', 'true');
titleEl.innerHTML = `<h2>${[...WORD].map((ch, i) => ch === ' ' ? '<i class="sp"></i>' : `<i>${ch}</i>`).join('')}</h2>`;
const letters = [...titleEl.querySelectorAll('i:not(.sp)')];
let CH = null, titleAt = 0;   // CH[지역][관측] = 그 관측의 평균 흔들림(0~1, 전체 최댓값으로 나눔)
let paused = 0, pausedAt = 0;   // 멈춘 시각(performance.now), 0 이면 재생 중
let KOREA = [];   // 한반도 촘촘한 점 [경도, 위도]
let R = null, mdl = [], raf = 0, startedAt = 0, cue = -1, capKey = '', left = -1, held = false, linePulse = 0, loading = null;

const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const geo = (c, u, v) => [c[0][0] + u * (c[1][0] - c[0][0]) + v * (c[3][0] - c[0][0]), c[0][1] + u * (c[1][1] - c[0][1]) + v * (c[3][1] - c[0][1])];
const mapOf = () => window.__dmzMap;
const go = (id, duration) => document.dispatchEvent(new CustomEvent('dmz-night-go', { detail: { id, duration } }));
const glow = value => document.dispatchEvent(new CustomEvent('dmz-glow-opacity', { detail: { value } }));
const vars = () => ({ passes: fact('passes') });

function resize() {
  const r = devicePixelRatio || 1;
  cv.width = innerWidth * r; cv.height = innerHeight * r; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  cx.setTransform(r, 0, 0, r, 0, 0);
}

function load() {
  loading ??= Promise.all([
    fetch('data/ridges.json').then(r => r.json()),
    fetch('data/dmz.geojson').then(r => r.json()),
    fetch('data/globe_dots.json').then(r => r.json()),
  ]).then(async ([ridges, dmz, dots]) => {
    KOREA = dots.korea;
    R = ridges.regions;
    CH = ORDER.map(id => R[id].wave.map(f => { let s = 0, n = 0; for (const row of f) for (const v of row) if (v != null) { s += Math.abs(v); n++; } return n ? s / n : 0; }));
    const mx = Math.max(...CH.flat()) || 1; CH = CH.map(a => a.map(v => v / mx));
    for (const f of dmz.features) { const g = f.geometry; if (g.type === 'LineString') mdl.push(g.coordinates); else if (g.type === 'MultiLineString') mdl.push(...g.coordinates); }
    // 지구본의 끝 화면을 지도의 첫 화면(전체)에 맞추는 값: 지도 중심, 그 화면 위치, 정사영 축척(라디안당 px)
    await intro.init(mdl, () => {
      const m = mapOf(); if (!m) return { center: [127.47, 38.17], xy: [innerWidth / 2, innerHeight / 2], scale: Math.min(innerWidth, innerHeight) * 40 };
      const c = m.getCenter(), q = m.project(c), a = m.project([c.lng - 0.5, c.lat]), b = m.project([c.lng + 0.5, c.lat]);
      return { center: [c.lng, c.lat], xy: [q.x, q.y], scale: (b.x - a.x) * 180 / Math.PI / Math.cos(c.lat * Math.PI / 180) };
    });
  });
  return loading;
}

// 시각 s(물결 영상 기준)의 흔들림: 통과 사이를 끊지 않고 코사인으로 이어 움직인다. 끝난 뒤에는 한 계절을 되풀이한다
function waveState(s) {
  if (s < GROW[0]) return { a: 0, b: 0, k: 0, amp: 0, slot: -1 };
  const per = (GROW[1] - GROW[0]) / SLOTS, amp = smooth(GROW[0] - 1.5, GROW[0] + per, s);
  const pos = s < GROW[1] ? (s - GROW[0]) / per : ((s - GROW[1]) / LOOP) % SLOTS;
  const i = Math.floor(pos) % SLOTS, f = pos - Math.floor(pos);
  return { a: i, b: (i + 1) % SLOTS, k: (1 - Math.cos(Math.PI * f)) / 2, amp, slot: s < GROW[1] ? Math.floor(pos) : i };
}
function heightAt(r, j, i, st) {
  const va = r.wave[st.a][j][i], vb = r.wave[st.b][j][i];
  if (va == null || vb == null) return null;
  const taper = smooth(0, 7, i) * smooth(0, 7, r.nx - 1 - i);   // 줄 양 끝은 0으로 가늘게
  return (va + (vb - va) * st.k) * st.amp * taper;
}
function curve(pts, pxDb) {
  const y = p => p[1] - p[2] * pxDb;
  cx.moveTo(pts[0][0], y(pts[0]));
  for (let n = 1; n < pts.length - 1; n++) { const a = pts[n], b = pts[n + 1]; cx.quadraticCurveTo(a[0], y(a), (a[0] + b[0]) / 2, (y(a) + y(b)) / 2); }
  const l = pts[pts.length - 1]; cx.lineTo(l[0], y(l));
}
const mercY = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
let mdlM = null;   // 분계선 점의 메르카토르 좌표(한 번만 계산)
function drawWaves(s) {
  cx.clearRect(0, 0, innerWidth, innerHeight);
  const m = mapOf(); if (!m || !R) return -1;
  const calm = titleAt ? smooth(0, 1.6, (performance.now() - titleAt) / 1000) : 0;   // 제목이 나오면 선의 춤이 잦아든다(춤은 글자로 옮겨 간다)
  const st = waveState(s), show = smooth(SHOW[0], SHOW[1], s) * (1 - 0.65 * calm);
  st.amp *= 1 - calm;
  if (show > 0) {
    cx.globalCompositeOperation = 'lighter';
    for (const r of Object.values(R)) {
      const c = r.corners;
      const p0 = m.project(geo(c, .5, .5 / r.ny)), p1 = m.project(geo(c, .5, 1.5 / r.ny));
      const rowPx = Math.hypot(p1.x - p0.x, p1.y - p0.y), step = Math.max(1, Math.ceil(5.5 / rowPx));
      const pxDb = Math.min(60, Math.max(5, rowPx * step * 2.2));
      r.hmax ??= Math.max(...r.wave.flat(2).map(v => Math.abs(v ?? 0)));   // 이 지역 선이 오르내리는 최대 폭(화면 밖 줄을 거를 때 쓴다)
      const W = innerWidth, H = innerHeight, my = r.hmax * pxDb + 20, n1 = r.nx - 1;
      for (let j = 0; j < r.ny; j += step) {
        // 줄의 양 끝만 지도 좌표로 바꾸고 사이는 고르게 나눈다(한 줄 안에서는 직선과의 차이가 0.01px 아래). 화면 밖은 그리지 않는다(jmj 제안, 로컬 시험)
        const A = m.project(geo(c, .5 / r.nx, (j + .5) / r.ny)), B = m.project(geo(c, (n1 + .5) / r.nx, (j + .5) / r.ny));
        if (Math.max(A.y, B.y) < -my || Math.min(A.y, B.y) > H + my || Math.max(A.x, B.x) < -40 || Math.min(A.x, B.x) > W + 40) continue;
        const dx = (B.x - A.x) / n1, dy = (B.y - A.y) / n1;
        let i0 = 0, i1 = n1;
        if (Math.abs(dx) > 1e-6) { const t0 = (-40 - A.x) / dx, t1 = (W + 40 - A.x) / dx; i0 = Math.max(0, Math.floor(Math.min(t0, t1)) - 2); i1 = Math.min(n1, Math.ceil(Math.max(t0, t1)) + 2); }
        let seg = [];
        const flush = () => {
          if (seg.length > 2) {
            cx.beginPath(); curve(seg, pxDb); cx.strokeStyle = `rgba(150,172,225,${0.3 * show})`; cx.lineWidth = 1; cx.stroke();
            for (const [lo, al] of [[0.22, 0.25], [0.4, 0.45], [0.65, 0.7]]) {   // 크게 흔들린 곳일수록 진한 금빛
              let run = [];
              const out = () => { if (run.length > 2) { cx.beginPath(); curve(run, pxDb); cx.strokeStyle = `rgba(255,200,110,${al * show})`; cx.lineWidth = 1.3; cx.stroke(); } run = []; };
              for (const p of seg) { if (Math.abs(p[2]) >= lo) run.push(p); else if (run.length) { run.push(p); out(); } }
              out();
            }
          }
          seg = [];
        };
        for (let i = i0; i <= i1; i++) {
          const h = heightAt(r, j, i, st);
          if (h == null) { flush(); continue; }
          seg.push([A.x + dx * i, A.y + dy * i, h]);
        }
        flush();
      }
    }
    cx.globalCompositeOperation = 'source-over';
  }
  // 분계선: 지도 위에 직접 그린다. "흰 선" 자막 때 한 번 굵어진다
  const lp = linePulse ? (performance.now() - linePulse) / 1000 : 9, k = lp < 3.2 ? Math.sin(Math.min(1, lp / 3.2) * Math.PI) : 0;
  cx.strokeStyle = '#ffffff'; cx.lineWidth = 1.6 + 2.4 * k; cx.shadowColor = 'rgba(255,255,255,.9)'; cx.shadowBlur = 4 + 14 * k;
  // 분계선의 수천 점을 프레임마다 지도에 묻지 않는다: 두 점만 물어 축척을 구하고 나머지는 같은 식(메르카토르)으로 계산한다. 지도가 돌거나 기울면 예전 방식(jmj 제안, 로컬 시험)
  const flat = !m.getBearing() && !m.getPitch(), o = m.project([127, 38]), e = m.project([128, 38]), kx = e.x - o.x, ky = kx * 180 / Math.PI, y38 = mercY(38);
  mdlM ??= mdl.map(line => line.map(p => [p[0] - 127, mercY(p[1])]));
  mdl.forEach((line, li) => { cx.beginPath(); line.forEach((p, n) => {
    let x, y; if (flat) { const q = mdlM[li][n]; x = o.x + q[0] * kx; y = o.y - (q[1] - y38) * ky; } else { const q = m.project(p); x = q.x; y = q.y; }
    n ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); });
  cx.shadowBlur = 0;
  return st.slot;
}

let mapSaved = null, wantNight = false;
// 바탕 지도를 밤하늘 톤으로(영상과 밤하늘 둘러보기에서 쓴다). 지명·도로·건물은 끄고 바다·강·경계만 남긴다
let listening = false;
function applyNight(m) {   // 아직 바꾸지 않은 바탕 층만 바꾼다(바탕 지도가 늦게, 여러 번 나눠 들어와도 매번 맞춘다)
  let st = null; try { st = m.getStyle(); } catch { return; }
  if (!st?.layers) return;
  const done = new Set(mapSaved.map(x => x[0]));
  for (const l of st.layers) {
    const src = l['source-layer'] || '', id = l.id;
    if (done.has(id)) continue;
    if (l.type === 'background') {
      mapSaved.push([id, 'visible', 'background', m.getPaintProperty(id, 'background-color'), null]); m.setPaintProperty(id, 'background-color', '#121d3f'); continue;
    }
    if (!l.source || l.source === 'radar' || id.startsWith('glow-') || ['dmz', 'zones', 'river'].includes(l.source) || !src) continue;   // 앱이 얹은 층은 그대로
    const keep = (l.type === 'fill' && src === 'water') || (l.type === 'line' && (src === 'waterway' || src === 'boundary'));
    mapSaved.push([id, m.getLayoutProperty(id, 'visibility') ?? 'visible', l.type, keep ? m.getPaintProperty(id, `${l.type}-color`) : null, keep && l.type === 'line' ? m.getPaintProperty(id, 'line-opacity') : null]);
    if (!keep) { m.setLayoutProperty(id, 'visibility', 'none'); continue; }
    if (l.type === 'fill') m.setPaintProperty(id, 'fill-color', '#050a18');
    else if (src === 'waterway') m.setPaintProperty(id, 'line-color', '#050a18');
    else { m.setPaintProperty(id, 'line-color', '#3a4a7a'); m.setPaintProperty(id, 'line-opacity', 0.7); }
  }
}
export function nightMap(on) {
  wantNight = on;
  const m = mapOf(); if (!m) return;
  if (!listening) { listening = true; m.on('styledata', () => { if (wantNight && mapSaved) applyNight(m); }); }
  if (on) { mapSaved ??= []; applyNight(m);
  } else if (!on && mapSaved) {
    for (const [id, vis, type, col, op] of mapSaved) {
      if (!m.getLayer(id)) continue;
      m.setLayoutProperty(id, 'visibility', vis);
      if (col != null) m.setPaintProperty(id, `${type === 'background' ? 'background' : type}-color`, col);
      if (col != null && type === 'line') m.setPaintProperty(id, 'line-opacity', op ?? 1);   // 바꿨던 선만 되돌린다
    }
    mapSaved = null;
  }
}
function caption(key) {
  if (key === capKey) return;
  capKey = key;
  el.querySelector('.cap').innerHTML = key ? `<p>${t(key, vars())}</p>` : '';
}
function toGame() {
  if (!titleAt) { stopFilm(); return set({ screen: 'mission' }); }
  const h = document.querySelector('#top h1'), from = titleEl.querySelector('h2').getBoundingClientRect(), to = h.getBoundingClientRect();
  const k = to.height / from.height;
  titleEl.classList.add('leaving');
  titleEl.querySelector('h2').style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${k})`;
  setTimeout(() => { stopFilm(); set({ screen: 'mission' }); }, 900);
}
function buttons() {
  const ended = cue === CUES.length - 1;
  el.querySelector('.acts').innerHTML = ended
    ? `<button type="button" class="quiet" data-replay>${t('film.replay')}</button>
       <button type="button" class="primary" data-game>${t('film.start')}</button>
       <button type="button" class="quiet" data-explore>${t('film.explore')}</button>
       <span class="soon">${held || left < 0 ? '' : t('film.soon', { n: left })}</span>`
    : '';
  skipEl.textContent = t('film.skipShort'); skipEl.hidden = ended;   // 영상 중에는 오른쪽 아래 구석의 작은 '건너뛰기'
}
function setTicks(slot) { [...ticks.children].forEach((e, i) => { e.classList.toggle('on', i <= slot); e.classList.toggle('now', i === slot); }); }

export function stopFilm() {
  titleAt = 0; titleEl.classList.remove('on', 'leaving'); titleEl.querySelector('h2').style.transform = '';
  if (!raf) return;
  cancelAnimationFrame(raf); raf = 0; stop();
  glow(1); set({ nightFrame: null }); nightMap(false);
}

const clock = () => ((paused ? pausedAt : performance.now()) - startedAt) / 1000;
function music(fromT) {   // 영상 시각 fromT 부터 음악을 다시 튼다(멈춤·장면 점프 뒤)
  const all = longScore(intro.LEN + LEAVE + 2), ev = all.events.filter(e => e.time >= fromT).map(e => ({ ...e, time: e.time - fromT }));
  play({ ...all, duration: all.duration - fromT, events: ev });
}
function setPaused(on) {
  if (!raf || on === !!paused) return;
  if (on) { paused = 1; pausedAt = performance.now(); stop(); }
  else { startedAt += performance.now() - pausedAt; paused = 0; music(clock()); }
  ctrl();
}
function jump(toT) {   // 장면 처음으로: 시계를 옮기고, 자막·카메라를 그 장면에서 다시 정한다
  const now = paused ? pausedAt : performance.now();
  startedAt = now - toT * 1000; cue = -1; capKey = null; jumped = true;   // capKey null: 빈 자막('')으로 가도 앞 자막을 지운다
  titleAt = 0; titleEl.classList.remove('on'); left = -1; held = false;
  if (!paused) music(toT);
}
let jumped = false, waveAt = 0;
const fitAll = ms => mapOf()?.fitBounds([[125.8, 37.15], [129.1, 39.0]], { padding: { top: 70, bottom: 190, left: 40, right: 40 }, duration: ms });   // 한반도 전체(마무리 장면)
function skipToEnd() {   // 건너뛰기: 게임으로 바로 가지 않고 제목과 세 단추가 있는 마지막 장면에 멈춘다
  jump(intro.LEN + CUES[CUES.length - 1].at); held = true;   // held: 저절로 게임으로 넘어가지 않는다
  fitAll(700);
}
function chapters() {   // [이름, 영상 시각(초)]
  const L = intro.LEN, at = id => L + CUES.find(c => c.ch === id).at;
  return [[t('film.chGlobe'), 0.01], ...['paju', 'yeoncheon', 'cheorwon', 'hwacheon', 'yanggu'].map(id => [t('region.' + id), at(id)]), [t('night.all'), at('end')]];
}
function ctrl() {
  const box = el.querySelector('.ctrl'); if (!box) return;
  const T = clock(), cs = chapters();
  let cur = 0; cs.forEach(([, at], i) => { if (T >= at - 0.05) cur = i; });
  const icon = paused ? '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2.5" y="1.5" width="2.4" height="9" rx=".6" fill="currentColor"/><rect x="7.1" y="1.5" width="2.4" height="9" rx=".6" fill="currentColor"/></svg>';
  box.innerHTML = `<button type="button" class="pp" data-pause aria-label="${t(paused ? 'film.resume' : 'film.pause')}">${icon}</button>`
    + cs.map(([n, at], i) => `<button type="button" class="chap${i === cur ? ' now' : ''}" data-jump="${at}" aria-current="${i === cur}">${n}</button>`).join('');
  box.dataset.cur = cur;
}
function tick() {
  raf = requestAnimationFrame(tick);
  const T = clock(), L = intro.LEN;
  { const cs = chapters(); let cur = 0; cs.forEach(([, at], i) => { if (T >= at - 0.05) cur = i; }); if (String(cur) !== el.querySelector('.ctrl')?.dataset.cur) ctrl(); }
  document.body.dataset.filmPart = T < L ? 'intro' : 'waves';
  if (T < L) {
    intro.frame(T); caption(intro.caption()); cx.clearRect(0, 0, innerWidth, innerHeight);
    tint.style.opacity = smooth(L - 1.3, L - 0.1, T) * (mapSaved ? 0.18 : 1);
    el.querySelector('.bar i').style.width = '0%';
    return;
  }
  { const n = performance.now(); if (n - waveAt < 30) return; waveAt = n; }   // 물결 장면은 초당 30번만 다시 그린다(지구 도입은 매 프레임 그대로). 그리기 부하를 절반으로(jmj 제안, 로컬 시험)
  intro.frame(T); tint.style.opacity = mapSaved ? 0.18 : 1;
  const s = T - L;
  let k = 0; while (k + 1 < CUES.length && s >= CUES[k + 1].at) k++;
  if (k !== cue) {
    const from = CUES[cue]?.cam; cue = k; const c = CUES[k];
    if (c.cam && (c.cam !== from || jumped)) {
      if (c.ch === 'end') fitAll(jumped ? 700 : 3600);
      else go(c.cam, jumped ? 700 : k === 0 ? 0 : 3200);
    }
    jumped = false;
    if (c.line) linePulse = performance.now();
    caption(c.cap); buttons();
    if (c.title) { titleAt = performance.now(); titleEl.classList.add('on'); }
  }
  setTicks(drawWaves(s));
  if (titleAt && CH) {   // 글자 춤: 물결의 끝없는 되풀이와 같은 박자로 관측을 넘긴다
    const tt = (s - GROW[1]) / LOOP;
    letters.forEach((el, i) => {
      const a = CH[i % 5], p = ((tt + i * 0.35) % SLOTS + SLOTS) % SLOTS, i0 = Math.floor(p), f = p - i0;
      const v = a[i0] + (a[(i0 + 1) % SLOTS] - a[i0]) * ((1 - Math.cos(Math.PI * f)) / 2);
      el.style.transform = `translateY(${(-v * 18).toFixed(1)}px)`;
      el.style.opacity = (0.55 + v * 0.45).toFixed(2);
    });
  }
  el.querySelector('.bar i').style.width = `${Math.min(100, s / END * 100).toFixed(1)}%`;
  if (s >= END) {
    const remain = Math.max(0, Math.ceil(LEAVE - s));
    if (remain !== left) { left = remain; buttons(); }
    if (s >= LEAVE && !held && !titleEl.classList.contains('leaving')) toGame();
  }
}

// 게임에서 '처음으로': 영상의 마지막 제목 장면(제목과 게임 시작·영상 다시 보기·밤하늘 둘러보기)으로 돌아간다
export async function openTitle() {
  await startFilm();
  if (state.screen === 'night' && state.nightMode === 'film') skipToEnd();
}

export async function startFilm() {
  if (state.screen !== 'night' || state.nightMode !== 'film') set({ screen: 'night', nightMode: 'film', evidenceAt: null, landPlay: false });
  stopFilm();
  cue = -1; capKey = ''; left = -1; held = false; linePulse = 0; paused = 0; jumped = false;
  glow(0); go('all', 0); buttons(); caption(''); nightMap(true);
  const playing = play(longScore(intro.LEN + LEAVE + 2));   // 누른 순간에 소리를 시작해야 브라우저가 막지 않는다
  await load();
  if (state.screen !== 'night' || state.nightMode !== 'film') return;
  startedAt = playing;
  raf = requestAnimationFrame(tick);
}

// 왼쪽 위 제목(#top h1): 영상 끝에서 춤추던 큰 제목이 이 자리에 앉은 뒤에도, 같은 실측 리듬(다섯 지역 물결의 평균)으로
// 글자마다 아주 작게 오르내린다. 게임과 둘러보기에서만, 움직임 줄이기 설정이면 멈춘 채로 둔다(hdk)
let cornerRaf = 0, cornerLetters = null, cornerAt = 0;
function cornerSetup() {
  const h = document.querySelector('#top h1'); if (!h || cornerLetters) return;
  const text = h.textContent.trim(); h.setAttribute('aria-label', text);
  h.innerHTML = [...text].map(ch => (ch === ' ' ? ' ' : `<span class="cl" aria-hidden="true">${ch}</span>`)).join('');
  cornerLetters = [...h.querySelectorAll('.cl')];
}
function cornerTick() {
  cornerRaf = requestAnimationFrame(cornerTick);
  if (!CH || !cornerLetters) return;
  const n = performance.now(); if (n - cornerAt < 30) return; cornerAt = n;   // 작은 흔들림이라 초당 30번이면 충분하다(jmj 제안, 로컬 시험)
  const tt = n / 1000 / (LOOP * 1.6);   // 영상 끝 제목보다 조금 느리게
  cornerLetters.forEach((el, i) => {
    const a = CH[i % 5], p = ((tt + i * 0.35) % SLOTS + SLOTS) % SLOTS, i0 = Math.floor(p), f = p - i0;
    const v = a[i0] + (a[(i0 + 1) % SLOTS] - a[i0]) * ((1 - Math.cos(Math.PI * f)) / 2);
    el.style.transform = `translateY(${(-v * 6).toFixed(2)}px)`;
    el.style.opacity = (0.6 + v * 0.4).toFixed(2);
  });
}
function cornerApply() {
  const on = (state.screen === 'mission' || (state.screen === 'night' && state.nightMode === 'explore')) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (on && !cornerRaf) { cornerSetup(); load(); cornerTick(); }
  else if (!on && cornerRaf) { cancelAnimationFrame(cornerRaf); cornerRaf = 0; cornerLetters?.forEach(e => { e.style.transform = ''; e.style.opacity = ''; }); }
}

export function initFilm() {
  subscribe((s, prev) => { if (s.screen !== prev.screen || s.nightMode !== prev.nightMode) cornerApply(); });
  document.body.append(tint, cv, titleEl, skipEl);
  skipEl.addEventListener('click', () => skipToEnd());
  ticks.innerHTML = LABELS.map(l => `<div class="t" title="${l}"><i></i></div>`).join('');   // 날짜 글자 없이 눈금만(통과 11번)
  document.body.append(ticks);
  resize(); addEventListener('resize', resize);
  el.innerHTML = `<div class="cap" aria-live="polite"></div>
    <div class="acts"></div><div class="ctrl" aria-label="${t('film.ctrlAria')}"></div><div class="bar" aria-hidden="true"><i></i></div>`;
  el.addEventListener('click', e => {
    if (e.target.closest('[data-game]')) return toGame();
    if (e.target.closest('[data-replay]')) return startFilm();
    if (e.target.closest('[data-pause]')) return setPaused(!paused);
    const j = e.target.closest('[data-jump]'); if (j) return jump(+j.dataset.jump);
    if (e.target.closest('[data-explore]')) { stopFilm(); return set({ nightMode: 'explore' }); }
  });
  addEventListener('keydown', e => { if (e.code === 'Space' && raf && state.screen === 'night' && state.nightMode === 'film' && !e.target.closest('button,input')) { e.preventDefault(); setPaused(!paused); } });
  // 끝난 뒤 단추 위에 머무르면 자동으로 넘어가지 않는다
  el.addEventListener('pointerenter', () => { if (cue === CUES.length - 1 && !held) { held = true; buttons(); } }, true);
  subscribe((s, prev) => {
    if (raf && (s.screen !== 'night' || s.nightMode !== 'film')) stopFilm();   // 화면을 떠나면 멈춘다
    if (s.lang !== prev.lang) { const k = capKey; capKey = ''; caption(k); buttons(); ctrl(); el.querySelector('.ctrl')?.setAttribute('aria-label', t('film.ctrlAria')); }   // 장면 이름·단추 설명도 언어를 따른다
  });
  load();
  // 오프닝 없이 밤하늘에서 시작하는 경우(오프닝 자료가 없을 때)에는 곧바로 튼다
  if (state.screen === 'night' && state.nightMode === 'film') startFilm();
}
