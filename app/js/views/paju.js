// 파주 장단 · 시간의 눈: 논이 가장 어두웠던 날과 가장 밝았던 날을 찾는다.
import { state, set, subscribe, data, zone, pass, rainAt, addKey, md } from '../state.js';
import { STOPS, label } from '../stops.js';
import { level, change, refOf, togetherDays } from '../calc.js';
import { extremeDays, judgeExtreme, missionReady } from '../missions.js';
import { t, dateText, noteText } from '../i18n.js';

const ZONE = 'paju-dmz_farm';
const fmt = v => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1)}`;

// 정답이 아닌 날에서 시작한다(첫 화면이 답을 알려 주지 않게)
export function startCycle() {
  const e = extremeDays(data.zones, ZONE), answers = new Set([...e.dark, ...e.bright, e.brightForest]);
  return data.passes.find(p => !p.rest && !answers.has(p.cycle))?.cycle ?? 0;
}

// 밝기 선. 두 날을 모두 맞힌 뒤에만 그린다(그 전에는 지도의 레이더 영상만 보고 고른다). 자료가 있는 모든 통과를 잇는다
function chart() {
  const z = zone(ZONE), n = data.passes.length, W = 300, H = 150, L = 34, R = 8, T = 12, B = 22;
  const all = z.observations.map(o => o.hh_db).filter(v => v != null), lo = Math.min(...all) - .4, hi = Math.max(...all) + .4;
  const x = c => L + (W - L - R) * c / (n - 1), y = v => T + (H - T - B) * (hi - v) / (hi - lo);
  const seen = data.passes.map(p => p.cycle).filter(c => level(z, c) != null);
  const path = seen.map((c, i) => `${i ? 'L' : 'M'}${x(c).toFixed(1)},${y(level(z, c)).toFixed(1)}`).join('');
  const rest = data.passes.filter(p => p.rest).map(p => `<rect x="${x(p.cycle) - 9}" y="${T}" width="18" height="${H - T - B}" class="rest"/>`).join('');
  const dots = seen.map(c => `<circle cx="${x(c)}" cy="${y(level(z, c))}" r="${c === state.cycle ? 5.5 : 3.2}" class="${c === state.cycle ? 'now' : ''}"/>`).join('');
  const flag = (k, label) => state.marks[k] == null ? '' : `<text x="${x(state.marks[k])}" y="${y(level(z, state.marks[k])) + (k === 'dark' ? 16 : -9)}" class="flag">${label}</text>`;
  const ticks = [Math.ceil(lo), Math.floor(hi)].map(v => `<text x="${L - 5}" y="${y(v) + 4}" class="tick" text-anchor="end">${v}</text><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/>`).join('');
  const ends = `<text x="${L}" y="${H - 5}" class="tick">${dateText(data.passes[0].date)}</text><text x="${W - R}" y="${H - 5}" class="tick" text-anchor="end">${dateText(data.passes[n - 1].date)}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('paju.chartAria')}">
    ${rest}${ticks}${ends}<path d="${path}" class="line"/>${dots}${flag('dark', t('paju.flagDark'))}${flag('bright', t('paju.flagBright'))}
    <text x="${L}" y="9" class="tick">${t('paju.axis')}</text></svg>`;
}

function mark(want) {
  const together = togetherDays(data.zones).map(d => d.cycle), cycle = state.cycle;
  const j = judgeExtreme(data.zones, ZONE, cycle, want, together), e = extremeDays(data.zones, ZONE);
  // 문구는 보여 줄 때의 언어로 만든다(say). 판정 결과와 날짜는 누른 순간의 것을 쓴다
  const say = () => {
    const day = dateText(pass(cycle).date), days = list => list.map(c => dateText(pass(c).date)).join(', ');
    if (j.reason === 'rest') return t('paju.noteRest');
    if (!j.ok) return t(want === 'dark' ? 'paju.noteDarker' : 'paju.noteBrighter');
    if (want === 'dark') {
      const others = e.dark.filter(c => c !== cycle);
      return t('paju.noteDark', { day }) + (others.length ? t('paju.noteDarkTie', { days: days(others) }) : '') + t('paju.noteDarkWhy');
    }
    if (j.reason === 'forest') return t('paju.noteForest', { days: days(e.bright), day });
    const rain = rainAt('paju', cycle);
    let text = t('paju.noteBright', { day });
    if (j.reason === 'together') text += t('paju.noteTogether', { rain: rain != null && rain >= 10 ? t('paju.noteRain', { mm: rain.toFixed(0) }) : '' }) +
      (e.brightForest !== cycle ? t('paju.noteForestBest', { day: dateText(pass(e.brightForest).date) }) : '');
    return text;
  };
  const text = say();
  set(j.ok ? { note: { ok: true, text, say }, marks: { ...state.marks, [want]: cycle }, seen: addKey('paju', want) } : { note: { ok: false, text, say } });
}

function discovery() {
  const z = zone(ZONE), ref = refOf(data.zones, z);
  const range = r => { const v = r.observations.map(o => change(r, o.cycle)).filter(x => x != null); return Math.max(...v) - Math.min(...v); };
  return `<div class="found"><h3>${t('common.found')}</h3>
    <p>${t('paju.foundRange', { farm: range(z).toFixed(1), forest: range(ref).toFixed(1) })}</p>
    <p>${t('paju.foundWhy')}</p>
    <p class="fine">${t('paju.foundFine')}</p></div>`;
}

export function render() {
  const seen = state.seen.paju || [], ready = missionReady('paju', seen), got = state.fragments.includes('paju');
  const o = level(zone(ZONE), state.cycle), p = pass(state.cycle);
  // 밝기 숫자는 두 날을 모두 맞힌 뒤에만 보여 준다
  const today = p.rest ? `${dateText(p.date)} · ${t('paju.noData')}` : ready ? `${dateText(p.date)} · ${fmt(o)} dB` : dateText(p.date);
  const step = k => `<li class="${seen.includes(k) ? 'done' : ''}">${seen.includes(k) ? '✓' : '○'} ${t(k === 'dark' ? 'paju.stepDark' : 'paju.stepBright')}${state.marks[k] != null ? ` · ${dateText(pass(state.marks[k]).date)} · ${fmt(level(zone(ZONE), state.marks[k]))} dB` : ''}</li>`;
  return `${ready ? chart() : `<p class="hint locked">${t('paju.locked')}</p>`}
    <p class="today">${t('paju.today')} <b>${today}</b></p>
    <ul class="steps">${step('dark')}${step('bright')}</ul>
    ${ready ? '' : `<div class="acts">
      <button type="button" data-act="mark-dark" ${seen.includes('dark') ? 'disabled' : ''}>${t('paju.markDark')}</button>
      <button type="button" data-act="mark-bright" ${seen.includes('bright') ? 'disabled' : ''}>${t('paju.markBright')}</button></div>
      <p class="hint">${t('paju.hint')}</p>`}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${noteText(state.note)}</p>` : ''}
    ${ready ? discovery() : ''}
    ${ready && !got ? `<button type="button" class="primary" data-act="take">${t('paju.take')}</button>` : ''}
    ${got ? `<p class="note ok">${t('paju.got')}</p>
      <p class="fine">${t('paju.gotFine')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'yeoncheon'), 'name') })}</button>` : ''}`;
}

