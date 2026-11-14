// 양구 펀치볼 · 종합: 이름을 가린 세 선 가운데 분지 밭의 선을 고른다. 어느 것을 골라도 완료되고, 고른 뒤 이름을 모두 밝힌다.
import { state, set, data, zone, addKey, mdK } from '../state.js';
import { STOPS } from '../stops.js';
import { change } from '../calc.js';
import { missionReady, canTake, rangeOf } from '../missions.js';

const ID = 'yanggu', ANSWER = 'yanggu-basin';
// 화면에 놓는 순서(가, 나, 다). 답이 늘 같은 자리에 오지 않게 구역 id 순서와 다르게 둔다.
const LINES = ['yanggu-dmz', 'cheorwon-paddy', 'yanggu-basin'];
const LABEL = ['가', '나', '다'], COLOR = ['#9fd0ff', '#bce9c5', '#ffb3a1'];
const TRUE = { 'yanggu-basin': '양구 분지 경작지', 'yanggu-dmz': '양구 DMZ 안 숲', 'cheorwon-paddy': '철원 민통선 논' };
const W = 300, H = 160, L = 30, R = 8, T = 12, B = 22;
const series = id => data.passes.map(p => change(zone(id), p.cycle));

function chart(open) {
  const all = LINES.flatMap(series).filter(v => v != null), n = data.passes.length, lo = Math.min(...all) - .4, hi = Math.max(...all) + .4;
  const x = c => L + (W - L - R) * c / (n - 1), y = v => T + (H - T - B) * (hi - v) / (hi - lo);
  const path = vals => { let d = '', pen = false; vals.forEach((v, c) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(c).toFixed(1)},${y(v).toFixed(1)}`; pen = true; }); return d; };
  const ticks = [Math.ceil(lo), 0, Math.floor(hi)].map(v => `<text x="${L - 5}" y="${y(v) + 3}" class="tick" text-anchor="end">${v > 0 ? '+' : ''}${v}</text><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid${v === 0 ? ' zero' : ''}"/>`).join('');
  const rest = data.passes.filter(p => p.rest).map(p => `<rect x="${x(p.cycle) - 9}" y="${T}" width="18" height="${H - T - B}" class="rest"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="이름을 가린 세 구역의 신호 변화">
    ${rest}${ticks}<text x="${L}" y="9" class="tick">첫 관측 대비 변화 (HH, dB)</text>
    <text x="${L}" y="${H - 5}" class="tick">${mdK(data.passes[0].date)}</text><text x="${W - R}" y="${H - 5}" class="tick" text-anchor="end">${mdK(data.passes[n - 1].date)}</text>
    ${LINES.map((id, i) => `<path d="${path(series(id))}" stroke="${COLOR[i]}" stroke-width="${state.quizPick === id ? 3 : 1.8}"/>`).join('')}</svg>
    <p class="legend">${LINES.map((id, i) => `<span style="color:${COLOR[i]}">━ ${LABEL[i]}${open ? ` = ${TRUE[id]}` : ''}</span>`).join(' ')}</p>`;
}

function result() {
  const r = id => rangeOf(series(id)), basin = r(ANSWER), forest = r('yanggu-dmz'), paddy = r('cheorwon-paddy'), pick = state.quizPick;
  const close = Math.abs(basin - forest) < Math.abs(basin - paddy);   // 분지 밭이 숲 쪽에 더 가까운가
  const head = pick === ANSWER ? '맞습니다. 분지 밭의 선입니다.'
    : pick === 'cheorwon-paddy' ? '이건 물을 대는 철원 논의 선입니다.'
    : close ? '이건 바로 옆 숲의 선입니다. 거의 같죠? 이 분지의 밭은 숲만큼 조용했습니다.' : '이건 바로 옆 숲의 선입니다.';
  return `<div class="found"><h3>이 지역에서 본 것</h3>
    <p>${head} 한 계절의 변동 폭은 분지 밭 ${basin.toFixed(1)} dB, 옆 숲 ${forest.toFixed(1)} dB, 철원 논 ${paddy.toFixed(1)} dB였습니다.</p>
    <p>${close ? '분지 밭의 선은 숲의 선과 거의 구분되지 않습니다. 레이더로 "보이지 않는 것"도 있다는 뜻입니다.' : '이 자료에서는 분지 밭이 숲보다 논 쪽에 더 가깝게 움직였습니다.'}</p>
    <p>가능한 설명: 물을 대지 않는 밭은 논처럼 크게 출렁이지 않을 수 있습니다. 여러 밭을 넓게 묶어 평균한 값이라 밭마다의 변화가 서로 지워졌을 수도 있습니다.</p>
    <p class="fine">분지 구역은 넓게 묶은 사각형이며 개별 밭이 아닙니다.</p></div>`;
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  return `${chart(ready)}
    ${ready ? '' : `<p class="hint">세 선은 양구 분지의 밭, 바로 옆 DMZ 안 숲, 철원의 논입니다. 분지 밭의 선은 어느 것일까요?</p>
      <div class="acts">${LINES.map((id, i) => `<button type="button" data-act="pick" data-zone="${id}" style="border-color:${COLOR[i]}">${LABEL[i]}</button>`).join('')}</div>`}
    ${ready ? result() : ''}
    ${ready && !got ? (allowed ? '<button type="button" class="primary" data-act="take">♪ 마지막 조각 받기</button>'
      : '<p class="note no">먼저 앞 지역의 조각을 모아 주세요. 조각은 서쪽부터 차례로 이어집니다.</p>') : ''}
    ${got ? '<p class="note ok">양구 조각(반짝임)을 받았습니다. 다섯 조각이 모두 모여 선이 서쪽 끝에서 동쪽 끝까지 이어졌습니다.</p>' : ''}`;
}

export function act(name, el) {
  if (name === 'pick') set({ quizPick: el.dataset.zone, seen: addKey(ID, 'picked') });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID] });
}
