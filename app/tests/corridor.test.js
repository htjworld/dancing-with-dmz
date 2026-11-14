import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { pixelOf } from '../js/glow.js';

const read = file => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url)));
const corridor = read('corridor.json'), previous = read('glow.json');

test('연속 관측 띠: 기존 관측 날짜와 전체 영상 범위를 포함한다', () => {
  assert.deepEqual(corridor.dates, previous.dates);
  assert.equal(corridor.is_official_dmz_boundary, false);
  const [[west, south], [east, north]] = corridor.bounds;
  for (const r of Object.values(previous.regions)) for (const [lng, lat] of r.corners) {
    assert.ok(lng >= west && lng <= east && lat >= south && lat <= north);
    assert.ok(Object.values(corridor.regions).some(tile => pixelOf(tile.corners, tile.size, lng, lat, corridor.projection)));
  }
});

test('연속 관측 띠: 모든 표시 타일의 프레임과 수치 영상이 존재한다', () => {
  assert.equal(corridor.projection, 'EPSG:3857');
  assert.deepEqual(corridor.scale_db, [0, 1.5]);
  for (const [id, r] of Object.entries(corridor.regions)) {
    assert.equal(r.frames.length, corridor.dates.length - 1, id);
    assert.equal(r.color, r.frames.at(-1), id);
    assert.ok(r.size.every(n => n > 0 && n <= 1024), id);
    for (const file of [r.value, ...r.frames]) assert.ok(existsSync(new URL(`../data/${file}`, import.meta.url)), file);
  }
});

test('연속 관측 띠: 두 경계선과 동일 궤도 원본의 출처를 보존한다', () => {
  assert.equal(corridor.edges.features.length, 2);
  assert.deepEqual(corridor.edges.features.map(f => f.properties.side).sort(), ['north', 'south']);
  assert.ok(corridor.half_width_km >= 21.2);
  assert.equal(corridor.sources.length, corridor.dates.length);
  for (const source of corridor.sources) {
    assert.equal(source.granules.length, 2);
    for (const g of source.granules) {
      assert.ok(g.id.includes('_133_D_069_4005_DHDH_') || g.id.includes('_133_D_070_4005_DHDH_'));
      assert.ok(g.url.startsWith('https://nisar.asf.earthdatacloud.nasa.gov/'));
      assert.ok(!g.url.includes('?'));
    }
  }
});
