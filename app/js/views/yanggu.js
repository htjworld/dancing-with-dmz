// 양구 펀치볼 · 한계: 지도의 레이더 영상을 누른 채 끌면, 손이 지나는 곳이 한 계절 동안 얼마나 변했는지가 막대와 소리로 나온다.
// 가장 많이 변한 곳을 찾으면 완료. 찾은 뒤에는 '어디가 변했는지'는 보이지만 '왜 변했는지'는 레이더만으로 알 수 없다는 것을 말한다.
// 변화 정도는 날짜별 영상(열한 장)을 겹쳐 직접 잰다: 10화소 묶음의 평균 밝기에서 한 계절의 최댓값과 최솟값의 차. dB 가 아니라 영상 밝기 기준이다.
import { state, set, data, zone, addKey } from '../state.js';
import { STOPS } from '../stops.js';
import { change } from '../calc.js';
import { missionReady, canTake, rangeOf, inside, meters } from '../missions.js';
import { pixelOf } from '../glow.js';
import { t, zoneName } from '../i18n.js';
import { blip } from '../sound.js';
import { foundCard } from './found.js';

const ID = 'yanggu', BASIN = 'yanggu-basin', FOREST = 'yanggu-dmz';
const BLOCK = 10;        // 화소를 이만큼씩 묶어 평균한다(레이더 영상의 알갱이 잡음을 줄인다)
const NEED = .88;        // 가장 많이 변한 곳의 이만큼 이상이면 찾은 것으로 본다
const STEP = 110;        // 자국을 남기는 간격(m)
const HINT_AFTER = 70;   // 이만큼 살펴보고도 못 찾으면 가까운 곳을 알려 주는 단추가 나온다
let grid = null, loading = false, lastBlip = 0;

// 날짜별 영상을 겹쳐 '변화 지도'를 만든다(한 번만)
async function build() {
  const L = data.layers.regions[ID], [W, H] = L.size, bw = Math.floor(W / BLOCK), bh = Math.floor(H / BLOCK), n = bw * bh;
  const lo = new Float32Array(n).fill(Infinity), hi = new Float32Array(n).fill(-Infinity), seen = new Uint8Array(n);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  for (const date of L.dates) {
    const img = new Image(); img.src = `data/layers/${ID}/${date}_hh.webp`;
    await img.decode();
    g.clearRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H);
    const d = g.getImageData(0, 0, W, H).data;
    for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
      let sum = 0, k = 0;
      for (let y = by * BLOCK; y < (by + 1) * BLOCK; y++) for (let x = bx * BLOCK; x < (bx + 1) * BLOCK; x++) { const i = (y * W + x) * 4; if (d[i + 3] > 200) { sum += d[i]; k++; } }
      if (k < BLOCK * BLOCK * .6) continue;   // 영상 밖이거나 가장자리
      const m = sum / k, j = by * bw + bx;
      if (m < lo[j]) lo[j] = m; if (m > hi[j]) hi[j] = m; seen[j]++;
    }
  }
  const raw = new Float32Array(n).fill(-1);
  for (let j = 0; j < n; j++) if (seen[j] === L.dates.length) raw[j] = hi[j] - lo[j];
  // 이웃 묶음과 평균해 한 점만 튀는 값을 누른다
  const val = new Float32Array(n).fill(-1); let top = 0, at = 0;
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const j = by * bw + bx; if (raw[j] < 0) continue;
    let sum = 0, k = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = bx + dx, y = by + dy; if (x < 0 || y < 0 || x >= bw || y >= bh) continue; const v = raw[y * bw + x]; if (v >= 0) { sum += v; k++; } }
    val[j] = sum / k; if (val[j] > top) { top = val[j]; at = j; }
  }
  // 조용한 곳(아래 10%)을 0, 가장 많이 변한 곳을 1 로 맞춘다. 막대가 늘 절반쯤 차 있지 않게 한다
  const sorted = Array.from(val).filter(x => x >= 0).sort((a, b) => a - b), floor = sorted[Math.floor(sorted.length * .1)] || 0;
  for (let j = 0; j < n; j++) if (val[j] >= 0) val[j] = Math.max(0, (val[j] - floor) / ((top - floor) || 1));
  // 가장 많이 변한 묶음의 가운데(경위도)
  const [[x0, y0], [x1, y1], , [x3, y3]] = L.corners, u = ((at % bw) + .5) * BLOCK / W, v = (Math.floor(at / bw) + .5) * BLOCK / H;
  grid = { bw, bh, val, hot: [x0 + u * (x1 - x0) + v * (x3 - x0), y0 + u * (y1 - y0) + v * (y3 - y0)] };
}
function ensure() {
  if (grid || loading) return;
  loading = true;
  build().catch(() => { grid = null; }).finally(() => { loading = false; set({}); });   // 다 만들면 창을 다시 그린다
}
// 그 자리의 변화 정도(0~1). 영상 밖이면 null
function sample(lng, lat) {
  const L = data.layers.regions[ID], p = grid && pixelOf(L.corners, L.size, lng, lat);
  if (!p) return null;
  const bx = Math.min(grid.bw - 1, Math.floor(p[0] / BLOCK)), by = Math.min(grid.bh - 1, Math.floor(p[1] / BLOCK)), v = grid.val[by * grid.bw + bx];
  return v < 0 ? null : v;
}

