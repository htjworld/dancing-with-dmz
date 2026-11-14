import test from 'node:test';
import assert from 'node:assert/strict';
import { nightScore, starsIn, BAR, BARS } from '../js/screens/nightmusic.js';

test('밤사진 곡: 24초, 북과 하이햇 없이 잔잔한 소리만 쓴다', () => {
  const plan = nightScore();
  assert.equal(plan.duration, BAR * BARS);
  assert.equal(plan.duration, 24);
  const types = new Set(plan.events.map(e => e.type));
  assert.deepEqual([...types].sort(), ['bass', 'lead', 'pad', 'sparkle']);
  for (const e of plan.events) {
    assert.ok(e.time >= 0 && e.time < plan.duration, '모든 음은 곡 안에서 시작한다');
    assert.ok(e.gain > 0 && e.gain <= 1);
  }
  for (let i = 1; i < plan.events.length; i++) assert.ok(plan.events[i].time >= plan.events[i - 1].time, '시간순');
});

test('밤사진 곡: 통과가 쌓일수록 별 소리가 늘고, 재생할 때마다 같다', () => {
  const plan = nightScore(), perBar = Array.from({ length: BARS }, (_, m) => plan.events.filter(e => e.type === 'sparkle' && Math.floor(e.time / BAR) === m).length);
  for (let m = 0; m < BARS; m++) assert.equal(perBar[m], starsIn(m));
  for (let m = 1; m < BARS; m++) assert.ok(perBar[m] >= perBar[m - 1]);
  assert.ok(perBar[BARS - 1] > perBar[0]);
  assert.deepEqual(nightScore(), plan);
});

test('밤사진 곡: 가락과 별은 땅 연주와 같은 솔 음계 안에 있다', () => {
  const scale = new Set([2, 4, 7, 9, 11]);   // 레 미 솔 라 시 (도=0)
  for (const e of nightScore().events) if (e.type === 'lead' || e.type === 'sparkle') assert.ok(scale.has(e.midi % 12), `midi ${e.midi}`);
});
