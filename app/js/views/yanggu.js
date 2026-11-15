// 양구 펀치볼 · 밤의 눈: 지도 아래의 손잡이로 날짜를 넘기면, 그날 사진이 찍힌 시각의 하늘이 저녁에서 밤으로 어두워진다. 레이더 영상은 그대로 선명하다.
// 열한 날을 다 보면 "밝은 날과 어두운 밤 가운데 레이더 영상이 더 선명한 쪽은?"에 답한다. 답은 '똑같다'.
// 촬영 시각은 NISAR 그래뉼 이름의 시각(UTC)에서 읽고, 해의 높이는 날짜와 위치로 계산한다. 하늘 색과 '빛으로 찍는 카메라' 그림은 연출이다.
import { state, set, data, zone, addKey, pass } from '../state.js';
import { STOPS } from '../stops.js';
import { missionReady, canTake } from '../missions.js';
import { t, dateText } from '../i18n.js';
import { blip } from '../sound.js';
import { foundCard } from './found.js';
import { crop } from './crop.js';

const ID = 'yanggu', LAT = 38.29, LNG = 128.13;   // 펀치볼 한가운데
const RAD = Math.PI / 180;

// 넘겨 볼 날짜들(영상이 있는 통과)
export const cycles = () => { const d = data.layers.regions[ID].dates; return data.passes.filter(p => !p.rest && d.includes(p.date)).map(p => p.cycle); };
const seenCount = () => cycles().filter(c => state.visited.includes(c)).length;
export const askReady = () => seenCount() >= cycles().length;

// 그 통과가 찍힌 시각(UTC). 그래뉼 이름의 '_A_20260623T102537' 에서 읽는다. 이름에 없으면 다른 통과와 같은 시각으로 본다(같은 궤도)
function shotAt(c) {
  const m = (pass(c)?.granule || '').match(/_(\d{8})T(\d\d)(\d\d)(\d\d)_/), any = data.passes.map(p => (p.granule || '').match(/_(\d{8})T(\d\d)(\d\d)(\d\d)_/)).find(Boolean);
  const k = m || any; if (!k) return null;
  const [y, mo, d] = pass(c).date.split('-').map(Number);
  return { y, mo, d, h: +k[2] + +k[3] / 60 + +k[4] / 3600 };
}
// 해의 높이(도). 0 보다 크면 지평선 위. NOAA 의 근사식
export function sunElev(c) {
  const s = shotAt(c); if (!s) return null;
  const day = Math.floor((Date.UTC(s.y, s.mo - 1, s.d) - Date.UTC(s.y, 0, 0)) / 864e5), g = 2 * Math.PI / 365 * (day - 1 + (s.h - 12) / 24);
  const eqt = 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2 * g) - .040849 * Math.sin(2 * g));
  const dec = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) + .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
  const ha = (((s.h * 60 + eqt + 4 * LNG) % 1440) / 4 - 180) * RAD;
  return Math.asin(Math.sin(LAT * RAD) * Math.sin(dec) + Math.cos(LAT * RAD) * Math.cos(dec) * Math.cos(ha)) / RAD;
}
// 낮(해가 떠 있다) · 해질녘(해는 졌지만 어스름이 남았다) · 밤
const kind = e => (e > .5 ? 'day' : e > -6 ? 'dusk' : 'night');
// 손잡이를 넘길 때의 음높이(0~1): 해가 내려갈수록 낮아진다
export const tone = c => { const e = sunElev(c) ?? 0; return Math.max(0, Math.min(1, (e + 24) / 30)); };
// 한국 시각으로 적은 촬영 시각
function clock(c) {
  const s = shotAt(c); if (!s) return '';
  const total = Math.floor(((s.h + 9) % 24) * 60), h = Math.floor(total / 60), m = total % 60;
  return state.lang === 'en' ? `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}` : `${h}시 ${m}분`;
}
// 하늘의 색(연출): 해의 높이에 따라 노을빛에서 밤의 남색으로
export function sky(e) {
  const k = Math.max(0, Math.min(1, (e + 14) / 19)), mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const top = mix([6, 9, 24], [92, 132, 190]), low = mix([14, 20, 44], [245, 168, 104]);
  return `linear-gradient(180deg,rgb(${top}) 0,rgb(${low}) 100%)`;
}

