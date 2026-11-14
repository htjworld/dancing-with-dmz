// 철원 평야 · 사람의 눈: 민통선 논의 선을 본 뒤, 3 km 옆 DMZ 안 땅의 선을 직접 그려 본다. 맞고 틀림은 없다.
import { state, set, data, zone, addKey } from '../state.js';
import { STOPS, label } from '../stops.js';
import { change, forestChange } from '../calc.js';
import { missionReady, canTake, fillGuess, guessComplete, rangeOf } from '../missions.js';
import { t, dateText, noteText } from '../i18n.js';

const ID = 'cheorwon', PADDY = 'cheorwon-paddy', DMZ = 'cheorwon-dmz', FOREST = 'cheorwon-forest', NORTH = 'cheorwon-north';
const W = 300, H = 170, L = 30, R = 8, T = 12, B = 22;
const series = (id, f = change) => data.passes.map(p => f(zone(id), p.cycle));
const rel = id => data.passes.map(p => forestChange(data.zones, zone(id), p.cycle));

// 차트의 눈금: 세 구역의 값이 모두 들어가는 범위(그릴 여유를 위해 위아래 0.6 dB 를 더한다)
function scale() {
  const all = [PADDY, DMZ, FOREST].flatMap(id => series(id)).filter(v => v != null), n = data.passes.length;
  const lo = Math.min(...all, 0) - .6, hi = Math.max(...all, 0) + .6;
  return { n, lo, hi, x: c => L + (W - L - R) * c / (n - 1), y: v => T + (H - T - B) * (hi - v) / (hi - lo),
    cycleAt: px => Math.round((px - L) / (W - L - R) * (n - 1)), valueAt: py => Math.max(lo, Math.min(hi, hi - (py - T) / (H - T - B) * (hi - lo))) };
}
// 값이 있는 칸끼리만 잇는다(자료가 없는 통과에서는 선을 끊는다)
function path(vals, s) {
  let d = '', pen = false;
  vals.forEach((v, c) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${s.x(c).toFixed(1)},${s.y(v).toFixed(1)}`; pen = true; });
  return d;
}

function chart() {
  const s = scale(), drawing = !state.revealed;
  const rest = data.passes.filter(p => p.rest).map(p => `<rect x="${s.x(p.cycle) - 9}" y="${T}" width="18" height="${H - T - B}" class="rest"/>`).join('');
  const ticks = [Math.ceil(s.lo), 0, Math.floor(s.hi)].map(v => `<text x="${L - 5}" y="${s.y(v) + 3}" class="tick" text-anchor="end">${v > 0 ? '+' : ''}${v}</text><line x1="${L}" x2="${W - R}" y1="${s.y(v)}" y2="${s.y(v)}" class="grid${v === 0 ? ' zero' : ''}"/>`).join('');
  return `<svg class="chart${drawing ? ' draw' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('cheorwon.chartAria')}">
    ${rest}${ticks}
    <text x="${L}" y="${H - 5}" class="tick">${dateText(data.passes[0].date)}</text><text x="${W - R}" y="${H - 5}" class="tick" text-anchor="end">${dateText(data.passes[s.n - 1].date)}</text>
    <text x="${L}" y="9" class="tick">${t('common.axisChange')}</text>
    <path d="${path(series(PADDY), s)}" class="l-paddy"/>
    ${state.revealed ? `<path d="${path(series(FOREST), s)}" class="l-forest"/><path d="${path(series(DMZ), s)}" class="l-dmz"/>` : ''}
    <path id="guess-path" d="${path(state.guess || [], s)}" class="l-guess"/></svg>
    <p class="legend"><span class="k-paddy">━ ${t('cheorwon.legendPaddy')}</span> <span class="k-guess">━ ${t('cheorwon.legendGuess')}</span>${state.revealed ? ` <span class="k-dmz">━ ${t('cheorwon.legendDmz')}</span> <span class="k-forest">┅ ${t('cheorwon.legendForest')}</span>` : ''}</p>`;
}

// 그리는 동안에는 화면 전체를 다시 그리지 않고 선만 고친다. 손을 떼면 상태에 저장한다.
export function bind(panel) {
  let draft = null, last = null;
  const at = e => {
    const svg = panel.querySelector('svg.draw'); if (!svg) return null;
    const r = svg.getBoundingClientRect(), s = scale();
    return { k: Math.max(1, Math.min(s.n - 1, s.cycleAt((e.clientX - r.left) / r.width * W))), d: s.valueAt((e.clientY - r.top) / r.height * H) };
  };
  panel.addEventListener('pointerdown', e => {
    if (state.stop !== ID || !e.target.closest('svg.draw')) return;
    e.preventDefault();
    const p = at(e); last = p; draft = fillGuess(state.guess || Array(data.passes.length).fill(null), p, p);
    panel.querySelector('#guess-path').setAttribute('d', path(draft, scale()));
  });
  panel.addEventListener('pointermove', e => {
    if (!draft) return;
    const p = at(e); if (!p) return;
    draft = fillGuess(draft, last, p); last = p;
    panel.querySelector('#guess-path')?.setAttribute('d', path(draft, scale()));
  });
  const end = () => { if (!draft) return; const g = draft; draft = last = null; set({ guess: g, note: null }); };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
}

function discovery() {
  const r = id => rangeOf(rel(id)), paddy = r(PADDY), dmz = r(DMZ), north = r(NORTH);
  const real = series(DMZ), g = state.guess, both = g ? real.map((v, c) => (v != null && g[c] != null ? Math.abs(v - g[c]) : null)).filter(v => v != null) : [];
  const mine = both.length ? t('cheorwon.foundMine', { diff: (both.reduce((a, b) => a + b, 0) / both.length).toFixed(1) }) : '';
  const main = t(dmz <= paddy / 2 ? 'cheorwon.foundApart' : 'cheorwon.foundUnclear', { dmz: dmz.toFixed(1), paddy: paddy.toFixed(1) });
  return `<div class="found"><h3>${t('common.found')}</h3>
    <p>${mine}${main}</p>
    <p>${t('cheorwon.foundNorth', { north: north.toFixed(1) })}</p>
    <p>${t('cheorwon.foundWhy')}</p>
    <p class="fine">${t('cheorwon.foundFine')}</p></div>`;
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), full = guessComplete(state.guess, zone(DMZ));
  const allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  return `${chart()}
    ${state.revealed ? '' : `<p class="hint">${t('cheorwon.hint')}</p>
      <div class="acts"><button type="button" data-act="reveal" ${full ? '' : 'disabled'}>${t('cheorwon.reveal')}</button>
      <button type="button" data-act="clear" ${state.guess ? '' : 'disabled'}>${t('cheorwon.clear')}</button></div>
      <button type="button" class="ghost" data-act="skip">${t('cheorwon.skip')}</button>`}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${noteText(state.note)}</p>` : ''}
    ${ready ? discovery() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('cheorwon.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('cheorwon.got')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'hwacheon'), 'name') })}</button>` : ''}`;
}

export function act(name) {
  if (name === 'clear') set({ guess: null });
  else if (name === 'reveal' && guessComplete(state.guess, zone(DMZ))) set({ revealed: true, seen: addKey(ID, 'drawn'), note: null });
  else if (name === 'skip') set({ revealed: true, seen: addKey(ID, 'drawn'), note: null });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID], note: null });
  else if (name === 'next') set({ stop: 'hwacheon', note: null });
}
