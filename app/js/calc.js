// 관측값 계산: 화면과 무관한 순수 함수. 모든 값은 regions.json 의 실측에서 나온다.
// zone = { id, region, role, observations:[{ cycle, date, status, hh_db, hv_db }] }

export const valid = o => !!o && o.status === 'valid' && Number.isFinite(o.hh_db) && Number.isFinite(o.hv_db);
export const obsAt = (zone, cycle) => zone.observations.find(o => o.cycle === cycle);
const key = pol => (pol === 'hv' ? 'hv_db' : 'hh_db');

// 그날의 원본 밝기(dB). 자료가 없으면 null
export function level(zone, cycle, pol = 'hh') {
  const o = obsAt(zone, cycle);
  return valid(o) ? o[key(pol)] : null;
}
// 첫 유효 관측(기준일) 대비 변화(dB)
export function change(zone, cycle, pol = 'hh') {
  const base = zone.observations.find(valid), v = level(zone, cycle, pol);
  return base && v != null ? v - base[key(pol)] : null;
}
// 같은 지역의 숲 기준 구역
export const refOf = (zones, zone) => zones.find(z => z.region === zone.region && z.role === 'ref');
// 숲을 뺀 변화: 구역의 변화 − 같은 지역 숲의 변화. 계절·날씨처럼 모든 땅에 함께 온 변화를 덜어 낸다
export function forestChange(zones, zone, cycle, pol = 'hh') {
  const ref = refOf(zones, zone), a = change(zone, cycle, pol), b = ref ? change(ref, cycle, pol) : null;
  return a == null || b == null ? null : a - b;
}

const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
// 모든 땅이 함께 오른 날: 직전 유효 관측 대비 변화의 중앙값이 threshold 이상인 통과
export function togetherDays(zones, pol = 'hh', threshold = 0.5) {
  const cycles = [...new Set(zones.flatMap(z => z.observations.filter(valid).map(o => o.cycle)))].sort((a, b) => a - b);
  const out = [];
  for (let i = 1; i < cycles.length; i++) {
    const steps = zones.map(z => { const a = level(z, cycles[i - 1], pol), b = level(z, cycles[i], pol); return a == null || b == null ? null : b - a; }).filter(v => v != null);
    if (!steps.length) continue;
    const m = median(steps);
    if (m >= threshold) out.push({ cycle: cycles[i], median: m, up: steps.filter(v => v > 0).length, n: steps.length });
  }
  return out;
}

// ---- 선의 높이: 지역 주 구역의 변화를, 다섯 지역 전체에서 절댓값이 가장 큰 값으로 나눈다(0 = 기준일과 같음)
export const mainOf = (zones, regionId) => zones.find(z => z.region === regionId && z.role === 'main');
export function heights(zones, regionIds, nCycles, pol = 'hh') {
  const series = Object.fromEntries(regionIds.map(id => {
    const z = mainOf(zones, id);
    return [id, Array.from({ length: nCycles }, (_, c) => (z ? change(z, c, pol) : null))];
  }));
  const max = Math.max(0, ...Object.values(series).flat().filter(v => v != null).map(Math.abs));
  for (const id of regionIds) series[id] = series[id].map(v => (v == null ? null : max ? v / max : 0));
  return series;
}
// 자료가 없는 통과에서는 직전 높이에 멈춘다
export function heightAt(h, cycle) {
  for (let c = Math.min(cycle, h.length - 1); c >= 0; c--) if (h[c] != null) return h[c];
  return 0;
}
