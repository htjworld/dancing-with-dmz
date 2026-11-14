import { state, set, subscribe, data, load, md } from './state.js';
import { missionReady } from './missions.js';
import { STOPS, label, INTRO_CLIP } from './stops.js';
import { initMap, VIEW } from './map.js';
import { endingScore, pieceChime } from './screens/nightmusic.js';
import { play, stop, setSound } from './sound.js';
import { initDance } from './dance.js';
import { initNight } from './screens/night.js';
import { initOpening } from './screens/opening.js';
import { initFilm, startFilm } from './screens/film.js';
import { initLand } from './screens/land.js';
import { initProof } from './screens/proof.js';
import { initDateSlider } from './screens/dateslider.js';
import { initGameMap } from './screens/gamemap.js';
import { initZones } from './screens/zones.js';
import { t } from './i18n.js';
import { lineSvg } from './views/line.js';
import * as paju from './views/paju.js';
import * as yeoncheon from './views/yeoncheon.js';
import * as cheorwon from './views/cheorwon.js';
import * as hwacheon from './views/hwacheon.js';
import * as yanggu from './views/yanggu.js';

const $ = id => document.getElementById(id);
const VIEWS = { paju, yeoncheon, cheorwon, hwacheon, yanggu };   // 미션 화면이 준비된 지역. 나머지는 안내 문구만 보인다.


// 한 지역의 박자: 소개(intro) → 놀기(play) → 결과(result) → 조각을 받은 뒤(done)
const beatOf = st => (st.fragments.includes(st.stop) ? 'done' : missionReady(st.stop, st.seen[st.stop]) ? 'result' : st.introSeen.includes(st.stop) ? 'play' : 'intro');
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
      ${clip ? `<video src="${clip}" autoplay muted loop playsinline></video>` : ''}
      ${lineSvg({ current: i, label: `${i + 1} / ${STOPS.length}` })}
      <p class="eye">${label(s, 'name')} · ${label(s, 'eye')}</p><h2>${label(s, 'title')}</h2>
      <p class="story">${label(s, 'story')}</p>
      <p class="todo"><b>${t('common.todo')}</b>${label(s, 'todo')}</p>
      <button type="button" class="primary" data-start="${s.id}">${t('common.start')}</button></div>` : '';
  if (on) el.querySelector('button')?.focus({ preventScroll: true });
}

let fragShown = 0, newDot = null, newUntil = 0;   // 방금 받은 조각의 점은 잠깐 튄다(그 사이 창이 다시 그려져도 유지)
let peekShown = null;   // 방금 그린 설명 풍선의 지역(같은 풍선을 다시 그릴 때는 움직이지 않는다)
function panel() {
  const s = STOPS.find(x => x.id === state.stop), i = STOPS.indexOf(s), view = VIEWS[s.id];
  const done = state.fragments.includes(s.id), beat = beatOf(state);
  document.body.dataset.beat = state.screen === 'mission' ? beat : '';
  intro(s, i, beat);
  if (state.screen === 'mission') settle(`${s.id}|${beat}|${state.cmpPicks.length}`, beat === 'play' ? 450 : 1200);
  const arrive = beat !== beatShown && beat === 'result';   // 방금 미션을 풀었다
  $('panel').classList.toggle('in', arrive); beatShown = beat;
  if (state.fragments.length > fragShown) { newDot = state.fragments[state.fragments.length - 1]; newUntil = performance.now() + 900; }
  // 머리: 서쪽에서 동쪽으로 이어 가는 선. 조각을 받은 지역은 채워지고, 지금 지역은 빛난다
  const track = STOPS.map((x, k) => `<li class="${state.fragments.includes(x.id) ? 'got' : ''}${newDot === x.id && performance.now() < newUntil ? ' new' : ''}${k === i ? ' now' : ''}${state.peek === x.id ? ' open' : ''}"><button type="button" data-peek="${x.id}" aria-expanded="${state.peek === x.id}"><i></i><span>${label(x, 'name').split(' ')[0]}</span></button></li>`).join('');
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
    <ol class="track">${track}</ol>${peek}
    <header class="brief"><p class="eye">${label(s, 'name')} · ${label(s, 'eye')}</p><h2>${label(s, 'title')}</h2></header>
    <p class="todo${done ? ' done' : ''}"><b>${done ? '✓' : t('common.todo')}</b>${label(s, 'todo')}</p>
    <div class="play">${view ? view.render() : `<p class="hint">${t('mission.soon')}</p>`}</div>`;
}

