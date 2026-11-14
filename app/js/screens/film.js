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
  { at: 0, cap: 'film.c1', cam: 'all' }, { at: 5, cap: 'film.c2', cam: 'cheorwon' }, { at: 10, cap: 'film.paju', cam: 'paju' },
  { at: 16, cap: 'film.yeoncheon', cam: 'yeoncheon' }, { at: 21, cap: 'film.cheorwon', cam: 'cheorwon' },
  { at: 28, cap: 'film.hwacheon', cam: 'hwacheon' }, { at: 33, cap: 'film.yanggu', cam: 'yanggu' },
  { at: 38, cap: 'film.c6', cam: 'all', line: true }, { at: 44, cap: 'film.c7' }, { at: 49, cap: 'film.c8' },
];
const SHOW = [3, 6], GROW = [8, 38], END = 54, LEAVE = 60;   // 선이 나타나는 구간, 통과가 흐르는 구간, 끝, 게임으로 넘어가는 때
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
  ]).then(async ([ridges, dmz]) => {
    R = ridges.regions;
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
function drawWaves(s) {
  cx.clearRect(0, 0, innerWidth, innerHeight);
  const m = mapOf(); if (!m || !R) return -1;
  const st = waveState(s), show = smooth(SHOW[0], SHOW[1], s);
  if (show > 0) {
    cx.globalCompositeOperation = 'lighter';
    for (const r of Object.values(R)) {
      const c = r.corners;
      const p0 = m.project(geo(c, .5, .5 / r.ny)), p1 = m.project(geo(c, .5, 1.5 / r.ny));
      const rowPx = Math.hypot(p1.x - p0.x, p1.y - p0.y), step = Math.max(1, Math.ceil(5.5 / rowPx));
      const pxDb = Math.min(60, Math.max(5, rowPx * step * 2.2));
      for (let j = 0; j < r.ny; j += step) {
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
        for (let i = 0; i < r.nx; i++) {
          const h = heightAt(r, j, i, st);
          if (h == null) { flush(); continue; }
          const q = m.project(geo(c, (i + .5) / r.nx, (j + .5) / r.ny));
          seg.push([q.x, q.y, h]);
        }
        flush();
      }
    }
    cx.globalCompositeOperation = 'source-over';
  }
  // 분계선: 지도 위에 직접 그린다. "흰 선" 자막 때 한 번 굵어진다
  const lp = linePulse ? (performance.now() - linePulse) / 1000 : 9, k = lp < 3.2 ? Math.sin(Math.min(1, lp / 3.2) * Math.PI) : 0;
  cx.strokeStyle = '#ffffff'; cx.lineWidth = 1.6 + 2.4 * k; cx.shadowColor = 'rgba(255,255,255,.9)'; cx.shadowBlur = 4 + 14 * k;
  for (const line of mdl) { cx.beginPath(); line.forEach((p, n) => { const q = m.project(p); n ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y); }); cx.stroke(); }
  cx.shadowBlur = 0;
  return st.slot;
}

function caption(key) {
  if (key === capKey) return;
  capKey = key;
  el.querySelector('.cap').innerHTML = key ? `<p>${t(key, vars())}</p>` : '';
}
function buttons() {
  const ended = cue === CUES.length - 1;
  el.querySelector('.acts').innerHTML = ended
    ? `<button type="button" class="primary" data-game>${t('film.start')}</button>
       <button type="button" data-replay>${t('film.replay')}</button>
       <button type="button" data-explore>${t('film.explore')}</button>
       <span class="soon">${held || left < 0 ? '' : t('film.soon', { n: left })}</span>`
    : `<button type="button" class="quiet" data-game>${t('film.skip')}</button>`;
}
function setTicks(slot) { [...ticks.children].forEach((e, i) => { e.classList.toggle('on', i <= slot); e.classList.toggle('now', i === slot); }); }

export function stopFilm() {
  if (!raf) return;
  cancelAnimationFrame(raf); raf = 0; stop();
  glow(1); set({ nightFrame: null });
}

function tick() {
  raf = requestAnimationFrame(tick);
  const T = (performance.now() - startedAt) / 1000, L = intro.LEN;
  document.body.dataset.filmPart = T < L ? 'intro' : 'waves';
  if (T < L) {
    intro.frame(T); caption(intro.caption()); cx.clearRect(0, 0, innerWidth, innerHeight);
    tint.style.opacity = smooth(L - 1.3, L - 0.1, T);
    el.querySelector('.bar i').style.width = '0%';
    return;
  }
  intro.frame(T); tint.style.opacity = 1;
  const s = T - L;
  let k = 0; while (k + 1 < CUES.length && s >= CUES[k + 1].at) k++;
  if (k !== cue) {
    const from = CUES[cue]?.cam; cue = k; const c = CUES[k];
    if (c.cam && c.cam !== from) go(c.cam, k === 0 ? 0 : 3200);
    if (c.line) linePulse = performance.now();
    caption(c.cap); buttons();
  }
  setTicks(drawWaves(s));
  el.querySelector('.bar i').style.width = `${Math.min(100, s / END * 100).toFixed(1)}%`;
  if (s >= END) {
    const remain = Math.max(0, Math.ceil(LEAVE - s));
    if (remain !== left) { left = remain; buttons(); }
    if (s >= LEAVE && !held) { stopFilm(); set({ screen: 'mission' }); }
  }
}

export async function startFilm() {
  if (state.screen !== 'night' || state.nightMode !== 'film') set({ screen: 'night', nightMode: 'film', evidenceAt: null, landPlay: false });
  stopFilm();
  cue = -1; capKey = ''; left = -1; held = false; linePulse = 0;
  glow(0); go('all', 0); buttons(); caption('');
  const playing = play(longScore(intro.LEN + LEAVE + 2));   // 누른 순간에 소리를 시작해야 브라우저가 막지 않는다
  await load();
  if (state.screen !== 'night' || state.nightMode !== 'film') return;
  startedAt = playing;
  raf = requestAnimationFrame(tick);
}

export function initFilm() {
  document.body.append(tint, cv);
  ticks.innerHTML = LABELS.map(l => `<div class="t" title="${l}"><i></i></div>`).join('');   // 날짜 글자 없이 눈금만(통과 11번)
  document.body.append(ticks);
  resize(); addEventListener('resize', resize);
  el.innerHTML = `<div class="cap" aria-live="polite"></div>
    <div class="acts"></div><div class="bar" aria-hidden="true"><i></i></div>`;
  el.addEventListener('click', e => {
    if (e.target.closest('[data-game]')) { stopFilm(); return set({ screen: 'mission' }); }
    if (e.target.closest('[data-replay]')) return startFilm();
    if (e.target.closest('[data-explore]')) { stopFilm(); return set({ nightMode: 'explore' }); }
  });
  // 끝난 뒤 단추 위에 머무르면 자동으로 넘어가지 않는다
  el.addEventListener('pointerenter', () => { if (cue === CUES.length - 1 && !held) { held = true; buttons(); } }, true);
  subscribe((s, prev) => {
    if (raf && (s.screen !== 'night' || s.nightMode !== 'film')) stopFilm();   // 화면을 떠나면 멈춘다
    if (s.lang !== prev.lang) { const k = capKey; capKey = ''; caption(k); buttons(); }
    if (!s.sound && prev.sound && raf) stop();                                  // 소리만 끄면 그림은 계속 간다
  });
  load();
  // 오프닝 없이 밤하늘에서 시작하는 경우(오프닝 자료가 없을 때)에는 곧바로 튼다
  if (state.screen === 'night' && state.nightMode === 'film') startFilm();
}
