import { state, set, subscribe, data, load, md } from './state.js';
import { STOPS } from './stops.js';
import { initMap } from './map.js';
import { initDance } from './dance.js';
import * as paju from './views/paju.js';
import * as yeoncheon from './views/yeoncheon.js';
import * as cheorwon from './views/cheorwon.js';

const $ = id => document.getElementById(id);
const VIEWS = { paju, yeoncheon, cheorwon };   // 미션 화면이 준비된 지역. 나머지는 안내 문구만 보인다.

function panel() {
  const s = STOPS.find(x => x.id === state.stop), i = STOPS.indexOf(s), view = VIEWS[s.id];
  $('panel').innerHTML = `
    <p class="eye">${i + 1} / ${STOPS.length} · ${s.name} · ${s.eye}</p>
    <h2>${s.title}</h2>
    <p>${s.story}</p>
    <p class="todo">${s.todo}</p>
    ${view ? view.render() : '<p class="hint">이 지역의 미션은 준비 중입니다.</p>'}`;
}

function tray() {
  $('tray').innerHTML = STOPS.map(s => {
    const on = state.fragments.includes(s.id);
    return `<button type="button" class="piece${on ? ' on' : ''}" data-stop="${s.id}" ${on ? '' : 'disabled'}>${on ? '♪' : '·'} ${s.name}<br><small>${s.layer}</small></button>`;
  }).join('');
}

function timeline() {
  $('timeline').innerHTML = data.passes.map(p =>
    `<button type="button" data-cycle="${p.cycle}" class="${p.rest ? 'rest' : ''}" aria-pressed="${p.cycle === state.cycle}"
       title="${p.rest ? '이 통과는 자료가 없습니다' : p.date}">${md(p.date)}${p.rest ? ' ·' : ''}</button>`).join('');
}

function fail(e) {
  console.error(e);
  $('notice').hidden = false;
  $('notice').textContent = `자료를 불러오지 못했습니다. 로컬 서버로 열었는지 확인해 주세요. (${e.message})`;
}

async function start() {
  await load();
  const first = paju.startCycle();
  Object.assign(state, { cycle: first, visited: [first] });
  const map = window.dmzMap = initMap();   // 콘솔에서 살펴볼 수 있게 둔다
  initDance(map);
  $('timeline').addEventListener('click', e => {
    const b = e.target.closest('[data-cycle]');
    if (b) set({ cycle: +b.dataset.cycle, visited: [...state.visited, +b.dataset.cycle], note: null });
  });
  $('panel').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled) VIEWS[state.stop]?.act(b.dataset.act, b);
  });
  for (const v of Object.values(VIEWS)) v.bind?.($('panel'));
  document.addEventListener('dmz-map-click', e => VIEWS[state.stop]?.mapClick?.(e.detail.lng, e.detail.lat));
  subscribe((s, prev) => {
    if (s.stop !== prev.stop) Object.assign(state, { visited: [s.cycle], note: null });
    panel();
    if (s.cycle !== prev.cycle) timeline();
    if (s.fragments !== prev.fragments) tray();
  });
  panel(); tray(); timeline();
}
start().catch(fail);
