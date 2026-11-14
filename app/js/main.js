import { state, set, subscribe, data, load, md } from './state.js';
import { STOPS, label } from './stops.js';
import { initMap, VIEW } from './map.js';
import { score, layersPreview, LAYER_OF } from './music.js';
import { layerGains, applyRhythm } from './rhythm.js';
import { change, mainOf } from './calc.js';
import { play, stop, setSound } from './sound.js';
import { initDance } from './dance.js';
import { initNight } from './screens/night.js';
import { initOpening } from './screens/opening.js';
import { initLand } from './screens/land.js';
import { initProof } from './screens/proof.js';
import { t } from './i18n.js';
import * as paju from './views/paju.js';
import * as yeoncheon from './views/yeoncheon.js';
import * as cheorwon from './views/cheorwon.js';
import * as hwacheon from './views/hwacheon.js';
import * as yanggu from './views/yanggu.js';

const $ = id => document.getElementById(id);
const VIEWS = { paju, yeoncheon, cheorwon, hwacheon, yanggu };   // 미션 화면이 준비된 지역. 나머지는 안내 문구만 보인다.

function panel() {
  const s = STOPS.find(x => x.id === state.stop), i = STOPS.indexOf(s), view = VIEWS[s.id];
  $('panel').innerHTML = `
    <p class="eye">${i + 1} / ${STOPS.length} · ${label(s, 'name')} · ${label(s, 'eye')}</p>
    <h2>${label(s, 'title')}</h2>
    <p>${label(s, 'story')}</p>
    <p class="todo">${label(s, 'todo')}</p>
    ${view ? view.render() : `<p class="hint">${t('mission.soon')}</p>`}`;
}

function tray() {
  const n = state.fragments.length;
  $('tray').innerHTML = STOPS.map(s => {
    const on = state.fragments.includes(s.id);
    return `<button type="button" class="piece${on ? ' on' : ''}" data-piece="${s.id}" ${on ? '' : 'disabled'} title="${t(on ? 'tray.solo' : 'tray.locked')}">${on ? '♪' : '·'} ${label(s, 'name')}<br><small>${label(s, 'layer')}</small></button>`;
  }).join('') + (n >= 2 && n < STOPS.length ? `<button type="button" class="piece on" data-piece="all">♪♪ ${t('tray.sofar')}<br><small>${t('tray.together')}</small></button>` : '')
    + (n === STOPS.length ? `<button type="button" class="piece go" data-piece="finale">▶ ${t('tray.finale')}<br><small>${t(state.finaleDone ? 'tray.again' : 'tray.join')}</small></button>` : '');
}

// ---- 소리와 춤: 반주 층의 세기와 선의 움직임이 같은 실측값을 따른다
let gains = null, timer = 0;
function perform(mode, ids) {
  const n = data.passes.length;
  gains ||= layerGains(Object.fromEntries(Object.keys(LAYER_OF).map(id => [id, data.passes.map(p => change(mainOf(data.zones, id), p.cycle))])));
  const plan = applyRhythm(mode === 'finale' ? score() : layersPreview(ids), gains, n);
  const at = play(plan);
  clearTimeout(timer);
  timer = setTimeout(() => set({ playing: null, ...(mode === 'finale' ? { finaleDone: true } : {}) }), plan.duration * 1000 + 300);
  set({ playing: { mode, at, duration: plan.duration, ids } });
}
function finale() {
  window.dmzMap.fitBounds(VIEW, { padding: { top: 90, bottom: 190, left: 30, right: 30 }, duration: 1000 });
  perform('finale', STOPS.map(s => s.id));
}

function timeline() {
  $('timeline').innerHTML = data.passes.map(p =>
    `<button type="button" data-cycle="${p.cycle}" class="${p.rest ? 'rest' : ''}" aria-pressed="${p.cycle === state.cycle}"
       title="${p.rest ? t('timeline.rest') : p.date}">${md(p.date)}${p.rest ? ' ·' : ''}</button>`).join('');
}

// 화면(밤사진 / 미션)에 따라 바뀌는 바깥 틀: 본문 클래스, 머리말, 돌아가기 단추
function chrome(s) {
  document.body.dataset.screen = s.screen;
  document.documentElement.lang = s.lang;
  $('lead').textContent = t(s.screen === 'mission' ? 'mission.lead' : 'night.lead');
  $('to-night').textContent = t('mission.back');
  $('lang').textContent = t('lang.other'); $('lang').setAttribute('aria-label', t('lang.aria'));
  $('stage-note').textContent = t('stage.note');
  $('map').setAttribute('aria-label', t('map.aria'));
  $('tray').setAttribute('aria-label', t('tray.aria')); $('timeline').setAttribute('aria-label', t('timeline.aria'));
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
  initLand(map);
  initProof();
  $('to-night').addEventListener('click', () => set({ screen: 'night' }));
  $('lang').addEventListener('click', () => {
    const lang = state.lang === 'ko' ? 'en' : 'ko';
    try { localStorage.setItem('dmz-lang', lang); } catch { /* 저장이 막힌 환경에서도 전환은 된다 */ }
    set({ lang });
  });
  $('timeline').addEventListener('click', e => {
    const b = e.target.closest('[data-cycle]');
    if (b) set({ cycle: +b.dataset.cycle, visited: [...state.visited, +b.dataset.cycle], note: null });
  });
  $('panel').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) VIEWS[state.stop]?.act(b.dataset.act, b);
  });
  for (const v of Object.values(VIEWS)) v.bind?.($('panel'));
  $('tray').addEventListener('click', e => {
    const b = e.target.closest('[data-piece]'); if (!b || b.disabled) return;
    const id = b.dataset.piece;
    id === 'finale' ? finale() : perform('preview', id === 'all' ? state.fragments : [id]);
  });
  $('sound').addEventListener('click', () => { const on = !state.sound; setSound(on); set({ sound: on }); });
  document.addEventListener('dmz-map-click', e => VIEWS[state.stop]?.mapClick?.(e.detail.lng, e.detail.lat));
  subscribe((s, prev) => {
    if (s.stop !== prev.stop) Object.assign(state, { visited: [s.cycle], note: null, pol: 'hh' });   // 지역을 옮기면 눈은 HH 로 돌아간다
    panel();
    if (s.cycle !== prev.cycle || s.lang !== prev.lang) timeline();
    if (s.fragments !== prev.fragments || s.finaleDone !== prev.finaleDone || s.lang !== prev.lang) tray();
    if (s.fragments.length > prev.fragments.length) perform('preview', s.fragments);   // 조각을 받으면 지금까지 모은 층이 함께 울린다
    if (s.stop !== prev.stop && s.playing) { stop(); clearTimeout(timer); state.playing = null; }
    chrome(s);
    const fin = s.playing?.mode === 'finale';
    document.body.classList.toggle('finale', fin);
    $('stage').hidden = !(fin || s.finaleDone && s.fragments.length === STOPS.length && !s.playing && s.stop === 'yanggu');
    $('sound').textContent = t(s.sound ? 'sound.on' : 'sound.off'); $('sound').setAttribute('aria-pressed', s.sound);
  });
  panel(); tray(); timeline(); chrome(state);
}
start().catch(fail);
