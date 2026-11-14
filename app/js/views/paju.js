// 파주 장단 · 시간의 눈: 같은 논을 찍은 사진들이 섞여 놓여 있다. 가장 어두운 장과 가장 밝은 장을 차례로 집는다.
// 두 장을 찾으면 사진이 날짜순으로 늘어서고 밝기 그래프가 나타난다.
import { state, set, data, zone, pass, rainAt, addKey } from '../state.js';
import { STOPS, label } from '../stops.js';
import { level, change, refOf, togetherDays } from '../calc.js';
import { extremeDays, judgeExtreme, missionReady } from '../missions.js';
import { pixelOf } from '../glow.js';
import { t, dateText, noteText } from '../i18n.js';
import { foundCard } from './found.js';
import { crop } from './crop.js';
import { blip } from '../sound.js';

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

// 사진 한 장: 그날 레이더 영상에서 논 구역(둘레를 조금 포함)만 잘라 보여 준다
// 지도 위 날짜 손잡이(screens/gamemap.js)가 쓰는 것: 넘겨 볼 날짜들, 넘길 때의 음높이(논이 밝을수록 높다). 파주는 손잡이로 답을 고르지 않는다
export const cycles = () => { const d = data.layers.regions.paju.dates; return data.passes.filter(x => !x.rest && d.includes(x.date)).map(x => x.cycle); };
export const tone = c => { const z = zone(ZONE), all = cycles().map(k => level(z, k)).filter(v => v != null), lo = Math.min(...all), hi = Math.max(...all), v = level(z, c); return v == null ? 0 : (v - lo) / ((hi - lo) || 1); };
export const askReady = () => false;
// 날짜 바로 넘겨 봐서 사진이 놓인 날의 수
const shownCount = () => cycles().filter((c, i) => i === 0 || (state.scrubbed === 'paju' && state.visited.includes(c))).length;

function frames(ready) {
  const L = data.layers.regions.paju, b = zone(ZONE).bounds;   // [서, 남, 동, 북]
  const look = { contrast: 1.7, bright: .82 }, pic = c => crop('paju', pass(c).date, b, .12, 'hh', look);
  const cycles = data.passes.filter(x => !x.rest && L.dates.includes(x.date)).map(x => x.cycle);
  // 날짜순으로 자리를 잡아 두고, 날짜 바로 넘겨 본 날의 사진만 채운다(같은 곳을 다시 찍을 때마다 한 장씩 쌓인다). 처음에는 첫 날 한 장만 있다
  const seen = c => ready || c === cycles[0] || (state.scrubbed === 'paju' && state.visited.includes(c));   // 첫 날(6월 23일)의 사진은 처음부터 놓여 있다
  return `<div class="frames${ready ? ' sorted' : ''}" style="--ar:${pic(cycles[0]).ar.toFixed(3)}">${cycles.map(c => {
    if (!seen(c)) return '<span class="frame empty" aria-hidden="true"></span>';
    const dark = state.marks.dark === c, bright = state.marks.bright === c;
    return `<button type="button" class="frame${c === state.cycle ? ' now' : ''}${dark ? ' dark' : ''}${bright ? ' bright' : ''}" data-act="frame" data-cycle="${c}"
      aria-label="${dateText(pass(c).date)}"
><span class="pic" style="${pic(c).style}"></span>
      ${dark ? `<b>${t('paju.flagDark')}</b>` : bright ? `<b>${t('paju.flagBright')}</b>` : ''}<small>${dateText(pass(c).date)}</small></button>`;
  }).join('')}</div>`;
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
  const farm = range(z), forest = range(ref);
  // 찾아낸 두 날의 사진을 나란히 놓는다: 가장 어두운 날과 가장 밝은 날
  const shot = (k, key) => {
    const c = state.marks[k]; if (c == null) return '';
    const b = z.bounds, h = (b[3] - b[1]) / 4;   // 세로는 구역의 가운데 절반만 보여 준다
    const cr = crop('paju', pass(c).date, [b[0], b[1] + h, b[2], b[3] - h], .12, 'hh', { contrast: 1.5, bright: .9 });
    return `<figure><span class="pic" style="aspect-ratio:${cr.ar.toFixed(3)};${cr.style}"></span>
      <figcaption><b>${t(key)}</b>${dateText(pass(c).date)} · ${fmt(level(z, c))} dB</figcaption></figure>`;
  };
  return foundCard({
    extra: `<div class="twoshots">${shot('dark', 'paju.stepDark')}${shot('bright', 'paju.stepBright')}</div>${chart()}`,
    head: t('paju.foundHead'),
    rows: [{ name: t('paju.foundFarm'), value: farm }, { name: t('paju.foundForest'), value: forest, cls: 'calm' }],
    caption: t('common.foundSwing'),
    body: [t('paju.foundSub'), t('paju.foundWhy')],
    more: [t('paju.foundRange', { farm: farm.toFixed(1), forest: forest.toFixed(1) }), t('common.foundNoCause'), t('paju.foundFine')],
  });
}

export function render() {
  const seen = state.seen.paju || [], ready = missionReady('paju', seen), got = state.fragments.includes('paju');
  const want = !seen.includes('dark') ? 'dark' : 'bright';   // 먼저 가장 어두운 장, 그다음 가장 밝은 장
  const step = k => `<li class="${seen.includes(k) ? 'done' : ''}${!ready && want === k ? ' now' : ''}">${seen.includes(k) ? '✓' : want === k ? '▶' : '○'} ${t(k === 'dark' ? 'paju.stepDark' : 'paju.stepBright')}${state.marks[k] != null ? ` · ${dateText(pass(state.marks[k]).date)} · ${fmt(level(zone(ZONE), state.marks[k]))} dB` : ''}</li>`;
  return `<ul class="steps">${step('dark')}${step('bright')}</ul>
    ${ready ? '' : `<p class="hint">${t(shownCount() < cycles().length ? 'paju.reveal' : want === 'dark' ? 'paju.pickDark' : 'paju.pickBright', { n: shownCount(), total: cycles().length })}</p>`}
    ${ready ? discovery() : ''}
    ${ready ? '' : `${frames(false)}
    ${state.note ? `<p class="note ${state.note.ok ? 'ok' : 'no'}" role="status">${noteText(state.note)}</p>` : ''}
    <p class="fine">${t('paju.locked')}</p>`}
    ${ready && !got ? `<button type="button" class="primary" data-act="take">${t('paju.take')}</button>` : ''}
    ${got ? `<p class="note ok">${t('paju.got')}</p>
      <p class="fine">${t('paju.gotFine')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'yeoncheon'), 'name') })}</button>` : ''}`;
}

export function act(name, el) {
  if (name === 'frame') {   // 사진을 집으면 지도도 그날로 바뀐다. 아직 찾는 중이면 그 장이 답인지 본다
    const c = +el.dataset.cycle, seen = state.seen.paju || [];
    set({ cycle: c, visited: [...state.visited, c], note: null, scrubbed: 'paju' });
    if (!missionReady('paju', seen)) { mark(!seen.includes('dark') ? 'dark' : 'bright'); blip(state.note?.ok ? 660 : 233, .16, state.note?.ok ? .3 : .16); }   // 맞으면 높은 음, 아니면 낮고 짧은 음
  }
  else if (name === 'take' && missionReady('paju', state.seen.paju)) set({ fragments: [...state.fragments, 'paju'], note: null });
  else if (name === 'next') set({ stop: 'yeoncheon', note: null });
}
