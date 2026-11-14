// 철원 평야 · 사람의 눈: 이름을 가린 두 땅(가, 나)을 같은 두 날짜에 찍은 사진으로 견주고, 더 많이 변한 땅을 고른다. 세 번 견준다.
// 다 고르면 어느 쪽이 사람이 농사짓는 논이고 어느 쪽이 DMZ 안의 땅인지 밝히고, 두 땅의 한 계절을 선으로 겹쳐 보여 준다.
import { state, set, data, zone, addKey, pass } from '../state.js';
import { STOPS, label } from '../stops.js';
import { level, change, forestChange } from '../calc.js';
import { missionReady, canTake, rangeOf } from '../missions.js';
import { t, dateText, noteText } from '../i18n.js';
import { blip } from '../sound.js';
import { foundCard } from './found.js';
import { crop } from './crop.js';

const ID = 'cheorwon', PADDY = 'cheorwon-paddy', DMZ = 'cheorwon-dmz', FOREST = 'cheorwon-forest', NORTH = 'cheorwon-north';
const ROUNDS = 3;
// 화면에 놓는 순서와 이름. 어느 쪽이 논인지는 다 고른 뒤에 밝힌다
const LANDS = [{ key: 'a', id: DMZ, name: 'cheorwon.landA' }, { key: 'b', id: PADDY, name: 'cheorwon.landB' }];
const W = 300, H = 170, L = 30, R = 8, T = 12, B = 22;
const series = (id, f = change) => data.passes.map(p => f(zone(id), p.cycle));
const rel = id => data.passes.map(p => forestChange(data.zones, zone(id), p.cycle));

// 견줄 날짜 쌍: 이어진 두 통과 가운데 두 땅의 변화 차이가 가장 컸던 세 쌍(날짜순). 어느 땅이 더 변했는지는 자료가 정한다
let memo = null;
function rounds() {
  if (memo) return memo;
  const dates = data.layers.regions[ID].dates;
  const ok = data.passes.filter(p => !p.rest && dates.includes(p.date) && level(zone(PADDY), p.cycle) != null && level(zone(DMZ), p.cycle) != null).map(p => p.cycle);
  const pairs = ok.slice(1).map((b, i) => {
    const a = ok[i], d = id => Math.abs(level(zone(id), b) - level(zone(id), a));
    return { a, b, paddy: d(PADDY), dmz: d(DMZ) };
  });
  memo = pairs.sort((x, y) => Math.abs(y.paddy - y.dmz) - Math.abs(x.paddy - x.dmz)).slice(0, ROUNDS).sort((x, y) => x.a - y.a);
  return memo;
}

