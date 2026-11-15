import { state, set, subscribe, data, load, md, fact } from './state.js';
import { missionReady } from './missions.js';
import { STOPS, label, INTRO_CLIP, centerOf } from './stops.js';
import { initMap, VIEW } from './map.js';
import { endingScore, pieceChime } from './screens/nightmusic.js';
import { play, stop, setSound, blip } from './sound.js';
import { initDance } from './dance.js';
import { initNight } from './screens/night.js';
import { initOpening } from './screens/opening.js';
import { initFilm, startFilm, openTitle } from './screens/film.js';
import { initLand } from './screens/land.js';
import { initProof } from './screens/proof.js';
import { initDateSlider } from './screens/dateslider.js';
import { initGameMap } from './screens/gamemap.js';
import { initZones } from './screens/zones.js';
import { t, dateText } from './i18n.js';
import { lineSvg } from './views/line.js';
import * as paju from './views/paju.js';
import * as yeoncheon from './views/yeoncheon.js';
import * as cheorwon from './views/cheorwon.js';
import * as hwacheon from './views/hwacheon.js';
import * as yanggu from './views/yanggu.js';

const $ = id => document.getElementById(id);
const VIEWS = { paju, yeoncheon, cheorwon, hwacheon, yanggu };   // 미션 화면이 준비된 지역. 나머지는 안내 문구만 보인다.


// 한 지역의 박자: 소개(intro) → 놀기(play) → 결과(result) → 조각을 받은 뒤(done)
// 다시 해 보는 중이면 조각을 이미 받았어도 놀기 → 결과로 간다
const beatOf = st => (st.retry === st.stop ? (missionReady(st.stop, st.seen[st.stop]) ? 'result' : 'play') : st.fragments.includes(st.stop) ? 'done' : missionReady(st.stop, st.seen[st.stop]) ? 'result' : st.introSeen.includes(st.stop) ? 'play' : 'intro');
let beatShown = '';
// 화면이 바뀐 직후의 누르기는 받지 않는다. 강을 긋거나 사진을 고르던 손이, 그 자리에 새로 뜬 단추(조각 받기, 다음 지역, 시작하기)를
// 연달아 눌러 지역이 저절로 넘어가는 일을 막는다
let settleKey = '', settleUntil = 0, settleTimer = 0;
function settle(key, ms = 900) {
  if (key === settleKey) return;
  settleKey = key; settleUntil = performance.now() + ms;
  document.body.classList.add('settling'); clearTimeout(settleTimer);
  settleTimer = setTimeout(() => document.body.classList.remove('settling'), ms);
}
const settling = () => performance.now() < settleUntil;
// 소개 카드: 지역 이름, 한 문장, (있으면) 짧은 영상, 시작 단추
function intro(s, i, beat) {
  const el = $('intro'), on = state.screen === 'mission' && beat === 'intro', key = on ? `${s.id}|${state.lang}` : '';
  el.hidden = !on;
  if (el.dataset.key === key) return;   // 같은 카드를 다시 그리지 않는다(영상이 처음부터 다시 돌지 않게)
  el.dataset.key = key; el.dataset.stop = s.id;
  const clip = INTRO_CLIP[s.id];
  el.innerHTML = on ? `<div class="card">
      ${i === 0 && !state.fragments.length ? `<p class="leadin">${t('mission.leadIn')}</p>` : ''}
      ${clip ? `<figure class="clip"><video src="${clip}" autoplay muted loop playsinline></video><figcaption>${t('common.aiClip')}</figcaption></figure>` : ''}
      ${i === 0 && !state.fragments.length ? `<p class="goal">${t('mission.goal')}</p>` : ''}
      ${lineSvg({ current: i, label: `${i + 1} / ${STOPS.length}` })}
      <h2><span class="mn">${t('mission.n', { n: i + 1 })}</span> <span class="tt">${label(s, 'title')}</span></h2>
      <p class="story">${label(s, 'story')}</p>
      <p class="todo"><b>${t('common.todo')}</b>${label(s, 'todo')}</p>
      <button type="button" class="primary" data-start="${s.id}">${t('common.start')}</button></div>` : '';
  if (on) el.querySelector('button')?.focus({ preventScroll: true });
}

