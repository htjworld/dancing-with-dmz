// 미션 판정: 정답은 고정값이 아니라 관측 자료에서 계산한다.
import { valid, obsAt, forestChange } from './calc.js';

// 지역마다 완료에 필요한 열쇠가 다르다
export const MISSION_KEYS = {
  paju: ['dark', 'bright'],                   // 시간의 눈
  yeoncheon: ['river1', 'river2', 'river3'],  // 물의 눈
  cheorwon: ['drawn'],                        // 사람의 눈
  hwacheon: ['eye'],                          // 두 가지 눈
  yanggu: ['picked'],                         // 종합
};
export const missionReady = (stopId, seen = []) => !!MISSION_KEYS[stopId] && MISSION_KEYS[stopId].every(k => seen.includes(k));

// 원본 밝기(HH)의 극값에서 tol dB 안에 드는 통과들. 눈으로 구분할 수 없는 차이는 모두 정답으로 본다.
// brightForest = 숲을 뺀 변화가 가장 큰 통과
export function extremeDays(zones, zoneId, tol = 0.3) {
  const z = zones.find(x => x.id === zoneId), obs = z.observations.filter(valid);
  const lo = Math.min(...obs.map(o => o.hh_db)), hi = Math.max(...obs.map(o => o.hh_db));
  let brightForest = null, best = -Infinity;
  for (const o of obs) {
    const f = forestChange(zones, z, o.cycle);
    if (f != null && f > best) { best = f; brightForest = o.cycle; }
  }
  return { dark: obs.filter(o => o.hh_db - lo <= tol).map(o => o.cycle), bright: obs.filter(o => hi - o.hh_db <= tol).map(o => o.cycle), brightForest };
}

// 고른 통과가 가장 어두운(dark)/밝은(bright) 날인가. reason 은 화면 문구를 고르는 데 쓴다.
//  rest: 자료 없음 · tie: 거의 같은 날이 더 있음 · together: 모든 땅이 함께 오른 날 · forest: 숲을 빼면 가장 밝은 날
//  darker / brighter: 더 어두운/밝은 날이 있음
export function judgeExtreme(zones, zoneId, cycle, want, togetherCycles = []) {
  const z = zones.find(x => x.id === zoneId);
  if (!valid(obsAt(z, cycle))) return { ok: false, reason: 'rest' };
  const e = extremeDays(zones, zoneId);
  if (want === 'dark') return e.dark.includes(cycle) ? { ok: true, reason: e.dark.length > 1 ? 'tie' : null } : { ok: false, reason: 'darker' };
  if (e.bright.includes(cycle)) return { ok: true, reason: togetherCycles.includes(cycle) ? 'together' : null };
  if (cycle === e.brightForest) return { ok: true, reason: 'forest' };
  return { ok: false, reason: 'brighter' };
}

// 조각은 서→동 순서로만 받는다: 앞 지역의 조각을 모두 모았어야 한다
export const canTake = (stopId, fragments, order) => order.slice(0, order.indexOf(stopId)).every(id => fragments.includes(id));

// 두 경위도 사이의 거리(m). 수 km 범위라 평면 근사로 충분하다.
export const meters = (lng1, lat1, lng2, lat2) => {
  const k = Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  return Math.hypot((lng2 - lng1) * k, lat2 - lat1) * 111320;
};
// 강 위를 눌렀는가: 미리 만든 물 화소 점들 가운데 radiusM 안에 하나라도 있으면 인정
export const riverHit = (points, lng, lat, radiusM = 150) => points.some(p => meters(p[0], p[1], lng, lat) <= radiusM);
// 이미 고른 곳과 충분히 떨어졌는가(같은 곳을 세 번 누르는 것을 막는다)
export const farEnough = (picks, lng, lat, minM = 600) => picks.every(p => meters(p[0], p[1], lng, lat) >= minM);
// 사각형 [서, 남, 동, 북] 안인가
export const inside = (b, lng, lat) => lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3];

// ---- 철원: 선 그리기
// 두 점 { k: 통과, d: dB } 사이의 칸을 직선으로 채운 새 배열. 기준일 칸(0)은 언제나 0 이고, 범위 밖 칸은 건드리지 않는다.
export function fillGuess(draft, from, to) {
  const out = [...draft], step = to.k >= from.k ? 1 : -1;
  for (let k = from.k; k !== to.k + step; k += step) {
    if (k <= 0 || k >= out.length) continue;
    out[k] = to.k === from.k ? to.d : from.d + (to.d - from.d) * (k - from.k) / (to.k - from.k);
  }
  out[0] = 0;
  return out;
}
// 유효한 관측이 있는 칸이 모두 채워졌는가(자료가 없는 칸은 비어 있어도 된다)
export const guessComplete = (guess, zone) => !!guess && zone.observations.every(o => !valid(o) || guess[o.cycle] != null);
// 구역의 변동 폭(dB): 기준일 대비 변화의 최댓값 − 최솟값. series 를 주면 그 값들로 계산한다
export const rangeOf = values => { const v = values.filter(x => x != null); return v.length ? Math.max(...v) - Math.min(...v) : null; };

// ---- 화천: 두 구역을 더 잘 구분하는 눈 = 기준일(둘 다 유효한 첫 통과)의 dB 차이가 큰 편파
export function betterEye(zones, aId, bId) {
  const a = zones.find(z => z.id === aId), b = zones.find(z => z.id === bId);
  const oa = a.observations.find(o => valid(o) && valid(obsAt(b, o.cycle))), ob = obsAt(b, oa.cycle);
  const hh = Math.abs(oa.hh_db - ob.hh_db), hv = Math.abs(oa.hv_db - ob.hv_db);
  return { pol: hv > hh ? 'hv' : 'hh', hh, hv, cycle: oa.cycle };
}
