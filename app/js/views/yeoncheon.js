// 연천 임진강 · 물의 눈: 레이더 영상의 검은 띠(강)를 손으로 따라 긋는다. 물 위를 지나는 동안 자국이 빛나고 소리가 난다.
import { state, set, data } from '../state.js';
import { STOPS, label } from '../stops.js';
import { missionReady, riverHit, inside, canTake, meters } from '../missions.js';
import { blip } from '../sound.js';
import { t, dateText, noteText } from '../i18n.js';
import { foundCard } from './found.js';
import { crop } from './crop.js';

const ID = 'yeoncheon';
const NEED = 0.3;        // 강으로 보이는 화소의 이만큼을 지나가면 완료
const NEAR = 170;        // 손이 강에서 이 거리(m) 안이면 강 위로 본다
const WIDE = 260;        // 한 번 지나가면 이 거리(m) 안의 강 화소를 지나간 것으로 센다
const STEP = 90;         // 자국을 남기는 간격(m)
const pct = v => `${Math.round(v * 100)}%`;
const covered = new Set();   // 지나간 강 화소(번호)
let strokeOn = 0, strokeN = 0, lastBlip = 0;

const progress = () => Math.min(1, covered.size / (data.river.points.length * NEED));
const note = (ok, key, vars) => { const say = () => t(key, vars); return { ok, text: say(), say }; };   // 문구는 보여 줄 때의 언어로 만든다

// 지도 위에서 손이 지나간 자리(screens/gamemap.js 가 알려 준다). phase: start | move | end
function trace({ lng, lat, phase }) {
  if (state.stop !== ID || state.screen !== 'mission' || missionReady(ID, state.seen[ID])) return;
  if (phase === 'end') {   // 한 획이 거의 다 강 밖이었으면 한마디 해 준다
    if (strokeN >= 4 && strokeOn / strokeN < .15) set({ note: note(false, 'yeoncheon.strokeMiss'), misses: state.misses + 1 });
    strokeOn = strokeN = 0;
    return;
  }
  const tr = state.riverTrace, last = tr[tr.length - 1];
  if (phase === 'move' && last && meters(last[0], last[1], lng, lat) < STEP) return;
  const stop = STOPS.find(s => s.id === ID), pts = data.river.points;
  const on = inside(stop.bounds, lng, lat) && riverHit(pts, lng, lat, NEAR);
  strokeN++;
  if (on) {
    strokeOn++;
    pts.forEach((p, i) => { if (!covered.has(i) && meters(p[0], p[1], lng, lat) <= WIDE) covered.add(i); });
    const now = performance.now();
    if (now - lastBlip > 110) { lastBlip = now; blip(392 * 2 ** progress(), .16, .18); }   // 따라갈수록 음이 올라간다
  }
  const next = [...tr.slice(-500), [lng, lat, on ? 1 : 0]];
  if (progress() >= 1) set({ riverTrace: next, seen: { ...state.seen, [ID]: ['river1', 'river2', 'river3'] }, riverHint: false, note: note(true, 'yeoncheon.hitAll') });
  else set({ riverTrace: next, note: on ? null : state.note });   // 강 위에 올라서면 앞서 받은 한마디를 걷는다
}

// 강과 그 둘레에서 어둡게 보인 화소의 비율(날짜별)과 직전 3일 강수
function days() {
  const rain = data.rain.regions[ID].passes;
  return data.river.dark_ratio.map(r => ({ ...r, mm: rain.find(x => x.date === r.date)?.mm_3day ?? null, cycle: data.passes.find(p => p.date === r.date)?.cycle }));
}

function observation() {
  const d = days(), lo = d.reduce((a, b) => (b.dark_ratio < a.dark_ratio ? b : a)), hi = d.reduce((a, b) => (b.dark_ratio > a.dark_ratio ? b : a));
  const wet = d.filter(x => x.mm != null).reduce((a, b) => (b.mm > a.mm ? b : a)), i = d.indexOf(wet);
  const near = [d[i - 1], d[i + 1]].filter(Boolean), lower = near.length && near.every(n => wet.dark_ratio < n.dark_ratio);
  const max = hi.dark_ratio;
  let text = t('yeoncheon.obsRange', { lo: pct(lo.dark_ratio), hi: pct(hi.dark_ratio) });
  text += t(lower ? 'yeoncheon.obsWetLower' : 'yeoncheon.obsWetNotLower', { date: dateText(wet.date), mm: wet.mm.toFixed(0), pct: pct(wet.dark_ratio), near: near.map(n => pct(n.dark_ratio)).join(', ') });
  if (lo.date !== wet.date) text += lo.mm == null ? t('yeoncheon.obsLowestUnknown', { date: dateText(lo.date) }) : t('yeoncheon.obsLowest', { date: dateText(lo.date), mm: lo.mm.toFixed(0) });
  // 강이 가장 덜 검게 찍힌 날과 가장 검게 찍힌 날의 사진을 나란히 놓는다(강이 지나는 범위만 잘라서)
  const xs = data.river.points.map(p => p[0]), ys = data.river.points.map(p => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const shot = (x, key) => { const c = crop(ID, x.date, box, .04, 'hh', { contrast: 1.5, bright: .9 }); return `<figure><span class="pic" style="aspect-ratio:${c.ar.toFixed(3)};${c.style}"></span>
      <figcaption><b>${t(key)}</b>${dateText(x.date)} · ${pct(x.dark_ratio)}</figcaption></figure>`; };
  const bars = `<div class="twoshots">${shot(lo, 'yeoncheon.shotLo')}${shot(hi, 'yeoncheon.shotHi')}</div>
    <p class="fine">${t('yeoncheon.shotsFine')}</p>`;
  return foundCard({
    head: t('yeoncheon.foundHead'),
    body: [t('yeoncheon.foundSub', { lo: pct(lo.dark_ratio), hi: pct(hi.dark_ratio) }), t('yeoncheon.foundWhy')],
    extra: bars,
    more: [text, t('yeoncheon.foundCaveat')],
  });
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID);
  const order = STOPS.map(s => s.id), allowed = canTake(ID, state.fragments, order), p = ready ? 1 : progress();
  return `
    <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}" aria-label="${t('yeoncheon.meterAria')}"><i style="width:${(p * 100).toFixed(0)}%"></i></div>
    <p class="today">${t(ready ? 'yeoncheon.meterDone' : 'yeoncheon.meter', { pct: Math.round(p * 100) })}</p>
    ${ready ? '' : `<p class="hint">${t('yeoncheon.hint')}</p>
      <div class="acts">${state.riverTrace.length ? `<button type="button" data-act="clear">${t('yeoncheon.clear')}</button>` : ''}
      ${state.misses >= 2 && !state.riverHint ? `<button type="button" data-act="hint">${t('yeoncheon.hintBtn')}</button>` : ''}</div>`}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${noteText(state.note)}</p>` : ''}
    ${ready ? observation() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('yeoncheon.take')}</button>`
      : `<p class="note no">${t('yeoncheon.needPaju')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('yeoncheon.got')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'cheorwon'), 'name') })}</button>` : ''}`;
}

export function bind() {
  document.addEventListener('dmz-map-trace', e => trace(e.detail));
}

export function act(name, el) {
  if (name === 'hint') set({ riverHint: true });
  else if (name === 'clear') { covered.clear(); set({ riverTrace: [], note: null }); }
  else if (name === 'wet') set({ cycle: +el.dataset.cycle, visited: [...state.visited, +el.dataset.cycle] });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID], note: null });
  else if (name === 'next') set({ stop: 'cheorwon', note: null });
}