// 푼 미션을 다시 해 본다: 그 지역의 풀이 기록만 지우고, 받은 조각과 이어진 선은 그대로 둔다
function retry(id) {
  VIEWS[id]?.reset?.();
  const seen = { ...state.seen, [id]: [] };
  const clear = { paju: { marks: {} }, yeoncheon: { riverTrace: [], misses: 0, riverHint: false }, cheorwon: { cmpPicks: [], revealed: false }, hwacheon: { eyePick: null }, yanggu: { quizPick: null } }[id] || {};
  set({ ...clear, seen, retry: id, note: null, visited: [], peek: null, scrubbed: null });
}

// 엔딩 카드(hdk, 11/15): 오프닝의 7월 구름 사진과 같은 범위의 레이더를 나란히 다시 꺼내 처음과 끝을 잇는다.
// 후렴('보이지 않는 땅을…')은 엔딩 마지막 문장으로 막 지나갔으므로 카드에서는 되풀이하지 않는다
function pairHtml() {
  const o = data.opening; if (!o?.optical?.file || !o?.radar?.file) return '';
  return `<figure class="pair"><figcaption>${t('ending.pairTitle')}</figcaption>
      <div><img src="data/${o.optical.file}" alt="${t('ending.cloudAlt')}"><span>${t('ending.pairOptical', { date: dateText(o.optical.date) })}</span></div>
      <div><img src="data/${o.radar.file}" alt="${t('opening.altRadar')}"><span>${t('ending.pairRadar', { date: dateText(o.radar.date) })}</span></div></figure>`;
}

// 엔딩이 끝난 뒤 남는 한 장: 후렴, 읽은 다섯 가지, 쓴 자료, 다음에 할 수 있는 일
function endCard() {
  const el = $('ending-card'), on = state.endCard && state.screen === 'mission' && !state.playing, key = on ? state.lang : '';
  el.hidden = !on; document.body.classList.toggle('endcard', on);
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  const first = data.passes.find(p => !p.rest), last = [...data.passes].reverse().find(p => !p.rest);
  el.innerHTML = on ? `<div class="card">
      <button type="button" data-end="close" aria-label="${t('common.close')}" title="${t('common.close')}">×</button>
      ${lineSvg({ current: -1 })}
      ${pairHtml()}
      <h2>${t('ending.cardEyebrow')}</h2>
      <ol>${STOPS.map(s => `<li><span>${label(s, 'name').split(' ')[0]}</span>${t(`${s.id}.feature`)}</li>`).join('')}</ol>
      <p class="fine">${t('ending.cardData', { from: dateText(first.date), to: dateText(last.date), passes: fact('passes') })}</p>
      <div class="acts"><button type="button" class="primary" data-end="again">${t('finale.again')}</button>
        <button type="button" class="again" data-end="explore">${t('ending.explore')}</button></div></div>` : '';
  if (on) el.querySelector('.primary').focus({ preventScroll: true });
}

