import test from 'node:test';
import assert from 'node:assert/strict';
import { nightScore, filmScore, endingScore, pieceChime, starsIn, BAR, BARS } from '../js/screens/nightmusic.js';

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

test('밤하늘 영상 곡: 같은 곡을 두 번 이어 48초, 여전히 부드러운 소리만 쓴다', () => {
  const plan = filmScore();
  assert.equal(plan.duration, 48);
  assert.deepEqual([...new Set(plan.events.map(e => e.type))].sort(), ['bass', 'pad', 'sparkle']);
  for (const e of plan.events) assert.ok(e.time >= 0 && e.time < plan.duration && e.gain > 0 && e.gain <= .8);
  for (let i = 1; i < plan.events.length; i++) assert.ok(plan.events[i].time >= plan.events[i - 1].time);
  assert.deepEqual(filmScore(), plan);
});

test('엔딩 곡: 밤하늘과 같은 화음으로 시작하고, 가락이 얹히며, 부드러운 소리만 쓴다', () => {
  const night = nightScore(), end = endingScore();
  const chords = p => p.events.filter(e => e.type === 'pad' && e.midis.length > 1).map(e => e.midis.join(','));
  assert.deepEqual(chords(end).slice(0, BARS), chords(night), '처음 여섯 마디의 화음이 밤하늘의 주제와 같다');
  assert.equal(chords(end).length, BARS + 2);
  assert.deepEqual([...new Set(end.events.map(e => e.type))].sort(), ['bass', 'pad', 'sparkle']);
  const tune = end.events.filter(e => e.type === 'pad' && e.midis.length === 1);
  assert.ok(tune.length >= 16, '가락이 있다');
  assert.equal(night.events.filter(e => e.type === 'pad' && e.midis.length === 1).length, BARS, '밤하늘에는 마디마다 머무는 음 하나뿐이다');
  assert.equal(tune.at(-1).midis[0] % 12, 2, '으뜸음(레)에서 끝난다');
  for (const e of end.events) assert.ok(e.time >= 0 && e.time < end.duration && e.gain > 0 && e.gain <= .8);
  assert.deepEqual(endingScore(), end);
});

test('조각 소리: 주제의 한 마디, 조각이 늘수록 목소리가 더해진다', () => {
  let prev = 0;
  for (let n = 1; n <= 5; n++) {
    const p = pieceChime(n);
    assert.equal(p.duration, BAR);
    assert.ok(p.events.length > prev); prev = p.events.length;
    assert.ok(p.events.every(e => ['pad', 'bass', 'sparkle'].includes(e.type) && e.time < p.duration));
  }
});
