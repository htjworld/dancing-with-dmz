// 팝업 머리에 그리는 '선': 파주에서 양구까지 다섯 구간. 게임의 중심 그림이다.
//  · 조각을 받은 구간은 그 지역 대표 구역의 한 계절 신호 변화(실측)를 따라 오르내리는 금색 선
//  · 아직 못 받은 구간은 멈춘 점선
//  · 지금 지역에는 고리 하나. 미션을 푼 구간은 받기 전이라도 흰 선으로 먼저 보인다
import { state, data } from '../state.js';
import { STOPS } from '../stops.js';
import { change, mainOf } from '../calc.js';

const W = 300, H = 60, MID = 34, AMP = 20, SEG = W / STOPS.length;
const STARS = [[22, 9], [71, 5], [133, 12], [188, 6], [247, 10], [281, 50], [96, 54]];   // 밤하늘의 별 몇 개(장식)

// 구간 k 의 길: 값이 있으면 그 값을 따라, 없으면 평평하게
function seg(k, vals, top) {
  const x0 = k * SEG, pts = vals ? vals.map((v, i) => [x0 + SEG * i / (vals.length - 1), v == null ? null : MID - v / top * AMP]).filter(p => p[1] != null) : [[x0, MID], [x0 + SEG, MID]];
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
}

// current: 지금 지역의 순서(0~4). draw: 그 순서의 구간을 그려지는 움직임으로 보여 준다. solved: 받기 전이지만 미션을 푼 지역 id
export function lineSvg({ current = -1, draw = -1, solved = null, label = '' } = {}) {
  const series = STOPS.map(s => { const z = mainOf(data.zones, s.id); return z ? data.passes.map(p => change(z, p.cycle)) : null; });
  const top = Math.max(1, ...series.flatMap(v => (v || []).filter(x => x != null).map(Math.abs)));
  const parts = STOPS.map((s, k) => {
    const got = state.fragments.includes(s.id), live = got || s.id === solved;
    return `<path d="${seg(k, live ? series[k] : null, top)}" class="${got ? 'got' : live ? 'solved' : 'still'}${k === draw ? ' draw' : ''}" pathLength="1"/>`;
  }).join('');
  const dots = STOPS.map((s, k) => `<circle cx="${(k + .5) * SEG}" cy="${H - 5}" r="${k === current ? 3.2 : 2}" class="${state.fragments.includes(s.id) ? 'got' : ''}${k === current ? ' now' : ''}"/>`).join('');
  return `<svg class="dmz-line" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    ${STARS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" class="star"/>`).join('')}${parts}${dots}</svg>`;
}