export function act(name) {
  if (name === 'mark-dark') mark('dark');
  else if (name === 'mark-bright') mark('bright');
  else if (name === 'take' && missionReady('paju', state.seen.paju)) set({ fragments: [...state.fragments, 'paju'], note: null });
  else if (name === 'next') set({ stop: 'yeoncheon', note: null });
}

// ---- 날짜 슬라이더: 파주에서는 아래 날짜 단추 대신 슬라이더로 통과를 넘긴다. 자료가 없는 통과(7/29)는 넣지 않는다.
// 미션 창은 상태가 바뀔 때마다 새로 그려지므로, 끄는 도중에 사라지지 않게 창 밖(아래 띠)에 한 번만 만든다.
export function bind() {
  const cycles = data.passes.filter(p => !p.rest).map(p => p.cycle);
  const box = document.createElement('div');
  box.id = 'paju-slider';
  box.innerHTML = `<label for="paju-range"></label>
    <input id="paju-range" type="range" min="0" max="${cycles.length - 1}" step="1">
    <div class="ticks" aria-hidden="true">${cycles.map(c => `<span>${md(pass(c).date)}</span>`).join('')}</div>`;
  document.getElementById('timeline').before(box);
  const range = box.querySelector('input'), name = box.querySelector('label'), ticks = [...box.querySelectorAll('.ticks span')];
  range.addEventListener('input', () => {
    const c = cycles[+range.value];
    if (c !== state.cycle) set({ cycle: c, visited: [...state.visited, c], note: null });
  });
  const sync = () => {
    if (state.stop !== 'paju') return;
    // 자료가 없는 통과에 와 있으면(다른 지역에서 넘어온 경우) 가장 가까운 자료 있는 통과로 옮긴다
    let i = cycles.indexOf(state.cycle);
    if (i < 0) { i = cycles.reduce((best, c, k) => (Math.abs(c - state.cycle) < Math.abs(cycles[best] - state.cycle) ? k : best), 0); return set({ cycle: cycles[i], visited: [...state.visited, cycles[i]] }); }
    if (+range.value !== i) range.value = i;
    name.textContent = `${t('paju.slider')} · ${dateText(pass(cycles[i]).date)}`;
    range.setAttribute('aria-valuetext', dateText(pass(cycles[i]).date));
    ticks.forEach((el, k) => el.classList.toggle('now', k === i));
  };
  subscribe(sync); sync();
}
