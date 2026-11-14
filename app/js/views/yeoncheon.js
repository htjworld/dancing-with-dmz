// 연천 임진강 · 물의 눈: 레이더 영상에서 강 위의 서로 다른 세 곳을 누른다.
import { state, set, data, addKey, mdK } from '../state.js';
import { STOPS } from '../stops.js';
import { missionReady, riverHit, farEnough, inside, canTake } from '../missions.js';

const ID = 'yeoncheon', NEED = 3;
const pct = v => `${Math.round(v * 100)}%`;

// 지도를 눌렀을 때: 강 위인지, 이미 고른 곳과 충분히 먼지 판정한다. 지금 보고 있는 날짜와는 무관하다.
export function mapClick(lng, lat) {
  if (missionReady(ID, state.seen[ID])) return;
  const miss = text => set({ note: { ok: false, text }, misses: state.misses + 1 });
  if (!inside(STOPS.find(s => s.id === ID).bounds, lng, lat)) return miss('레이더 영상 밖입니다. 흑백 영상 안에서 강을 찾아보세요.');
  if (!riverHit(data.river.points, lng, lat)) return miss('여기는 강으로 보이지 않습니다. 검고 구불구불한 띠를 찾아보세요.');
  if (!farEnough(state.riverPicks, lng, lat)) return set({ note: { ok: false, text: '이미 고른 곳과 너무 가깝습니다. 강을 따라 더 멀리 가 보세요.' } });
  const picks = [...state.riverPicks, [lng, lat]], left = NEED - picks.length;
  set({ riverPicks: picks, seen: addKey(ID, `river${picks.length}`), riverHint: left ? state.riverHint : false,
    note: { ok: true, text: left ? `강 위입니다. ${left}곳 더 찾아보세요.` : '세 곳을 모두 찾았습니다. 잔잔한 물은 전파를 위성 반대쪽으로 튕겨 보내 검게 보입니다.' } });
}

// 강과 그 둘레에서 어둡게 보인 화소의 비율(날짜별)과 직전 3일 강수
function days() {
  const rain = data.rain.regions[ID].passes;
  return data.river.dark_ratio.map(r => ({ ...r, mm: rain.find(x => x.date === r.date)?.mm_3day ?? null, cycle: data.passes.find(p => p.date === r.date)?.cycle }));
}

function observation() {
  const d = days(), lo = d.reduce((a, b) => (b.dark_ratio < a.dark_ratio ? b : a)), hi = d.reduce((a, b) => (b.dark_ratio > a.dark_ratio ? b : a));
  const wet = d.filter(x => x.mm != null).reduce((a, b) => (b.mm > a.mm ? b : a)), i = d.indexOf(wet);
  const near = [d[i - 1], d[i + 1]].filter(Boolean), lower = near.length && near.every(n => wet.dark_ratio < n.dark_ratio);
  const max = hi.dark_ratio;
  let text = `강과 그 둘레에서 어둡게 보인 화소의 비율은 날마다 달랐습니다(${pct(lo.dark_ratio)}~${pct(hi.dark_ratio)}). `;
  text += `비가 가장 많이 온 ${mdK(wet.date)}(직전 3일 ${wet.mm.toFixed(0)} mm)에는 ${pct(wet.dark_ratio)}로, 앞뒤 통과(${near.map(n => pct(n.dark_ratio)).join(', ')})보다 ${lower ? '낮았습니다' : '낮지 않았습니다'}. `;
  if (lo.date !== wet.date) text += `하지만 가장 낮았던 날은 ${mdK(lo.date)}이고, 그날의 직전 3일 강수는 ${lo.mm == null ? '알 수 없습니다' : lo.mm.toFixed(0) + ' mm였습니다'}. 비만으로는 설명되지 않습니다.`;
  return `<div class="found"><h3>이 지역에서 본 것</h3>
    <div class="bars" role="img" aria-label="날짜별로 강이 어둡게 보인 비율">${d.map(x =>
      `<div class="${x.mm >= 10 ? 'wet' : ''}${x.cycle === state.cycle ? ' now' : ''}" style="height:${(x.dark_ratio / max * 100).toFixed(0)}%" title="${x.date} · ${pct(x.dark_ratio)} · 비 ${x.mm ?? '?'} mm"></div>`).join('')}</div>
    <div class="barlabels">${d.map(x => `<span>${+x.date.slice(5, 7)}/${+x.date.slice(8)}</span>`).join('')}</div>
    <p class="fine">막대 = 강이 어둡게 보인 비율. 밝은 막대 = 직전 3일 비 10 mm 이상(약 50 km 격자의 강수 자료).</p>
    <p>${text}</p>
    <p>가능한 설명: 비나 바람이 수면을 거칠게 만들면 되돌아오는 전파가 늘어 물이 덜 어둡게 보일 수 있습니다. 이 자료로 "강이 넓어졌다, 좁아졌다"를 말할 수는 없습니다.</p>
    <button type="button" class="ghost" data-act="wet" data-cycle="${wet.cycle}">비가 가장 많이 온 날의 영상 보기 (${mdK(wet.date)})</button></div>`;
}

export function render() {
  const n = state.riverPicks.length, ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID);
  const order = STOPS.map(s => s.id), allowed = canTake(ID, state.fragments, order);
  return `
    <p class="dots" aria-label="세 곳 가운데 ${n}곳 찾음">${'●'.repeat(n)}${'○'.repeat(NEED - n)}</p>
    ${ready ? '' : `<p class="hint">지도의 흑백 영상을 직접 누르세요. 날짜를 바꿔도 됩니다.</p>`}
    ${!ready && state.misses >= 3 && !state.riverHint ? '<button type="button" class="ghost" data-act="hint">찾기 어렵다면: 강의 위치를 옅게 보기</button>' : ''}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${state.note.text}</p>` : ''}
    ${ready ? observation() : ''}
    ${ready && !got ? (allowed ? '<button type="button" class="primary" data-act="take">♪ 연천 조각 받기</button>'
      : '<p class="note no">먼저 파주 조각을 모아 주세요. 조각은 서쪽부터 차례로 이어집니다.</p>') : ''}
    ${got ? `<p class="note ok">연천 조각(하이햇)을 받았습니다. 선이 연천까지 이어졌습니다.</p>
      <button type="button" class="primary" data-act="next">다음: 철원 평야 →</button>` : ''}`;
}

export function act(name, el) {
  if (name === 'hint') set({ riverHint: true });
  else if (name === 'wet') set({ cycle: +el.dataset.cycle, visited: [...state.visited, +el.dataset.cycle] });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID], note: null });
  else if (name === 'next') set({ stop: 'cheorwon', note: null });
}
