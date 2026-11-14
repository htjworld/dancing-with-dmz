// 밤하늘 영상: 밤사진 화면의 첫 모습. 설명 창 대신 나레이션 자막이 한 문장씩 나오고, 지도가 스스로 움직이며
// DMZ의 한 계절이 쌓여 가는 것을 보여 준다. 끝나면 다섯 지역 미션(게임)으로 넘어간다.
// 지도 레이어와 카메라는 map.js 가 맡고, 여기서는 시간표·자막·단추만 다룬다. 숫자는 facts.json 에서만 가져온다.
import { state, set, subscribe, data, fact } from '../state.js';
import { t } from '../i18n.js';
import { filmScore } from './nightmusic.js';
import { frameAt } from '../glow.js';
import { play, stop } from '../sound.js';

const el = document.getElementById('film');
// 시간표(초). cam: 카메라가 가는 곳(지역 id 또는 'all'), cap: 자막 키. 카메라는 서쪽 파주에서 동쪽 양구까지 DMZ를 따라가고,
// 자막은 그때 화면에 보이는 지역을 말한다. 통과가 쌓이는 구간은 GROW 이다
const CUES = [
  { at: 0, cap: 'film.c1', cam: 'all' },
  { at: 5, cap: 'film.c2', cam: 'paju' },
  { at: 10, cap: 'film.paju', cam: 'paju' },
  { at: 16, cap: 'film.yeoncheon', cam: 'yeoncheon' },
  { at: 21, cap: 'film.cheorwon', cam: 'cheorwon' },
  { at: 28, cap: 'film.hwacheon', cam: 'hwacheon' },
  { at: 33, cap: 'film.yanggu', cam: 'yanggu' },
  { at: 38, cap: 'film.c6', cam: 'all' },
  { at: 43, cap: 'film.c7' },
  { at: 48, cap: 'film.c8' },
];
const FADE = [5, 8], GROW = [10, 38], END = 48, LEAVE = 54;   // 빛이 스며드는 구간, 통과가 쌓이는 구간, 끝, 게임으로 넘어가는 때
let timer = 0, startedAt = 0, cue = -1, opacity = -1, left = -1, held = false;

const go = (id, duration) => document.dispatchEvent(new CustomEvent('dmz-night-go', { detail: { id, duration } }));
const glow = value => { if (value !== opacity) { opacity = value; document.dispatchEvent(new CustomEvent('dmz-glow-opacity', { detail: { value } })); } };
const vars = () => ({ passes: fact('passes') });   // 자막에는 통과 횟수만 넣는다. dB 숫자는 근거 패널에서 보여 준다

function caption() {
  const c = CUES[cue];
  el.querySelector('.cap').innerHTML = c ? `<p>${t(c.cap, vars())}</p>` : '';
}
function buttons() {
  const ended = cue === CUES.length - 1;
  el.querySelector('.acts').innerHTML = ended
    ? `<button type="button" class="primary" data-game>${t('film.start')}</button>
       <button type="button" data-replay>${t('film.replay')}</button>
       <button type="button" data-explore>${t('film.explore')}</button>
       <span class="soon">${held || left < 0 ? '' : t('film.soon', { n: left })}</span>`
    : `<button type="button" class="quiet" data-game>${t('film.skip')}</button>`;
}

export function stopFilm() {
  if (!timer) return;
  clearInterval(timer); timer = 0; stop();
  glow(1); set({ nightFrame: null });
}

function tick() {
  const s = (performance.now() - startedAt) / 1000, n = data.glow?.regions?.cheorwon?.frames?.length || 0;
  // 자막과 카메라
  let k = 0; while (k + 1 < CUES.length && s >= CUES[k + 1].at) k++;
  if (k !== cue) { const from = CUES[cue]?.cam; cue = k; if (CUES[k].cam && CUES[k].cam !== from) go(CUES[k].cam, k === 0 ? 0 : 3200); caption(); buttons(); }
  // 빛: 처음에는 없다가 스며들고, 통과가 쌓이며 밝아지고, 끝에는 완성된 한 장
  glow(s < FADE[0] ? 0 : s >= FADE[1] ? 1 : Math.round((s - FADE[0]) / (FADE[1] - FADE[0]) * 20) / 20);
  const frame = !n || s >= GROW[1] ? null : s < GROW[0] ? 0 : frameAt((s - GROW[0]) / (GROW[1] - GROW[0]), n);
  if (frame !== state.nightFrame) set({ nightFrame: frame });
  el.querySelector('.bar i').style.width = `${Math.min(100, s / END * 100).toFixed(1)}%`;
  // 끝난 뒤: 몇 초 뒤 게임으로. 단추에 손을 대면(held) 기다린다
  if (s >= END) {
    const remain = Math.max(0, Math.ceil(LEAVE - s));
    if (remain !== left) { left = remain; buttons(); }
    if (s >= LEAVE && !held) { stopFilm(); set({ screen: 'mission' }); }
  }
}

export function startFilm() {
  if (state.screen !== 'night' || state.nightMode !== 'film') set({ screen: 'night', nightMode: 'film', evidenceAt: null, landPlay: false });
  stopFilm();
  for (const g of Object.values(data.glow?.regions || {})) for (const f of g.frames) { const im = new Image(); im.src = `data/${f}`; }   // 미리 받아 두면 깜빡이지 않는다
  cue = -1; opacity = -1; left = -1; held = false;
  startedAt = play(filmScore());
  timer = setInterval(tick, 100);
  tick();
}

export function initFilm() {
  el.innerHTML = `<div class="cap" aria-live="polite"></div>
    <div class="acts"></div><div class="bar" aria-hidden="true"><i></i></div>`;
  el.addEventListener('click', e => {
    if (e.target.closest('[data-game]')) { stopFilm(); return set({ screen: 'mission' }); }
    if (e.target.closest('[data-replay]')) return startFilm();
    if (e.target.closest('[data-explore]')) { stopFilm(); return set({ nightMode: 'explore' }); }
  });
  // 끝난 뒤 단추 위에 머무르면 자동으로 넘어가지 않는다
  el.addEventListener('pointerenter', () => { if (cue === CUES.length - 1 && !held) { held = true; buttons(); } }, true);
  subscribe((s, prev) => {
    if (timer && (s.screen !== 'night' || s.nightMode !== 'film')) stopFilm();   // 화면을 떠나면 멈춘다
    if (s.lang !== prev.lang && cue >= 0) { caption(); buttons(); }
    if (!s.sound && prev.sound && timer) stop();                                  // 소리만 끄면 그림은 계속 간다
  });
  // 오프닝 없이 밤하늘에서 시작하는 경우(오프닝 자료가 없을 때)에는 곧바로 튼다
  if (state.screen === 'night' && state.nightMode === 'film') startFilm();
}
