import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { change, level, forestChange, togetherDays, heights, heightAt, refOf } from '../js/calc.js';
import { extremeDays, judgeExtreme, missionReady } from '../js/missions.js';

// 지어낸 작은 자료: 통과 0~4, 통과 2는 자료 없음
const zone = (id, region, role, hh) => ({ id, region, role, observations: hh.map((v, cycle) =>
  v == null ? { cycle, status: 'missing', hh_db: null, hv_db: null } : { cycle, status: 'valid', hh_db: v, hv_db: v - 6 }) });
const farm = zone('r-farm', 'r', 'main', [-8.00, -7.0, null, -5.0, -7.97]);
const forest = zone('r-forest', 'r', 'ref', [-5.0, -4.9, null, -3.5, -5.0]);
const zones = [farm, forest];

test('change 는 첫 유효 관측 대비, 자료가 없으면 null', () => {
  assert.equal(change(farm, 0), 0);
  assert.equal(change(farm, 3), 3);
  assert.equal(change(farm, 2), null);
  assert.equal(level(farm, 1, 'hv'), -13);
});

test('forestChange 는 같은 지역 숲의 변화를 뺀다', () => {
  assert.equal(refOf(zones, farm), forest);
  assert.ok(Math.abs(forestChange(zones, farm, 3) - 1.5) < 1e-9);
  assert.equal(forestChange(zones, farm, 2), null);
});

test('togetherDays 는 직전 유효 관측 대비 중앙값이 기준 이상인 통과만', () => {
  const t = togetherDays(zones);
  assert.deepEqual(t.map(x => x.cycle), [1, 3]);   // 통과 1: +1.0, +0.1 → 중앙값 0.55 / 통과 3: 쉼표를 건너 +2.0, +1.4
  assert.equal(t[1].up, 2);
});

test('heights 는 0 이 기준이고 가장 큰 절댓값이 1, 쉼표는 null', () => {
  const h = heights(zones, ['r'], 5);
  assert.deepEqual(h.r.map(v => (v == null ? null : +v.toFixed(3))), [0, 0.333, null, 1, 0.01]);
  assert.equal(heightAt(h.r, 2), h.r[1]);            // 쉼표에서는 직전 높이
  assert.equal(heightAt(h.r, 3), 1);
});

test('extremeDays: 0.3 dB 안의 날은 모두 정답', () => {
  const e = extremeDays(zones, 'r-farm');
  assert.deepEqual(e.dark, [0, 4]);                  // -8.00 과 -7.97
  assert.deepEqual(e.bright, [3]);
  assert.equal(e.brightForest, 3);
});

test('judgeExtreme 의 사유', () => {
  assert.deepEqual(judgeExtreme(zones, 'r-farm', 2, 'dark'), { ok: false, reason: 'rest' });
  assert.deepEqual(judgeExtreme(zones, 'r-farm', 4, 'dark'), { ok: true, reason: 'tie' });
  assert.deepEqual(judgeExtreme(zones, 'r-farm', 1, 'dark'), { ok: false, reason: 'darker' });
  assert.deepEqual(judgeExtreme(zones, 'r-farm', 3, 'bright', [3]), { ok: true, reason: 'together' });
  assert.deepEqual(judgeExtreme(zones, 'r-farm', 3, 'bright'), { ok: true, reason: null });
  assert.deepEqual(judgeExtreme(zones, 'r-farm', 1, 'bright'), { ok: false, reason: 'brighter' });
});

test('숲을 빼면 가장 밝은 날도 인정한다', () => {
  // 통과 1 은 원본으로는 두 번째지만, 통과 2 는 숲이 함께 크게 올라 숲을 빼면 통과 1 이 가장 밝다
  const a = zone('s-farm', 's', 'main', [-8, -6, -5]), b = zone('s-forest', 's', 'ref', [-5, -5, -2.5]);
  assert.deepEqual(judgeExtreme([a, b], 's-farm', 1, 'bright'), { ok: true, reason: 'forest' });
});

test('missionReady 는 열쇠가 모두 있어야 참', () => {
  assert.equal(missionReady('paju', ['dark']), false);
  assert.equal(missionReady('paju', ['bright', 'dark']), true);
  assert.equal(missionReady('nowhere', []), false);
});

// 실제 자료: 값이 바뀌어도 미션이 성립하는지 지킨다(정답을 고정하지 않는다)
test('실제 자료에서 파주 미션이 성립한다', () => {
  const real = JSON.parse(readFileSync(new URL('../data/regions.json', import.meta.url), 'utf8'));
  const e = extremeDays(real.zones, 'paju-dmz_farm');
  assert.ok(e.dark.length >= 1 && e.bright.length >= 1);
  assert.ok(!e.dark.some(c => e.bright.includes(c)), '가장 어두운 날과 밝은 날이 겹치지 않는다');
  const answers = new Set([...e.dark, ...e.bright, e.brightForest]);
  assert.ok(real.passes.some(p => !p.rest && !answers.has(p.cycle)), '정답이 아닌 날이 있어야 시작점으로 쓸 수 있다');
  for (const id of ['paju', 'yeoncheon', 'cheorwon', 'hwacheon', 'yanggu'])
    assert.ok(real.zones.some(z => z.region === id && z.role === 'main') && real.zones.some(z => z.region === id && z.role === 'ref'), id);
});
