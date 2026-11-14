import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { score, layersPreview, BEAT, BEATS, LAYER_OF } from '../js/music.js';
import { layerGains, applyRhythm, cycleAt, heightAtProgress, isRestAt, jumpAt } from '../js/rhythm.js';
import { heights, togetherDays, mainOf, change } from '../js/calc.js';

test('악보: 16마디 48박, 마디마다 주선율의 길이가 3박', () => {
  const s = score();
  assert.equal(BEATS, 48);
  assert.ok(Math.abs(s.duration - 22.5) < 1e-9);
  const lead = s.events.filter(e => e.type === 'lead');
  for (let m = 0; m < 16; m++) {
    const inBar = lead.filter(e => e.time >= m * 3 * BEAT - 1e-9 && e.time < (m + 1) * 3 * BEAT - 1e-9);
    assert.ok(inBar.length >= 1, `마디 ${m + 1}`);
  }
  assert.ok(s.events.every(e => e.time >= 0 && e.time < s.duration));
  for (const t of Object.values(LAYER_OF)) assert.ok(s.events.some(e => e.type === t), t);
});

test('미리 듣기: 모은 층만 있고 주선율은 없다', () => {
  const p = layersPreview(['paju', 'yeoncheon']);
  assert.deepEqual([...new Set(p.events.map(e => e.type))].sort(), ['hat', 'kick']);
  assert.ok(Math.abs(p.duration - 3.75) < 1e-9);
  assert.ok(p.events.every(e => e.time < p.duration));
  assert.equal(layersPreview([]).events.length, 0);
});

test('세기: 전체 최솟값 0.4, 최댓값 1, 쉼표 0', () => {
  const g = layerGains({ paju: [0, 2, null, 4], yanggu: [0, 1, null, 0] });
  assert.deepEqual(g.paju, [0.4, 0.7, 0, 1]);
  assert.deepEqual(g.yanggu.map(v => +v.toFixed(2)), [0.4, 0.55, 0, 0.4]);
});

test('applyRhythm: 반주는 그 시점의 세기, 주선율은 1, 쉼표에서는 반주가 멈춘다', () => {
  const plan = { duration: 4, events: [{ type: 'kick', time: 0 }, { type: 'kick', time: 2.1 }, { type: 'kick', time: 3.5 }, { type: 'lead', time: 2.1 }, { type: 'pad', time: 0 }] };
  const out = applyRhythm(plan, { paju: [0.4, 0.7, 0, 1] }, 4).events;
  assert.deepEqual(out.map(e => e.gain), [0.4, 0, 1, 1, 1]);   // 2.1초는 통과 2(쉼표). 세기 자료가 없는 층(pad)은 1
  assert.equal(cycleAt(0.999, 12), 11);
  assert.equal(cycleAt(1, 12), 11);
});

test('선의 높이: 통과 사이는 직선, 쉼표에서는 직전 높이에 멈춘다', () => {
  const h = [0, 1, null, 0.5];
  assert.equal(heightAtProgress(h, 0), 0);
  assert.equal(heightAtProgress(h, 0.125), 0.5);        // 통과 0 의 한가운데 → 0 과 1 의 중간
  assert.equal(heightAtProgress(h, 0.3), 1);            // 통과 1: 다음이 쉼표라 그대로
  assert.equal(heightAtProgress(h, 0.6), 1);            // 쉼표: 직전 높이
  assert.equal(heightAtProgress(h, 1), 0.5);
  assert.equal(isRestAt(h, 0.6), true);
  assert.equal(isRestAt(h, 0.3), false);
});

test('점프: 함께 오른 통과가 시작될 때 1, 3분의 1 지점부터 0', () => {
  assert.equal(jumpAt([2], 2 / 4, 4), 1);
  assert.ok(Math.abs(jumpAt([2], (2 + 1 / 6) / 4, 4) - 0.5) < 1e-9);
  assert.equal(jumpAt([2], 2.5 / 4, 4), 0);
  assert.equal(jumpAt([2], 0.1, 4), 0);
});

test('실제 자료: 다섯 지역의 높이와 세기가 만들어지고, 함께 오른 날이 있다', () => {
  const real = JSON.parse(readFileSync(new URL('../data/regions.json', import.meta.url), 'utf8'));
  const ids = Object.keys(LAYER_OF), n = real.passes.length, H = heights(real.zones, ids, n);
  const all = ids.flatMap(id => H[id]).filter(v => v != null);
  assert.ok(Math.abs(Math.max(...all.map(Math.abs)) - 1) < 1e-9);
  const rest = real.passes.filter(p => p.rest).map(p => p.cycle);
  for (const id of ids) for (const c of rest) assert.equal(H[id][c], null);
  const series = Object.fromEntries(ids.map(id => [id, real.passes.map(p => change(mainOf(real.zones, id), p.cycle))]));
  const out = applyRhythm(score(), layerGains(series), n).events;
  assert.ok(out.filter(e => e.type !== 'lead').every(e => e.gain === 0 || (e.gain >= 0.4 && e.gain <= 1)));
  assert.ok(out.some(e => e.type === 'kick' && e.gain === 0), '쉼표 통과에서 반주가 멈춘다');
  assert.ok(togetherDays(real.zones).length >= 1);
});
