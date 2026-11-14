import test from 'node:test';
import assert from 'node:assert/strict';
import { nightScore, starsIn, BAR, BARS } from '../js/screens/nightmusic.js';

test('밤사진 곡: 24초, 북·하이햇·또렷한 주선율 없이 부드러운 소리만 쓴다', () => {
  const plan = nightScore();
  assert.equal(plan.duration, BAR * BARS);
  assert.equal(plan.duration, 24);
  const types = new Set(plan.events.map(e => e.type));
  assert.deepEqual([...types].sort(), ['bass', 'pad', 'sparkle']);
  for (const e of plan.events) {
    assert.ok(e.time >= 0 && e.time < plan.duration, '모든 음은 곡 안에서 시작한다');
    assert.ok(e.gain > 0 && e.gain <= .8, '어느 음도 세게 치지 않는다');
  }
  for (let i = 1; i < plan.events.length; i++) assert.ok(plan.events[i].time >= plan.events[i - 1].time, '시간순');
});

test('밤사진 곡: 화음은 4초에 한 번만 바뀌고 별은 한 마디에 셋을 넘지 않는다', () => {
  const plan = nightScore();
  const chords = plan.events.filter(e => e.type === 'pad' && e.midis.length > 1);
  assert.deepEqual(chords.map(e => e.time), [0, 4, 8, 12, 16, 20]);
  const perBar = Array.from({ length: BARS }, (_, m) => plan.events.filter(e => e.type === 'sparkle' && Math.floor(e.time / BAR) === m).length);
  for (let m = 0; m < BARS; m++) { assert.equal(perBar[m], starsIn(m)); assert.ok(perBar[m] <= 3); }
  for (let m = 1; m < BARS; m++) assert.ok(perBar[m] >= perBar[m - 1], '통과가 쌓일수록 별이 줄지 않는다');
  assert.ok(perBar[BARS - 1] > perBar[0]);
});

test('밤사진 곡: 재생할 때마다 같고, 별은 그 마디 화음의 음이다', () => {
  const plan = nightScore();
  assert.deepEqual(nightScore(), plan);
  const chords = plan.events.filter(e => e.type === 'pad' && e.midis.length > 1);
  for (const s of plan.events.filter(e => e.type === 'sparkle')) {
    const chord = chords[Math.floor(s.time / BAR)].midis;
    assert.ok(chord.includes(s.midi - 24), `별 ${s.midi}`);
  }
});