// 지도 위에서 손이 지나간 자리(screens/gamemap.js 가 알려 준다)
function probe({ lng, lat, phase }) {
  if (state.stop !== ID || state.screen !== 'mission' || missionReady(ID, state.seen[ID]) || phase === 'end' || !grid) return;
  const v = sample(lng, lat);
  if (v == null) return set({ probe: null });
  const now = performance.now();
  if (now - lastBlip > 120) { lastBlip = now; blip(196 * 2 ** (v * 2), .14, .16); }   // 많이 변한 곳일수록 음이 높다
  const tr = state.probeTrail, last = tr[tr.length - 1];
  const trail = !last || meters(last[0], last[1], lng, lat) >= STEP ? [...tr.slice(-600), [lng, lat, +v.toFixed(2)]] : tr;
  if (v >= NEED) {   // 찾았다
    const z = data.zones.find(x => x.region === ID && inside(x.bounds, lng, lat));
    blip(784, .2, .4);
    return set({ probe: [lng, lat, v], probeTrail: trail, hot: [lng, lat], quizPick: z?.id ?? null, hotHint: false, seen: addKey(ID, 'picked') });
  }
  set({ probe: [lng, lat, v], probeTrail: trail });
}

const series = id => data.passes.map(p => change(zone(id), p.cycle));
function result() {
  const basin = rangeOf(series(BASIN)), forest = rangeOf(series(FOREST)), close = Math.abs(basin - forest) < .5;
  const z = zone(state.quizPick);
  return foundCard({
    head: t('yanggu.foundHead'),
    rows: [{ name: t('yanggu.rowBasin'), value: basin }, { name: t('yanggu.rowForest'), value: forest, cls: 'calm' }],
    caption: t('common.foundSwing'),
    body: [t('yanggu.foundLimit'), z ? t('yanggu.spotZone', { name: zoneName(z) }) : t('yanggu.spotOut'), !close ? '' : t(z?.id === BASIN ? 'yanggu.foundAvg' : 'yanggu.foundClose')],
    more: [t('yanggu.foundMethod'), t('yanggu.foundFine')],
  });
}

export function render() {
  const ready = missionReady(ID, state.seen[ID]), got = state.fragments.includes(ID), allowed = canTake(ID, state.fragments, STOPS.map(s => s.id));
  if (!ready) ensure();
  const v = ready ? 1 : state.probe?.[2] ?? 0, pct = Math.round(v * 100);
  return `${ready ? '' : `
    <div class="meter heat" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${t('yanggu.meterAria')}"><i style="width:${pct}%"></i></div>
    <p class="today">${!grid ? t('yanggu.loading') : state.probe ? t('yanggu.meter', { pct }) : t('yanggu.meterIdle')}</p>
    <p class="hint">${t('yanggu.hint')}</p>
    ${state.probeTrail.length >= HINT_AFTER && !state.hotHint ? `<button type="button" class="ghost" data-act="hint">${t('yanggu.hintBtn')}</button>` : ''}`}
    ${ready ? result() : ''}
    ${ready && !got ? (allowed ? `<button type="button" class="primary" data-act="take">${t('yanggu.take')}</button>`
      : `<p class="note no">${t('common.needPrev')}</p>`) : ''}
    ${got ? `<p class="note ok">${t('yanggu.got')}</p>
      ${state.fragments.length === STOPS.length ? `<button type="button" class="primary" data-act="finale">${t(state.finaleDone ? 'finale.again' : 'finale.go')}</button>` : ''}` : ''}`;
}

export function bind() {
  document.addEventListener('dmz-map-trace', e => probe(e.detail));
}

// 지도에 그릴 것(screens/gamemap.js 가 읽는다): 가장 많이 변한 곳의 자리
export const hotSpot = () => grid?.hot ?? null;

export function act(name) {
  if (name === 'hint') set({ hotHint: true });
  else if (name === 'take' && missionReady(ID, state.seen[ID]) && canTake(ID, state.fragments, STOPS.map(s => s.id))) set({ fragments: [...state.fragments, ID] });
  else if (name === 'finale') document.dispatchEvent(new Event('dmz-finale'));   // main.js 가 듣고 피날레를 시작한다
}