let fragShown = 0, newDot = null, newUntil = 0;   // 방금 받은 조각의 점은 잠깐 튄다(그 사이 창이 다시 그려져도 유지)
let peekShown = null;   // 방금 그린 설명 풍선의 지역(같은 풍선을 다시 그릴 때는 움직이지 않는다)
function panel() {
  const s = STOPS.find(x => x.id === state.stop), i = STOPS.indexOf(s), view = VIEWS[s.id];
  const done = state.fragments.includes(s.id), beat = beatOf(state);
  document.body.dataset.beat = state.screen === 'mission' ? beat : '';
  intro(s, i, beat);
  endCard();
  if (state.screen === 'mission') settle(`${s.id}|${beat}|${state.cmpPicks.length}`, beat === 'play' ? 450 : 1200);
  const arrive = beat !== beatShown && beat === 'result';   // 방금 미션을 풀었다
  $('panel').classList.toggle('in', arrive); beatShown = beat;
  if (state.fragments.length > fragShown) { newDot = state.fragments[state.fragments.length - 1]; newUntil = performance.now() + 900; }
  if (beat === 'play' && state.peek && state.peek !== s.id) state.peek = null;   // 미션을 푸는 동안에는 다른 지역의 설명을 열지 않는다(단추도 눌리지 않는다)
  // 머리: 서쪽에서 동쪽으로 이어 가는 선. 조각을 받은 지역은 채워지고, 지금 지역은 빛난다
  const track = STOPS.map((x, k) => `<li class="${state.fragments.includes(x.id) ? 'got' : ''}${newDot === x.id && performance.now() < newUntil ? ' new' : ''}${k === i ? ' now' : ''}${state.peek === x.id ? ' open' : ''}"><button type="button" data-peek="${x.id}" aria-expanded="${state.peek === x.id}"${beat === 'play' && k !== i ? ' disabled' : ''}><i></i><span>${label(x, 'name').split(' ')[0]}</span></button></li>`).join('');
  // 선의 지역을 누르면 그 지역의 설명이 펼쳐진다. 앞 조각을 다 모은 지역이면 그리로 갈 수도 있다
  const pk = STOPS.find(x => x.id === state.peek), pi = STOPS.indexOf(pk);
  const open = pk && STOPS.slice(0, pi).every(x => state.fragments.includes(x.id));
  const peek = pk ? `<div class="peek${state.peek !== peekShown ? ' in' : ''}" style="--at:${pi}"><p class="eye">${label(pk, 'name')} · ${label(pk, 'eye')}</p>
      <p>${label(pk, 'story')}</p>
      ${pk.id === s.id ? '' : open ? `<button type="button" data-go="${pk.id}">${t('common.goThere')}</button>` : `<p class="fine">${t('common.locked')}</p>`}</div>` : '';
  peekShown = state.peek; fragShown = state.fragments.length;
  $('panel').dataset.stop = s.id;
  $('panel').innerHTML = `
    ${lineSvg({ current: i, draw: arrive ? i : -1, solved: beat === 'result' ? s.id : null, label: `${i + 1} / ${STOPS.length}` })}
    <p class="pieces" aria-label="${t('common.piece', { n: state.fragments.length, total: STOPS.length })}"><b>${state.fragments.length}</b> / ${STOPS.length}</p>
    <ol class="track">${track}</ol>${peek}
    <header class="brief"><p class="eye">${label(s, 'name')} · ${label(s, 'eye')}</p><h2><span class="mn">${t('mission.n', { n: i + 1 })}</span> <span class="tt">${label(s, 'title')}</span></h2></header>
    <p class="todo${done ? ' done' : ''}"><b>${done ? '✓' : t('common.todo')}</b>${label(s, 'todo')}</p>
    <div class="play">${view ? view.render() : `<p class="hint">${t('mission.soon')}</p>`}</div>
    ${state.fragments.length === STOPS.length && s.id !== 'yanggu' && beat === 'done' ? `<button type="button" class="primary" data-finale>${t(state.finaleDone ? 'finale.again' : 'finale.go')}</button>` : ''}
    ${missionReady(s.id, state.seen[s.id]) ? `<button type="button" class="ghost again" data-retry="${s.id}">${t('common.retry')}</button>` : ''}`;
  answerArrow();
}

// 답을 고를 단추가 풀렸는데 창 아래로 밀려 안 보이면, 창 아래쪽에 아래 화살표를 띄운다. 누르면 단추까지 내려간다
let arrowEl = null;
const answerActs = () => $('panel').querySelector('.play .acts:not(.wait)');
function answerArrow() {
  if (!arrowEl) {
    arrowEl = document.createElement('button'); arrowEl.id = 'answer-arrow'; arrowEl.type = 'button'; arrowEl.hidden = true;
    arrowEl.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v10M3.5 8.5 8 13l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.append(arrowEl);
    arrowEl.addEventListener('click', () => answerActs()?.scrollIntoView({ block: 'end', behavior: 'smooth' }));
    document.addEventListener('scroll', answerArrow, true); addEventListener('resize', answerArrow);
  }
  const acts = answerActs(), r = $('panel').getBoundingClientRect(), floor = Math.min(r.bottom, innerHeight);
  const on = state.screen === 'mission' && document.body.dataset.beat === 'play' && !state.playing && !!acts && acts.getBoundingClientRect().top > floor - 24;
  arrowEl.hidden = !on;
  if (on) { arrowEl.style.left = `${r.left + r.width / 2}px`; arrowEl.style.top = `${floor - 60}px`; arrowEl.title = t('common.toAnswer'); arrowEl.setAttribute('aria-label', arrowEl.title); }
}