// 조각을 받는 순간 화면 가운데에 잠깐 뜨는 알림: 몇 번째 조각인지, 무엇을 읽는 법인지, 선이 어디까지 이어졌는지
let toastTimer = 0;
function pieceToast(id) {
  const el = $('piece-toast'), n = state.fragments.length, word = t(`${id}.feature`);
  el.dataset.stop = id;
  el.innerHTML = `<p class="n">${t('common.piece', { n, total: STOPS.length })}</p><p class="word">${word}</p><p class="saw">${t(`${id}.saw`)}</p>
    ${lineSvg({ current: n - 1, draw: n - 1 })}
    <p class="to">${t(n === STOPS.length ? 'common.pieceAll' : 'common.pieceTo', { name: label(STOPS.find(x => x.id === id), 'name').split(' ')[0] })}</p>
    <button type="button" data-close aria-label="${t('common.close')}" title="${t('common.close')}">×</button>`;
  el.hidden = false; el.classList.remove('out'); void el.offsetWidth; el.classList.add('in');
  // 저절로 사라지지 않는다. 닫기를 눌러야 닫힌다(다음 지역으로 넘어가면 함께 걷힌다)
  clearTimeout(toastTimer);
  el.onclick = e => {
    if (!e.target.closest('[data-close]')) return;
    el.classList.add('out'); toastTimer = setTimeout(() => { el.hidden = true; el.classList.remove('in', 'out'); }, 400);
  };
  el.querySelector('[data-close]').focus({ preventScroll: true });
}

// ---- 소리와 춤
// 음악은 밤하늘의 주제를 쓴다(screens/nightmusic.js). 엔딩에서는 그 주제에 가락이 얹혀 완성되고, 조각을 받을 때는 한 마디가 울린다.
// 음악은 연출이다. 실측을 따르는 것은 선의 움직임이다(dance.js).
let timer = 0;
function perform(mode, ids) {
  const plan = mode === 'finale' ? endingScore() : pieceChime(ids.length);
  const at = play(plan);
  clearTimeout(timer);
  timer = setTimeout(() => set({ playing: null, ...(mode === 'finale' ? { finaleDone: true } : {}) }), plan.duration * 1000 + 300);
  set({ playing: { mode, at, duration: plan.duration, ids } });
}
function finale() {
  window.dmzMap.fitBounds(VIEW, { padding: { top: 90, bottom: 190, left: 30, right: 30 }, duration: 1000 });
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
  $('lang').textContent = t('lang.other'); $('lang').setAttribute('aria-label', t('lang.aria'));
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
  $('intro').addEventListener('click', e => { const b = e.target.closest('[data-start]'); if (b) set({ introSeen: [...state.introSeen, b.dataset.start] }); });
  $('to-night').addEventListener('click', () => set({ screen: 'night', nightMode: 'explore' }));   // 게임에서 돌아오면 둘러보기로
  $('lang').addEventListener('click', () => {
    const lang = state.lang === 'ko' ? 'en' : 'ko';
    try { localStorage.setItem('dmz-lang', lang); } catch { /* 저장이 막힌 환경에서도 전환은 된다 */ }
    set({ lang });
  });
  $('panel').addEventListener('click', e => {
    const pk = e.target.closest('[data-peek]'), go = e.target.closest('[data-go]');
    if (pk) return set({ peek: state.peek === pk.dataset.peek ? null : pk.dataset.peek });
    if (go) return set({ stop: go.dataset.go, peek: null, note: null });
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) VIEWS[state.stop]?.act(b.dataset.act, b);
  });
  for (const v of Object.values(VIEWS)) v.bind?.($('panel'));
  document.addEventListener('dmz-finale', finale);   // 양구 미션 창의 '춤추는 DMZ' 단추
  $('sound').addEventListener('click', () => { const on = !state.sound; setSound(on); set({ sound: on }); });
  document.addEventListener('dmz-map-click', e => VIEWS[state.stop]?.mapClick?.(e.detail.lng, e.detail.lat));
  subscribe((s, prev) => {
    if (s.stop !== prev.stop) Object.assign(state, { visited: [s.cycle], note: null, pol: 'hh' });   // 지역을 옮기면 눈은 HH 로 돌아간다
    panel();
    if (s.fragments.length > prev.fragments.length) { perform('preview', s.fragments); pieceToast(s.fragments[s.fragments.length - 1]); }   // 조각을 받으면 지금까지 모은 층이 함께 울린다
    if (s.stop !== prev.stop) { clearTimeout(toastTimer); $('piece-toast').hidden = true; }   // 다음 지역의 소개 카드와 겹치지 않게 알림을 걷는다
    if (s.stop !== prev.stop && s.playing) { stop(); clearTimeout(timer); state.playing = null; }
    chrome(s);
    const fin = s.playing?.mode === 'finale';
    document.body.classList.toggle('finale', fin);
    $('stage').hidden = !(fin || s.finaleDone && s.fragments.length === STOPS.length && !s.playing && s.stop === 'yanggu');
    $('sound').textContent = t(s.sound ? 'sound.on' : 'sound.off'); $('sound').setAttribute('aria-pressed', s.sound);
  });
  panel(); chrome(state);
}
start().catch(fail);
