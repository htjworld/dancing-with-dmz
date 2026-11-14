// 철원 평야 · 변화 지도: 지도 위의 손잡이로 날짜를 넘기면, 6월 23일의 영상과 그날의 영상을 색으로 겹친 그림이 나온다(views/composite.js).
// 변하지 않은 곳은 회색, 달라진 곳에는 색이 든다. 이름을 가린 두 땅(가, 나) 가운데 색이 더 많이 드는 쪽을 찾는다.
// 열한 날을 다 보면 더 크게 변한 땅을 지도에서 직접 누른다. 그 뒤 어느 쪽이 사람이 농사짓는 논이었는지 밝힌다.
// 손잡이와 두 땅의 테두리는 screens/gamemap.js 가 지도 위에 그린다. 여기서는 안내, 판정, 결과를 맡는다.
import { state, set, data, zone, addKey, pass } from '../state.js';
import { STOPS, label } from '../stops.js';
import { level, change, forestChange } from '../calc.js';
import { missionReady, canTake, rangeOf } from '../missions.js';
import { t, dateText, noteText } from '../i18n.js';
import { blip } from '../sound.js';
import { foundCard } from './found.js';

const ID = 'cheorwon', PADDY = 'cheorwon-paddy', DMZ = 'cheorwon-dmz', FOREST = 'cheorwon-forest', NORTH = 'cheorwon-north';
// 화면에 붙이는 이름. 어느 쪽이 논인지는 고른 뒤에 밝힌다
export const LANDS = [{ key: 'a', id: DMZ, name: 'cheorwon.landA' }, { key: 'b', id: PADDY, name: 'cheorwon.landB' }];
const W = 300, H = 170, L = 30, R = 8, T = 12, B = 22;
const series = (id, f = change) => data.passes.map(p => f(zone(id), p.cycle));
const rel = id => data.passes.map(p => forestChange(data.zones, zone(id), p.cycle));

// 넘겨 볼 날짜들(영상이 있는 통과)
export const cycles = () => { const d = data.layers.regions[ID].dates; return data.passes.filter(p => !p.rest && d.includes(p.date)).map(p => p.cycle); };
const seenCount = () => cycles().filter(c => state.visited.includes(c)).length;
// 열한 날을 다 봤는가(그 뒤에 땅을 고를 수 있다)
export const askReady = () => seenCount() >= cycles().length;
// 한 계절 동안 밝기가 오르내린 폭(dB)
const swing = id => rangeOf(cycles().map(c => level(zone(id), c)));

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
// 고른 뒤에 보여 주는 두 땅의 한 계절
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

// 손잡이를 넘길 때의 음높이(0~1): 나 땅이 첫 날짜에서 달라진 만큼 올라간다
export const tone = c => { const z = zone(PADDY), base = level(z, cycles()[0]), all = cycles().map(k => Math.abs(level(z, k) - base)), v = Math.abs(level(z, c) - base); return v / (Math.max(...all) || 1); };

// 첫 날짜(6월 23일)와 견줘 두 땅의 밝기가 달라진 정도를 막대로 보여 준다. 날짜를 넘기면 막대가 따라 움직인다
function now() {
  const base = cycles()[0], diff = (id, c) => { const a = level(zone(id), base), b = level(zone(id), c); return a == null || b == null ? 0 : Math.abs(b - a); };
  const top = Math.max(...LANDS.flatMap(l => cycles().map(c => diff(l.id, c))), .0001);
  return `<p class="swatches"><span class="same">${t('cheorwon.colorSame')}</span><span class="up">${t('cheorwon.colorUp')}</span><span class="down">${t('cheorwon.colorDown')}</span></p>
    <div class="nowbars" role="img" aria-label="${t('cheorwon.nowAria')}">${LANDS.map(l => `<span>${t(l.name)}</span><i><u style="width:${(diff(l.id, state.cycle) / top * 100).toFixed(0)}%"></u></i>`).join('')}</div>`;
}

function play() {
  const n = cycles().length, seen = seenCount(), ask = seen >= n, p = pass(state.cycle);
  return `<p class="today big">${p && !p.rest ? dateText(p.date) : ''}</p>
    ${now()}
    <p class="fine cap">${t('cheorwon.nowFine')}</p>
    <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${seen}" aria-label="${t('cheorwon.seenAria')}"><i style="width:${(seen / n * 100).toFixed(0)}%"></i></div>
    <p class="hint">${ask ? '' : t('cheorwon.seen', { n: seen, total: n })} ${t(ask ? 'cheorwon.ask' : 'cheorwon.hint')}</p>
    ${ask ? `<div class="acts">${LANDS.map(l => `<button type="button" data-act="pick" data-land="${l.key}">${t(l.name)}</button>`).join('')}</div>` : ''}`;
}

function discovery() {
  const r = id => rangeOf(rel(id)), paddy = r(PADDY), dmz = r(DMZ), north = r(NORTH);
  const apart = dmz <= paddy / 2;   // DMZ 안의 땅이 논의 절반도 움직이지 않았는가
  return foundCard({
    head: t(apart ? 'cheorwon.foundHeadApart' : 'cheorwon.foundHeadUnclear'),
    rows: [{ name: t('cheorwon.rowPaddy'), value: paddy }, { name: t('cheorwon.rowDmz'), value: dmz, cls: 'calm' }, { name: t('cheorwon.rowNorth'), value: north, cls: 'far' }],
    caption: t('cheorwon.foundCaption'),
    body: [t('cheorwon.foundWho'), apart ? t('cheorwon.foundWhy') : ''],
    extra: chart(),
    more: [t(apart ? 'cheorwon.foundApart' : 'cheorwon.foundUnclear', { dmz: dmz.toFixed(1), paddy: paddy.toFixed(1) }), t('cheorwon.foundNorth', { north: north.toFixed(1) }), t('cheorwon.foundCaveat'), t('cheorwon.foundFine')],
  });
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID);
  const allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  return `${ready ? '' : play()}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${noteText(state.note)}</p>` : ''}
    ${ready ? discovery() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('cheorwon.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('cheorwon.got')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'hwacheon'), 'name') })}</button>` : ''}`;
}

// 더 크게 변한 땅을 골랐다(지도에서 누르거나 창의 단추로). 맞든 틀리든 완료되고, 숫자로 답을 보여 준다
function pick(land) {
  if (state.stop !== ID || state.screen !== 'mission' || missionReady(ID, state.seen[ID]) || !askReady()) return;
  const a = swing(DMZ), b = swing(PADDY), ok = land === (b > a ? 'b' : 'a');
  const vars = { a: a.toFixed(1), b: b.toFixed(1) };
  const say = () => t(ok ? 'cheorwon.noteRight' : 'cheorwon.noteWrong', vars);   // 문구는 보여 줄 때의 언어로 만든다
  blip(ok ? 784 : 233, .18, ok ? .35 : .16);
  set({ cmpPicks: [{ land, ok }], note: { ok, text: say(), say }, revealed: true, seen: addKey(ID, 'drawn') });
}

export function bind() {
  document.addEventListener('dmz-map-pick', e => pick(e.detail.land));
}

export function act(name, el) {
  if (name === 'pick') pick(el.dataset.land);
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID], note: null });
  else if (name === 'next') set({ stop: 'hwacheon', note: null });
}