// 조각을 받는 순간 화면 가운데에 잠깐 뜨는 알림: 몇 번째 조각인지, 무엇을 읽는 법인지, 선이 어디까지 이어졌는지
let toastTimer = 0;
// 알림의 글. 열려 있는 동안 언어를 바꾸면 이 함수로 다시 쓴다(선 그리기는 처음 한 번만, hdk)
function fillToast(el, id, draw = true) {
  const n = state.fragments.length, word = t(`${id}.feature`);
  el.innerHTML = `<p class="n">${t('common.piece', { n, total: STOPS.length })}</p><p class="word">${word}</p><p class="saw">${t(`${id}.saw`)}</p>
    ${lineSvg({ current: n - 1, draw: draw ? n - 1 : -1 })}
    <p class="to">${t(n === STOPS.length ? 'common.pieceAll' : 'common.pieceTo', { name: label(STOPS.find(x => x.id === id), 'name').split(' ')[0] })}</p>
    ${n === STOPS.length ? `<button type="button" class="go" data-finale>${t('finale.go')}</button>` : ''}
    <button type="button" data-close aria-label="${t('common.close')}" title="${t('common.close')}">×</button>`;
}
function pieceToast(id) {
  const el = $('piece-toast');
  el.dataset.stop = id;
  fillToast(el, id);
  el.hidden = false; el.classList.remove('out'); void el.offsetWidth; el.classList.add('in');
  // 저절로 사라지지 않는다. 닫기를 눌러야 닫힌다(다음 지역으로 넘어가면 함께 걷힌다)
  clearTimeout(toastTimer);
  el.onclick = e => {
    if (e.target.closest('[data-finale]')) { el.hidden = true; el.classList.remove('in', 'out'); return finale(); }
    if (!e.target.closest('[data-close]')) return;
    el.classList.add('out'); toastTimer = setTimeout(() => { el.hidden = true; el.classList.remove('in', 'out'); }, 400);
  };
  el.querySelector('[data-close]').focus({ preventScroll: true });
}

// 조각을 받는 순간: 받기 단추에서 빛 조각이 떠오르고, 지도가 물러나 선을 보여 주면(map.js) 지도 위 그 지역의 점으로 날아가 꽂힌다.
// 꽂히는 순간 그 지역 점에 불이 켜지고, 그 구간의 선이 실측 값으로 춤추고(perform) 알림이 뜬다. 움직임을 줄인 환경이나 단추를 모를 때는 바로 꽂힌다
let takeFrom = null;
const FLY_AFTER = 1150;   // map.js 가 물러나는 시간(1100ms) 뒤에 날아간다. 날아가는 동안 지도가 멈춰 있어야 꽂힐 자리가 맞는다
function pieceFly(id, land) {
  const map = window.dmzMap, from = takeFrom; takeFrom = null;
  if (!map || !from || matchMedia('(prefers-reduced-motion: reduce)').matches) return land();
  set({ landing: id });
  blip(880, .18, .35);
  const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2, el = document.createElement('i');
  el.className = 'shard'; el.dataset.stop = id; el.style.left = `${x0}px`; el.style.top = `${y0}px`;
  document.body.append(el);
  // 꽂히는 자리: 지도 위 그 지역의 점(map.js 의 .pin, 예: '연천 임진강'). 날아가는 동안 매 프레임 다시 재서, 지도가 움직여도 점을 따라간다
  const target = () => {
    const pin = document.querySelector(`.pin[data-stop="${id}"]`)?.getBoundingClientRect();
    if (pin?.width) return { x: pin.left + pin.width / 2, y: pin.top + pin.height / 2 };
    const box = map.getContainer().getBoundingClientRect(), q = map.project(centerOf(STOPS.find(x => x.id === id)));
    return { x: box.left + q.x, y: box.top + q.y };
  };
  const FLY = 850;
  setTimeout(() => {
    if (!el.isConnected) return;
    const t0 = performance.now(), sx = x0, sy = y0 - 36;   // -36: 떠오를 때 올라간 자리(style.css 의 shard-rise)
    el.style.translate = '0 0'; el.style.animation = 'none'; el.style.scale = '1.2';
    const step = now => {
      if (!el.isConnected) return;
      const k = Math.min(1, (now - t0) / FLY), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2, c = target();
      // 포물선: 출발점과 지금의 도착점 사이를 잇고, 가운데에서 140px 위로 솟는다
      el.style.left = `${sx + (c.x - sx) * e}px`; el.style.top = `${sy + (c.y - sy) * e - 140 * 4 * e * (1 - e)}px`; el.style.scale = String(1.2 - .7 * e);
      if (k < 1) return requestAnimationFrame(step);
      const ring = document.createElement('i'); ring.className = 'shard-burst'; ring.dataset.stop = id;
      ring.style.left = `${c.x}px`; ring.style.top = `${c.y}px`;
      ring.addEventListener('animationend', () => ring.remove()); document.body.append(ring);
      el.remove(); set({ landing: null }); land();
    };
    requestAnimationFrame(step);
  }, FLY_AFTER);
}