function scene(c) {
  const e = sunElev(c) ?? 0, y = Math.max(-40, Math.min(70, e * 6));   // 해의 자리(산등성이에서 위아래로). 해는 산 뒤로 넘어간다
  return `<div class="sky ${kind(e)}" style="background:${sky(e)}" role="img" aria-label="${t('yanggu.skyAria')}">
      <i class="stars" style="opacity:${Math.max(0, Math.min(1, (-e - 3) / 9)).toFixed(2)}"></i><i class="sun" style="bottom:${(26 + y).toFixed(0)}px"></i><svg class="ridge" viewBox="0 0 300 46" preserveAspectRatio="none" aria-hidden="true">
        <path class="far" d="M0 46V24L22 15L44 22L70 9L96 20L120 14L140 23L160 17L186 8L212 19L236 12L262 21L284 13L300 19V46Z"/>
        <path class="near" d="M0 46V31L18 24L36 30L58 19L80 28L104 22L126 31L150 34L172 30L196 21L218 29L240 20L262 28L282 23L300 29V46Z"/></svg></div>
    <p class="today">${t('yanggu.shotAt', { time: clock(c) })} ${t(e > .5 ? 'yanggu.sunUp' : e > -1 ? 'yanggu.sunEdge' : 'yanggu.sunDown', { deg: Math.abs(e).toFixed(0) })}</p>`;
}
// 같은 자리를 레이더로 찍은 것(실측)과, 빛으로 찍는 카메라였다면 어땠을지(연출: 해의 높이만큼 어둡게)
function shots(c) {
  const z = zone('yanggu-basin'), b = z ? z.bounds : STOPS.find(s => s.id === ID).bounds, date = pass(c).date, e = sunElev(c) ?? 0;
  const radar = crop(ID, date, b, .5, 'hh', { contrast: 1.4, bright: .95 });
  const dim = +Math.max(.03, Math.min(1, (e + 7) / 11)).toFixed(2), cam = crop(ID, date, b, .5, 'hh', { contrast: 1.4, bright: +(0.95 * dim).toFixed(3) });
  const fig = (x, key) => `<figure><span class="pic" style="aspect-ratio:${x.ar.toFixed(3)};${x.style}"></span><figcaption><b>${t(key)}</b></figcaption></figure>`;
  return `<div class="twoshots">${fig(radar, 'yanggu.shotRadar')}${fig(cam, 'yanggu.shotCamera')}</div>`;
}

function play() {
  const n = cycles().length, seen = seenCount(), ask = seen >= n, c = cycles().includes(state.cycle) ? state.cycle : cycles()[0];
  return `<p class="today big">${dateText(pass(c).date)}</p>
    ${scene(c)}
    ${shots(c)}
    <p class="fine cap">${t('yanggu.shotsFine')}</p>
    <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${seen}" aria-label="${t('yanggu.seenAria')}"><i style="width:${(seen / n * 100).toFixed(0)}%"></i></div>
    <p class="hint">${ask ? t('yanggu.ask') : `${t('yanggu.seen', { n: seen, total: n })} ${t('yanggu.hint')}`}</p>
    ${ask ? `<div class="acts three">${['day', 'night', 'same'].map(a => `<button type="button" data-act="pick" data-answer="${a}">${t(`yanggu.answer.${a}`)}</button>`).join('')}</div>` : ''}`;
}

function result() {
  const kinds = cycles().map(c => kind(sunElev(c) ?? 0)), count = k => kinds.filter(x => x === k).length;
  const chips = `<div class="skychips">${cycles().map(c => { const e = sunElev(c) ?? 0; return `<span style="background:${sky(e)}" title="${dateText(pass(c).date)}"><b>${+pass(c).date.slice(5, 7)}/${+pass(c).date.slice(8)}</b></span>`; }).join('')}</div>`;
  return foundCard({
    head: t('yanggu.foundHead'),
    body: [t(state.quizPick === 'same' ? 'yanggu.pickRight' : 'yanggu.pickWrong'), t('yanggu.foundCount', { total: kinds.length, day: count('day'), dusk: count('dusk'), night: count('night') }), t('yanggu.foundWhyNight')],
    extra: chips,
    more: [t('yanggu.foundTime', { time: clock(cycles()[0]) }), t('yanggu.foundSun'), t('yanggu.foundStaged')],
  });
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  return `${ready ? result() : play()}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('yanggu.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('yanggu.got')}</p>
      ${state.fragments.length === STOPS.length ? `<button type="button" class="primary" data-act="finale">${t(state.finaleDone ? 'finale.again' : 'finale.go')}</button>` : ''}` : ''}`;
}

export function act(name, el) {
  if (name === 'pick' && askReady() && !missionReady(ID, state.seen[ID])) {
    const answer = el.dataset.answer, ok = answer === 'same';
    blip(ok ? 784 : 233, .18, ok ? .35 : .16);
    set({ quizPick: answer, seen: addKey(ID, 'picked') });   // 맞든 틀리든 완료되고, 결과에서 답을 말해 준다
  }
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID] });
  else if (name === 'finale') document.dispatchEvent(new Event('dmz-finale'));   // main.js 가 듣고 피날레를 시작한다
}
