// 화천 백암산 · 두 가지 눈: 같은 날의 영상을 HH 와 HV 로 바꿔 보며, 숲과 북쪽 평지가 더 잘 구분되는 쪽을 고른다.
import { state, set, data, zone, addKey, pass } from '../state.js';
import { STOPS, label } from '../stops.js';
import { change } from '../calc.js';
import { missionReady, canTake, betterEye, rangeOf } from '../missions.js';
import { t, dateText } from '../i18n.js';

const ID = 'hwacheon', A = 'hwacheon-dmz', B = 'hwacheon-north';
const NAME = { hh: 'hwacheon.eyeHH', hv: 'hwacheon.eyeHV' };   // 눈 이름의 문구 키

function result() {
  const e = betterEye(data.zones, A, B), mine = state.eyePick, right = mine === e.pol;
  const range = rangeOf(data.passes.map(p => change(zone(A), p.cycle)));
  return `<div class="found"><h3>${t('common.found')}</h3>
    <p>${right ? t('hwacheon.right') : t('hwacheon.wrong', { pol: mine.toUpperCase() })} ${t('hwacheon.foundDiff', { date: dateText(pass(e.cycle).date), hh: e.hh.toFixed(1), hv: e.hv.toFixed(1), pol: e.pol.toUpperCase() })}</p>
    <p>${t('hwacheon.foundWhy')}</p>
    <p>${t('hwacheon.foundStill', { range: range.toFixed(1) })}</p>
    <p class="fine">${t('hwacheon.foundFine')}</p></div>`;
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  const eye = p => `<button type="button" data-act="see" data-pol="${p}" aria-pressed="${state.pol === p}">${t('hwacheon.see', { pol: p.toUpperCase() })}</button>`;
  return `
    <div class="acts toggle">${eye('hh')}${eye('hv')}</div>
    <p class="today">${t('hwacheon.now')} <b>${t(NAME[state.pol])}</b></p>
    ${ready ? '' : `<p class="hint">${t('hwacheon.hint')}</p>
      <button type="button" class="primary" data-act="pick">${t('hwacheon.pick', { pol: state.pol.toUpperCase() })}</button>`}
    ${ready ? result() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('hwacheon.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('hwacheon.got')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'yanggu'), 'name') })}</button>` : ''}`;
}

export function act(name, el) {
  if (name === 'see') set({ pol: el.dataset.pol });
  else if (name === 'pick') set({ eyePick: state.pol, seen: addKey(ID, 'eye') });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID] });
  else if (name === 'next') set({ stop: 'yanggu' });
}
