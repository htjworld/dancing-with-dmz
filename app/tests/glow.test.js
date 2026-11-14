import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { pixelOf, sampleDb, regionAt, frameAt } from '../js/glow.js';
import { noteFor, touch, REST_BELOW } from '../js/landsound.js';

const glow = JSON.parse(readFileSync(new URL('../data/glow.json', import.meta.url)));
const facts = JSON.parse(readFileSync(new URL('../data/facts.json', import.meta.url)));
const cw = glow.regions.cheorwon;

test('pixelOf: 모서리와 가운데, 영상 밖', () => {
  const [tl, tr, , bl] = cw.corners, [w, h] = cw.size;
  assert.deepEqual(pixelOf(cw.corners, cw.size, ...tl), [0, 0]);
  const c = [tl[0] + (tr[0] - tl[0]) / 2 + (bl[0] - tl[0]) / 2, tl[1] + (tr[1] - tl[1]) / 2 + (bl[1] - tl[1]) / 2];
  const [x, y] = pixelOf(cw.corners, cw.size, ...c);
  assert.ok(Math.abs(x - w / 2) <= 1 && Math.abs(y - h / 2) <= 1, `${x},${y}`);
  assert.equal(pixelOf(cw.corners, cw.size, tl[0] - 0.01, tl[1]), null);
  assert.equal(pixelOf(cw.corners, cw.size, ...tr), null);          // 오른쪽 끝은 영상 밖(반열린 구간)
});

test('regionAt: 철원 민통선 논 가운데는 철원', () => {
  const r = regionAt(glow, 127.225, 38.27);
  assert.equal(r.region, 'cheorwon');
  assert.equal(regionAt(glow, 0, 0), null);
});

test('pixelOf: Web Mercator 타일은 지도의 투영 좌표로 화소를 찾는다', () => {
  const corners = [[126, 39], [128, 39], [128, 37], [126, 37]], size = [1024, 1024];
  const y = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  const lat = (2 * Math.atan(Math.exp((y(39) + y(37)) / 2)) - Math.PI / 2) * 180 / Math.PI;
  const hit = regionAt({ projection: 'EPSG:3857', regions: { strip: { corners, size } } }, 127, lat);
  assert.equal(hit.region, 'strip');
  assert.ok(Math.abs(hit.x - 512) <= 1 && Math.abs(hit.y - 512) <= 1);
  assert.equal(pixelOf(corners, size, 128, lat, 'EPSG:3857'), null);
  assert.equal(pixelOf(corners, size, 127, 90, 'EPSG:3857'), null);
});

test('sampleDb: 0 -> lo, 255 -> hi, 알파 0 -> null, 범위 밖 -> null', () => {
  const img = { width: 2, height: 1, data: Uint8ClampedArray.from([0, 0, 0, 255, 255, 255, 255, 255]) };
  assert.equal(sampleDb(img, 0, 0, [0, 1.5]), 0);
  assert.equal(sampleDb(img, 1, 0, [0, 1.5]), 1.5);
  img.data[3] = 0;
  assert.equal(sampleDb(img, 0, 0, [0, 1.5]), null);
  assert.equal(sampleDb(img, 2, 0, [0, 1.5]), null);
});

test('frameAt: 처음 0, 끝 마지막 프레임', () => {
  assert.equal(frameAt(0, 10), 0);
  assert.equal(frameAt(0.999, 10), 9);
  assert.equal(frameAt(1, 10), 9);
});

test('glow.json: 계약대로 파일이 있고 프레임 수 = 통과 수 - 1', () => {
  assert.equal(glow.scale_db.length, 2);
  for (const [id, r] of Object.entries(glow.regions)) {
    assert.equal(r.corners.length, 4, id);
    assert.equal(r.frames.length, glow.dates.length - 1, id);
    for (const f of [r.value, r.color, ...r.frames]) assert.ok(existsSync(new URL(`../data/${f}`, import.meta.url)), f);
  }
});

test('noteFor: 고요한 땅은 쉼, 많이 변한 땅일수록 높은 음', () => {
  const sc = glow.scale_db;
  assert.equal(noteFor(null, sc), null);
  assert.equal(noteFor(sc[1] * (REST_BELOW - 0.01), sc), null);
  const lo = noteFor(sc[1] * 0.3, sc), hi = noteFor(sc[1], sc), over = noteFor(sc[1] * 3, sc);
  assert.ok(lo.freq < hi.freq && lo.gain < hi.gain);
  assert.deepEqual(over, hi);
});

test('noteFor: 화소 평균 수준에서 DMZ 안은 쉼, 철원 논은 소리', () => {
  // make_glow.py 가 출력한 구역 평균(표준편차): 철원 논 약 0.96 dB, DMZ 안 약 0.29 dB
  assert.equal(noteFor(0.29, glow.scale_db), null);
  assert.ok(noteFor(0.96, glow.scale_db));
  assert.ok(facts.cheorwon_paddy_db.value > facts.cheorwon_dmz_db.value);
});

test('touch: 같은 음은 0.15초 안에 다시 울리지 않고, 쉼은 null', () => {
  const sc = glow.scale_db;
  assert.ok(touch(sc[1], sc, 1000));
  assert.equal(touch(sc[1], sc, 1100), null);
  assert.ok(touch(sc[1], sc, 1200));
  assert.equal(touch(0, sc, 1300), null);
});
