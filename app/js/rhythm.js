// 실측을 음악과 춤에 묶는 순수 계산. 곡의 처음~끝이 첫 통과~마지막 통과에 대응한다.
//  · 층의 세기 = 그 층을 맡은 지역 주 구역의, 그 시점의 신호 변화
//  · 선의 높이 = 같은 값(0 = 기준일과 같음) · 멈춤 = 자료가 없는 통과 · 점프 = 모든 땅이 함께 오른 날
import { LAYER_OF } from './music.js';

const FLOOR = 0.4;   // 가장 약한 신호도 들리게 남긴다. 완전한 침묵은 자료가 없는 통과(쉼표)에만 쓴다.
export const cycleAt = (progress, n) => Math.max(0, Math.min(n - 1, Math.floor(progress * n)));

// 지역별·통과별 세기(0.4~1, 쉼표는 0). 다섯 지역 전체의 최솟값~최댓값을 편다. 지역 사이의 크고 작음이 그대로 남는다.
export function layerGains(series) {
  const all = Object.values(series).flat().filter(v => v != null), lo = Math.min(...all), hi = Math.max(...all), out = {};
  for (const [id, vals] of Object.entries(series)) out[id] = vals.map(v => (v == null ? 0 : hi > lo ? FLOOR + (1 - FLOOR) * (v - lo) / (hi - lo) : 1));
  return out;
}
// 악보의 반주 음마다 '그 층을 맡은 지역의, 그 시점의 세기'를 붙인다. 주선율은 언제나 1.
export function applyRhythm(plan, gains, n, span = plan.duration) {
  const owner = Object.fromEntries(Object.entries(LAYER_OF).map(([id, type]) => [type, id]));
  return { ...plan, events: plan.events.map(e => {
    const g = gains[owner[e.type]];
    return { ...e, gain: e.type === 'lead' || !g ? 1 : g[cycleAt(e.time / span, n)] ?? 1 };
  }) };
}

// 진행도(0~1)에서의 높이. 한 통과 안에서는 다음 통과의 높이로 곧게 이어지고, 자료가 없으면 직전 높이에 멈춘다.
export function heightAtProgress(h, progress) {
  const n = h.length;
  if (!n) return 0;
  const pos = Math.max(0, Math.min(1, progress)) * n, c = Math.min(n - 1, Math.floor(pos)), f = pos - c;
  let k = c;
  while (k >= 0 && h[k] == null) k--;
  if (k < 0) return 0;
  const next = h[c + 1];
  return k === c && next != null ? h[c] + (next - h[c]) * f : h[k];
}
export const isRestAt = (h, progress) => h.length > 0 && h[cycleAt(progress, h.length)] == null;
// 모든 땅이 함께 오른 날: 그 통과가 시작될 때 1, 통과의 3분의 1 지점에서 0
export function jumpAt(togetherCycles, progress, n) {
  const pos = Math.max(0, Math.min(1, progress)) * n, c = Math.min(n - 1, Math.floor(pos));
  return togetherCycles.includes(c) ? Math.max(0, 1 - (pos - c) * 3) : 0;
}
