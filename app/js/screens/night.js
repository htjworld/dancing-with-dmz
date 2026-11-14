// 밤사진 화면: 계절 변동 지도 위에 얹는 설명 창과 '한 계절 재생'. 지도 레이어는 map.js 가 맡는다.
// 숫자는 facts.json(fact())과 glow.json 에서만 가져온다.
import { state, set, subscribe, data, fact } from '../state.js';
import { t, dateText } from '../i18n.js';
import { nightScore } from './nightmusic.js';
import { frameAt } from '../glow.js';
import { play, stop } from '../sound.js';

const el = document.getElementById('night');
const ORDER = ['paju', 'yeoncheon', 'cheorwon', 'hwacheon', 'yanggu'];
const CAVEATS = ['signal_not_cause', 'forest_relative'];   // 이 화면에서 보여 주는 한계 문구(plan.md 2-4절 키)
let at = 'cheorwon';   // 지도에서 보고 있는 곳. map.js 의 처음 범위와 같다
let timer = 0, startedAt = 0, duration = 0, preloaded = false;

const nFrames = () => data.glow?.regions?.cheorwon?.frames?.length || 0;

// ---- 한 계절 재생: 곡의 처음~끝이 첫 통과~마지막 통과다. 통과가 쌓일수록 들판이 빛나고 별 소리가 늘어난다.
function preload() {
  if (preloaded) return; preloaded = true;
  for (const g of Object.values(data.glow.regions)) for (const f of g.frames) { const im = new Image(); im.src = `data/${f}`; }
}
export function stopSeason() {
  if (!timer) return;
  clearInterval(timer); timer = 0; stop();
  set({ nightFrame: null });
}
export function playSeason() {
  const n = nFrames();
  if (!n) return;
  stopSeason(); preload();
  // 밤사진에는 이 화면을 위해 지은 잔잔한 곡을 쓴다(nightmusic.js). 미션의 조각과 피날레 음악은 music.js 가 맡는다
  const plan = nightScore();
  startedAt = play(plan); duration = plan.duration * 1000;
  const tick = () => {
    const p = (performance.now() - startedAt) / duration;
    if (p >= 1) { clearInterval(timer); timer = 0; return set({ nightFrame: null }); }   // 끝나면 완성된 한 장으로 돌아간다
    const k = frameAt(Math.max(0, p), n);
    if (k !== state.nightFrame) set({ nightFrame: k });
  };
  timer = setInterval(tick, 80);
  set({ nightFrame: 0 });
}

function playRow() {
  const k = state.nightFrame, dates = data.glow?.dates || [];
  if (!nFrames()) return '';
  // frames[k] 는 첫 통과부터 k+2번째 유효 통과까지 쌓은 것이다
  const now = k == null ? '' : `<span class="when">${t('night.playing', { k: k + 2, n: dates.length, from: dateText(dates[0]), to: dateText(dates[k + 1]) })}</span>`;
  return `<div class="play"><button type="button" data-play aria-pressed="${k != null}">${t(k == null ? 'night.play' : 'night.stop')}</button>
    <button type="button" class="land" data-land aria-pressed="${state.landPlay}">${t('land.toggle')}</button>${now}</div>
    ${state.landPlay ? `<p class="fine">${t('land.hint')}</p>` : ''}
    ${k != null ? `<p class="fine">${t('night.musicNote')}</p>` : ''}`;
}

function render() {
  const [lo, hi] = data.glow?.scale_db || [0, 0];
  const regions = ORDER.filter(id => data.glow?.regions?.[id]);
  el.innerHTML = `
    <p class="eye">${t('night.eye', { passes: fact('passes') })}</p>
    <h2>${t('night.title')}</h2>
    <p>${t('night.body')}</p>
    ${playRow()}
    <div class="pair">
      <div>${t('night.paddy')}<b>${fact('cheorwon_paddy_db')} dB</b></div>
      <div class="still">${t('night.dmz')}<b>${fact('cheorwon_dmz_db')} dB</b></div>
    </div>
    <p class="fine">${t('night.pairNote')}</p>
    <p class="fact">${t('night.fact', { n: fact('july_clear_optical'), looks: fact('july_optical_looks') })}</p>
    <div class="scale" role="img" aria-label="${t('night.scaleAria')}"></div>
    <div class="ends"><span>${t('night.scaleLow', { lo })}</span><span>${t('night.scaleHigh', { hi })}</span></div>
    <div class="go" role="group">
      ${regions.map(id => `<button type="button" data-go="${id}" aria-pressed="${at === id}">${t('region.' + id)}</button>`).join('')}
      <button type="button" data-go="all" aria-pressed="${at === 'all'}">${t('night.all')}</button>
    </div>
    <ul class="caveats">${CAVEATS.map(k => `<li>${t('caveat.' + k)}</li>`).join('')}</ul>
    <p class="fine">${t('night.pick')}</p>`;
}

export function initNight() {
  el.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) {
      at = go.dataset.go;
      set({ evidenceAt: at === 'all' ? null : at });   // 지역을 고르면 그 지역의 근거 패널이 열린다
      document.dispatchEvent(new CustomEvent('dmz-night-go', { detail: { id: at } }));
      return render();
    }
    if (e.target.closest('[data-play]')) return state.nightFrame == null ? playSeason() : stopSeason();
    if (e.target.closest('[data-land]')) return set({ landPlay: !state.landPlay });
  });
  subscribe((s, prev) => {
    if (s.screen !== 'night' && prev.screen === 'night') stopSeason();        // 화면을 떠나면 재생을 멈춘다
    if (!s.sound && prev.sound && timer) stop();                              // 소리만 끄면 그림은 계속 간다
    if (s.screen !== prev.screen || s.lang !== prev.lang || s.nightFrame !== prev.nightFrame || s.landPlay !== prev.landPlay) render();
  });
  render();
}
