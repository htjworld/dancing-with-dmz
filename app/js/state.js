// 화면 전체가 공유하는 상태 하나. set() 으로만 바꾸고, subscribe() 로 바뀐 것을 듣는다.
export const state = {
  stop: 'paju',      // 지금 보고 있는 지역
  cycle: 0,          // 타임라인에서 고른 통과(0 = 첫 관측)
  pol: 'hh',
  fragments: [],     // 모은 조각(지역 id, 서→동 순서)
  seen: {},          // 지역별로 얻은 미션 열쇠 { paju: ['dark'] }
  marks: {},         // 파주: 표시를 붙인 통과 { dark: 0, bright: 5 }
  visited: [],       // 이 지역에서 넘겨 본 통과(밝기 선에 점이 찍힌다)
  riverPicks: [],    // 연천: 강 위에서 고른 곳 [[lng, lat]]
  misses: 0,         // 연천: 빗나간 횟수(세 번이면 힌트를 권한다)
  riverHint: false,  // 연천: 강의 위치를 옅게 보여 준다
  guess: null,       // 철원: 사용자가 그린 선(통과별 dB, 빈 칸은 null)
  revealed: false,   // 철원: 실제 선을 겹쳐 보았는가
  eyePick: null,     // 화천: 고른 편파('hh' | 'hv')
  quizPick: null,    // 양구: 고른 선의 구역 id
  playing: null,     // 지금 울리는 것 { mode: 'preview' | 'finale', at(ms), duration(s), ids }
  finaleDone: false, // 피날레를 끝까지 보았는가
  sound: true,
  note: null,        // 방금 한 행동에 대한 한 줄 응답 { ok, text }
  mapReady: false,
};
export const data = { boundary: null, rain: null, passes: [], zones: [], layers: null, river: null };

const listeners = new Set();
export const subscribe = fn => (listeners.add(fn), () => listeners.delete(fn));
export function set(patch) {
  const prev = { ...state };
  Object.assign(state, patch);
  for (const fn of listeners) fn(state, prev);
}

const json = async path => { const r = await fetch(path); if (!r.ok) throw new Error(`${path} ${r.status}`); return r.json(); };
export async function load() {
  const [boundary, rain, regions, layers, river] = await Promise.all(
    ['dmz.geojson', 'rain.json', 'regions.json', 'layers.json', 'river.json'].map(f => json(`data/${f}`)));
  Object.assign(data, { boundary, rain, passes: regions.passes, zones: regions.zones, layers, river });
}
export const md = iso => `${+iso.slice(5, 7)}/${+iso.slice(8)}`;
export const zonesOf = stopId => data.zones.filter(z => z.region === stopId);
export const zone = id => data.zones.find(z => z.id === id);
export const pass = cycle => data.passes.find(p => p.cycle === cycle);
export const rainAt = (stopId, cycle) => data.rain?.regions?.[stopId]?.passes.find(r => r.date === pass(cycle)?.date)?.mm_3day ?? null;
export const addKey = (stopId, key) => ({ ...state.seen, [stopId]: [...new Set([...(state.seen[stopId] || []), key])] });
export const mdK = iso => `${+iso.slice(5, 7)}월 ${+iso.slice(8)}일`;