// ---- 소리와 춤
// 음악은 밤하늘의 주제를 쓴다(screens/nightmusic.js). 엔딩에서는 그 주제에 가락이 얹혀 완성되고, 조각을 받을 때는 한 마디가 울린다.
// 음악은 연출이다. 실측을 따르는 것은 선의 움직임이다(dance.js).
let timer = 0;
function perform(mode, ids) {
  const plan = mode === 'finale' ? endingScore() : pieceChime(ids.length);
  const at = play(plan);
  clearTimeout(timer);
  timer = setTimeout(() => set({ playing: null, ...(mode === 'finale' ? { finaleDone: true, endCard: true } : {}) }), plan.duration * 1000 + 300);
  set({ playing: { mode, at, duration: plan.duration, ids } });
}
function finale() {
  { const el = $('piece-toast'); clearTimeout(toastTimer); el.hidden = true; el.classList.remove('in', 'out'); }   // 어느 단추로 시작하든 조각 알림을 걷는다(hdk)
  window.dmzMap.fitBounds(VIEW, { padding: { top: 90, bottom: 230, left: 30, right: 30 }, duration: 1000 });
  perform('finale', STOPS.map(s => s.id));
}

// 화면(밤사진 / 미션)에 따라 바뀌는 바깥 틀: 본문 클래스, 머리말, 돌아가기 단추
function chrome(s) {
  document.body.dataset.screen = s.screen;
  document.body.dataset.stop = s.stop;
  document.body.dataset.night = s.nightMode;
  document.documentElement.lang = s.lang;
  $('lead').textContent = t(s.screen === 'mission' ? 'mission.lead' : 'night.lead');
  $('to-night').textContent = t('mission.back');
  $('lang').textContent = t('lang.other'); $('lang').setAttribute('aria-label', t('lang.aria')); $('lang').title = t('lang.aria');   // 바꿀 언어를 짧게(EN / 한)
  $('stage-note').textContent = t('stage.note');
  $('map').setAttribute('aria-label', t('map.aria'));
}

function fail(e) {
  console.error(e);
  $('notice').hidden = false;
  $('notice').textContent = `${t('notice.load')} (${e.message})`;
}