function scale() {
  const all = [PADDY, DMZ, FOREST].flatMap(id => series(id)).filter(v => v != null), n = data.passes.length;
  const lo = Math.min(...all, 0) - .6, hi = Math.max(...all, 0) + .6;
  return { n, lo, hi, x: c => L + (W - L - R) * c / (n - 1), y: v => T + (H - T - B) * (hi - v) / (hi - lo) };
}
// 값이 있는 칸끼리만 잇는다(자료가 없는 통과에서는 선을 끊는다)
function path(vals, s) {
  let d = '', pen = false;
  vals.forEach((v, c) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${s.x(c).toFixed(1)},${s.y(v).toFixed(1)}`; pen = true; });
  return d;
}
// 다 고른 뒤에 보여 주는 두 땅의 한 계절
function chart() {
  const s = scale();
  const rest = data.passes.filter(p => p.rest).map(p => `<rect x="${s.x(p.cycle) - 9}" y="${T}" width="18" height="${H - T - B}" class="rest"/>`).join('');
  const ticks = [Math.ceil(s.lo), 0, Math.floor(s.hi)].map(v => `<text x="${L - 5}" y="${s.y(v) + 3}" class="tick" text-anchor="end">${v > 0 ? '+' : ''}${v}</text><line x1="${L}" x2="${W - R}" y1="${s.y(v)}" y2="${s.y(v)}" class="grid${v === 0 ? ' zero' : ''}"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('cheorwon.chartAria')}">
    ${rest}${ticks}
    <text x="${L}" y="${H - 5}" class="tick">${dateText(data.passes[0].date)}</text><text x="${W - R}" y="${H - 5}" class="tick" text-anchor="end">${dateText(data.passes[s.n - 1].date)}</text>
    <text x="${L}" y="9" class="tick">${t('common.axisChange')}</text>
    <path d="${path(series(FOREST), s)}" class="l-forest"/><path d="${path(series(DMZ), s)}" class="l-dmz"/><path d="${path(series(PADDY), s)}" class="l-paddy"/></svg>
    <p class="legend"><span class="k-paddy">━ ${t('cheorwon.legendPaddy')}</span> <span class="k-dmz">━ ${t('cheorwon.legendDmz')}</span> <span class="k-forest">┅ ${t('cheorwon.legendForest')}</span></p>`;
}

// 한 판: 두 땅을 위아래로 놓고, 땅마다 먼저 찍은 사진과 나중에 찍은 사진을 나란히 보여 준다
function round(r) {
  const from = pass(r.a).date, to = pass(r.b).date;
  return `<p class="today">${t('cheorwon.round', { n: state.cmpPicks.length + 1, total: ROUNDS })} · ${t('cheorwon.between', { from: dateText(from), to: dateText(to) })}</p>
    <div class="lands">${LANDS.map(l => {
    const b = zone(l.id).bounds, c0 = crop(ID, from, b), c1 = crop(ID, to, b);
    return `<button type="button" class="land" data-act="pick" data-land="${l.key}" aria-label="${t('cheorwon.pickAria', { name: t(l.name) })}">
        <b>${t(l.name)}</b>
        <span class="pair" style="--ar:${c0.ar.toFixed(3)}"><span class="pic" style="${c0.style}"></span><span class="pic" style="${c1.style}"></span></span></button>`;
  }).join('')}</div>
    <p class="hint">${t('cheorwon.hint')}</p>`;
}

function discovery() {
  const r = id => rangeOf(rel(id)), paddy = r(PADDY), dmz = r(DMZ), north = r(NORTH);
  const right = state.cmpPicks.filter(p => p.ok).length;
  const apart = dmz <= paddy / 2;   // DMZ 안의 땅이 논의 절반도 움직이지 않았는가
  return foundCard({
    head: t(apart ? 'cheorwon.foundHeadApart' : 'cheorwon.foundHeadUnclear'),
    rows: [{ name: t('cheorwon.rowPaddy'), value: paddy }, { name: t('cheorwon.rowDmz'), value: dmz, cls: 'calm' }, { name: t('cheorwon.rowNorth'), value: north, cls: 'far' }],
    caption: t('cheorwon.foundCaption'),
    body: [t('cheorwon.foundWho'), state.cmpPicks.length ? t('cheorwon.foundScore', { n: right, total: state.cmpPicks.length }) : '', apart ? t('cheorwon.foundWhy') : ''],
    more: [t(apart ? 'cheorwon.foundApart' : 'cheorwon.foundUnclear', { dmz: dmz.toFixed(1), paddy: paddy.toFixed(1) }), t('cheorwon.foundNorth', { north: north.toFixed(1) }), t('cheorwon.foundCaveat'), t('cheorwon.foundFine')],
  });
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID);
  const allowed = canTake(ID, state.fragments, STOPS.map(s => s.id)), r = rounds()[state.cmpPicks.length];
  return `${ready || !r ? '' : round(r)}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${noteText(state.note)}</p>` : ''}
    ${ready ? discovery() + chart() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('cheorwon.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('cheorwon.got')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'hwacheon'), 'name') })}</button>` : ''}`;
}

export function act(name, el) {
  if (name === 'pick' && !missionReady(ID, state.seen[ID])) {
    const r = rounds()[state.cmpPicks.length]; if (!r) return;
    const land = el.dataset.land, more = r.paddy > r.dmz ? 'b' : 'a', ok = land === more;
    const vars = { a: r.dmz.toFixed(1), b: r.paddy.toFixed(1) };
    const say = () => t(ok ? 'cheorwon.noteRight' : 'cheorwon.noteWrong', vars);   // 문구는 보여 줄 때의 언어로 만든다
    blip(ok ? 660 : 233, .16, ok ? .3 : .16);
    const picks = [...state.cmpPicks, { a: r.a, b: r.b, land, ok }], done = picks.length >= rounds().length;
    // 다음 판의 나중 날짜로 지도도 옮긴다
    const nextDay = done ? r.b : rounds()[picks.length].b;
    set({ cmpPicks: picks, note: { ok, text: say(), say }, cycle: nextDay, visited: [...state.visited, nextDay], ...(done ? { revealed: true, seen: addKey(ID, 'drawn') } : {}) });
  }
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID], note: null });
  else if (name === 'next') set({ stop: 'hwacheon', note: null });
}
