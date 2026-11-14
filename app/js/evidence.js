// 확대 근거 패널의 자료: 한 지역의 구역별 "숲 대비" 계절 곡선, 변동 폭, 걸러 볼 날, 한계 문구 키. 화면과 무관한 순수 계산.
import { forestChange, togetherDays, valid } from './calc.js';

// 구역이 분계선 기준 어디에 있는가: 'dmz'(DMZ 안), 'north'(분계선 북·서쪽), 'south'(남쪽)
export const placeOf = zone => (zone.id.includes('dmz') ? 'dmz' : zone.id.includes('north') ? 'north' : 'south');
const ORDER = { south: 0, dmz: 1, north: 2 };
const round1 = v => Math.round(v * 10) / 10;

// landcover = data.landcover, rain = data.rain (둘 다 없어도 된다)
export function evidence(zones, regionId, { landcover = null, rain = null } = {}) {
  const here = zones.filter(z => z.region === regionId);
  const cycles = (here[0]?.observations ?? []).map(o => o.cycle);
  const dates = (here[0]?.observations ?? []).map(o => o.date);
  const lines = here.filter(z => z.role !== 'ref')
    .map(z => ({ zoneId: z.id, name: z.name, role: z.role, place: placeOf(z), values: cycles.map(c => forestChange(zones, z, c)),
      cover: landcover?.zones?.[z.id] ?? null }))   // 구역의 토지피복 비율(%), ESA WorldCover 2021
    .sort((a, b) => ORDER[a.place] - ORDER[b.place]);
  const ranges = Object.fromEntries(lines.map(l => {
    const v = l.values.filter(x => x != null);
    return [l.zoneId, v.length ? round1(Math.max(...v) - Math.min(...v)) : null];
  }));
  const missing = here.some(z => z.observations.some(o => !valid(o)));
  const caveats = ['signal_not_cause', 'forest_relative', 'provisional', 'zone_unverified'];
  if (lines.some(l => l.place === 'north')) caveats.push('north_wording');
  if (missing) caveats.push('missing_pass');
  const excluded = togetherDays(here).map(t => t.cycle);
  // 함께 변한 날마다 그 통과 전 3일 강수(mm). 비가 많았으면 젖은 땅 때문일 수 있고, 거의 없었으면 원인을 모른다
  const shared = excluded.map(c => {
    const date = dates[cycles.indexOf(c)];
    return { cycle: c, date, rain_mm_3day: rain?.regions?.[regionId]?.passes.find(p => p.date === date)?.mm_3day ?? null };
  });
  return { dates, lines, ranges, excluded, shared, caveats };
}
