// 화천 백암산 · 두 가지 눈: 지도 위의 커튼을 좌우로 밀며 HH(왼쪽)와 HV(오른쪽)를 견주고, 숲과 평지가 더 잘 구분되는 눈을 창에서 눌러 고른 뒤 정한다.
// (커튼을 넓게 둔 쪽으로 정하던 방식은 관측지가 화면 왼쪽에 있어 HH 쪽으로 밀기 불편했다)
// 커튼 자체는 screens/gamemap.js 가 지도 위에 그린다. 여기서는 안내와 판정, 결과를 맡는다.
import { state, set, data, zone, addKey, pass } from '../state.js';
import { STOPS, label } from '../stops.js';
import { change } from '../calc.js';
import { missionReady, canTake, betterEye, rangeOf } from '../missions.js';
import { t, dateText } from '../i18n.js';
import { foundCard } from './found.js';
import { blip } from '../sound.js';

const ID = 'hwacheon', A = 'hwacheon-dmz', B = 'hwacheon-north';
const NAME = { hh: 'hwacheon.eyeHH', hv: 'hwacheon.eyeHV' };   // 눈 이름의 문구 키
const eye = p => `<button type="button" data-act="eye" data-eye="${p}" class="${state.eyePick === p ? 'on' : ''}" aria-pressed="${state.eyePick === p}">${p.toUpperCase()}</button>`;

function result() {
  const e = betterEye(data.zones, A, B), mine = state.eyePick, right = mine === e.pol;
  const range = rangeOf(data.passes.map(p => change(zone(A), p.cycle)));
  return foundCard({
    head: `${right ? t('hwacheon.right') : t('hwacheon.wrong', { pol: mine.toUpperCase() })} ${t('hwacheon.foundHead', { pol: e.pol.toUpperCase() })}`,
    rows: [{ name: 'HH', value: e.hh, cls: e.pol === 'hh' ? '' : 'calm' }, { name: 'HV', value: e.hv, cls: e.pol === 'hv' ? '' : 'calm' }],
    caption: t('hwacheon.foundCaption', { date: dateText(pass(e.cycle).date) }),
    body: [t('hwacheon.foundWhy'), t('hwacheon.foundStill', { range: range.toFixed(1) })],
    more: [t('hwacheon.foundDiff', { date: dateText(pass(e.cycle).date), hh: e.hh.toFixed(1), hv: e.hv.toFixed(1), pol: e.pol.toUpperCase() }), t('hwacheon.foundFine')],
  });
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  const mine = state.eyePick;   // 정하기 전에는 눌러 둔 눈, 정한 뒤에는 답
  return `
    ${ready ? '' : `<p class="hint">${t('hwacheon.hint')}</p>
      <div class="eyes">${eye('hh')}${eye('hv')}</div>
      ${mine ? `<p class="today">${t('hwacheon.wide')} <b>${t(NAME[mine])}</b></p>` : ''}
      <button type="button" class="primary" data-act="pick"${mine ? '' : ' disabled'}>${mine ? t('hwacheon.pick', { pol: mine.toUpperCase() }) : t('hwacheon.pickNone')}</button>`}
    ${ready ? result() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('hwacheon.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('hwacheon.got')}</p>
      <button type="button" class="primary" data-act="next">${t('common.next', { name: label(STOPS.find(s => s.id === 'yanggu'), 'name') })}</button>` : ''}`;
}

export function act(name, el) {
  if (name === 'eye') { if (el.dataset.eye !== state.eyePick) { blip(587, .1, .2); set({ eyePick: el.dataset.eye }); } }   // 눌러 두기만 한다. 정하기 전까지는 바꿀 수 있다
  else if (name === 'pick') { if (!state.eyePick) return; blip(784, .18, .3); set({ pol: state.eyePick, seen: addKey(ID, 'eye') }); }   // 고른 눈으로 지도를 보여 준다
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID] });
  else if (name === 'next') set({ stop: 'yanggu' });
}
