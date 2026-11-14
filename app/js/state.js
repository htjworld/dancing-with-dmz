// 화면 전체가 공유하는 상태 하나. set() 으로만 바꾸고, subscribe() 로 바뀐 것을 듣는다.
export const state = {
  stop: 'paju',      // 지금 보고 있는 지역
  cycle: 0,          // 타임라인에서 고른 통과(0 = 첫 관측)
  pol: 'hh',
  fragments: [],     // 모은 조각(지역 id, 서→동 순서)
  mapReady: false,
};
export const data = { boundary: null, rain: null, passes: [], zones: [] };

const listeners = new Set();
export const subscribe = fn => (listeners.add(fn), () => listeners.delete(fn));
export function set(patch) {
  const prev = { ...state };
  Object.assign(state, patch);
  for (const fn of listeners) fn(state, prev);
}

const json = async path => { const r = await fetch(path); if (!r.ok) throw new Error(`${path} ${r.status}`); return r.json(); };
export async function load() {
  const [boundary, rain, regions] = await Promise.all([json('data/dmz.geojson'), json('data/rain.json'), json('data/regions.json')]);
  Object.assign(data, { boundary, rain, passes: regions.passes, zones: regions.zones });
}
export const md = iso => `${+iso.slice(5, 7)}/${+iso.slice(8)}`;
export const zonesOf = stopId => data.zones.filter(z => z.region === stopId);
export const zone = id => data.zones.find(z => z.id === id);
