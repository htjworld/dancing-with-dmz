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
  screen: 'opening', // 지금 화면: 'opening'(구름 문지르기) | 'night'(밤사진) | 'mission'(다섯 지역에서 직접 확인하기)
  nightFrame: null,  // 밤사진 재생 중 보여 줄 누적 프레임 번호. null 이면 완성된 한 장
  nightMode: 'film', // 밤하늘 화면의 모습: 'film'(나레이션과 함께 스스로 흐르는 영상) | 'explore'(직접 둘러보기)
  landPlay: false,   // 땅 연주가 켜져 있는가(지도를 쓸면 소리가 난다)
  evidenceAt: null,  // 근거 패널을 연 지역 id. null 이면 닫힘
  endCard: false,    // 엔딩이 끝난 뒤의 요약 카드를 보여 주는가
  scrubbed: null,    // 날짜 손잡이를 넘겨 본 지역 id. 파주는 넘기기 전까지 지도에 레이더 영상을 보여 주지 않는다
  retry: null,       // 다시 해 보는 중인 지역 id(조각은 그대로 두고 미션만 다시 푼다)
  introSeen: [],     // 소개 카드를 넘긴 지역 id
  cmpPicks: [],      // 철원: 견주기에서 고른 것 [{ a, b, land, ok }]
  probe: null,       // 양구: 지금 손이 있는 곳 [lng, lat, 변화 정도 0~1]
  probeTrail: [],    // 양구: 손이 지나간 자국 [[lng, lat, 변화 정도]]
  hot: null,         // 양구: 찾아낸 곳 [lng, lat]
  hotHint: false,    // 양구: 가까운 곳을 알려 주는 도움을 켰는가
  peek: null,        // 패널 머리의 선에서 눌러 설명을 펼친 지역 id. null 이면 닫힘
  curtain: .5,       // 화천: 커튼의 위치(0~1). 왼쪽은 HH, 오른쪽은 HV
  riverTrace: [],    // 연천: 강을 따라 그은 자국 [[lng, lat, 강 위면 1]]
  tags: {},          // 양구: 선에 붙인 이름표 { 선의 구역 id: 이름표의 구역 id }
  tagPick: null,     // 양구: 지금 손에 든 이름표
  lang: 'ko',        // 화면 문구의 언어: 'ko' | 'en'
};
export const data = { boundary: null, rain: null, passes: [], zones: [], layers: null, river: null, glow: null, corridor: null, facts: null, opening: null, landcover: null, paddyCurve: null };

const listeners = new Set();
export const subscribe = fn => (listeners.add(fn), () => listeners.delete(fn));
export function set(patch) {
  const prev = { ...state };
  Object.assign(state, patch);
  for (const fn of listeners) fn(state, prev);
}

const json = async path => { const r = await fetch(path); if (!r.ok) throw new Error(`${path} ${r.status}`); return r.json(); };
// 아직 만들어지지 않았을 수 있는 파일(MVP 진행 중)은 없으면 null 로 둔다
const optional = path => json(path).catch(() => null);
export async function load() {
  const [boundary, rain, regions, layers, river, glow, facts, opening, landcover, paddyCurve, corridor] = await Promise.all([
    ...['dmz.geojson', 'rain.json', 'regions.json', 'layers.json', 'river.json', 'glow.json', 'facts.json'].map(f => json(`data/${f}`)),
    optional('data/opening.json'), optional('data/landcover.json'), optional('data/paddy_curve.json'), optional('data/corridor.json')]);
  Object.assign(data, { boundary, rain, passes: regions.passes, zones: regions.zones, layers, river, glow, corridor, facts, opening, landcover, paddyCurve });
}
// 화면에 쓰는 숫자는 facts.json 에서만 가져온다
export const fact = key => data.facts?.[key]?.value ?? null;
export const md = iso => `${+iso.slice(5, 7)}/${+iso.slice(8)}`;
export const zonesOf = stopId => data.zones.filter(z => z.region === stopId);
export const zone = id => data.zones.find(z => z.id === id);
export const pass = cycle => data.passes.find(p => p.cycle === cycle);
export const rainAt = (stopId, cycle) => data.rain?.regions?.[stopId]?.passes.find(r => r.date === pass(cycle)?.date)?.mm_3day ?? null;
export const addKey = (stopId, key) => ({ ...state.seen, [stopId]: [...new Set([...(state.seen[stopId] || []), key])] });
export const mdK = iso => `${+iso.slice(5, 7)}월 ${+iso.slice(8)}일`;
