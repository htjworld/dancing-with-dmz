// 연천 임진강 · 물의 눈: 레이더 영상에서 강 위의 서로 다른 세 곳을 누른다.
import { state, set, data, addKey } from '../state.js';
import { STOPS, label } from '../stops.js';
import { missionReady, riverHit, farEnough, inside, canTake } from '../missions.js';
import { t, dateText, noteText } from '../i18n.js';

const ID = 'yeoncheon', NEED = 3;
const pct = v => `${Math.round(v * 100)}%`;

// 지도를 눌렀을 때: 강 위인지, 이미 고른 곳과 충분히 먼지 판정한다. 지금 보고 있는 날짜와는 무관하다.
export function mapClick(lng, lat) {
  if (missionReady(ID, state.seen[ID])) return;
  // 응답 문구는 보여 줄 때의 언어로 만든다(say)
  const note = (ok, key, vars) => { const say = () => t(key, vars); return { ok, text: say(), say }; };
  const miss = key => set({ note: note(false, key), misses: state.misses + 1 });
  if (!inside(STOPS.find(s => s.id === ID).bounds, lng, lat)) return miss('yeoncheon.missOutside');
  if (!riverHit(data.river.points, lng, lat)) return miss('yeoncheon.missNotRiver');
  if (!farEnough(state.riverPicks, lng, lat)) return set({ note: note(false, 'yeoncheon.tooClose') });
  const picks = [...state.riverPicks, [lng, lat]], left = NEED - picks.length;
  set({ riverPicks: picks, seen: addKey(ID, `river${picks.length}`), riverHint: left ? state.riverHint : false,
    note: left ? note(true, 'yeoncheon.hit', { left }) : note(true, 'yeoncheon.hitAll') });
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
  let text = t('yeoncheon.obsRange', { lo: pct(lo.dark_ratio), hi: pct(hi.dark_ratio) });
  text += t(lower ? 'yeoncheon.obsWetLower' : 'yeoncheon.obsWetNotLower', { date: dateText(wet.date), mm: wet.mm.toFixed(0), pct: pct(wet.dark_ratio), near: near.map(n => pct(n.dark_ratio)).join(', ') });
  if (lo.date !== wet.date) text += lo.mm == null ? t('yeoncheon.obsLowestUnknown', { date: dateText(lo.date) }) : t('yeoncheon.obsLowest', { date: dateText(lo.date), mm: lo.mm.toFixed(0) });
  return `<div class="found"><h3>${t('common.found')}</h3>
    <div class="bars" role="img" aria-label="${t('yeoncheon.barsAria')}">${d.map(x =>
      `<div class="${x.mm >= 10 ? 'wet' : ''}${x.cycle === state.cycle ? ' now' : ''}" style="height:${(x.dark_ratio / max * 100).toFixed(0)}%" title="${t('yeoncheon.barTitle', { date: x.date, pct: pct(x.dark_ratio), mm: x.mm ?? '?' })}"></div>`).join('')}</div>
    <div class="barlabels">${d.map(x => `<span>${+x.date.slice(5, 7)}/${+x.date.slice(8)}</span>`).join('')}</div>
    <p class="fine">${t('yeoncheon.barsFine')}</p>
    <p>${text}</p>
    <p>${t('yeoncheon.foundWhy')}</p>
    <button type="button" class="ghost" data-act="wet" data-cycle="${wet.cycle}">${t('yeoncheon.wet', { date: dateText(wet.date) })}</button></div>`;
}

export function render() {
  const n = state.riverPicks.length, ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID);
  const order = STOPS.map(s => s.id), allowed = canTake(ID, state.fragments, order);
  return `
    <p class="dots" aria-label="${t('yeoncheon.dotsAria', { n })}">${'●'.repeat(n)}${'○'.repeat(NEED - n)}</p>
    ${ready ? '' : `<p class="hint">${t('yeoncheon.hint')}</p>`}
    ${!ready && state.misses >= 3 && !state.riverHint ? `<button type="button" class="ghost" data-act="hint">${t('yeoncheon.hintBtn')}</button>` : ''}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${noteText(state.note)}</p>` : ''}
    ${ready ? observation() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('yeoncheon.take')}</button>`
      : `<p class="note no">${t('yeoncheon.needPaju')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('yeoncheon.got')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'cheorwon'), 'name') })}</button>` : ''}`;
}

export function act(name, el) {
  if (name === 'hint') set({ riverHint: true });
  else if (name === 'wet') set({ cycle: +el.dataset.cycle, visited: [...state.visited, +el.dataset.cycle] });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID], note: null });
  else if (name === 'next') set({ stop: 'cheorwon', note: null });
}
