// 화면 전체가 공유하는 상태 하나. set() 으로만 바꾸고, subscribe() 로 바뀐 것을 듣는다.
export const state = {
  stop: 'paju',      // 지금 보고 있는 지역
  cycle: 0,          // 타임라인에서 고른 통과(0 = 첫 관측)
  pol: 'hh',
  fragments: [],     // 모은 조각(지역 id, 서→동 순서)
  mapReady: false,
};
export const data = { boundary: null, rain: null, passes: [] };

const listeners = new Set();
export const subscribe = fn => (listeners.add(fn), () => listeners.delete(fn));
export function set(patch) {
  const prev = { ...state };
  Object.assign(state, patch);
  for (const fn of listeners) fn(state, prev);
}

const DAY = 86400000;
// 관측 날짜 사이가 12일보다 길면 그 사이의 통과는 '보지 못한 날'(쉼표)로 채운다
export function withRests(dates, step = 12) {
  const out = [];
  dates.forEach((d, i) => {
    if (i) for (let t = Date.parse(dates[i - 1]) + step * DAY; t < Date.parse(d) - DAY; t += step * DAY)
      out.push({ date: new Date(t).toISOString().slice(0, 10), rest: true });
    out.push({ date: d, rest: false });
  });
  return out.map((p, cycle) => ({ ...p, cycle }));
}

const json = async path => { const r = await fetch(path); if (!r.ok) throw new Error(`${path} ${r.status}`); return r.json(); };
export async function load() {
  [data.boundary, data.rain] = await Promise.all([json('data/dmz.geojson'), json('data/rain.json')]);
  data.passes = withRests(Object.values(data.rain.regions)[0].passes.map(p => p.date));
}
export const md = iso => `${+iso.slice(5, 7)}/${+iso.slice(8)}`;
