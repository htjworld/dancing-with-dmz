// 밤사진 화면: 계절 변동 지도 위에 얹는 설명 창. 지도 레이어는 map.js 가 맡고, 여기서는 문구·숫자·지역 고르기만 한다.
// 숫자는 facts.json(fact())과 glow.json 에서만 가져온다.
import { state, set, subscribe, data, fact } from '../state.js';
import { t } from '../i18n.js';

const el = document.getElementById('night');
const ORDER = ['paju', 'yeoncheon', 'cheorwon', 'hwacheon', 'yanggu'];
const CAVEATS = ['signal_not_cause', 'forest_relative'];   // 이 화면에서 보여 주는 한계 문구(plan.md 2-4절 키)
let at = 'cheorwon';   // 지도에서 보고 있는 곳. map.js 의 처음 범위와 같다

function render() {
  const [lo, hi] = data.glow?.scale_db || [0, 0];
  const unit = data.facts?.july_clear_optical?.unit ?? '';
  const regions = ORDER.filter(id => data.glow?.regions?.[id]);
  el.innerHTML = `
    <p class="eye">${t('night.eye', { passes: fact('passes') })}</p>
    <h2>${t('night.title')}</h2>
    <p>${t('night.body')}</p>
    <div class="pair">
      <div>${t('night.paddy')}<b>${fact('cheorwon_paddy_db')} dB</b></div>
      <div class="still">${t('night.dmz')}<b>${fact('cheorwon_dmz_db')} dB</b></div>
    </div>
    <p class="fine">${t('night.pairNote')}</p>
    <p class="fact">${t('night.fact', { n: fact('july_clear_optical'), unit })}</p>
    <div class="scale" role="img" aria-label="${data.glow?.metric ?? ''}"></div>
    <div class="ends"><span>${t('night.scaleLow', { lo })}</span><span>${t('night.scaleHigh', { hi })}</span></div>
    <div class="go" role="group">
      ${regions.map(id => `<button type="button" data-go="${id}" aria-pressed="${at === id}">${t('region.' + id)}</button>`).join('')}
      <button type="button" data-go="all" aria-pressed="${at === 'all'}">${t('night.all')}</button>
    </div>
    <ul class="caveats">${CAVEATS.map(k => `<li>${t('caveat.' + k)}</li>`).join('')}</ul>
    <button type="button" class="next" data-next>${t('night.next')}</button>`;
}

export function initNight() {
  el.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) {
      at = go.dataset.go;
      document.dispatchEvent(new CustomEvent('dmz-night-go', { detail: { id: at } }));
      return render();
    }
    if (e.target.closest('[data-next]')) set({ screen: 'mission' });
  });
  subscribe((s, prev) => { if (s.screen !== prev.screen || s.lang !== prev.lang) render(); });
  render();
}
