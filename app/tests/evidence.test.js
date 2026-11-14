import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evidence, placeOf } from '../js/evidence.js';

const { zones } = JSON.parse(readFileSync(new URL('../data/regions.json', import.meta.url)));
const facts = JSON.parse(readFileSync(new URL('../data/facts.json', import.meta.url)));
const f = k => facts[k].value;

test('철원: 변동 폭이 facts.json 과 같다 (남쪽 논 > DMZ 안, 북쪽 경작지 > DMZ 안)', () => {
  const e = evidence(zones, 'cheorwon');
  assert.equal(e.ranges['cheorwon-paddy'], f('cheorwon_paddy_db'));
  assert.equal(e.ranges['cheorwon-dmz'], f('cheorwon_dmz_db'));
  assert.equal(e.ranges['cheorwon-north'], f('cheorwon_north_db'));
  assert.deepEqual(e.lines.map(l => l.place), ['south', 'dmz', 'north']);
});

test('파주: DMZ 안 경작지와 미경작지', () => {
  const e = evidence(zones, 'paju');
  assert.equal(e.ranges['paju-dmz_farm'], f('paju_dmz_farm_db'));
  assert.equal(e.ranges['paju-dmz_wild'], f('paju_dmz_wild_db'));
  assert.equal(e.ranges['paju-north_farm'], f('paju_north_db'));
});

test('곡선: 숲 구역은 빠지고, 첫 통과는 0, 결측 통과는 null, 날짜와 길이가 같다', () => {
  const e = evidence(zones, 'cheorwon');
  assert.ok(e.lines.every(l => !l.zoneId.endsWith('forest')));
  for (const l of e.lines) {
    assert.equal(l.values.length, e.dates.length);
    assert.equal(l.values[0], 0);
    assert.equal(l.values[3], null);           // 7/29 결측
  }
  assert.ok(e.caveats.includes('missing_pass') && e.caveats.includes('north_wording') && e.caveats.includes('forest_relative'));
});

test('placeOf: id 로 분계선 기준 위치를 정한다', () => {
  assert.equal(placeOf({ id: 'paju-dmz_farm' }), 'dmz');
  assert.equal(placeOf({ id: 'cheorwon-north' }), 'north');
  assert.equal(placeOf({ id: 'cheorwon-paddy' }), 'south');
});

test('없는 지역은 빈 결과', () => {
  const e = evidence(zones, 'nowhere');
  assert.deepEqual(e.lines, []);
  assert.deepEqual(e.dates, []);
});
