// 철원 평야 · 사람의 눈: 민통선 논의 선을 본 뒤, 3 km 옆 DMZ 안 땅의 선을 직접 그려 본다. 맞고 틀림은 없다.
import { state, set, data, zone, addKey, mdK } from '../state.js';
import { STOPS } from '../stops.js';
import { change, forestChange } from '../calc.js';
import { missionReady, canTake, fillGuess, guessComplete, rangeOf } from '../missions.js';

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
  return `<svg class="chart${drawing ? ' draw' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="민통선 논의 신호 변화 위에 DMZ 안 땅의 선을 그리는 차트">
    ${rest}${ticks}
    <text x="${L}" y="${H - 5}" class="tick">${mdK(data.passes[0].date)}</text><text x="${W - R}" y="${H - 5}" class="tick" text-anchor="end">${mdK(data.passes[s.n - 1].date)}</text>
    <text x="${L}" y="9" class="tick">첫 관측 대비 변화 (HH, dB)</text>
    <path d="${path(series(PADDY), s)}" class="l-paddy"/>
    ${state.revealed ? `<path d="${path(series(FOREST), s)}" class="l-forest"/><path d="${path(series(DMZ), s)}" class="l-dmz"/>` : ''}
    <path id="guess-path" d="${path(state.guess || [], s)}" class="l-guess"/></svg>
    <p class="legend"><span class="k-paddy">━ 민통선 논</span> <span class="k-guess">━ 내가 그린 선</span>${state.revealed ? ' <span class="k-dmz">━ DMZ 안 저지대(실제)</span> <span class="k-forest">┅ 숲</span>' : ''}</p>`;
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
  const mine = both.length ? `그린 선과 실제 선의 차이는 평균 ${(both.reduce((a, b) => a + b, 0) / both.length).toFixed(1)} dB였습니다. ` : '';
  const main = dmz <= paddy / 2
    ? `DMZ 안 저지대는 숲과 거의 같이 움직였고(숲을 뺀 변동 폭 ${dmz.toFixed(1)} dB), 논만 따로 크게 움직였습니다(${paddy.toFixed(1)} dB).`
    : `숲을 뺀 변동 폭은 논이 ${paddy.toFixed(1)} dB, DMZ 안 저지대가 ${dmz.toFixed(1)} dB였습니다. 이 자료에서는 두 땅의 차이가 뚜렷하지 않습니다.`;
  return `<div class="found"><h3>이 지역에서 본 것</h3>
    <p>${mine}${main}</p>
    <p>분계선 너머 북쪽의 경작지로 보이는 곳도 ${north.toFixed(1)} dB를 오르내렸습니다.</p>
    <p>가능한 설명: 사람이 물을 대고 벼를 기르고 거두는 땅은 한 계절 동안 크게 변하고, 사람이 들어가지 않는 땅은 숲의 리듬을 따를 수 있습니다. 가을에 논의 신호가 내려간 것이 수확 때문이라고 이 자료만으로 단정할 수는 없습니다.</p>
    <p class="fine">구역은 팀이 레이더 영상에서 고른 사각형입니다. "논", "저지대", "경작지"는 영상에서 그렇게 보인다는 뜻이며 현장에서 확인한 것이 아닙니다.</p></div>`;
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), full = guessComplete(state.guess, zone(DMZ));
  const allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  return `${chart()}
    ${state.revealed ? '' : `<p class="hint">초록 선은 민통선 논입니다. 3 km 옆, 사람이 들어가지 않는 DMZ 안 땅은 어땠을까요? 차트 위를 왼쪽에서 오른쪽으로 끌어 선을 그려 보세요.</p>
      <div class="acts"><button type="button" data-act="reveal" ${full ? '' : 'disabled'}>실제 선과 겹쳐 보기</button>
      <button type="button" data-act="clear" ${state.guess ? '' : 'disabled'}>지우기</button></div>
      <button type="button" class="ghost" data-act="skip">그리지 않고 보기</button>`}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${state.note.text}</p>` : ''}
    ${ready ? discovery() : ''}
    ${ready && !got ? (allowed ? '<button type="button" class="primary" data-act="take">♪ 철원 조각 받기</button>'
      : '<p class="note no">먼저 앞 지역의 조각을 모아 주세요. 조각은 서쪽부터 차례로 이어집니다.</p>') : ''}
    ${got ? `<p class="note ok">철원 조각(베이스)을 받았습니다. 선이 철원까지 이어졌습니다.</p>
      <button type="button" class="primary" data-act="next">다음: 화천 백암산 →</button>` : ''}`;
}

export function act(name) {
  if (name === 'clear') set({ guess: null });
  else if (name === 'reveal' && guessComplete(state.guess, zone(DMZ))) set({ revealed: true, seen: addKey(ID, 'drawn'), note: null });
  else if (name === 'skip') set({ revealed: true, seen: addKey(ID, 'drawn'), note: null });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID], note: null });
  else if (name === 'next') set({ stop: 'hwacheon', note: null });
}