async function start() {
  // 시험용: 화면이 가려져 애니메이션 프레임이 멈추는 환경에서도 그리기를 확인할 수 있게 한다(?timer)
  if (new URLSearchParams(location.search).has('timer')) window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
  // 언어: 주소의 ?lang=en 이 먼저, 없으면 지난번에 고른 언어
  const asked = new URLSearchParams(location.search).get('lang');
  let saved = null; try { saved = localStorage.getItem('dmz-lang'); } catch { /* 없음 */ }
  if (['ko', 'en'].includes(asked || saved)) state.lang = asked || saved;
  await load();
  if (!data.opening) state.screen = 'night';   // 오프닝 자료가 없으면 밤사진부터 시작한다
  const first = paju.startCycle();
  Object.assign(state, { cycle: first, visited: [first] });
  const map = window.dmzMap = initMap();   // 콘솔에서 살펴볼 수 있게 둔다
  initDance(map);
  initNight();
  initOpening();
  initFilm();
  document.addEventListener('dmz-film', startFilm);   // 둘러보기 창의 '다시 보기'
  initLand(map);
  initProof();
  initDateSlider();
  initGameMap(map);
  initZones(map);
  // 끌다가 뗀 것은 누르기로 치지 않는다: 강을 긋던 손이 새로 뜬 카드의 넓은 단추 위에서 긋기를 이어 가면, 그 단추 안에서 누르고 뗀 것이 되어 눌려 버린다
  let downAt = null, dragged = false;
  document.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; dragged = false; }, true);
  document.addEventListener('pointermove', e => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 10) dragged = true; }, true);
  for (const id of ['intro', 'panel']) $(id).addEventListener('click', e => {
    const drag = dragged && e.detail > 0; dragged = false;   // e.detail 이 0 이면 키보드로 누른 것이다
    if (settling() || drag) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);
  $('ending-card').addEventListener('click', e => {
    const act = e.target.closest('[data-end]')?.dataset.end;
    if (act === 'close') set({ endCard: false });
    else if (act === 'again') { set({ endCard: false }); finale(); }
    else if (act === 'explore') set({ endCard: false, screen: 'night', nightMode: 'explore' });
  });
  $('intro').addEventListener('click', e => { const b = e.target.closest('[data-start]'); if (b) set({ introSeen: [...state.introSeen, b.dataset.start] }); });
  $('to-night').addEventListener('click', () => openTitle());   // 게임에서 '처음으로': 영상 끝의 제목 장면으로(hdk)
  $('lang').addEventListener('click', () => {
    const lang = state.lang === 'ko' ? 'en' : 'ko';
    try { localStorage.setItem('dmz-lang', lang); } catch { /* 저장이 막힌 환경에서도 전환은 된다 */ }
    set({ lang });
  });
  $('panel').addEventListener('click', e => {
    if (e.target.closest('[data-finale]')) return finale();
    const again = e.target.closest('[data-retry]');
    if (again) return retry(again.dataset.retry);
    const pk = e.target.closest('[data-peek]'), go = e.target.closest('[data-go]');
    if (pk) return set({ peek: state.peek === pk.dataset.peek ? null : pk.dataset.peek });
    if (go) return set({ stop: go.dataset.go, peek: null, note: null });
    const b = e.target.closest('[data-act]');
    if (b?.dataset.act === 'take') takeFrom = b.getBoundingClientRect();   // 조각이 떠오르는 자리
    if (b && !b.disabled) VIEWS[state.stop]?.act(b.dataset.act, b);
  });
  for (const v of Object.values(VIEWS)) v.bind?.($('panel'));
  document.addEventListener('dmz-finale', finale);   // 양구 미션 창의 '춤추는 DMZ' 단추
  $('sound').addEventListener('click', () => { const on = !state.sound; setSound(on); set({ sound: on }); });
  document.addEventListener('dmz-map-click', e => VIEWS[state.stop]?.mapClick?.(e.detail.lng, e.detail.lat));
  subscribe((s, prev) => {
    if (s.stop !== prev.stop) Object.assign(state, { visited: [s.cycle], note: null, pol: 'hh', retry: null, scrubbed: null });   // 지역을 옮기면 눈은 HH 로 돌아간다
    // 게임 밖(처음으로, 밤하늘)으로 나가면 엔딩은 거기서 끝난다: 도는 중이면 멈추고, 엔딩 카드도 걷는다. 안 그러면 '미션 시작'으로 돌아왔을 때 엔딩이 다시 뜬다
    if (s.screen !== prev.screen && s.screen !== 'mission' && (state.playing || state.endCard)) { stop(); clearTimeout(timer); set({ playing: null, endCard: false }); }
    panel();
    if (s.fragments.length > prev.fragments.length) { const id = s.fragments[s.fragments.length - 1]; pieceFly(id, () => { if (state.stop === id && state.screen === 'mission' && state.playing?.mode !== 'finale' && !state.endCard) {   /* 조각이 날아가는 사이 엔딩을 시작했으면 알림·미리 듣기를 다시 띄우지 않는다(hdk) */ perform('preview', state.fragments); pieceToast(id); } }); }   // 조각을 받으면 지금까지 모은 층이 함께 울린다
    if (s.stop !== prev.stop || (s.screen !== prev.screen && s.screen !== 'mission')) { clearTimeout(toastTimer); $('piece-toast').hidden = true; document.querySelectorAll('.shard').forEach(e => e.remove()); if (s.landing) set({ landing: null }); }   // 다음 지역의 소개 카드와 겹치지 않게, 게임 밖(처음으로 등)으로 나가도 알림을 걷는다
    { const el = $('piece-toast'); if (s.lang !== prev.lang && !el.hidden && el.dataset.stop) fillToast(el, el.dataset.stop, false); }   // 열린 알림도 언어를 따라 바뀐다(hdk)
    if (s.stop !== prev.stop && s.playing) { stop(); clearTimeout(timer); state.playing = null; }
    chrome(s);
    const fin = s.playing?.mode === 'finale';
    document.body.classList.toggle('finale', fin);
    $('stage').hidden = !fin;   // 자막과 안내문은 엔딩이 도는 동안에만 보인다
    $('sound').title = t(s.sound ? 'sound.on' : 'sound.off'); $('sound').setAttribute('aria-label', $('sound').title); $('sound').setAttribute('aria-pressed', s.sound);
  });
  panel(); chrome(state);
}
start().catch(fail);
