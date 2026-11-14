// 날짜 슬라이더: 다섯 지역 미션에서 통과(관측 날짜)를 넘기는 한 가지 방법. 자료가 없는 통과(7/29)는 넣지 않는다.
// 미션 창은 상태가 바뀔 때마다 새로 그려지므로, 끄는 도중에 사라지지 않게 아래 띠에 한 번만 만든다.
import { state, set, subscribe, data, pass, md } from '../state.js';
import { t, dateText } from '../i18n.js';

export function initDateSlider() {
  const box = document.getElementById('date-slider');
  const cycles = data.passes.filter(p => !p.rest).map(p => p.cycle);
  box.innerHTML = `<label for="date-range"></label>
    <input id="date-range" type="range" min="0" max="${cycles.length - 1}" step="1">
    <div class="ticks" aria-hidden="true">${cycles.map(c => `<span>${md(pass(c).date)}</span>`).join('')}</div>`;
  const range = box.querySelector('input'), name = box.querySelector('label'), ticks = [...box.querySelectorAll('.ticks span')];
  range.addEventListener('input', () => {
    const c = cycles[+range.value];
    if (c !== state.cycle) set({ cycle: c, visited: [...state.visited, c], note: null });
  });
  const sync = () => {
    if (state.screen !== 'mission') return;
    // 자료가 없는 통과에 와 있으면 가장 가까운 자료 있는 통과로 옮긴다
    let i = cycles.indexOf(state.cycle);
    if (i < 0) {
      i = cycles.reduce((best, c, k) => (Math.abs(c - state.cycle) < Math.abs(cycles[best] - state.cycle) ? k : best), 0);
      return set({ cycle: cycles[i], visited: [...state.visited, cycles[i]] });
    }
    if (+range.value !== i) range.value = i;
    const day = dateText(pass(cycles[i]).date);
    name.textContent = `${t('common.date')} · ${day}`;
    range.setAttribute('aria-valuetext', day);
    ticks.forEach((el, k) => el.classList.toggle('now', k === i));
  };
  subscribe(sync); sync();
}
