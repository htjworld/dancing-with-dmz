// 화천 백암산 · 두 가지 눈: 같은 날의 영상을 HH 와 HV 로 바꿔 보며, 숲과 북쪽 평지가 더 잘 구분되는 쪽을 고른다.
import { state, set, data, zone, addKey, pass, mdK } from '../state.js';
import { STOPS } from '../stops.js';
import { change } from '../calc.js';
import { missionReady, canTake, betterEye, rangeOf } from '../missions.js';

const ID = 'hwacheon', A = 'hwacheon-dmz', B = 'hwacheon-north';
const NAME = { hh: 'HH (가로로 쏘고 가로로 받기)', hv: 'HV (가로로 쏘고 세로로 받기)' };

function result() {
  const e = betterEye(data.zones, A, B), mine = state.eyePick, right = mine === e.pol;
  const range = rangeOf(data.passes.map(p => change(zone(A), p.cycle)));
  return `<div class="found"><h3>이 지역에서 본 것</h3>
    <p>${right ? '맞습니다.' : `${mine.toUpperCase()}를 고르셨습니다. 숫자로 보면 반대입니다.`} ${mdK(pass(e.cycle).date)}의 두 구역 밝기 차이는 HH에서 ${e.hh.toFixed(1)} dB, HV에서 ${e.hv.toFixed(1)} dB였습니다. 이 두 땅은 ${e.pol.toUpperCase()}에서 더 크게 달라 보입니다.</p>
    <p>가능한 설명: 나뭇가지와 잎이 얽힌 숲은 전파의 방향을 틀어 되돌려 보내는 일이 많아 HV에서 밝고, 평평한 땅은 그런 일이 적어 HV에서 어둡게 보일 수 있습니다.</p>
    <p>그리고 이 숲은 한 계절 동안 ${range.toFixed(1)} dB밖에 변하지 않았습니다. 변하지 않는 것도 정보입니다.</p>
    <p class="fine">HH와 HV가 물과 식물을 각각 전용으로 보는 것은 아닙니다. 산지에서는 레이더 그림자와 왜곡이 생기며, 신호의 차이가 숲의 건강 차이를 뜻하지 않습니다. 북쪽 구역은 영상에서 평지로 보이는 곳입니다.</p></div>`;
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  const eye = p => `<button type="button" data-act="see" data-pol="${p}" aria-pressed="${state.pol === p}">${p.toUpperCase()}로 보기</button>`;
  return `
    <div class="acts toggle">${eye('hh')}${eye('hv')}</div>
    <p class="today">지금 보는 눈: <b>${NAME[state.pol]}</b></p>
    ${ready ? '' : `<p class="hint">지도에서 금색 구역(DMZ 안 숲)과 하늘색 구역(북쪽 평지로 보이는 곳)을 번갈아 보세요. 두 구역의 밝기가 더 크게 달라 보이는 눈은 어느 쪽인가요?</p>
      <button type="button" class="primary" data-act="pick">${state.pol.toUpperCase()}가 더 잘 구분한다</button>`}
    ${ready ? result() : ''}
    ${ready && !got ? (allowed ? '<button type="button" class="primary" data-act="take">♪ 화천 조각 받기</button>'
      : '<p class="note no">먼저 앞 지역의 조각을 모아 주세요. 조각은 서쪽부터 차례로 이어집니다.</p>') : ''}
    ${got ? `<p class="note ok">화천 조각(패드)을 받았습니다. 선이 화천까지 이어졌습니다.</p>
      <button type="button" class="primary" data-act="next">다음: 양구 펀치볼 →</button>` : ''}`;
}

export function act(name, el) {
  if (name === 'see') set({ pol: el.dataset.pol });
  else if (name === 'pick') set({ eyePick: state.pol, seen: addKey(ID, 'eye') });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID] });
  else if (name === 'next') set({ stop: 'yanggu' });
}
