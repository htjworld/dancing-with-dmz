// 양구 펀치볼 · 종합: 이름을 가린 세 선 가운데 분지 밭의 선을 고른다. 어느 것을 골라도 완료되고, 고른 뒤 이름을 모두 밝힌다.
import { state, set, data, zone, addKey } from '../state.js';
import { STOPS } from '../stops.js';
import { change } from '../calc.js';
import { missionReady, canTake, rangeOf } from '../missions.js';
import { t, dateText } from '../i18n.js';

const ID = 'yanggu', ANSWER = 'yanggu-basin';
// 화면에 놓는 순서(가, 나, 다). 답이 늘 같은 자리에 오지 않게 구역 id 순서와 다르게 둔다.
const LINES = ['yanggu-dmz', 'cheorwon-paddy', 'yanggu-basin'];
// 선의 이름표와 가린 이름은 문구 키로 둔다. 그릴 때 t() 로 지금 언어의 문구를 가져온다
const LABEL = ['yanggu.label0', 'yanggu.label1', 'yanggu.label2'], COLOR = ['#9fd0ff', '#bce9c5', '#ffb3a1'];
const TRUE = { 'yanggu-basin': 'yanggu.lineBasin', 'yanggu-dmz': 'yanggu.lineForest', 'cheorwon-paddy': 'yanggu.linePaddy' };
const W = 300, H = 160, L = 30, R = 8, T = 12, B = 22;
const series = id => data.passes.map(p => change(zone(id), p.cycle));

function chart(open) {
  const all = LINES.flatMap(series).filter(v => v != null), n = data.passes.length, lo = Math.min(...all) - .4, hi = Math.max(...all) + .4;
  const x = c => L + (W - L - R) * c / (n - 1), y = v => T + (H - T - B) * (hi - v) / (hi - lo);
  const path = vals => { let d = '', pen = false; vals.forEach((v, c) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(c).toFixed(1)},${y(v).toFixed(1)}`; pen = true; }); return d; };
  const ticks = [Math.ceil(lo), 0, Math.floor(hi)].map(v => `<text x="${L - 5}" y="${y(v) + 3}" class="tick" text-anchor="end">${v > 0 ? '+' : ''}${v}</text><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid${v === 0 ? ' zero' : ''}"/>`).join('');
  const rest = data.passes.filter(p => p.rest).map(p => `<rect x="${x(p.cycle) - 9}" y="${T}" width="18" height="${H - T - B}" class="rest"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('yanggu.chartAria')}">
    ${rest}${ticks}<text x="${L}" y="9" class="tick">${t('common.axisChange')}</text>
    <text x="${L}" y="${H - 5}" class="tick">${dateText(data.passes[0].date)}</text><text x="${W - R}" y="${H - 5}" class="tick" text-anchor="end">${dateText(data.passes[n - 1].date)}</text>
    ${LINES.map((id, i) => `<path d="${path(series(id))}" stroke="${COLOR[i]}" stroke-width="${state.quizPick === id ? 3 : 1.8}"/>`).join('')}</svg>
    <p class="legend">${LINES.map((id, i) => `<span style="color:${COLOR[i]}">━ ${t(LABEL[i])}${open ? ` = ${t(TRUE[id])}` : ''}</span>`).join(' ')}</p>`;
}

function result() {
  const r = id => rangeOf(series(id)), basin = r(ANSWER), forest = r('yanggu-dmz'), paddy = r('cheorwon-paddy'), pick = state.quizPick;
  const close = Math.abs(basin - forest) < Math.abs(basin - paddy);   // 분지 밭이 숲 쪽에 더 가까운가
  const head = t(pick === ANSWER ? 'yanggu.headRight'
    : pick === 'cheorwon-paddy' ? 'yanggu.headPaddy'
    : close ? 'yanggu.headForestClose' : 'yanggu.headForest');
  return `<div class="found"><h3>${t('common.found')}</h3>
    <p>${head} ${t('yanggu.foundRange', { basin: basin.toFixed(1), forest: forest.toFixed(1), paddy: paddy.toFixed(1) })}</p>
    <p>${t(close ? 'yanggu.foundClose' : 'yanggu.foundFar')}</p>
    <p>${t('yanggu.foundWhy')}</p>
    <p class="fine">${t('yanggu.foundFine')}</p></div>`;
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  return `${chart(ready)}
    ${ready ? '' : `<p class="hint">${t('yanggu.hint')}</p>
      <div class="acts">${LINES.map((id, i) => `<button type="button" data-act="pick" data-zone="${id}" style="border-color:${COLOR[i]}">${t(LABEL[i])}</button>`).join('')}</div>`}
    ${ready ? result() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('yanggu.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('yanggu.got')}</p>` : ''}`;
}

export function act(name, el) {
  if (name === 'pick') set({ quizPick: el.dataset.zone, seen: addKey(ID, 'picked') });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID] });
}
